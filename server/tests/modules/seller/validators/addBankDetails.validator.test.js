// Import the validator
const addBankDetailsValidator = require('@modules/seller/validators/addBankDetails.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Add Bank Details Validator', () => {
  describe('validateBankDetails', () => {
    it('should pass validation with valid data', () => {
      const validData = {
        bankCountry: 'Nigeria',
        bankName: 'First Bank of Nigeria',
        bankAccountType: 'Savings',
        accountCurrency: 'NGN',
        accountNumber: '1234567890',
        accountName: 'John Doe',
        swiftCode: 'FBNINGL',
        bankIdentifierCode: 'FBNINGL'
      };

      // Should not throw any error for valid data
      expect(() => {
        addBankDetailsValidator.validateBankDetails(validData);
      }).not.toThrow();
    });

    it('should pass validation with minimal required data', () => {
      const validData = {
        bankCountry: 'Nigeria',
        bankName: 'First Bank of Nigeria',
        bankAccountType: 'Savings',
        accountCurrency: 'NGN',
        accountNumber: '1234567890',
        accountName: 'John Doe'
      };

      // Should not throw any error for valid data without optional fields
      expect(() => {
        addBankDetailsValidator.validateBankDetails(validData);
      }).not.toThrow();
    });

    describe('bankCountry validation', () => {
      it('should throw error when bankCountry is missing', () => {
        const invalidData = {
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when bankCountry is not a string', () => {
        const invalidData = {
          bankCountry: 123,
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when bankCountry is too short', () => {
        const invalidData = {
          bankCountry: 'N',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when bankCountry is too long', () => {
        const invalidData = {
          bankCountry: 'A'.repeat(101),
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });
    });

    describe('bankName validation', () => {
      it('should throw error when bankName is missing', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when bankName is not a string', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 123,
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when bankName is too short', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'F',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when bankName is too long', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'A'.repeat(201),
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });
    });

    describe('bankAccountType validation', () => {
      it('should throw error when bankAccountType is missing', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when bankAccountType is not a string', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 123,
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when bankAccountType is too short', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'S',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when bankAccountType is too long', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'A'.repeat(51),
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });
    });

    describe('accountCurrency validation', () => {
      it('should throw error when accountCurrency is missing', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when accountCurrency is not a string', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 123,
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when accountCurrency is not exactly 3 characters', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NG',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when accountCurrency is more than 3 characters', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGNA',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });
    });

    describe('accountNumber validation', () => {
      it('should throw error when accountNumber is missing', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when accountNumber is not a string', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: 1234567890,
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when accountNumber is too short', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234',
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when accountNumber is too long', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: 'A'.repeat(51),
          accountName: 'John Doe'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });
    });

    describe('accountName validation', () => {
      it('should throw error when accountName is missing', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when accountName is not a string', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 123
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when accountName is too short', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'J'
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when accountName is too long', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'A'.repeat(201)
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });
    });

    describe('swiftCode validation (optional)', () => {
      it('should pass validation when swiftCode is not provided', () => {
        const validData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => {
          addBankDetailsValidator.validateBankDetails(validData);
        }).not.toThrow();
      });

      it('should throw error when swiftCode is not a string', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe',
          swiftCode: 123
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when swiftCode is too long', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe',
          swiftCode: 'A'.repeat(21)
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should pass validation with valid swiftCode', () => {
        const validData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe',
          swiftCode: 'FBNINGL'
        };

        expect(() => {
          addBankDetailsValidator.validateBankDetails(validData);
        }).not.toThrow();
      });
    });

    describe('bankIdentifierCode validation (optional)', () => {
      it('should pass validation when bankIdentifierCode is not provided', () => {
        const validData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe'
        };

        expect(() => {
          addBankDetailsValidator.validateBankDetails(validData);
        }).not.toThrow();
      });

      it('should throw error when bankIdentifierCode is not a string', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe',
          bankIdentifierCode: 123
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when bankIdentifierCode is too long', () => {
        const invalidData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe',
          bankIdentifierCode: 'A'.repeat(51)
        };

        expect(() => addBankDetailsValidator.validateBankDetails(invalidData)).toThrow(ValidationError);
      });

      it('should pass validation with valid bankIdentifierCode', () => {
        const validData = {
          bankCountry: 'Nigeria',
          bankName: 'First Bank of Nigeria',
          bankAccountType: 'Savings',
          accountCurrency: 'NGN',
          accountNumber: '1234567890',
          accountName: 'John Doe',
          bankIdentifierCode: 'FBNINGL'
        };

        expect(() => {
          addBankDetailsValidator.validateBankDetails(validData);
        }).not.toThrow();
      });
    });

    describe('multiple validation errors', () => {
      it('should collect all validation errors in a single throw', () => {
        const invalidData = {
          bankCountry: '',
          bankName: '',
          bankAccountType: '',
          accountCurrency: 'NG',
          accountNumber: '123',
          accountName: ''
        };

        try {
          addBankDetailsValidator.validateBankDetails(invalidData);
          fail('Should have thrown ValidationError');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect(error.message).toBe('Validation failed');
          expect(error.errors).toHaveLength(6);
          
          // Check that all expected errors are present
          const errorFields = error.errors.map(e => e.field);
          expect(errorFields).toContain('bankCountry');
          expect(errorFields).toContain('bankName');
          expect(errorFields).toContain('bankAccountType');
          expect(errorFields).toContain('accountCurrency');
          expect(errorFields).toContain('accountNumber');
          expect(errorFields).toContain('accountName');
        }
      });
    });
  });
});
