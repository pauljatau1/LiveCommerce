// Import the validator
const sellerValidator = require('@modules/seller/validators/register.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Seller Registration Validator', () => {
  describe('validateRegisterData', () => {
    it('should pass validation with valid data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      };

      // Should not throw any error for valid data
      expect(() => {
        sellerValidator.validateRegisterData(validData);
      }).not.toThrow();
    });

    describe('firstName validation', () => {
      it('should throw error when firstName is missing', () => {
        const invalidData = {
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when firstName is not a string', () => {
        const invalidData = {
          firstName: 123,
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when firstName is too short', () => {
        const invalidData = {
          firstName: 'J',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when firstName is too long', () => {
        const invalidData = {
          firstName: 'A'.repeat(51),
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });
    });

    describe('lastName validation', () => {
      it('should throw error when lastName is missing', () => {
        const invalidData = {
          firstName: 'John',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when lastName is not a string', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 123,
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when lastName is too short', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'D',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when lastName is too long', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'A'.repeat(51),
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });
    });

    describe('email validation', () => {
      it('should throw error when email is missing', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when email is not a string', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 123,
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when email is too short', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'ab',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when email is too long', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'a'.repeat(255),
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when email format is invalid', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should pass validation with valid email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org'
        ];

        validEmails.forEach(email => {
          const validData = {
            firstName: 'John',
            lastName: 'Doe',
            email: email,
            password: 'password123',
            phoneNumber: '1234567890',
            storeName: 'John Store'
          };

          expect(() => sellerValidator.validateRegisterData(validData)).not.toThrow();
        });
      });
    });

    describe('password validation', () => {
      it('should throw error when password is missing', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when password is not a string', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 123,
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when password is too short', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: '12345',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });
    });

    describe('phoneNumber validation', () => {
      it('should throw error when phoneNumber is missing', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when phoneNumber is not a string', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: 1234567890,
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when phoneNumber is too short', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '123456789',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when phoneNumber is too long', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890123456',
          storeName: 'John Store'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });
    });

    describe('storeName validation', () => {
      it('should throw error when storeName is missing', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when storeName is not a string', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 123
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when storeName is too short', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'A'
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should throw error when storeName is too long', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'A'.repeat(101)
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });
    });

    describe('multiple validation errors', () => {
      it('should throw error with multiple validation failures', () => {
        const invalidData = {
          firstName: '',
          lastName: '',
          email: 'invalid-email',
          password: '123',
          phoneNumber: '123',
          storeName: ''
        };

                 expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
      });

      it('should include all validation errors in the thrown object', () => {
        const invalidData = {
          firstName: '',
          lastName: '',
          email: 'invalid-email',
          password: '123',
          phoneNumber: '123',
          storeName: ''
        };

        try {
          sellerValidator.validateRegisterData(invalidData);
        } catch (error) {
          expect(error.errors).toBeDefined();
          expect(Array.isArray(error.errors)).toBe(true);
          expect(error.errors.length).toBeGreaterThan(0);
          
          // Check that each error has field and message properties
          error.errors.forEach(err => {
            expect(err.field).toBeDefined();
            expect(err.message).toBeDefined();
          });
        }
      });
    });

    describe('edge cases', () => {
      it('should handle whitespace in string fields', () => {
        const validData = {
          firstName: '  John  ',
          lastName: '  Doe  ',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '  1234567890  ',
          storeName: '  John Store  '
        };

        expect(() => sellerValidator.validateRegisterData(validData)).not.toThrow();
      });

      it('should handle minimum valid lengths', () => {
        const validData = {
          firstName: 'Jo',
          lastName: 'Do',
          email: 'a@b.c',
          password: '123456',
          phoneNumber: '1234567890',
          storeName: 'JS'
        };

        expect(() => sellerValidator.validateRegisterData(validData)).not.toThrow();
      });

      it('should handle maximum valid lengths', () => {
        const validData = {
          firstName: 'A'.repeat(50),
          lastName: 'A'.repeat(50),
          email: 'a'.repeat(240) + '@example.com',
          password: 'password123',
          phoneNumber: '123456789012345',
          storeName: 'A'.repeat(100)
        };

        expect(() => sellerValidator.validateRegisterData(validData)).not.toThrow();
      });
    });
  });
});
