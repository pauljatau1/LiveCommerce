const { validateVerifyOTPData } = require('@modules/buyer/validators/verifyOTP.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Verify OTP Validator', () => {
  describe('validateVerifyOTPData', () => {
    it('should not throw for valid input', async () => {
      const validData = {
        email: 'test@example.com',
        otp: '1234'
      };

      await expect(validateVerifyOTPData(validData)).resolves.not.toThrow();
    });

    it('should not throw for numeric OTP', async () => {
      const validData = {
        email: 'test@example.com',
        otp: 1234
      };

      await expect(validateVerifyOTPData(validData)).resolves.not.toThrow();
    });

    it('should not throw for valid email with subdomain', async () => {
      const validData = {
        email: 'test@subdomain.example.com',
        otp: '1234'
      };

      await expect(validateVerifyOTPData(validData)).resolves.not.toThrow();
    });

    it('should not throw for valid email with numbers', async () => {
      const validData = {
        email: 'test123@example.com',
        otp: '1234'
      };

      await expect(validateVerifyOTPData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError for null data', async () => {
      await expect(validateVerifyOTPData(null)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(null)).rejects.toMatchObject({
        errors: [
          { field: 'email', message: 'Email is required' },
          { field: 'otp', message: 'OTP is required' }
        ]
      });
    });

    it('should throw ValidationError for undefined data', async () => {
      await expect(validateVerifyOTPData(undefined)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(undefined)).rejects.toMatchObject({
        errors: [
          { field: 'email', message: 'Email is required' },
          { field: 'otp', message: 'OTP is required' }
        ]
      });
    });

    it('should throw ValidationError for missing email', async () => {
      const invalidData = {
        otp: '1234'
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email is required' }]
      });
    });

    it('should throw ValidationError for missing OTP', async () => {
      const invalidData = {
        email: 'test@example.com'
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'otp', message: 'OTP is required' }]
      });
    });

    it('should throw ValidationError for empty email', async () => {
      const invalidData = {
        email: '',
        otp: '1234'
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email is required' }]
      });
    });

    it('should throw ValidationError for empty OTP', async () => {
      const invalidData = {
        email: 'test@example.com',
        otp: ''
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'otp', message: 'OTP is required' }]
      });
    });

    it('should throw ValidationError for null email', async () => {
      const invalidData = {
        email: null,
        otp: '1234'
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email is required' }]
      });
    });

    it('should throw ValidationError for null OTP', async () => {
      const invalidData = {
        email: 'test@example.com',
        otp: null
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'otp', message: 'OTP is required' }]
      });
    });

    it('should throw ValidationError for undefined email', async () => {
      const invalidData = {
        email: undefined,
        otp: '1234'
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email is required' }]
      });
    });

    it('should throw ValidationError for undefined OTP', async () => {
      const invalidData = {
        email: 'test@example.com',
        otp: undefined
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'otp', message: 'OTP is required' }]
      });
    });

    it('should throw ValidationError for non-string email', async () => {
      const invalidData = {
        email: 123,
        otp: '1234'
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email must be a string' }]
      });
    });

    it('should throw ValidationError for non-string/non-number OTP', async () => {
      const invalidData = {
        email: 'test@example.com',
        otp: {}
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'otp', message: 'OTP must be a string or number' }]
      });
    });

    it('should throw ValidationError for boolean OTP', async () => {
      const invalidData = {
        email: 'test@example.com',
        otp: true
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'otp', message: 'OTP must be a string or number' }]
      });
    });

    it('should throw ValidationError for array OTP', async () => {
      const invalidData = {
        email: 'test@example.com',
        otp: []
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'otp', message: 'OTP must be a string or number' }]
      });
    });

    it('should throw ValidationError for function OTP', async () => {
      const invalidData = {
        email: 'test@example.com',
        otp: () => {}
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'otp', message: 'OTP must be a string or number' }]
      });
    });

    it('should throw ValidationError for invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        otp: '1234'
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email must be a valid email address' }]
      });
    });

    it('should throw ValidationError for email without @ symbol', async () => {
      const invalidData = {
        email: 'testexample.com',
        otp: '1234'
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'email', message: 'Email must be a valid email address' }]
      });
    });

    it('should throw ValidationError for OTP with wrong length (3 digits)', async () => {
      const invalidData = {
        email: 'test@example.com',
        otp: '123'
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'otp', message: 'OTP must be 4 digits' }]
      });
    });

    it('should throw ValidationError for OTP with wrong length (5 digits)', async () => {
      const invalidData = {
        email: 'test@example.com',
        otp: '12345'
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'otp', message: 'OTP must be 4 digits' }]
      });
    });

    it('should throw ValidationError for numeric OTP with wrong length', async () => {
      const invalidData = {
        email: 'test@example.com',
        otp: 123
      };

      await expect(validateVerifyOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'otp', message: 'OTP must be 4 digits' }]
      });
    });



    describe('Specific Error Messages', () => {
      it('should include specific error message for null data', async () => {
        await expect(validateVerifyOTPData(null)).rejects.toMatchObject({
          errors: [
            { field: 'email', message: 'Email is required' },
            { field: 'otp', message: 'OTP is required' }
          ]
        });
      });

      it('should include specific error message for undefined data', async () => {
        await expect(validateVerifyOTPData(undefined)).rejects.toMatchObject({
          errors: [
            { field: 'email', message: 'Email is required' },
            { field: 'otp', message: 'OTP is required' }
          ]
        });
      });

      it('should include specific error message for missing email', async () => {
        await expect(validateVerifyOTPData({ otp: '1234' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should include specific error message for missing OTP', async () => {
        await expect(validateVerifyOTPData({ email: 'test@example.com' })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP is required' }]
        });
      });

      it('should include specific error message for empty email', async () => {
        await expect(validateVerifyOTPData({ email: '', otp: '1234' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should include specific error message for empty OTP', async () => {
        await expect(validateVerifyOTPData({ email: 'test@example.com', otp: '' })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP is required' }]
        });
      });

      it('should include specific error message for null email', async () => {
        await expect(validateVerifyOTPData({ email: null, otp: '1234' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should include specific error message for null OTP', async () => {
        await expect(validateVerifyOTPData({ email: 'test@example.com', otp: null })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP is required' }]
        });
      });

      it('should include specific error message for undefined email', async () => {
        await expect(validateVerifyOTPData({ email: undefined, otp: '1234' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should include specific error message for undefined OTP', async () => {
        await expect(validateVerifyOTPData({ email: 'test@example.com', otp: undefined })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP is required' }]
        });
      });

      it('should include specific error message for non-string email', async () => {
        await expect(validateVerifyOTPData({ email: 123, otp: '1234' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email must be a string' }]
        });
      });

      it('should include specific error message for non-string/non-number OTP', async () => {
        await expect(validateVerifyOTPData({ email: 'test@example.com', otp: {} })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP must be a string or number' }]
        });
      });

      it('should include specific error message for boolean OTP', async () => {
        await expect(validateVerifyOTPData({ email: 'test@example.com', otp: true })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP must be a string or number' }]
        });
      });

      it('should include specific error message for array OTP', async () => {
        await expect(validateVerifyOTPData({ email: 'test@example.com', otp: [] })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP must be a string or number' }]
        });
      });

      it('should include specific error message for function OTP', async () => {
        await expect(validateVerifyOTPData({ email: 'test@example.com', otp: () => {} })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP must be a string or number' }]
        });
      });

      it('should include specific error message for invalid email format', async () => {
        await expect(validateVerifyOTPData({ email: 'invalid-email', otp: '1234' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email must be a valid email address' }]
        });
      });

      it('should include specific error message for email without @ symbol', async () => {
        await expect(validateVerifyOTPData({ email: 'testexample.com', otp: '1234' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email must be a valid email address' }]
        });
      });

      it('should include specific error message for OTP with wrong length', async () => {
        await expect(validateVerifyOTPData({ email: 'test@example.com', otp: '123' })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP must be 4 digits' }]
        });
      });



      it('should include multiple error messages when both fields are invalid', async () => {
        await expect(validateVerifyOTPData({})).rejects.toMatchObject({
          errors: [
            { field: 'email', message: 'Email is required' },
            { field: 'otp', message: 'OTP is required' }
          ]
        });
      });
    });
  });
}); 