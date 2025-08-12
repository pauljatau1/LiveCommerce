const { validateGetSellersToFollowData } = require('../../../../src/modules/buyer/validators/getSellersToFollow.validator');
const ValidationError = require('../../../../src/utils/errors/ValidationError');

describe('getSellersToFollow.validator', () => {
  describe('validateGetSellersToFollowData', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        page: '1',
        limit: '10',
        search: 'fashion',
        category: 'clothing',
        sort: 'rating'
      };

      await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
    });

    it('should pass validation with minimal data', async () => {
      const minimalData = {};

      await expect(validateGetSellersToFollowData(minimalData)).resolves.not.toThrow();
    });

    it('should pass validation with undefined values', async () => {
      const dataWithUndefined = {
        page: undefined,
        limit: undefined,
        search: undefined,
        category: undefined,
        sort: undefined
      };

      await expect(validateGetSellersToFollowData(dataWithUndefined)).resolves.not.toThrow();
    });

    describe('page validation', () => {
      it('should throw error for negative page number', async () => {
        const invalidData = { page: '-1' };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should throw error for zero page number', async () => {
        const invalidData = { page: '0' };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should throw error for non-numeric page', async () => {
        const invalidData = { page: 'abc' };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should pass validation for valid page number', async () => {
        const validData = { page: '5' };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });
    });

    describe('limit validation', () => {
      it('should throw error for negative limit', async () => {
        const invalidData = { limit: '-1' };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should throw error for zero limit', async () => {
        const invalidData = { limit: '0' };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should throw error for limit greater than 100', async () => {
        const invalidData = { limit: '101' };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should throw error for non-numeric limit', async () => {
        const invalidData = { limit: 'abc' };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should pass validation for valid limit', async () => {
        const validData = { limit: '50' };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });

      it('should pass validation for limit at maximum', async () => {
        const validData = { limit: '100' };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });
    });

    describe('search validation', () => {
      it('should throw error for non-string search', async () => {
        const invalidData = { search: 123 };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should pass validation for string search', async () => {
        const validData = { search: 'fashion store' };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });

      it('should pass validation for empty string search', async () => {
        const validData = { search: '' };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });
    });

    describe('category validation', () => {
      it('should throw error for non-string category', async () => {
        const invalidData = { category: 123 };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should pass validation for string category', async () => {
        const validData = { category: 'electronics' };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });

      it('should pass validation for empty string category', async () => {
        const validData = { category: '' };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });
    });

    describe('sort validation', () => {
      it('should throw error for invalid sort option', async () => {
        const invalidData = { sort: 'invalid' };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should pass validation for rating sort', async () => {
        const validData = { sort: 'rating' };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });

      it('should pass validation for followers sort', async () => {
        const validData = { sort: 'followers' };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });

      it('should pass validation for newest sort', async () => {
        const validData = { sort: 'newest' };

        await expect(validateGetSellersToFollowData(validData)).resolves.not.toThrow();
      });
    });

    describe('multiple validation errors', () => {
      it('should throw error with multiple validation failures', async () => {
        const invalidData = {
          page: '-1',
          limit: '101',
          sort: 'invalid'
        };

        await expect(validateGetSellersToFollowData(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should include all validation errors in the thrown error', async () => {
        const invalidData = {
          page: '-1',
          limit: '101',
          sort: 'invalid'
        };

        try {
          await validateGetSellersToFollowData(invalidData);
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect(error.errors).toHaveLength(3);
          expect(error.errors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ field: 'page' }),
              expect.objectContaining({ field: 'limit' }),
              expect.objectContaining({ field: 'sort' })
            ])
          );
        }
      });
    });
  });
});
