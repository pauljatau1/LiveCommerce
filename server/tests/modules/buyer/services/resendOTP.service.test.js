// We'll read the template file in beforeEach instead

// Mock dependencies before importing the service
jest.mock('@modules/buyer/models/buyer.model', () => ({
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
jest.mock('@modules/buyer/validators/resendOTP.validator', () => ({
  validateResendOTPInput: jest.fn()
}));

const { resendOTP } = require('@modules/buyer/services/resendOTP.service');
const sgMail = require('@sendgrid/mail');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock fs module
const fs = require('fs');

describe('resendOTP.service', () => {
  let mockBuyer;
  let Buyer;
  let fs;
  let path;
  let mockTemplateContent;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Get the mocked modules
    Buyer = require('@modules/buyer/models/buyer.model');
    fs = require('fs');
    path = require('path');

    // Mock buyer data
    mockBuyer = {
      _id: 'buyer123',
      email: 'test@example.com',
      otp: '1234',
      save: jest.fn().mockResolvedValue(true)
    };

    // Mock Buyer.findOne
    Buyer.findOne.mockResolvedValue(mockBuyer);

    // Read the actual template file from disk
    const templatePath = path.join(__dirname, '../../../../src/templates/resend-otp-email.html');
    try {
      mockTemplateContent = require('fs').readFileSync(templatePath, 'utf-8');
    } catch (error) {
      // Fallback to a basic template
      mockTemplateContent = '<div>{{otp}}</div>';
    }

    // Mock fs.readFileSync to return the mock template
    fs.readFileSync.mockImplementation((filePath, encoding) => {
      if (filePath.includes('resend-otp-email.html')) {
        return mockTemplateContent;
      }
      return '';
    });

    // Mock path.join
    path.join.mockReturnValue('/mock/path/to/template.html');

    // Mock SendGrid
    sgMail.send.mockResolvedValue(true);
    sgMail.setApiKey.mockImplementation(() => {});

    // Mock validator
    const validator = require('@modules/buyer/validators/resendOTP.validator');
    validator.validateResendOTPInput.mockImplementation(() => {});
  });

  describe('resendOTP', () => {
    it('should successfully resend OTP to valid email', async () => {
      // Arrange
      const email = 'test@example.com';
      const validator = require('@modules/buyer/validators/resendOTP.validator');
      validator.validateResendOTPInput.mockImplementation(() => {
        // Don't throw error for valid email
      });

      // Act
      const result = await resendOTP(email);

      // Assert
      expect(Buyer.findOne).toHaveBeenCalledWith({ email });
      expect(mockBuyer.save).toHaveBeenCalled();
      expect(sgMail.send).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'OTP resent successfully'
      });
    });

    it('should throw NotFoundException when buyer not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      Buyer.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(resendOTP(email)).rejects.toThrow(NotFoundException);
      expect(Buyer.findOne).toHaveBeenCalledWith({ email });
      expect(mockBuyer.save).not.toHaveBeenCalled();
      expect(sgMail.send).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when email is missing', async () => {
      // Arrange
      const email = '';
      const validator = require('@modules/buyer/validators/resendOTP.validator');
      validator.validateResendOTPInput.mockImplementation(() => {
        throw new ValidationError([{ field: 'email', message: 'Email is required' }]);
      });

      // Act & Assert
      await expect(resendOTP(email)).rejects.toThrow(ValidationError);
      expect(Buyer.findOne).not.toHaveBeenCalled();
      expect(mockBuyer.save).not.toHaveBeenCalled();
      expect(sgMail.send).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when email is invalid', async () => {
      // Arrange
      const email = 'invalid-email';
      const validator = require('@modules/buyer/validators/resendOTP.validator');
      validator.validateResendOTPInput.mockImplementation(() => {
        throw new ValidationError([{ field: 'email', message: 'Email must be a valid email address' }]);
      });

      // Act & Assert
      await expect(resendOTP(email)).rejects.toThrow(ValidationError);
      expect(Buyer.findOne).not.toHaveBeenCalled();
      expect(mockBuyer.save).not.toHaveBeenCalled();
      expect(sgMail.send).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when email is not a string', async () => {
      // Arrange
      const email = 123;
      const validator = require('@modules/buyer/validators/resendOTP.validator');
      validator.validateResendOTPInput.mockImplementation(() => {
        throw new ValidationError([{ field: 'email', message: 'Email must be a string' }]);
      });

      // Act & Assert
      await expect(resendOTP(email)).rejects.toThrow(ValidationError);
      expect(Buyer.findOne).not.toHaveBeenCalled();
      expect(mockBuyer.save).not.toHaveBeenCalled();
      expect(sgMail.send).not.toHaveBeenCalled();
    });

    it('should handle SendGrid error', async () => {
      // Arrange
      const email = 'test@example.com';
      const sendGridError = new Error('SendGrid API error');
      sgMail.send.mockRejectedValue(sendGridError);

      // Act & Assert
      await expect(resendOTP(email)).rejects.toThrow('SendGrid API error');
      expect(Buyer.findOne).toHaveBeenCalledWith({ email });
      expect(mockBuyer.save).toHaveBeenCalled();
      expect(sgMail.send).toHaveBeenCalled();
    });

    it('should handle database save error', async () => {
      // Arrange
      const email = 'test@example.com';
      const saveError = new Error('Database save error');
      mockBuyer.save.mockRejectedValue(saveError);

      // Act & Assert
      await expect(resendOTP(email)).rejects.toThrow('Database save error');
      expect(Buyer.findOne).toHaveBeenCalledWith({ email });
      expect(mockBuyer.save).toHaveBeenCalled();
      expect(sgMail.send).not.toHaveBeenCalled();
    });

    it('should handle database find error', async () => {
      // Arrange
      const email = 'test@example.com';
      const findError = new Error('Database find error');
      Buyer.findOne.mockRejectedValue(findError);

      // Act & Assert
      await expect(resendOTP(email)).rejects.toThrow('Database find error');
      expect(Buyer.findOne).toHaveBeenCalledWith({ email });
      expect(mockBuyer.save).not.toHaveBeenCalled();
      expect(sgMail.send).not.toHaveBeenCalled();
    });

    it('should generate new OTP and update buyer', async () => {
      // Arrange
      const email = 'test@example.com';
      const originalOTP = mockBuyer.otp;
      const validator = require('@modules/buyer/validators/resendOTP.validator');
      validator.validateResendOTPInput.mockImplementation(() => {
        // Don't throw error for valid email
      });

      // Act
      await resendOTP(email);

      // Assert
      expect(mockBuyer.otp).not.toBe(originalOTP);
      expect(mockBuyer.otp).toMatch(/^\d{4}$/);
      expect(mockBuyer.save).toHaveBeenCalled();
    });
  });
}); 