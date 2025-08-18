const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const jwt = require('jsonwebtoken');

// Import the app without starting the server
const { app } = require('@/app');

// Import the service
const getSelectedMajorCategoriesService = require('@modules/buyer/services/getSelectedMajorCategories.service');

// Import error classes
const NotFoundException = require('@utils/errors/NotFoundException');

// Import the Buyer model
const Buyer = require('@modules/buyer/models/buyer.model');

// Mock the service
jest.mock('@modules/buyer/services/getSelectedMajorCategories.service');

let mongoServer;
let testBuyer;
let authToken;

describe('GET /api/v2/buyers/selected-major-categories', () => {
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
    // Clear all collections
    await Buyer.deleteMany({});

    // Reset all mocks
    jest.clearAllMocks();

    // Create a test buyer
    testBuyer = new Buyer({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'johndoe',
      password: 'password123',
      selectedCategories: [
        { name: 'Smartphones', subCategories: [] },
        { name: 'Laptops', subCategories: [] }
      ]
    });
    await testBuyer.save();

    // Generate JWT token for authentication
    authToken = jwt.sign(
      { id: testBuyer._id, role: 'Buyer' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 when no token is provided', async () => {
      // Act
      const response = await request(app)
        .get('/api/v2/buyers/selected-major-categories')
        .expect(401);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'No token provided'
      });
    });

    it('should return 401 when invalid token is provided', async () => {
      // Act
      const response = await request(app)
        .get('/api/v2/buyers/selected-major-categories')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid token'
      });
    });

    it('should return 403 when token is for non-buyer user', async () => {
      // Arrange
      const sellerToken = jwt.sign(
        { id: new mongoose.Types.ObjectId(), role: 'Seller' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/selected-major-categories')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Access denied. Buyers only.'
      });
    });
  });

  describe('Success Cases', () => {
    it('should return selected major categories successfully', async () => {
      // Arrange
      const mockResponse = {
        selectedMajorCategories: [
          {
            _id: new mongoose.Types.ObjectId().toString(),
            name: 'Electronics',
            image: { url: 'https://example.com/electronics.jpg', public_id: 'electronics_id' },
            categoryCount: 2,
            categories: [
              { _id: new mongoose.Types.ObjectId().toString(), name: 'Smartphones' },
              { _id: new mongoose.Types.ObjectId().toString(), name: 'Laptops' }
            ]
          }
        ]
      };

      getSelectedMajorCategoriesService.getSelectedMajorCategories.mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/selected-major-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(getSelectedMajorCategoriesService.getSelectedMajorCategories).toHaveBeenCalledWith(testBuyer._id.toString());
      expect(response.body).toEqual({
        success: true,
        message: 'Selected major categories retrieved successfully',
        data: mockResponse,
        pagination: null
      });
    });

    it('should return empty array when no major categories are selected', async () => {
      // Arrange
      const mockResponse = {
        selectedMajorCategories: []
      };

      getSelectedMajorCategoriesService.getSelectedMajorCategories.mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/selected-major-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(getSelectedMajorCategoriesService.getSelectedMajorCategories).toHaveBeenCalledWith(testBuyer._id.toString());
      expect(response.body).toEqual({
        success: true,
        message: 'Selected major categories retrieved successfully',
        data: mockResponse,
        pagination: null
      });
    });

    it('should return multiple major categories when buyer has all categories from multiple major categories', async () => {
      // Arrange
      const mockResponse = {
        selectedMajorCategories: [
          {
            _id: new mongoose.Types.ObjectId().toString(),
            name: 'Electronics',
            image: { url: 'https://example.com/electronics.jpg', public_id: 'electronics_id' },
            categoryCount: 2,
            categories: [
              { _id: new mongoose.Types.ObjectId().toString(), name: 'Smartphones' },
              { _id: new mongoose.Types.ObjectId().toString(), name: 'Laptops' }
            ]
          },
          {
            _id: new mongoose.Types.ObjectId().toString(),
            name: 'Fashion',
            image: { url: 'https://example.com/fashion.jpg', public_id: 'fashion_id' },
            categoryCount: 2,
            categories: [
              { _id: new mongoose.Types.ObjectId().toString(), name: 'T-Shirts' },
              { _id: new mongoose.Types.ObjectId().toString(), name: 'Jeans' }
            ]
          }
        ]
      };

      getSelectedMajorCategoriesService.getSelectedMajorCategories.mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/selected-major-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(getSelectedMajorCategoriesService.getSelectedMajorCategories).toHaveBeenCalledWith(testBuyer._id.toString());
      expect(response.body).toEqual({
        success: true,
        message: 'Selected major categories retrieved successfully',
        data: mockResponse,
        pagination: null
      });
      expect(response.body.data.selectedMajorCategories).toHaveLength(2);
    });
  });

  describe('Error Cases', () => {
    it('should return 404 when buyer is not found', async () => {
      // Arrange
      getSelectedMajorCategoriesService.getSelectedMajorCategories.mockRejectedValue(
        new NotFoundException('Buyer not found')
      );

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/selected-major-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Assert
      expect(getSelectedMajorCategoriesService.getSelectedMajorCategories).toHaveBeenCalledWith(testBuyer._id.toString());
      expect(response.body).toEqual({
        success: false,
        message: 'Buyer not found'
      });
    });

    it('should return 500 when service throws an unexpected error', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      getSelectedMajorCategoriesService.getSelectedMajorCategories.mockRejectedValue(error);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/selected-major-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      // Assert
      expect(getSelectedMajorCategoriesService.getSelectedMajorCategories).toHaveBeenCalledWith(testBuyer._id.toString());
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should handle service errors with custom error messages', async () => {
      // Arrange
      const customError = new Error('Custom error message');
      customError.status = 422;
      getSelectedMajorCategoriesService.getSelectedMajorCategories.mockRejectedValue(customError);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/selected-major-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      // Assert
      expect(getSelectedMajorCategoriesService.getSelectedMajorCategories).toHaveBeenCalledWith(testBuyer._id.toString());
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });
  });

  describe('Request Validation', () => {
    it('should use the correct buyer ID from the authenticated user', async () => {
      // Arrange
      const mockResponse = { selectedMajorCategories: [] };
      getSelectedMajorCategoriesService.getSelectedMajorCategories.mockResolvedValue(mockResponse);

      // Act
      await request(app)
        .get('/api/v2/buyers/selected-major-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(getSelectedMajorCategoriesService.getSelectedMajorCategories).toHaveBeenCalledWith(testBuyer._id.toString());
    });

    it('should handle expired token', async () => {
      // Arrange
      const expiredToken = jwt.sign(
        { id: testBuyer._id, role: 'Buyer' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '0s' } // Expired immediately
      );

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/selected-major-categories')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid token'
      });
    });
  });
});
