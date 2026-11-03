/**
 * Get Profile Controller Tests
 *
 * This test suite covers the getProfile functionality of the seller controller.
 *
 * @module getProfileControllerTests
 */

const sellerController = require('@modules/seller/controllers/seller.controller');
const getProfileService = require('@modules/seller/services/getProfile.service');

// Mock the getProfile service
jest.mock('@modules/seller/services/getProfile.service');

describe('Get Profile Controller', () => {
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

  describe('getProfile', () => {
    it('should successfully retrieve seller profile', async () => {
      // Arrange
      const mockSellerId = '507f1f77bcf86cd799439011';
      const mockProfileData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+2348012345678',
        isVerified: true,
        emailVerified: true,
        walletBalance: 5000,
        storeVisits: 150,
        followersCount: 250,
        followingCount: 45,
        totalOrders: 89,
        streamCount: 15,
        categoriesCount: 8,
        hasProducts: true,
        hasMoreThan10Blips: true,
        storeStatus: {
          currentSchedule: {
            type: 'regular',
            day: 'monday',
            isOpen: true,
            openTime: '09:00',
            closeTime: '17:00'
          }
        }
      };

      mockReq.user = { id: mockSellerId };
      getProfileService.getProfile.mockResolvedValue(mockProfileData);

      // Act
      await sellerController.getProfile(mockReq, mockRes, mockNext);

      // Assert
      expect(getProfileService.getProfile).toHaveBeenCalledWith(mockSellerId);
      expect(mockRes.success).toHaveBeenCalledWith(mockProfileData, 'Profile retrieved successfully');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle profile retrieval errors', async () => {
      // Arrange
      const mockError = new Error('Profile retrieval failed');
      const mockSellerId = '507f1f77bcf86cd799439011';

      mockReq.user = { id: mockSellerId };
      getProfileService.getProfile.mockRejectedValue(mockError);

      // Act
      await sellerController.getProfile(mockReq, mockRes, mockNext);

      // Assert
      expect(getProfileService.getProfile).toHaveBeenCalledWith(mockSellerId);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockRes.success).not.toHaveBeenCalled();
    });

    it('should handle missing user ID', async () => {
      // Arrange
      mockReq.user = {};
      getProfileService.getProfile.mockRejectedValue(new Error('User ID is required'));

      // Act
      await sellerController.getProfile(mockReq, mockRes, mockNext);

      // Assert
      expect(getProfileService.getProfile).toHaveBeenCalledWith(undefined);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockRes.success).not.toHaveBeenCalled();
    });

    it('should handle service throwing NotFoundException', async () => {
      // Arrange
      const mockSellerId = '507f1f77bcf86cd799439011';
      const NotFoundException = require('@utils/errors/NotFoundException');
      const mockError = new NotFoundException('Seller not found');

      mockReq.user = { id: mockSellerId };
      getProfileService.getProfile.mockRejectedValue(mockError);

      // Act
      await sellerController.getProfile(mockReq, mockRes, mockNext);

      // Assert
      expect(getProfileService.getProfile).toHaveBeenCalledWith(mockSellerId);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockRes.success).not.toHaveBeenCalled();
    });

    it('should handle service throwing ValidationError', async () => {
      // Arrange
      const mockSellerId = '507f1f77bcf86cd799439011';
      const ValidationError = require('@utils/errors/ValidationError');
      const mockError = new ValidationError('Invalid seller ID');

      mockReq.user = { id: mockSellerId };
      getProfileService.getProfile.mockRejectedValue(mockError);

      // Act
      await sellerController.getProfile(mockReq, mockRes, mockNext);

      // Assert
      expect(getProfileService.getProfile).toHaveBeenCalledWith(mockSellerId);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockRes.success).not.toHaveBeenCalled();
    });

    it('should handle service throwing BadRequestException', async () => {
      // Arrange
      const mockSellerId = '507f1f77bcf86cd799439011';
      const BadRequestException = require('@utils/errors/BadRequestException');
      const mockError = new BadRequestException('Invalid request');

      mockReq.user = { id: mockSellerId };
      getProfileService.getProfile.mockRejectedValue(mockError);

      // Act
      await sellerController.getProfile(mockReq, mockRes, mockNext);

      // Assert
      expect(getProfileService.getProfile).toHaveBeenCalledWith(mockSellerId);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockRes.success).not.toHaveBeenCalled();
    });
  });
});
