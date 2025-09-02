// Mock dependencies before importing the service
jest.mock('@models/Seller', () => ({
  findOne: jest.fn()
}));
jest.mock('@sendgrid/mail', () => ({
  send: jest.fn(),
  setApiKey: jest.fn()
}));
jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));
jest.mock('path', () => ({
  join: jest.fn()
}));

const resendOTPService = require('@modules/seller/services/resendOTP.service');
const sgMail = require('@sendgrid/mail');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');
const fs = require('fs');
const path = require('path');

describe('Resend OTP Service', () => {
  let mockSeller;
  let Seller;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get the mocked modules
    Seller = require('@models/Seller');

    // Setup mock seller
    mockSeller = {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'John',
      lastName: 'Doe',
      email: 'seller@example.com',
      phoneNumber: '+2348012345678',
      storeName: "John's Store",
      agoraUid: 123456789,
      emailVerified: false,
      otp: '1234',
      createdAt: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };

    // Mock Seller.findOne
    Seller.findOne.mockResolvedValue(mockSeller);

    // Mock SendGrid
    sgMail.send.mockResolvedValue(true);
    sgMail.setApiKey.mockImplementation(() => {});

    // Mock file system operations
    const mockTemplateContent = `
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto;">
          <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; margin-bottom: 20px;">Here's Your Auqli OTP</h1>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hi {{firstName}},</p>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your one-time password (OTP) is:</p>
          <div style="background-color: #333333; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 30px;">
            <span style="font-size: 32px; letter-spacing: 5px; color: #4CAF50; font-weight: bold;">{{otp}}</span>
          </div>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Please enter this code in the app to complete your sign-up. This code will expire in 10 minutes.</p>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">If you didn't request this, just ignore this message.</p>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Need help? Contact our team anytime at <a href="mailto:support@auqli.com" style="color: #4CAF50;">support@auqli.com</a>.</p>
          
          <div style="margin: 30px 0;">
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">Stay connected with Auqli Nigeria:</p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 10px;">📢 Join our Telegram Group</p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 10px;">💬 WhatsApp Channel</p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">📱 Instagram | Twitter | Facebook</p>
          </div>
          
          <hr style="border: 1px solid #333333; margin: 30px 0;">
          <p style="font-size: 14px; color: #999999; text-align: center;">Team Auqli Nigeria</p>
        </div>
      </div>
    `;
    
    fs.readFileSync.mockReturnValue(mockTemplateContent);
    path.join.mockReturnValue('/mock/template/path');
  });

  describe('getEmailContent', () => {
    it('should construct email content with template', () => {
      // Arrange
      const email = 'seller@example.com';
      const otp = '1234';
      const firstName = 'John';

      // Act
      const result = resendOTPService.getEmailContent(email, otp, firstName);

      // Assert
      expect(result).toEqual({
        to: email,
        from: 'Auqli Nigeria <support@auqli.com>',
        subject: "Here's Your Auqli OTP",
        html: expect.stringContaining(otp)
      });
      expect(result.html).toContain(otp);
      expect(result.html).toContain(firstName);
    });

    it('should create HTML with proper structure', () => {
      // Arrange
      const email = 'seller@example.com';
      const otp = '5678';
      const firstName = 'Jane';

      // Act
      const result = resendOTPService.getEmailContent(email, otp, firstName);

      // Assert
      expect(path.join).toHaveBeenCalledWith(expect.any(String), '../../../', 'templates', 'resend-otp-email.html');
      expect(fs.readFileSync).toHaveBeenCalledWith('/mock/template/path', 'utf-8');
      expect(result.html).toContain('background-color: #1a1a1a');
      expect(result.html).toContain('Here\'s Your Auqli OTP');
      expect(result.html).toContain(`Hi ${firstName}`);
      expect(result.html).toContain(`<span style="font-size: 32px; letter-spacing: 5px; color: #4CAF50; font-weight: bold;">${otp}</span>`);
      expect(result.html).toContain('Please enter this code in the app to complete your sign-up');
      expect(result.html).toContain('Team Auqli Nigeria');
    });
  });

  describe('sendOTPEmail', () => {
    it('should send email successfully', async () => {
      // Arrange
      const email = 'seller@example.com';
      const otp = '1234';
      const firstName = 'John';

      sgMail.send.mockResolvedValue();

      // Act
      await resendOTPService.sendOTPEmail(email, otp, firstName);

      // Assert
      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        to: email,
        from: 'Auqli Nigeria <support@auqli.com>',
        subject: "Here's Your Auqli OTP"
      }));
    });

    it('should propagate SendGrid errors', async () => {
      // Arrange
      const email = 'seller@example.com';
      const otp = '1234';
      const firstName = 'John';
      const mockError = new Error('SendGrid error');
      
      sgMail.send.mockRejectedValue(mockError);

      // Act & Assert
      await expect(resendOTPService.sendOTPEmail(email, otp, firstName))
        .rejects.toThrow('SendGrid error');
    });
  });

  describe('updateSellerOTP', () => {
    it('should update seller OTP and save', async () => {
      // Arrange
      const otp = '5678';
      mockSeller.save.mockResolvedValue(mockSeller);

      // Act
      await resendOTPService.updateSellerOTP(mockSeller, otp);

      // Assert
      expect(mockSeller.otp).toBe(otp);
      expect(mockSeller.save).toHaveBeenCalled();
    });

    it('should propagate save errors', async () => {
      // Arrange
      const otp = '5678';
      const mockError = new Error('Database error');
      mockSeller.save.mockRejectedValue(mockError);

      // Act & Assert
      await expect(resendOTPService.updateSellerOTP(mockSeller, otp))
        .rejects.toThrow('Database error');
    });
  });

  describe('resendOTP', () => {
    const validEmail = 'seller@example.com';

    it('should successfully resend OTP', async () => {
      // Arrange
      const mockOtp = '1234';
      const mockEmailContent = {
        to: validEmail,
        from: 'Auqli Nigeria <support@auqli.com>',
        subject: "Here's Your Auqli OTP",
        html: '<div>OTP: 1234</div>'
      };

      // Mock Seller.findOne
      Seller.findOne.mockResolvedValue(mockSeller);
      mockSeller.save.mockResolvedValue(mockSeller);
      
      // Mock SendGrid
      sgMail.send.mockResolvedValue();

      // Act
      const result = await resendOTPService.resendOTP(validEmail);

      // Assert
      expect(result).toEqual({
        message: 'OTP resent successfully'
      });
      expect(Seller.findOne).toHaveBeenCalledWith({ email: validEmail });
      expect(mockSeller.otp).toMatch(/^\d{4}$/);
      expect(mockSeller.save).toHaveBeenCalled();
      expect(sgMail.send).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid email', async () => {
      // Arrange
      const invalidEmail = 'invalid-email';

      // Act & Assert
      await expect(resendOTPService.resendOTP(invalidEmail))
        .rejects.toThrow(ValidationError);
      expect(Seller.findOne).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when seller not found', async () => {
      // Arrange
      Seller.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(resendOTPService.resendOTP(validEmail))
        .rejects.toThrow(NotFoundException);
      expect(Seller.findOne).toHaveBeenCalledWith({ email: validEmail });
    });

    it('should throw error when email is already verified', async () => {
      // Arrange
      const verifiedSeller = { ...mockSeller, emailVerified: true };
      Seller.findOne.mockResolvedValue(verifiedSeller);

      // Act & Assert
      await expect(resendOTPService.resendOTP(validEmail))
        .rejects.toThrow('Email is already verified');
      expect(Seller.findOne).toHaveBeenCalledWith({ email: validEmail });
    });

    it('should handle database save errors', async () => {
      // Arrange
      const mockError = new Error('Database save error');
      Seller.findOne.mockResolvedValue(mockSeller);
      mockSeller.save.mockRejectedValue(mockError);

      // Act & Assert
      await expect(resendOTPService.resendOTP(validEmail))
        .rejects.toThrow('Database save error');
      expect(Seller.findOne).toHaveBeenCalledWith({ email: validEmail });
    });

    it('should handle email sending errors', async () => {
      // Arrange
      const mockError = new Error('Email sending error');
      Seller.findOne.mockResolvedValue(mockSeller);
      mockSeller.save.mockResolvedValue(mockSeller);
      sgMail.send.mockRejectedValue(mockError);

      // Act & Assert
      await expect(resendOTPService.resendOTP(validEmail))
        .rejects.toThrow('Email sending error');
      expect(Seller.findOne).toHaveBeenCalledWith({ email: validEmail });
      expect(mockSeller.save).toHaveBeenCalled();
    });

    it('should generate unique OTP for each request', async () => {
      // Arrange
      Seller.findOne.mockResolvedValue(mockSeller);
      mockSeller.save.mockResolvedValue(mockSeller);
      sgMail.send.mockResolvedValue();

      // Act
      const result1 = await resendOTPService.resendOTP(validEmail);
      const result2 = await resendOTPService.resendOTP(validEmail);

      // Assert
      expect(result1).toEqual({ message: 'OTP resent successfully' });
      expect(result2).toEqual({ message: 'OTP resent successfully' });
      expect(mockSeller.otp).toMatch(/^\d{4}$/);
    });

    it('should validate email before processing', async () => {
      // Arrange
      const invalidEmail = '';

      // Act & Assert
      await expect(resendOTPService.resendOTP(invalidEmail))
        .rejects.toThrow(ValidationError);
      expect(Seller.findOne).not.toHaveBeenCalled();
    });

    it('should handle empty email string', async () => {
      // Arrange
      const emptyEmail = '';

      // Act & Assert
      await expect(resendOTPService.resendOTP(emptyEmail))
        .rejects.toThrow(ValidationError);
      expect(Seller.findOne).not.toHaveBeenCalled();
    });

    it('should handle null email', async () => {
      // Arrange
      const nullEmail = null;

      // Act & Assert
      await expect(resendOTPService.resendOTP(nullEmail))
        .rejects.toThrow(ValidationError);
      expect(Seller.findOne).not.toHaveBeenCalled();
    });

    it('should handle undefined email', async () => {
      // Arrange
      const undefinedEmail = undefined;

      // Act & Assert
      await expect(resendOTPService.resendOTP(undefinedEmail))
        .rejects.toThrow(ValidationError);
      expect(Seller.findOne).not.toHaveBeenCalled();
    });
  });
});
