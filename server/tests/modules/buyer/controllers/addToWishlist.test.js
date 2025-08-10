const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Mock the add to wishlist service
jest.mock('@modules/buyer/services/addToWishlist.service', () => ({
  addToWishlist: jest.fn()
}));

// Import the mocked service
const addToWishlistService = require('@modules/buyer/services/addToWishlist.service');

let mongoServer;

describe('Buyer Controller - Add To Wishlist', () => {
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
  });

  describe('addToWishlist', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();
    const mockProductId = new mongoose.Types.ObjectId();

    it('should call add to wishlist service and return success response', async () => {
      // Arrange
      const mockReq = {
        user: { id: mockBuyerId.toString() },
        body: { productId: mockProductId.toString() }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = {
        wishlist: [{
          product: mockProductId.toString(),
          addedAt: new Date()
        }]
      };

      addToWishlistService.addToWishlist.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.addToWishlist(mockReq, mockRes, mockNext);

      // Assert
      expect(addToWishlistService.addToWishlist).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockProductId.toString()
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Product added to wishlist successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors and call next with error', async () => {
      // Arrange
      const mockReq = {
        user: { id: mockBuyerId.toString() },
        body: { productId: mockProductId.toString() }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockError = new Error('Service error');
      addToWishlistService.addToWishlist.mockRejectedValue(mockError);

      // Act
      await buyerController.addToWishlist(mockReq, mockRes, mockNext);

      // Assert
      expect(addToWishlistService.addToWishlist).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockProductId.toString()
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle missing buyer ID', async () => {
      // Arrange
      const mockReq = {
        user: {},
        body: { productId: mockProductId.toString() }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      // Act
      await buyerController.addToWishlist(mockReq, mockRes, mockNext);

      // Assert
      expect(addToWishlistService.addToWishlist).toHaveBeenCalledWith(
        undefined,
        mockProductId.toString()
      );
      expect(mockRes.success).not.toHaveBeenCalled();
    });

    it('should handle missing product ID', async () => {
      // Arrange
      const mockReq = {
        user: { id: mockBuyerId.toString() },
        body: {}
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      // Act
      await buyerController.addToWishlist(mockReq, mockRes, mockNext);

      // Assert
      expect(addToWishlistService.addToWishlist).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        undefined
      );
      expect(mockRes.success).not.toHaveBeenCalled();
    });
  });
}); 