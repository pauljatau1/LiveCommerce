const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Buyer = require('@models/Buyer');
const ValidationError = require('@utils/errors/ValidationError');

// Mock TermiiEmailService
jest.mock('@services/termiiEmailService', () => ({
  sendRawHTMLEmail: jest.fn().mockResolvedValue(true)
}));

const termiiEmailService = require('@services/termiiEmailService');
const confirmAccountDeletionService = require('@modules/buyer/services/confirmAccountDeletion.service');

describe('confirmAccountDeletion.service', () => {
  let mongoServer;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    process.env.TERMII_API_KEY = 'test-key';
  });

  afterAll(async () => {
    // Clean up and close connections
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Explicitly reset Termii mock to success
    termiiEmailService.sendRawHTMLEmail.mockResolvedValue(true);
  });

  afterEach(async () => {
    // Clean up database after each test
    await Buyer.deleteMany({});
  });

  describe('getEmailContent', () => {
    it('should return HTML content with current year', async () => {
      // Arrange
      const email = 'test@example.com';
      const currentYear = new Date().getFullYear();

      // Setup fs mock to return a simple template
      const mockTemplate = '<p>Account deleted. {{year}}</p>';
      jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(mockTemplate);

      // Act
      const result = await confirmAccountDeletionService.getEmailContent(email);

      // Assert
      expect(result).toContain(currentYear.toString());
      expect(result).not.toContain('{{year}}');
    });
  });

  describe('confirmAccountDeletion', () => {
    const mockBuyerData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'hashedPassword123',
      username: 'johndoe123',
      phoneNumber: '08031234567',
      isVerified: true,
      accountDeletion: {
        otp: '1234',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        attempts: 0
      }
    };

    it('should successfully confirm account deletion with valid OTP', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const validOTP = '1234';

      // Setup fs mock to return a simple template
      const mockTemplate = '<html>Account deleted. {{year}}</html>';
      jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(mockTemplate);

      // Act
      const result = await confirmAccountDeletionService.confirmAccountDeletion(
        savedBuyer._id.toString(),
        validOTP
      );

      // Assert
      expect(result).toEqual({
        message: 'Account deleted successfully'
      });

      // Verify that email was sent
      expect(termiiEmailService.sendRawHTMLEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockBuyerData.email,
          subject: 'Account Deleted Successfully - Auqli',
          html: expect.stringContaining('Account deleted')
        })
      );

      // Verify that buyer was deleted from database
      const deletedBuyer = await Buyer.findById(savedBuyer._id);
      expect(deletedBuyer).toBeNull();
    });

    it('should throw ValidationError when OTP is invalid', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const invalidOTP = '5678';

      // Act & Assert
      await expect(
        confirmAccountDeletionService.confirmAccountDeletion(
          savedBuyer._id.toString(),
          invalidOTP
        )
      ).rejects.toThrow(ValidationError);

      // Verify that attempts were incremented
      const updatedBuyer = await Buyer.findById(savedBuyer._id);
      expect(updatedBuyer.accountDeletion.attempts).toBe(1);

      // Verify that buyer was NOT deleted
      expect(updatedBuyer).not.toBeNull();

      // Verify that no email was sent
      expect(termiiEmailService.sendRawHTMLEmail).not.toHaveBeenCalled();
    });

    it('should include remaining attempts in error when OTP is invalid', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        accountDeletion: {
          otp: '1234',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 2 // Already 2 failed attempts
        }
      });
      const savedBuyer = await buyer.save();
      const invalidOTP = '5678';

      // Act & Assert
      await expect(confirmAccountDeletionService.confirmAccountDeletion(
        savedBuyer._id.toString(),
        invalidOTP
      )).rejects.toThrow(ValidationError);
    });

    it('should handle Termii email sending failure', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const validOTP = '1234';

      // Setup fs mock to return a simple template
      const mockTemplate = '<html>Account deleted. {{year}}</html>';
      jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(mockTemplate);

      // Mock Termii to fail
      termiiEmailService.sendRawHTMLEmail.mockRejectedValue(new Error('Termii error'));

      // Act & Assert
      await expect(
        confirmAccountDeletionService.confirmAccountDeletion(
          savedBuyer._id.toString(),
          validOTP
        )
      ).rejects.toThrow('Termii error');

      // Verify that buyer was NOT deleted due to email failure
      const stillExistsBuyer = await Buyer.findById(savedBuyer._id);
      expect(stillExistsBuyer).not.toBeNull();
    });

    it('should handle file reading errors for email template', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const validOTP = '1234';

      // Mock fs.readFileSync to throw error
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation(() => {
        throw new Error('Template file not found');
      });

      // Act & Assert
      await expect(
        confirmAccountDeletionService.confirmAccountDeletion(
          savedBuyer._id.toString(),
          validOTP
        )
      ).rejects.toThrow('Template file not found');

      // Verify that buyer was NOT deleted due to template error
      const stillExistsBuyer = await Buyer.findById(savedBuyer._id);
      expect(stillExistsBuyer).not.toBeNull();
    });

    it('should throw ValidationError when buyer does not exist', async () => {
      // Arrange
      const nonExistentBuyerId = new mongoose.Types.ObjectId().toString();
      const validOTP = '1234';

      // Act & Assert
      await expect(
        confirmAccountDeletionService.confirmAccountDeletion(
          nonExistentBuyerId,
          validOTP
        )
      ).rejects.toThrow(ValidationError);

      // Verify no email was sent
      expect(termiiEmailService.sendRawHTMLEmail).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when no deletion request exists', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        accountDeletion: undefined
      });
      const savedBuyer = await buyer.save();
      const validOTP = '1234';

      // Act & Assert
      await expect(
        confirmAccountDeletionService.confirmAccountDeletion(
          savedBuyer._id.toString(),
          validOTP
        )
      ).rejects.toThrow(ValidationError);

      // Verify no email was sent
      expect(termiiEmailService.sendRawHTMLEmail).not.toHaveBeenCalled();

      // Verify buyer still exists
      const stillExistsBuyer = await Buyer.findById(savedBuyer._id);
      expect(stillExistsBuyer).not.toBeNull();
    });

    it('should throw ValidationError when OTP has expired', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        accountDeletion: {
          otp: '1234',
          expiresAt: new Date(Date.now() - 1000), // 1 second ago (expired)
          attempts: 0
        }
      });
      const savedBuyer = await buyer.save();
      const validOTP = '1234';

      // Act & Assert
      await expect(
        confirmAccountDeletionService.confirmAccountDeletion(
          savedBuyer._id.toString(),
          validOTP
        )
      ).rejects.toThrow(ValidationError);

      // Verify no email was sent
      expect(termiiEmailService.sendRawHTMLEmail).not.toHaveBeenCalled();

      // Verify buyer still exists
      const stillExistsBuyer = await Buyer.findById(savedBuyer._id);
      expect(stillExistsBuyer).not.toBeNull();
    });

    it('should throw ValidationError when too many attempts have been made', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        accountDeletion: {
          otp: '1234',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 5 // Max attempts reached
        }
      });
      const savedBuyer = await buyer.save();
      const validOTP = '1234';

      // Act & Assert
      await expect(
        confirmAccountDeletionService.confirmAccountDeletion(
          savedBuyer._id.toString(),
          validOTP
        )
      ).rejects.toThrow(ValidationError);

      // Verify no email was sent
      expect(termiiEmailService.sendRawHTMLEmail).not.toHaveBeenCalled();

      // Verify buyer still exists
      const stillExistsBuyer = await Buyer.findById(savedBuyer._id);
      expect(stillExistsBuyer).not.toBeNull();
    });

    it('should properly calculate remaining attempts', async () => {
      // Test with various attempt counts
      const testCases = [
        { currentAttempts: 0, expectedRemaining: 4 }, // 5 - (0 + 1) = 4
        { currentAttempts: 1, expectedRemaining: 3 }, // 5 - (1 + 1) = 3
        { currentAttempts: 3, expectedRemaining: 1 }, // 5 - (3 + 1) = 1
        { currentAttempts: 4, expectedRemaining: 0 }  // 5 - (4 + 1) = 0
      ];

      for (const testCase of testCases) {
        // Arrange
        const buyer = new Buyer({
          ...mockBuyerData,
          accountDeletion: {
            otp: '1234',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            attempts: testCase.currentAttempts
          }
        });
        const savedBuyer = await buyer.save();
        const invalidOTP = '5678';

        // Act & Assert
        await expect(confirmAccountDeletionService.confirmAccountDeletion(
          savedBuyer._id.toString(),
          invalidOTP
        )).rejects.toThrow(ValidationError);

        // Clean up for next iteration
        await Buyer.findByIdAndDelete(savedBuyer._id);
      }
    });
  });
});