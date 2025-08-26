const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const resetPasswordValidator = require('@modules/buyer/validators/resetPassword.validator');
const Buyer = require('@models/Buyer');
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
    it('should not throw for valid reset password data', async () => {
      // Arrange
      const validData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(validData))
        .resolves.not.toThrow();
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
        .rejects.toThrow(ValidationError);
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

    it('should throw ValidationError when email does not exist', async () => {
      // Arrange
      const invalidData = {
        email: 'nonexistent@example.com',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
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

    it('should throw ValidationError when OTP is missing', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
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

    it('should throw ValidationError when OTP is not a string', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        otp: 1234,
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
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

    it('should throw ValidationError when OTP contains non-numeric characters', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        otp: '12a4',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
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

    it('should throw ValidationError when new password is missing', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        otp: '1234'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toMatchObject({
          errors: [
            {
              field: 'newPassword',
              message: 'New password is required'
            }
          ]
        });
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
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'newPassword',
              message: 'Password must be at least 6 characters long'
            },
            {
              field: 'newPassword',
              message: 'Password must contain at least one letter and one number'
            }
          ])
        });
    });

    it('should throw ValidationError when new password lacks complexity', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: 'weakpassword'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toMatchObject({
          errors: [
            {
              field: 'newPassword',
              message: 'Password must contain at least one letter and one number'
            }
          ]
        });
    });

    it('should throw ValidationError when OTP does not match stored OTP', async () => {
      // Arrange
      const invalidData = {
        email: 'john.doe@example.com',
        otp: '5678',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
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

    it('should throw ValidationError when OTP has expired', async () => {
      // Arrange - Create buyer with expired OTP
      const expiredBuyer = new Buyer({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        username: 'janesmith',
        password: 'hashedPassword123',
        resetPasswordOTP: '5678',
        resetPasswordOTPExpires: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      });
      await expiredBuyer.save();

      const invalidData = {
        email: 'jane.smith@example.com',
        otp: '5678',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
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

    it('should throw ValidationError when OTP expiry is missing', async () => {
      // Arrange - Create buyer without OTP expiry
      const buyerWithoutExpiry = new Buyer({
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        username: 'bobjohnson',
        password: 'hashedPassword123',
        resetPasswordOTP: '9999'
        // No resetPasswordOTPExpires
      });
      await buyerWithoutExpiry.save();

      const invalidData = {
        email: 'bob.johnson@example.com',
        otp: '9999',
        newPassword: 'newSecurePassword123'
      };

      // Act & Assert
      await expect(resetPasswordValidator.validateResetPasswordData(invalidData))
        .rejects.toThrow(ValidationError);
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

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing email', async () => {
        await expect(resetPasswordValidator.validateResetPasswordData({
          otp: '1234',
          newPassword: 'newSecurePassword123'
        })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Email is required' }]
        });
      });

      it('should include specific error message for invalid email format', async () => {
        await expect(resetPasswordValidator.validateResetPasswordData({
          email: 'invalid-email',
          otp: '1234',
          newPassword: 'newSecurePassword123'
        })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'Invalid email format' }]
        });
      });

      it('should include specific error message for non-existent email', async () => {
        await expect(resetPasswordValidator.validateResetPasswordData({
          email: 'nonexistent@example.com',
          otp: '1234',
          newPassword: 'newSecurePassword123'
        })).rejects.toMatchObject({
          errors: [{ field: 'email', message: 'No account found with this email' }]
        });
      });

      it('should include specific error message for missing OTP', async () => {
        await expect(resetPasswordValidator.validateResetPasswordData({
          email: 'john.doe@example.com',
          newPassword: 'newSecurePassword123'
        })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP is required' }]
        });
      });

      it('should include specific error message for non-string OTP', async () => {
        await expect(resetPasswordValidator.validateResetPasswordData({
          email: 'john.doe@example.com',
          otp: 1234,
          newPassword: 'newSecurePassword123'
        })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP must be a string' }]
        });
      });

      it('should include specific error message for invalid OTP format', async () => {
        await expect(resetPasswordValidator.validateResetPasswordData({
          email: 'john.doe@example.com',
          otp: '123',
          newPassword: 'newSecurePassword123'
        })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'OTP must be a 4-digit number' }]
        });
      });

      it('should include specific error message for missing new password', async () => {
        await expect(resetPasswordValidator.validateResetPasswordData({
          email: 'john.doe@example.com',
          otp: '1234'
        })).rejects.toMatchObject({
          errors: [{ field: 'newPassword', message: 'New password is required' }]
        });
      });

      it('should include specific error message for short password', async () => {
        await expect(resetPasswordValidator.validateResetPasswordData({
          email: 'john.doe@example.com',
          otp: '1234',
          newPassword: 'weak'
        })).rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'newPassword', message: 'Password must be at least 6 characters long' },
            { field: 'newPassword', message: 'Password must contain at least one letter and one number' }
          ])
        });
      });

      it('should include specific error message for password without complexity', async () => {
        await expect(resetPasswordValidator.validateResetPasswordData({
          email: 'john.doe@example.com',
          otp: '1234',
          newPassword: 'weakpassword'
        })).rejects.toMatchObject({
          errors: [{ field: 'newPassword', message: 'Password must contain at least one letter and one number' }]
        });
      });

      it('should include specific error message for invalid OTP', async () => {
        await expect(resetPasswordValidator.validateResetPasswordData({
          email: 'john.doe@example.com',
          otp: '5678',
          newPassword: 'newSecurePassword123'
        })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'Invalid reset code' }]
        });
      });

      it('should include specific error message for expired OTP', async () => {
        // Create buyer with expired OTP
        const expiredBuyer = new Buyer({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          username: 'janesmith',
          password: 'hashedPassword123',
          resetPasswordOTP: '5678',
          resetPasswordOTPExpires: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
        });
        await expiredBuyer.save();

        await expect(resetPasswordValidator.validateResetPasswordData({
          email: 'jane.smith@example.com',
          otp: '5678',
          newPassword: 'newSecurePassword123'
        })).rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'Reset code has expired' }]
        });
      });
    });
  });
}); 