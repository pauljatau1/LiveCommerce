const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Buyer = require('@modules/buyer/models/buyer.model');
const ValidationError = require('@utils/errors/ValidationError');
const confirmAccountDeletionValidator = require('@modules/buyer/validators/confirmAccountDeletion.validator');

describe('confirmAccountDeletion.validator', () => {
  let mongoServer;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and close connections
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clean up database after each test
    await Buyer.deleteMany({});
  });

  describe('validateConfirmAccountDeletionData', () => {
    const mockBuyerData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'hashedPassword123',
      username: 'johndoe123',
      phoneNumber: '+1234567890',
      isVerified: true,
      accountDeletion: {
        otp: '1234',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        attempts: 0
      }
    };

    it('should validate successfully with valid data', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const validOTP = '1234';

      // Act & Assert
      const result = await confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
        savedBuyer._id.toString(),
        validOTP
      );

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(savedBuyer._id.toString());
      expect(result.email).toBe(mockBuyerData.email);
    });

    it('should throw ValidationError when OTP is missing', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();

      // Act & Assert
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          ''
        )
      ).rejects.toThrow(ValidationError);

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          null
        )
      ).rejects.toThrow(ValidationError);

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          undefined
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when OTP is not a string', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();

      // Act & Assert
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          1234
        )
      ).rejects.toThrow(ValidationError);

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          ['1', '2', '3', '4']
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when OTP contains non-numeric characters', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();

      // Act & Assert
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          'abcd'
        )
      ).rejects.toThrow(ValidationError);

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          '12a4'
        )
      ).rejects.toThrow(ValidationError);

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          '12#4'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when OTP is not exactly 4 digits', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();

      // Act & Assert
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          '123'
        )
      ).rejects.toThrow(ValidationError);

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          '12345'
        )
      ).rejects.toThrow(ValidationError);

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          '1'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when buyerId is missing', async () => {
      // Act & Assert
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          '',
          '1234'
        )
      ).rejects.toThrow(ValidationError);

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          null,
          '1234'
        )
      ).rejects.toThrow(ValidationError);

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          undefined,
          '1234'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when buyerId has invalid ObjectId format', async () => {
      // Act & Assert
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          'invalid-id-format',
          '1234'
        )
      ).rejects.toThrow(ValidationError);

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          '12345',
          '1234'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when buyer does not exist', async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      // Act & Assert
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          nonExistentId,
          '1234'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when no account deletion request exists', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        accountDeletion: undefined
      });
      const savedBuyer = await buyer.save();

      // Act & Assert
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          '1234'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when account deletion OTP is missing', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        accountDeletion: {
          otp: null,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0
        }
      });
      const savedBuyer = await buyer.save();

      // Act & Assert
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          '1234'
        )
      ).rejects.toThrow(ValidationError);
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

      // Act & Assert
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          '1234'
        )
      ).rejects.toThrow(ValidationError);
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

      // Act & Assert
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          '1234'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should validate successfully when attempts are less than maximum', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        accountDeletion: {
          otp: '1234',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 4 // Just under the limit
        }
      });
      const savedBuyer = await buyer.save();

      // Act & Assert
      const result = await confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
        savedBuyer._id.toString(),
        '1234'
      );

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(savedBuyer._id.toString());
    });

    it('should throw ValidationError with specific error messages', async () => {
      // Test OTP validation errors
      try {
        await confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          new mongoose.Types.ObjectId().toString(),
          'abc1'
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toContainEqual(
          expect.objectContaining({
            field: 'otp',
            message: 'OTP must contain only digits'
          })
        );
      }

      // Test buyer ID validation errors
      try {
        await confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          'invalid-id',
          '1234'
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toContainEqual(
          expect.objectContaining({
            field: 'buyerId',
            message: 'Invalid buyer ID format'
          })
        );
      }
    });
  });
});