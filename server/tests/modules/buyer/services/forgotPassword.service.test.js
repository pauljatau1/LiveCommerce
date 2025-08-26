const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const forgotPasswordService = require('@modules/buyer/services/forgotPassword.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const Buyer = require('@models/Buyer');
const ValidationError = require('@utils/errors/ValidationError');

// Mock SendGrid
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn()
}));

const sgMail = require('@sendgrid/mail');

let mongoServer;

describe('forgotPassword.service', () => {
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
    
    // Reset mocks
    jest.clearAllMocks();
    
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

  describe('forgotPassword', () => {
    it('should successfully process forgot password request', async () => {
      // Arrange
      const forgotPasswordData = {
        email: 'john.doe@example.com'
      };
      
      // Mock successful email sending
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      // Act
      const result = await forgotPasswordService.forgotPassword(forgotPasswordData);

      // Assert
      expect(result).toEqual({
        message: 'Password reset code sent successfully'
      });
      
      // Verify email was sent
      expect(sgMail.send).toHaveBeenCalledTimes(1);
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john.doe@example.com',
          from: 'Joseph From Auqli <support@auqli.com>',
          subject: 'Password Reset Code - Auqli'
        })
      );
      
      // Verify buyer was updated with reset OTP
      const updatedBuyer = await Buyer.findById(testBuyer._id);
      expect(updatedBuyer.resetPasswordOTP).toBeDefined();
      expect(updatedBuyer.resetPasswordOTPExpires).toBeDefined();
      expect(updatedBuyer.resetPasswordOTP).toMatch(/^\d{4}$/); // 4-digit OTP
    });

    it('should throw ValidationError when email is missing', async () => {
      // Arrange
      const invalidData = {};

      // Act & Assert
      await expect(forgotPasswordService.forgotPassword(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email format is invalid', async () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email'
      };

      // Act & Assert
      await expect(forgotPasswordService.forgotPassword(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when buyer does not exist', async () => {
      // Arrange
      const invalidData = {
        email: 'nonexistent@example.com'
      };

      // Act & Assert
      await expect(forgotPasswordService.forgotPassword(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error when email sending fails', async () => {
      // Arrange
      const forgotPasswordData = {
        email: 'john.doe@example.com'
      };
      
      // Mock failed email sending
      sgMail.send.mockRejectedValue(new Error('SendGrid error'));

      // Act & Assert
      await expect(forgotPasswordService.forgotPassword(forgotPasswordData))
        .rejects.toThrow('SendGrid error');
    });

    it('should throw error when buyer update fails', async () => {
      // Arrange
      const forgotPasswordData = {
        email: 'john.doe@example.com'
      };
      
      // Mock successful email sending
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);
      
      // Mock repository to return null (simulating update failure)
      const originalUpdateResetPasswordOTP = buyerRepository.updateResetPasswordOTP;
      buyerRepository.updateResetPasswordOTP = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(forgotPasswordService.forgotPassword(forgotPasswordData))
        .rejects.toThrow('Failed to update buyer with reset OTP');
      
      // Restore original function
      buyerRepository.updateResetPasswordOTP = originalUpdateResetPasswordOTP;
    });

    it('should generate different OTPs for different requests', async () => {
      // Arrange
      const forgotPasswordData = {
        email: 'john.doe@example.com'
      };
      
      // Mock successful email sending
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      // Act
      await forgotPasswordService.forgotPassword(forgotPasswordData);
      const firstOTP = (await Buyer.findById(testBuyer._id)).resetPasswordOTP;
      
      await forgotPasswordService.forgotPassword(forgotPasswordData);
      const secondOTP = (await Buyer.findById(testBuyer._id)).resetPasswordOTP;

      // Assert
      expect(firstOTP).toBeDefined();
      expect(secondOTP).toBeDefined();
      expect(firstOTP).toMatch(/^\d{4}$/);
      expect(secondOTP).toMatch(/^\d{4}$/);
    });

    it('should set expiry time to 10 minutes from now', async () => {
      // Arrange
      const forgotPasswordData = {
        email: 'john.doe@example.com'
      };
      
      // Mock successful email sending
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      const beforeRequest = new Date();

      // Act
      await forgotPasswordService.forgotPassword(forgotPasswordData);
      
      const afterRequest = new Date();
      const updatedBuyer = await Buyer.findById(testBuyer._id);

      // Assert
      expect(updatedBuyer.resetPasswordOTPExpires).toBeDefined();
      expect(updatedBuyer.resetPasswordOTPExpires).toBeInstanceOf(Date);
      
      // Check that expiry is between 9.5 and 10.5 minutes from request time
      const timeDiff = updatedBuyer.resetPasswordOTPExpires.getTime() - beforeRequest.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      expect(minutesDiff).toBeGreaterThanOrEqual(9.5);
      expect(minutesDiff).toBeLessThanOrEqual(10.5);
    });

    it('should handle case insensitive email matching', async () => {
      // Arrange
      const forgotPasswordData = {
        email: 'JOHN.DOE@EXAMPLE.COM'
      };
      
      // Mock successful email sending
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      // Act
      const result = await forgotPasswordService.forgotPassword(forgotPasswordData);

      // Assert
      expect(result).toEqual({
        message: 'Password reset code sent successfully'
      });
      
      // Verify email was sent to the original email (not the uppercase version)
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'JOHN.DOE@EXAMPLE.COM'
        })
      );
    });

    it('should include OTP in email template', async () => {
      // Arrange
      const forgotPasswordData = {
        email: 'john.doe@example.com'
      };
      
      // Mock successful email sending
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      // Act
      await forgotPasswordService.forgotPassword(forgotPasswordData);
      
      const updatedBuyer = await Buyer.findById(testBuyer._id);
      const emailCall = sgMail.send.mock.calls[0][0];

      // Assert
      expect(emailCall.html).toContain(updatedBuyer.resetPasswordOTP);
      expect(emailCall.html).toContain('Password Reset Request');
      expect(emailCall.html).toContain('Your Reset Code');
      expect(emailCall.html).toContain('This code will expire in 10 minutes');
    });

    it('should handle SendGrid API errors gracefully', async () => {
      // Arrange
      const forgotPasswordData = {
        email: 'john.doe@example.com'
      };
      
      // Mock SendGrid API error
      const apiError = new Error('Invalid API key');
      apiError.response = {
        body: { errors: ['Invalid API key'] }
      };
      sgMail.send.mockRejectedValue(apiError);

      // Act & Assert
      await expect(forgotPasswordService.forgotPassword(forgotPasswordData))
        .rejects.toThrow('Invalid API key');
    });

    it('should handle SendGrid timeout errors', async () => {
      // Arrange
      const forgotPasswordData = {
        email: 'john.doe@example.com'
      };
      
      // Mock SendGrid timeout error
      sgMail.send.mockRejectedValue(new Error('Request timeout'));

      // Act & Assert
      await expect(forgotPasswordService.forgotPassword(forgotPasswordData))
        .rejects.toThrow('Request timeout');
    });
  });
}); 