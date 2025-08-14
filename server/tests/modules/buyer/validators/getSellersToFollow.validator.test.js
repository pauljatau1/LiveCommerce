const { validateGetSellersToFollowData } = require('@modules/buyer/validators/getSellersToFollow.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Get Sellers To Follow Validator', () => {
  describe('validateGetSellersToFollowData', () => {
    it('should not throw for valid data', async () => {
      const validData = {
        buyerId: '507f1f77bcf86cd799439011',
        page: '1',
        limit: '10',
        category: 'electronics',
        sort: 'rating'
      };

      await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError for missing buyerId', async () => {
      const invalidData = {
        page: '1',
        limit: '10'
      };

      await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for null buyerId', async () => {
      const invalidData = {
        buyerId: null,
        page: '1',
        limit: '10'
      };

      await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined buyerId', async () => {
      const invalidData = {
        buyerId: undefined,
        page: '1',
        limit: '10'
      };

      await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string buyerId', async () => {
      const invalidData = {
        buyerId: '',
        page: '1',
        limit: '10'
      };

      await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string buyerId', async () => {
      const invalidData = {
        buyerId: 123,
        page: '1',
        limit: '10'
      };

      await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid ObjectId format buyerId', async () => {
      const invalidData = {
        buyerId: 'invalid-id',
        page: '1',
        limit: '10'
      };

      await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
    });

    describe('page validation', () => {
      it('should throw error for negative page number', async () => {
        const invalidData = { 
          buyerId: '507f1f77bcf86cd799439011',
          page: '-1' 
        };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should throw error for zero page number', async () => {
        const invalidData = { 
          buyerId: '507f1f77bcf86cd799439011',
          page: '0' 
        };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should throw error for non-numeric page', async () => {
        const invalidData = { 
          buyerId: '507f1f77bcf86cd799439011',
          page: 'abc' 
        };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should pass validation for valid page number', async () => {
        const validData = { 
          buyerId: '507f1f77bcf86cd799439011',
          page: '1' 
        };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });

      it('should pass validation for large page number', async () => {
        const validData = { 
          buyerId: '507f1f77bcf86cd799439011',
          page: '999' 
        };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });
    });

    describe('limit validation', () => {
      it('should throw error for limit less than 1', async () => {
        const invalidData = { 
          buyerId: '507f1f77bcf86cd799439011',
          limit: '0' 
        };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should throw error for limit greater than 100', async () => {
        const invalidData = { 
          buyerId: '507f1f77bcf86cd799439011',
          limit: '101' 
        };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should throw error for non-numeric limit', async () => {
        const invalidData = { 
          buyerId: '507f1f77bcf86cd799439011',
          limit: 'abc' 
        };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should pass validation for valid limit', async () => {
        const validData = { 
          buyerId: '507f1f77bcf86cd799439011',
          limit: '10' 
        };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });

      it('should pass validation for limit of 1', async () => {
        const validData = { 
          buyerId: '507f1f77bcf86cd799439011',
          limit: '1' 
        };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });

      it('should pass validation for limit of 100', async () => {
        const validData = { 
          buyerId: '507f1f77bcf86cd799439011',
          limit: '100' 
        };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });
    });

    describe('category validation', () => {
      it('should throw error for non-string category', async () => {
        const invalidData = { category: 123 };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should pass validation for string category', async () => {
        const validData = { 
          buyerId: '507f1f77bcf86cd799439011',
          category: 'electronics' 
        };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });

      it('should pass validation for empty string category', async () => {
        const validData = { 
          buyerId: '507f1f77bcf86cd799439011',
          category: '' 
        };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });
    });

    describe('sort validation', () => {
      it('should throw error for invalid sort option', async () => {
        const invalidData = { sort: 'invalid' };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should pass validation for rating sort', async () => {
        const validData = { 
          buyerId: '507f1f77bcf86cd799439011',
          sort: 'rating' 
        };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });

      it('should pass validation for followers sort', async () => {
        const validData = { 
          buyerId: '507f1f77bcf86cd799439011',
          sort: 'followers' 
        };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });

      it('should pass validation for newest sort', async () => {
        const validData = { 
          buyerId: '507f1f77bcf86cd799439011',
          sort: 'newest' 
        };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });
    });

    describe('multiple validation errors', () => {
      it('should throw error with multiple validation failures', async () => {
        const invalidData = {
          buyerId: '507f1f77bcf86cd799439011',
          page: '-1',
          limit: '101',
          sort: 'invalid'
        };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should include all validation errors in the thrown error', async () => {
        const invalidData = {
          buyerId: '507f1f77bcf86cd799439011',
          page: '-1',
          limit: '101',
          sort: 'invalid'
        };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toMatchObject({
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'page' }),
            expect.objectContaining({ field: 'limit' }),
            expect.objectContaining({ field: 'sort' })
          ])
        });
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing buyerId', async () => {
        await expect(validateGetSellersToFollowData({ page: '1', limit: '10' })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for null buyerId', async () => {
        await expect(validateGetSellersToFollowData({ buyerId: null, page: '1', limit: '10' })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for undefined buyerId', async () => {
        await expect(validateGetSellersToFollowData({ buyerId: undefined, page: '1', limit: '10' })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for empty string buyerId', async () => {
        await expect(validateGetSellersToFollowData({ buyerId: '', page: '1', limit: '10' })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for non-string buyerId', async () => {
        await expect(validateGetSellersToFollowData({ buyerId: 123, page: '1', limit: '10' })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID must be a string' }]
        });
      });

      it('should include specific error message for invalid ObjectId format buyerId', async () => {
        await expect(validateGetSellersToFollowData({ buyerId: 'invalid-id', page: '1', limit: '10' })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Invalid buyer ID format' }]
        });
      });

      it('should include specific error message for negative page number', async () => {
        await expect(validateGetSellersToFollowData({ buyerId: '507f1f77bcf86cd799439011', page: '-1' })).rejects.toMatchObject({
          errors: [{ field: 'page', message: 'Page must be a positive integer' }]
        });
      });

      it('should include specific error message for zero page number', async () => {
        await expect(validateGetSellersToFollowData({ buyerId: '507f1f77bcf86cd799439011', page: '0' })).rejects.toMatchObject({
          errors: [{ field: 'page', message: 'Page must be a positive integer' }]
        });
      });

      it('should include specific error message for non-numeric page', async () => {
        await expect(validateGetSellersToFollowData({ buyerId: '507f1f77bcf86cd799439011', page: 'abc' })).rejects.toMatchObject({
          errors: [{ field: 'page', message: 'Page must be a positive integer' }]
        });
      });

      it('should include specific error message for limit less than 1', async () => {
        await expect(validateGetSellersToFollowData({ buyerId: '507f1f77bcf86cd799439011', limit: '0' })).rejects.toMatchObject({
          errors: [{ field: 'limit', message: 'Limit must be a positive integer between 1 and 100' }]
        });
      });

      it('should include specific error message for limit greater than 100', async () => {
        await expect(validateGetSellersToFollowData({ buyerId: '507f1f77bcf86cd799439011', limit: '101' })).rejects.toMatchObject({
          errors: [{ field: 'limit', message: 'Limit must be a positive integer between 1 and 100' }]
        });
      });

      it('should include specific error message for non-numeric limit', async () => {
        await expect(validateGetSellersToFollowData({ buyerId: '507f1f77bcf86cd799439011', limit: 'abc' })).rejects.toMatchObject({
          errors: [{ field: 'limit', message: 'Limit must be a positive integer between 1 and 100' }]
        });
      });

      it('should include specific error message for non-string category', async () => {
        await expect(validateGetSellersToFollowData({ buyerId: '507f1f77bcf86cd799439011', category: 123 })).rejects.toMatchObject({
          errors: [{ field: 'category', message: 'Category must be a string' }]
        });
      });

      it('should include specific error message for invalid sort option', async () => {
        await expect(validateGetSellersToFollowData({ buyerId: '507f1f77bcf86cd799439011', sort: 'invalid' })).rejects.toMatchObject({
          errors: [{ field: 'sort', message: 'Sort must be one of: rating, followers, newest' }]
        });
      });

      it('should include multiple error messages when multiple fields are invalid', async () => {
        await expect(validateGetSellersToFollowData({ buyerId: '507f1f77bcf86cd799439011', page: '-1', limit: '101' })).rejects.toMatchObject({
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'page' }),
            expect.objectContaining({ field: 'limit' })
          ])
        });
      });
    });
  });
});
