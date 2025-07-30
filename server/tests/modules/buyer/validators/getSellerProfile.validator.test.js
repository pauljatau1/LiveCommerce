const getSellerProfileValidator = require('../../../../src/modules/buyer/validators/getSellerProfile.validator');
const ValidationError = require('../../../../src/utils/errors/ValidationError');

describe('getSellerProfile.validator', () => {
  describe('validateSellerId', () => {
    it('should pass validation for valid seller ID', () => {
      expect(() => {
        getSellerProfileValidator.validateSellerId('507f1f77bcf86cd799439011');
      }).not.toThrow();
    });

    it('should throw ValidationError for missing seller ID', () => {
      expect(() => {
        getSellerProfileValidator.validateSellerId();
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for null seller ID', () => {
      expect(() => {
        getSellerProfileValidator.validateSellerId(null);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string seller ID', () => {
      expect(() => {
        getSellerProfileValidator.validateSellerId('');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string seller ID', () => {
      expect(() => {
        getSellerProfileValidator.validateSellerId(123);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined seller ID', () => {
      expect(() => {
        getSellerProfileValidator.validateSellerId(undefined);
      }).toThrow(ValidationError);
    });
  });

  describe('validateGetSellerProfileData', () => {
    it('should pass validation for valid data', async () => {
      const validData = {
        sellerId: '507f1f77bcf86cd799439011'
      };

      await expect(getSellerProfileValidator.validateGetSellerProfileData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError for missing seller ID', async () => {
      const invalidData = {};

      await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for null seller ID', async () => {
      const invalidData = {
        sellerId: null
      };

      await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string seller ID', async () => {
      const invalidData = {
        sellerId: ''
      };

      await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string seller ID', async () => {
      const invalidData = {
        sellerId: 123
      };

      await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined seller ID', async () => {
      const invalidData = {
        sellerId: undefined
      };

      await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty data object', async () => {
      const invalidData = {};

      await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData)).rejects.toThrow(ValidationError);
    });
  });
}); 