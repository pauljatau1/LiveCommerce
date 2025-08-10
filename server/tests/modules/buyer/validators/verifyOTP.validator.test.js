const { validateVerifyOTPInput } = require('@modules/buyer/validators/verifyOTP.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('verifyOTP Validator', () => {
  describe('validateVerifyOTPInput', () => {
    it('should not throw error for valid input', () => {
      // Arrange
      const validData = {
        email: 'test@example.com',
        otp: '1234'
      };

      // Act & Assert
      expect(() => validateVerifyOTPInput(validData)).not.toThrow();
    });

    it('should throw ValidationError for null data', () => {
      // Act & Assert
      expect(() => validateVerifyOTPInput(null)).toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined data', () => {
      // Act & Assert
      expect(() => validateVerifyOTPInput(undefined)).toThrow(ValidationError);
    });

    it('should throw ValidationError for missing email', () => {
      // Arrange
      const data = {
        otp: '1234'
      };

      // Act & Assert
      expect(() => validateVerifyOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError for missing OTP', () => {
      // Arrange
      const data = {
        email: 'test@example.com'
      };

      // Act & Assert
      expect(() => validateVerifyOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid email format', () => {
      // Arrange
      const data = {
        email: 'invalid-email',
        otp: '1234'
      };

      // Act & Assert
      expect(() => validateVerifyOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string email', () => {
      // Arrange
      const data = {
        email: 123,
        otp: '1234'
      };

      // Act & Assert
      expect(() => validateVerifyOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string/non-number OTP', () => {
      // Arrange
      const data = {
        email: 'test@example.com',
        otp: {}
      };

      // Act & Assert
      expect(() => validateVerifyOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError for OTP with wrong length', () => {
      // Arrange
      const data = {
        email: 'test@example.com',
        otp: '123'
      };

      // Act & Assert
      expect(() => validateVerifyOTPInput(data)).toThrow(ValidationError);
    });

    it('should not throw error for numeric OTP', () => {
      // Arrange
      const data = {
        email: 'test@example.com',
        otp: 1234
      };

      // Act & Assert
      expect(() => validateVerifyOTPInput(data)).not.toThrow();
    });

    it('should not throw error for string OTP', () => {
      // Arrange
      const data = {
        email: 'test@example.com',
        otp: '1234'
      };

      // Act & Assert
      expect(() => validateVerifyOTPInput(data)).not.toThrow();
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for null data', () => {
        expect(() => validateVerifyOTPInput(null)).toThrow(expect.objectContaining({
          errors: [
            {
              field: 'email',
              message: 'Email is required'
            },
            {
              field: 'otp',
              message: 'OTP is required'
            }
          ]
        }));
      });

      it('should include specific error message for undefined data', () => {
        expect(() => validateVerifyOTPInput(undefined)).toThrow(expect.objectContaining({
          errors: [
            {
              field: 'email',
              message: 'Email is required'
            },
            {
              field: 'otp',
              message: 'OTP is required'
            }
          ]
        }));
      });

      it('should include specific error message for missing email', () => {
        const data = {
          otp: '1234'
        };

        expect(() => validateVerifyOTPInput(data)).toThrow(expect.objectContaining({
          errors: [
            {
              field: 'email',
              message: 'Email is required'
            }
          ]
        }));
      });

      it('should include specific error message for missing OTP', () => {
        const data = {
          email: 'test@example.com'
        };

        expect(() => validateVerifyOTPInput(data)).toThrow(expect.objectContaining({
          errors: [
            {
              field: 'otp',
              message: 'OTP is required'
            }
          ]
        }));
      });

      it('should include specific error message for invalid email format', () => {
        const data = {
          email: 'invalid-email',
          otp: '1234'
        };

        expect(() => validateVerifyOTPInput(data)).toThrow(expect.objectContaining({
          errors: [
            {
              field: 'email',
              message: 'Email must be a valid email address'
            }
          ]
        }));
      });

      it('should include specific error message for non-string email', () => {
        const data = {
          email: 123,
          otp: '1234'
        };

        expect(() => validateVerifyOTPInput(data)).toThrow(expect.objectContaining({
          errors: [
            {
              field: 'email',
              message: 'Email must be a string'
            }
          ]
        }));
      });

      it('should include specific error message for non-string/non-number OTP', () => {
        const data = {
          email: 'test@example.com',
          otp: {}
        };

        expect(() => validateVerifyOTPInput(data)).toThrow(expect.objectContaining({
          errors: [
            {
              field: 'otp',
              message: 'OTP must be a string or number'
            }
          ]
        }));
      });

      it('should include specific error message for OTP with wrong length', () => {
        const data = {
          email: 'test@example.com',
          otp: '123'
        };

        expect(() => validateVerifyOTPInput(data)).toThrow(expect.objectContaining({
          errors: [
            {
              field: 'otp',
              message: 'OTP must be 4 digits'
            }
          ]
        }));
      });

      it('should include multiple error messages for missing email and OTP', () => {
        const data = {};

        expect(() => validateVerifyOTPInput(data)).toThrow(expect.objectContaining({
          errors: [
            {
              field: 'email',
              message: 'Email is required'
            },
            {
              field: 'otp',
              message: 'OTP is required'
            }
          ]
        }));
      });
    });
  });
}); 