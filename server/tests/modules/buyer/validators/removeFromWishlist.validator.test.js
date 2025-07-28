const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the validator
const removeFromWishlistValidator = require('@modules/buyer/validators/removeFromWishlist.validator');

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

describe('Remove From Wishlist Validator', () => {
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

  describe('validateRemoveFromWishlistData', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();
    const mockProductId = new mongoose.Types.ObjectId();

    it('should pass validation with valid buyer ID and product ID', async () => {
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
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          mockBuyerId.toString(),
          mockProductId.toString()
        )
      ).resolves.not.toThrow();
    });

    it('should throw validation error for missing buyer ID', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          null,
          mockProductId.toString()
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for missing product ID', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          mockBuyerId.toString(),
          null
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for invalid buyer ID format', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          'invalid-buyer-id',
          mockProductId.toString()
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for invalid product ID format', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          mockBuyerId.toString(),
          'invalid-product-id'
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error when buyer does not exist', async () => {
      // Arrange
      buyerRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          mockBuyerId.toString(),
          mockProductId.toString()
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for empty buyer ID string', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          '',
          mockProductId.toString()
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for empty product ID string', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          mockBuyerId.toString(),
          ''
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for undefined buyer ID', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          undefined,
          mockProductId.toString()
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for undefined product ID', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          mockBuyerId.toString(),
          undefined
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for whitespace buyer ID', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          '   ',
          mockProductId.toString()
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for whitespace product ID', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          mockBuyerId.toString(),
          '   '
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for non-string buyer ID', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          123,
          mockProductId.toString()
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for non-string product ID', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          mockBuyerId.toString(),
          456
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for object buyer ID', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          {},
          mockProductId.toString()
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for object product ID', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          mockBuyerId.toString(),
          {}
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for array buyer ID', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          [],
          mockProductId.toString()
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for array product ID', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          mockBuyerId.toString(),
          []
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for both invalid buyer and product IDs', async () => {
      // Act & Assert
      await expect(
        removeFromWishlistValidator.validateRemoveFromWishlistData(
          'invalid-buyer',
          'invalid-product'
        )
      ).rejects.toThrow('Validation failed');
    });
  });
}); 