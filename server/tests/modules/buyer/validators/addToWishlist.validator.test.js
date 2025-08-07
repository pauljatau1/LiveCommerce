const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the validator
const addToWishlistValidator = require('@modules/buyer/validators/addToWishlist.validator');

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

describe('Add To Wishlist Validator', () => {
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
  });

  describe('validateAddToWishlistData', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();
    const mockProductId = new mongoose.Types.ObjectId();

    it('should pass validation with valid buyer and product IDs', async () => {
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

      const product = new Product({
        _id: mockProductId,
        name: 'Test Product',
        description: 'A test product',
        price: 100,
        category: 'Electronics',
        brand: 'Test Brand',
        stock: 10,
        seller: new mongoose.Types.ObjectId()
      });

      await buyer.save();
      await product.save();

      buyerRepository.findById.mockResolvedValue(buyer);

      // Act & Assert
      await expect(
        addToWishlistValidator.validateAddToWishlistData(mockBuyerId.toString(), mockProductId.toString())
      ).resolves.not.toThrow();
    });

    it('should throw validation error for missing buyer ID', async () => {
      // Act & Assert
      await expect(
        addToWishlistValidator.validateAddToWishlistData(null, mockProductId.toString())
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for missing product ID', async () => {
      // Act & Assert
      await expect(
        addToWishlistValidator.validateAddToWishlistData(mockBuyerId.toString(), null)
      ).rejects.toThrow('Validation failed');
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing buyer ID', async () => {
        await expect(
          addToWishlistValidator.validateAddToWishlistData(null, mockProductId.toString())
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Buyer ID is required'
            }
          ]
        });
      });

      it('should include specific error message for missing product ID', async () => {
        await expect(
          addToWishlistValidator.validateAddToWishlistData(mockBuyerId.toString(), null)
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'productId',
              message: 'Product ID is required'
            }
          ]
        });
      });

      it('should include specific error message for invalid buyer ID format', async () => {
        await expect(
          addToWishlistValidator.validateAddToWishlistData('invalid-id', mockProductId.toString())
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Invalid buyer ID format'
            }
          ]
        });
      });

      it('should include specific error message for invalid product ID format', async () => {
        await expect(
          addToWishlistValidator.validateAddToWishlistData(mockBuyerId.toString(), 'invalid-id')
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'productId',
              message: 'Invalid product ID format'
            }
          ]
        });
      });

      it('should include specific error message for buyer not found', async () => {
        buyerRepository.findById.mockResolvedValue(null);

        await expect(
          addToWishlistValidator.validateAddToWishlistData(mockBuyerId.toString(), mockProductId.toString())
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Buyer not found'
            },
            {
              field: 'productId',
              message: 'Product not found'
            }
          ]
        });
      });

      it('should include specific error message for product not found', async () => {
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
          addToWishlistValidator.validateAddToWishlistData(mockBuyerId.toString(), mockProductId.toString())
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'productId',
              message: 'Product not found'
            }
          ]
        });
      });
    });

    it('should throw validation error for empty buyer ID string', async () => {
      // Act & Assert
      await expect(
        addToWishlistValidator.validateAddToWishlistData('', mockProductId.toString())
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for empty product ID string', async () => {
      // Act & Assert
      await expect(
        addToWishlistValidator.validateAddToWishlistData(mockBuyerId.toString(), '')
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for undefined buyer ID', async () => {
      // Act & Assert
      await expect(
        addToWishlistValidator.validateAddToWishlistData(undefined, mockProductId.toString())
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for undefined product ID', async () => {
      // Act & Assert
      await expect(
        addToWishlistValidator.validateAddToWishlistData(mockBuyerId.toString(), undefined)
      ).rejects.toThrow('Validation failed');
    });
  });
}); 