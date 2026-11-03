const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the validator
const unfollowSellerValidator = require('@modules/buyer/validators/unfollowSeller.validator');

// Import the Buyer and Seller models
const Buyer = require('@models/Buyer');
const Seller = require('@models/Seller');

// Mock the buyer repository
jest.mock('@modules/buyer/repositories/buyer.repository', () => ({
  findById: jest.fn()
}));

// Import the mocked repository
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');

let mongoServer;

describe('Unfollow Seller Validator', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB with compatible version
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3' // Use a version compatible with Debian 12
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Clear database
    await Buyer.deleteMany({});
    await Seller.deleteMany({});
  });

  describe('validateUnfollowSellerData', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();
    const mockSellerId = new mongoose.Types.ObjectId();

    it('should pass validation with valid buyer and seller IDs', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678'
      });

      const seller = new Seller({
        _id: mockSellerId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'hashedpassword',
        phoneNumber: '+2348012345679',
        storeName: 'Jane\'s Store'
      });

      await buyer.save();
      await seller.save();

      buyerRepository.findById.mockResolvedValue(buyer);

      // Act & Assert
      await expect(
        unfollowSellerValidator.validateUnfollowSellerData(mockBuyerId.toString(), mockSellerId.toString())
      ).resolves.not.toThrow();
    });

    it('should throw validation error for missing buyer ID', async () => {
      // Act & Assert
      await expect(
        unfollowSellerValidator.validateUnfollowSellerData(null, mockSellerId.toString())
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for missing seller ID', async () => {
      // Act & Assert
      await expect(
        unfollowSellerValidator.validateUnfollowSellerData(mockBuyerId.toString(), null)
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for invalid buyer ID format', async () => {
      // Act & Assert
      await expect(
        unfollowSellerValidator.validateUnfollowSellerData('invalid-id', mockSellerId.toString())
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for invalid seller ID format', async () => {
      // Act & Assert
      await expect(
        unfollowSellerValidator.validateUnfollowSellerData(mockBuyerId.toString(), 'invalid-id')
      ).rejects.toThrow('Validation failed');
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing buyer ID', async () => {
        await expect(
          unfollowSellerValidator.validateUnfollowSellerData(null, mockSellerId.toString())
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Buyer ID is required'
            }
          ]
        });
      });

      it('should include specific error message for missing seller ID', async () => {
        await expect(
          unfollowSellerValidator.validateUnfollowSellerData(mockBuyerId.toString(), null)
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'sellerId',
              message: 'Seller ID is required'
            }
          ]
        });
      });

      it('should include specific error message for invalid buyer ID format', async () => {
        await expect(
          unfollowSellerValidator.validateUnfollowSellerData('invalid-id', mockSellerId.toString())
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Invalid buyer ID format'
            }
          ]
        });
      });

      it('should include specific error message for invalid seller ID format', async () => {
        await expect(
          unfollowSellerValidator.validateUnfollowSellerData(mockBuyerId.toString(), 'invalid-id')
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'sellerId',
              message: 'Invalid seller ID format'
            }
          ]
        });
      });

      it('should include specific error message for buyer not found', async () => {
        buyerRepository.findById.mockResolvedValue(null);

        await expect(
          unfollowSellerValidator.validateUnfollowSellerData(mockBuyerId.toString(), mockSellerId.toString())
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Buyer not found'
            },
            {
              field: 'sellerId',
              message: 'Seller not found'
            }
          ]
        });
      });

      it('should include specific error message for seller not found', async () => {
        const buyer = new Buyer({
          _id: mockBuyerId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe',
          password: 'hashedpassword',
          phoneNumber: '+2348012345678'
        });

        await buyer.save();
        buyerRepository.findById.mockResolvedValue(buyer);

        await expect(
          unfollowSellerValidator.validateUnfollowSellerData(mockBuyerId.toString(), mockSellerId.toString())
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'sellerId',
              message: 'Seller not found'
            }
          ]
        });
      });
    });

    it('should throw validation error when buyer does not exist', async () => {
      // Arrange
      buyerRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        unfollowSellerValidator.validateUnfollowSellerData(mockBuyerId.toString(), mockSellerId.toString())
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error when seller does not exist', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678'
      });

      await buyer.save();
      buyerRepository.findById.mockResolvedValue(buyer);

      // Act & Assert
      await expect(
        unfollowSellerValidator.validateUnfollowSellerData(mockBuyerId.toString(), mockSellerId.toString())
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for empty buyer ID string', async () => {
      // Act & Assert
      await expect(
        unfollowSellerValidator.validateUnfollowSellerData('', mockSellerId.toString())
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for empty seller ID string', async () => {
      // Act & Assert
      await expect(
        unfollowSellerValidator.validateUnfollowSellerData(mockBuyerId.toString(), '')
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for undefined buyer ID', async () => {
      // Act & Assert
      await expect(
        unfollowSellerValidator.validateUnfollowSellerData(undefined, mockSellerId.toString())
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for undefined seller ID', async () => {
      // Act & Assert
      await expect(
        unfollowSellerValidator.validateUnfollowSellerData(mockBuyerId.toString(), undefined)
      ).rejects.toThrow('Validation failed');
    });
  });
}); 