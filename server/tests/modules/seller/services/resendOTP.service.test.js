// Mock dependencies before importing the service
jest.mock('@models/Seller', () => ({
  findOne: jest.fn()
}));
jest.mock('@services/termiiEmailService', () => ({
  sendRawHTMLEmail: jest.fn().mockResolvedValue(true)
}));
jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));
jest.mock('path', () => ({
  join: jest.fn()
}));

const resendOTPService = require('@modules/seller/services/resendOTP.service');
const termiiEmailService = require('@services/termiiEmailService');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');
const fs = require('fs');
const path = require('path');

describe('Resend OTP Service', () => {
  let mockSeller;
  let Seller;

  beforeAll(() => {
    process.env.TERMII_API_KEY = 'test-key';
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Explicitly reset Termii mock to success
    termiiEmailService.sendRawHTMLEmail.mockResolvedValue(true);

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

    // Mock file system operations
    const mockTemplateContent = `
      <div>
        <p>Hi {{firstName}},</p>
        <p>OTP: {{otp}}</p>
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
    });
  });

  describe('sendOTPEmail', () => {
    it('should send email successfully', async () => {
      // Arrange
      const email = 'seller@example.com';
      const otp = '1234';
      const firstName = 'John';

      // Act
      await resendOTPService.sendOTPEmail(email, otp, firstName);

      // Assert
      expect(termiiEmailService.sendRawHTMLEmail).toHaveBeenCalledWith(expect.objectContaining({
        email: email,
        subject: "Here's Your Auqli OTP"
      }));
    });

    it('should propagate email errors', async () => {
      // Arrange
      const email = 'seller@example.com';
      const otp = '1234';
      const firstName = 'John';
      const mockError = new Error('Termii error');

      termiiEmailService.sendRawHTMLEmail.mockRejectedValue(mockError);

      // Act & Assert
      await expect(resendOTPService.sendOTPEmail(email, otp, firstName))
        .rejects.toThrow('Termii error');
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
      // Mock Seller.findOne
      Seller.findOne.mockResolvedValue(mockSeller);
      mockSeller.save.mockResolvedValue(mockSeller);

      // Act
      const result = await resendOTPService.resendOTP(validEmail);

      // Assert
      expect(result).toEqual({
        message: 'OTP resent successfully'
      });
      expect(Seller.findOne).toHaveBeenCalledWith({ email: validEmail });
      expect(mockSeller.otp).toMatch(/^\d{4}$/);
      expect(mockSeller.save).toHaveBeenCalled();
      expect(termiiEmailService.sendRawHTMLEmail).toHaveBeenCalled();
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

    it('should successfully resend OTP even when email is already verified', async () => {
      // Arrange
      const verifiedSeller = { ...mockSeller, emailVerified: true, save: jest.fn().mockResolvedValue(true) };
      Seller.findOne.mockResolvedValue(verifiedSeller);

      // Act
      const result = await resendOTPService.resendOTP(validEmail);

      // Assert
      expect(result).toEqual({
        message: 'OTP resent successfully'
      });
      expect(Seller.findOne).toHaveBeenCalledWith({ email: validEmail });
      expect(verifiedSeller.otp).toMatch(/^\d{4}$/);
      expect(verifiedSeller.save).toHaveBeenCalled();
      expect(termiiEmailService.sendRawHTMLEmail).toHaveBeenCalled();
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
      termiiEmailService.sendRawHTMLEmail.mockRejectedValue(mockError);

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
  });
});
