const {
  validateGetFollowersData,
  validatePageParam,
  validateLimitParam,
  validatePaginationParams
} = require('@modules/buyer/validators/getFollowers.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('getFollowers.validator', () => {
  describe('validatePageParam', () => {
    it('should return null for valid page values', () => {
      expect(validatePageParam(1)).toBeNull();
      expect(validatePageParam(5)).toBeNull();
      expect(validatePageParam(100)).toBeNull();
      expect(validatePageParam('5')).toBeNull();
    });

    it('should return null for undefined page', () => {
      expect(validatePageParam(undefined)).toBeNull();
    });

    it('should return error object for invalid page values', () => {
      expect(validatePageParam(0)).toEqual({
        field: 'page',
        message: 'Page must be a positive integer'
      });
      expect(validatePageParam(-1)).toEqual({
        field: 'page',
        message: 'Page must be a positive integer'
      });
      expect(validatePageParam('invalid')).toEqual({
        field: 'page',
        message: 'Page must be a positive integer'
      });
      expect(validatePageParam(null)).toEqual({
        field: 'page',
        message: 'Page must be a positive integer'
      });
    });
  });

  describe('validateLimitParam', () => {
    it('should return null for valid limit values', () => {
      expect(validateLimitParam(1)).toBeNull();
      expect(validateLimitParam(10)).toBeNull();
      expect(validateLimitParam(50)).toBeNull();
      expect(validateLimitParam(100)).toBeNull();
      expect(validateLimitParam('20')).toBeNull();
    });

    it('should return null for undefined limit', () => {
      expect(validateLimitParam(undefined)).toBeNull();
    });

    it('should return error object for invalid limit values', () => {
      expect(validateLimitParam(0)).toEqual({
        field: 'limit',
        message: 'Limit must be a positive integer between 1 and 100'
      });
      expect(validateLimitParam(-1)).toEqual({
        field: 'limit',
        message: 'Limit must be a positive integer between 1 and 100'
      });
      expect(validateLimitParam(101)).toEqual({
        field: 'limit',
        message: 'Limit must be a positive integer between 1 and 100'
      });
      expect(validateLimitParam('invalid')).toEqual({
        field: 'limit',
        message: 'Limit must be a positive integer between 1 and 100'
      });
      expect(validateLimitParam(null)).toEqual({
        field: 'limit',
        message: 'Limit must be a positive integer between 1 and 100'
      });
    });
  });

  describe('validatePaginationParams', () => {
    it('should pass validation for valid page and limit', () => {
      expect(() => validatePaginationParams(1, 10)).not.toThrow();
      expect(() => validatePaginationParams(5, 20)).not.toThrow();
      expect(() => validatePaginationParams(100, 50)).not.toThrow();
    });

    it('should throw ValidationError for invalid page', () => {
      expect(() => validatePaginationParams(0, 10)).toThrow(ValidationError);
      expect(() => validatePaginationParams(-1, 10)).toThrow(ValidationError);
      expect(() => validatePaginationParams('invalid', 10)).toThrow(ValidationError);
      expect(() => validatePaginationParams(null, 10)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid limit', () => {
      expect(() => validatePaginationParams(1, 0)).toThrow(ValidationError);
      expect(() => validatePaginationParams(1, -1)).toThrow(ValidationError);
      expect(() => validatePaginationParams(1, 101)).toThrow(ValidationError);
      expect(() => validatePaginationParams(1, 'invalid')).toThrow(ValidationError);
      expect(() => validatePaginationParams(1, null)).toThrow(ValidationError);
    });

    it('should throw ValidationError with correct error details for page', () => {
      expect(() => validatePaginationParams(0, 10)).toThrow(expect.objectContaining({
        errors: [
          {
            field: 'page',
            message: 'Page must be a positive integer'
          }
        ]
      }));
    });

    it('should throw ValidationError with correct error details for limit', () => {
      expect(() => validatePaginationParams(1, 101)).toThrow(expect.objectContaining({
        errors: [
          {
            field: 'limit',
            message: 'Limit must be a positive integer between 1 and 100'
          }
        ]
      }));
    });

    it('should throw ValidationError with multiple errors for invalid page and limit', () => {
      expect(() => validatePaginationParams(0, 101)).toThrow(expect.objectContaining({
        errors: [
          { field: 'page', message: 'Page must be a positive integer' },
          { field: 'limit', message: 'Limit must be a positive integer between 1 and 100' }
        ]
      }));
    });
  });

  describe('validateGetFollowersData', () => {
    it('should pass validation for valid data with defaults', async () => {
      await expect(validateGetFollowersData({})).resolves.not.toThrow();
    });

    it('should pass validation for valid data with custom values', async () => {
      await expect(validateGetFollowersData({ page: 2, limit: 20 })).resolves.not.toThrow();
    });

    it('should pass validation for string numbers that can be parsed', async () => {
      await expect(validateGetFollowersData({ page: '2', limit: '20' })).resolves.not.toThrow();
    });

    it('should throw ValidationError for invalid page', async () => {
      await expect(validateGetFollowersData({ page: 0 })).rejects.toMatchObject({
        errors: [
          {
            field: 'page',
            message: 'Page must be a positive integer'
          }
        ]
      });
      await expect(validateGetFollowersData({ page: -1 })).rejects.toMatchObject({
        errors: [
          {
            field: 'page',
            message: 'Page must be a positive integer'
          }
        ]
      });
      await expect(validateGetFollowersData({ page: 'invalid' })).rejects.toMatchObject({
        errors: [
          {
            field: 'page',
            message: 'Page must be a positive integer'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid limit', async () => {
      await expect(validateGetFollowersData({ limit: 0 })).rejects.toMatchObject({
        errors: [
          {
            field: 'limit',
            message: 'Limit must be a positive integer between 1 and 100'
          }
        ]
      });
      await expect(validateGetFollowersData({ limit: 101 })).rejects.toMatchObject({
        errors: [
          {
            field: 'limit',
            message: 'Limit must be a positive integer between 1 and 100'
          }
        ]
      });
      await expect(validateGetFollowersData({ limit: 'invalid' })).rejects.toMatchObject({
        errors: [
          {
            field: 'limit',
            message: 'Limit must be a positive integer between 1 and 100'
          }
        ]
      });
    });

    it('should throw ValidationError for multiple invalid parameters', async () => {
      await expect(validateGetFollowersData({ page: 0, limit: 101 })).rejects.toMatchObject({
        errors: [
          { field: 'page', message: 'Page must be a positive integer' },
          { field: 'limit', message: 'Limit must be a positive integer between 1 and 100' }
        ]
      });
    });

    it('should use default values when parameters are undefined', async () => {
      await expect(validateGetFollowersData({ page: undefined, limit: undefined })).resolves.not.toThrow();
    });

    it('should handle edge cases', async () => {
      await expect(validateGetFollowersData({ page: 1, limit: 1 })).resolves.not.toThrow();
      await expect(validateGetFollowersData({ page: 1, limit: 100 })).resolves.not.toThrow();
      await expect(validateGetFollowersData({ page: 999999, limit: 50 })).resolves.not.toThrow();
    });
  });

  describe('Specific Error Messages', () => {
    it('should include specific error message for invalid page (zero)', async () => {
      await expect(validateGetFollowersData({ page: 0 }))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'page',
              message: 'Page must be a positive integer'
            }
          ])
        }));
    });

    it('should include specific error message for invalid page (negative)', async () => {
      await expect(validateGetFollowersData({ page: -1 }))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'page',
              message: 'Page must be a positive integer'
            }
          ])
        }));
    });

    it('should include specific error message for invalid page (string)', async () => {
      await expect(validateGetFollowersData({ page: 'invalid' }))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'page',
              message: 'Page must be a positive integer'
            }
          ])
        }));
    });

    it('should include specific error message for invalid page (null)', async () => {
      await expect(validateGetFollowersData({ page: null }))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'page',
              message: 'Page must be a positive integer'
            }
          ])
        }));
    });

    it('should include specific error message for invalid limit (zero)', async () => {
      await expect(validateGetFollowersData({ limit: 0 }))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'limit',
              message: 'Limit must be a positive integer between 1 and 100'
            }
          ])
        }));
    });

    it('should include specific error message for invalid limit (negative)', async () => {
      await expect(validateGetFollowersData({ limit: -1 }))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'limit',
              message: 'Limit must be a positive integer between 1 and 100'
            }
          ])
        }));
    });

    it('should include specific error message for invalid limit (too high)', async () => {
      await expect(validateGetFollowersData({ limit: 101 }))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'limit',
              message: 'Limit must be a positive integer between 1 and 100'
            }
          ])
        }));
    });

    it('should include specific error message for invalid limit (string)', async () => {
      await expect(validateGetFollowersData({ limit: 'invalid' }))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'limit',
              message: 'Limit must be a positive integer between 1 and 100'
            }
          ])
        }));
    });

    it('should include specific error message for invalid limit (null)', async () => {
      await expect(validateGetFollowersData({ limit: null }))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'limit',
              message: 'Limit must be a positive integer between 1 and 100'
            }
          ])
        }));
    });

    it('should include multiple error messages for multiple validation failures', async () => {
      await expect(validateGetFollowersData({ page: 0, limit: 101 }))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'page',
              message: 'Page must be a positive integer'
            },
            {
              field: 'limit',
              message: 'Limit must be a positive integer between 1 and 100'
            }
          ])
        }));
    });

    it('should include multiple error messages for invalid page and limit with strings', async () => {
      await expect(validateGetFollowersData({ page: 'invalid', limit: 'too-high' }))
        .rejects
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            {
              field: 'page',
              message: 'Page must be a positive integer'
            },
            {
              field: 'limit',
              message: 'Limit must be a positive integer between 1 and 100'
            }
          ])
        }));
    });

    it('should not throw error for valid page and limit', async () => {
      await expect(validateGetFollowersData({ page: 1, limit: 10 }))
        .resolves.not.toThrow();
    });

    it('should not throw error for valid page and limit as strings', async () => {
      await expect(validateGetFollowersData({ page: '1', limit: '10' }))
        .resolves.not.toThrow();
    });

    it('should not throw error for undefined parameters (uses defaults)', async () => {
      await expect(validateGetFollowersData({ page: undefined, limit: undefined }))
        .resolves.not.toThrow();
    });
  });
}); 