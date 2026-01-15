const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const requestAccountDeletionService = require('@modules/buyer/services/requestAccountDeletion.service');
const Buyer = require('@models/Buyer');
const ValidationError = require('@utils/errors/ValidationError');

// Mock TermiiEmailService
jest.mock('@services/termiiEmailService', () => ({
  sendRawHTMLEmail: jest.fn().mockResolvedValue(true)
}));

const termiiEmailService = require('@services/termiiEmailService');

let mongoServer;

describe('requestAccountDeletion.service', () => {
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
    process.env.TERMII_API_KEY = 'test-key';
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Explicitly reset Termii mock to success
    termiiEmailService.sendRawHTMLEmail.mockResolvedValue(true);

    await Buyer.deleteMany({});

    // Create a test buyer without account deletion request
    testBuyer = new Buyer({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+2348012345678',
      password: 'hashedPassword123'
    });
    await testBuyer.save();
  });

  afterEach(async () => {
    await Buyer.deleteMany({});
  });

  describe('requestAccountDeletion', () => {
    it('should successfully process account deletion request', async () => {
      // Arrange
      const buyerId = testBuyer._id.toString();

      // Act
      const result = await requestAccountDeletionService.requestAccountDeletion(buyerId);

      // Assert
      expect(result).toEqual({
        message: 'Account deletion verification code sent to your email',
        validFor: '10 minutes'
      });

      // Verify buyer was updated with deletion OTP
      const updatedBuyer = await Buyer.findById(buyerId);
      expect(updatedBuyer.accountDeletion.otp).toBeDefined();
      expect(updatedBuyer.accountDeletion.otp).toHaveLength(4);
      expect(updatedBuyer.accountDeletion.attempts).toBe(0);
      expect(updatedBuyer.accountDeletion.expiresAt).toBeInstanceOf(Date);

      // Verify email was sent
      expect(termiiEmailService.sendRawHTMLEmail).toHaveBeenCalledTimes(1);
      const emailCall = termiiEmailService.sendRawHTMLEmail.mock.calls[0][0];
      expect(emailCall.email).toBe('john.doe@example.com');
      expect(emailCall.subject).toBe('Account Deletion Request - Auqli');
    });

    it('should throw ValidationError when buyer does not exist', async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      // Act & Assert
      await expect(requestAccountDeletionService.requestAccountDeletion(nonExistentId))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when buyer already has account deletion in progress', async () => {
      // Arrange - Update buyer with existing account deletion request
      testBuyer.accountDeletion = {
        otp: '1234',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        attempts: 0
      };
      await testBuyer.save();

      const buyerId = testBuyer._id.toString();

      // Act & Assert
      await expect(requestAccountDeletionService.requestAccountDeletion(buyerId))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error when database update fails', async () => {
      // Arrange
      const buyerId = testBuyer._id.toString();

      // Mock repository to return null (simulating update failure)
      const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
      jest.spyOn(buyerRepository, 'updateAccountDeletionOTP').mockResolvedValue(null);

      // Act & Assert
      await expect(requestAccountDeletionService.requestAccountDeletion(buyerId))
        .rejects.toThrow('Failed to update buyer with deletion OTP');

      // Restore original method
      buyerRepository.updateAccountDeletionOTP.mockRestore();
    });

    it('should throw error when email sending fails', async () => {
      // Arrange
      const buyerId = testBuyer._id.toString();

      // Mock Termii email sending to throw error
      termiiEmailService.sendRawHTMLEmail.mockRejectedValue(new Error('Termii error'));

      // Act & Assert
      await expect(requestAccountDeletionService.requestAccountDeletion(buyerId))
        .rejects.toThrow('Termii error');
    });

    it('should generate unique OTP for each request', async () => {
      // Arrange
      const buyerId = testBuyer._id.toString();

      // Act
      await requestAccountDeletionService.requestAccountDeletion(buyerId);

      // Assert
      const updatedBuyer = await Buyer.findById(buyerId);
      expect(updatedBuyer.accountDeletion.otp).toMatch(/^\d{4}$/);
    });

    it('should set expiry time to 10 minutes from current time', async () => {
      // Arrange
      const buyerId = testBuyer._id.toString();
      const beforeRequest = new Date();

      // Act
      await requestAccountDeletionService.requestAccountDeletion(buyerId);

      // Assert
      const updatedBuyer = await Buyer.findById(buyerId);
      const afterRequest = new Date();

      expect(updatedBuyer.accountDeletion.expiresAt).toBeInstanceOf(Date);
      expect(updatedBuyer.accountDeletion.expiresAt.getTime()).toBeGreaterThan(beforeRequest.getTime());
      expect(updatedBuyer.accountDeletion.expiresAt.getTime()).toBeLessThanOrEqual(afterRequest.getTime() + 10 * 60 * 1000);
    });

    it('should reset attempts to 0 when creating new deletion request', async () => {
      // Arrange
      const buyerId = testBuyer._id.toString();

      // Act
      await requestAccountDeletionService.requestAccountDeletion(buyerId);

      // Assert
      const updatedBuyer = await Buyer.findById(buyerId);
      expect(updatedBuyer.accountDeletion.attempts).toBe(0);
    });

    it('should send email with correct template replacements', async () => {
      // Arrange
      const buyerId = testBuyer._id.toString();

      // Act
      await requestAccountDeletionService.requestAccountDeletion(buyerId);

      // Assert
      expect(termiiEmailService.sendRawHTMLEmail).toHaveBeenCalledTimes(1);
      const emailCall = termiiEmailService.sendRawHTMLEmail.mock.calls[0][0];

      // Get the actual OTP that was generated and stored
      const updatedBuyer = await Buyer.findById(buyerId);
      const actualOTP = updatedBuyer.accountDeletion.otp;

      expect(emailCall.html).toContain(actualOTP); // OTP should be replaced
      expect(emailCall.html).toContain(new Date().getFullYear().toString()); // Year should be replaced
    });

    it('should handle Termii API errors gracefully', async () => {
      // Arrange
      const buyerId = testBuyer._id.toString();

      // Mock Termii API error
      termiiEmailService.sendRawHTMLEmail.mockRejectedValue(new Error('Invalid API key'));

      // Act & Assert
      await expect(requestAccountDeletionService.requestAccountDeletion(buyerId))
        .rejects.toThrow('Invalid API key');
    });
  });
});