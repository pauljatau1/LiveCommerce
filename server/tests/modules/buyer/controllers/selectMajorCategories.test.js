// Controller-only fixtures use no accounts; real session revocation is covered separately.
jest.mock('@/services/auth/sessions', () => ({assertSession: jest.fn().mockResolvedValue(true)}));
const request = require('supertest');
const { app } = require('@/app');
const selectMajorCategoriesService = require('@modules/buyer/services/selectMajorCategories.service');
const { ObjectId } = require('mongodb');

// Mock the service
jest.mock('@modules/buyer/services/selectMajorCategories.service');

describe('selectMajorCategories.controller', () => {
  const majorCategoryIds = [new ObjectId().toString(), new ObjectId().toString()];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/v2/buyers/select-major-categories', () => {
    it('should successfully select major categories', async () => {
      // Mock service response
      const mockResponse = {
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [{ name: 'Smartphones' }]
          },
          {
            name: 'Clothing',
            subCategories: [{ name: 'T-Shirts' }]
          }
        ],
        addedCategories: [
          {
            name: 'Electronics',
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };

      selectMajorCategoriesService.selectMajorCategories.mockResolvedValue(mockResponse);

      // Generate a valid token for testing
      const token = generateToken('507f1f77bcf86cd799439011');

      // Make request
      const response = await request(app)
        .post('/api/v2/buyers/select-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ majorCategoryIds })
        .expect(200);

      // Verify service was called with correct parameters
      expect(selectMajorCategoriesService.selectMajorCategories).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        majorCategoryIds
      );

      // Verify response structure
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Major categories selected successfully');
      expect(response.body.data).toEqual(mockResponse);
    });

    it('should return 401 when no token is provided', async () => {
      await request(app)
        .post('/api/v2/buyers/select-major-categories')
        .send({ majorCategoryIds })
        .expect(401);
    });

    it('should return 401 when invalid token is provided', async () => {
      await request(app)
        .post('/api/v2/buyers/select-major-categories')
        .set('Authorization', 'Bearer invalid-token')
        .send({ majorCategoryIds })
        .expect(401);
    });

    it('should return 422 when majorCategoryIds is missing', async () => {
      const validationError = new (require('@utils/errors/ValidationError'))([
        { field: 'majorCategoryIds', message: 'majorCategoryIds array is required' }
      ]);
      selectMajorCategoriesService.selectMajorCategories.mockRejectedValue(validationError);

      const token = generateToken('507f1f77bcf86cd799439011');
      const response = await request(app)
        .post('/api/v2/buyers/select-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 422 when majorCategoryIds is null', async () => {
      const validationError = new (require('@utils/errors/ValidationError'))([
        { field: 'majorCategoryIds', message: 'majorCategoryIds array is required' }
      ]);
      selectMajorCategoriesService.selectMajorCategories.mockRejectedValue(validationError);

      const token = generateToken('507f1f77bcf86cd799439011');
      const response = await request(app)
        .post('/api/v2/buyers/select-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ majorCategoryIds: null })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 422 when majorCategoryIds is not an array', async () => {
      const validationError = new (require('@utils/errors/ValidationError'))([
        { field: 'majorCategoryIds', message: 'majorCategoryIds must be an array' }
      ]);
      selectMajorCategoriesService.selectMajorCategories.mockRejectedValue(validationError);

      const token = generateToken('507f1f77bcf86cd799439011');
      const response = await request(app)
        .post('/api/v2/buyers/select-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ majorCategoryIds: 'not an array' })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 422 when majorCategoryIds array is empty', async () => {
      const validationError = new (require('@utils/errors/ValidationError'))([
        { field: 'majorCategoryIds', message: 'majorCategoryIds array cannot be empty' }
      ]);
      selectMajorCategoriesService.selectMajorCategories.mockRejectedValue(validationError);

      const token = generateToken('507f1f77bcf86cd799439011');
      const response = await request(app)
        .post('/api/v2/buyers/select-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ majorCategoryIds: [] })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 422 when majorCategoryIds contains invalid ObjectIds', async () => {
      const validationError = new (require('@utils/errors/ValidationError'))([
        { field: 'majorCategoryIds', message: 'majorCategoryIds[0] must be a valid ObjectId' }
      ]);
      selectMajorCategoriesService.selectMajorCategories.mockRejectedValue(validationError);

      const token = generateToken('507f1f77bcf86cd799439011');
      const response = await request(app)
        .post('/api/v2/buyers/select-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ majorCategoryIds: ['invalid-id'] })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 404 when buyer is not found', async () => {
      // Mock service to throw NotFoundException
      selectMajorCategoriesService.selectMajorCategories.mockRejectedValue(
        new (require('@utils/errors/NotFoundException'))('Buyer not found')
      );

      const token = generateToken('507f1f77bcf86cd799439011');

      await request(app)
        .post('/api/v2/buyers/select-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ majorCategoryIds })
        .expect(404);
    });

    it('should return 404 when no active major categories found', async () => {
      // Mock service to throw NotFoundException
      selectMajorCategoriesService.selectMajorCategories.mockRejectedValue(
        new (require('@utils/errors/NotFoundException'))('No active major categories found with the provided IDs')
      );

      const token = generateToken('507f1f77bcf86cd799439011');

      await request(app)
        .post('/api/v2/buyers/select-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ majorCategoryIds })
        .expect(404);
    });

    it('should handle mixed valid and invalid ObjectIds', async () => {
      const validationError = new (require('@utils/errors/ValidationError'))([
        { field: 'majorCategoryIds', message: 'majorCategoryIds[1] must be a valid ObjectId' }
      ]);
      selectMajorCategoriesService.selectMajorCategories.mockRejectedValue(validationError);

      const token = generateToken('507f1f77bcf86cd799439011');
      const response = await request(app)
        .post('/api/v2/buyers/select-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ majorCategoryIds: [new ObjectId().toString(), 'invalid-id'] })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should handle array with non-string values', async () => {
      const validationError = new (require('@utils/errors/ValidationError'))([
        { field: 'majorCategoryIds', message: 'majorCategoryIds[0] must be a string' }
      ]);
      selectMajorCategoriesService.selectMajorCategories.mockRejectedValue(validationError);

      const token = generateToken('507f1f77bcf86cd799439011');
      const response = await request(app)
        .post('/api/v2/buyers/select-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ majorCategoryIds: [123, new ObjectId().toString()] })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });
});

// Helper function to generate a valid JWT token for testing
function generateToken(userId) {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: userId, role: 'Buyer' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
}
