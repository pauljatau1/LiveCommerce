const { validateVerifyPhoneOTPData, validateOTPFormat, validateBuyerId } = require('@modules/buyer/validators/verifyPhoneOTP.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Verify Phone OTP Validator', () => {
  describe('validateOTPFormat', () => {
    it('should not add error for valid 6-digit OTP', () => {
      const errors = [];
      validateOTPFormat('123456', errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error for missing OTP', () => {
      const errors = [];
      validateOTPFormat(undefined, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'otp', message: 'OTP is required' });
    });

    it('should add error for null OTP', () => {
      const errors = [];
      validateOTPFormat(null, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'otp', message: 'OTP is required' });
    });

    it('should add error for empty string OTP', () => {
      const errors = [];
      validateOTPFormat('', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'otp', message: 'OTP is required' });
    });

    it('should add error for non-string OTP', () => {
      const errors = [];
      validateOTPFormat(123456, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'otp', message: 'OTP must be a string' });
    });

    it('should add error for 5-digit OTP', () => {
      const errors = [];
      validateOTPFormat('12345', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'otp', message: 'OTP must be a 6-digit number' });
    });

    it('should add error for 7-digit OTP', () => {
      const errors = [];
      validateOTPFormat('1234567', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'otp', message: 'OTP must be a 6-digit number' });
    });

    it('should add error for OTP with letters', () => {
      const errors = [];
      validateOTPFormat('12345a', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'otp', message: 'OTP must be a 6-digit number' });
    });

    it('should add error for OTP with special characters', () => {
      const errors = [];
      validateOTPFormat('12345@', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'otp', message: 'OTP must be a 6-digit number' });
    });
  });

  describe('validateBuyerId', () => {
    it('should not add error for valid ObjectId', () => {
      const errors = [];
      validateBuyerId('507f1f77bcf86cd799439011', errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error for missing buyer ID', () => {
      const errors = [];
      validateBuyerId(undefined, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'buyerId', message: 'Buyer ID is required' });
    });

    it('should add error for null buyer ID', () => {
      const errors = [];
      validateBuyerId(null, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'buyerId', message: 'Buyer ID is required' });
    });

    it('should add error for empty string buyer ID', () => {
      const errors = [];
      validateBuyerId('', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'buyerId', message: 'Buyer ID is required' });
    });

    it('should add error for non-string buyer ID', () => {
      const errors = [];
      validateBuyerId(123, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'buyerId', message: 'Buyer ID must be a string' });
    });

    it('should add error for invalid ObjectId format', () => {
      const errors = [];
      validateBuyerId('invalid-id', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'buyerId', message: 'Invalid buyer ID format' });
    });
  });

  describe('validateVerifyPhoneOTPData', () => {
    it('should not throw for valid data', async () => {
      const validData = {
        otp: '123456',
        buyerId: '507f1f77bcf86cd799439011'
      };

      await expect(validateVerifyPhoneOTPData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError for missing OTP', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011'
      };

      await expect(validateVerifyPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'otp', message: 'OTP is required' }]
      });
    });

    it('should throw ValidationError for missing buyerId', async () => {
      const invalidData = {
        otp: '123456'
      };

      await expect(validateVerifyPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
      });
    });

    it('should throw ValidationError for invalid data', async () => {
      const invalidData = {
        otp: 123456,
        buyerId: 123
      };

      await expect(validateVerifyPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: expect.arrayContaining([
          { field: 'buyerId', message: 'Buyer ID must be a string' },
          { field: 'otp', message: 'OTP must be a string' }
        ])
      });
    });

    it('should throw ValidationError for empty data object', async () => {
      const invalidData = {};

      await expect(validateVerifyPhoneOTPData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateVerifyPhoneOTPData(invalidData)).rejects.toMatchObject({
        errors: expect.arrayContaining([
          { field: 'buyerId', message: 'Buyer ID is required' },
          { field: 'otp', message: 'OTP is required' }
        ])
      });
    });

    it('should throw ValidationError for null data', async () => {
      await expect(validateVerifyPhoneOTPData(null)).rejects.toThrow(ValidationError);
      await expect(validateVerifyPhoneOTPData(null)).rejects.toMatchObject({
        errors: [{ field: 'data', message: 'Request data is required' }]
      });
    });

    it('should throw ValidationError for undefined data', async () => {
      await expect(validateVerifyPhoneOTPData(undefined)).rejects.toThrow(ValidationError);
      await expect(validateVerifyPhoneOTPData(undefined)).rejects.toMatchObject({
        errors: [{ field: 'data', message: 'Request data is required' }]
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing OTP', async () => {
        await expect(validateVerifyPhoneOTPData({ buyerId: '507f1f77bcf86cd799439011' })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP is required' }]
        });
      });

      it('should include specific error message for null OTP', async () => {
        await expect(validateVerifyPhoneOTPData({ otp: null, buyerId: '507f1f77bcf86cd799439011' })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP is required' }]
        });
      });

      it('should include specific error message for undefined OTP', async () => {
        await expect(validateVerifyPhoneOTPData({ otp: undefined, buyerId: '507f1f77bcf86cd799439011' })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP is required' }]
        });
      });

      it('should include specific error message for empty string OTP', async () => {
        await expect(validateVerifyPhoneOTPData({ otp: '', buyerId: '507f1f77bcf86cd799439011' })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP is required' }]
        });
      });

      it('should include specific error message for non-string OTP', async () => {
        await expect(validateVerifyPhoneOTPData({ otp: 123456, buyerId: '507f1f77bcf86cd799439011' })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP must be a string' }]
        });
      });

      it('should include specific error message for 5-digit OTP', async () => {
        await expect(validateVerifyPhoneOTPData({ otp: '12345', buyerId: '507f1f77bcf86cd799439011' })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP must be a 6-digit number' }]
        });
      });

      it('should include specific error message for 7-digit OTP', async () => {
        await expect(validateVerifyPhoneOTPData({ otp: '1234567', buyerId: '507f1f77bcf86cd799439011' })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP must be a 6-digit number' }]
        });
      });

      it('should include specific error message for OTP with letters', async () => {
        await expect(validateVerifyPhoneOTPData({ otp: '12345a', buyerId: '507f1f77bcf86cd799439011' })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP must be a 6-digit number' }]
        });
      });

      it('should include specific error message for OTP with special characters', async () => {
        await expect(validateVerifyPhoneOTPData({ otp: '12345@', buyerId: '507f1f77bcf86cd799439011' })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP must be a 6-digit number' }]
        });
      });

      it('should include specific error message for missing buyerId', async () => {
        await expect(validateVerifyPhoneOTPData({ otp: '123456' })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for null buyerId', async () => {
        await expect(validateVerifyPhoneOTPData({ otp: '123456', buyerId: null })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for undefined buyerId', async () => {
        await expect(validateVerifyPhoneOTPData({ otp: '123456', buyerId: undefined })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for empty string buyerId', async () => {
        await expect(validateVerifyPhoneOTPData({ otp: '123456', buyerId: '' })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for non-string buyerId', async () => {
        await expect(validateVerifyPhoneOTPData({ otp: '123456', buyerId: 123 })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID must be a string' }]
        });
      });

      it('should include specific error message for invalid ObjectId format buyerId', async () => {
        await expect(validateVerifyPhoneOTPData({ otp: '123456', buyerId: 'invalid-id' })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Invalid buyer ID format' }]
        });
      });

      it('should include multiple error messages for multiple validation failures', async () => {
        await expect(validateVerifyPhoneOTPData({ otp: '12345a', buyerId: 'invalid-id' })).rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'otp', message: 'OTP must be a 6-digit number' },
            { field: 'buyerId', message: 'Invalid buyer ID format' }
          ])
        });
      });
    });
  });
}); 