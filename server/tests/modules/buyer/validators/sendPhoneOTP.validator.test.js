const { validateSendPhoneOTPData } = require('@modules/buyer/validators/sendPhoneOTP.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Send Phone OTP Validator', () => {
  describe('validateSendPhoneOTPData', () => {
    it('should not throw for valid phone number with country code', async () => {
      const validData = { phoneNumber: '+2348012345678' };
      await expect(validateSendPhoneOTPData(validData)).resolves.not.toThrow();
    });

    it('should not throw for valid US phone number', async () => {
      const validData = { phoneNumber: '+1234567890' };
      await expect(validateSendPhoneOTPData(validData)).resolves.not.toThrow();
    });

    it('should not throw for valid UK phone number', async () => {
      const validData = { phoneNumber: '+447911123456' };
      await expect(validateSendPhoneOTPData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError when phoneNumber is null', async () => {
      const invalidData = { phoneNumber: null };
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Phone number is required'
          }
        ]
      });
    });

    it('should throw ValidationError when phoneNumber is undefined', async () => {
      const invalidData = { phoneNumber: undefined };
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Phone number is required'
          }
        ]
      });
    });

    it('should throw ValidationError when phoneNumber is empty string', async () => {
      const invalidData = { phoneNumber: '' };
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Phone number is required'
          }
        ]
      });
    });

    it('should throw ValidationError when phoneNumber is missing country code', async () => {
      const invalidData = { phoneNumber: '2348012345678' };
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
          }
        ]
      });
    });

    it('should throw ValidationError when phoneNumber is too long', async () => {
      const invalidData = { phoneNumber: '+2348012345678901234567890' };
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
          }
        ]
      });
    });

    it('should throw ValidationError when phoneNumber starts with +0', async () => {
      const invalidData = { phoneNumber: '+0' };
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
          }
        ]
      });
    });

    it('should throw ValidationError when phoneNumber is just +', async () => {
      const invalidData = { phoneNumber: '+' };
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
          }
        ]
      });
    });

    it('should throw ValidationError when phoneNumber has no country code', async () => {
      const invalidData = { phoneNumber: '1234567890' };
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
          }
        ]
      });
    });

    it('should throw ValidationError when phoneNumber contains letters', async () => {
      const invalidData = { phoneNumber: 'abc123' };
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
          }
        ]
      });
    });

    it('should throw ValidationError when phoneNumber is extremely long', async () => {
      const invalidData = { phoneNumber: '+12345678901234567890' };
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSendPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
          }
        ]
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for null phone number', async () => {
        await expect(validateSendPhoneOTPData({ phoneNumber: null })).rejects.toMatchObject({
          errors: [{ field: 'phoneNumber', message: 'Phone number is required' }]
        });
      });

      it('should include specific error message for undefined phone number', async () => {
        await expect(validateSendPhoneOTPData({ phoneNumber: undefined })).rejects.toMatchObject({
          errors: [{ field: 'phoneNumber', message: 'Phone number is required' }]
        });
      });

      it('should include specific error message for empty phone number', async () => {
        await expect(validateSendPhoneOTPData({ phoneNumber: '' })).rejects.toMatchObject({
          errors: [{ field: 'phoneNumber', message: 'Phone number is required' }]
        });
      });

      it('should include specific error message for invalid phone number format', async () => {
        await expect(validateSendPhoneOTPData({ phoneNumber: 'invalid' })).rejects.toMatchObject({
          errors: [{ field: 'phoneNumber', message: 'Invalid phone number format. Please include country code (e.g., +1234567890)' }]
        });
      });

      it('should include specific error message for phone number without country code', async () => {
        await expect(validateSendPhoneOTPData({ phoneNumber: '1234567890' })).rejects.toMatchObject({
          errors: [{ field: 'phoneNumber', message: 'Invalid phone number format. Please include country code (e.g., +1234567890)' }]
        });
      });

      it('should include specific error message for phone number starting with +0', async () => {
        await expect(validateSendPhoneOTPData({ phoneNumber: '+0' })).rejects.toMatchObject({
          errors: [{ field: 'phoneNumber', message: 'Invalid phone number format. Please include country code (e.g., +1234567890)' }]
        });
      });
    });
  });
}); 