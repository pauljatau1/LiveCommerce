const mongoose = require('mongoose');
const { validateGetOrderDetailsInput } = require('@modules/buyer/validators/getOrderDetails.validator');

describe('Get Order Details Validator', () => {
  describe('validateGetOrderDetailsInput', () => {
    it('should return no errors for valid order ID', () => {
      const validOrderId = new mongoose.Types.ObjectId().toString();
      const data = { id: validOrderId };
      
      const errors = validateGetOrderDetailsInput(data);
      
      expect(errors).toEqual([]);
    });

    it('should return error when data is null', () => {
      const errors = validateGetOrderDetailsInput(null);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'id',
        message: 'Order ID is required'
      });
    });

    it('should return error when data is undefined', () => {
      const errors = validateGetOrderDetailsInput(undefined);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'id',
        message: 'Order ID is required'
      });
    });

    it('should return error when id is missing', () => {
      const data = {};
      const errors = validateGetOrderDetailsInput(data);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'id',
        message: 'Order ID is required'
      });
    });

    it('should return error when id is not a string', () => {
      const data = { id: 123 };
      const errors = validateGetOrderDetailsInput(data);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'id',
        message: 'Order ID must be a string'
      });
    });

    it('should return error when id is not a valid ObjectId', () => {
      const data = { id: 'invalid-id' };
      const errors = validateGetOrderDetailsInput(data);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'id',
        message: 'Invalid order ID format. Order ID must be a valid 24-character hexadecimal string'
      });
    });

    it('should return error when id is empty string', async () => {
      const data = { id: '' };
      const errors = validateGetOrderDetailsInput(data);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'id',
        message: 'Order ID is required'
      });
    });

    it('should return error when id is whitespace only', () => {
      const data = { id: '   ' };
      const errors = validateGetOrderDetailsInput(data);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'id',
        message: 'Order ID cannot be empty'
      });
    });

    it('should return error when id is short string', () => {
      const data = { id: 'abc123' };
      const errors = validateGetOrderDetailsInput(data);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'id',
        message: 'Invalid order ID format. Order ID must be a valid 24-character hexadecimal string'
      });
    });

    it('should return error when id is numeric string', () => {
      const data = { id: '12' };
      const errors = validateGetOrderDetailsInput(data);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'id',
        message: 'Invalid order ID format. Order ID must be a valid 24-character hexadecimal string'
      });
    });

    it('should handle valid ObjectId with whitespace', () => {
      const validOrderId = new mongoose.Types.ObjectId().toString();
      const data = { id: `  ${validOrderId}  ` };
      
      const errors = validateGetOrderDetailsInput(data);
      
      expect(errors).toEqual([]);
    });
  });
}); 