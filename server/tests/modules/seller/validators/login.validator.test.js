const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const sellerValidator = require('@modules/seller/validators/login.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Login Validator', () => {
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

  describe('validateLoginData', () => {
    const validLoginData = {
      email: 'seller@example.com',
      password: 'password123'
    };

    it('should pass validation with valid data', () => {
      expect(() => {
        sellerValidator.validateLoginData(validLoginData);
      }).not.toThrow();
    });

    it('should throw ValidationError when data is null', () => {
      expect(() => {
        sellerValidator.validateLoginData(null);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when data is undefined', () => {
      expect(() => {
        sellerValidator.validateLoginData(undefined);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when email is missing', () => {
      const invalidData = {
        password: 'password123'
      };

      expect(() => {
        sellerValidator.validateLoginData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when password is missing', () => {
      const invalidData = {
        email: 'seller@example.com'
      };

      expect(() => {
        sellerValidator.validateLoginData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when email is empty string', () => {
      const invalidData = {
        email: '',
        password: 'password123'
      };

      expect(() => {
        sellerValidator.validateLoginData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when password is empty string', () => {
      const invalidData = {
        email: 'seller@example.com',
        password: ''
      };

      expect(() => {
        sellerValidator.validateLoginData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when password is not string or number', () => {
      const invalidData = {
        email: 'seller@example.com',
        password: {}
      };

      expect(() => {
        sellerValidator.validateLoginData(invalidData);
      }).toThrow(ValidationError);
    });

    it('should pass validation with numeric password', () => {
      const validData = {
        email: 'seller@example.com',
        password: 123456
      };

      expect(() => {
        sellerValidator.validateLoginData(validData);
      }).not.toThrow();
    });

    it('should include correct error messages for missing email', () => {
      const invalidData = {
        password: 'password123'
      };

      expect(() => sellerValidator.validateLoginData(invalidData)).toThrow(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Email is required'
          })
        ])
      }));
    });

    it('should include correct error messages for missing password', () => {
      const invalidData = {
        email: 'seller@example.com'
      };

      expect(() => sellerValidator.validateLoginData(invalidData)).toThrow(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: 'Password is required'
          })
        ])
      }));
    });

    it('should include correct error messages for invalid password type', () => {
      const invalidData = {
        email: 'seller@example.com',
        password: {}
      };

      expect(() => sellerValidator.validateLoginData(invalidData)).toThrow(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: 'Password must be a string or number'
          })
        ])
      }));
    });

    it('should include multiple error messages when both email and password are missing', () => {
      const invalidData = {};

      expect(() => sellerValidator.validateLoginData(invalidData)).toThrow(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Email is required'
          }),
          expect.objectContaining({
            field: 'password',
            message: 'Password is required'
          })
        ])
      }));
    });

    it('should include multiple error messages when data is null', () => {
      expect(() => sellerValidator.validateLoginData(null)).toThrow(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Email is required'
          }),
          expect.objectContaining({
            field: 'password',
            message: 'Password is required'
          })
        ])
      }));
    });
  });
});
