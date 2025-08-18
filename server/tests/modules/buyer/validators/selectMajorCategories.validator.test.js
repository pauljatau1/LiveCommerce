const { validateSelectMajorCategoriesData } = require('@modules/buyer/validators/selectMajorCategories.validator');
const ValidationError = require('@utils/errors/ValidationError');
const { ObjectId } = require('mongodb');

describe('Select Major Categories Validator', () => {
  describe('validateSelectMajorCategoriesData', () => {
    it('should not throw for valid data', async () => {
      const validData = {
        buyerId: new ObjectId().toString(),
        majorCategoryIds: [new ObjectId().toString(), new ObjectId().toString()]
      };

      await expect(validateSelectMajorCategoriesData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError when buyerId is missing', async () => {
      const invalidData = {
        majorCategoryIds: [new ObjectId().toString()]
      };

      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
      });
    });

    it('should throw ValidationError when buyerId is null', async () => {
      const invalidData = {
        buyerId: null,
        majorCategoryIds: [new ObjectId().toString()]
      };

      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
      });
    });

    it('should throw ValidationError when buyerId is undefined', async () => {
      const invalidData = {
        buyerId: undefined,
        majorCategoryIds: [new ObjectId().toString()]
      };

      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
      });
    });

    it('should throw ValidationError when buyerId is empty string', async () => {
      const invalidData = {
        buyerId: '',
        majorCategoryIds: [new ObjectId().toString()]
      };

      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
      });
    });

    it('should throw ValidationError when buyerId is not a string', async () => {
      const invalidData = {
        buyerId: 123,
        majorCategoryIds: [new ObjectId().toString()]
      };

      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'buyerId', message: 'Buyer ID must be a string' }]
      });
    });

    it('should throw ValidationError when buyerId has invalid format', async () => {
      const invalidData = {
        buyerId: 'invalid-id',
        majorCategoryIds: [new ObjectId().toString()]
      };

      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'buyerId', message: 'Invalid buyer ID format' }]
      });
    });

    it('should throw ValidationError when majorCategoryIds is missing', async () => {
      const invalidData = {
        buyerId: new ObjectId().toString()
      };

      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'majorCategoryIds', message: 'majorCategoryIds array is required' }]
      });
    });

    it('should throw ValidationError when majorCategoryIds is null', async () => {
      const invalidData = {
        buyerId: new ObjectId().toString(),
        majorCategoryIds: null
      };

      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'majorCategoryIds', message: 'majorCategoryIds array is required' }]
      });
    });

    it('should throw ValidationError when majorCategoryIds is undefined', async () => {
      const invalidData = {
        buyerId: new ObjectId().toString(),
        majorCategoryIds: undefined
      };

      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'majorCategoryIds', message: 'majorCategoryIds array is required' }]
      });
    });

    it('should throw ValidationError when majorCategoryIds is not an array', async () => {
      const invalidData = {
        buyerId: new ObjectId().toString(),
        majorCategoryIds: 'not an array'
      };

      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'majorCategoryIds', message: 'majorCategoryIds must be an array' }]
      });
    });

    it('should throw ValidationError when majorCategoryIds is empty array', async () => {
      const invalidData = {
        buyerId: new ObjectId().toString(),
        majorCategoryIds: []
      };

      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'majorCategoryIds', message: 'majorCategoryIds array cannot be empty' }]
      });
    });

    it('should throw ValidationError when majorCategoryIds contains invalid ObjectId', async () => {
      const invalidData = {
        buyerId: new ObjectId().toString(),
        majorCategoryIds: ['invalid-id', new ObjectId().toString()]
      };

      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'majorCategoryIds[0]', message: 'must be a valid ObjectId' }]
      });
    });

    it('should throw ValidationError when majorCategoryIds contains non-string ObjectId', async () => {
      const invalidData = {
        buyerId: new ObjectId().toString(),
        majorCategoryIds: [123, new ObjectId().toString()]
      };

      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'majorCategoryIds[0]', message: 'must be a string' }]
      });
    });

    it('should accumulate multiple validation errors', async () => {
      const invalidData = {
        buyerId: 'invalid-id',
        majorCategoryIds: ['invalid-id', 123]
      };

      await expect(validateSelectMajorCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'buyerId', message: 'Invalid buyer ID format' }]
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing buyerId', async () => {
        await expect(validateSelectMajorCategoriesData({ majorCategoryIds: [new ObjectId().toString()] })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for null buyerId', async () => {
        await expect(validateSelectMajorCategoriesData({ buyerId: null, majorCategoryIds: [new ObjectId().toString()] })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for undefined buyerId', async () => {
        await expect(validateSelectMajorCategoriesData({ buyerId: undefined, majorCategoryIds: [new ObjectId().toString()] })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for empty string buyerId', async () => {
        await expect(validateSelectMajorCategoriesData({ buyerId: '', majorCategoryIds: [new ObjectId().toString()] })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for non-string buyerId', async () => {
        await expect(validateSelectMajorCategoriesData({ buyerId: 123, majorCategoryIds: [new ObjectId().toString()] })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID must be a string' }]
        });
      });

      it('should include specific error message for invalid ObjectId format buyerId', async () => {
        await expect(validateSelectMajorCategoriesData({ buyerId: 'invalid-id', majorCategoryIds: [new ObjectId().toString()] })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Invalid buyer ID format' }]
        });
      });

      it('should include specific error message for missing majorCategoryIds', async () => {
        await expect(validateSelectMajorCategoriesData({ buyerId: new ObjectId().toString() })).rejects.toMatchObject({
          errors: [{ field: 'majorCategoryIds', message: 'majorCategoryIds array is required' }]
        });
      });

      it('should include specific error message for null majorCategoryIds', async () => {
        await expect(validateSelectMajorCategoriesData({ buyerId: new ObjectId().toString(), majorCategoryIds: null })).rejects.toMatchObject({
          errors: [{ field: 'majorCategoryIds', message: 'majorCategoryIds array is required' }]
        });
      });

      it('should include specific error message for undefined majorCategoryIds', async () => {
        await expect(validateSelectMajorCategoriesData({ buyerId: new ObjectId().toString(), majorCategoryIds: undefined })).rejects.toMatchObject({
          errors: [{ field: 'majorCategoryIds', message: 'majorCategoryIds array is required' }]
        });
      });

      it('should include specific error message for non-array majorCategoryIds', async () => {
        await expect(validateSelectMajorCategoriesData({ buyerId: new ObjectId().toString(), majorCategoryIds: 'not an array' })).rejects.toMatchObject({
          errors: [{ field: 'majorCategoryIds', message: 'majorCategoryIds must be an array' }]
        });
      });

      it('should include specific error message for empty array majorCategoryIds', async () => {
        await expect(validateSelectMajorCategoriesData({ buyerId: new ObjectId().toString(), majorCategoryIds: [] })).rejects.toMatchObject({
          errors: [{ field: 'majorCategoryIds', message: 'majorCategoryIds array cannot be empty' }]
        });
      });

      it('should include specific error message for invalid ObjectId in majorCategoryIds array', async () => {
        await expect(validateSelectMajorCategoriesData({ buyerId: new ObjectId().toString(), majorCategoryIds: ['invalid-id'] })).rejects.toMatchObject({
          errors: [{ field: 'majorCategoryIds[0]', message: 'must be a valid ObjectId' }]
        });
      });

      it('should include specific error message for non-string ObjectId in majorCategoryIds array', async () => {
        await expect(validateSelectMajorCategoriesData({ buyerId: new ObjectId().toString(), majorCategoryIds: [123] })).rejects.toMatchObject({
          errors: [{ field: 'majorCategoryIds[0]', message: 'must be a string' }]
        });
      });

      it('should include multiple error messages when both fields are invalid', async () => {
        await expect(validateSelectMajorCategoriesData({})).rejects.toMatchObject({
          errors: [
            { field: 'buyerId', message: 'Buyer ID is required' },
            { field: 'majorCategoryIds', message: 'majorCategoryIds array is required' }
          ]
        });
      });
    });
  });
});
