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
      try {
        validateResendOTPInput(data);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toEqual([
          { field: 'email', message: 'Email is required' }
        ]);
      }
    });

    it('should throw ValidationError with correct error format for invalid email', () => {
      // Arrange
      const data = { email: 'invalid-email' };

      // Act & Assert
      try {
        validateResendOTPInput(data);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toEqual([
          { field: 'email', message: 'Email must be a valid email address' }
        ]);
      }
    });

    it('should throw ValidationError with correct error format for non-string email', () => {
      // Arrange
      const data = { email: 123 };

      // Act & Assert
      try {
        validateResendOTPInput(data);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toEqual([
          { field: 'email', message: 'Email must be a string' }
        ]);
      }
    });
  });
}); 