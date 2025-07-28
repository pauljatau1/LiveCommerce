const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Import the Buyer and Product models
const Buyer = require('@modules/buyer/models/buyer.model');
const Product = require('@models/Product');

// Mock the get wishlist service
jest.mock('@modules/buyer/services/getWishlist.service', () => ({
  getWishlist: jest.fn()
}));

// Import the mocked service
const getWishlistService = require('@modules/buyer/services/getWishlist.service');

let mongoServer;

describe('Buyer Controller - Get Wishlist', () => {
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
    
    // Clear database
    await Buyer.deleteMany({});
    await Product.deleteMany({});
  });

  describe('getWishlist', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();

    it('should call get wishlist service and return success response', async () => {
      // Arrange
      const mockReq = {
        user: { id: mockBuyerId.toString() }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = [
        {
          product: {
            _id: new mongoose.Types.ObjectId(),
            name: 'Test Product',
            description: 'A test product',
            price: 100,
            images: ['image1.jpg'],
            category: 'Electronics',
            brand: 'Test Brand',
            stock: 10,
            seller: {
              _id: new mongoose.Types.ObjectId(),
              storeName: 'Test Store',
              businessName: 'Test Business'
            }
          },
          addedAt: new Date()
        }
      ];

      getWishlistService.getWishlist.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.getWishlist(mockReq, mockRes, mockNext);

      // Assert
      expect(getWishlistService.getWishlist).toHaveBeenCalledWith(
        mockBuyerId.toString()
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Wishlist retrieved successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors and call next with error', async () => {
      // Arrange
      const mockReq = {
        user: { id: mockBuyerId.toString() }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockError = new Error('Service error');
      getWishlistService.getWishlist.mockRejectedValue(mockError);

      // Act
      await buyerController.getWishlist(mockReq, mockRes, mockNext);

      // Assert
      expect(getWishlistService.getWishlist).toHaveBeenCalledWith(
        mockBuyerId.toString()
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle missing buyer ID', async () => {
      // Arrange
      const mockReq = {
        user: {}
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      // Act
      await buyerController.getWishlist(mockReq, mockRes, mockNext);

      // Assert
      expect(getWishlistService.getWishlist).toHaveBeenCalledWith(
        undefined
      );
      expect(mockRes.success).not.toHaveBeenCalled();
    });

    it('should handle empty wishlist response', async () => {
      // Arrange
      const mockReq = {
        user: { id: mockBuyerId.toString() }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = [];

      getWishlistService.getWishlist.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.getWishlist(mockReq, mockRes, mockNext);

      // Assert
      expect(getWishlistService.getWishlist).toHaveBeenCalledWith(
        mockBuyerId.toString()
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Wishlist retrieved successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 