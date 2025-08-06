const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const getNotificationPreferencesService = require('@modules/buyer/services/getNotificationPreferences.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const NotFoundException = require('@utils/errors/NotFoundException');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the buyer repository
jest.mock('@modules/buyer/repositories/buyer.repository');

describe('Get Notification Preferences Service', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3' // Specify compatible version for Debian 12
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotificationPreferences', () => {
    const mockBuyerId = '507f1f77bcf86cd799439011';

    it('should return notification preferences successfully', async () => {
      // Mock buyer data with notification preferences
      const mockBuyer = {
        _id: mockBuyerId,
        notificationPreferences: {
          orderUpdates: {
            orderConfirmation: true,
            shippingAndDelivery: true,
            orderCancellation: false,
            refundUpdates: true
          },
          liveShows: {
            allShows: true,
            followedSellers: true,
            recommendedShows: false
          },
          messages: {
            fromSellers: true,
            fromBuyers: false,
            chatReplies: true,
            mentions: true
          },
          communityActivity: {
            postComments: true,
            postLikes: false,
            repliesAndMentions: true
          },
          promotionsAndSales: {
            flashSales: true,
            couponsAndDeals: true,
            trendingProducts: false,
            recommendations: true
          }
        }
      };

      // Mock the repository method
      buyerRepository.findBuyerWithNotificationPreferences.mockResolvedValue(mockBuyer);

      // Call the service
      const result = await getNotificationPreferencesService.getNotificationPreferences(mockBuyerId);

      // Verify the result
      expect(result).toEqual({
        data: {
          preferences: mockBuyer.notificationPreferences
        }
      });

      // Verify the repository method was called with correct parameters
      expect(buyerRepository.findBuyerWithNotificationPreferences).toHaveBeenCalledWith(mockBuyerId);
    });

    it('should return empty preferences when buyer has no notification preferences', async () => {
      // Mock buyer data without notification preferences
      const mockBuyer = {
        _id: mockBuyerId,
        notificationPreferences: null
      };

      // Mock the repository method
      buyerRepository.findBuyerWithNotificationPreferences.mockResolvedValue(mockBuyer);

      // Call the service
      const result = await getNotificationPreferencesService.getNotificationPreferences(mockBuyerId);

      // Verify the result
      expect(result).toEqual({
        data: {
          preferences: {}
        }
      });

      // Verify the repository method was called with correct parameters
      expect(buyerRepository.findBuyerWithNotificationPreferences).toHaveBeenCalledWith(mockBuyerId);
    });

    it('should return empty preferences when buyer has undefined notification preferences', async () => {
      // Mock buyer data with undefined notification preferences
      const mockBuyer = {
        _id: mockBuyerId,
        notificationPreferences: undefined
      };

      // Mock the repository method
      buyerRepository.findBuyerWithNotificationPreferences.mockResolvedValue(mockBuyer);

      // Call the service
      const result = await getNotificationPreferencesService.getNotificationPreferences(mockBuyerId);

      // Verify the result
      expect(result).toEqual({
        data: {
          preferences: {}
        }
      });

      // Verify the repository method was called with correct parameters
      expect(buyerRepository.findBuyerWithNotificationPreferences).toHaveBeenCalledWith(mockBuyerId);
    });

    it('should throw NotFoundException when buyer is not found', async () => {
      // Mock the repository method to return null
      buyerRepository.findBuyerWithNotificationPreferences.mockResolvedValue(null);

      // Expect the service to throw NotFoundException
      await expect(
        getNotificationPreferencesService.getNotificationPreferences(mockBuyerId)
      ).rejects.toThrow(NotFoundException);

      // Verify the repository method was called with correct parameters
      expect(buyerRepository.findBuyerWithNotificationPreferences).toHaveBeenCalledWith(mockBuyerId);
    });

    it('should throw ValidationError for invalid buyer ID', async () => {
      // Test with invalid buyer ID
      const invalidBuyerId = '';

      // Expect the service to throw ValidationError
      await expect(
        getNotificationPreferencesService.getNotificationPreferences(invalidBuyerId)
      ).rejects.toThrow(ValidationError);

      // Verify the repository method was not called
      expect(buyerRepository.findBuyerWithNotificationPreferences).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for null buyer ID', async () => {
      // Test with null buyer ID
      await expect(
        getNotificationPreferencesService.getNotificationPreferences(null)
      ).rejects.toThrow(ValidationError);

      // Verify the repository method was not called
      expect(buyerRepository.findBuyerWithNotificationPreferences).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for undefined buyer ID', async () => {
      // Test with undefined buyer ID
      await expect(
        getNotificationPreferencesService.getNotificationPreferences(undefined)
      ).rejects.toThrow(ValidationError);

      // Verify the repository method was not called
      expect(buyerRepository.findBuyerWithNotificationPreferences).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for non-string buyer ID', async () => {
      // Test with numeric buyer ID
      await expect(
        getNotificationPreferencesService.getNotificationPreferences(123)
      ).rejects.toThrow(ValidationError);

      // Verify the repository method was not called
      expect(buyerRepository.findBuyerWithNotificationPreferences).not.toHaveBeenCalled();
    });
  });
}); 