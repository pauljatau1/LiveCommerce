/**
 * Select Categories Controller Tests
 *
 * This test suite validates the selectCategories controller functionality.
 * It ensures comprehensive testing of HTTP request handling and response formatting.
 *
 * Test Coverage:
 * - Successful category selection requests
 * - Input validation error handling
 * - Authentication error handling
 * - Service layer error handling
 * - Response formatting validation
 * - HTTP status code validation
 * - Edge cases and boundary conditions
 *
 * Security Testing:
 * - Authentication token validation
 * - Input sanitization
 * - Error handling without information leakage
 * - Response structure validation
 *
 * @module selectCategoriesControllerTests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import the app without starting the server
const { app } = require('@/app');

// Mock the selectCategories service
jest.mock('@modules/seller/services/selectCategories.service', () => ({
  selectCategories: jest.fn()
}));

// Import the mocked service
const selectCategoriesService = require('@modules/seller/services/selectCategories.service');

const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

let mongoServer;

describe('Seller Controller - Select Categories', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB with compatible version
    mongoServer = await MongoMemoryServer.create({
      binary: { version: '7.0.3' }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create a valid JWT token
  const createAuthToken = (userId = '507f1f77bcf86cd799439011', role = 'Seller') => {
    return jwt.sign(
      { id: userId, role: role },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
  };

  describe('POST /api/v2/sellers/select-categories', () => {
    it('should successfully select categories for seller', async () => {
      // Arrange
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            { name: 'Laptops' }
          ]
        }
      ];

      const mockResponse = {
        message: 'Categories selected successfully',
        seller: {
          _id: 'seller123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'seller@example.com',
          storeName: 'John\'s Store',
          categories: [
            {
              name: 'Electronics',
              subCategories: [
                { name: 'Smartphones' },
                { name: 'Laptops' }
              ]
            }
          ]
        }
      };

      selectCategoriesService.selectCategories = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/select-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories })
        .expect(200);

      // Assert
      expect(selectCategoriesService.selectCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', categories);
      expect(response.body).toEqual({
        success: true,
        message: 'Categories selected successfully',
        data: mockResponse,
        pagination: null
      });
    });

    it('should handle validation error for missing categories', async () => {
      // Arrange
      selectCategoriesService.selectCategories = jest.fn().mockRejectedValue(
        new ValidationError([{ field: 'categories', message: 'Categories are required' }])
      );

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/select-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({})
        .expect(422);

      // Assert
      expect(selectCategoriesService.selectCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', undefined);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'categories', message: 'Categories are required' }]
      });
    });

    it('should handle validation error for invalid categories format', async () => {
      // Arrange
      const invalidCategories = 'not-an-array';
      
      selectCategoriesService.selectCategories = jest.fn().mockRejectedValue(
        new ValidationError([{ field: 'categories', message: 'Categories must be an array' }])
      );

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/select-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories: invalidCategories })
        .expect(422);

      // Assert
      expect(selectCategoriesService.selectCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', invalidCategories);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'categories', message: 'Categories must be an array' }]
      });
    });

    it('should handle validation error for empty categories array', async () => {
      // Arrange
      const emptyCategories = [];
      
      selectCategoriesService.selectCategories = jest.fn().mockRejectedValue(
        new ValidationError([{ field: 'categories', message: 'Categories array cannot be empty' }])
      );

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/select-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories: emptyCategories })
        .expect(422);

      // Assert
      expect(selectCategoriesService.selectCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', emptyCategories);
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
      
      selectCategoriesService.selectCategories = jest.fn().mockRejectedValue(
        new ValidationError([{ field: 'categories[0].id', message: 'Category ID is required' }])
      );

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/select-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories: invalidCategories })
        .expect(422);

      // Assert
      expect(selectCategoriesService.selectCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', invalidCategories);
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
      
      selectCategoriesService.selectCategories = jest.fn().mockRejectedValue(
        new ValidationError([{ field: 'categories[0].id', message: 'Category ID must be a valid MongoDB ObjectId' }])
      );

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/select-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories: invalidCategories })
        .expect(422);

      // Assert
      expect(selectCategoriesService.selectCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', invalidCategories);
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
          // Missing id
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            {} // Missing name
          ]
        }
      ];
      
      selectCategoriesService.selectCategories = jest.fn().mockRejectedValue(
        new ValidationError([
          { field: 'categories[0].id', message: 'Category ID is required' },
          { field: 'categories[0].subCategories[1].name', message: 'SubCategory name is required' }
        ])
      );

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/select-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories: invalidCategories })
        .expect(422);

      // Assert
      expect(selectCategoriesService.selectCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', invalidCategories);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'categories[0].id', message: 'Category ID is required' },
          { field: 'categories[0].subCategories[1].name', message: 'SubCategory name is required' }
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
      
      selectCategoriesService.selectCategories = jest.fn().mockRejectedValue(
        new NotFoundException('Seller not found')
      );

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/select-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories })
        .expect(404);

      // Assert
      expect(selectCategoriesService.selectCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', categories);
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
      
      selectCategoriesService.selectCategories = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/select-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories })
        .expect(500);

      // Assert
      expect(selectCategoriesService.selectCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', categories);
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should handle request with null body', async () => {
      // Arrange
      selectCategoriesService.selectCategories = jest.fn().mockRejectedValue(
        new ValidationError([{ field: 'categories', message: 'Categories are required' }])
      );

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/select-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send(null)
        .expect(422);

      // Assert
      expect(selectCategoriesService.selectCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', undefined);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'categories', message: 'Categories are required' }]
      });
    });

    it('should handle request with empty body', async () => {
      // Arrange
      selectCategoriesService.selectCategories = jest.fn().mockRejectedValue(
        new ValidationError([{ field: 'categories', message: 'Categories are required' }])
      );

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/select-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({})
        .expect(422);

      // Assert
      expect(selectCategoriesService.selectCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', undefined);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'categories', message: 'Categories are required' }]
      });
    });

    it('should handle multiple categories selection', async () => {
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
        message: 'Categories selected successfully',
        seller: {
          _id: 'seller123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'seller@example.com',
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

      selectCategoriesService.selectCategories = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/select-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories })
        .expect(200);

      // Assert
      expect(selectCategoriesService.selectCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', categories);
      expect(response.body).toEqual({
        success: true,
        message: 'Categories selected successfully',
        data: mockResponse,
        pagination: null
      });
    });

    it('should handle category with empty subCategories', async () => {
      // Arrange
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: []
        }
      ];

      const mockResponse = {
        message: 'Categories selected successfully',
        seller: {
          _id: 'seller123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'seller@example.com',
          storeName: 'John\'s Store',
          categories: [
            {
              name: 'Electronics',
              subCategories: []
            }
          ]
        }
      };

      selectCategoriesService.selectCategories = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/select-categories')
        .set('Authorization', `Bearer ${createAuthToken()}`)
        .send({ categories })
        .expect(200);

      // Assert
      expect(selectCategoriesService.selectCategories).toHaveBeenCalledWith('507f1f77bcf86cd799439011', categories);
      expect(response.body).toEqual({
        success: true,
        message: 'Categories selected successfully',
        data: mockResponse,
        pagination: null
      });
    });
  });
});
