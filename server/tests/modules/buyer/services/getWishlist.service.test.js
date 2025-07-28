const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the service
const getWishlistService = require('@modules/buyer/services/getWishlist.service');

// Import the Buyer and Product models
const Buyer = require('@modules/buyer/models/buyer.model');
const Product = require('@models/Product');
const Seller = require('@models/Seller');

// Mock the validator
jest.mock('@modules/buyer/validators/getWishlist.validator', () => ({
  validateGetWishlistData: jest.fn()
}));

// Import the mocked modules
const getWishlistValidator = require('@modules/buyer/validators/getWishlist.validator');

let mongoServer;

describe('Get Wishlist Service', () => {
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

  describe('getWishlist', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();
    const mockProductId = new mongoose.Types.ObjectId();
    const mockSellerId = new mongoose.Types.ObjectId();

    it('should successfully get buyer wishlist with populated data', async () => {
      // Arrange
      const seller = new Seller({
        _id: mockSellerId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'hashedpassword',
        phoneNumber: '+2348012345679',
        storeName: 'Jane\'s Store',
        businessName: 'Jane\'s Business'
      });

      const product = new Product({
        _id: mockProductId,
        name: 'Test Product',
        description: 'A test product',
        price: 100,
        category: 'Electronics',
        brand: 'Test Brand',
        stock: 10,
        seller: mockSellerId
      });

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

      await seller.save();
      await product.save();
      await buyer.save();

      getWishlistValidator.validateGetWishlistData.mockResolvedValue();

      // Act
      const result = await getWishlistService.getWishlist(mockBuyerId.toString());

      // Assert
      expect(getWishlistValidator.validateGetWishlistData).toHaveBeenCalledWith(
        mockBuyerId.toString()
      );

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('product');
      expect(result[0]).toHaveProperty('addedAt');
      expect(result[0].product._id.toString()).toBe(mockProductId.toString());
      expect(result[0].product.name).toBe('Test Product');
      expect(result[0].product.seller._id.toString()).toBe(mockSellerId.toString());
      expect(result[0].product.seller.storeName).toBe('Jane\'s Store');
    });

    it('should return empty array for buyer with no wishlist items', async () => {
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

      getWishlistValidator.validateGetWishlistData.mockResolvedValue();

      // Act
      const result = await getWishlistService.getWishlist(mockBuyerId.toString());

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });

    it('should handle buyer with multiple wishlist items', async () => {
      // Arrange
      const seller1 = new Seller({
        _id: mockSellerId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'hashedpassword',
        phoneNumber: '+2348012345679',
        storeName: 'Jane\'s Store',
        businessName: 'Jane\'s Business'
      });

      const product1 = new Product({
        _id: mockProductId,
        name: 'Test Product 1',
        description: 'A test product',
        price: 100,
        category: 'Electronics',
        brand: 'Test Brand',
        stock: 10,
        seller: mockSellerId
      });

      const product2 = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Product 2',
        description: 'Another test product',
        price: 200,
        category: 'Clothing',
        brand: 'Another Brand',
        stock: 5,
        seller: mockSellerId
      });

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
            product: product2._id,
            addedAt: new Date()
          }
        ]
      });

      await seller1.save();
      await product1.save();
      await product2.save();
      await buyer.save();

      getWishlistValidator.validateGetWishlistData.mockResolvedValue();

      // Act
      const result = await getWishlistService.getWishlist(mockBuyerId.toString());

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0].product.name).toBe('Test Product 1');
      expect(result[1].product.name).toBe('Test Product 2');
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

      getWishlistValidator.validateGetWishlistData.mockResolvedValue();

      // Act
      const result = await getWishlistService.getWishlist(mockBuyerId.toString());

      // Assert
      expect(result).toBeNull();
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

      getWishlistValidator.validateGetWishlistData.mockResolvedValue();

      // Act
      const result = await getWishlistService.getWishlist(mockBuyerId.toString());

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });

    it('should include all required product fields in populated data', async () => {
      // Arrange
      const seller = new Seller({
        _id: mockSellerId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'hashedpassword',
        phoneNumber: '+2348012345679',
        storeName: 'Jane\'s Store',
        businessName: 'Jane\'s Business'
      });

      const product = new Product({
        _id: mockProductId,
        name: 'Test Product',
        description: 'A test product',
        price: 100,
        images: [],
        category: 'Electronics',
        brand: 'Test Brand',
        stock: 10,
        seller: mockSellerId
      });

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

      await seller.save();
      await product.save();
      await buyer.save();

      getWishlistValidator.validateGetWishlistData.mockResolvedValue();

      // Act
      const result = await getWishlistService.getWishlist(mockBuyerId.toString());

      // Assert
      expect(result[0].product).toHaveProperty('name');
      expect(result[0].product).toHaveProperty('description');
      expect(result[0].product).toHaveProperty('price');
      expect(result[0].product).toHaveProperty('images');
      expect(result[0].product).toHaveProperty('category');
      expect(result[0].product).toHaveProperty('brand');
      expect(result[0].product).toHaveProperty('stock');
      expect(result[0].product).toHaveProperty('seller');
      expect(result[0].product.seller).toHaveProperty('storeName');
      expect(result[0].product.seller).toHaveProperty('businessName');
    });
  });
}); 