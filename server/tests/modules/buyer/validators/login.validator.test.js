const loginValidator = require('@modules/buyer/validators/login.validator');

describe('Login Validator', () => {
  describe('validateLoginInput', () => {
    describe('Valid Input', () => {
      it('should return empty errors array for valid login data', () => {
        // Arrange
        const validData = {
          email: 'test@example.com',
          password: 'password123'
        };

        // Act
        const result = loginValidator.validateLoginInput(validData);

        // Assert
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should accept valid email with uppercase letters', () => {
        // Arrange
        const validData = {
          email: 'TEST@EXAMPLE.COM',
          password: 'password123'
        };

        // Act
        const result = loginValidator.validateLoginInput(validData);

        // Assert
        expect(result).toEqual([]);
      });

      it('should accept valid email with mixed case', () => {
        // Arrange
        const validData = {
          email: 'Test@Example.Com',
          password: 'password123'
        };

        // Act
        const result = loginValidator.validateLoginInput(validData);

        // Assert
        expect(result).toEqual([]);
      });

      it('should accept valid email with numbers', () => {
        // Arrange
        const validData = {
          email: 'test123@example.com',
          password: 'password123'
        };

        // Act
        const result = loginValidator.validateLoginInput(validData);

        // Assert
        expect(result).toEqual([]);
      });

      it('should accept valid email with special characters', () => {
        // Arrange
        const validData = {
          email: 'test.user+tag@example-domain.com',
          password: 'password123'
        };

        // Act
        const result = loginValidator.validateLoginInput(validData);

        // Assert
        expect(result).toEqual([]);
      });

      it('should accept valid password with special characters', () => {
        // Arrange
        const validData = {
          email: 'test@example.com',
          password: 'P@ssw0rd!'
        };

        // Act
        const result = loginValidator.validateLoginInput(validData);

        // Assert
        expect(result).toEqual([]);
      });

      it('should accept valid password with spaces', () => {
        // Arrange
        const validData = {
          email: 'test@example.com',
          password: 'password with spaces'
        };

        // Act
        const result = loginValidator.validateLoginInput(validData);

        // Assert
        expect(result).toEqual([]);
      });

      it('should accept additional fields without validation', () => {
        // Arrange
        const validData = {
          email: 'test@example.com',
          password: 'password123',
          expoPushToken: 'expo-token',
          googleToken: 'google-token',
          rememberMe: true
        };

        // Act
        const result = loginValidator.validateLoginInput(validData);

        // Assert
        expect(result).toEqual([]);
      });
    });

    describe('Missing Email', () => {
      it('should return error when email is missing', () => {
        // Arrange
        const invalidData = {
          password: 'password123'
        };

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          field: 'email',
          message: 'Email is required'
        });
      });

      it('should return error when email is undefined', () => {
        // Arrange
        const invalidData = {
          email: undefined,
          password: 'password123'
        };

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          field: 'email',
          message: 'Email is required'
        });
      });

      it('should return error when email is null', () => {
        // Arrange
        const invalidData = {
          email: null,
          password: 'password123'
        };

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          field: 'email',
          message: 'Email is required'
        });
      });

      it('should return error when email is empty string', () => {
        // Arrange
        const invalidData = {
          email: '',
          password: 'password123'
        };

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          field: 'email',
          message: 'Email is required'
        });
      });
    });

    describe('Missing Password', () => {
      it('should return error when password is missing', () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com'
        };

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          field: 'password',
          message: 'Password is required'
        });
      });

      it('should return error when password is undefined', () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com',
          password: undefined
        };

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          field: 'password',
          message: 'Password is required'
        });
      });

      it('should return error when password is null', () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com',
          password: null
        };

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          field: 'password',
          message: 'Password is required'
        });
      });

      it('should return error when password is empty string', () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com',
          password: ''
        };

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          field: 'password',
          message: 'Password is required'
        });
      });
    });

    describe('Multiple Missing Fields', () => {
      it('should return multiple errors when both email and password are missing', () => {
        // Arrange
        const invalidData = {};

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toHaveLength(2);
        expect(result).toContainEqual({
          field: 'email',
          message: 'Email is required'
        });
        expect(result).toContainEqual({
          field: 'password',
          message: 'Password is required'
        });
      });

      it('should return multiple errors when both email and password are null', () => {
        // Arrange
        const invalidData = {
          email: null,
          password: null
        };

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toHaveLength(2);
        expect(result).toContainEqual({
          field: 'email',
          message: 'Email is required'
        });
        expect(result).toContainEqual({
          field: 'password',
          message: 'Password is required'
        });
      });

      it('should return multiple errors when both email and password are empty strings', () => {
        // Arrange
        const invalidData = {
          email: '',
          password: ''
        };

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toHaveLength(2);
        expect(result).toContainEqual({
          field: 'email',
          message: 'Email is required'
        });
        expect(result).toContainEqual({
          field: 'password',
          message: 'Password is required'
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle data parameter as null', () => {
        // Act
        const result = loginValidator.validateLoginInput(null);

        // Assert
        expect(result).toHaveLength(1);
        expect(result).toContainEqual({
          field: 'email',
          message: 'Email is required'
        })
      });

      it('should handle data parameter as undefined', () => {
        // Act
        const result = loginValidator.validateLoginInput(undefined);

        // Assert
        expect(result).toHaveLength(1);
        expect(result).toContainEqual({
          field: 'email',
          message: 'Email is required'
        });
      });

      it('should handle data parameter as empty object', () => {
        // Act
        const result = loginValidator.validateLoginInput({});

        // Assert
        expect(result).toHaveLength(2);
        expect(result).toContainEqual({
          field: 'email',
          message: 'Email is required'
        });
        expect(result).toContainEqual({
          field: 'password',
          message: 'Password is required'
        });
      });

      it('should handle data parameter as non-object', () => {
        // Act
        const result = loginValidator.validateLoginInput('not an object');

        // Assert
        expect(result).toHaveLength(2);
        expect(result).toContainEqual({
          field: 'email',
          message: 'Email is required'
        });
        expect(result).toContainEqual({
          field: 'password',
          message: 'Password is required'
        });
      });

      it('should handle data parameter as number', () => {
        // Act
        const result = loginValidator.validateLoginInput(123);

        // Assert
        expect(result).toHaveLength(2);
        expect(result).toContainEqual({
          field: 'email',
          message: 'Email is required'
        });
        expect(result).toContainEqual({
          field: 'password',
          message: 'Password is required'
        });
      });

      it('should handle data parameter as boolean', () => {
        // Act
        const result = loginValidator.validateLoginInput(true);

        // Assert
        expect(result).toHaveLength(2);
        expect(result).toContainEqual({
          field: 'email',
          message: 'Email is required'
        });
        expect(result).toContainEqual({
          field: 'password',
          message: 'Password is required'
        });
      });

      it('should handle data parameter as array', () => {
        // Act
        const result = loginValidator.validateLoginInput([]);

        // Assert
        expect(result).toHaveLength(2);
        expect(result).toContainEqual({
          field: 'email',
          message: 'Email is required'
        });
        expect(result).toContainEqual({
          field: 'password',
          message: 'Password is required'
        });
      });
    });

    describe('Data Types', () => {
      it('should accept email as number (string conversion)', () => {
        // Arrange
        const validData = {
          email: 12345,
          password: 'password123'
        };

        // Act
        const result = loginValidator.validateLoginInput(validData);

        // Assert
        expect(result).toEqual([]);
      });

      it('should accept password as number', () => {
        // Arrange
        const validData = {
          email: 'test@example.com',
          password: 12345
        };

        // Act
        const result = loginValidator.validateLoginInput(validData);

        // Assert
        expect(result).toEqual([]);
      });

      it('should accept email as boolean (string conversion)', () => {
        // Arrange
        const validData = {
          email: true,
          password: 'password123'
        };

        // Act
        const result = loginValidator.validateLoginInput(validData);

        // Assert
        expect(result).toEqual([]);
      });

      it('should reject password as boolean', () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com',
          password: false
        };

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          field: 'password',
          message: 'Password is required'
        });
      });

      it('should reject password as object', () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com',
          password: { key: 'value' }
        };

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          field: 'password',
          message: 'Password must be a string or number'
        });
      });

      it('should reject password as array', () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com',
          password: ['password1', 'password2']
        };

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          field: 'password',
          message: 'Password must be a string or number'
        });
      });

      it('should reject password as null when it exists', () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com',
          password: null
        };

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          field: 'password',
          message: 'Password is required'
        });
      });
    });

    describe('Error Structure', () => {
      it('should return errors with correct structure', () => {
        // Arrange
        const invalidData = {};

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        
        result.forEach(error => {
          expect(error).toHaveProperty('field');
          expect(error).toHaveProperty('message');
          expect(typeof error.field).toBe('string');
          expect(typeof error.message).toBe('string');
          expect(error.field).toMatch(/^(email|password)$/);
          expect(error.message).toContain('required');
        });
      });

      it('should return errors in consistent order', () => {
        // Arrange
        const invalidData = {};

        // Act
        const result = loginValidator.validateLoginInput(invalidData);

        // Assert
        expect(result[0].field).toBe('email');
        expect(result[1].field).toBe('password');
      });
    });

    describe('Performance', () => {
      it('should handle large data objects efficiently', () => {
        // Arrange
        const largeData = {
          email: 'test@example.com',
          password: 'password123',
          ...Array.from({ length: 1000 }, (_, i) => ({ [`field${i}`]: `value${i}` })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
        };

        // Act
        const startTime = Date.now();
        const result = loginValidator.validateLoginInput(largeData);
        const endTime = Date.now();

        // Assert
        expect(result).toEqual([]);
        expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
      });
    });
  });
}); 