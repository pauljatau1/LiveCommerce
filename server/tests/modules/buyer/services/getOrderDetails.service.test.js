const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const getOrderDetailsService = require('@modules/buyer/services/getOrderDetails.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');

// Mock Firebase
jest.mock('@firebase', () => ({
  saveToken: jest.fn(),
  getToken: jest.fn(),
}));

let mongoServer;

describe('Get Order Details Service', () => {
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
    const Order = require('@models/Order');
    const Buyer = require('@models/Buyer');
    const Product = require('@models/Product');
    const Seller = require('@models/Seller');
    await Order.deleteMany({});
    await Buyer.deleteMany({});
    await Product.deleteMany({});
    await Seller.deleteMany({});
  });

  describe('getOrderDetails', () => {
    let testBuyer;
    let testOrder;

    beforeEach(async () => {
      // Create a test buyer
      testBuyer = new (require('@models/Buyer'))({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      await testBuyer.save();

      // Create a test order
      testOrder = new (require('@models/Order'))({
        buyer: testBuyer._id,
        seller: new mongoose.Types.ObjectId(),
        buyerDetails: { _id: testBuyer._id },
        totalAmount: 1000,
        status: 'delivered',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            productName: 'Test Product',
            seller: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 1000
          }
        ],
        shipping: {
          tracking: {
            status: 'delivered'
          }
        }
      });

      await testOrder.save();
    });

    it('should retrieve order details successfully', async () => {
      const result = await getOrderDetailsService.getOrderDetails(
        testBuyer._id.toString(),
        testOrder._id.toString()
      );

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(testOrder._id.toString());
      expect(result.buyer.toString()).toBe(testBuyer._id.toString());
      expect(result.totalAmount).toBe(1000);
      expect(result.status).toBe('delivered');
    });

    it('should throw error when order not found', async () => {
      const nonExistentOrderId = new mongoose.Types.ObjectId().toString();

      await expect(
        getOrderDetailsService.getOrderDetails(
          testBuyer._id.toString(),
          nonExistentOrderId
        )
      ).rejects.toThrow('Order not found');
    });

    it('should throw error when order does not belong to buyer', async () => {
      // Create another buyer
      const anotherBuyer = new (require('@models/Buyer'))({
        firstName: 'Another',
        lastName: 'User',
        email: 'another@example.com',
        username: 'anotheruser',
        password: 'password123'
      });

      await anotherBuyer.save();

      await expect(
        getOrderDetailsService.getOrderDetails(
          anotherBuyer._id.toString(),
          testOrder._id.toString()
        )
      ).rejects.toThrow('Order not found');
    });

    it('should populate product and seller information', async () => {
      // Create a product and seller for the order
      const Product = require('@models/Product');
      const Seller = require('@models/Seller');

      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'seller@test.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        storeName: 'Test Store'
      });
      await testSeller.save();

      const testProduct = new Product({
        name: 'Test Product',
        description: 'A test product for testing',
        price: 1000,
        category: 'Electronics',
        stock: 10,
        seller: testSeller._id,
        images: [
          { url: 'image1.jpg' },
          { url: 'image2.jpg' }
        ]
      });
      await testProduct.save();

      // Update the order with the product and seller
      testOrder.items[0].product = testProduct._id;
      testOrder.items[0].seller = testSeller._id;
      await testOrder.save();

      const result = await getOrderDetailsService.getOrderDetails(
        testBuyer._id.toString(),
        testOrder._id.toString()
      );

      expect(result.items[0].product).toBeDefined();
      expect(result.items[0].product.name).toBe('Test Product');
      expect(result.items[0].seller).toBeDefined();
      expect(result.items[0].seller.storeName).toBe('Test Store');
    });

    it('should handle invalid ObjectId format', async () => {
      await expect(
        buyerRepository.findOrderByIdAndBuyer(
          'invalid-id',
          testBuyer._id.toString()
        )
      ).rejects.toThrow('Cast to ObjectId failed');
    });

    it('should throw CastError for invalid ObjectId format in service', async () => {
      await expect(
        getOrderDetailsService.getOrderDetails(
          testBuyer._id.toString(),
          'invalid-id'
        )
      ).rejects.toThrow();
    });

    it('should throw CastError for non-numeric string as ObjectId', async () => {
      await expect(
        getOrderDetailsService.getOrderDetails(
          testBuyer._id.toString(),
          '12'
        )
      ).rejects.toThrow();
    });

    it('should throw CastError for short string as ObjectId', async () => {
      await expect(
        getOrderDetailsService.getOrderDetails(
          testBuyer._id.toString(),
          'abc123'
        )
      ).rejects.toThrow();
    });

    it('should throw ValidationError for empty order ID', async () => {
      await expect(
        getOrderDetailsService.getOrderDetails(
          testBuyer._id.toString(),
          ''
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw ValidationError for whitespace-only order ID', async () => {
      await expect(
        getOrderDetailsService.getOrderDetails(
          testBuyer._id.toString(),
          '   '
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw ValidationError for invalid ObjectId format', async () => {
      await expect(
        getOrderDetailsService.getOrderDetails(
          testBuyer._id.toString(),
          '12'
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw ValidationError for short invalid ObjectId', async () => {
      await expect(
        getOrderDetailsService.getOrderDetails(
          testBuyer._id.toString(),
          'abc123'
        )
      ).rejects.toThrow('Validation failed');
    });
  });
}); 