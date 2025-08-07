const loginValidator = require('@modules/buyer/validators/login.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Login Validator', () => {
  describe('validateLoginInput', () => {
    describe('Valid Inputs', () => {
      it('should not throw for valid email and password', () => {
        // Arrange
        const validData = {
          email: 'test@example.com',
          password: 'password123'
        };

        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(validData);
        }).not.toThrow();
      });

      it('should not throw for valid email and numeric password', () => {
        // Arrange
        const validData = {
          email: 'test@example.com',
          password: 12345
        };

        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(validData);
        }).not.toThrow();
      });
    });

    describe('Invalid Inputs', () => {
      it('should throw ValidationError when email is missing', () => {
        // Arrange
        const invalidData = {
          password: 'password123'
        };

        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when password is missing', () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com'
        };

        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when both email and password are missing', () => {
        // Arrange
        const invalidData = {};

        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when email is empty string', () => {
        // Arrange
        const invalidData = {
          email: '',
          password: 'password123'
        };

        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when password is empty string', () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com',
          password: ''
        };

        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when email is null', () => {
        // Arrange
        const invalidData = {
          email: null,
          password: 'password123'
        };

        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when password is null', () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com',
          password: null
        };

        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when email is undefined', () => {
        // Arrange
        const invalidData = {
          email: undefined,
          password: 'password123'
        };

        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when password is undefined', () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com',
          password: undefined
        };

        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when password is boolean', () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com',
          password: true
        };

        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when password is object', () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com',
          password: {}
        };

        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when password is array', () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com',
          password: []
        };

        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(ValidationError);
      });
    });

    describe('Edge Cases', () => {
      it('should throw ValidationError when data parameter is null', () => {
        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(null);
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when data parameter is undefined', () => {
        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(undefined);
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when data parameter is non-object', () => {
        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput('not an object');
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when data parameter is number', () => {
        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(123);
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when data parameter is boolean', () => {
        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput(true);
        }).toThrow(ValidationError);
      });

      it('should throw ValidationError when data parameter is array', () => {
        // Act & Assert
        expect(() => {
          loginValidator.validateLoginInput([]);
        }).toThrow(ValidationError);
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing email', () => {
        const invalidData = {
          password: 'password123'
        };

        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(expect.objectContaining({
          errors: [
            {
              field: 'email',
              message: 'Email is required'
            }
          ]
        }));
      });

      it('should include specific error message for missing password', () => {
        const invalidData = {
          email: 'test@example.com'
        };

        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(expect.objectContaining({
          errors: [
            {
              field: 'password',
              message: 'Password is required'
            }
          ]
        }));
      });

      it('should include specific error message for invalid password type', () => {
        const invalidData = {
          email: 'test@example.com',
          password: true
        };

        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(expect.objectContaining({
          errors: [
            {
              field: 'password',
              message: 'Password must be a string or number'
            }
          ]
        }));
      });

      it('should include specific error message for null data', () => {
        expect(() => {
          loginValidator.validateLoginInput(null);
        }).toThrow(expect.objectContaining({
          errors: [
            {
              field: 'email',
              message: 'Email is required'
            }
          ]
        }));
      });

      it('should include multiple error messages for missing email and password', () => {
        const invalidData = {};

        expect(() => {
          loginValidator.validateLoginInput(invalidData);
        }).toThrow(expect.objectContaining({
          errors: [
            {
              field: 'email',
              message: 'Email is required'
            },
            {
              field: 'password',
              message: 'Password is required'
            }
          ]
        }));
      });
    });
  });
}); 