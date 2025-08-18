const { validateResendOTPData } = require('@modules/buyer/validators/resendOTP.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Resend OTP Validator', () => {
  describe('validateResendOTPData', () => {
    it('should not throw for valid email', async () => {
      const validData = { email: 'test@example.com' };
      await expect(validateResendOTPData(validData)).resolves.not.toThrow();
    });

    it('should not throw for valid email with subdomain', async () => {
      const validData = { email: 'test@subdomain.example.com' };
      await expect(validateResendOTPData(validData)).resolves.not.toThrow();
    });

    it('should not throw for valid email with numbers', async () => {
      const validData = { email: 'test123@example.com' };
      await expect(validateResendOTPData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError when data is null', async () => {
      await expect(validateResendOTPData(null)).rejects.toThrow(ValidationError);
      await expect(validateResendOTPData(null)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email is required' }]
      });
    });

    it('should throw ValidationError when data is undefined', async () => {
      await expect(validateResendOTPData(undefined)).rejects.toThrow(ValidationError);
      await expect(validateResendOTPData(undefined)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email is required' }]
      });
    });

    it('should throw ValidationError when email is missing', async () => {
      const invalidData = {};
      await expect(validateResendOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateResendOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email is required' }]
      });
    });

    it('should throw ValidationError when email is empty string', async () => {
      const invalidData = { email: '' };
      await expect(validateResendOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateResendOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email is required' }]
      });
    });

    it('should throw ValidationError when email is null', async () => {
      const invalidData = { email: null };
      await expect(validateResendOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateResendOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email is required' }]
      });
    });

    it('should throw ValidationError when email is undefined', async () => {
      const invalidData = { email: undefined };
      await expect(validateResendOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateResendOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email is required' }]
      });
    });

    it('should throw ValidationError when email is not a string', async () => {
      const invalidData = { email: 123 };
      await expect(validateResendOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateResendOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email must be a string' }]
      });
    });

    it('should throw ValidationError when email is an object', async () => {
      const invalidData = { email: {} };
      await expect(validateResendOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateResendOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email must be a string' }]
      });
    });

    it('should throw ValidationError when email is an array', async () => {
      const invalidData = { email: [] };
      await expect(validateResendOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateResendOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email must be a string' }]
      });
    });

    it('should throw ValidationError when email is boolean', async () => {
      const invalidData = { email: true };
      await expect(validateResendOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateResendOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email must be a string' }]
      });
    });

    it('should throw ValidationError when email is number', async () => {
      const invalidData = { email: 123 };
      await expect(validateResendOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateResendOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email must be a string' }]
      });
    });

    it('should throw ValidationError when email has no @ symbol', async () => {
      const invalidData = { email: 'invalid-email' };
      await expect(validateResendOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateResendOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email must be a valid email address' }]
      });
    });

    it('should throw ValidationError when email has multiple @ symbols', async () => {
      const invalidData = { email: 'test@example@domain.com' };
      await expect(validateResendOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateResendOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email must be a valid email address' }]
      });
    });

    it('should throw ValidationError when email has empty local part', async () => {
      const invalidData = { email: '@example.com' };
      await expect(validateResendOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateResendOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email must be a valid email address' }]
      });
    });

    it('should throw ValidationError when email has empty domain', async () => {
      const invalidData = { email: 'test@' };
      await expect(validateResendOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateResendOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email must be a valid email address' }]
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for null data', async () => {
        await expect(validateResendOTPData(null)).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should include specific error message for undefined data', async () => {
        await expect(validateResendOTPData(undefined)).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should include specific error message for missing email', async () => {
        await expect(validateResendOTPData({})).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should include specific error message for empty email', async () => {
        await expect(validateResendOTPData({ email: '' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should include specific error message for null email', async () => {
        await expect(validateResendOTPData({ email: null })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should include specific error message for undefined email', async () => {
        await expect(validateResendOTPData({ email: undefined })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should include specific error message for non-string email', async () => {
        await expect(validateResendOTPData({ email: 123 })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email must be a string' }]
        });
      });

      it('should include specific error message for object email', async () => {
        await expect(validateResendOTPData({ email: {} })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email must be a string' }]
        });
      });

      it('should include specific error message for array email', async () => {
        await expect(validateResendOTPData({ email: [] })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email must be a string' }]
        });
      });

      it('should include specific error message for boolean email', async () => {
        await expect(validateResendOTPData({ email: true })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email must be a string' }]
        });
      });

      it('should include specific error message for email without @ symbol', async () => {
        await expect(validateResendOTPData({ email: 'invalid-email' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email must be a valid email address' }]
        });
      });

      it('should include specific error message for email with multiple @ symbols', async () => {
        await expect(validateResendOTPData({ email: 'test@example@domain.com' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email must be a valid email address' }]
        });
      });

      it('should include specific error message for email with empty local part', async () => {
        await expect(validateResendOTPData({ email: '@example.com' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email must be a valid email address' }]
        });
      });

      it('should include specific error message for email with empty domain', async () => {
        await expect(validateResendOTPData({ email: 'test@' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email must be a valid email address' }]
        });
      });


    });
  });
}); 