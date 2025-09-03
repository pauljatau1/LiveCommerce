const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const sellerValidator = require('@modules/seller/validators/selectAccountType.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Select Account Type Validator', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      binary: { version: '7.0.3' }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('validateSelectAccountTypeData', () => {
    const validData = {
      accountType: 'business'
    };

    it('should pass validation with valid business account type', async () => {
      expect(() => {
        sellerValidator.validateSelectAccountTypeData(validData);
      }).not.toThrow();
    });

    it('should pass validation with valid individual account type', async () => {
      const individualData = {
        accountType: 'individual'
      };

      expect(() => {
        sellerValidator.validateSelectAccountTypeData(individualData);
      }).not.toThrow();
    });

    it('should pass validation with uppercase account type', async () => {
      const uppercaseData = {
        accountType: 'BUSINESS'
      };

      expect(() => {
        sellerValidator.validateSelectAccountTypeData(uppercaseData);
      }).not.toThrow();
    });

    it('should pass validation with mixed case account type', async () => {
      const mixedCaseData = {
        accountType: 'BuSiNeSs'
      };

      expect(() => {
        sellerValidator.validateSelectAccountTypeData(mixedCaseData);
      }).not.toThrow();
    });

    it('should throw ValidationError when data is null', async () => {
      expect(() => {
        sellerValidator.validateSelectAccountTypeData(null);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when data is undefined', async () => {
      expect(() => {
        sellerValidator.validateSelectAccountTypeData(undefined);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when data is empty object', async () => {
      expect(() => {
        sellerValidator.validateSelectAccountTypeData({});
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when accountType is missing', async () => {
      const invalidData = {
        otherField: 'value'
      };

      expect(() => {
        sellerValidator.validateSelectAccountTypeData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when accountType is null', async () => {
      const invalidData = {
        accountType: null
      };

      expect(() => {
        sellerValidator.validateSelectAccountTypeData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when accountType is undefined', async () => {
      const invalidData = {
        accountType: undefined
      };

      expect(() => {
        sellerValidator.validateSelectAccountTypeData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when accountType is empty string', async () => {
      const invalidData = {
        accountType: ''
      };

      expect(() => {
        sellerValidator.validateSelectAccountTypeData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when accountType is not string', async () => {
      const invalidData = {
        accountType: 123
      };

      expect(() => {
        sellerValidator.validateSelectAccountTypeData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when accountType is boolean', async () => {
      const invalidData = {
        accountType: true
      };

      expect(() => {
        sellerValidator.validateSelectAccountTypeData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when accountType is object', async () => {
      const invalidData = {
        accountType: {}
      };

      expect(() => {
        sellerValidator.validateSelectAccountTypeData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when accountType is array', async () => {
      const invalidData = {
        accountType: []
      };

      expect(() => {
        sellerValidator.validateSelectAccountTypeData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when accountType is invalid value', async () => {
      const invalidData = {
        accountType: 'invalid'
      };

      expect(() => {
        sellerValidator.validateSelectAccountTypeData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when accountType is corporation', async () => {
      const invalidData = {
        accountType: 'corporation'
      };

      expect(() => {
        sellerValidator.validateSelectAccountTypeData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when accountType is enterprise', async () => {
      const invalidData = {
        accountType: 'enterprise'
      };

      expect(() => {
        sellerValidator.validateSelectAccountTypeData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when accountType is personal', async () => {
      const invalidData = {
        accountType: 'personal'
      };

      expect(() => {
        sellerValidator.validateSelectAccountTypeData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError with correct error message for missing accountType', async () => {
      const invalidData = {};

      try {
        await sellerValidator.validateSelectAccountTypeData(invalidData);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({
          field: 'accountType',
          message: 'Account type is required'
        });
      }
    });

    it('should throw ValidationError with correct error message for invalid accountType', async () => {
      const invalidData = {
        accountType: 'invalid'
      };

      try {
        await sellerValidator.validateSelectAccountTypeData(invalidData);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({
          field: 'accountType',
          message: 'Invalid account type. Must be either "individual" or "business"'
        });
      }
    });

    it('should throw ValidationError with correct error message for non-string accountType', async () => {
      const invalidData = {
        accountType: 123
      };

      try {
        await sellerValidator.validateSelectAccountTypeData(invalidData);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({
          field: 'accountType',
          message: 'Account type must be a string'
        });
      }
    });

    it('should throw ValidationError with multiple errors for complex invalid data', async () => {
      const invalidData = {
        accountType: null,
        otherField: 'value'
      };

      try {
        await sellerValidator.validateSelectAccountTypeData(invalidData);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({
          field: 'accountType',
          message: 'Account type is required'
        });
      }
    });
  });
});
