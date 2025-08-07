const mongoose = require('mongoose');
const { validateGetOrderDetailsInput } = require('@modules/buyer/validators/getOrderDetails.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Get Order Details Validator', () => {
  describe('validateGetOrderDetailsInput', () => {
    it('should not throw for valid data', () => {
      const validData = { id: '507f1f77bcf86cd799439011' };
      const errors = validateGetOrderDetailsInput(validData);
      expect(errors).toEqual([]);
    });

    it('should return errors when data is null', () => {
      const errors = validateGetOrderDetailsInput(null);
      expect(errors).toEqual([
        { field: 'id', message: 'Order ID is required' }
      ]);
    });

    it('should return errors when data is undefined', () => {
      const errors = validateGetOrderDetailsInput(undefined);
      expect(errors).toEqual([
        { field: 'id', message: 'Order ID is required' }
      ]);
    });

    it('should return errors when id is missing', () => {
      const data = {};
      const errors = validateGetOrderDetailsInput(data);
      expect(errors).toEqual([
        { field: 'id', message: 'Order ID is required' }
      ]);
    });

    it('should return errors when id is not a string', () => {
      const data = { id: 123 };
      const errors = validateGetOrderDetailsInput(data);
      expect(errors).toEqual([
        { field: 'id', message: 'Order ID must be a string' }
      ]);
    });

    it('should return errors when id is not a valid ObjectId', () => {
      const data = { id: 'invalid-id' };
      const errors = validateGetOrderDetailsInput(data);
      expect(errors).toEqual([
        { field: 'id', message: 'Invalid order ID format. Order ID must be a valid 24-character hexadecimal string' }
      ]);
    });

    it('should return errors when id is empty string', () => {
      const data = { id: '' };
      const errors = validateGetOrderDetailsInput(data);
      expect(errors).toEqual([
        { field: 'id', message: 'Order ID is required' }
      ]);
    });

    it('should return errors when id is whitespace only', () => {
      const data = { id: '   ' };
      const errors = validateGetOrderDetailsInput(data);
      expect(errors).toEqual([
        { field: 'id', message: 'Order ID cannot be empty' }
      ]);
    });

    it('should return errors when id is short string', () => {
      const data = { id: '123' };
      const errors = validateGetOrderDetailsInput(data);
      expect(errors).toEqual([
        { field: 'id', message: 'Invalid order ID format. Order ID must be a valid 24-character hexadecimal string' }
      ]);
    });

    it('should not return errors when id is valid ObjectId format', () => {
      const data = { id: '123456789012345678901234' };
      const errors = validateGetOrderDetailsInput(data);
      expect(errors).toEqual([]);
    });

    it('should not return errors for valid ObjectId with whitespace', () => {
      const validData = { id: '  507f1f77bcf86cd799439011  ' };
      const errors = validateGetOrderDetailsInput(validData);
      expect(errors).toEqual([]);
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for null data', () => {
        const errors = validateGetOrderDetailsInput(null);
        expect(errors).toEqual([
          { field: 'id', message: 'Order ID is required' }
        ]);
      });

      it('should include specific error message for missing order ID', () => {
        const data = {};
        const errors = validateGetOrderDetailsInput(data);
        expect(errors).toEqual([
          { field: 'id', message: 'Order ID is required' }
        ]);
      });

      it('should include specific error message for non-string order ID', () => {
        const data = { id: 123 };
        const errors = validateGetOrderDetailsInput(data);
        expect(errors).toEqual([
          { field: 'id', message: 'Order ID must be a string' }
        ]);
      });

      it('should include specific error message for empty order ID', () => {
        const data = { id: '' };
        const errors = validateGetOrderDetailsInput(data);
        expect(errors).toEqual([
          { field: 'id', message: 'Order ID is required' }
        ]);
      });

      it('should include specific error message for invalid order ID format', () => {
        const data = { id: 'invalid-id' };
        const errors = validateGetOrderDetailsInput(data);
        expect(errors).toEqual([
          { field: 'id', message: 'Invalid order ID format. Order ID must be a valid 24-character hexadecimal string' }
        ]);
      });
    });
  });
}); 