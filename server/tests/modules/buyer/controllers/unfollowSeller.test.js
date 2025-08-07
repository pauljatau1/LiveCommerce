const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Mock the unfollow seller service
jest.mock('@modules/buyer/services/unfollowSeller.service', () => ({
  unfollowSeller: jest.fn()
}));

// Import the mocked service
const unfollowSellerService = require('@modules/buyer/services/unfollowSeller.service');

let mongoServer;

describe('Buyer Controller - Unfollow Seller', () => {
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

  describe('unfollowSeller', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();
    const mockSellerId = new mongoose.Types.ObjectId();

    it('should call unfollow seller service and return success response', async () => {
      // Arrange
      const mockReq = {
        user: { id: mockBuyerId.toString() },
        params: { sellerId: mockSellerId.toString() }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = {
        sellerFollowCount: 0,
        buyerFollowingCount: 0
      };

      unfollowSellerService.unfollowSeller.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.unfollowSeller(mockReq, mockRes, mockNext);

      // Assert
      expect(unfollowSellerService.unfollowSeller).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockSellerId.toString()
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Successfully unfollowed seller'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors and call next with error', async () => {
      // Arrange
      const mockReq = {
        user: { id: mockBuyerId.toString() },
        params: { sellerId: mockSellerId.toString() }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockError = new Error('Service error');
      unfollowSellerService.unfollowSeller.mockRejectedValue(mockError);

      // Act
      await buyerController.unfollowSeller(mockReq, mockRes, mockNext);

      // Assert
      expect(unfollowSellerService.unfollowSeller).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockSellerId.toString()
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle missing buyer ID', async () => {
      // Arrange
      const mockReq = {
        user: {},
        params: { sellerId: mockSellerId.toString() }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      // Act
      await buyerController.unfollowSeller(mockReq, mockRes, mockNext);

      // Assert
      expect(unfollowSellerService.unfollowSeller).toHaveBeenCalledWith(
        undefined,
        mockSellerId.toString()
      );
      expect(mockRes.success).not.toHaveBeenCalled();
    });

    it('should handle missing seller ID', async () => {
      // Arrange
      const mockReq = {
        user: { id: mockBuyerId.toString() },
        params: {}
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      // Act
      await buyerController.unfollowSeller(mockReq, mockRes, mockNext);

      // Assert
      expect(unfollowSellerService.unfollowSeller).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        undefined
      );
      expect(mockRes.success).not.toHaveBeenCalled();
    });
  });
}); 