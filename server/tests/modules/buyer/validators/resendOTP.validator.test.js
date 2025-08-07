const { validateResendOTPInput } = require('@modules/buyer/validators/resendOTP.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('resendOTP.validator', () => {
  describe('validateResendOTPInput', () => {
    it('should not throw error for valid email', () => {
      // Arrange
      const data = { email: 'test@example.com' };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).not.toThrow();
    });

    it('should throw ValidationError when data is null', () => {
      // Arrange
      const data = null;

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError when data is undefined', () => {
      // Arrange
      const data = undefined;

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError when email is missing', () => {
      // Arrange
      const data = {};

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError when email is empty string', () => {
      // Arrange
      const data = { email: '' };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError when email is null', () => {
      // Arrange
      const data = { email: null };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError when email is undefined', () => {
      // Arrange
      const data = { email: undefined };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError when email is not a string', () => {
      // Arrange
      const data = { email: 123 };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError when email is an object', () => {
      // Arrange
      const data = { email: {} };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError when email is an array', () => {
      // Arrange
      const data = { email: [] };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError when email is boolean', () => {
      // Arrange
      const data = { email: true };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError when email is invalid format', () => {
      // Arrange
      const data = { email: 'invalid-email' };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError when email is missing @ symbol', () => {
      // Arrange
      const data = { email: 'testexample.com' };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError when email has @ but no domain', () => {
      // Arrange
      const data = { email: 'test@' };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(ValidationError);
    });

    it('should throw ValidationError when email has @ but no local part', () => {
      // Arrange
      const data = { email: '@example.com' };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(ValidationError);
    });

    it('should not throw error for valid email with subdomain', () => {
      // Arrange
      const data = { email: 'test@sub.example.com' };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).not.toThrow();
    });

    it('should not throw error for valid email with plus sign', () => {
      // Arrange
      const data = { email: 'test+tag@example.com' };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).not.toThrow();
    });

    it('should not throw error for valid email with dots', () => {
      // Arrange
      const data = { email: 'test.name@example.com' };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).not.toThrow();
    });

    it('should not throw error for valid email with numbers', () => {
      // Arrange
      const data = { email: 'test123@example.com' };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).not.toThrow();
    });

    it('should not throw error for valid email with hyphens', () => {
      // Arrange
      const data = { email: 'test-name@example.com' };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).not.toThrow();
    });

    it('should not throw error for valid email with underscores', () => {
      // Arrange
      const data = { email: 'test_name@example.com' };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).not.toThrow();
    });

    it('should throw ValidationError with correct error format for missing email', () => {
      // Arrange
      const data = {};

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(expect.objectContaining({
        errors: [
          { field: 'email', message: 'Email is required' }
        ]
      }));
    });

    it('should throw ValidationError with correct error format for invalid email', () => {
      // Arrange
      const data = { email: 'invalid-email' };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(expect.objectContaining({
        errors: [
          { field: 'email', message: 'Email must be a valid email address' }
        ]
      }));
    });

    it('should throw ValidationError with correct error format for non-string email', () => {
      // Arrange
      const data = { email: 123 };

      // Act & Assert
      expect(() => validateResendOTPInput(data)).toThrow(expect.objectContaining({
        errors: [
          { field: 'email', message: 'Email must be a string' }
        ]
      }));
    });
  });

  describe('Specific Error Messages', () => {
    it('should include specific error message for missing email', () => {
      const data = {};

      expect(() => validateResendOTPInput(data))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email is required'
            }
          ])
        }));
    });

    it('should include specific error message for null email', () => {
      const data = { email: null };

      expect(() => validateResendOTPInput(data))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email is required'
            }
          ])
        }));
    });

    it('should include specific error message for undefined email', () => {
      const data = { email: undefined };

      expect(() => validateResendOTPInput(data))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email is required'
            }
          ])
        }));
    });

    it('should include specific error message for empty string email', () => {
      const data = { email: '' };

      expect(() => validateResendOTPInput(data))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email is required'
            }
          ])
        }));
    });

    it('should include specific error message for non-string email (number)', () => {
      const data = { email: 123 };

      expect(() => validateResendOTPInput(data))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email must be a string'
            }
          ])
        }));
    });

    it('should include specific error message for non-string email (boolean)', () => {
      const data = { email: true };

      expect(() => validateResendOTPInput(data))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email must be a string'
            }
          ])
        }));
    });

    it('should include specific error message for non-string email (object)', () => {
      const data = { email: {} };

      expect(() => validateResendOTPInput(data))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email must be a string'
            }
          ])
        }));
    });

    it('should include specific error message for non-string email (array)', () => {
      const data = { email: [] };

      expect(() => validateResendOTPInput(data))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email must be a string'
            }
          ])
        }));
    });

    it('should include specific error message for email without @ symbol', () => {
      const data = { email: 'invalid-email' };

      expect(() => validateResendOTPInput(data))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email must be a valid email address'
            }
          ])
        }));
    });

    it('should include specific error message for email with multiple @ symbols', () => {
      const data = { email: 'test@@example.com' };

      expect(() => validateResendOTPInput(data))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email must be a valid email address'
            }
          ])
        }));
    });

    it('should include specific error message for email with empty local part', () => {
      const data = { email: '@example.com' };

      expect(() => validateResendOTPInput(data))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email must be a valid email address'
            }
          ])
        }));
    });

    it('should include specific error message for email with empty domain', () => {
      const data = { email: 'test@' };

      expect(() => validateResendOTPInput(data))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email must be a valid email address'
            }
          ])
        }));
    });

    it('should include specific error message for email with missing local part', () => {
      const data = { email: '@example.com' };

      expect(() => validateResendOTPInput(data))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email must be a valid email address'
            }
          ])
        }));
    });

    it('should include specific error message for email with missing domain', () => {
      const data = { email: 'test@' };

      expect(() => validateResendOTPInput(data))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email must be a valid email address'
            }
          ])
        }));
    });

    it('should include specific error message for null data object', () => {
      expect(() => validateResendOTPInput(null))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email is required'
            }
          ])
        }));
    });

    it('should include specific error message for undefined data object', () => {
      expect(() => validateResendOTPInput(undefined))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'email',
              message: 'Email is required'
            }
          ])
        }));
    });

    it('should not throw error for valid email', () => {
      const data = { email: 'test@example.com' };

      expect(() => validateResendOTPInput(data)).not.toThrow();
    });

    it('should not throw error for valid email with subdomain', () => {
      const data = { email: 'test@sub.example.com' };

      expect(() => validateResendOTPInput(data)).not.toThrow();
    });

    it('should not throw error for valid email with plus sign', () => {
      const data = { email: 'test+tag@example.com' };

      expect(() => validateResendOTPInput(data)).not.toThrow();
    });

    it('should not throw error for valid email with dots', () => {
      const data = { email: 'test.name@example.com' };

      expect(() => validateResendOTPInput(data)).not.toThrow();
    });

    it('should not throw error for valid email with numbers', () => {
      const data = { email: 'test123@example.com' };

      expect(() => validateResendOTPInput(data)).not.toThrow();
    });

    it('should not throw error for valid email with hyphens', () => {
      const data = { email: 'test-name@example.com' };

      expect(() => validateResendOTPInput(data)).not.toThrow();
    });

    it('should not throw error for valid email with underscores', () => {
      const data = { email: 'test_name@example.com' };

      expect(() => validateResendOTPInput(data)).not.toThrow();
    });
  });
}); 