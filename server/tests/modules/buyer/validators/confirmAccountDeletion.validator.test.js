const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Buyer = require('@modules/buyer/models/buyer.model');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the buyerRepository before importing the validator
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
jest.mock('@modules/buyer/repositories/buyer.repository');

// Import the validator after mocking
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
    jest.clearAllMocks();
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

      // Mock the repository to return the saved buyer
      buyerRepository.findById.mockResolvedValue(savedBuyer);

      // Act & Assert
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          validOTP
        )
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError for missing buyer ID', async () => {
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(null, '1234')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid buyer ID format', async () => {
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData('invalid-id', '1234')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Invalid buyer ID format'
          }
        ]
      });
    });

    it('should throw ValidationError for missing OTP', async () => {
      // Create a valid ObjectId for the buyer ID
      const validBuyerId = new mongoose.Types.ObjectId().toString();
      
      // Mock buyerRepository to return a valid buyer
      buyerRepository.findById.mockResolvedValue({
        _id: validBuyerId,
        accountDeletion: {
          otp: '1234',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          attempts: 0
        }
      });

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(validBuyerId, null)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP is required'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid OTP format', async () => {
      // Create a valid ObjectId for the buyer ID
      const validBuyerId = new mongoose.Types.ObjectId().toString();
      
      // Mock buyerRepository to return a valid buyer
      buyerRepository.findById.mockResolvedValue({
        _id: validBuyerId,
        accountDeletion: {
          otp: '1234',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          attempts: 0
        }
      });

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(validBuyerId, '12345')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must be exactly 4 digits'
          }
        ]
      });
    });

    it('should throw ValidationError for non-string OTP', async () => {
      // Create a valid ObjectId for the buyer ID
      const validBuyerId = new mongoose.Types.ObjectId().toString();
      
      // Mock buyerRepository to return a valid buyer
      buyerRepository.findById.mockResolvedValue({
        _id: validBuyerId,
        accountDeletion: {
          otp: '1234',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          attempts: 0
        }
      });

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(validBuyerId, 123456)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError for empty string OTP', async () => {
      // Create a valid ObjectId for the buyer ID
      const validBuyerId = new mongoose.Types.ObjectId().toString();
      
      // Mock buyerRepository to return a valid buyer
      buyerRepository.findById.mockResolvedValue({
        _id: validBuyerId,
        accountDeletion: {
          otp: '1234',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          attempts: 0
        }
      });

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(validBuyerId, '')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP is required'
          }
        ]
      });
    });

    it('should throw ValidationError for OTP with non-numeric characters', async () => {
      // Create a valid ObjectId for the buyer ID
      const validBuyerId = new mongoose.Types.ObjectId().toString();
      
      // Mock buyerRepository to return a valid buyer
      buyerRepository.findById.mockResolvedValue({
        _id: validBuyerId,
        accountDeletion: {
          otp: '1234',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          attempts: 0
        }
      });

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(validBuyerId, '12345a')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must contain only digits'
          },
          {
            field: 'otp',
            message: 'OTP must be exactly 4 digits'
          }
        ]
      });
    });

    it('should throw ValidationError for OTP that is too short', async () => {
      // Create a valid ObjectId for the buyer ID
      const validBuyerId = new mongoose.Types.ObjectId().toString();
      
      // Mock buyerRepository to return a valid buyer
      buyerRepository.findById.mockResolvedValue({
        _id: validBuyerId,
        accountDeletion: {
          otp: '1234',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          attempts: 0
        }
      });

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(validBuyerId, '123')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must be exactly 4 digits'
          }
        ]
      });
    });

    it('should throw ValidationError for OTP that is too long', async () => {
      // Create a valid ObjectId for the buyer ID
      const validBuyerId = new mongoose.Types.ObjectId().toString();
      
      // Mock buyerRepository to return a valid buyer
      buyerRepository.findById.mockResolvedValue({
        _id: validBuyerId,
        accountDeletion: {
          otp: '1234',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          attempts: 0
        }
      });

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(validBuyerId, '12345')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must be exactly 4 digits'
          }
        ]
      });
    });

    it('should throw ValidationError for null buyer ID and invalid OTP', async () => {
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(null, '12345')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must be exactly 4 digits'
          },
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid buyer ID and null OTP', async () => {
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData('invalid-id', null)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP is required'
          },
          {
            field: 'buyerId',
            message: 'Invalid buyer ID format'
          }
        ]
      });
    });

    it('should throw ValidationError for both invalid buyer ID and OTP', async () => {
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData('invalid-id', '12345')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must be exactly 4 digits'
          },
          {
            field: 'buyerId',
            message: 'Invalid buyer ID format'
          }
        ]
      });
    });

    it('should throw ValidationError for empty string buyer ID and empty string OTP', async () => {
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData('', '')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP is required'
          },
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for non-string buyer ID and non-string OTP', async () => {
      // This test should expect only the OTP error since the validator validates OTP first and returns early
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(123, 123456)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError for undefined buyer ID and undefined OTP', async () => {
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(undefined, undefined)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP is required'
          },
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError when OTP is not a string', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();

      // Mock the repository to return the saved buyer
      buyerRepository.findById.mockResolvedValue(savedBuyer);

      // Act & Assert
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          1234
        )
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must be a string'
          }
        ]
      });

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          ['1', '2', '3', '4']
        )
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError when OTP contains non-numeric characters', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();

      // Mock the repository to return the saved buyer
      buyerRepository.findById.mockResolvedValue(savedBuyer);

      // Act & Assert
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          'abcd'
        )
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must contain only digits'
          }
        ]
      });

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          '12a4'
        )
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must contain only digits'
          }
        ]
      });

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          '12#4'
        )
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must contain only digits'
          }
        ]
      });
    });

    it('should throw ValidationError when OTP is not exactly 4 digits', async () => {
      // Create a valid ObjectId for the buyer ID
      const validBuyerId = new mongoose.Types.ObjectId().toString();
      
      // Mock buyerRepository to return a valid buyer
      buyerRepository.findById.mockResolvedValue({
        _id: validBuyerId,
        accountDeletion: {
          otp: '1234',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          attempts: 0
        }
      });

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          validBuyerId,
          '123'
        )
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must be exactly 4 digits'
          }
        ]
      });
    });

    it('should throw ValidationError when no account deletion request exists', async () => {
      // Create a valid ObjectId for the buyer ID
      const validBuyerId = new mongoose.Types.ObjectId().toString();
      
      // Mock buyerRepository to return a buyer without account deletion request
      buyerRepository.findById.mockResolvedValue({
        _id: validBuyerId,
        // No accountDeletion field
      });

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          validBuyerId,
          '1234'
        )
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'No account deletion request found'
          }
        ]
      });
    });

    it('should throw ValidationError when account deletion OTP is missing', async () => {
      // Create a valid ObjectId for the buyer ID
      const validBuyerId = new mongoose.Types.ObjectId().toString();
      
      // Mock buyerRepository to return a buyer with account deletion but no OTP
      buyerRepository.findById.mockResolvedValue({
        _id: validBuyerId,
        accountDeletion: {
          // No otp field
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          attempts: 0
        }
      });

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          validBuyerId,
          '1234'
        )
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'No account deletion request found'
          }
        ]
      });
    });

    it('should throw ValidationError when too many attempts have been made', async () => {
      // Create a valid ObjectId for the buyer ID
      const validBuyerId = new mongoose.Types.ObjectId().toString();
      
      // Mock buyerRepository to return a buyer with too many attempts
      buyerRepository.findById.mockResolvedValue({
        _id: validBuyerId,
        accountDeletion: {
          otp: '1234',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          attempts: 5 // Maximum attempts exceeded
        }
      });

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          validBuyerId,
          '1234'
        )
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'Maximum OTP attempts exceeded'
          }
        ]
      });
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

      // Mock the repository to return the saved buyer
      buyerRepository.findById.mockResolvedValue(savedBuyer);

      // Act & Assert
      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          savedBuyer._id.toString(),
          '1234'
        )
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError with specific error messages', async () => {
      // Create a valid ObjectId for the buyer ID
      const validBuyerId = new mongoose.Types.ObjectId().toString();
      
      // Mock buyerRepository to return null (buyer not found)
      buyerRepository.findById.mockResolvedValue(null);

      await expect(
        confirmAccountDeletionValidator.validateConfirmAccountDeletionData(
          validBuyerId,
          'abc1'
        )
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'otp',
            message: 'OTP must contain only digits'
          },
          {
            field: 'buyerId',
            message: 'Buyer not found'
          }
        ]
      });
    });
  });
});