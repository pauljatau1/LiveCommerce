const updateNotificationPreferencesValidator = require('@modules/buyer/validators/updateNotificationPreferences.validator');

describe('Update Notification Preferences Validator', () => {
  const buyerId = '507f1f77bcf86cd799439011';
  const preferences = {
    orderUpdates: {
      orderConfirmation: true,
      orderShipped: false
    },
    liveShows: {
      liveShowStarted: true
    },
    messages: {
      newMessage: true
    },
    communityActivity: {
      newFollower: true
    },
    promotionsAndSales: {
      newPromotion: true
    }
  };

  describe('validateUpdateNotificationPreferencesData', () => {
    it('should not throw for valid data', async () => {
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, preferences)).resolves.not.toThrow();
    });

    it('should throw ValidationError for null buyer ID', async () => {
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(null, preferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for undefined buyer ID', async () => {
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(undefined, preferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for empty string buyer ID', async () => {
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData('', preferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for whitespace-only buyer ID', async () => {
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData('   ', preferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID cannot be empty'
          }
        ]
      });
    });

    it('should throw ValidationError for non-string buyer ID', async () => {
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(123, preferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError for null preferences', async () => {
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, null)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences',
            message: 'Notification preferences are required'
          }
        ]
      });
    });

    it('should throw ValidationError for undefined preferences', async () => {
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, undefined)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences',
            message: 'Notification preferences are required'
          }
        ]
      });
    });

    it('should throw ValidationError for array preferences', async () => {
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, [])).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences',
            message: 'Notification preferences must be an object'
          }
        ]
      });
    });

    it('should throw ValidationError for string preferences', async () => {
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, 'invalid')).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences',
            message: 'Notification preferences must be an object'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid orderUpdates type', async () => {
      const invalidPreferences = {
        ...preferences,
        orderUpdates: 'invalid'
      };
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences.orderUpdates',
            message: 'Order updates must be an object'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid liveShows type', async () => {
      const invalidPreferences = {
        ...preferences,
        liveShows: 'invalid'
      };
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences.liveShows',
            message: 'Live shows must be an object'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid messages type', async () => {
      const invalidPreferences = {
        ...preferences,
        messages: 'invalid'
      };
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences.messages',
            message: 'Messages must be an object'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid communityActivity type', async () => {
      const invalidPreferences = {
        ...preferences,
        communityActivity: 'invalid'
      };
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences.communityActivity',
            message: 'Community activity must be an object'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid promotionsAndSales type', async () => {
      const invalidPreferences = {
        ...preferences,
        promotionsAndSales: 'invalid'
      };
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences.promotionsAndSales',
            message: 'Promotions and sales must be an object'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid orderUpdates field', async () => {
      const invalidPreferences = {
        ...preferences,
        orderUpdates: {
          invalidField: true
        }
      };
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences.orderUpdates.invalidField',
            message: "Invalid field 'invalidField' in order updates. Allowed fields: orderConfirmation, orderShipped, orderDelivered, orderCancelled, orderRefunded, orderReturned"
          }
        ]
      });
    });

    it('should throw ValidationError for invalid liveShows field', async () => {
      const invalidPreferences = {
        ...preferences,
        liveShows: {
          invalidField: true
        }
      };
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences.liveShows.invalidField',
            message: "Invalid field 'invalidField' in live shows. Allowed fields: liveShowStarted, liveShowEnded, liveShowReminder, newLiveShow"
          }
        ]
      });
    });

    it('should throw ValidationError for invalid messages field', async () => {
      const invalidPreferences = {
        ...preferences,
        messages: {
          invalidField: true
        }
      };
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences.messages.invalidField',
            message: "Invalid field 'invalidField' in messages. Allowed fields: newMessage, messageRead, messageReplied"
          }
        ]
      });
    });

    it('should throw ValidationError for invalid communityActivity field', async () => {
      const invalidPreferences = {
        ...preferences,
        communityActivity: {
          invalidField: true
        }
      };
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences.communityActivity.invalidField',
            message: "Invalid field 'invalidField' in community activity. Allowed fields: newFollower, newFollowing, newReview, newComment, newLike"
          }
        ]
      });
    });

    it('should throw ValidationError for invalid promotionsAndSales field', async () => {
      const invalidPreferences = {
        ...preferences,
        promotionsAndSales: {
          invalidField: true
        }
      };
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences.promotionsAndSales.invalidField',
            message: "Invalid field 'invalidField' in promotions and sales. Allowed fields: newPromotion, flashSale, discountOffer, seasonalSale, newProduct"
          }
        ]
      });
    });

    it('should throw ValidationError for non-boolean orderUpdates value', async () => {
      const invalidPreferences = {
        ...preferences,
        orderUpdates: {
          orderConfirmation: 'not-a-boolean'
        }
      };
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences.orderUpdates.orderConfirmation',
            message: "Order update preference 'orderConfirmation' must be a boolean"
          }
        ]
      });
    });

    it('should throw ValidationError for non-boolean liveShows value', async () => {
      const invalidPreferences = {
        ...preferences,
        liveShows: {
          liveShowStarted: 'not-a-boolean'
        }
      };
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences.liveShows.liveShowStarted',
            message: "Live show preference 'liveShowStarted' must be a boolean"
          }
        ]
      });
    });

    it('should throw ValidationError for non-boolean messages value', async () => {
      const invalidPreferences = {
        ...preferences,
        messages: {
          newMessage: 'not-a-boolean'
        }
      };
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences.messages.newMessage',
            message: "Message preference 'newMessage' must be a boolean"
          }
        ]
      });
    });

    it('should throw ValidationError for non-boolean communityActivity value', async () => {
      const invalidPreferences = {
        ...preferences,
        communityActivity: {
          newFollower: 'not-a-boolean'
        }
      };
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences.communityActivity.newFollower',
            message: "Community activity preference 'newFollower' must be a boolean"
          }
        ]
      });
    });

    it('should throw ValidationError for non-boolean promotionsAndSales value', async () => {
      const invalidPreferences = {
        ...preferences,
        promotionsAndSales: {
          newPromotion: 'not-a-boolean'
        }
      };
      await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
        errors: [
          {
            field: 'preferences.promotionsAndSales.newPromotion',
            message: "Promotion and sale preference 'newPromotion' must be a boolean"
          }
        ]
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing buyer ID', async () => {
        await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(null, preferences)).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Buyer ID is required'
            }
          ]
        });
      });

      it('should include specific error message for non-string buyer ID', async () => {
        await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(123, preferences)).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Buyer ID must be a string'
            }
          ]
        });
      });

      it('should include specific error message for empty buyer ID', async () => {
        await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData('', preferences)).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Buyer ID is required'
            }
          ]
        });
      });

      it('should include specific error message for missing preferences', async () => {
        await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, null)).rejects.toMatchObject({
          errors: [
            {
              field: 'preferences',
              message: 'Notification preferences are required'
            }
          ]
        });
      });

      it('should include specific error message for non-object preferences', async () => {
        await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, [])).rejects.toMatchObject({
          errors: [
            {
              field: 'preferences',
              message: 'Notification preferences must be an object'
            }
          ]
        });
      });

      it('should include specific error message for invalid orderUpdates type', async () => {
        const invalidPreferences = {
          ...preferences,
          orderUpdates: 'invalid'
        };
        await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
          errors: [
            {
              field: 'preferences.orderUpdates',
              message: 'Order updates must be an object'
            }
          ]
        });
      });

      it('should include specific error message for invalid orderUpdates field', async () => {
        const invalidPreferences = {
          ...preferences,
          orderUpdates: {
            invalidField: true
          }
        };
        await expect(updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, invalidPreferences)).rejects.toMatchObject({
          errors: [
            {
              field: 'preferences.orderUpdates.invalidField',
              message: expect.stringContaining('Invalid field')
            }
          ]
        });
      });
    });
  });
}); 