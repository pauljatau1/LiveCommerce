const getSellerReviewsValidator = require('@modules/buyer/validators/getSellerReviews.validator');

describe('Get Seller Reviews Validator', () => {
  describe('validateGetSellerReviewsData', () => {
    it('should pass validation for valid data', async () => {
      // Test with valid seller ID and sort parameter
      const validSellerId = '507f1f77bcf86cd799439011';
      const validParams = { sort: 'recent' };
      
      // Expect the validation to pass without throwing any error
      await expect(getSellerReviewsValidator.validateGetSellerReviewsData(validSellerId, validParams)).resolves.not.toThrow();
    });

    it('should pass validation for valid data with different sort options', async () => {
      // Test with different valid sort options
      const validSellerId = '507f1f77bcf86cd799439011';
      const validSortOptions = ['recent', 'rating-high', 'rating-low'];
      
      for (const sort of validSortOptions) {
        const validParams = { sort };
        await expect(getSellerReviewsValidator.validateGetSellerReviewsData(validSellerId, validParams)).resolves.not.toThrow();
      }
    });

    it('should pass validation for valid data with empty sort', async () => {
      // Test with empty sort parameter
      const validSellerId = '507f1f77bcf86cd799439011';
      const validParams = { sort: '' };
      
      await expect(getSellerReviewsValidator.validateGetSellerReviewsData(validSellerId, validParams)).resolves.not.toThrow();
    });

    it('should pass validation for valid data with undefined sort', async () => {
      // Test with undefined sort parameter
      const validSellerId = '507f1f77bcf86cd799439011';
      const validParams = { sort: undefined };
      
      await expect(getSellerReviewsValidator.validateGetSellerReviewsData(validSellerId, validParams)).resolves.not.toThrow();
    });

    it('should pass validation for valid data with null sort', async () => {
      // Test with null sort parameter
      const validSellerId = '507f1f77bcf86cd799439011';
      const validParams = { sort: null };
      
      await expect(getSellerReviewsValidator.validateGetSellerReviewsData(validSellerId, validParams)).resolves.not.toThrow();
    });

    it('should throw ValidationError for missing seller ID', async () => {
      // Test with missing seller ID
      const validParams = { sort: 'recent' };
      
      await expect(getSellerReviewsValidator.validateGetSellerReviewsData(undefined, validParams)).rejects.toMatchObject({
        errors: [
          {
            field: 'sellerId',
            message: 'Seller ID is required and must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError for null seller ID', async () => {
      // Test with null seller ID
      const validParams = { sort: 'recent' };
      
      await expect(getSellerReviewsValidator.validateGetSellerReviewsData(null, validParams)).rejects.toMatchObject({
        errors: [
          {
            field: 'sellerId',
            message: 'Seller ID is required and must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError for empty string seller ID', async () => {
      // Test with empty string seller ID
      const validParams = { sort: 'recent' };
      
      await expect(getSellerReviewsValidator.validateGetSellerReviewsData('', validParams)).rejects.toMatchObject({
        errors: [
          {
            field: 'sellerId',
            message: 'Seller ID is required and must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError for non-string seller ID', async () => {
      // Test with numeric seller ID
      const validParams = { sort: 'recent' };
      
      await expect(getSellerReviewsValidator.validateGetSellerReviewsData(123, validParams)).rejects.toMatchObject({
        errors: [
          {
            field: 'sellerId',
            message: 'Seller ID is required and must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError for object seller ID', async () => {
      // Test with object seller ID
      const validParams = { sort: 'recent' };
      
      await expect(getSellerReviewsValidator.validateGetSellerReviewsData({ id: '123' }, validParams)).rejects.toMatchObject({
        errors: [
          {
            field: 'sellerId',
            message: 'Seller ID is required and must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid sort option', async () => {
      // Test with invalid sort option
      const validSellerId = '507f1f77bcf86cd799439011';
      const invalidParams = { sort: 'invalid-sort' };
      
      await expect(getSellerReviewsValidator.validateGetSellerReviewsData(validSellerId, invalidParams)).rejects.toMatchObject({
        errors: [
          {
            field: 'sort',
            message: 'Sort must be one of: recent, rating-high, rating-low'
          }
        ]
      });
    });

    it('should throw ValidationError for non-string sort', async () => {
      // Test with numeric sort parameter
      const validSellerId = '507f1f77bcf86cd799439011';
      const invalidParams = { sort: 123 };
      
      await expect(getSellerReviewsValidator.validateGetSellerReviewsData(validSellerId, invalidParams)).rejects.toMatchObject({
        errors: [
          {
            field: 'sort',
            message: 'Sort must be one of: recent, rating-high, rating-low'
          }
        ]
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing seller ID', async () => {
        const validParams = { sort: 'recent' };
        
        await expect(getSellerReviewsValidator.validateGetSellerReviewsData(undefined, validParams)).rejects.toMatchObject({
          errors: [
            {
              field: 'sellerId',
              message: 'Seller ID is required and must be a string'
            }
          ]
        });
      });

      it('should include specific error message for null seller ID', async () => {
        const validParams = { sort: 'recent' };
        
        await expect(getSellerReviewsValidator.validateGetSellerReviewsData(null, validParams)).rejects.toMatchObject({
          errors: [
            {
              field: 'sellerId',
              message: 'Seller ID is required and must be a string'
            }
          ]
        });
      });

      it('should include specific error message for non-string seller ID', async () => {
        const validParams = { sort: 'recent' };
        
        await expect(getSellerReviewsValidator.validateGetSellerReviewsData(123, validParams)).rejects.toMatchObject({
          errors: [
            {
              field: 'sellerId',
              message: 'Seller ID is required and must be a string'
            }
          ]
        });
      });

      it('should include specific error message for invalid sort option', async () => {
        const validSellerId = '507f1f77bcf86cd799439011';
        const invalidParams = { sort: 'invalid-sort' };
        
        await expect(getSellerReviewsValidator.validateGetSellerReviewsData(validSellerId, invalidParams)).rejects.toMatchObject({
          errors: [
            {
              field: 'sort',
              message: 'Sort must be one of: recent, rating-high, rating-low'
            }
          ]
        });
      });
    });
  });
}); 