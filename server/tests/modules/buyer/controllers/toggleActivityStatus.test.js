// Controller-only fixtures use no accounts; real session revocation is covered separately.
jest.mock('@/services/auth/sessions', () => ({assertSession: jest.fn().mockResolvedValue(true)}));
const request = require('supertest');
const { app } = require('@/app');
const toggleActivityStatusService = require('@modules/buyer/services/toggleActivityStatus.service');
const getActivityStatusService = require('@modules/buyer/services/getActivityStatus.service');

// Mock the services
jest.mock('@modules/buyer/services/toggleActivityStatus.service');
jest.mock('@modules/buyer/services/getActivityStatus.service');

describe('POST /api/v2/buyers/toggle-activity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post('/api/v2/buyers/toggle-activity')
        .expect(401);

      expect(response.body.message).toBe('No token provided');
    });

    it('should return 401 when invalid token is provided', async () => {
      const response = await request(app)
        .post('/api/v2/buyers/toggle-activity')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Invalid token');
    });
  });

  describe('Successful requests', () => {
    it('should toggle activity status from true to false', async () => {
      const mockResponse = {
        isActive: false,
        message: 'Account successfully deactivated'
      };

      toggleActivityStatusService.toggleActivityStatus.mockResolvedValue(mockResponse);

      // Generate a valid token for testing
      const token = generateToken('507f1f77bcf86cd799439011');

      const response = await request(app)
        .post('/api/v2/buyers/toggle-activity')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Account successfully deactivated');
      expect(response.body.data).toEqual(mockResponse);
      expect(toggleActivityStatusService.toggleActivityStatus).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should toggle activity status from false to true', async () => {
      const mockResponse = {
        isActive: true,
        message: 'Account successfully activated'
      };

      toggleActivityStatusService.toggleActivityStatus.mockResolvedValue(mockResponse);

      // Generate a valid token for testing
      const token = generateToken('507f1f77bcf86cd799439011');

      const response = await request(app)
        .post('/api/v2/buyers/toggle-activity')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Account successfully activated');
      expect(response.body.data).toEqual(mockResponse);
      expect(toggleActivityStatusService.toggleActivityStatus).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('Error handling', () => {
    it('should return 404 when buyer is not found', async () => {
      toggleActivityStatusService.toggleActivityStatus.mockRejectedValue(
        new (require('@utils/errors/NotFoundException'))('Buyer not found')
      );

      const token = generateToken('507f1f77bcf86cd799439011');

      const response = await request(app)
        .post('/api/v2/buyers/toggle-activity')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Buyer not found');
    });

    it('should return 422 for validation error', async () => {
      const validationError = new (require('@utils/errors/ValidationError'))([
        { field: 'buyerId', message: 'Invalid buyer ID format' }
      ]);
      toggleActivityStatusService.toggleActivityStatus.mockRejectedValue(validationError);

      const token = generateToken('invalid-id');

      const response = await request(app)
        .post('/api/v2/buyers/toggle-activity')
        .set('Authorization', `Bearer ${token}`)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0]).toEqual({
        field: 'buyerId',
        message: 'Invalid buyer ID format'
      });
    });

    it('should return 500 for internal server error', async () => {
      toggleActivityStatusService.toggleActivityStatus.mockRejectedValue(new Error('Database error'));

      const token = generateToken('507f1f77bcf86cd799439011');

      const response = await request(app)
        .post('/api/v2/buyers/toggle-activity')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(response.body.error).toBe('Something went wrong!');
    });
  });
});

describe('GET /api/v2/buyers/activity-status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/v2/buyers/activity-status')
        .expect(401);

      expect(response.body.message).toBe('No token provided');
    });

    it('should return 401 when invalid token is provided', async () => {
      const response = await request(app)
        .get('/api/v2/buyers/activity-status')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Invalid token');
    });
  });

  describe('Successful requests', () => {
    it('should return activity status for active buyer', async () => {
      const mockResponse = {
        isActive: true
      };

      getActivityStatusService.getActivityStatus.mockResolvedValue(mockResponse);

      const token = generateToken('507f1f77bcf86cd799439011');

      const response = await request(app)
        .get('/api/v2/buyers/activity-status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Activity status retrieved successfully');
      expect(response.body.data).toEqual(mockResponse);
      expect(getActivityStatusService.getActivityStatus).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should return activity status for inactive buyer', async () => {
      const mockResponse = {
        isActive: false
      };

      getActivityStatusService.getActivityStatus.mockResolvedValue(mockResponse);

      const token = generateToken('507f1f77bcf86cd799439011');

      const response = await request(app)
        .get('/api/v2/buyers/activity-status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Activity status retrieved successfully');
      expect(response.body.data).toEqual(mockResponse);
      expect(getActivityStatusService.getActivityStatus).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('Error handling', () => {
    it('should return 404 when buyer is not found', async () => {
      getActivityStatusService.getActivityStatus.mockRejectedValue(
        new (require('@utils/errors/NotFoundException'))('Buyer not found')
      );

      const token = generateToken('507f1f77bcf86cd799439011');

      const response = await request(app)
        .get('/api/v2/buyers/activity-status')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Buyer not found');
    });

    it('should return 422 for validation error', async () => {
      const validationError = new (require('@utils/errors/ValidationError'))([
        { field: 'buyerId', message: 'Invalid buyer ID format' }
      ]);
      getActivityStatusService.getActivityStatus.mockRejectedValue(validationError);

      const token = generateToken('invalid-id');

      const response = await request(app)
        .get('/api/v2/buyers/activity-status')
        .set('Authorization', `Bearer ${token}`)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0]).toEqual({
        field: 'buyerId',
        message: 'Invalid buyer ID format'
      });
    });

    it('should return 500 for internal server error', async () => {
      getActivityStatusService.getActivityStatus.mockRejectedValue(new Error('Database error'));

      const token = generateToken('507f1f77bcf86cd799439011');

      const response = await request(app)
        .get('/api/v2/buyers/activity-status')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(response.body.error).toBe('Something went wrong!');
    });
  });
});

// Helper function to generate a valid JWT token for testing
function generateToken(userId) {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: userId, role: 'Buyer' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
}
