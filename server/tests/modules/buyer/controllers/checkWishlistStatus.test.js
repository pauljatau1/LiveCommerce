const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Mock the check wishlist status service
jest.mock('@modules/buyer/services/checkWishlistStatus.service', () => ({
  checkWishlistStatus: jest.fn()
}));

// Import the mocked service
const checkWishlistStatusService = require('@modules/buyer/services/checkWishlistStatus.service');

let mongoServer;

describe('Buyer Controller - Check Wishlist Status', () => {
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

  describe('checkWishlistStatus', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();
    const mockProductId = new mongoose.Types.ObjectId();

    it('should call check wishlist status service and return success response when product is in wishlist', async () => {
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
        inWishlist: true
      };

      checkWishlistStatusService.checkWishlistStatus.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.checkWishlistStatus(mockReq, mockRes, mockNext);

      // Assert
      expect(checkWishlistStatusService.checkWishlistStatus).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockProductId.toString()
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Wishlist status checked successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call check wishlist status service and return success response when product is not in wishlist', async () => {
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
        inWishlist: false
      };

      checkWishlistStatusService.checkWishlistStatus.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.checkWishlistStatus(mockReq, mockRes, mockNext);

      // Assert
      expect(checkWishlistStatusService.checkWishlistStatus).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockProductId.toString()
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Wishlist status checked successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors and call next middleware', async () => {
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

      checkWishlistStatusService.checkWishlistStatus.mockRejectedValue(mockError);

      // Act
      await buyerController.checkWishlistStatus(mockReq, mockRes, mockNext);

      // Assert
      expect(checkWishlistStatusService.checkWishlistStatus).toHaveBeenCalledWith(
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
      await buyerController.checkWishlistStatus(mockReq, mockRes, mockNext);

      // Assert
      expect(checkWishlistStatusService.checkWishlistStatus).toHaveBeenCalledWith(
        undefined,
        mockProductId.toString()
      );
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
      await buyerController.checkWishlistStatus(mockReq, mockRes, mockNext);

      // Assert
      expect(checkWishlistStatusService.checkWishlistStatus).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        undefined
      );
    });
  });
});
