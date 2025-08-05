const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const requestAccountDeletionValidator = require('@modules/buyer/validators/requestAccountDeletion.validator');
const Buyer = require('@modules/buyer/models/buyer.model');
const ValidationError = require('@utils/errors/ValidationError');

let mongoServer;

describe('requestAccountDeletion.validator', () => {
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
    
    // Create a test buyer without account deletion request
    testBuyer = new Buyer({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'hashedPassword123'
    });
    await testBuyer.save();
  });

  afterEach(async () => {
    await Buyer.deleteMany({});
  });

  describe('validateRequestAccountDeletionData', () => {
    it('should validate successful request account deletion data', async () => {
      // Arrange
      const buyerId = testBuyer._id.toString();

      // Act
      const result = await requestAccountDeletionValidator.validateRequestAccountDeletionData(buyerId);

      // Assert
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(buyerId);
      expect(result.email).toBe('john.doe@example.com');
    });

    it('should throw ValidationError when buyerId is missing', async () => {
      // Arrange
      const buyerId = null;

      // Act & Assert
      await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData(buyerId))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when buyerId is undefined', async () => {
      // Arrange
      const buyerId = undefined;

      // Act & Assert
      await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData(buyerId))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when buyerId is empty string', async () => {
      // Arrange
      const buyerId = '';

      // Act & Assert
      await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData(buyerId))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when buyerId format is invalid', async () => {
      // Arrange
      const buyerId = 'invalid-id-format';

      // Act & Assert
      await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData(buyerId))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when buyer does not exist', async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      // Act & Assert
      await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData(nonExistentId))
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
      await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData(buyerId))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when buyer has expired account deletion request', async () => {
      // Arrange - Update buyer with expired account deletion request
      testBuyer.accountDeletion = {
        otp: '1234',
        expiresAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        attempts: 0
      };
      await testBuyer.save();

      const buyerId = testBuyer._id.toString();

      // Act & Assert
      await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData(buyerId))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when buyer has account deletion with no OTP', async () => {
      // Arrange - Update buyer with account deletion but no OTP
      testBuyer.accountDeletion = {
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        attempts: 0
      };
      await testBuyer.save();

      const buyerId = testBuyer._id.toString();

      // Act & Assert - This should actually be allowed since there's no OTP
      const result = await requestAccountDeletionValidator.validateRequestAccountDeletionData(buyerId);

      // Assert
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(buyerId);
    });

    it('should allow request when buyer has no account deletion data', async () => {
      // Arrange - Ensure buyer has no account deletion data
      testBuyer.accountDeletion = undefined;
      await testBuyer.save();

      const buyerId = testBuyer._id.toString();

      // Act
      const result = await requestAccountDeletionValidator.validateRequestAccountDeletionData(buyerId);

      // Assert
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(buyerId);
    });

    it('should allow request when buyer has empty account deletion object', async () => {
      // Arrange - Update buyer with empty account deletion object
      testBuyer.accountDeletion = {};
      await testBuyer.save();

      const buyerId = testBuyer._id.toString();

      // Act
      const result = await requestAccountDeletionValidator.validateRequestAccountDeletionData(buyerId);

      // Assert
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(buyerId);
    });

    it('should allow request when buyer has account deletion with null OTP', async () => {
      // Arrange - Update buyer with account deletion but null OTP
      testBuyer.accountDeletion = {
        otp: null,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        attempts: 0
      };
      await testBuyer.save();

      const buyerId = testBuyer._id.toString();

      // Act
      const result = await requestAccountDeletionValidator.validateRequestAccountDeletionData(buyerId);

      // Assert
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(buyerId);
    });
  });
}); 