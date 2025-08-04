const updateNotificationPreferencesValidator = require('@modules/buyer/validators/updateNotificationPreferences.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Update Notification Preferences Validator', () => {
  describe('validateBuyerId', () => {
    it('should pass validation for valid buyer ID', () => {
      // Test with valid buyer ID
      const buyerId = '507f1f77bcf86cd799439011';
      
      // Should not throw any error
      expect(() => {
        updateNotificationPreferencesValidator.validateBuyerId(buyerId);
      }).not.toThrow();
    });

    it('should throw ValidationError for null buyer ID', () => {
      // Test with null buyer ID
      expect(() => {
        updateNotificationPreferencesValidator.validateBuyerId(null);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined buyer ID', () => {
      // Test with undefined buyer ID
      expect(() => {
        updateNotificationPreferencesValidator.validateBuyerId(undefined);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string buyer ID', () => {
      // Test with empty string buyer ID
      expect(() => {
        updateNotificationPreferencesValidator.validateBuyerId('');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for whitespace-only buyer ID', () => {
      // Test with whitespace-only buyer ID
      expect(() => {
        updateNotificationPreferencesValidator.validateBuyerId('   ');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string buyer ID', () => {
      // Test with numeric buyer ID
      expect(() => {
        updateNotificationPreferencesValidator.validateBuyerId(123);
      }).toThrow(ValidationError);
    });
  });

  describe('validateNotificationPreferences', () => {
    it('should pass validation for valid preferences object', () => {
      // Test with valid preferences object
      const preferences = {
        orderUpdates: {
          orderConfirmation: true,
          shippingAndDelivery: false
        },
        liveShows: {
          allShows: true,
          followedSellers: false
        }
      };
      
      // Should not throw any error
      expect(() => {
        updateNotificationPreferencesValidator.validateNotificationPreferences(preferences);
      }).not.toThrow();
    });

    it('should throw ValidationError for null preferences', () => {
      // Test with null preferences
      expect(() => {
        updateNotificationPreferencesValidator.validateNotificationPreferences(null);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined preferences', () => {
      // Test with undefined preferences
      expect(() => {
        updateNotificationPreferencesValidator.validateNotificationPreferences(undefined);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for array preferences', () => {
      // Test with array preferences
      expect(() => {
        updateNotificationPreferencesValidator.validateNotificationPreferences([]);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for string preferences', () => {
      // Test with string preferences
      expect(() => {
        updateNotificationPreferencesValidator.validateNotificationPreferences('invalid');
      }).toThrow(ValidationError);
    });
  });

  describe('validateOrderUpdates', () => {
    it('should pass validation for valid orderUpdates object', () => {
      // Test with valid orderUpdates object
      const orderUpdates = {
        orderConfirmation: true,
        shippingAndDelivery: false,
        orderCancellation: true,
        refundUpdates: false
      };
      
      // Should not throw any error
      expect(() => {
        updateNotificationPreferencesValidator.validateOrderUpdates(orderUpdates);
      }).not.toThrow();
    });

    it('should throw ValidationError for invalid field in orderUpdates', () => {
      // Test with invalid field
      const orderUpdates = {
        orderConfirmation: true,
        invalidField: false
      };
      
      expect(() => {
        updateNotificationPreferencesValidator.validateOrderUpdates(orderUpdates);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-boolean value in orderUpdates', () => {
      // Test with non-boolean value
      const orderUpdates = {
        orderConfirmation: 'true'
      };
      
      expect(() => {
        updateNotificationPreferencesValidator.validateOrderUpdates(orderUpdates);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for array orderUpdates', () => {
      // Test with array orderUpdates
      expect(() => {
        updateNotificationPreferencesValidator.validateOrderUpdates([]);
      }).toThrow(ValidationError);
    });
  });

  describe('validateLiveShows', () => {
    it('should pass validation for valid liveShows object', () => {
      // Test with valid liveShows object
      const liveShows = {
        allShows: true,
        followedSellers: false,
        recommendedShows: true
      };
      
      // Should not throw any error
      expect(() => {
        updateNotificationPreferencesValidator.validateLiveShows(liveShows);
      }).not.toThrow();
    });

    it('should throw ValidationError for invalid field in liveShows', () => {
      // Test with invalid field
      const liveShows = {
        allShows: true,
        invalidField: false
      };
      
      expect(() => {
        updateNotificationPreferencesValidator.validateLiveShows(liveShows);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-boolean value in liveShows', () => {
      // Test with non-boolean value
      const liveShows = {
        allShows: 'true'
      };
      
      expect(() => {
        updateNotificationPreferencesValidator.validateLiveShows(liveShows);
      }).toThrow(ValidationError);
    });
  });

  describe('validateMessages', () => {
    it('should pass validation for valid messages object', () => {
      // Test with valid messages object
      const messages = {
        fromSellers: true,
        fromBuyers: false,
        chatReplies: true,
        mentions: false
      };
      
      // Should not throw any error
      expect(() => {
        updateNotificationPreferencesValidator.validateMessages(messages);
      }).not.toThrow();
    });

    it('should throw ValidationError for invalid field in messages', () => {
      // Test with invalid field
      const messages = {
        fromSellers: true,
        invalidField: false
      };
      
      expect(() => {
        updateNotificationPreferencesValidator.validateMessages(messages);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-boolean value in messages', () => {
      // Test with non-boolean value
      const messages = {
        fromSellers: 'true'
      };
      
      expect(() => {
        updateNotificationPreferencesValidator.validateMessages(messages);
      }).toThrow(ValidationError);
    });
  });

  describe('validateCommunityActivity', () => {
    it('should pass validation for valid communityActivity object', () => {
      // Test with valid communityActivity object
      const communityActivity = {
        postComments: true,
        postLikes: false,
        repliesAndMentions: true
      };
      
      // Should not throw any error
      expect(() => {
        updateNotificationPreferencesValidator.validateCommunityActivity(communityActivity);
      }).not.toThrow();
    });

    it('should throw ValidationError for invalid field in communityActivity', () => {
      // Test with invalid field
      const communityActivity = {
        postComments: true,
        invalidField: false
      };
      
      expect(() => {
        updateNotificationPreferencesValidator.validateCommunityActivity(communityActivity);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-boolean value in communityActivity', () => {
      // Test with non-boolean value
      const communityActivity = {
        postComments: 'true'
      };
      
      expect(() => {
        updateNotificationPreferencesValidator.validateCommunityActivity(communityActivity);
      }).toThrow(ValidationError);
    });
  });

  describe('validatePromotionsAndSales', () => {
    it('should pass validation for valid promotionsAndSales object', () => {
      // Test with valid promotionsAndSales object
      const promotionsAndSales = {
        flashSales: true,
        couponsAndDeals: false,
        trendingProducts: true,
        recommendations: false
      };
      
      // Should not throw any error
      expect(() => {
        updateNotificationPreferencesValidator.validatePromotionsAndSales(promotionsAndSales);
      }).not.toThrow();
    });

    it('should throw ValidationError for invalid field in promotionsAndSales', () => {
      // Test with invalid field
      const promotionsAndSales = {
        flashSales: true,
        invalidField: false
      };
      
      expect(() => {
        updateNotificationPreferencesValidator.validatePromotionsAndSales(promotionsAndSales);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-boolean value in promotionsAndSales', () => {
      // Test with non-boolean value
      const promotionsAndSales = {
        flashSales: 'true'
      };
      
      expect(() => {
        updateNotificationPreferencesValidator.validatePromotionsAndSales(promotionsAndSales);
      }).toThrow(ValidationError);
    });
  });

  describe('validateUpdateNotificationPreferencesData', () => {
    it('should pass validation for valid data', async () => {
      // Test with valid data
      const buyerId = '507f1f77bcf86cd799439011';
      const preferences = {
        orderUpdates: {
          orderConfirmation: true,
          shippingAndDelivery: false
        },
        liveShows: {
          allShows: true,
          followedSellers: false
        }
      };
      
      // Should not throw any error
      await expect(
        updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, preferences)
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError for invalid buyer ID', async () => {
      // Test with invalid buyer ID
      const buyerId = '';
      const preferences = {
        orderUpdates: {
          orderConfirmation: true
        }
      };
      
      await expect(
        updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, preferences)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid preferences', async () => {
      // Test with invalid preferences
      const buyerId = '507f1f77bcf86cd799439011';
      const preferences = null;
      
      await expect(
        updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, preferences)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid preferences structure', async () => {
      // Test with invalid preferences structure
      const buyerId = '507f1f77bcf86cd799439011';
      const preferences = {
        orderUpdates: {
          invalidField: true
        }
      };
      
      await expect(
        updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, preferences)
      ).rejects.toThrow(ValidationError);
    });
  });
}); 