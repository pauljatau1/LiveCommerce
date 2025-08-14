const mongoose = require('mongoose');
const { validateBuyerId, validateToggleActivityStatusData } = require('@modules/buyer/validators/toggleActivityStatus.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Toggle Activity Status Validator', () => {
  describe('validateBuyerId', () => {
    it('should not add error for valid ObjectId string', () => {
      const errors = [];
      
      validateBuyerId(new mongoose.Types.ObjectId().toString(), errors);
      
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

  describe('validateToggleActivityStatusData', () => {
    it('should not throw error for valid data', async () => {
      const validData = {
        buyerId: new mongoose.Types.ObjectId().toString()
      };
      
      await expect(validateToggleActivityStatusData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError for missing buyer ID', async () => {
      const invalidData = {};
      
      await expect(validateToggleActivityStatusData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for null buyer ID', async () => {
      const invalidData = { buyerId: null };
      
      await expect(validateToggleActivityStatusData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined buyer ID', async () => {
      const invalidData = { buyerId: undefined };
      
      await expect(validateToggleActivityStatusData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string buyer ID', async () => {
      const invalidData = { buyerId: '' };
      
      await expect(validateToggleActivityStatusData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string buyer ID', async () => {
      const invalidData = { buyerId: 123 };
      
      await expect(validateToggleActivityStatusData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid ObjectId format', async () => {
      const invalidData = { buyerId: 'invalid-id' };
      
      await expect(validateToggleActivityStatusData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should include correct error details in ValidationError', async () => {
      const invalidData = { buyerId: 'invalid-id' };
      
      await expect(validateToggleActivityStatusData(invalidData)).rejects.toMatchObject({
        errors: [{
          field: 'buyerId',
          message: 'Invalid buyer ID format'
        }]
      });
    });
  });
});
