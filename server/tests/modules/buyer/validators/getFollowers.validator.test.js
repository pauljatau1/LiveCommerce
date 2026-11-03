const { validateGetFollowersData, validatePageParam, validateLimitParam } = require('@modules/buyer/validators/getFollowers.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Get Followers Validator', () => {
  describe('validatePageParam', () => {
    it('should not add error for valid page values', () => {
      const errors = [];
      validatePageParam(1, errors);
      expect(errors).toHaveLength(0);
      
      errors.length = 0; // Reset
      validatePageParam(5, errors);
      expect(errors).toHaveLength(0);
      
      errors.length = 0; // Reset
      validatePageParam(100, errors);
      expect(errors).toHaveLength(0);
      
      errors.length = 0; // Reset
      validatePageParam('5', errors);
      expect(errors).toHaveLength(0);
    });

    it('should not add error for undefined page', () => {
      const errors = [];
      validatePageParam(undefined, errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error for invalid page values', () => {
      const errors = [];
      validatePageParam(0, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'page', message: 'Page must be a positive integer' });
      
      errors.length = 0; // Reset
      validatePageParam(-1, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'page', message: 'Page must be a positive integer' });
      
      errors.length = 0; // Reset
      validatePageParam('invalid', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'page', message: 'Page must be a positive integer' });
      
      errors.length = 0; // Reset
      validatePageParam(null, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'page', message: 'Page must be a positive integer' });
    });
  });

  describe('validateLimitParam', () => {
    it('should not add error for valid limit values', () => {
      const errors = [];
      validateLimitParam(1, errors);
      expect(errors).toHaveLength(0);
      
      errors.length = 0; // Reset
      validateLimitParam(10, errors);
      expect(errors).toHaveLength(0);
      
      errors.length = 0; // Reset
      validateLimitParam(50, errors);
      expect(errors).toHaveLength(0);
      
      errors.length = 0; // Reset
      validateLimitParam(100, errors);
      expect(errors).toHaveLength(0);
      
      errors.length = 0; // Reset
      validateLimitParam('10', errors);
      expect(errors).toHaveLength(0);
    });

    it('should not add error for undefined limit', () => {
      const errors = [];
      validateLimitParam(undefined, errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error for invalid limit values', () => {
      const errors = [];
      validateLimitParam(0, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'limit', message: 'Limit must be a positive integer between 1 and 100' });
      
      errors.length = 0; // Reset
      validateLimitParam(-1, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'limit', message: 'Limit must be a positive integer between 1 and 100' });
      
      errors.length = 0; // Reset
      validateLimitParam(101, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'limit', message: 'Limit must be a positive integer between 1 and 100' });
      
      errors.length = 0; // Reset
      validateLimitParam('invalid', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'limit', message: 'Limit must be a positive integer between 1 and 100' });
    });
  });

  describe('validateGetFollowersData', () => {
    it('should not throw for valid data', async () => {
      const validData = { page: 1, limit: 10 };
      await expect(validateGetFollowersData(validData)).resolves.not.toThrow();
    });

    it('should not throw for data with default values', async () => {
      const dataWithDefaults = {};
      await expect(validateGetFollowersData(dataWithDefaults)).resolves.not.toThrow();
    });

    it('should not throw for valid page and limit', async () => {
      await expect(validateGetFollowersData({ page: 5, limit: 20 })).resolves.not.toThrow();
      await expect(validateGetFollowersData({ page: 100, limit: 50 })).resolves.not.toThrow();
    });

    it('should throw ValidationError for invalid page', async () => {
      await expect(validateGetFollowersData({ page: 0, limit: 10 })).rejects.toThrow(ValidationError);
      await expect(validateGetFollowersData({ page: 0, limit: 10 })).rejects.toMatchObject({
        errors: [{ field: 'page', message: 'Page must be a positive integer' }]
      });
    });

    it('should throw ValidationError for invalid limit', async () => {
      await expect(validateGetFollowersData({ page: 1, limit: 0 })).rejects.toThrow(ValidationError);
      await expect(validateGetFollowersData({ page: 1, limit: 0 })).rejects.toMatchObject({
        errors: [{ field: 'limit', message: 'Limit must be a positive integer between 1 and 100' }]
      });
    });

    it('should throw ValidationError with multiple errors for invalid page and limit', async () => {
      await expect(validateGetFollowersData({ page: 0, limit: 101 })).rejects.toThrow(ValidationError);
      await expect(validateGetFollowersData({ page: 0, limit: 101 })).rejects.toMatchObject({
        errors: expect.arrayContaining([
          { field: 'page', message: 'Page must be a positive integer' },
          { field: 'limit', message: 'Limit must be a positive integer between 1 and 100' }
        ])
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for invalid page', async () => {
        await expect(validateGetFollowersData({ page: -1, limit: 10 })).rejects.toMatchObject({
          errors: [{ field: 'page', message: 'Page must be a positive integer' }]
        });
      });

      it('should include specific error message for invalid limit', async () => {
        await expect(validateGetFollowersData({ page: 1, limit: 101 })).rejects.toMatchObject({
          errors: [{ field: 'limit', message: 'Limit must be a positive integer between 1 and 100' }]
        });
      });

      it('should include specific error message for non-numeric page', async () => {
        await expect(validateGetFollowersData({ page: 'invalid', limit: 10 })).rejects.toMatchObject({
          errors: [{ field: 'page', message: 'Page must be a positive integer' }]
        });
      });

      it('should include specific error message for non-numeric limit', async () => {
        await expect(validateGetFollowersData({ page: 1, limit: 'invalid' })).rejects.toMatchObject({
          errors: [{ field: 'limit', message: 'Limit must be a positive integer between 1 and 100' }]
        });
      });

      it('should include specific error message for null page', async () => {
        await expect(validateGetFollowersData({ page: null, limit: 10 })).rejects.toMatchObject({
          errors: [{ field: 'page', message: 'Page must be a positive integer' }]
        });
      });

      it('should include specific error message for null limit', async () => {
        await expect(validateGetFollowersData({ page: 1, limit: null })).rejects.toMatchObject({
          errors: [{ field: 'limit', message: 'Limit must be a positive integer between 1 and 100' }]
        });
      });

      it('should include multiple error messages for multiple validation failures', async () => {
        await expect(validateGetFollowersData({ page: 0, limit: 101 })).rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'page', message: 'Page must be a positive integer' },
            { field: 'limit', message: 'Limit must be a positive integer between 1 and 100' }
          ])
        });
      });
    });
  });
}); 