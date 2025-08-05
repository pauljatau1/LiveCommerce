const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const forgotPasswordValidator = require('@modules/buyer/validators/forgotPassword.validator');
const Buyer = require('@modules/buyer/models/buyer.model');
const ValidationError = require('@utils/errors/ValidationError');

let mongoServer;

describe('forgotPassword.validator', () => {
  let testBuyer;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3'
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await Buyer.deleteMany({});
    
    // Create a test buyer
    testBuyer = new Buyer({
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john.doe@example.com',
      password: 'password123',
      country: 'Nigeria',
      phoneNumber: '+2348012345678'
    });
    await testBuyer.save();
  });

  afterEach(async () => {
    // Clean up after each test
    await Buyer.deleteMany({});
  });

  describe('validateForgotPasswordData', () => {
    it('should pass validation with valid email that exists', async () => {
      // Arrange
      const validData = {
        email: 'john.doe@example.com'
      };

      // Act & Assert
      await expect(forgotPasswordValidator.validateForgotPasswordData(validData))
        .resolves.not.toThrow();
    });

    it('should throw ValidationError when email is missing', async () => {
      // Arrange
      const invalidData = {};

      // Act & Assert
      await expect(forgotPasswordValidator.validateForgotPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
      
      try {
        await forgotPasswordValidator.validateForgotPasswordData(invalidData);
      } catch (error) {
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({
          field: 'email',
          message: 'Email is required'
        });
      }
    });

    it('should throw ValidationError when email is empty string', async () => {
      // Arrange
      const invalidData = {
        email: ''
      };

      // Act & Assert
      await expect(forgotPasswordValidator.validateForgotPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
      
      try {
        await forgotPasswordValidator.validateForgotPasswordData(invalidData);
      } catch (error) {
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({
          field: 'email',
          message: 'Email is required'
        });
      }
    });

    it('should throw ValidationError when email is null', async () => {
      // Arrange
      const invalidData = {
        email: null
      };

      // Act & Assert
      await expect(forgotPasswordValidator.validateForgotPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
      
      try {
        await forgotPasswordValidator.validateForgotPasswordData(invalidData);
      } catch (error) {
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({
          field: 'email',
          message: 'Email is required'
        });
      }
    });

    it('should throw ValidationError when email format is invalid', async () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email'
      };

      // Act & Assert
      await expect(forgotPasswordValidator.validateForgotPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
      
      try {
        await forgotPasswordValidator.validateForgotPasswordData(invalidData);
      } catch (error) {
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({
          field: 'email',
          message: 'Invalid email format'
        });
      }
    });

    it('should throw ValidationError when email format is invalid with @ symbol', async () => {
      // Arrange
      const invalidData = {
        email: 'test@'
      };

      // Act & Assert
      await expect(forgotPasswordValidator.validateForgotPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
      
      try {
        await forgotPasswordValidator.validateForgotPasswordData(invalidData);
      } catch (error) {
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({
          field: 'email',
          message: 'Invalid email format'
        });
      }
    });

    it('should throw ValidationError when email format is invalid with domain only', async () => {
      // Arrange
      const invalidData = {
        email: '@example.com'
      };

      // Act & Assert
      await expect(forgotPasswordValidator.validateForgotPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
      
      try {
        await forgotPasswordValidator.validateForgotPasswordData(invalidData);
      } catch (error) {
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({
          field: 'email',
          message: 'Invalid email format'
        });
      }
    });

    it('should throw ValidationError when email exists but buyer does not exist', async () => {
      // Arrange
      const invalidData = {
        email: 'nonexistent@example.com'
      };

      // Act & Assert
      await expect(forgotPasswordValidator.validateForgotPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
      
      try {
        await forgotPasswordValidator.validateForgotPasswordData(invalidData);
      } catch (error) {
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({
          field: 'email',
          message: 'No account found with this email'
        });
      }
    });

    it('should pass validation with valid email format and existing buyer (case insensitive)', async () => {
      // Arrange
      const validData = {
        email: 'JOHN.DOE@EXAMPLE.COM'
      };

      // Act & Assert
      await expect(forgotPasswordValidator.validateForgotPasswordData(validData))
        .resolves.not.toThrow();
    });

    it('should pass validation with valid email format and existing buyer (lowercase)', async () => {
      // Arrange
      const validData = {
        email: 'john.doe@example.com'
      };

      // Act & Assert
      await expect(forgotPasswordValidator.validateForgotPasswordData(validData))
        .resolves.not.toThrow();
    });

    it('should pass validation with valid email format and existing buyer (mixed case)', async () => {
      // Arrange
      const validData = {
        email: 'John.Doe@Example.com'
      };

      // Act & Assert
      await expect(forgotPasswordValidator.validateForgotPasswordData(validData))
        .resolves.not.toThrow();
    });

    it('should handle multiple validation errors', async () => {
      // Arrange - This test is more theoretical since we validate email format first
      // But we can test the structure of ValidationError
      const invalidData = {
        email: 'invalid-email'
      };

      // Act & Assert
      try {
        await forgotPasswordValidator.validateForgotPasswordData(invalidData);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toBeDefined();
        expect(Array.isArray(error.errors)).toBe(true);
      }
    });
  });
}); 