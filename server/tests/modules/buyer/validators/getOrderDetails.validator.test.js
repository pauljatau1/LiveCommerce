const mongoose = require('mongoose');
const { validateGetOrderDetailsData } = require('@modules/buyer/validators/getOrderDetails.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Get Order Details Validator', () => {
  describe('validateGetOrderDetailsData', () => {
    it('should not throw for valid data', async () => {
      const validData = { id: '507f1f77bcf86cd799439011' };
      await expect(validateGetOrderDetailsData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError when data is null', async () => {
      await expect(validateGetOrderDetailsData(null)).rejects.toThrow(ValidationError);
      await expect(validateGetOrderDetailsData(null)).rejects.toMatchObject({
        errors: [{ field: 'id', message: 'Order ID is required' }]
      });
    });

    it('should throw ValidationError when data is undefined', async () => {
      await expect(validateGetOrderDetailsData(undefined)).rejects.toThrow(ValidationError);
      await expect(validateGetOrderDetailsData(undefined)).rejects.toMatchObject({
        errors: [{ field: 'id', message: 'Order ID is required' }]
      });
    });

    it('should throw ValidationError when id is missing', async () => {
      const data = {};
      await expect(validateGetOrderDetailsData(data)).rejects.toThrow(ValidationError);
      await expect(validateGetOrderDetailsData(data)).rejects.toMatchObject({
        errors: [{ field: 'id', message: 'Order ID is required' }]
      });
    });

    it('should throw ValidationError when id is not a string', async () => {
      const data = { id: 123 };
      await expect(validateGetOrderDetailsData(data)).rejects.toThrow(ValidationError);
      await expect(validateGetOrderDetailsData(data)).rejects.toMatchObject({
        errors: [{ field: 'id', message: 'Order ID must be a string' }]
      });
    });

    it('should throw ValidationError when id is not a valid ObjectId', async () => {
      const data = { id: 'invalid-id' };
      await expect(validateGetOrderDetailsData(data)).rejects.toThrow(ValidationError);
      await expect(validateGetOrderDetailsData(data)).rejects.toMatchObject({
        errors: [{ field: 'id', message: 'Invalid order ID format. Order ID must be a valid 24-character hexadecimal string' }]
      });
    });

    it('should throw ValidationError when id is empty string', async () => {
      const data = { id: '' };
      await expect(validateGetOrderDetailsData(data)).rejects.toThrow(ValidationError);
      await expect(validateGetOrderDetailsData(data)).rejects.toMatchObject({
        errors: [{ field: 'id', message: 'Order ID is required' }]
      });
    });

    it('should throw ValidationError when id is whitespace only', async () => {
      const data = { id: '   ' };
      await expect(validateGetOrderDetailsData(data)).rejects.toThrow(ValidationError);
      await expect(validateGetOrderDetailsData(data)).rejects.toMatchObject({
        errors: [{ field: 'id', message: 'Order ID cannot be empty' }]
      });
    });

    it('should throw ValidationError when id is short string', async () => {
      const data = { id: '123' };
      await expect(validateGetOrderDetailsData(data)).rejects.toThrow(ValidationError);
      await expect(validateGetOrderDetailsData(data)).rejects.toMatchObject({
        errors: [{ field: 'id', message: 'Invalid order ID format. Order ID must be a valid 24-character hexadecimal string' }]
      });
    });

    it('should not throw when id is valid ObjectId format', async () => {
      const data = { id: '123456789012345678901234' };
      await expect(validateGetOrderDetailsData(data)).resolves.not.toThrow();
    });

    it('should not throw for valid ObjectId with whitespace', async () => {
      const validData = { id: '  507f1f77bcf86cd799439011  ' };
      await expect(validateGetOrderDetailsData(validData)).resolves.not.toThrow();
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for null data', async () => {
        await expect(validateGetOrderDetailsData(null)).rejects.toMatchObject({
          errors: [{ field: 'id', message: 'Order ID is required' }]
        });
      });

      it('should include specific error message for missing order ID', async () => {
        await expect(validateGetOrderDetailsData({})).rejects.toMatchObject({
          errors: [{ field: 'id', message: 'Order ID is required' }]
        });
      });

      it('should include specific error message for non-string order ID', async () => {
        await expect(validateGetOrderDetailsData({ id: 123 })).rejects.toMatchObject({
          errors: [{ field: 'id', message: 'Order ID must be a string' }]
        });
      });

      it('should include specific error message for empty order ID', async () => {
        await expect(validateGetOrderDetailsData({ id: '' })).rejects.toMatchObject({
          errors: [{ field: 'id', message: 'Order ID is required' }]
        });
      });

      it('should include specific error message for invalid order ID format', async () => {
        await expect(validateGetOrderDetailsData({ id: 'invalid-id' })).rejects.toMatchObject({
          errors: [{ field: 'id', message: 'Invalid order ID format. Order ID must be a valid 24-character hexadecimal string' }]
        });
      });
    });
  });
}); 