const { validateLoginData } = require('@modules/buyer/validators/login.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Login Validator', () => {
  describe('validateLoginData', () => {
    describe('Valid Inputs', () => {
      it('should not throw for valid email and password', async () => {
        const validData = {
          email: 'test@example.com',
          password: 'password123'
        };

        await expect(validateLoginData(validData)).resolves.not.toThrow();
      });

      it('should not throw for valid email and numeric password', async () => {
        const validData = {
          email: 'test@example.com',
          password: 12345
        };

        await expect(validateLoginData(validData)).resolves.not.toThrow();
      });

      it('should not throw for valid email with subdomain', async () => {
        const validData = {
          email: 'test@subdomain.example.com',
          password: 'password123'
        };

        await expect(validateLoginData(validData)).resolves.not.toThrow();
      });

      it('should not throw for valid email with numbers', async () => {
        const validData = {
          email: 'test123@example.com',
          password: 'password123'
        };

        await expect(validateLoginData(validData)).resolves.not.toThrow();
      });
    });

    describe('Invalid Inputs', () => {
      it('should throw ValidationError when data is null', async () => {
        await expect(validateLoginData(null)).rejects.toThrow(ValidationError);
        await expect(validateLoginData(null)).rejects.toMatchObject({
          errors: [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password is required' }
          ]
        });
      });

      it('should throw ValidationError when data is undefined', async () => {
        await expect(validateLoginData(undefined)).rejects.toThrow(ValidationError);
        await expect(validateLoginData(undefined)).rejects.toMatchObject({
          errors: [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password is required' }
          ]
        });
      });

      it('should throw ValidationError when email is missing', async () => {
        const invalidData = {
          password: 'password123'
        };

        await expect(validateLoginData(invalidData)).rejects.toThrow(ValidationError);
        await expect(validateLoginData(invalidData)).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should throw ValidationError when password is missing', async () => {
        const invalidData = {
          email: 'test@example.com'
        };

        await expect(validateLoginData(invalidData)).rejects.toThrow(ValidationError);
        await expect(validateLoginData(invalidData)).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password is required' }]
        });
      });

      it('should throw ValidationError when both email and password are missing', async () => {
        const invalidData = {};

        await expect(validateLoginData(invalidData)).rejects.toThrow(ValidationError);
        await expect(validateLoginData(invalidData)).rejects.toMatchObject({
          errors: [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password is required' }
          ]
        });
      });

      it('should throw ValidationError when email is empty string', async () => {
        const invalidData = {
          email: '',
          password: 'password123'
        };

        await expect(validateLoginData(invalidData)).rejects.toThrow(ValidationError);
        await expect(validateLoginData(invalidData)).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should throw ValidationError when password is empty string', async () => {
        const invalidData = {
          email: 'test@example.com',
          password: ''
        };

        await expect(validateLoginData(invalidData)).rejects.toThrow(ValidationError);
        await expect(validateLoginData(invalidData)).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password is required' }]
        });
      });

      it('should throw ValidationError when email is null', async () => {
        const invalidData = {
          email: null,
          password: 'password123'
        };

        await expect(validateLoginData(invalidData)).rejects.toThrow(ValidationError);
        await expect(validateLoginData(invalidData)).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should throw ValidationError when password is null', async () => {
        const invalidData = {
          email: 'test@example.com',
          password: null
        };

        await expect(validateLoginData(invalidData)).rejects.toThrow(ValidationError);
        await expect(validateLoginData(invalidData)).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password is required' }]
        });
      });

      it('should throw ValidationError when email is undefined', async () => {
        const invalidData = {
          email: undefined,
          password: 'password123'
        };

        await expect(validateLoginData(invalidData)).rejects.toThrow(ValidationError);
        await expect(validateLoginData(invalidData)).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should throw ValidationError when password is undefined', async () => {
        const invalidData = {
          email: 'test@example.com',
          password: undefined
        };

        await expect(validateLoginData(invalidData)).rejects.toThrow(ValidationError);
        await expect(validateLoginData(invalidData)).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password is required' }]
        });
      });

      it('should throw ValidationError when password is boolean', async () => {
        const invalidData = {
          email: 'test@example.com',
          password: true
        };

        await expect(validateLoginData(invalidData)).rejects.toThrow(ValidationError);
        await expect(validateLoginData(invalidData)).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password must be a string or number' }]
        });
      });

      it('should throw ValidationError when password is object', async () => {
        const invalidData = {
          email: 'test@example.com',
          password: {}
        };

        await expect(validateLoginData(invalidData)).rejects.toThrow(ValidationError);
        await expect(validateLoginData(invalidData)).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password must be a string or number' }]
        });
      });

      it('should throw ValidationError when password is array', async () => {
        const invalidData = {
          email: 'test@example.com',
          password: []
        };

        await expect(validateLoginData(invalidData)).rejects.toThrow(ValidationError);
        await expect(validateLoginData(invalidData)).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password must be a string or number' }]
        });
      });

      it('should throw ValidationError when password is function', async () => {
        const invalidData = {
          email: 'test@example.com',
          password: () => {}
        };

        await expect(validateLoginData(invalidData)).rejects.toThrow(ValidationError);
        await expect(validateLoginData(invalidData)).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password must be a string or number' }]
        });
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for null data', async () => {
        await expect(validateLoginData(null)).rejects.toMatchObject({
          errors: [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password is required' }
          ]
        });
      });

      it('should include specific error message for undefined data', async () => {
        await expect(validateLoginData(undefined)).rejects.toMatchObject({
          errors: [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password is required' }
          ]
        });
      });

      it('should include specific error message for missing email', async () => {
        await expect(validateLoginData({ password: 'password123' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should include specific error message for missing password', async () => {
        await expect(validateLoginData({ email: 'test@example.com' })).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password is required' }]
        });
      });

      it('should include specific error message for empty email', async () => {
        await expect(validateLoginData({ email: '', password: 'password123' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should include specific error message for empty password', async () => {
        await expect(validateLoginData({ email: 'test@example.com', password: '' })).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password is required' }]
        });
      });

      it('should include specific error message for null email', async () => {
        await expect(validateLoginData({ email: null, password: 'password123' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should include specific error message for null password', async () => {
        await expect(validateLoginData({ email: 'test@example.com', password: null })).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password is required' }]
        });
      });

      it('should include specific error message for undefined email', async () => {
        await expect(validateLoginData({ email: undefined, password: 'password123' })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should include specific error message for undefined password', async () => {
        await expect(validateLoginData({ email: 'test@example.com', password: undefined })).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password is required' }]
        });
      });

      it('should include specific error message for boolean password', async () => {
        await expect(validateLoginData({ email: 'test@example.com', password: true })).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password must be a string or number' }]
        });
      });

      it('should include specific error message for object password', async () => {
        await expect(validateLoginData({ email: 'test@example.com', password: {} })).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password must be a string or number' }]
        });
      });

      it('should include specific error message for array password', async () => {
        await expect(validateLoginData({ email: 'test@example.com', password: [] })).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password must be a string or number' }]
        });
      });

      it('should include specific error message for function password', async () => {
        await expect(validateLoginData({ email: 'test@example.com', password: () => {} })).rejects.toMatchObject({
          errors: [{ field: 'password', message: 'Password must be a string or number' }]
        });
      });

      it('should include multiple error messages when both fields are invalid', async () => {
        await expect(validateLoginData({})).rejects.toMatchObject({
          errors: [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password is required' }
          ]
        });
      });
    });
  });
}); 