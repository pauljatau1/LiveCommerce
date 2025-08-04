const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const getSellerReviewsValidator = require('@modules/buyer/validators/getSellerReviews.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Get Seller Reviews Validator', () => {
  describe('validateSellerId', () => {
    it('should pass validation for valid seller ID', () => {
      // Test with a valid MongoDB ObjectId format
      const validSellerId = '507f1f77bcf86cd799439011';
      
      // Expect the validation to pass without throwing any error
      expect(() => {
        getSellerReviewsValidator.validateSellerId(validSellerId);
      }).not.toThrow();
    });

    it('should throw ValidationError for missing seller ID', () => {
      // Test with undefined seller ID
      expect(() => {
        getSellerReviewsValidator.validateSellerId();
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for null seller ID', () => {
      // Test with null seller ID
      expect(() => {
        getSellerReviewsValidator.validateSellerId(null);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string seller ID', () => {
      // Test with empty string seller ID
      expect(() => {
        getSellerReviewsValidator.validateSellerId('');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string seller ID', () => {
      // Test with numeric seller ID
      expect(() => {
        getSellerReviewsValidator.validateSellerId(123);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for object seller ID', () => {
      // Test with object seller ID
      expect(() => {
        getSellerReviewsValidator.validateSellerId({ id: '123' });
      }).toThrow(ValidationError);
    });
  });

  describe('validateSortParam', () => {
    it('should pass validation for valid sort options', () => {
      // Test all valid sort options
      const validSortOptions = ['recent', 'rating-high', 'rating-low'];
      
      // Each valid option should pass validation
      validSortOptions.forEach(sort => {
        expect(() => {
          getSellerReviewsValidator.validateSortParam(sort);
        }).not.toThrow();
      });
    });

    it('should pass validation for empty string sort', () => {
      // Empty string should be allowed (defaults to 'recent' in service)
      expect(() => {
        getSellerReviewsValidator.validateSortParam('');
      }).not.toThrow();
    });

    it('should pass validation for undefined sort', () => {
      // Undefined should be allowed (defaults to 'recent' in service)
      expect(() => {
        getSellerReviewsValidator.validateSortParam(undefined);
      }).not.toThrow();
    });

    it('should pass validation for null sort', () => {
      // Null should be allowed (defaults to 'recent' in service)
      expect(() => {
        getSellerReviewsValidator.validateSortParam(null);
      }).not.toThrow();
    });

    it('should throw ValidationError for invalid sort option', () => {
      // Test with invalid sort option
      expect(() => {
        getSellerReviewsValidator.validateSortParam('invalid-sort');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string sort', () => {
      // Test with numeric sort parameter
      expect(() => {
        getSellerReviewsValidator.validateSortParam(123);
      }).toThrow(ValidationError);
    });
  });

  describe('validateGetSellerReviewsData', () => {
    it('should pass validation for valid data', async () => {
      // Test with valid seller ID and sort parameter
      const validSellerId = '507f1f77bcf86cd799439011';
      const validParams = { sort: 'recent' };
      
      // Expect the validation to pass without throwing any error
      await expect(
        getSellerReviewsValidator.validateGetSellerReviewsData(validSellerId, validParams)
      ).resolves.not.toThrow();
    });

    it('should pass validation for valid data with different sort options', async () => {
      // Test with different valid sort option
      const validSellerId = '507f1f77bcf86cd799439011';
      const validParams = { sort: 'rating-high' };
      
      // Expect the validation to pass without throwing any error
      await expect(
        getSellerReviewsValidator.validateGetSellerReviewsData(validSellerId, validParams)
      ).resolves.not.toThrow();
    });

    it('should pass validation for valid data with empty sort', async () => {
      // Test with empty sort parameter (should be allowed)
      const validSellerId = '507f1f77bcf86cd799439011';
      const validParams = { sort: '' };
      
      // Expect the validation to pass without throwing any error
      await expect(
        getSellerReviewsValidator.validateGetSellerReviewsData(validSellerId, validParams)
      ).resolves.not.toThrow();
    });

    it('should pass validation for valid data without sort', async () => {
      // Test without sort parameter (should default to 'recent' in service)
      const validSellerId = '507f1f77bcf86cd799439011';
      const validParams = {};
      
      // Expect the validation to pass without throwing any error
      await expect(
        getSellerReviewsValidator.validateGetSellerReviewsData(validSellerId, validParams)
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError for invalid seller ID', async () => {
      // Test with invalid seller ID
      const invalidSellerId = '';
      const validParams = { sort: 'recent' };
      
      // Expect the validation to throw ValidationError
      await expect(
        getSellerReviewsValidator.validateGetSellerReviewsData(invalidSellerId, validParams)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid sort parameter', async () => {
      // Test with invalid sort parameter
      const validSellerId = '507f1f77bcf86cd799439011';
      const invalidParams = { sort: 'invalid-sort' };
      
      // Expect the validation to throw ValidationError
      await expect(
        getSellerReviewsValidator.validateGetSellerReviewsData(validSellerId, invalidParams)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for both invalid seller ID and sort', async () => {
      // Test with both invalid seller ID and sort parameter
      const invalidSellerId = null;
      const invalidParams = { sort: 'invalid-sort' };
      
      // Expect the validation to throw ValidationError
      await expect(
        getSellerReviewsValidator.validateGetSellerReviewsData(invalidSellerId, invalidParams)
      ).rejects.toThrow(ValidationError);
    });
  });
}); 