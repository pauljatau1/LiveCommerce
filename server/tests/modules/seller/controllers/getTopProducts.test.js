/**
 * Get Top Products Controller Tests
 *
 * This test suite covers the getTopProducts functionality of the seller controller.
 *
 * @module getTopProductsControllerTests
 */

const sellerController = require('@modules/seller/controllers/seller.controller');
const getTopProductsService = require('@modules/seller/services/getTopProducts.service');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the getTopProducts service
jest.mock('@modules/seller/services/getTopProducts.service');

describe('Get Top Products Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock request, response, and next function
    mockReq = {
      body: {},
      headers: {},
      user: {},
      params: {}
    };

    mockRes = {
      success: jest.fn(),
      error: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
  });

  describe('getTopProducts', () => {
    it('should successfully retrieve top products for authenticated seller', async () => {
      // Arrange
      const mockSellerId = '507f1f77bcf86cd799439011';
      const mockTopProductsData = {
        data: [
          {
            _id: '507f1f77bcf86cd799439013',
            totalQuantity: 25,
            totalRevenue: 1250.00,
            productDetails: {
              _id: '507f1f77bcf86cd799439013',
              name: 'Premium Headphones',
              price: 50.00,
              images: [{ url: 'https://example.com/image.jpg' }],
              category: 'Electronics',
              brand: 'TechBrand'
            }
          },
          {
            _id: '507f1f77bcf86cd799439014',
            totalQuantity: 15,
            totalRevenue: 750.00,
            productDetails: {
              _id: '507f1f77bcf86cd799439014',
              name: 'Wireless Mouse',
              price: 25.00,
              images: [{ url: 'https://example.com/mouse.jpg' }],
              category: 'Electronics',
              brand: 'TechBrand'
            }
          }
        ]
      };

      mockReq.user.id = mockSellerId;
      getTopProductsService.getTopProducts.mockResolvedValue(mockTopProductsData);

      // Act
      await sellerController.getTopProducts(mockReq, mockRes, mockNext);

      // Assert
      expect(getTopProductsService.getTopProducts).toHaveBeenCalledWith(mockSellerId);
      expect(mockRes.success).toHaveBeenCalledWith(
        mockTopProductsData,
        'Top products retrieved successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors and forward them to error middleware', async () => {
      // Arrange
      const mockSellerId = '507f1f77bcf86cd799439011';
      const mockError = new Error('Database connection failed');
      mockError.statusCode = 500;

      mockReq.user.id = mockSellerId;
      getTopProductsService.getTopProducts.mockRejectedValue(mockError);

      // Act
      await sellerController.getTopProducts(mockReq, mockRes, mockNext);

      // Assert
      expect(getTopProductsService.getTopProducts).toHaveBeenCalledWith(mockSellerId);
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle missing user ID gracefully', async () => {
      // Arrange
      const mockError = new Error('User not authenticated');
      mockError.statusCode = 401;

      mockReq.user = {}; // No ID property
      getTopProductsService.getTopProducts.mockRejectedValue(mockError);

      // Act
      await sellerController.getTopProducts(mockReq, mockRes, mockNext);

      // Assert
      expect(getTopProductsService.getTopProducts).toHaveBeenCalledWith(undefined);
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle empty top products result', async () => {
      // Arrange
      const mockSellerId = '507f1f77bcf86cd799439011';
      const mockEmptyData = { data: [] };

      mockReq.user.id = mockSellerId;
      getTopProductsService.getTopProducts.mockResolvedValue(mockEmptyData);

      // Act
      await sellerController.getTopProducts(mockReq, mockRes, mockNext);

      // Assert
      expect(getTopProductsService.getTopProducts).toHaveBeenCalledWith(mockSellerId);
      expect(mockRes.success).toHaveBeenCalledWith(
        mockEmptyData,
        'Top products retrieved successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service validation errors', async () => {
      // Arrange
      const mockSellerId = 'invalid-id';
      const mockError = new ValidationError([{ 
        field: 'sellerId', 
        message: 'Seller ID must be a valid ObjectId format' 
      }]);

      mockReq.user.id = mockSellerId;
      getTopProductsService.getTopProducts.mockRejectedValue(mockError);

      // Act
      await sellerController.getTopProducts(mockReq, mockRes, mockNext);

      // Assert
      expect(getTopProductsService.getTopProducts).toHaveBeenCalledWith(mockSellerId);
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});
