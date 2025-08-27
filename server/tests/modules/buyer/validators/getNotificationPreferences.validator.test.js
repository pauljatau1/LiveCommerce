const getNotificationPreferencesValidator = require('@modules/buyer/validators/getNotificationPreferences.validator');

describe('Get Notification Preferences Validator', () => {
  describe('validateGetNotificationPreferencesData', () => {
    it('should pass validation for valid buyer ID', async () => {
      // Test with a valid MongoDB ObjectId format
      const validBuyerId = '507f1f77bcf86cd799439011';
      
      // Expect the validation to pass without throwing any error
      await expect(
        getNotificationPreferencesValidator.validateGetNotificationPreferencesData(validBuyerId)
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError for missing buyer ID', async () => {
      // Test with undefined buyer ID
      await expect(
        getNotificationPreferencesValidator.validateGetNotificationPreferencesData()
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for null buyer ID', async () => {
      // Test with null buyer ID
      await expect(
        getNotificationPreferencesValidator.validateGetNotificationPreferencesData(null)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for empty string buyer ID', async () => {
      // Test with empty string buyer ID
      await expect(
        getNotificationPreferencesValidator.validateGetNotificationPreferencesData('')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for non-string buyer ID', async () => {
      // Test with numeric buyer ID
      await expect(
        getNotificationPreferencesValidator.validateGetNotificationPreferencesData(123)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError for object buyer ID', async () => {
      // Test with object buyer ID
      await expect(
        getNotificationPreferencesValidator.validateGetNotificationPreferencesData({ id: '123' })
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError for array buyer ID', async () => {
      // Test with array buyer ID
      await expect(
        getNotificationPreferencesValidator.validateGetNotificationPreferencesData(['123'])
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID must be a string'
          }
        ]
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing buyer ID', async () => {
        await expect(
          getNotificationPreferencesValidator.validateGetNotificationPreferencesData()
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Buyer ID is required'
            }
          ]
        });
      });

      it('should include specific error message for null buyer ID', async () => {
        await expect(
          getNotificationPreferencesValidator.validateGetNotificationPreferencesData(null)
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Buyer ID is required'
            }
          ]
        });
      });

      it('should include specific error message for non-string buyer ID', async () => {
        await expect(
          getNotificationPreferencesValidator.validateGetNotificationPreferencesData(123)
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Buyer ID must be a string'
            }
          ]
        });
      });

      it('should include specific error message for empty buyer ID', async () => {
        await expect(
          getNotificationPreferencesValidator.validateGetNotificationPreferencesData('')
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Buyer ID is required'
            }
          ]
        });
      });
    });
  });
}); 