const verifyPhoneOTPValidator = require('@modules/buyer/validators/verifyPhoneOTP.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('verifyPhoneOTP.validator', () => {
  describe('validateOTPFormat', () => {
    it('should pass validation for valid 6-digit OTP', () => {
      expect(() => {
        verifyPhoneOTPValidator.validateOTPFormat('123456');
      }).not.toThrow();
    });

    it('should throw ValidationError for missing OTP', () => {
      expect(() => {
        verifyPhoneOTPValidator.validateOTPFormat();
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for null OTP', () => {
      expect(() => {
        verifyPhoneOTPValidator.validateOTPFormat(null);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string OTP', () => {
      expect(() => {
        verifyPhoneOTPValidator.validateOTPFormat('');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string OTP', () => {
      expect(() => {
        verifyPhoneOTPValidator.validateOTPFormat(123456);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for 5-digit OTP', () => {
      expect(() => {
        verifyPhoneOTPValidator.validateOTPFormat('12345');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for 7-digit OTP', () => {
      expect(() => {
        verifyPhoneOTPValidator.validateOTPFormat('1234567');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for OTP with letters', () => {
      expect(() => {
        verifyPhoneOTPValidator.validateOTPFormat('12345a');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for OTP with special characters', () => {
      expect(() => {
        verifyPhoneOTPValidator.validateOTPFormat('12345@');
      }).toThrow(ValidationError);
    });
  });

  describe('validateBuyerId', () => {
    it('should pass validation for valid buyer ID', () => {
      expect(() => {
        verifyPhoneOTPValidator.validateBuyerId('507f1f77bcf86cd799439011');
      }).not.toThrow();
    });

    it('should throw ValidationError for missing buyer ID', () => {
      expect(() => {
        verifyPhoneOTPValidator.validateBuyerId();
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for null buyer ID', () => {
      expect(() => {
        verifyPhoneOTPValidator.validateBuyerId(null);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string buyer ID', () => {
      expect(() => {
        verifyPhoneOTPValidator.validateBuyerId('');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string buyer ID', () => {
      expect(() => {
        verifyPhoneOTPValidator.validateBuyerId(123);
      }).toThrow(ValidationError);
    });
  });

  describe('validateVerifyPhoneOTPData', () => {
    it('should pass validation for valid data', async () => {
      const validData = {
        buyerId: '507f1f77bcf86cd799439011',
        otp: '123456'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError for missing buyer ID', async () => {
      const invalidData = {
        otp: '123456'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for missing OTP', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP is required'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid data', async () => {
      const invalidData = {
        buyerId: 123,
        otp: '12345'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid buyer ID format', async () => {
      const invalidData = {
        buyerId: 'invalid-id',
        otp: '123456'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Invalid buyer ID format'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid OTP format', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        otp: '12345'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must be a 6-digit number'
          }
        ]
      });
    });

    it('should throw ValidationError for empty data object', async () => {
      const invalidData = {};

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });
  });

  describe('Specific Error Messages', () => {
    it('should include specific error message for missing buyer ID', async () => {
      const invalidData = {
        otp: '123456'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'buyerId',
              message: 'Buyer ID is required'
            }
          ])
        }));
    });

    it('should include specific error message for null buyer ID', async () => {
      const invalidData = {
        buyerId: null,
        otp: '123456'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'buyerId',
              message: 'Buyer ID is required'
            }
          ])
        }));
    });

    it('should include specific error message for empty string buyer ID', async () => {
      const invalidData = {
        buyerId: '',
        otp: '123456'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'buyerId',
              message: 'Buyer ID is required'
            }
          ])
        }));
    });

    it('should include specific error message for non-string buyer ID', async () => {
      const invalidData = {
        buyerId: 123,
        otp: '123456'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'buyerId',
              message: 'Buyer ID must be a string'
            }
          ])
        }));
    });

    it('should include specific error message for missing OTP', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'otp',
              message: 'OTP is required'
            }
          ])
        }));
    });

    it('should include specific error message for null OTP', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        otp: null
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'otp',
              message: 'OTP is required'
            }
          ])
        }));
    });

    it('should include specific error message for empty string OTP', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        otp: ''
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'otp',
              message: 'OTP is required'
            }
          ])
        }));
    });

    it('should include specific error message for non-string OTP', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        otp: 123456
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'otp',
              message: 'OTP must be a string'
            }
          ])
        }));
    });

    it('should include specific error message for 5-digit OTP', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        otp: '12345'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'otp',
              message: 'OTP must be a 6-digit number'
            }
          ])
        }));
    });

    it('should include specific error message for 7-digit OTP', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        otp: '1234567'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'otp',
              message: 'OTP must be a 6-digit number'
            }
          ])
        }));
    });

    it('should include specific error message for OTP with letters', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        otp: '12345a'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'otp',
              message: 'OTP must be a 6-digit number'
            }
          ])
        }));
    });

    it('should include specific error message for OTP with special characters', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        otp: '12345@'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'otp',
              message: 'OTP must be a 6-digit number'
            }
          ])
        }));
    });

    it('should include error message for invalid buyer ID type', async () => {
      const invalidData = {
        buyerId: 123,
        otp: '123456'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'buyerId',
              message: 'Buyer ID must be a string'
            }
          ])
        }));
    });

    it('should not throw error for valid data', async () => {
      const validData = {
        buyerId: '507f1f77bcf86cd799439011',
        otp: '123456'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(validData))
        .resolves.not.toThrow();
    });
  });
}); 