/**
 * Get Statistics Controller Tests
 *
 * This test suite covers the getStatistics functionality of the seller controller.
 *
 * @module getStatisticsControllerTests
 */

const sellerController = require('@modules/seller/controllers/seller.controller');
const getStatisticsService = require('@modules/seller/services/getStatistics.service');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the getStatistics service
jest.mock('@modules/seller/services/getStatistics.service');

describe('Get Statistics Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock request object
    mockReq = {
      user: {
        id: '507f1f77bcf86cd799439011'
      }
    };

    // Setup mock response object
    mockRes = {
      success: jest.fn()
    };

    // Setup mock next function
    mockNext = jest.fn();
  });

  describe('getStatistics', () => {
    it('should successfully retrieve statistics for a valid seller', async () => {
      // Arrange: Setup mock service response
      const mockStatistics = {
        data: {
          walletBalance: {
            amount: 15000.50,
            currency: "NGN",
            change: { value: "12.50", type: "percentage" }
          },
          storeVisits: {
            count: 1250,
            change: { value: "8.75", type: "percentage" }
          },
          totalOrders: {
            count: 89,
            change: { value: "15.25", type: "percentage" }
          },
          conversionRate: {
            percentage: "7.12",
            change: { value: "2.30", type: "percentage" }
          },
          newCustomers: {
            count: 45,
            change: { value: "5.80", type: "percentage" }
          }
        }
      };

      getStatisticsService.getStatistics.mockResolvedValue(mockStatistics);

      // Act: Call the controller method
      await sellerController.getStatistics(mockReq, mockRes, mockNext);

      // Assert: Verify service was called correctly and response was sent
      expect(getStatisticsService.getStatistics).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockRes.success).toHaveBeenCalledWith(mockStatistics, 'Statistics retrieved successfully');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors and forward them to error middleware', async () => {
      // Arrange: Setup mock service to throw an error
      const mockError = new Error('Database connection failed');
      getStatisticsService.getStatistics.mockRejectedValue(mockError);

      // Act: Call the controller method
      await sellerController.getStatistics(mockReq, mockRes, mockNext);

      // Assert: Verify error was forwarded to next middleware
      expect(getStatisticsService.getStatistics).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle ValidationError from service with proper structure', async () => {
      // Arrange: Setup mock service to throw ValidationError
      const validationError = new ValidationError([{ 
        field: 'sellerId', 
        message: 'Valid seller ID is required' 
      }]);
      getStatisticsService.getStatistics.mockRejectedValue(validationError);

      // Act: Call the controller method
      await sellerController.getStatistics(mockReq, mockRes, mockNext);

      // Assert: Verify ValidationError was forwarded with proper structure
      expect(getStatisticsService.getStatistics).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(validationError);
      
      // Verify the error structure
      const forwardedError = mockNext.mock.calls[0][0];
      expect(forwardedError).toBeInstanceOf(ValidationError);
      expect(forwardedError.name).toBe('ValidationError');
      expect(forwardedError.status).toBe(422);
      expect(forwardedError.message).toBe('Validation failed');
      expect(forwardedError.errors).toEqual([{ 
        field: 'sellerId', 
        message: 'Valid seller ID is required' 
      }]);
    });

    it('should handle NotFoundException from service with proper structure', async () => {
      // Arrange: Setup mock service to throw NotFoundException
      const notFoundError = new NotFoundException('Seller not found');
      getStatisticsService.getStatistics.mockRejectedValue(notFoundError);

      // Act: Call the controller method
      await sellerController.getStatistics(mockReq, mockRes, mockNext);

      // Assert: Verify NotFoundException was forwarded with proper structure
      expect(getStatisticsService.getStatistics).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
      
      // Verify the error structure
      const forwardedError = mockNext.mock.calls[0][0];
      expect(forwardedError).toBeInstanceOf(NotFoundException);
      expect(forwardedError.name).toBe('NotFoundException');
      expect(forwardedError.status).toBe(404);
      expect(forwardedError.message).toBe('Seller not found');
    });

    it('should handle missing user ID in request', async () => {
      // Arrange: Setup request without user ID
      mockReq.user = {};

      // Act: Call the controller method
      await sellerController.getStatistics(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with undefined and error was handled
      expect(getStatisticsService.getStatistics).toHaveBeenCalledWith(undefined);
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
