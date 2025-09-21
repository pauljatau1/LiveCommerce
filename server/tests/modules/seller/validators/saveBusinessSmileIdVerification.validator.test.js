/**
 * Save Business SmileID Verification Validator Tests
 *
 * This test suite validates the saveBusinessSmileIdVerification validator functionality.
 * It ensures that the validator properly validates input data and throws appropriate errors.
 *
 * Test Coverage:
 * - Valid data validation
 * - Required field validation
 * - Data type validation
 * - Business rule validation
 * - Error message validation
 * - Edge case handling
 *
 * @module saveBusinessSmileIdVerificationValidatorTests
 */

const { validateSaveBusinessSmileIdVerificationData } = require('@modules/seller/validators/saveBusinessSmileIdVerification.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Save Business SmileID Verification Validator', () => {
  let validData;

  beforeEach(() => {
    // Valid verification data
    validData = {
      smileIdResult: {
        ResultCode: '1012',
        success: true,
        images: ['image1.jpg', 'image2.jpg']
      },
      accountType: 'business',
      verifiedAt: '2024-01-15T10:30:00.000Z',
      verificationProvider: 'SmileID'
    };
  });

  describe('validateSaveBusinessSmileIdVerificationData', () => {
    it('should pass validation with valid data', () => {
      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(validData)).not.toThrow();
    });

    it('should pass validation with minimal valid data', () => {
      // Arrange
      const minimalData = {
        smileIdResult: {
          ResultCode: '1012'
        },
        accountType: 'business',
        verifiedAt: '2024-01-15T10:30:00.000Z',
        verificationProvider: 'SmileID'
      };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(minimalData)).not.toThrow();
    });

    it('should pass validation with success flag only', () => {
      // Arrange
      const successFlagData = {
        smileIdResult: {
          success: true
        },
        accountType: 'business',
        verifiedAt: '2024-01-15T10:30:00.000Z',
        verificationProvider: 'SmileID'
      };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(successFlagData)).not.toThrow();
    });

    it('should pass validation with images only', () => {
      // Arrange
      const imagesData = {
        smileIdResult: {
          images: ['image1.jpg', 'image2.jpg']
        },
        accountType: 'business',
        verifiedAt: '2024-01-15T10:30:00.000Z',
        verificationProvider: 'SmileID'
      };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(imagesData)).not.toThrow();
    });
  });

  describe('smileIdResult validation', () => {
    it('should throw error when smileIdResult is missing', () => {
      // Arrange
      const invalidData = { ...validData };
      delete invalidData.smileIdResult;

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'smileIdResult', message: 'SmileID result is required' }
        ]);
      }
    });

    it('should throw error when smileIdResult is null', () => {
      // Arrange
      const invalidData = { ...validData, smileIdResult: null };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'smileIdResult', message: 'SmileID result is required' }
        ]);
      }
    });

    it('should throw error when smileIdResult is not an object', () => {
      // Arrange
      const invalidData = { ...validData, smileIdResult: 'not an object' };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'smileIdResult', message: 'SmileID result must be an object' }
        ]);
      }
    });

    it('should throw error when smileIdResult has no valid properties', () => {
      // Arrange
      const invalidData = { ...validData, smileIdResult: {} };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'smileIdResult', message: 'SmileID result must contain ResultCode, success, or images property' }
        ]);
      }
    });

    it('should throw error when smileIdResult has invalid properties', () => {
      // Arrange
      const invalidData = { ...validData, smileIdResult: { invalidProperty: 'value' } };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'smileIdResult', message: 'SmileID result must contain ResultCode, success, or images property' }
        ]);
      }
    });
  });

  describe('accountType validation', () => {
    it('should throw error when accountType is missing', () => {
      // Arrange
      const invalidData = { ...validData };
      delete invalidData.accountType;

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'accountType', message: 'Account type is required' }
        ]);
      }
    });

    it('should throw error when accountType is null', () => {
      // Arrange
      const invalidData = { ...validData, accountType: null };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'accountType', message: 'Account type is required' }
        ]);
      }
    });

    it('should throw error when accountType is not "business"', () => {
      // Arrange
      const invalidData = { ...validData, accountType: 'individual' };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'accountType', message: 'Account type must be "business" for business verification' }
        ]);
      }
    });

    it('should throw error when accountType is empty string', () => {
      // Arrange
      const invalidData = { ...validData, accountType: '' };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'accountType', message: 'Account type is required' }
        ]);
      }
    });

    it('should throw error when accountType is invalid value', () => {
      // Arrange
      const invalidData = { ...validData, accountType: 'invalid' };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'accountType', message: 'Account type must be "business" for business verification' }
        ]);
      }
    });
  });

  describe('verificationProvider validation', () => {
    it('should throw error when verificationProvider is missing', () => {
      // Arrange
      const invalidData = { ...validData };
      delete invalidData.verificationProvider;

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'verificationProvider', message: 'Verification provider is required' }
        ]);
      }
    });

    it('should throw error when verificationProvider is null', () => {
      // Arrange
      const invalidData = { ...validData, verificationProvider: null };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'verificationProvider', message: 'Verification provider is required' }
        ]);
      }
    });

    it('should throw error when verificationProvider is not "SmileID"', () => {
      // Arrange
      const invalidData = { ...validData, verificationProvider: 'OtherProvider' };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'verificationProvider', message: 'Verification provider must be "SmileID"' }
        ]);
      }
    });

    it('should throw error when verificationProvider is empty string', () => {
      // Arrange
      const invalidData = { ...validData, verificationProvider: '' };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'verificationProvider', message: 'Verification provider is required' }
        ]);
      }
    });

    it('should throw error when verificationProvider is case sensitive', () => {
      // Arrange
      const invalidData = { ...validData, verificationProvider: 'smileid' };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'verificationProvider', message: 'Verification provider must be "SmileID"' }
        ]);
      }
    });
  });

  describe('verifiedAt validation', () => {
    it('should throw error when verifiedAt is missing', () => {
      // Arrange
      const invalidData = { ...validData };
      delete invalidData.verifiedAt;

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'verifiedAt', message: 'Verified date is required' }
        ]);
      }
    });

    it('should throw error when verifiedAt is null', () => {
      // Arrange
      const invalidData = { ...validData, verifiedAt: null };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'verifiedAt', message: 'Verified date is required' }
        ]);
      }
    });

    it('should throw error when verifiedAt is not a string', () => {
      // Arrange
      const invalidData = { ...validData, verifiedAt: 1234567890 };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'verifiedAt', message: 'Verified date must be a string' }
        ]);
      }
    });

    it('should throw error when verifiedAt is empty string', () => {
      // Arrange
      const invalidData = { ...validData, verifiedAt: '' };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'verifiedAt', message: 'Verified date is required' }
        ]);
      }
    });

    it('should throw error when verifiedAt is invalid date string', () => {
      // Arrange
      const invalidData = { ...validData, verifiedAt: 'invalid-date' };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'verifiedAt', message: 'Verified date must be a valid date string' }
        ]);
      }
    });

    it('should pass validation with valid date formats', () => {
      // Test different valid date formats
      const validDateFormats = [
        '2024-01-15T10:30:00.000Z',
        '2024-01-15T10:30:00Z',
        '2024-01-15 10:30:00',
        '2024-01-15',
        'January 15, 2024',
        '2024/01/15'
      ];

      validDateFormats.forEach(dateFormat => {
        // Arrange
        const validDataWithDate = { ...validData, verifiedAt: dateFormat };

        // Act & Assert
        expect(() => validateSaveBusinessSmileIdVerificationData(validDataWithDate)).not.toThrow();
      });
    });
  });

  describe('multiple validation errors', () => {
    it('should collect multiple validation errors', () => {
      // Arrange
      const invalidData = {
        smileIdResult: null,
        accountType: 'individual',
        verificationProvider: 'OtherProvider',
        verifiedAt: 'invalid-date'
      };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(invalidData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(invalidData);
      } catch (error) {
        expect(error.errors).toHaveLength(4);
        expect(error.errors).toEqual([
          { field: 'smileIdResult', message: 'SmileID result is required' },
          { field: 'accountType', message: 'Account type must be "business" for business verification' },
          { field: 'verificationProvider', message: 'Verification provider must be "SmileID"' },
          { field: 'verifiedAt', message: 'Verified date must be a valid date string' }
        ]);
      }
    });

    it('should collect all validation errors for empty data', () => {
      // Arrange
      const emptyData = {};

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(emptyData))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(emptyData);
      } catch (error) {
        expect(error.errors).toHaveLength(4);
        expect(error.errors).toEqual([
          { field: 'smileIdResult', message: 'SmileID result is required' },
          { field: 'accountType', message: 'Account type is required' },
          { field: 'verificationProvider', message: 'Verification provider is required' },
          { field: 'verifiedAt', message: 'Verified date is required' }
        ]);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle undefined data', () => {
      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(undefined))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(undefined);
      } catch (error) {
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({ field: 'data', message: 'Verification data is required' });
      }
    });

    it('should handle null data', () => {
      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(null))
        .toThrow(ValidationError);

      try {
        validateSaveBusinessSmileIdVerificationData(null);
      } catch (error) {
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({ field: 'data', message: 'Verification data is required' });
      }
    });

    it('should handle data with extra properties', () => {
      // Arrange
      const dataWithExtra = {
        ...validData,
        extraProperty: 'extra value',
        anotherProperty: 123
      };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(dataWithExtra)).not.toThrow();
    });

    it('should handle smileIdResult with all valid properties', () => {
      // Arrange
      const dataWithAllProperties = {
        ...validData,
        smileIdResult: {
          ResultCode: '1012',
          success: true,
          images: ['image1.jpg', 'image2.jpg'],
          additionalData: 'extra data'
        }
      };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(dataWithAllProperties)).not.toThrow();
    });

    it('should handle complex nested smileIdResult', () => {
      // Arrange
      const complexData = {
        ...validData,
        smileIdResult: {
          ResultCode: '1012',
          success: true,
          images: ['image1.jpg', 'image2.jpg'],
          metadata: {
            processed: true,
            timestamp: '2024-01-15T10:30:00.000Z'
          },
          additionalInfo: {
            nested: {
              deep: 'value'
            }
          }
        }
      };

      // Act & Assert
      expect(() => validateSaveBusinessSmileIdVerificationData(complexData)).not.toThrow();
    });
  });
});
