const mongoose = require('mongoose');
const { validateBuyerId, validateGetActivityStatusData } = require('@modules/buyer/validators/getActivityStatus.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Get Activity Status Validator', () => {
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

  describe('validateGetActivityStatusData', () => {
    it('should not throw error for valid data', async () => {
      const validData = {
        buyerId: '507f1f77bcf86cd799439011'
      };

      await expect(validateGetActivityStatusData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError for missing buyerId', async () => {
      const invalidData = {};

      await expect(validateGetActivityStatusData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for null buyerId', async () => {
      const invalidData = {
        buyerId: null
      };

      await expect(validateGetActivityStatusData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined buyerId', async () => {
      const invalidData = {
        buyerId: undefined
      };

      await expect(validateGetActivityStatusData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string buyerId', async () => {
      const invalidData = {
        buyerId: ''
      };

      await expect(validateGetActivityStatusData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string buyerId', async () => {
      const invalidData = {
        buyerId: 123
      };

      await expect(validateGetActivityStatusData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid ObjectId format buyerId', async () => {
      const invalidData = {
        buyerId: 'invalid-id'
      };

      await expect(validateGetActivityStatusData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing buyerId', async () => {
        await expect(validateGetActivityStatusData({})).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for null buyerId', async () => {
        await expect(validateGetActivityStatusData({ buyerId: null })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for undefined buyerId', async () => {
        await expect(validateGetActivityStatusData({ buyerId: undefined })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for empty string buyerId', async () => {
        await expect(validateGetActivityStatusData({ buyerId: '' })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for non-string buyerId', async () => {
        await expect(validateGetActivityStatusData({ buyerId: 123 })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID must be a string' }]
        });
      });

      it('should include specific error message for invalid ObjectId format buyerId', async () => {
        await expect(validateGetActivityStatusData({ buyerId: 'invalid-id' })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Invalid buyer ID format' }]
        });
      });
    });
  });
});
