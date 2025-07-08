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
  });
}); 