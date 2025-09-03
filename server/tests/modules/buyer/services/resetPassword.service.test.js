const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const resetPasswordService = require('@modules/buyer/services/resetPassword.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const Buyer = require('@models/Buyer');
const ValidationError = require('@utils/errors/ValidationError');
const bcrypt = require('bcrypt');

let mongoServer;

describe('resetPassword.service', () => {
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
    jest.clearAllMocks();
    
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

  describe('resetPassword', () => {
    it('should successfully reset password with valid data', async () => {
      // Arrange
      const resetPasswordData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };

      // Act
      const result = await resetPasswordService.resetPassword(resetPasswordData);

      // Assert
      expect(result).toEqual({
        message: 'Password reset successfully'
      });

      // Verify buyer was updated
      const updatedBuyer = await Buyer.findById(testBuyer._id);
      expect(updatedBuyer.resetPasswordOTP).toBeUndefined();
      expect(updatedBuyer.resetPasswordOTPExpires).toBeUndefined();
      expect(updatedBuyer.password).not.toBe('newSecurePassword123'); // Should be hashed
      
      // Verify password was hashed
      const isPasswordValid = await bcrypt.compare('newSecurePassword123', updatedBuyer.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should throw ValidationError when email is missing', async () => {
      // Arrange
      const invalidData = {
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordService.resetPassword(invalidData))
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
      await expect(resetPasswordService.resetPassword(invalidData))
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
      await expect(resetPasswordService.resetPassword(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when OTP is missing', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordService.resetPassword(invalidData))
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
      await expect(resetPasswordService.resetPassword(invalidData))
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
      await expect(resetPasswordService.resetPassword(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when new password is missing', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        otp: '1234'
      };

      // Act & Assert
      await expect(resetPasswordService.resetPassword(invalidData))
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
      await expect(resetPasswordService.resetPassword(invalidData))
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
      await expect(resetPasswordService.resetPassword(invalidData))
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
      await expect(resetPasswordService.resetPassword(invalidData))
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
      await expect(resetPasswordService.resetPassword(invalidData))
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
      await expect(resetPasswordService.resetPassword(invalidData))
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
      await expect(resetPasswordService.resetPassword(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should handle case insensitive email matching', async () => {
      // Arrange
      const resetPasswordData = {
        email: 'JOHN.DOE@EXAMPLE.COM',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };

      // Act
      const result = await resetPasswordService.resetPassword(resetPasswordData);

      // Assert
      expect(result).toEqual({
        message: 'Password reset successfully'
      });
    });

    it('should throw error when buyer update fails', async () => {
      // Arrange
      const resetPasswordData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };

      // Mock repository to return null (simulating update failure)
      const originalResetPassword = buyerRepository.resetPassword;
      buyerRepository.resetPassword = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(resetPasswordService.resetPassword(resetPasswordData))
        .rejects.toThrow('Failed to update buyer password');

      // Restore original function
      buyerRepository.resetPassword = originalResetPassword;
    });

    it('should hash password with bcrypt', async () => {
      // Arrange
      const resetPasswordData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };

      // Act
      await resetPasswordService.resetPassword(resetPasswordData);

      // Assert
      const updatedBuyer = await Buyer.findById(testBuyer._id);
      expect(updatedBuyer.password).not.toBe('newSecurePassword123');
      
      // Verify it's a bcrypt hash
      const isPasswordValid = await bcrypt.compare('newSecurePassword123', updatedBuyer.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should clear reset OTP fields after successful reset', async () => {
      // Arrange
      const resetPasswordData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };

      // Act
      await resetPasswordService.resetPassword(resetPasswordData);

      // Assert
      const updatedBuyer = await Buyer.findById(testBuyer._id);
      expect(updatedBuyer.resetPasswordOTP).toBeUndefined();
      expect(updatedBuyer.resetPasswordOTPExpires).toBeUndefined();
    });
  });
}); 