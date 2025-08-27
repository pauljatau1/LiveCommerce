const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the service
const addToWishlistService = require('@modules/buyer/services/addToWishlist.service');

// Import the Buyer and Product models
const Buyer = require('@models/Buyer');
const Product = require('@models/Product');

// Mock the validator
jest.mock('@modules/buyer/validators/addToWishlist.validator', () => ({
  validateAddToWishlistData: jest.fn()
}));

// Import the mocked modules
const addToWishlistValidator = require('@modules/buyer/validators/addToWishlist.validator');

let mongoServer;

describe('Add To Wishlist Service', () => {
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

  describe('addToWishlist', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();
    const mockProductId = new mongoose.Types.ObjectId();

    it('should successfully add product to wishlist', async () => {
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

      addToWishlistValidator.validateAddToWishlistData.mockResolvedValue();

      // Act
      const result = await addToWishlistService.addToWishlist(mockBuyerId.toString(), mockProductId.toString());

      // Assert
      expect(addToWishlistValidator.validateAddToWishlistData).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockProductId.toString()
      );

      expect(result).toHaveProperty('wishlist');
      expect(result.wishlist).toHaveLength(1);
      expect(result.wishlist[0].product.toString()).toBe(mockProductId.toString());
      expect(result.wishlist[0]).toHaveProperty('addedAt');

      // Verify product was added to buyer's wishlist
      const updatedBuyer = await Buyer.findById(mockBuyerId);
      expect(updatedBuyer.wishlist).toHaveLength(1);
      expect(updatedBuyer.wishlist[0].product.toString()).toBe(mockProductId.toString());
    });

    it('should throw error if product is already in wishlist', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        wishlist: [{
          product: mockProductId,
          addedAt: new Date()
        }]
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

      addToWishlistValidator.validateAddToWishlistData.mockResolvedValue();

      // Act & Assert
      await expect(
        addToWishlistService.addToWishlist(mockBuyerId.toString(), mockProductId.toString())
      ).rejects.toThrow('Product already in wishlist');
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

      addToWishlistValidator.validateAddToWishlistData.mockResolvedValue();

      // Act
      const result = await addToWishlistService.addToWishlist(mockBuyerId.toString(), mockProductId.toString());

      // Assert
      expect(result.wishlist).toHaveLength(1);
      expect(result.wishlist[0].product.toString()).toBe(mockProductId.toString());

      // Verify product was added to buyer's wishlist
      const updatedBuyer = await Buyer.findById(mockBuyerId);
      expect(updatedBuyer.wishlist).toHaveLength(1);
    });

    it('should handle buyer with existing wishlist items', async () => {
      // Arrange
      const existingProductId = new mongoose.Types.ObjectId();
      
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        wishlist: [{
          product: existingProductId,
          addedAt: new Date()
        }]
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

      addToWishlistValidator.validateAddToWishlistData.mockResolvedValue();

      // Act
      const result = await addToWishlistService.addToWishlist(mockBuyerId.toString(), mockProductId.toString());

      // Assert
      expect(result.wishlist).toHaveLength(2);
      
      const productIds = result.wishlist.map(item => item.product.toString());
      expect(productIds).toContain(existingProductId.toString());
      expect(productIds).toContain(mockProductId.toString());

      // Verify both products are in buyer's wishlist
      const updatedBuyer = await Buyer.findById(mockBuyerId);
      expect(updatedBuyer.wishlist).toHaveLength(2);
    });

    it('should add product with correct addedAt timestamp', async () => {
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

      addToWishlistValidator.validateAddToWishlistData.mockResolvedValue();

      const beforeAdd = new Date();

      // Act
      const result = await addToWishlistService.addToWishlist(mockBuyerId.toString(), mockProductId.toString());

      const afterAdd = new Date();

      // Assert
      expect(result.wishlist[0]).toHaveProperty('addedAt');
      expect(result.wishlist[0].addedAt).toBeInstanceOf(Date);
      expect(result.wishlist[0].addedAt.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime());
      expect(result.wishlist[0].addedAt.getTime()).toBeLessThanOrEqual(afterAdd.getTime());
    });
  });
}); 