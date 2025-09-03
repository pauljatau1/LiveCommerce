const sellerValidator = require('@modules/seller/validators/resendOTP.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Resend OTP Validator', () => {

  describe('validateResendOTPData', () => {
    const validResendOTPData = {
      email: 'seller@example.com'
    };

    it('should pass validation with valid data', async () => {
      await expect(sellerValidator.validateResendOTPData(validResendOTPData))
        .resolves.not.toThrow();
    });

    it('should throw ValidationError when data is null', async () => {
      await expect(sellerValidator.validateResendOTPData(null))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when data is undefined', async () => {
      await expect(sellerValidator.validateResendOTPData(undefined))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email is missing', async () => {
      const invalidData = {};

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email is null', async () => {
      const invalidData = {
        email: null
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email is undefined', async () => {
      const invalidData = {
        email: undefined
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email is empty string', async () => {
      const invalidData = {
        email: ''
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email is whitespace only', async () => {
      const invalidData = {
        email: '   '
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email is not a string', async () => {
      const invalidData = {
        email: 123
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email is an object', async () => {
      const invalidData = {
        email: {}
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email is an array', async () => {
      const invalidData = {
        email: []
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email is a boolean', async () => {
      const invalidData = {
        email: true
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email is missing @ symbol', async () => {
      const invalidData = {
        email: 'invalidemail.com'
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email has multiple @ symbols', async () => {
      const invalidData = {
        email: 'test@@example.com'
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email starts with @', async () => {
      const invalidData = {
        email: '@example.com'
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email ends with @', async () => {
      const invalidData = {
        email: 'test@'
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email has empty local part', async () => {
      const invalidData = {
        email: '@example.com'
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email has empty domain part', async () => {
      const invalidData = {
        email: 'test@'
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email has whitespace in local part', async () => {
      const invalidData = {
        email: 'test @example.com'
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email has whitespace in domain part', async () => {
      const invalidData = {
        email: 'test@ example.com'
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should pass validation with valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        '123@numbers.com',
        'user-name@subdomain.example.com',
        'user_name@example.com',
        'user@example-domain.com'
      ];

      for (const email of validEmails) {
        const validData = { email };
        await expect(sellerValidator.validateResendOTPData(validData))
          .resolves.not.toThrow();
      }
    });

    it('should collect all validation errors when multiple issues exist', async () => {
      const invalidData = {
        email: ''
      };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
      
      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
      
      const error = await sellerValidator.validateResendOTPData(invalidData).catch(e => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toHaveLength(1);
      expect(error.errors[0]).toEqual({
        field: 'email',
        message: 'Email is required'
      });
    });

    it('should throw ValidationError with correct error message for missing email', async () => {
      const invalidData = {};

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
      
      const error = await sellerValidator.validateResendOTPData(invalidData).catch(e => e);
      expect(error.errors).toHaveLength(1);
      expect(error.errors[0]).toEqual({
        field: 'email',
        message: 'Email is required'
      });
    });

    it('should throw ValidationError with correct error message for non-string email', async () => {
      const invalidData = { email: 123 };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
      
      const error = await sellerValidator.validateResendOTPData(invalidData).catch(e => e);
      expect(error.errors).toHaveLength(1);
      expect(error.errors[0]).toEqual({
        field: 'email',
        message: 'Email must be a string'
      });
    });

    it('should throw ValidationError with correct error message for invalid email format', async () => {
      const invalidData = { email: 'invalid-email' };

      await expect(sellerValidator.validateResendOTPData(invalidData))
        .rejects.toThrow(ValidationError);
      
      const error = await sellerValidator.validateResendOTPData(invalidData).catch(e => e);
      expect(error.errors).toHaveLength(1);
      expect(error.errors[0]).toEqual({
        field: 'email',
        message: 'Email must be a valid email address'
      });
    });

    it('should handle complex email validation scenarios', async () => {
      const complexEmails = [
        'user.name+tag@subdomain.example.co.uk',
        'test123@test-domain.org',
        'user_name-123@example.com'
      ];

      for (const email of complexEmails) {
        const validData = { email };
        await expect(sellerValidator.validateResendOTPData(validData))
          .resolves.not.toThrow();
      }
    });
  });
});
