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
          orderShipped: true,
          orderDelivered: true,
          orderCancelled: true,
          orderRefunded: true,
          orderReturned: true
        },
        liveShows: {
          liveShowStarted: true,
          liveShowEnded: true,
          liveShowReminder: true,
          newLiveShow: true
        },
        messages: {
          newMessage: true,
          messageRead: true,
          messageReplied: true
        },
        communityActivity: {
          newFollower: true,
          newFollowing: true,
          newReview: true,
          newComment: true,
          newLike: true
        },
        promotionsAndSales: {
          newPromotion: true,
          flashSale: true,
          discountOffer: true,
          seasonalSale: true,
          newProduct: true
        }
      };

      // Mock new preferences to merge
      const newPreferences = {
        orderUpdates: {
          orderConfirmation: false,
          orderShipped: false
        },
        liveShows: {
          liveShowStarted: false
        },
        messages: {
          messageRead: false,
          messageReplied: false
        }
      };

      // Call the merge function
      const result = updateNotificationPreferencesService.deepMergeNotificationPreferences(
        existingPreferences,
        newPreferences
      );

      // Verify the merge result
      expect(result.orderUpdates.orderConfirmation).toBe(false);
      expect(result.orderUpdates.orderShipped).toBe(false);
      expect(result.orderUpdates.orderDelivered).toBe(true); // Should remain unchanged
      expect(result.orderUpdates.orderCancelled).toBe(true); // Should remain unchanged
      expect(result.orderUpdates.orderRefunded).toBe(true); // Should remain unchanged
      expect(result.orderUpdates.orderReturned).toBe(true); // Should remain unchanged
      
      expect(result.liveShows.liveShowStarted).toBe(false);
      expect(result.liveShows.liveShowEnded).toBe(true); // Should remain unchanged
      expect(result.liveShows.liveShowReminder).toBe(true); // Should remain unchanged
      expect(result.liveShows.newLiveShow).toBe(true); // Should remain unchanged
      
      expect(result.messages.newMessage).toBe(true); // Should remain unchanged
      expect(result.messages.messageRead).toBe(false);
      expect(result.messages.messageReplied).toBe(false);
      
      expect(result.communityActivity.newFollower).toBe(true); // Should remain unchanged
      expect(result.communityActivity.newFollowing).toBe(true); // Should remain unchanged
      expect(result.communityActivity.newReview).toBe(true); // Should remain unchanged
      expect(result.communityActivity.newComment).toBe(true); // Should remain unchanged
      expect(result.communityActivity.newLike).toBe(true); // Should remain unchanged
      
      expect(result.promotionsAndSales.newPromotion).toBe(true); // Should remain unchanged
      expect(result.promotionsAndSales.flashSale).toBe(true); // Should remain unchanged
      expect(result.promotionsAndSales.discountOffer).toBe(true); // Should remain unchanged
      expect(result.promotionsAndSales.seasonalSale).toBe(true); // Should remain unchanged
      expect(result.promotionsAndSales.newProduct).toBe(true); // Should remain unchanged
    });

    it('should handle empty new preferences', () => {
      // Mock existing preferences
      const existingPreferences = {
        orderUpdates: {
          orderConfirmation: true,
          orderShipped: true
        },
        liveShows: {
          liveShowStarted: true,
          liveShowEnded: true
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
          orderShipped: true,
          orderDelivered: true,
          orderCancelled: true,
          orderRefunded: true,
          orderReturned: true
        },
        liveShows: {
          liveShowStarted: true,
          liveShowEnded: true,
          liveShowReminder: true,
          newLiveShow: true
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
      expect(result.orderUpdates.orderShipped).toBe(true); // Should remain unchanged
      expect(result.orderUpdates.orderDelivered).toBe(true); // Should remain unchanged
      expect(result.orderUpdates.orderCancelled).toBe(true); // Should remain unchanged
      expect(result.orderUpdates.orderRefunded).toBe(true); // Should remain unchanged
      expect(result.orderUpdates.orderReturned).toBe(true); // Should remain unchanged
      
      expect(result.liveShows.liveShowStarted).toBe(true); // Should remain unchanged
      expect(result.liveShows.liveShowEnded).toBe(true); // Should remain unchanged
      expect(result.liveShows.liveShowReminder).toBe(true); // Should remain unchanged
      expect(result.liveShows.newLiveShow).toBe(true); // Should remain unchanged
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
            orderShipped: true,
            orderDelivered: true,
            orderCancelled: true,
            orderRefunded: true,
            orderReturned: true
          },
          liveShows: {
            liveShowStarted: true,
            liveShowEnded: true,
            liveShowReminder: true,
            newLiveShow: true
          },
          messages: {
            newMessage: true,
            messageRead: true,
            messageReplied: true
          },
          communityActivity: {
            newFollower: true,
            newFollowing: true,
            newReview: true,
            newComment: true,
            newLike: true
          },
          promotionsAndSales: {
            newPromotion: true,
            flashSale: true,
            discountOffer: true,
            seasonalSale: true,
            newProduct: true
          }
        }
      };

      // Mock updated buyer data
      const mockUpdatedBuyer = {
        _id: mockBuyerId,
        notificationPreferences: {
          orderUpdates: {
            orderConfirmation: false,
            orderShipped: false,
            orderDelivered: true,
            orderCancelled: true,
            orderRefunded: true,
            orderReturned: true
          },
          liveShows: {
            liveShowStarted: true,
            liveShowEnded: true,
            liveShowReminder: true,
            newLiveShow: true
          },
          messages: {
            newMessage: true,
            messageRead: true,
            messageReplied: true
          },
          communityActivity: {
            newFollower: true,
            newFollowing: true,
            newReview: true,
            newComment: true,
            newLike: true
          },
          promotionsAndSales: {
            newPromotion: true,
            flashSale: true,
            discountOffer: true,
            seasonalSale: true,
            newProduct: true
          }
        }
      };

      // Mock new preferences to update
      const newPreferences = {
        orderUpdates: {
          orderConfirmation: false,
          orderShipped: false
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
            orderShipped: true,
            orderDelivered: true
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
            orderShipped: true,
            orderDelivered: true,
            orderCancelled: true,
            orderRefunded: true,
            orderReturned: true
          },
          liveShows: {
            liveShowStarted: true,
            liveShowEnded: true,
            liveShowReminder: true,
            newLiveShow: true
          },
          messages: {
            newMessage: true,
            messageRead: true,
            messageReplied: true
          },
          communityActivity: {
            newFollower: true,
            newFollowing: true,
            newReview: true,
            newComment: true,
            newLike: true
          },
          promotionsAndSales: {
            newPromotion: true,
            flashSale: true,
            discountOffer: true,
            seasonalSale: true,
            newProduct: true
          }
        }
      };

      // Mock updated buyer data with all preferences updated
      const mockUpdatedBuyer = {
        _id: mockBuyerId,
        notificationPreferences: {
          orderUpdates: {
            orderConfirmation: false,
            orderShipped: false,
            orderDelivered: false,
            orderCancelled: false,
            orderRefunded: false,
            orderReturned: false
          },
          liveShows: {
            liveShowStarted: false,
            liveShowEnded: false,
            liveShowReminder: false,
            newLiveShow: false
          },
          messages: {
            newMessage: false,
            messageRead: false,
            messageReplied: false
          },
          communityActivity: {
            newFollower: false,
            newFollowing: false,
            newReview: false,
            newComment: false,
            newLike: false
          },
          promotionsAndSales: {
            newPromotion: false,
            flashSale: false,
            discountOffer: false,
            seasonalSale: false,
            newProduct: false
          }
        }
      };

      // Mock complete new preferences
      const newPreferences = {
        orderUpdates: {
          orderConfirmation: false,
          orderShipped: false,
          orderDelivered: false,
          orderCancelled: false,
          orderRefunded: false,
          orderReturned: false
        },
        liveShows: {
          liveShowStarted: false,
          liveShowEnded: false,
          liveShowReminder: false,
          newLiveShow: false
        },
        messages: {
          newMessage: false,
          messageRead: false,
          messageReplied: false
        },
        communityActivity: {
          newFollower: false,
          newFollowing: false,
          newReview: false,
          newComment: false,
          newLike: false
        },
        promotionsAndSales: {
          newPromotion: false,
          flashSale: false,
          discountOffer: false,
          seasonalSale: false,
          newProduct: false
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