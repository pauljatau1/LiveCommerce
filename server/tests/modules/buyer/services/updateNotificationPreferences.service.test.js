const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const updateNotificationPreferencesService = require('@modules/buyer/services/updateNotificationPreferences.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const NotFoundException = require('@utils/errors/NotFoundException');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the buyer repository
jest.mock('@modules/buyer/repositories/buyer.repository');

describe('Update Notification Preferences Service', () => {
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

  describe('deepMergeNotificationPreferences', () => {
    it('should merge preferences correctly', () => {
      // Mock existing preferences
      const existingPreferences = {
        orderUpdates: {
          orderConfirmation: true,
          shippingAndDelivery: true,
          orderCancellation: true,
          refundUpdates: true
        },
        liveShows: {
          allShows: true,
          followedSellers: true,
          recommendedShows: true
        },
        messages: {
          fromSellers: true,
          fromBuyers: true,
          chatReplies: true,
          mentions: true
        },
        communityActivity: {
          postComments: true,
          postLikes: true,
          repliesAndMentions: true
        },
        promotionsAndSales: {
          flashSales: true,
          couponsAndDeals: true,
          trendingProducts: true,
          recommendations: true
        }
      };

      // Mock new preferences to merge
      const newPreferences = {
        orderUpdates: {
          orderConfirmation: false,
          shippingAndDelivery: false
        },
        liveShows: {
          allShows: false
        },
        messages: {
          fromBuyers: false,
          chatReplies: false
        }
      };

      // Call the merge function
      const result = updateNotificationPreferencesService.deepMergeNotificationPreferences(
        existingPreferences,
        newPreferences
      );

      // Verify the merge result
      expect(result.orderUpdates.orderConfirmation).toBe(false);
      expect(result.orderUpdates.shippingAndDelivery).toBe(false);
      expect(result.orderUpdates.orderCancellation).toBe(true); // Should remain unchanged
      expect(result.orderUpdates.refundUpdates).toBe(true); // Should remain unchanged
      
      expect(result.liveShows.allShows).toBe(false);
      expect(result.liveShows.followedSellers).toBe(true); // Should remain unchanged
      expect(result.liveShows.recommendedShows).toBe(true); // Should remain unchanged
      
      expect(result.messages.fromSellers).toBe(true); // Should remain unchanged
      expect(result.messages.fromBuyers).toBe(false);
      expect(result.messages.chatReplies).toBe(false);
      expect(result.messages.mentions).toBe(true); // Should remain unchanged
      
      expect(result.communityActivity.postComments).toBe(true); // Should remain unchanged
      expect(result.communityActivity.postLikes).toBe(true); // Should remain unchanged
      expect(result.communityActivity.repliesAndMentions).toBe(true); // Should remain unchanged
      
      expect(result.promotionsAndSales.flashSales).toBe(true); // Should remain unchanged
      expect(result.promotionsAndSales.couponsAndDeals).toBe(true); // Should remain unchanged
      expect(result.promotionsAndSales.trendingProducts).toBe(true); // Should remain unchanged
      expect(result.promotionsAndSales.recommendations).toBe(true); // Should remain unchanged
    });

    it('should handle empty new preferences', () => {
      // Mock existing preferences
      const existingPreferences = {
        orderUpdates: {
          orderConfirmation: true,
          shippingAndDelivery: true
        },
        liveShows: {
          allShows: true,
          followedSellers: true
        }
      };

      // Mock empty new preferences
      const newPreferences = {};

      // Call the merge function
      const result = updateNotificationPreferencesService.deepMergeNotificationPreferences(
        existingPreferences,
        newPreferences
      );

      // Verify the result remains unchanged
      expect(result).toEqual(existingPreferences);
    });

    it('should handle partial new preferences', () => {
      // Mock existing preferences
      const existingPreferences = {
        orderUpdates: {
          orderConfirmation: true,
          shippingAndDelivery: true,
          orderCancellation: true,
          refundUpdates: true
        },
        liveShows: {
          allShows: true,
          followedSellers: true,
          recommendedShows: true
        }
      };

      // Mock partial new preferences
      const newPreferences = {
        orderUpdates: {
          orderConfirmation: false
        }
      };

      // Call the merge function
      const result = updateNotificationPreferencesService.deepMergeNotificationPreferences(
        existingPreferences,
        newPreferences
      );

      // Verify only the specified field is updated
      expect(result.orderUpdates.orderConfirmation).toBe(false);
      expect(result.orderUpdates.shippingAndDelivery).toBe(true); // Should remain unchanged
      expect(result.orderUpdates.orderCancellation).toBe(true); // Should remain unchanged
      expect(result.orderUpdates.refundUpdates).toBe(true); // Should remain unchanged
      
      expect(result.liveShows.allShows).toBe(true); // Should remain unchanged
      expect(result.liveShows.followedSellers).toBe(true); // Should remain unchanged
      expect(result.liveShows.recommendedShows).toBe(true); // Should remain unchanged
    });
  });

  describe('updateNotificationPreferences', () => {
    const mockBuyerId = '507f1f77bcf86cd799439011';

    it('should update notification preferences successfully', async () => {
      // Mock existing buyer data
      const mockExistingBuyer = {
        _id: mockBuyerId,
        notificationPreferences: {
          orderUpdates: {
            orderConfirmation: true,
            shippingAndDelivery: true,
            orderCancellation: true,
            refundUpdates: true
          },
          liveShows: {
            allShows: true,
            followedSellers: true,
            recommendedShows: true
          },
          messages: {
            fromSellers: true,
            fromBuyers: true,
            chatReplies: true,
            mentions: true
          },
          communityActivity: {
            postComments: true,
            postLikes: true,
            repliesAndMentions: true
          },
          promotionsAndSales: {
            flashSales: true,
            couponsAndDeals: true,
            trendingProducts: true,
            recommendations: true
          }
        }
      };

      // Mock updated buyer data
      const mockUpdatedBuyer = {
        _id: mockBuyerId,
        notificationPreferences: {
          orderUpdates: {
            orderConfirmation: false,
            shippingAndDelivery: false,
            orderCancellation: true,
            refundUpdates: true
          },
          liveShows: {
            allShows: true,
            followedSellers: true,
            recommendedShows: true
          },
          messages: {
            fromSellers: true,
            fromBuyers: true,
            chatReplies: true,
            mentions: true
          },
          communityActivity: {
            postComments: true,
            postLikes: true,
            repliesAndMentions: true
          },
          promotionsAndSales: {
            flashSales: true,
            couponsAndDeals: true,
            trendingProducts: true,
            recommendations: true
          }
        }
      };

      // Mock new preferences to update
      const newPreferences = {
        orderUpdates: {
          orderConfirmation: false,
          shippingAndDelivery: false
        }
      };

      // Mock repository methods
      buyerRepository.findBuyerWithNotificationPreferences.mockResolvedValue(mockExistingBuyer);
      buyerRepository.updateNotificationPreferences.mockResolvedValue(mockUpdatedBuyer);

      // Call the service
      const result = await updateNotificationPreferencesService.updateNotificationPreferences(mockBuyerId, newPreferences);

      // Verify the result
      expect(result).toEqual({
        data: {
          preferences: mockUpdatedBuyer.notificationPreferences
        }
      });

      // Verify repository methods were called with correct parameters
      expect(buyerRepository.findBuyerWithNotificationPreferences).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateNotificationPreferences).toHaveBeenCalledWith(mockBuyerId, expect.any(Object));
    });

    it('should throw NotFoundException when buyer is not found', async () => {
      // Mock the repository method to return null
      buyerRepository.findBuyerWithNotificationPreferences.mockResolvedValue(null);

      // Mock new preferences
      const newPreferences = {
        orderUpdates: {
          orderConfirmation: false
        }
      };

      // Expect the service to throw NotFoundException
      await expect(
        updateNotificationPreferencesService.updateNotificationPreferences(mockBuyerId, newPreferences)
      ).rejects.toThrow(NotFoundException);

      // Verify the repository method was called with correct parameters
      expect(buyerRepository.findBuyerWithNotificationPreferences).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateNotificationPreferences).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when update fails', async () => {
      // Mock existing buyer data
      const mockExistingBuyer = {
        _id: mockBuyerId,
        notificationPreferences: {
          orderUpdates: {
            orderConfirmation: true,
            shippingAndDelivery: true
          }
        }
      };

      // Mock new preferences
      const newPreferences = {
        orderUpdates: {
          orderConfirmation: false
        }
      };

      // Mock repository methods
      buyerRepository.findBuyerWithNotificationPreferences.mockResolvedValue(mockExistingBuyer);
      buyerRepository.updateNotificationPreferences.mockResolvedValue(null);

      // Expect the service to throw NotFoundException
      await expect(
        updateNotificationPreferencesService.updateNotificationPreferences(mockBuyerId, newPreferences)
      ).rejects.toThrow(NotFoundException);

      // Verify repository methods were called
      expect(buyerRepository.findBuyerWithNotificationPreferences).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateNotificationPreferences).toHaveBeenCalledWith(mockBuyerId, expect.any(Object));
    });

    it('should throw ValidationError for invalid buyer ID', async () => {
      // Test with invalid buyer ID
      const invalidBuyerId = '';
      const newPreferences = {
        orderUpdates: {
          orderConfirmation: false
        }
      };

      // Expect the service to throw ValidationError
      await expect(
        updateNotificationPreferencesService.updateNotificationPreferences(invalidBuyerId, newPreferences)
      ).rejects.toThrow(ValidationError);

      // Verify repository methods were not called
      expect(buyerRepository.findBuyerWithNotificationPreferences).not.toHaveBeenCalled();
      expect(buyerRepository.updateNotificationPreferences).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid preferences', async () => {
      // Test with invalid preferences
      const newPreferences = null;

      // Expect the service to throw ValidationError
      await expect(
        updateNotificationPreferencesService.updateNotificationPreferences(mockBuyerId, newPreferences)
      ).rejects.toThrow(ValidationError);

      // Verify repository methods were not called
      expect(buyerRepository.findBuyerWithNotificationPreferences).not.toHaveBeenCalled();
      expect(buyerRepository.updateNotificationPreferences).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid preferences structure', async () => {
      // Test with invalid preferences structure
      const newPreferences = {
        orderUpdates: {
          invalidField: true
        }
      };

      // Expect the service to throw ValidationError
      await expect(
        updateNotificationPreferencesService.updateNotificationPreferences(mockBuyerId, newPreferences)
      ).rejects.toThrow(ValidationError);

      // Verify repository methods were not called
      expect(buyerRepository.findBuyerWithNotificationPreferences).not.toHaveBeenCalled();
      expect(buyerRepository.updateNotificationPreferences).not.toHaveBeenCalled();
    });

    it('should handle complete preferences update', async () => {
      // Mock existing buyer data
      const mockExistingBuyer = {
        _id: mockBuyerId,
        notificationPreferences: {
          orderUpdates: {
            orderConfirmation: true,
            shippingAndDelivery: true,
            orderCancellation: true,
            refundUpdates: true
          },
          liveShows: {
            allShows: true,
            followedSellers: true,
            recommendedShows: true
          },
          messages: {
            fromSellers: true,
            fromBuyers: true,
            chatReplies: true,
            mentions: true
          },
          communityActivity: {
            postComments: true,
            postLikes: true,
            repliesAndMentions: true
          },
          promotionsAndSales: {
            flashSales: true,
            couponsAndDeals: true,
            trendingProducts: true,
            recommendations: true
          }
        }
      };

      // Mock updated buyer data with all preferences updated
      const mockUpdatedBuyer = {
        _id: mockBuyerId,
        notificationPreferences: {
          orderUpdates: {
            orderConfirmation: false,
            shippingAndDelivery: false,
            orderCancellation: false,
            refundUpdates: false
          },
          liveShows: {
            allShows: false,
            followedSellers: false,
            recommendedShows: false
          },
          messages: {
            fromSellers: false,
            fromBuyers: false,
            chatReplies: false,
            mentions: false
          },
          communityActivity: {
            postComments: false,
            postLikes: false,
            repliesAndMentions: false
          },
          promotionsAndSales: {
            flashSales: false,
            couponsAndDeals: false,
            trendingProducts: false,
            recommendations: false
          }
        }
      };

      // Mock complete new preferences
      const newPreferences = {
        orderUpdates: {
          orderConfirmation: false,
          shippingAndDelivery: false,
          orderCancellation: false,
          refundUpdates: false
        },
        liveShows: {
          allShows: false,
          followedSellers: false,
          recommendedShows: false
        },
        messages: {
          fromSellers: false,
          fromBuyers: false,
          chatReplies: false,
          mentions: false
        },
        communityActivity: {
          postComments: false,
          postLikes: false,
          repliesAndMentions: false
        },
        promotionsAndSales: {
          flashSales: false,
          couponsAndDeals: false,
          trendingProducts: false,
          recommendations: false
        }
      };

      // Mock repository methods
      buyerRepository.findBuyerWithNotificationPreferences.mockResolvedValue(mockExistingBuyer);
      buyerRepository.updateNotificationPreferences.mockResolvedValue(mockUpdatedBuyer);

      // Call the service
      const result = await updateNotificationPreferencesService.updateNotificationPreferences(mockBuyerId, newPreferences);

      // Verify the result
      expect(result).toEqual({
        data: {
          preferences: mockUpdatedBuyer.notificationPreferences
        }
      });

      // Verify repository methods were called with correct parameters
      expect(buyerRepository.findBuyerWithNotificationPreferences).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateNotificationPreferences).toHaveBeenCalledWith(mockBuyerId, expect.any(Object));
    });
  });
}); 