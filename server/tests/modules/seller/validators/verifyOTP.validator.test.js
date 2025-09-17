const sellerValidator = require('@modules/seller/validators/verifyOTP.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Verify OTP Validator', () => {

  describe('validateVerifyOTPData', () => {
    const validVerifyOTPData = {
      email: 'seller@example.com',
      otp: '1234'
    };

    it('should pass validation with valid data', async () => {
      await expect(sellerValidator.validateVerifyOTPData(validVerifyOTPData))
        .resolves.not.toThrow();
    });

    it('should pass validation with numeric OTP', async () => {
      const dataWithNumericOTP = {
        email: 'seller@example.com',
        otp: 1234
      };

      await expect(sellerValidator.validateVerifyOTPData(dataWithNumericOTP))
        .resolves.not.toThrow();
    });

    it('should throw ValidationError when data is null', async () => {
      await expect(sellerValidator.validateVerifyOTPData(null))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when data is undefined', async () => {
      await expect(sellerValidator.validateVerifyOTPData(undefined))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email is missing', async () => {
      const invalidData = {
        otp: '1234'
      };

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
    });

    it('should throw ValidationError when email is null', async () => {
      const invalidData = {
        email: null,
        otp: '1234'
      };

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email is undefined', async () => {
      const invalidData = {
        email: undefined,
        otp: '1234'
      };

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email is empty string', async () => {
      const invalidData = {
        email: '',
        otp: '1234'
      };

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email is not a string', async () => {
      const invalidData = {
        email: 123,
        otp: '1234'
      };

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email must be a string' }]
        });
    });

    it('should throw ValidationError when email does not contain @ symbol', async () => {
      const invalidData = {
        email: 'invalidemail',
        otp: '1234'
      };

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email must be a valid email address' }]
        });
    });

    it('should throw ValidationError when OTP is missing', async () => {
      const invalidData = {
        email: 'seller@example.com'
      };

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when OTP is null', async () => {
      const invalidData = {
        email: 'seller@example.com',
        otp: null
      };

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when OTP is undefined', async () => {
      const invalidData = {
        email: 'seller@example.com',
        otp: undefined
      };

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when OTP is empty string', async () => {
      const invalidData = {
        email: 'seller@example.com',
        otp: ''
      };

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when OTP is not string or number', async () => {
      const invalidData = {
        email: 'seller@example.com',
        otp: {}
      };

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP must be a string or number' }]
        });
    });

    it('should throw ValidationError when OTP is too short (3 digits)', async () => {
      const invalidData = {
        email: 'seller@example.com',
        otp: '123'
      };

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP must be 4 digits' }]
        });
    });

    it('should throw ValidationError when OTP is too long (5 digits)', async () => {
      const invalidData = {
        email: 'seller@example.com',
        otp: '12345'
      };

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP must be 4 digits' }]
        });
    });

    it('should throw ValidationError when numeric OTP is too short', async () => {
      const invalidData = {
        email: 'seller@example.com',
        otp: 123
      };

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when numeric OTP is too long', async () => {
      const invalidData = {
        email: 'seller@example.com',
        otp: 12345
      };

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when data is empty object', async () => {
      const invalidData = {};

      await expect(sellerValidator.validateVerifyOTPData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should collect multiple validation errors when both email and OTP are invalid', async () => {
      const invalidData = {
        email: 'invalidemail',
        otp: '12'
      };

      try {
        await sellerValidator.validateVerifyOTPData(invalidData);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toHaveLength(2);
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'otp' })
          ])
        );
      }
    });

    it('should collect multiple validation errors when both email and OTP are missing', async () => {
      const invalidData = {};

      try {
        await sellerValidator.validateVerifyOTPData(invalidData);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toHaveLength(2);
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'otp' })
          ])
        );
      }
    });

    it('should handle OTP with leading zeros as string', async () => {
      const validData = {
        email: 'seller@example.com',
        otp: '0123'
      };

      await expect(sellerValidator.validateVerifyOTPData(validData))
        .resolves.not.toThrow();
    });

    it('should handle OTP with leading zeros as number', async () => {
      const validData = {
        email: 'seller@example.com',
        otp: 123
      };

      await expect(sellerValidator.validateVerifyOTPData(validData))
        .rejects.toThrow(ValidationError);
    });

    it('should handle email with multiple @ symbols', async () => {
      const validData = {
        email: 'test@user@example.com',
        otp: '1234'
      };

      await expect(sellerValidator.validateVerifyOTPData(validData))
        .resolves.not.toThrow();
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@' + 'b'.repeat(100) + '.com';
      const validData = {
        email: longEmail,
        otp: '1234'
      };

      await expect(sellerValidator.validateVerifyOTPData(validData))
        .resolves.not.toThrow();
    });
  });
});