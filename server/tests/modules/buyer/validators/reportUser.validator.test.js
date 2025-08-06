const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const reportUserValidator = require('@modules/buyer/validators/reportUser.validator');
const Buyer = require('@modules/buyer/models/buyer.model');
const Seller = require('@models/Seller');
const ValidationError = require('@utils/errors/ValidationError');

let mongoServer;

describe('reportUser.validator', () => {
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
    await Seller.deleteMany({});
  });

  const mockBuyerData = {
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    country: 'NG',
    phoneNumber: '+2348012345678',
    password: 'hashedPassword123',
    isActive: true,
    emailVerified: true,
    phoneVerified: false,
    isNewBuyer: true,
    isIdentityVerified: false,
    preferredCurrency: 'NGN',
    preferredLanguage: 'en',
    authProvider: 'local'
  };

  const mockSellerData = {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phoneNumber: '+2348012345679',
    password: 'hashedPassword456',
    businessName: 'Jane Store',
    storeName: 'janestore',
    country: 'NG',
    isVerified: false,
    accountType: 'individual'
  };

  describe('validateReportUserData', () => {
    let reporterId;
    let reportedUserId;

    beforeEach(async () => {
      // Create reporter (buyer)
      const reporter = new Buyer(mockBuyerData);
      const savedReporter = await reporter.save();
      reporterId = savedReporter._id.toString();

      // Create reported user (seller)
      const reportedUser = new Seller(mockSellerData);
      const savedReportedUser = await reportedUser.save();
      reportedUserId = savedReportedUser._id.toString();
    });

    it('should validate successfully with valid data for reporting seller', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products and refusing refunds to customers.'
      };

      // Act
      const result = await reportUserValidator.validateReportUserData(reporterId, reportData);

      // Assert
      expect(result).toBeDefined();
      expect(result.reporter).toBeDefined();
      expect(result.reportedUser).toBeDefined();
      expect(result.reporter._id.toString()).toBe(reporterId);
      expect(result.reportedUser._id.toString()).toBe(reportedUserId);
    });

    it('should validate successfully with valid data for reporting buyer', async () => {
      // Arrange
      // Create another buyer to be reported
      const anotherBuyer = new Buyer({
        ...mockBuyerData,
        email: 'another@example.com',
        username: 'anotherdoe'
      });
      const savedAnotherBuyer = await anotherBuyer.save();

      const reportData = {
        userId: savedAnotherBuyer._id.toString(),
        userType: 'buyer',
        reason: 'Inappropriate behavior',
        description: 'This buyer is sending offensive messages to sellers and causing disruption.'
      };

      // Act
      const result = await reportUserValidator.validateReportUserData(reporterId, reportData);

      // Assert
      expect(result).toBeDefined();
      expect(result.reporter).toBeDefined();
      expect(result.reportedUser).toBeDefined();
      expect(result.reporter._id.toString()).toBe(reporterId);
      expect(result.reportedUser._id.toString()).toBe(savedAnotherBuyer._id.toString());
    });

    it('should throw ValidationError when userType is missing', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        // userType missing
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData(reporterId, reportData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'userType',
              message: 'User type is required'
            })
          ])
        );
      }
    });

    it('should throw ValidationError when userType is invalid', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'admin', // invalid userType
        reason: 'Fraudulent behavior',
        description: 'This user is causing problems.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData(reporterId, reportData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'userType',
              message: 'User type must be either "buyer" or "seller"'
            })
          ])
        );
      }
    });

    it('should throw ValidationError when reason is missing', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        // reason missing
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData(reporterId, reportData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'reason',
              message: 'Reason is required'
            })
          ])
        );
      }
    });

    it('should throw ValidationError when reason is too short', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'ab', // too short (less than 3 characters)
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData(reporterId, reportData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'reason',
              message: 'Reason must be at least 3 characters long'
            })
          ])
        );
      }
    });

    it('should throw ValidationError when reason is too long', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'a'.repeat(101), // too long (more than 100 characters)
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData(reporterId, reportData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'reason',
              message: 'Reason must not exceed 100 characters'
            })
          ])
        );
      }
    });

    it('should throw ValidationError when description is missing', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior'
        // description missing
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData(reporterId, reportData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'description',
              message: 'Description is required'
            })
          ])
        );
      }
    });

    it('should throw ValidationError when description is too short', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'Too short' // less than 10 characters
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData(reporterId, reportData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'description',
              message: 'Description must be at least 10 characters long'
            })
          ])
        );
      }
    });

    it('should throw ValidationError when description is too long', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'a'.repeat(501) // too long (more than 500 characters)
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData(reporterId, reportData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'description',
              message: 'Description must not exceed 500 characters'
            })
          ])
        );
      }
    });

    it('should throw ValidationError when userId is missing', async () => {
      // Arrange
      const reportData = {
        // userId missing
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData(reporterId, reportData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'userId',
              message: 'User ID is required'
            })
          ])
        );
      }
    });

    it('should throw ValidationError when userId has invalid format', async () => {
      // Arrange
      const reportData = {
        userId: 'invalid-id-format',
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData(reporterId, reportData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'userId',
              message: 'Invalid user ID format'
            })
          ])
        );
      }
    });

    it('should throw ValidationError when reporterId has invalid format', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData('invalid-reporter-id', reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData('invalid-reporter-id', reportData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'buyerId',
              message: 'Invalid buyer ID format'
            })
          ])
        );
      }
    });

    it('should throw ValidationError when reporter does not exist', async () => {
      // Arrange
      const nonExistentReporterId = new mongoose.Types.ObjectId().toString();
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(nonExistentReporterId, reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData(nonExistentReporterId, reportData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'buyerId',
              message: 'Buyer not found'
            })
          ])
        );
      }
    });

    it('should throw ValidationError when reported user does not exist', async () => {
      // Arrange
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();
      const reportData = {
        userId: nonExistentUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData(reporterId, reportData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'userId',
              message: 'Reported user not found'
            })
          ])
        );
      }
    });

    it('should throw ValidationError when user tries to report themselves (buyer)', async () => {
      // Arrange
      const reportData = {
        userId: reporterId, // same as reporter ID
        userType: 'buyer',
        reason: 'Self-report test',
        description: 'This is a test of self-reporting prevention.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData(reporterId, reportData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'userId',
              message: 'You cannot report yourself'
            })
          ])
        );
      }
    });

    it('should handle multiple validation errors at once', async () => {
      // Arrange
      const reportData = {
        userId: 'invalid-id',
        userType: 'invalid-type',
        reason: 'ab', // too short
        description: 'short' // too short
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData(reporterId, reportData);
      } catch (error) {
        expect(error.errors).toHaveLength(4);
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'userType',
              message: 'User type must be either "buyer" or "seller"'
            }),
            expect.objectContaining({
              field: 'reason',
              message: 'Reason must be at least 3 characters long'
            }),
            expect.objectContaining({
              field: 'description',
              message: 'Description must be at least 10 characters long'
            }),
            expect.objectContaining({
              field: 'userId',
              message: 'Invalid user ID format'
            })
          ])
        );
      }
    });

    it('should handle whitespace trimming in reason and description validation', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: '   Valid reason   ', // has whitespace
        description: '   This is a valid description with enough characters   ' // has whitespace
      };

      // Act
      const result = await reportUserValidator.validateReportUserData(reporterId, reportData);

      // Assert
      expect(result).toBeDefined();
      expect(result.reporter).toBeDefined();
      expect(result.reportedUser).toBeDefined();
    });

    it('should throw ValidationError with specific error messages', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 123, // not a string
        reason: 456, // not a string
        description: 789 // not a string
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toThrow(ValidationError);

      try {
        await reportUserValidator.validateReportUserData(reporterId, reportData);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.name).toBe('ValidationError');
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'userType',
              message: 'User type must be a string'
            }),
            expect.objectContaining({
              field: 'reason',
              message: 'Reason must be a string'
            }),
            expect.objectContaining({
              field: 'description',
              message: 'Description must be a string'
            })
          ])
        );
      }
    });
  });
});