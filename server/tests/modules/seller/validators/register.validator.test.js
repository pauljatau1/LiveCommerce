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
      it('should NOT throw error when lastName is missing', () => {
        const validData = {
          firstName: 'John',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

        expect(() => sellerValidator.validateRegisterData(validData)).not.toThrow();
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

      it('should NOT throw error if lastName is omitted from valid data', () => {
        const validData = {
          firstName: 'John',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };
        expect(() => sellerValidator.validateRegisterData(validData)).not.toThrow();
      });
    });

    describe('email validation', () => {
      it('should throw error when email is missing', () => {
        const invalidData = {
          firstName: 'John',
          // lastName: 'Doe',
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

        expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow();
      });
    });

    describe('specific error messages', () => {
      it('should include correct error message for missing firstName', () => {
        const invalidData = {
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

        expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(ValidationError);
        
        // Test specific error message
        expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'firstName',
              message: 'firstName is required'
            })
          ])
        }));
      });

      it('should NOT include error message for missing lastName', () => {
        const validData = {
          firstName: 'John',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

        expect(() => sellerValidator.validateRegisterData(validData)).not.toThrow();
      });

      it('should include correct error message for missing email', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

        expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: 'Email is required'
            })
          ])
        }));
      });

      it('should include correct error message for missing password', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

        expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
              message: 'Password is required'
            })
          ])
        }));
      });

      it('should include correct error message for missing phoneNumber', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          storeName: 'John Store'
        };

        expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'phoneNumber',
              message: 'Phone number is required'
            })
          ])
        }));
      });

      it('should include correct error message for missing storeName', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890'
        };

        expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'storeName',
              message: 'Store name is required'
            })
          ])
        }));
      });

      it('should include correct error message for invalid email format', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

        expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: 'Please provide a valid email address'
            })
          ])
        }));
      });

      it('should include correct error message for short password', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: '12345',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

        expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
              message: 'Password must be at least 6 characters long'
            })
          ])
        }));
      });

      it('should include correct error message for short firstName', () => {
        const invalidData = {
          firstName: 'J',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

        expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'firstName',
              message: 'firstName must be at least 2 characters long'
            })
          ])
        }));
      });

      it('should include correct error message for short lastName', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'D',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'John Store'
        };

        expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'lastName',
              message: 'lastName must be at least 2 characters long'
            })
          ])
        }));
      });

      it('should include correct error message for short phoneNumber', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '123',
          storeName: 'John Store'
        };

        expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'phoneNumber',
              message: 'Phone number must be at least 10 characters long'
            })
          ])
        }));
      });

      it('should include correct error message for short storeName', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'J'
        };

        expect(() => sellerValidator.validateRegisterData(invalidData)).toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'storeName',
              message: 'Store name must be at least 2 characters long'
            })
          ])
        }));
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
          phoneNumber: '+2348031234567',
          storeName: 'A'.repeat(100)
        };

        expect(() => sellerValidator.validateRegisterData(validData)).not.toThrow();
      });

      it('should not throw if lastName is entirely omitted', () => {
        const validData = {
          firstName: 'Jane',
          email: 'jane.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'Jane Store'
        };

        expect(() => sellerValidator.validateRegisterData(validData)).not.toThrow();
      });
    });
  });
});
