const verifyPhoneOTPValidator = require('../../../../src/modules/buyer/validators/verifyPhoneOTP.validator');
const ValidationError = require('../../../../src/utils/errors/ValidationError');

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

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing OTP', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid buyer ID and OTP', async () => {
      const invalidData = {
        buyerId: 123,
        otp: '12345'
      };

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty data object', async () => {
      const invalidData = {};

      await expect(verifyPhoneOTPValidator.validateVerifyPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
    });
  });
}); 