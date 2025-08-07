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
      username: 'johndoe', // Add username
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
        .rejects.toMatchObject({
          errors: [
            {
              field: 'email',
              message: 'Email is required'
            }
          ]
        });
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
        .rejects.toMatchObject({
          errors: [
            {
              field: 'email',
              message: 'Invalid email format'
            }
          ]
        });
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
        .rejects.toMatchObject({
          errors: [
            {
              field: 'email',
              message: 'No account found with this email'
            }
          ]
        });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing email', async () => {
        const invalidData = {
          otp: '1234',
          newPassword: 'newSecurePassword123'
        };

        await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
          .rejects.toMatchObject({
            errors: [
              {
                field: 'email',
                message: 'Email is required'
              }
            ]
          });
      });

      it('should include specific error message for invalid email format', async () => {
        const invalidData = {
          email: 'invalid-email',
          otp: '1234',
          newPassword: 'newSecurePassword123'
        };

        await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
          .rejects.toMatchObject({
            errors: [
              {
                field: 'email',
                message: 'Invalid email format'
              }
            ]
          });
      });

      it('should include specific error message for non-existent email', async () => {
        const invalidData = {
          email: 'nonexistent@example.com',
          otp: '1234',
          newPassword: 'newSecurePassword123'
        };

        await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
          .rejects.toMatchObject({
            errors: [
              {
                field: 'email',
                message: 'No account found with this email'
              }
            ]
          });
      });

      it('should include specific error message for missing OTP', async () => {
        const invalidData = {
          email: 'john.doe@example.com',
          newPassword: 'newSecurePassword123'
        };

        await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
          .rejects.toMatchObject({
            errors: [
              {
                field: 'otp',
                message: 'OTP is required'
              }
            ]
          });
      });

      it('should include specific error message for non-string OTP', async () => {
        const invalidData = {
          email: 'john.doe@example.com',
          otp: 1234,
          newPassword: 'newSecurePassword123'
        };

        await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
          .rejects.toMatchObject({
            errors: [
              {
                field: 'otp',
                message: 'OTP must be a string'
              }
            ]
          });
      });

      it('should throw ValidationError for invalid OTP format', async () => {
        const invalidData = {
          email: 'john.doe@example.com',
          otp: '123', // too short
          newPassword: 'newSecurePassword123'
        };

        await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
          .rejects.toMatchObject({
            errors: [
              {
                field: 'otp',
                message: 'OTP must be a 4-digit number'
              }
            ]
          });
      });

      it('should throw ValidationError for invalid password format', async () => {
        const invalidData = {
          email: 'john.doe@example.com',
          otp: '1234',
          newPassword: 'weak' // too short and no number
        };

        await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
          .rejects.toMatchObject({
            errors: [
              {
                field: 'newPassword',
                message: 'Password must be at least 6 characters long'
              }
            ]
          });
      });

      it('should include specific error message for invalid OTP', async () => {
        const invalidData = {
          email: 'john.doe@example.com',
          otp: '5678',
          newPassword: 'newSecurePassword123'
        };

        await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
          .rejects.toMatchObject({
            errors: [
              {
                field: 'otp',
                message: 'Invalid reset code'
              }
            ]
          });
      });

      it('should throw ValidationError for expired OTP', async () => {
        // Create a buyer with expired OTP
        const expiredBuyer = new Buyer({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com',
          username: 'janedoe', // Add unique username
          password: 'hashedPassword123',
          resetPasswordOTP: '1234',
          resetPasswordOTPExpires: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
        });
        await expiredBuyer.save();

        const invalidData = {
          email: 'jane.doe@example.com',
          otp: '1234',
          newPassword: 'newSecurePassword123'
        };

        await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
          .rejects.toMatchObject({
            errors: [
              {
                field: 'otp',
                message: 'Reset code has expired'
              }
            ]
          });
      });
    });
  });
}); 