const sendPhoneOTPService = require('@modules/buyer/services/sendPhoneOTP.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const sendPhoneOTPValidator = require('@modules/buyer/validators/sendPhoneOTP.validator');
const NotFoundException = require('@utils/errors/NotFoundException');
const InternalErrorException = require('@utils/errors/InternalErrorException');
const ValidationError = require('@utils/errors/ValidationError');
const Buyer = require('@modules/buyer/models/buyer.model');

// Mock dependencies
jest.mock('@modules/buyer/repositories/buyer.repository');
jest.mock('@modules/buyer/validators/sendPhoneOTP.validator');
jest.mock('@aws-sdk/client-sns');

describe('Send Phone OTP Service', () => {
  let mockBuyer;
  let mockSNSClient;
  let mockPublishCommand;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock buyer data
    mockBuyer = {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+2348012345678',
      phoneVerification: null
    };

    // Mock SNS client
    mockSNSClient = {
      send: jest.fn().mockResolvedValue({ MessageId: 'test-message-id' })
    };

    // Mock PublishCommand
    mockPublishCommand = jest.fn().mockImplementation((params) => ({
      input: params
    }));

    // Mock AWS SNS
    const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
    SNSClient.mockImplementation(() => mockSNSClient);
    PublishCommand.mockImplementation(mockPublishCommand);
  });

  describe('sendPhoneOTP', () => {
    it('should send OTP successfully with valid data', async () => {
      // Arrange
      const buyerId = '507f1f77bcf86cd799439011';
      const phoneNumber = '+2348012345678';

      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updatePhoneVerification.mockResolvedValue(mockBuyer);
      sendPhoneOTPValidator.validatePhoneNumberFormat.mockResolvedValue();

      // Act
      const result = await sendPhoneOTPService.sendPhoneOTP(buyerId, phoneNumber);

      // Assert
      expect(sendPhoneOTPValidator.validatePhoneNumberFormat).toHaveBeenCalledWith(phoneNumber);
      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
      expect(buyerRepository.updatePhoneVerification).toHaveBeenCalledWith(buyerId, {
        otp: expect.any(String),
        expiresAt: expect.any(Date),
        attempts: 0
      });
      expect(mockSNSClient.send).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'OTP sent successfully',
        validFor: '10 minutes'
      });
    });

    it('should throw ValidationError when phone number format is invalid', async () => {
      // Arrange
      const buyerId = '507f1f77bcf86cd799439011';
      const phoneNumber = 'invalid-phone';

      sendPhoneOTPValidator.validatePhoneNumberFormat.mockRejectedValue(
        new ValidationError([{ field: 'phoneNumber', message: 'Invalid phone number format' }])
      );

      // Act & Assert
      await expect(
        sendPhoneOTPService.sendPhoneOTP(buyerId, phoneNumber)
      ).rejects.toThrow(ValidationError);

      expect(sendPhoneOTPValidator.validatePhoneNumberFormat).toHaveBeenCalledWith(phoneNumber);
      expect(buyerRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when buyer does not exist', async () => {
      // Arrange
      const buyerId = '507f1f77bcf86cd799439011';
      const phoneNumber = '+2348012345678';

      buyerRepository.findById.mockResolvedValue(null);
      sendPhoneOTPValidator.validatePhoneNumberFormat.mockResolvedValue();

      // Act & Assert
      await expect(
        sendPhoneOTPService.sendPhoneOTP(buyerId, phoneNumber)
      ).rejects.toThrow(NotFoundException);

      expect(sendPhoneOTPValidator.validatePhoneNumberFormat).toHaveBeenCalledWith(phoneNumber);
      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
      expect(buyerRepository.updatePhoneVerification).not.toHaveBeenCalled();
    });

    it('should throw InternalErrorException when SMS sending fails', async () => {
      // Arrange
      const buyerId = '507f1f77bcf86cd799439011';
      const phoneNumber = '+2348012345678';

      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updatePhoneVerification.mockResolvedValue(mockBuyer);
      sendPhoneOTPValidator.validatePhoneNumberFormat.mockResolvedValue();
      mockSNSClient.send.mockRejectedValue(new Error('SMS sending failed'));

      // Act & Assert
      await expect(
        sendPhoneOTPService.sendPhoneOTP(buyerId, phoneNumber)
      ).rejects.toThrow(InternalErrorException);

      expect(sendPhoneOTPValidator.validatePhoneNumberFormat).toHaveBeenCalledWith(phoneNumber);
      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
      expect(buyerRepository.updatePhoneVerification).toHaveBeenCalled();
      expect(mockSNSClient.send).toHaveBeenCalled();
    });

    it('should generate 6-digit OTP', async () => {
      // Arrange
      const buyerId = '507f1f77bcf86cd799439011';
      const phoneNumber = '+2348012345678';

      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updatePhoneVerification.mockImplementation((id, data) => {
        expect(data.otp).toMatch(/^\d{6}$/);
        return mockBuyer;
      });
      sendPhoneOTPValidator.validatePhoneNumberFormat.mockResolvedValue();

      // Act
      await sendPhoneOTPService.sendPhoneOTP(buyerId, phoneNumber);

      // Assert
      expect(buyerRepository.updatePhoneVerification).toHaveBeenCalledWith(buyerId, {
        otp: expect.stringMatching(/^\d{6}$/),
        expiresAt: expect.any(Date),
        attempts: 0
      });
    });

    it('should set OTP expiry to 10 minutes from now', async () => {
      // Arrange
      const buyerId = '507f1f77bcf86cd799439011';
      const phoneNumber = '+2348012345678';
      const now = new Date();

      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updatePhoneVerification.mockImplementation((id, data) => {
        const expectedExpiry = new Date(now.getTime() + 10 * 60 * 1000);
        expect(data.expiresAt.getTime()).toBeCloseTo(expectedExpiry.getTime(), -2);
        return mockBuyer;
      });
      sendPhoneOTPValidator.validatePhoneNumberFormat.mockResolvedValue();

      // Act
      await sendPhoneOTPService.sendPhoneOTP(buyerId, phoneNumber);

      // Assert
      expect(buyerRepository.updatePhoneVerification).toHaveBeenCalledWith(buyerId, {
        otp: expect.any(String),
        expiresAt: expect.any(Date),
        attempts: 0
      });
    });

    it('should send correct SMS message format', async () => {
      // Arrange
      const buyerId = '507f1f77bcf86cd799439011';
      const phoneNumber = '+2348012345678';

      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updatePhoneVerification.mockResolvedValue(mockBuyer);
      sendPhoneOTPValidator.validatePhoneNumberFormat.mockResolvedValue();

      // Act
      await sendPhoneOTPService.sendPhoneOTP(buyerId, phoneNumber);

      // Assert
      expect(mockPublishCommand).toHaveBeenCalledWith({
        Message: expect.stringMatching(/Your Auqli verification code is: \d{6}\. Valid for 10 minutes\./),
        PhoneNumber: phoneNumber,
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            'DataType': 'String',
            'StringValue': 'AUQLI'
          }
        }
      });
    });
  });
}); 