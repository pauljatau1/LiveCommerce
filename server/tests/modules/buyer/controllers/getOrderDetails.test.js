const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Import the Buyer model
const Buyer = require('@models/Buyer');
const Order = require('@models/Order');
const ValidationError = require('@utils/errors/ValidationError');

// Mock Firebase
jest.mock('@firebase', () => ({
  saveToken: jest.fn(),
  getToken: jest.fn(),
}));

let mongoServer;

describe('Buyer Controller - getOrderDetails', () => {
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
    await Order.deleteMany({});
  });

  describe('getOrderDetails', () => {
    let testBuyer;
    let testOrder;
    let authToken;

    beforeEach(async () => {
      // Create a test buyer
      testBuyer = new Buyer({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        username: 'testuser',
      phoneNumber: '+2348012345678',
        password: 'password123'
      });

      await testBuyer.save();

      // Create a test order
      testOrder = new Order({
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

      // Generate JWT token for authentication
      authToken = jwt.sign(
        { id: testBuyer._id, role: 'Buyer' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should retrieve order details successfully', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        params: { id: testOrder._id.toString() }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getOrderDetails(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: testOrder._id,
          buyer: testBuyer._id,
          totalAmount: 1000,
          status: 'delivered'
        }),
        'Order details retrieved successfully'
      );
    });

    it('should handle order not found', async () => {
      const nonExistentOrderId = new mongoose.Types.ObjectId().toString();
      
      const req = {
        user: { id: testBuyer._id.toString() },
        params: { id: nonExistentOrderId }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getOrderDetails(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Order not found');
    });

    it('should handle order not belonging to buyer', async () => {
      // Create another buyer
      const anotherBuyer = new Buyer({
        firstName: 'Another',
        lastName: 'User',
        email: 'another@example.com',
        username: 'anotheruser',
      phoneNumber: '+2348012345678',
        password: 'password123'
      });

      await anotherBuyer.save();

      const req = {
        user: { id: anotherBuyer._id.toString() },
        params: { id: testOrder._id.toString() }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getOrderDetails(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Order not found');
    });

    it('should handle service errors gracefully', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        params: { id: testOrder._id.toString() }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      // Mock the service to throw an error
      const getOrderDetailsService = require('@modules/buyer/services/getOrderDetails.service');
      const originalGetOrderDetails = getOrderDetailsService.getOrderDetails;
      
      getOrderDetailsService.getOrderDetails = jest.fn().mockRejectedValue(new Error('Service error'));

      await buyerController.getOrderDetails(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      // Restore the original method
      getOrderDetailsService.getOrderDetails = originalGetOrderDetails;
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
        phoneNumber: '08031234567',
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

      const req = {
        user: { id: testBuyer._id.toString() },
        params: { id: testOrder._id.toString() }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getOrderDetails(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              product: expect.objectContaining({
                name: 'Test Product'
              }),
              seller: expect.objectContaining({
                storeName: 'Test Store'
              })
            })
          ])
        }),
        'Order details retrieved successfully'
      );
    });

    it('should handle ValidationError from service', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        params: { id: '' }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getOrderDetails(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Validation failed');
      expect(error.status).toBe(422);
    });
  });
}); 