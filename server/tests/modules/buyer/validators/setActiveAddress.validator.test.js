/**
 * Set Active Address Validator Tests
 *
 * This test suite validates the setActiveAddress validator functionality.
 * It tests input validation, data type validation, and error handling
 * for setting a shipping address as active.
 *
 * Test Coverage:
 * - Valid input data validation
 * - Invalid address ID format validation
 * - Invalid buyer ID format validation
 * - Missing required fields validation
 * - Error message generation
 *
 * @module setActiveAddressValidatorTests
 */

const setActiveAddressValidator = require('../../../../src/modules/buyer/validators/setActiveAddress.validator');
const ValidationError = require('../../../../src/utils/errors/ValidationError');

describe('Set Active Address Validator', () => {
  describe('validateSetActiveAddressData', () => {
    it('should pass validation for valid input data', async () => {
      // Arrange
      const validData = {
        addressId: '507f1f77bcf86cd799439011',
        buyerId: '507f1f77bcf86cd799439012'
      };

      // Act & Assert
      await expect(setActiveAddressValidator.validateSetActiveAddressData(validData))
        .resolves.not.toThrow();
    });

    it('should throw ValidationError for missing addressId', async () => {
      // Arrange
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439012'
      };

      // Act & Assert
      await expect(setActiveAddressValidator.validateSetActiveAddressData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing buyerId', async () => {
      // Arrange
      const invalidData = {
        addressId: '507f1f77bcf86cd799439011'
      };

      // Act & Assert
      await expect(setActiveAddressValidator.validateSetActiveAddressData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty addressId', async () => {
      // Arrange
      const invalidData = {
        addressId: '',
        buyerId: '507f1f77bcf86cd799439012'
      };

      // Act & Assert
      await expect(setActiveAddressValidator.validateSetActiveAddressData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty buyerId', async () => {
      // Arrange
      const invalidData = {
        addressId: '507f1f77bcf86cd799439011',
        buyerId: ''
      };

      // Act & Assert
      await expect(setActiveAddressValidator.validateSetActiveAddressData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid addressId format', async () => {
      // Arrange
      const invalidData = {
        addressId: 'invalid-address-id',
        buyerId: '507f1f77bcf86cd799439012'
      };

      // Act & Assert
      await expect(setActiveAddressValidator.validateSetActiveAddressData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid buyerId format', async () => {
      // Arrange
      const invalidData = {
        addressId: '507f1f77bcf86cd799439011',
        buyerId: 'invalid-buyer-id'
      };

      // Act & Assert
      await expect(setActiveAddressValidator.validateSetActiveAddressData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for null addressId', async () => {
      // Arrange
      const invalidData = {
        addressId: null,
        buyerId: '507f1f77bcf86cd799439012'
      };

      // Act & Assert
      await expect(setActiveAddressValidator.validateSetActiveAddressData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for null buyerId', async () => {
      // Arrange
      const invalidData = {
        addressId: '507f1f77bcf86cd799439011',
        buyerId: null
      };

      // Act & Assert
      await expect(setActiveAddressValidator.validateSetActiveAddressData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined addressId', async () => {
      // Arrange
      const invalidData = {
        addressId: undefined,
        buyerId: '507f1f77bcf86cd799439012'
      };

      // Act & Assert
      await expect(setActiveAddressValidator.validateSetActiveAddressData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined buyerId', async () => {
      // Arrange
      const invalidData = {
        addressId: '507f1f77bcf86cd799439011',
        buyerId: undefined
      };

      // Act & Assert
      await expect(setActiveAddressValidator.validateSetActiveAddressData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string addressId', async () => {
      // Arrange
      const invalidData = {
        addressId: 123,
        buyerId: '507f1f77bcf86cd799439012'
      };

      // Act & Assert
      await expect(setActiveAddressValidator.validateSetActiveAddressData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string buyerId', async () => {
      // Arrange
      const invalidData = {
        addressId: '507f1f77bcf86cd799439011',
        buyerId: 123
      };

      // Act & Assert
      await expect(setActiveAddressValidator.validateSetActiveAddressData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should include detailed error messages in ValidationError', async () => {
      // Arrange
      const invalidData = {
        addressId: 'invalid',
        buyerId: 'invalid'
      };

      // Act & Assert
      try {
        await setActiveAddressValidator.validateSetActiveAddressData(invalidData);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toBeDefined();
        expect(Array.isArray(error.errors)).toBe(true);
        expect(error.errors.length).toBeGreaterThan(0);
        
        // Check that error messages contain field information
        const errorFields = error.errors.map(err => err.field);
        expect(errorFields).toContain('addressId');
        expect(errorFields).toContain('buyerId');
      }
    });
  });
});
