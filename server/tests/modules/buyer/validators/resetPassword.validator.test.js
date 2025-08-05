const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const resetPasswordValidator = require('@modules/buyer/validators/resetPassword.validator');
const Buyer = require('@modules/buyer/models/buyer.model');
const ValidationError = require('@utils/errors/ValidationError');

let mongoServer;

describe('resetPassword.validator', () => {
  let testBuyer;

  beforeAll(async () => {
    // Start in-memory MongoDB with compatible version
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
    await Buyer.deleteMany({});
    
    // Create a test buyer with reset OTP
    testBuyer = new Buyer({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'hashedPassword123',
      resetPasswordOTP: '1234',
      resetPasswordOTPExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    });
    await testBuyer.save();
  });

  afterEach(async () => {
    await Buyer.deleteMany({});
  });

  describe('validateResetPasswordData', () => {
    it('should validate successful reset password data', async () => {
      // Arrange
      const validData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };

      // Act
      const result = await resetPasswordValidator.validateResetPasswordData(validData);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe('john.doe@example.com');
      expect(result.resetPasswordOTP).toBe('1234');
    });

    it('should throw ValidationError when email is missing', async () => {
      // Arrange
      const invalidData = {
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email format is invalid', async () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when buyer does not exist', async () => {
      // Arrange
      const invalidData = {
        email: 'nonexistent@example.com',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when OTP is missing', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when OTP is not 4 digits', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        otp: '123',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when OTP is not numeric', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        otp: 'abcd',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when OTP is not a string type', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        otp: 1234, // Number instead of string
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when new password is missing', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        otp: '1234'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when new password is too short', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: 'weak'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when new password has no letters', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: '123456'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when new password has no numbers', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: 'password'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when OTP does not match', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        otp: '5678',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when OTP has expired', async () => {
      // Arrange - Update buyer with expired OTP
      testBuyer.resetPasswordOTPExpires = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      await testBuyer.save();

      const invalidData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when OTP expiry is missing', async () => {
      // Arrange - Update buyer with no expiry
      testBuyer.resetPasswordOTPExpires = undefined;
      await testBuyer.save();

      const invalidData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should handle case insensitive email matching', async () => {
      // Arrange
      const validData = {
        email: 'JOHN.DOE@EXAMPLE.COM',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };

      // Act
      const result = await resetPasswordValidator.validateResetPasswordData(validData);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe('john.doe@example.com');
    });
  });
}); 