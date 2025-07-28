const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the service
const removeFromWishlistService = require('@modules/buyer/services/removeFromWishlist.service');

// Import the Buyer and Product models
const Buyer = require('@modules/buyer/models/buyer.model');
const Product = require('@models/Product');
const Seller = require('@models/Seller');

// Mock the validator
jest.mock('@modules/buyer/validators/removeFromWishlist.validator', () => ({
  validateRemoveFromWishlistData: jest.fn()
}));

// Import the mocked modules
const removeFromWishlistValidator = require('@modules/buyer/validators/removeFromWishlist.validator');

let mongoServer;

describe('Remove From Wishlist Service', () => {
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

  describe('removeFromWishlist', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();
    const mockProductId = new mongoose.Types.ObjectId();
    const mockProductId2 = new mongoose.Types.ObjectId();

    it('should successfully remove product from wishlist', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        wishlist: [
          {
            product: mockProductId,
            addedAt: new Date()
          },
          {
            product: mockProductId2,
            addedAt: new Date()
          }
        ]
      });

      await buyer.save();

      removeFromWishlistValidator.validateRemoveFromWishlistData.mockResolvedValue();

      // Act
      const result = await removeFromWishlistService.removeFromWishlist(
        mockBuyerId.toString(),
        mockProductId.toString()
      );

      // Assert
      expect(removeFromWishlistValidator.validateRemoveFromWishlistData).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockProductId.toString()
      );

      expect(result).toHaveProperty('wishlist');
      expect(result.wishlist).toBeInstanceOf(Array);
      expect(result.wishlist).toHaveLength(1);
      expect(result.wishlist[0].product.toString()).toBe(mockProductId2.toString());
    });

    it('should remove last product from wishlist', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        wishlist: [
          {
            product: mockProductId,
            addedAt: new Date()
          }
        ]
      });

      await buyer.save();

      removeFromWishlistValidator.validateRemoveFromWishlistData.mockResolvedValue();

      // Act
      const result = await removeFromWishlistService.removeFromWishlist(
        mockBuyerId.toString(),
        mockProductId.toString()
      );

      // Assert
      expect(result.wishlist).toBeInstanceOf(Array);
      expect(result.wishlist).toHaveLength(0);
    });

    it('should throw error when product is not in wishlist', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        wishlist: [
          {
            product: mockProductId2,
            addedAt: new Date()
          }
        ]
      });

      await buyer.save();

      removeFromWishlistValidator.validateRemoveFromWishlistData.mockResolvedValue();

      // Act & Assert
      await expect(
        removeFromWishlistService.removeFromWishlist(
          mockBuyerId.toString(),
          mockProductId.toString()
        )
      ).rejects.toThrow('Product not found in wishlist');
    });

    it('should handle buyer with empty wishlist', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        wishlist: []
      });

      await buyer.save();

      removeFromWishlistValidator.validateRemoveFromWishlistData.mockResolvedValue();

      // Act & Assert
      await expect(
        removeFromWishlistService.removeFromWishlist(
          mockBuyerId.toString(),
          mockProductId.toString()
        )
      ).rejects.toThrow('Product not found in wishlist');
    });

    it('should handle buyer with null wishlist', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        wishlist: null
      });

      await buyer.save();

      removeFromWishlistValidator.validateRemoveFromWishlistData.mockResolvedValue();

      // Act & Assert
      await expect(
        removeFromWishlistService.removeFromWishlist(
          mockBuyerId.toString(),
          mockProductId.toString()
        )
      ).rejects.toThrow('Product not found in wishlist');
    });

    it('should handle buyer with undefined wishlist', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        wishlist: undefined
      });

      await buyer.save();

      removeFromWishlistValidator.validateRemoveFromWishlistData.mockResolvedValue();

      // Act & Assert
      await expect(
        removeFromWishlistService.removeFromWishlist(
          mockBuyerId.toString(),
          mockProductId.toString()
        )
      ).rejects.toThrow('Product not found in wishlist');
    });

    it('should remove product from wishlist with multiple items', async () => {
      // Arrange
      const productId3 = new mongoose.Types.ObjectId();
      const productId4 = new mongoose.Types.ObjectId();

      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        wishlist: [
          {
            product: mockProductId,
            addedAt: new Date()
          },
          {
            product: mockProductId2,
            addedAt: new Date()
          },
          {
            product: productId3,
            addedAt: new Date()
          },
          {
            product: productId4,
            addedAt: new Date()
          }
        ]
      });

      await buyer.save();

      removeFromWishlistValidator.validateRemoveFromWishlistData.mockResolvedValue();

      // Act
      const result = await removeFromWishlistService.removeFromWishlist(
        mockBuyerId.toString(),
        mockProductId2.toString()
      );

      // Assert
      expect(result.wishlist).toBeInstanceOf(Array);
      expect(result.wishlist).toHaveLength(3);
      expect(result.wishlist.map(item => item.product.toString())).toEqual([
        mockProductId.toString(),
        productId3.toString(),
        productId4.toString()
      ]);
    });

    it('should handle case-insensitive product ID comparison', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        wishlist: [
          {
            product: mockProductId,
            addedAt: new Date()
          }
        ]
      });

      await buyer.save();

      removeFromWishlistValidator.validateRemoveFromWishlistData.mockResolvedValue();

      // Act
      const result = await removeFromWishlistService.removeFromWishlist(
        mockBuyerId.toString(),
        mockProductId.toString()
      );

      // Assert
      expect(result.wishlist).toBeInstanceOf(Array);
      expect(result.wishlist).toHaveLength(0);
    });
  });
}); 