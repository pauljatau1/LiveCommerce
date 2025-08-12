const { validateGetPublicProfileData, validateBuyerId } = require('@modules/buyer/validators/getPublicProfile.validator');
const ValidationError = require('@utils/errors/ValidationError');
const mongoose = require('mongoose');

describe('getPublicProfile.validator', () => {
  describe('validateBuyerId', () => {
    it('should not add error for valid buyer ID', () => {
      const errors = [];
      const validBuyerId = new mongoose.Types.ObjectId().toString();
      
      validateBuyerId(validBuyerId, errors);
      
      expect(errors).toHaveLength(0);
    });

    it('should add error for missing buyer ID', () => {
      const errors = [];
      
      validateBuyerId(null, errors);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'buyerId',
        message: 'Buyer ID is required'
      });
    });

    it('should add error for undefined buyer ID', () => {
      const errors = [];
      
      validateBuyerId(undefined, errors);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'buyerId',
        message: 'Buyer ID is required'
      });
    });

    it('should add error for empty string buyer ID', () => {
      const errors = [];
      
      validateBuyerId('', errors);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'buyerId',
        message: 'Buyer ID is required'
      });
    });

    it('should add error for non-string buyer ID', () => {
      const errors = [];
      
      validateBuyerId(123, errors);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'buyerId',
        message: 'Buyer ID must be a string'
      });
    });

    it('should add error for invalid ObjectId format', () => {
      const errors = [];
      
      validateBuyerId('invalid-id', errors);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'buyerId',
        message: 'Invalid buyer ID format'
      });
    });
  });

  describe('validateGetPublicProfileData', () => {
    it('should not throw error for valid data', async () => {
      const validData = {
        buyerId: new mongoose.Types.ObjectId().toString()
      };
      
      await expect(validateGetPublicProfileData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError for missing buyer ID', async () => {
      const invalidData = {};
      
      await expect(validateGetPublicProfileData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for null buyer ID', async () => {
      const invalidData = { buyerId: null };
      
      await expect(validateGetPublicProfileData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined buyer ID', async () => {
      const invalidData = { buyerId: undefined };
      
      await expect(validateGetPublicProfileData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string buyer ID', async () => {
      const invalidData = { buyerId: '' };
      
      await expect(validateGetPublicProfileData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string buyer ID', async () => {
      const invalidData = { buyerId: 123 };
      
      await expect(validateGetPublicProfileData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid ObjectId format', async () => {
      const invalidData = { buyerId: 'invalid-id' };
      
      await expect(validateGetPublicProfileData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should include correct error details in ValidationError', async () => {
      const invalidData = { buyerId: 'invalid-id' };
      
      try {
        await validateGetPublicProfileData(invalidData);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({
          field: 'buyerId',
          message: 'Invalid buyer ID format'
        });
      }
    });
  });
});
