const generateSmileIdTokenValidator = require('@modules/seller/validators/generateSmileIdToken.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Generate SmileID Token Validator', () => {
  describe('validateGenerateSmileIdTokenData', () => {
    it('should pass validation with valid individual account data', () => {
      // Arrange
      const validData = {
        accountType: 'individual',
        idType: 'NIN_SLIP',
        userId: 'user123'
      };

      // Act & Assert
      expect(() => generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(validData))
        .not.toThrow();
    });

    it('should pass validation with valid business account data', () => {
      // Arrange
      const validData = {
        accountType: 'business',
        idType: 'BN',
        userId: 'user456'
      };

      // Act & Assert
      expect(() =>generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(validData))
        .not.toThrow();
    });

    it('should pass validation without optional userId', () => {
      // Arrange
      const validData = {
        accountType: 'individual',
        idType: 'BVN'
      };

      // Act & Assert
      expect(() =>generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(validData))
        .not.toThrow();
    });

    it('should throw ValidationError when accountType is missing', () => {
      // Arrange
      const invalidData = {
        idType: 'NIN_SLIP'
      };

      // Act & Assert
      expect(() => generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when idType is missing', () => {
      // Arrange
      const invalidData = {
        accountType: 'individual'
      };

      // Act & Assert
      expect(() => generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError with correct error message when accountType is missing', () => {
      // Arrange
      const invalidData = {
        idType: 'NIN_SLIP'
      };

      // Act & Assert
      expect(() => generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData))
        .toThrow(ValidationError);
      
      try {
        generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'accountType', message: 'Account type is required' }
        ]);
      }
    });

    it('should throw ValidationError with correct error message when idType is missing', () => {
      // Arrange
      const invalidData = {
        accountType: 'individual'
      };

      // Act & Assert
      expect(() => generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData))
        .toThrow(ValidationError);
      
      try {
        generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'idType', message: 'ID type is required' }
        ]);
      }
    });

    it('should throw ValidationError when accountType is invalid', () => {
      // Arrange
      const invalidData = {
        accountType: 'invalid',
        idType: 'NIN_SLIP'
      };

      // Act & Assert
      expect(() => generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError with correct error message when accountType is invalid', () => {
      // Arrange
      const invalidData = {
        accountType: 'invalid',
        idType: 'NIN_SLIP'
      };

      // Act & Assert
      expect(() => generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData))
        .toThrow(ValidationError);
      
      try {
        generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'accountType', message: 'Account type must be either "individual" or "business"' }
        ]);
      }
    });

    it('should throw ValidationError when idType is invalid for individual account', () => {
      // Arrange
      const invalidData = {
        accountType: 'individual',
        idType: 'BN' // BN is for business accounts
      };

      // Act & Assert
      expect(() => generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError with correct error message when idType is invalid for individual account', () => {
      // Arrange
      const invalidData = {
        accountType: 'individual',
        idType: 'BN'
      };

      // Act & Assert
      expect(() => generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData))
        .toThrow(ValidationError);
      
      try {
        generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'idType', message: 'Invalid ID type for individual account. Valid types: NIN_SLIP, BVN, V_NIN, PHONE_NUMBER' }
        ]);
      }
    });

    it('should throw ValidationError when idType is invalid for business account', () => {
      // Arrange
      const invalidData = {
        accountType: 'business',
        idType: 'NIN_SLIP' // NIN_SLIP is for individual accounts
      };

      // Act & Assert
      expect(() => generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError with correct error message when idType is invalid for business account', () => {
      // Arrange
      const invalidData = {
        accountType: 'business',
        idType: 'NIN_SLIP'
      };

      // Act & Assert
      expect(() => generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData))
        .toThrow(ValidationError);
      
      try {
        generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'idType', message: 'Invalid ID type for business account. Valid types: BN, CO, IT' }
        ]);
      }
    });

    it('should throw ValidationError when userId is too long', () => {
      // Arrange
      const invalidData = {
        accountType: 'individual',
        idType: 'NIN_SLIP',
        userId: 'a'.repeat(101) // 101 characters
      };

      // Act & Assert
      expect(() => generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError with correct error message when userId is too long', () => {
      // Arrange
      const invalidData = {
        accountType: 'individual',
        idType: 'NIN_SLIP',
        userId: 'a'.repeat(101)
      };

      // Act & Assert
      expect(() => generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData))
        .toThrow(ValidationError);
      
      try {
        generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual([
          { field: 'userId', message: 'User ID must not exceed 100 characters' }
        ]);
      }
    });

    it('should pass validation with valid individual account ID types', () => {
      // Arrange
      const validIdTypes = ['NIN_SLIP', 'BVN', 'V_NIN', 'PHONE_NUMBER'];

      // Act & Assert
      for (const idType of validIdTypes) {
        const validData = {
          accountType: 'individual',
          idType: idType
        };

        expect(() =>generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(validData))
          .not.toThrow();
      }
    });

    it('should pass validation with valid business account ID types', () => {
      // Arrange
      const validIdTypes = ['BN', 'CO', 'IT'];

      // Act & Assert
      for (const idType of validIdTypes) {
        const validData = {
          accountType: 'business',
          idType: idType
        };

        expect(() =>generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(validData))
          .not.toThrow();
      }
    });

    it('should pass validation with empty string userId', () => {
      // Arrange
      const validData = {
        accountType: 'individual',
        idType: 'NIN_SLIP',
        userId: ''
      };

      // Act & Assert
      expect(() =>generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(validData))
        .not.toThrow();
    });

    it('should pass validation with null userId', () => {
      // Arrange
      const validData = {
        accountType: 'individual',
        idType: 'NIN_SLIP',
        userId: null
      };

      // Act & Assert
      expect(() =>generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(validData))
        .not.toThrow();
    });

    it('should pass validation with undefined userId', () => {
      // Arrange
      const validData = {
        accountType: 'individual',
        idType: 'NIN_SLIP',
        userId: undefined
      };

      // Act & Assert
      expect(() =>generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(validData))
        .not.toThrow();
    });

    it('should pass validation with maximum length userId', () => {
      // Arrange
      const validData = {
        accountType: 'individual',
        idType: 'NIN_SLIP',
        userId: 'a'.repeat(100) // Exactly 100 characters
      };

      // Act & Assert
      expect(() =>generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(validData))
        .not.toThrow();
    });
  });
});
