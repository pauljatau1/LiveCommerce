const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the validator
const getWishlistValidator = require('@modules/buyer/validators/getWishlist.validator');

// Import the Buyer and Product models
const Buyer = require('@modules/buyer/models/buyer.model');
const Product = require('@models/Product');
const Seller = require('@models/Seller');

// Mock the buyer repository
jest.mock('@modules/buyer/repositories/buyer.repository', () => ({
  findById: jest.fn()
}));

// Import the mocked repository
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');

let mongoServer;

describe('Get Wishlist Validator', () => {
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
    await Product.deleteMany({});
    await Seller.deleteMany({});
  });

  describe('validateGetWishlistData', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();

    it('should pass validation with valid buyer ID', async () => {
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
        getWishlistValidator.validateGetWishlistData(mockBuyerId.toString())
      ).resolves.not.toThrow();
    });

    it('should throw validation error for missing buyer ID', async () => {
      // Act & Assert
      await expect(
        getWishlistValidator.validateGetWishlistData(null)
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for invalid buyer ID format', async () => {
      // Act & Assert
      await expect(
        getWishlistValidator.validateGetWishlistData('invalid-id')
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error when buyer does not exist', async () => {
      // Arrange
      buyerRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        getWishlistValidator.validateGetWishlistData(mockBuyerId.toString())
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for empty buyer ID string', async () => {
      // Act & Assert
      await expect(
        getWishlistValidator.validateGetWishlistData('')
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for undefined buyer ID', async () => {
      // Act & Assert
      await expect(
        getWishlistValidator.validateGetWishlistData(undefined)
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for whitespace buyer ID', async () => {
      // Act & Assert
      await expect(
        getWishlistValidator.validateGetWishlistData('   ')
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for non-string buyer ID', async () => {
      // Act & Assert
      await expect(
        getWishlistValidator.validateGetWishlistData(123)
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for object buyer ID', async () => {
      // Act & Assert
      await expect(
        getWishlistValidator.validateGetWishlistData({})
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for array buyer ID', async () => {
      // Act & Assert
      await expect(
        getWishlistValidator.validateGetWishlistData([])
      ).rejects.toThrow('Validation failed');
    });
  });
}); 