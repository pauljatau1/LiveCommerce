/**
 * Update Categories Controller Tests
 *
 * This test suite provides comprehensive testing for the updateCategories controller.
 * It ensures all HTTP request scenarios are properly handled and responses
 * are correctly formatted.
 *
 * Test Coverage:
 * - Valid category update requests
 * - Authentication validation
 * - Input validation
 * - Error handling
 * - Response formatting
 * - Service integration
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const { app } = require('@/app');
const updateCategoriesService = require('@modules/seller/services/updateCategories.service');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the service
jest.mock('@modules/seller/services/updateCategories.service');

describe('Update Categories Controller', () => {
  let mongoServer;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Close database connection and stop server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create auth token
  const createAuthToken = () => {
    return jwt.sign(
      { id: '507f1f77bcf86cd799439011' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  };

  describe('PUT /api/v2/sellers/update-categories', () => {
    it('should update categories successfully', async () => {
      // Arrange
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];

      const mockResponse = {
        message: 'Categories updated successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          storeName: 'John\'s Store',
          categories: [
            {
              name: 'Electronics',
              subCategories: [{ name: 'Smartphones' }]
            }
          ]
        }
      };

      updateCategoriesService.updateCategories = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/update-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories })
        .expect(200);

      // Assert
      expect(updateCategoriesService.updateCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', categories);
      expect(response.body).toEqual({
        success: true,
        message: 'Categories updated successfully',
        data: mockResponse,
        pagination: null
      });
    });

    it('should handle validation error', async () => {
      // Arrange
      const invalidCategories = [];

      updateCategoriesService.updateCategories = jest.fn().mockRejectedValue(
        new ValidationError([{ field: 'categories', message: 'Categories array cannot be empty' }])
      );

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/update-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories: invalidCategories })
        .expect(422);

      // Assert
      expect(updateCategoriesService.updateCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', invalidCategories);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'categories', message: 'Categories array cannot be empty' }]
      });
    });

    it('should handle validation error for invalid category structure', async () => {
      // Arrange
      const invalidCategories = [
        {
          // Missing id
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];
      
      updateCategoriesService.updateCategories = jest.fn().mockRejectedValue(
        new ValidationError([{ field: 'categories[0].id', message: 'Category ID is required' }])
      );

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/update-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories: invalidCategories })
        .expect(422);

      // Assert
      expect(updateCategoriesService.updateCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', invalidCategories);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'categories[0].id', message: 'Category ID is required' }]
      });
    });

    it('should handle validation error for invalid ObjectId format', async () => {
      // Arrange
      const invalidCategories = [
        {
          id: 'invalid-object-id',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];
      
      updateCategoriesService.updateCategories = jest.fn().mockRejectedValue(
        new ValidationError([{ field: 'categories[0].id', message: 'Category ID must be a valid MongoDB ObjectId' }])
      );

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/update-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories: invalidCategories })
        .expect(422);

      // Assert
      expect(updateCategoriesService.updateCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', invalidCategories);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'categories[0].id', message: 'Category ID must be a valid MongoDB ObjectId' }]
      });
    });

    it('should handle multiple validation errors', async () => {
      // Arrange
      const invalidCategories = [
        {
          // Missing id and name
          subCategories: [{ name: 'Smartphones' }]
        },
        {
          id: 'invalid-id',
          name: 'Clothing',
          subCategories: [{}] // Missing subCategory name
        }
      ];
      
      updateCategoriesService.updateCategories = jest.fn().mockRejectedValue(
        new ValidationError([
          { field: 'categories[0].id', message: 'Category ID is required' },
          { field: 'categories[0].name', message: 'Category name is required' },
          { field: 'categories[1].id', message: 'Category ID must be a valid MongoDB ObjectId' },
          { field: 'categories[1].subCategories[0].name', message: 'SubCategory name is required' }
        ])
      );

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/update-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories: invalidCategories })
        .expect(422);

      // Assert
      expect(updateCategoriesService.updateCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', invalidCategories);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'categories[0].id', message: 'Category ID is required' },
          { field: 'categories[0].name', message: 'Category name is required' },
          { field: 'categories[1].id', message: 'Category ID must be a valid MongoDB ObjectId' },
          { field: 'categories[1].subCategories[0].name', message: 'SubCategory name is required' }
        ]
      });
    });

    it('should handle seller not found error', async () => {
      // Arrange
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];
      
      updateCategoriesService.updateCategories = jest.fn().mockRejectedValue(
        new NotFoundException('Seller not found')
      );

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/update-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories })
        .expect(404);

      // Assert
      expect(updateCategoriesService.updateCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', categories);
      expect(response.body).toEqual({
        success: false,
        message: 'Seller not found'
      });
    });

    it('should handle service layer error', async () => {
      // Arrange
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];
      
      updateCategoriesService.updateCategories = jest.fn().mockRejectedValue(
        new Error('Something went wrong!')
      );

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/update-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories })
        .expect(500);

      // Assert
      expect(updateCategoriesService.updateCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', categories);
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should handle request with null body', async () => {
      // Arrange
      updateCategoriesService.updateCategories = jest.fn().mockRejectedValue(
        new ValidationError([{ field: 'categories', message: 'Categories are required' }])
      );

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/update-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send(null)
        .expect(422);

      // Assert
      expect(updateCategoriesService.updateCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', undefined);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'categories', message: 'Categories are required' }]
      });
    });

    it('should handle request without categories', async () => {
      // Arrange
      updateCategoriesService.updateCategories = jest.fn().mockRejectedValue(
        new ValidationError([{ field: 'categories', message: 'Categories are required' }])
      );

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/update-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({})
        .expect(422);

      // Assert
      expect(updateCategoriesService.updateCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', undefined);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'categories', message: 'Categories are required' }]
      });
    });

    it('should handle unauthorized request', async () => {
      // Arrange
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/update-categories')
        .send({ categories })
        .expect(401);

      // Assert
      expect(updateCategoriesService.updateCategories).not.toHaveBeenCalled();
      expect(response.body).toEqual({
        success: false,
        message: 'No token provided'
      });
    });

    it('should handle invalid token', async () => {
      // Arrange
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/update-categories')
        .set('Authorization', 'Bearer invalid-token')
        .send({ categories })
        .expect(401);

      // Assert
      expect(updateCategoriesService.updateCategories).not.toHaveBeenCalled();
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid token'
      });
    });

    it('should handle multiple categories update', async () => {
      // Arrange
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            { name: 'Laptops' }
          ]
        },
        {
          id: '507f1f77bcf86cd799439012',
          name: 'Clothing',
          subCategories: [
            { name: 'Men\'s Clothing' },
            { name: 'Women\'s Clothing' }
          ]
        }
      ];

      const mockResponse = {
        message: 'Categories updated successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          storeName: 'John\'s Store',
          categories: [
            {
              name: 'Electronics',
              subCategories: [
                { name: 'Smartphones' },
                { name: 'Laptops' }
              ]
            },
            {
              name: 'Clothing',
              subCategories: [
                { name: 'Men\'s Clothing' },
                { name: 'Women\'s Clothing' }
              ]
            }
          ]
        }
      };

      updateCategoriesService.updateCategories = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/update-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories })
        .expect(200);

      // Assert
      expect(updateCategoriesService.updateCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', categories);
      expect(response.body).toEqual({
        success: true,
        message: 'Categories updated successfully',
        data: mockResponse,
        pagination: null
      });
    });
  });
});
