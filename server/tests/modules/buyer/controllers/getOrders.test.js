const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Import the Buyer model
const Buyer = require('@models/Buyer');
const Order = require('@models/Order');
const Return = require('@models/Return');

// Mock Firebase
jest.mock('@firebase', () => ({
  saveToken: jest.fn(),
  getToken: jest.fn(),
}));

let mongoServer;

describe('Buyer Controller - getOrders', () => {
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
    await Return.deleteMany({});
  });

  describe('getOrders', () => {
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

    it('should retrieve orders successfully with default pagination', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {}
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getOrders(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'Orders retrieved successfully'
      );
    });

    it('should handle tracking status filter', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          trackingStatus: 'delivered'
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getOrders(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'Orders retrieved successfully'
      );
    });

    it('should handle search filter', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          search: testOrder.order_id
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getOrders(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'Orders retrieved successfully'
      );
    });

    it('should handle pagination parameters', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          page: '2',
          limit: '5',
          sort: '-createdAt'
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getOrders(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.objectContaining({
            currentPage: 2,
            totalPages: expect.any(Number),
            totalOrders: expect.any(Number),
            hasMore: expect.any(Boolean),
            hasPrevious: expect.any(Boolean)
          })
        }),
        'Orders retrieved successfully'
      );
    });

    it('should handle unpaginated request when page and limit are missing', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          trackingStatus: 'delivered'
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getOrders(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'Orders retrieved successfully'
      );
    });

    it('should handle paginated request when both page and limit are provided', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          page: '1',
          limit: '10',
          trackingStatus: 'delivered'
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getOrders(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.objectContaining({
            currentPage: 1,
            totalPages: expect.any(Number),
            totalOrders: expect.any(Number),
            hasMore: expect.any(Boolean),
            hasPrevious: expect.any(Boolean)
          })
        }),
        'Orders retrieved successfully'
      );
    });

    it('should handle hasReturn filter', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          hasReturn: 'false'
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getOrders(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'Orders retrieved successfully'
      );
    });

    it('should handle service errors gracefully', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {}
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      // Mock the service to throw an error
      const getOrdersService = require('@modules/buyer/services/getOrders.service');
      const originalGetPaginatedOrders = getOrdersService.getPaginatedOrders;
      const originalGetOrders = getOrdersService.getOrders;
      
      getOrdersService.getPaginatedOrders = jest.fn().mockRejectedValue(new Error('Service error'));
      getOrdersService.getOrders = jest.fn().mockRejectedValue(new Error('Service error'));

      await buyerController.getOrders(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      // Restore the original methods
      getOrdersService.getPaginatedOrders = originalGetPaginatedOrders;
      getOrdersService.getOrders = originalGetOrders;
    });

    it('should handle empty query parameters', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          trackingStatus: '',
          hasReturn: '',
          search: '',
          page: '',
          limit: '',
          sort: ''
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getOrders(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'Orders retrieved successfully'
      );
    });
  });
}); 