const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Import the Buyer model
const Buyer = require('@models/Buyer');

// Mock the updateSelectedCategories service
jest.mock('@modules/buyer/services/updateSelectedCategories.service', () => ({
  updateSelectedCategories: jest.fn()
}));

// Import the mocked service
const updateSelectedCategoriesService = require('@modules/buyer/services/updateSelectedCategories.service');
const jwt = require('jsonwebtoken');

// Mock Firebase
jest.mock('@firebase', () => ({
  saveToken: jest.fn(),
  getToken: jest.fn(),
}));

// Mock JWT verification
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

let mongoServer;

describe('Buyer Controller - Selected Categories', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB with compatible version
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3' // Use a version compatible with Debian 12
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock JWT verification to return a valid user
    jwt.verify.mockReturnValue({ id: '507f1f77bcf86cd799439011', role: 'Buyer' });
    
    // Clear database
    await Buyer.deleteMany({});
  });

  describe('updateSelectedCategories', () => {
    it('should call updateSelectedCategories service and return success response', async () => {
      // Arrange
      const mockReq = {
        user: { id: '507f1f77bcf86cd799439011' },
        body: {
          selectedCategories: [
            {
              name: 'Electronics',
              subCategories: [
                { name: 'Smartphones' },
                { name: 'Laptops' }
              ]
            },
            {
              name: 'Fashion',
              subCategories: [
                { name: 'Men\'s Clothing' },
                { name: 'Women\'s Clothing' }
              ]
            }
          ]
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [
              { name: 'Smartphones' },
              { name: 'Laptops' }
            ]
          },
          {
            name: 'Fashion',
            subCategories: [
              { name: 'Men\'s Clothing' },
              { name: 'Women\'s Clothing' }
            ]
          }
        ]
      };

      updateSelectedCategoriesService.updateSelectedCategories.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.updateSelectedCategories(mockReq, mockRes, mockNext);

      // Assert
      expect(updateSelectedCategoriesService.updateSelectedCategories).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.body.selectedCategories
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Selected categories updated successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // Arrange
      const mockReq = {
        user: { id: '507f1f77bcf86cd799439011' },
        body: {
          selectedCategories: [
            {
              name: 'Electronics',
              subCategories: [
                { name: 'Smartphones' }
              ]
            }
          ]
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();
      const mockError = new Error('Service error');

      updateSelectedCategoriesService.updateSelectedCategories.mockRejectedValue(mockError);

      // Act
      await buyerController.updateSelectedCategories(mockReq, mockRes, mockNext);

      // Assert
      expect(updateSelectedCategoriesService.updateSelectedCategories).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.body.selectedCategories
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle missing user ID', async () => {
      // Arrange
      const mockReq = {
        user: {},
        body: {
          selectedCategories: [
            {
              name: 'Electronics',
              subCategories: [
                { name: 'Smartphones' }
              ]
            }
          ]
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();
      const mockError = new Error('User ID is required');

      updateSelectedCategoriesService.updateSelectedCategories.mockRejectedValue(mockError);

      // Act
      await buyerController.updateSelectedCategories(mockReq, mockRes, mockNext);

      // Assert
      expect(updateSelectedCategoriesService.updateSelectedCategories).toHaveBeenCalledWith(
        undefined,
        mockReq.body.selectedCategories
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle null user', async () => {
      // Arrange
      const mockReq = {
        user: null,
        body: {
          selectedCategories: [
            {
              name: 'Electronics',
              subCategories: [
                { name: 'Smartphones' }
              ]
            }
          ]
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      // Act
      await buyerController.updateSelectedCategories(mockReq, mockRes, mockNext);

      // Assert
      expect(updateSelectedCategoriesService.updateSelectedCategories).not.toHaveBeenCalled();
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle missing selectedCategories in request body', async () => {
      // Arrange
      const mockReq = {
        user: { id: '507f1f77bcf86cd799439011' },
        body: {}
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();
      const mockError = new Error('selectedCategories is required');

      updateSelectedCategoriesService.updateSelectedCategories.mockRejectedValue(mockError);

      // Act
      await buyerController.updateSelectedCategories(mockReq, mockRes, mockNext);

      // Assert
      expect(updateSelectedCategoriesService.updateSelectedCategories).toHaveBeenCalledWith(
        mockReq.user.id,
        undefined
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle null selectedCategories', async () => {
      // Arrange
      const mockReq = {
        user: { id: '507f1f77bcf86cd799439011' },
        body: {
          selectedCategories: null
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();
      const mockError = new Error('selectedCategories must be an array');

      updateSelectedCategoriesService.updateSelectedCategories.mockRejectedValue(mockError);

      // Act
      await buyerController.updateSelectedCategories(mockReq, mockRes, mockNext);

      // Assert
      expect(updateSelectedCategoriesService.updateSelectedCategories).toHaveBeenCalledWith(
        mockReq.user.id,
        null
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle undefined request body', async () => {
      // Arrange
      const mockReq = {
        user: { id: '507f1f77bcf86cd799439011' }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      // Act
      await buyerController.updateSelectedCategories(mockReq, mockRes, mockNext);

      // Assert
      expect(updateSelectedCategoriesService.updateSelectedCategories).not.toHaveBeenCalled();
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Integration Tests - PUT /api/v2/buyers/selected-categories', () => {
    it('should update selected categories successfully via HTTP', async () => {
      // Arrange
      const mockServiceResponse = {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [
              { name: 'Smartphones' },
              { name: 'Laptops' }
            ]
          },
          {
            name: 'Fashion',
            subCategories: [
              { name: 'Men\'s Clothing' },
              { name: 'Women\'s Clothing' }
            ]
          }
        ]
      };

      updateSelectedCategoriesService.updateSelectedCategories.mockResolvedValue(mockServiceResponse);

      const selectedCategoriesData = {
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [
              { name: 'Smartphones' },
              { name: 'Laptops' }
            ]
          },
          {
            name: 'Fashion',
            subCategories: [
              { name: 'Men\'s Clothing' },
              { name: 'Women\'s Clothing' }
            ]
          }
        ]
      };

      // Act
      const response = await request(app)
        .put('/api/v2/buyers/selected-categories')
        .set('Authorization', 'Bearer valid-token')
        .send(selectedCategoriesData)
        .expect(200);

      // Assert
      expect(updateSelectedCategoriesService.updateSelectedCategories).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        selectedCategoriesData.selectedCategories
      );
              expect(response.body).toEqual({
          success: true,
          data: mockServiceResponse,
          message: 'Selected categories updated successfully',
          pagination: null
        });
    });

    it('should return 500 for service error via HTTP', async () => {
      // Arrange
      const mockError = new Error('Service error');
      updateSelectedCategoriesService.updateSelectedCategories.mockRejectedValue(mockError);

      const selectedCategoriesData = {
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [
              { name: 'Smartphones' }
            ]
          }
        ]
      };

      // Act & Assert
      await request(app)
        .put('/api/v2/buyers/selected-categories')
        .set('Authorization', 'Bearer valid-token')
        .send(selectedCategoriesData)
        .expect(500);
    });

    it('should return 401 for missing authentication token', async () => {
      // Arrange
      const selectedCategoriesData = {
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [
              { name: 'Smartphones' }
            ]
          }
        ]
      };

      // Act & Assert
      await request(app)
        .put('/api/v2/buyers/selected-categories')
        .send(selectedCategoriesData)
        .expect(401);
    });

    it('should return 401 for invalid authentication token', async () => {
      // Arrange
      const selectedCategoriesData = {
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [
              { name: 'Smartphones' }
            ]
          }
        ]
      };

      // Mock JWT verification to throw error
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await request(app)
        .put('/api/v2/buyers/selected-categories')
        .set('Authorization', 'Bearer invalid-token')
        .send(selectedCategoriesData)
        .expect(401);
    });

    it('should return 400 for missing request body', async () => {
      // Act & Assert
      await request(app)
        .put('/api/v2/buyers/selected-categories')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });

    it('should return 400 for invalid JSON in request body', async () => {
      // Act & Assert
      await request(app)
        .put('/api/v2/buyers/selected-categories')
        .set('Authorization', 'Bearer valid-token')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should return 422 for missing selectedCategories field', async () => {
      // Arrange
      const invalidData = {
        // Missing selectedCategories field
        someOtherField: 'value'
      };

      // Mock the service to throw ValidationError
      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'selectedCategories', message: 'selectedCategories is required' }
      ]);
      updateSelectedCategoriesService.updateSelectedCategories.mockRejectedValue(validationError);

      // Act & Assert
      await request(app)
        .put('/api/v2/buyers/selected-categories')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(422);
    });

    it('should return 422 for null selectedCategories', async () => {
      // Arrange
      const invalidData = {
        selectedCategories: null
      };

      // Mock the service to throw ValidationError
      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'selectedCategories', message: 'selectedCategories is required' }
      ]);
      updateSelectedCategoriesService.updateSelectedCategories.mockRejectedValue(validationError);

      // Act & Assert
      await request(app)
        .put('/api/v2/buyers/selected-categories')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(422);
    });

    it('should return 422 for non-array selectedCategories', async () => {
      // Arrange
      const invalidData = {
        selectedCategories: 'not-an-array'
      };

      // Mock the service to throw ValidationError
      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'selectedCategories', message: 'selectedCategories must be an array' }
      ]);
      updateSelectedCategoriesService.updateSelectedCategories.mockRejectedValue(validationError);

      // Act & Assert
      await request(app)
        .put('/api/v2/buyers/selected-categories')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(422);
    });

    it('should return 422 for categories without required fields', async () => {
      // Arrange
      const invalidData = {
        selectedCategories: [
          {
            // Missing name field
            subCategories: [
              { name: 'Smartphones' }
            ]
          }
        ]
      };

      // Mock the service to throw ValidationError
      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'selectedCategories[0].name', message: 'Category name is required and must be a string' }
      ]);
      updateSelectedCategoriesService.updateSelectedCategories.mockRejectedValue(validationError);

      // Act & Assert
      await request(app)
        .put('/api/v2/buyers/selected-categories')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(422);
    });

    it('should return 422 for subcategories without required fields', async () => {
      // Arrange
      const invalidData = {
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [
              {
                // Missing name field
                description: 'Smartphones'
              }
            ]
          }
        ]
      };

      // Mock the service to throw ValidationError
      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'selectedCategories[0].subCategories[0].name', message: 'Subcategory name is required and must be a string' }
      ]);
      updateSelectedCategoriesService.updateSelectedCategories.mockRejectedValue(validationError);

      // Act & Assert
      await request(app)
        .put('/api/v2/buyers/selected-categories')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(422);
    });
  });
}); 