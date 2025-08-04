const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const getNotificationPreferencesValidator = require('@modules/buyer/validators/getNotificationPreferences.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Get Notification Preferences Validator', () => {
  describe('validateBuyerId', () => {
    it('should pass validation for valid buyer ID', () => {
      // Test with a valid MongoDB ObjectId format
      const validBuyerId = '507f1f77bcf86cd799439011';
      
      // Expect the validation to pass without throwing any error
      expect(() => {
        getNotificationPreferencesValidator.validateBuyerId(validBuyerId);
      }).not.toThrow();
    });

    it('should throw ValidationError for missing buyer ID', () => {
      // Test with undefined buyer ID
      expect(() => {
        getNotificationPreferencesValidator.validateBuyerId();
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for null buyer ID', () => {
      // Test with null buyer ID
      expect(() => {
        getNotificationPreferencesValidator.validateBuyerId(null);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string buyer ID', () => {
      // Test with empty string buyer ID
      expect(() => {
        getNotificationPreferencesValidator.validateBuyerId('');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for whitespace-only buyer ID', () => {
      // Test with whitespace-only buyer ID
      expect(() => {
        getNotificationPreferencesValidator.validateBuyerId('   ');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string buyer ID', () => {
      // Test with numeric buyer ID
      expect(() => {
        getNotificationPreferencesValidator.validateBuyerId(123);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for object buyer ID', () => {
      // Test with object buyer ID
      expect(() => {
        getNotificationPreferencesValidator.validateBuyerId({ id: '123' });
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for array buyer ID', () => {
      // Test with array buyer ID
      expect(() => {
        getNotificationPreferencesValidator.validateBuyerId(['123']);
      }).toThrow(ValidationError);
    });
  });

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
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for null buyer ID', async () => {
      // Test with null buyer ID
      await expect(
        getNotificationPreferencesValidator.validateGetNotificationPreferencesData(null)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string buyer ID', async () => {
      // Test with empty string buyer ID
      await expect(
        getNotificationPreferencesValidator.validateGetNotificationPreferencesData('')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string buyer ID', async () => {
      // Test with numeric buyer ID
      await expect(
        getNotificationPreferencesValidator.validateGetNotificationPreferencesData(123)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for object buyer ID', async () => {
      // Test with object buyer ID
      await expect(
        getNotificationPreferencesValidator.validateGetNotificationPreferencesData({ id: '123' })
      ).rejects.toThrow(ValidationError);
    });
  });
}); 