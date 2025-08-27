const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Mock the remove from wishlist service
jest.mock('@modules/buyer/services/removeFromWishlist.service', () => ({
  removeFromWishlist: jest.fn()
}));

// Import the mocked service
const removeFromWishlistService = require('@modules/buyer/services/removeFromWishlist.service');

let mongoServer;

describe('Buyer Controller - Remove From Wishlist', () => {
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

  describe('removeFromWishlist', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();
    const mockProductId = new mongoose.Types.ObjectId();

    it('should call remove from wishlist service and return success response', async () => {
      // Arrange
      const mockReq = {
        user: { id: mockBuyerId.toString() },
        params: { productId: mockProductId.toString() }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = {
        wishlist: []
      };

      removeFromWishlistService.removeFromWishlist.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.removeFromWishlist(mockReq, mockRes, mockNext);

      // Assert
      expect(removeFromWishlistService.removeFromWishlist).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockProductId.toString()
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Product removed from wishlist successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors and call next with error', async () => {
      // Arrange
      const mockReq = {
        user: { id: mockBuyerId.toString() },
        params: { productId: mockProductId.toString() }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockError = new Error('Service error');
      removeFromWishlistService.removeFromWishlist.mockRejectedValue(mockError);

      // Act
      await buyerController.removeFromWishlist(mockReq, mockRes, mockNext);

      // Assert
      expect(removeFromWishlistService.removeFromWishlist).toHaveBeenCalledWith(
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
        params: { productId: mockProductId.toString() }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      // Act
      await buyerController.removeFromWishlist(mockReq, mockRes, mockNext);

      // Assert
      expect(removeFromWishlistService.removeFromWishlist).toHaveBeenCalledWith(
        undefined,
        mockProductId.toString()
      );
      expect(mockRes.success).not.toHaveBeenCalled();
    });

    it('should handle missing product ID', async () => {
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
      await buyerController.removeFromWishlist(mockReq, mockRes, mockNext);

      // Assert
      expect(removeFromWishlistService.removeFromWishlist).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        undefined
      );
      expect(mockRes.success).not.toHaveBeenCalled();
    });

    it('should handle service response with remaining wishlist items', async () => {
      // Arrange
      const mockReq = {
        user: { id: mockBuyerId.toString() },
        params: { productId: mockProductId.toString() }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = {
        wishlist: [
          {
            product: new mongoose.Types.ObjectId().toString(),
            addedAt: new Date()
          }
        ]
      };

      removeFromWishlistService.removeFromWishlist.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.removeFromWishlist(mockReq, mockRes, mockNext);

      // Assert
      expect(removeFromWishlistService.removeFromWishlist).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockProductId.toString()
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Product removed from wishlist successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 