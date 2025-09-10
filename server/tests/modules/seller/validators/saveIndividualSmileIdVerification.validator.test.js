/**
 * Save Individual SmileID Verification Validator Tests
 *
 * This test suite validates the saveIndividualSmileIdVerification validator functionality.
 * It ensures that all validation logic is properly implemented and that
 * the validator correctly handles various scenarios and edge cases.
 *
 * Test Coverage:
 * - Valid data validation
 * - Required field validation (smileIdResult, accountType, verifiedAt, verificationProvider)
 * - Data type validation
 * - Business rule validation
 * - Edge cases and error scenarios
 * - Specific validation error messages
 *
 * @module saveIndividualSmileIdVerificationValidatorTests
 */

const { validateSaveIndividualSmileIdVerificationData } = require('@modules/seller/validators/saveIndividualSmileIdVerification.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Save Individual SmileID Verification Validator', () => {
  describe('validateSaveIndividualSmileIdVerificationData', () => {
    const validData = {
      smileIdResult: {
        ResultCode: '1012',
        success: true,
        images: ['image1.jpg', 'image2.jpg']
      },
      accountType: 'individual',
      verifiedAt: '2024-01-15T10:30:00.000Z',
      verificationProvider: 'SmileID'
    };

    it('should pass validation with valid data', () => {
      expect(() => validateSaveIndividualSmileIdVerificationData(validData)).not.toThrow();
    });

    it('should throw ValidationError when smileIdResult is missing', () => {
      const invalidData = {
        accountType: 'individual',
        verifiedAt: '2024-01-15T10:30:00.000Z',
        verificationProvider: 'SmileID'
      };

      expect(() => validateSaveIndividualSmileIdVerificationData(invalidData)).toThrow(ValidationError);
      
      const error = (() => {
        try {
          validateSaveIndividualSmileIdVerificationData(invalidData);
        } catch (e) {
          return e;
        }
      })();
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual([
        { field: 'smileIdResult', message: 'SmileID result is required' }
      ]);
    });

    it('should throw ValidationError when smileIdResult is not an object', () => {
      const invalidData = {
        smileIdResult: 'invalid',
        accountType: 'individual',
        verifiedAt: '2024-01-15T10:30:00.000Z',
        verificationProvider: 'SmileID'
      };

      expect(() => validateSaveIndividualSmileIdVerificationData(invalidData)).toThrow(ValidationError);
      
      const error = (() => {
        try {
          validateSaveIndividualSmileIdVerificationData(invalidData);
        } catch (e) {
          return e;
        }
      })();
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual([
        { field: 'smileIdResult', message: 'SmileID result must be an object' }
      ]);
    });

    it('should throw ValidationError when smileIdResult has no valid properties', () => {
      const invalidData = {
        smileIdResult: {},
        accountType: 'individual',
        verifiedAt: '2024-01-15T10:30:00.000Z',
        verificationProvider: 'SmileID'
      };

      expect(() => validateSaveIndividualSmileIdVerificationData(invalidData)).toThrow(ValidationError);
      
      const error = (() => {
        try {
          validateSaveIndividualSmileIdVerificationData(invalidData);
        } catch (e) {
          return e;
        }
      })();
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual([
        { field: 'smileIdResult', message: 'SmileID result must contain ResultCode, success, or images property' }
      ]);
    });

    it('should pass validation when smileIdResult has ResultCode', () => {
      const validDataWithResultCode = {
        smileIdResult: {
          ResultCode: '1012'
        },
        accountType: 'individual',
        verifiedAt: '2024-01-15T10:30:00.000Z',
        verificationProvider: 'SmileID'
      };

      expect(() => validateSaveIndividualSmileIdVerificationData(validDataWithResultCode)).not.toThrow();
    });

    it('should pass validation when smileIdResult has success', () => {
      const validDataWithSuccess = {
        smileIdResult: {
          success: true
        },
        accountType: 'individual',
        verifiedAt: '2024-01-15T10:30:00.000Z',
        verificationProvider: 'SmileID'
      };

      expect(() => validateSaveIndividualSmileIdVerificationData(validDataWithSuccess)).not.toThrow();
    });

    it('should pass validation when smileIdResult has images', () => {
      const validDataWithImages = {
        smileIdResult: {
          images: ['image1.jpg']
        },
        accountType: 'individual',
        verifiedAt: '2024-01-15T10:30:00.000Z',
        verificationProvider: 'SmileID'
      };

      expect(() => validateSaveIndividualSmileIdVerificationData(validDataWithImages)).not.toThrow();
    });

    it('should throw ValidationError when accountType is missing', () => {
      const invalidData = {
        smileIdResult: {
          ResultCode: '1012'
        },
        verifiedAt: '2024-01-15T10:30:00.000Z',
        verificationProvider: 'SmileID'
      };

      expect(() => validateSaveIndividualSmileIdVerificationData(invalidData)).toThrow(ValidationError);
      
      const error = (() => {
        try {
          validateSaveIndividualSmileIdVerificationData(invalidData);
        } catch (e) {
          return e;
        }
      })();
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual([
        { field: 'accountType', message: 'Account type is required' }
      ]);
    });

    it('should throw ValidationError when accountType is not "individual"', () => {
      const invalidData = {
        smileIdResult: {
          ResultCode: '1012'
        },
        accountType: 'business',
        verifiedAt: '2024-01-15T10:30:00.000Z',
        verificationProvider: 'SmileID'
      };

      expect(() => validateSaveIndividualSmileIdVerificationData(invalidData)).toThrow(ValidationError);
      
      const error = (() => {
        try {
          validateSaveIndividualSmileIdVerificationData(invalidData);
        } catch (e) {
          return e;
        }
      })();
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual([
        { field: 'accountType', message: 'Account type must be "individual" for individual verification' }
      ]);
    });

    it('should throw ValidationError when verificationProvider is missing', () => {
      const invalidData = {
        smileIdResult: {
          ResultCode: '1012'
        },
        accountType: 'individual',
        verifiedAt: '2024-01-15T10:30:00.000Z'
      };

      expect(() => validateSaveIndividualSmileIdVerificationData(invalidData)).toThrow(ValidationError);
      
      const error = (() => {
        try {
          validateSaveIndividualSmileIdVerificationData(invalidData);
        } catch (e) {
          return e;
        }
      })();
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual([
        { field: 'verificationProvider', message: 'Verification provider is required' }
      ]);
    });

    it('should throw ValidationError when verificationProvider is not "SmileID"', () => {
      const invalidData = {
        smileIdResult: {
          ResultCode: '1012'
        },
        accountType: 'individual',
        verifiedAt: '2024-01-15T10:30:00.000Z',
        verificationProvider: 'OtherProvider'
      };

      expect(() => validateSaveIndividualSmileIdVerificationData(invalidData)).toThrow(ValidationError);
      
      const error = (() => {
        try {
          validateSaveIndividualSmileIdVerificationData(invalidData);
        } catch (e) {
          return e;
        }
      })();
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual([
        { field: 'verificationProvider', message: 'Verification provider must be "SmileID"' }
      ]);
    });

    it('should throw ValidationError when verifiedAt is missing', () => {
      const invalidData = {
        smileIdResult: {
          ResultCode: '1012'
        },
        accountType: 'individual',
        verificationProvider: 'SmileID'
      };

      expect(() => validateSaveIndividualSmileIdVerificationData(invalidData)).toThrow(ValidationError);
      
      const error = (() => {
        try {
          validateSaveIndividualSmileIdVerificationData(invalidData);
        } catch (e) {
          return e;
        }
      })();
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual([
        { field: 'verifiedAt', message: 'Verified date is required' }
      ]);
    });

    it('should throw ValidationError when verifiedAt is not a string', () => {
      const invalidData = {
        smileIdResult: {
          ResultCode: '1012'
        },
        accountType: 'individual',
        verifiedAt: 1234567890,
        verificationProvider: 'SmileID'
      };

      expect(() => validateSaveIndividualSmileIdVerificationData(invalidData)).toThrow(ValidationError);
      
      const error = (() => {
        try {
          validateSaveIndividualSmileIdVerificationData(invalidData);
        } catch (e) {
          return e;
        }
      })();
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual([
        { field: 'verifiedAt', message: 'Verified date must be a string' }
      ]);
    });

    it('should throw ValidationError when verifiedAt is not a valid date', () => {
      const invalidData = {
        smileIdResult: {
          ResultCode: '1012'
        },
        accountType: 'individual',
        verifiedAt: 'invalid-date',
        verificationProvider: 'SmileID'
      };

      expect(() => validateSaveIndividualSmileIdVerificationData(invalidData)).toThrow(ValidationError);
      
      const error = (() => {
        try {
          validateSaveIndividualSmileIdVerificationData(invalidData);
        } catch (e) {
          return e;
        }
      })();
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual([
        { field: 'verifiedAt', message: 'Verified date must be a valid date string' }
      ]);
    });

    it('should pass validation with valid date formats', () => {
      const validDateFormats = [
        '2024-01-15T10:30:00.000Z',
        '2024-01-15T10:30:00Z',
        '2024-01-15 10:30:00',
        '2024-01-15'
      ];

      validDateFormats.forEach(dateString => {
        const validDataWithDate = {
          smileIdResult: {
            ResultCode: '1012'
          },
          accountType: 'individual',
          verifiedAt: dateString,
          verificationProvider: 'SmileID'
        };

        expect(() => validateSaveIndividualSmileIdVerificationData(validDataWithDate)).not.toThrow();
      });
    });

    it('should collect all validation errors when multiple issues exist', () => {
      const invalidData = {
        smileIdResult: 'invalid',
        accountType: 'business',
        verifiedAt: 'invalid-date',
        verificationProvider: 'OtherProvider'
      };

      expect(() => validateSaveIndividualSmileIdVerificationData(invalidData)).toThrow(ValidationError);
      
      const error = (() => {
        try {
          validateSaveIndividualSmileIdVerificationData(invalidData);
        } catch (e) {
          return e;
        }
      })();
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toHaveLength(4);
      expect(error.errors).toContainEqual({ field: 'smileIdResult', message: 'SmileID result must be an object' });
      expect(error.errors).toContainEqual({ field: 'accountType', message: 'Account type must be "individual" for individual verification' });
      expect(error.errors).toContainEqual({ field: 'verifiedAt', message: 'Verified date must be a valid date string' });
      expect(error.errors).toContainEqual({ field: 'verificationProvider', message: 'Verification provider must be "SmileID"' });
    });

    it('should handle null values gracefully', () => {
      const invalidData = {
        smileIdResult: null,
        accountType: null,
        verifiedAt: null,
        verificationProvider: null
      };

      expect(() => validateSaveIndividualSmileIdVerificationData(invalidData)).toThrow(ValidationError);
      
      const error = (() => {
        try {
          validateSaveIndividualSmileIdVerificationData(invalidData);
        } catch (e) {
          return e;
        }
      })();
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toHaveLength(4);
    });

    it('should handle undefined values gracefully', () => {
      const invalidData = {};

      expect(() => validateSaveIndividualSmileIdVerificationData(invalidData)).toThrow(ValidationError);
      
      const error = (() => {
        try {
          validateSaveIndividualSmileIdVerificationData(invalidData);
        } catch (e) {
          return e;
        }
      })();
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toHaveLength(4);
    });
  });
});
