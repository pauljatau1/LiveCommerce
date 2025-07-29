const sendPhoneOTPValidator = require('../../../../src/modules/buyer/validators/sendPhoneOTP.validator');
const ValidationError = require('../../../../src/utils/errors/ValidationError');

describe('Send Phone OTP Validator', () => {
  describe('validatePhoneNumberFormat', () => {
    it('should not throw error when phone number is valid with country code', async () => {
      // Act & Assert
      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormat('+2348012345678')
      ).resolves.not.toThrow();

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormat('+1234567890')
      ).resolves.not.toThrow();

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormat('+447911123456')
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError when phone number is missing', async () => {
      // Act & Assert
      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormat(null)
      ).rejects.toThrow(ValidationError);

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormat(undefined)
      ).rejects.toThrow(ValidationError);

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormat('')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when phone number format is invalid', async () => {
      // Act & Assert
      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormat('2348012345678')
      ).rejects.toThrow(ValidationError);

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormat('+2348012345678901234567890')
      ).rejects.toThrow(ValidationError);

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormat('+0')
      ).rejects.toThrow(ValidationError);

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormat('+')
      ).rejects.toThrow(ValidationError);

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormat('1234567890')
      ).rejects.toThrow(ValidationError);

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormat('abc123')
      ).rejects.toThrow(ValidationError);

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormat('+12345678901234567890')
      ).rejects.toThrow(ValidationError);
    });

    it('should include correct error message in ValidationError', async () => {
      try {
        await sendPhoneOTPValidator.validatePhoneNumberFormat('invalid');
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0].field).toBe('phoneNumber');
        expect(error.errors[0].message).toBe('Invalid phone number format. Please include country code (e.g., +1234567890)');
      }
    });

    it('should include correct error message for missing phone number', async () => {
      try {
        await sendPhoneOTPValidator.validatePhoneNumberFormat(null);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0].field).toBe('phoneNumber');
        expect(error.errors[0].message).toBe('Phone number is required');
      }
    });
  });
}); 