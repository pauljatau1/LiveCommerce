const sendPhoneOTPValidator = require('@modules/buyer/validators/sendPhoneOTP.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Send Phone OTP Validator', () => {
  describe('validatePhoneNumberFormatAndThrow', () => {
    it('should not throw error when phone number is valid with country code', async () => {
      // Act & Assert
      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow('+2348012345678')
      ).resolves.not.toThrow();

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow('+1234567890')
      ).resolves.not.toThrow();

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow('+447911123456')
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError when phone number is missing', async () => {
      // Act & Assert
      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow(null)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Phone number is required'
          }
        ]
      });

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow(undefined)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Phone number is required'
          }
        ]
      });

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow('')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Phone number is required'
          }
        ]
      });
    });

    it('should throw ValidationError when phone number format is invalid', async () => {
      // Act & Assert
      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow('2348012345678')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
          }
        ]
      });

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow('+2348012345678901234567890')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
          }
        ]
      });

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow('+0')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
          }
        ]
      });

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow('+')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
          }
        ]
      });

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow('1234567890')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
          }
        ]
      });

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow('abc123')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
          }
        ]
      });

      await expect(
        sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow('+12345678901234567890')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
          }
        ]
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing phone number', async () => {
        await expect(
          sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow(null)
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'phoneNumber',
              message: 'Phone number is required'
            }
          ]
        });
      });

      it('should include specific error message for undefined phone number', async () => {
        await expect(
          sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow(undefined)
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'phoneNumber',
              message: 'Phone number is required'
            }
          ]
        });
      });

      it('should include specific error message for empty phone number', async () => {
        await expect(
          sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow('')
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'phoneNumber',
              message: 'Phone number is required'
            }
          ]
        });
      });

      it('should include specific error message for invalid phone number format', async () => {
        await expect(
          sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow('invalid')
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'phoneNumber',
              message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
            }
          ]
        });
      });

      it('should include specific error message for phone number without country code', async () => {
        await expect(
          sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow('1234567890')
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'phoneNumber',
              message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
            }
          ]
        });
      });

      it('should include specific error message for phone number with invalid country code', async () => {
        await expect(
          sendPhoneOTPValidator.validatePhoneNumberFormatAndThrow('+0')
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'phoneNumber',
              message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
            }
          ]
        });
      });
    });
  });
}); 