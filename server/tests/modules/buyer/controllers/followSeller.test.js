const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Mock the follow seller service
jest.mock('@modules/buyer/services/followSeller.service', () => ({
  followSeller: jest.fn()
}));

// Import the mocked service
const followSellerService = require('@modules/buyer/services/followSeller.service');

let mongoServer;

describe('Buyer Controller - Follow Seller', () => {
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

  describe('followSeller', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();
    const mockSellerId = new mongoose.Types.ObjectId();

    it('should call follow seller service and return success response', async () => {
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
        followData: {
          buyerId: mockBuyerId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          followDate: new Date(),
          totalOrders: 0,
          mainAddress: null
        },
        sellerFollowCount: 1,
        buyerFollowingCount: 1
      };

      followSellerService.followSeller.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.followSeller(mockReq, mockRes, mockNext);

      // Assert
      expect(followSellerService.followSeller).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockSellerId.toString()
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Successfully followed seller'
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
      followSellerService.followSeller.mockRejectedValue(mockError);

      // Act
      await buyerController.followSeller(mockReq, mockRes, mockNext);

      // Assert
      expect(followSellerService.followSeller).toHaveBeenCalledWith(
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
      await buyerController.followSeller(mockReq, mockRes, mockNext);

      // Assert
      expect(followSellerService.followSeller).toHaveBeenCalledWith(
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
      await buyerController.followSeller(mockReq, mockRes, mockNext);

      // Assert
      expect(followSellerService.followSeller).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        undefined
      );
      expect(mockRes.success).not.toHaveBeenCalled();
    });
  });
}); 