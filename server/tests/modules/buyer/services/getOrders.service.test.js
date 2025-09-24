const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the service
const getOrdersService = require('@modules/buyer/services/getOrders.service');

// Import the Buyer model
const Buyer = require('@models/Buyer');
const Order = require('@models/Order');
const Return = require('@models/Return');
const Product = require('@models/Product');
const Seller = require('@models/Seller');

// Import the repository
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');

let mongoServer;

describe('Get Orders Service', () => {
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
    // Clear database
    await Buyer.deleteMany({});
    await Order.deleteMany({});
    await Return.deleteMany({});
    await Product.deleteMany({});
    await Seller.deleteMany({});
  });

  describe('getOrders', () => {
    let testBuyer;
    let testOrder;

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
    });

    it('should retrieve orders successfully with default parameters', async () => {
      const result = await getOrdersService.getOrders(testBuyer._id.toString());

      expect(result).toEqual({
        data: expect.any(Array),
        pagination: {}
      });
    });

    it('should handle tracking status filter', async () => {
      const filters = { trackingStatus: 'delivered' };

      const result = await getOrdersService.getOrders(testBuyer._id.toString(), filters);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].order_id).toBe(testOrder.order_id);
    });

    it('should handle search filter', async () => {
      const filters = { search: testOrder.order_id };

      const result = await getOrdersService.getOrders(testBuyer._id.toString(), filters);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].order_id).toBe(testOrder.order_id);
    });

    it('should handle pagination parameters', async () => {
      const filters = {};
      const pagination = { page: 1, limit: 5, filters };

      const result = await getOrdersService.getPaginatedOrders(testBuyer._id.toString(), pagination);

      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should handle hasReturn filter with no returns', async () => {
      const filters = { hasReturn: 'false' };

      const result = await getOrdersService.getOrders(testBuyer._id.toString(), filters);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].returnRequestId).toBeUndefined();
    });

    it('should handle hasReturn filter with returns', async () => {
      // Create a return request for the order
      const returnRequest = new Return({
        order: testOrder._id,
        buyer: testBuyer._id,
        seller: new mongoose.Types.ObjectId(),
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Defective product'
          }
        ],
        status: 'PENDING_SELLER_REVIEW',
        description: 'Product is defective',
        preferredResolution: 'refund'
      });

      await returnRequest.save();

      const filters = { hasReturn: 'true' };

      const result = await getOrdersService.getOrders(testBuyer._id.toString(), filters);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].returnRequestId).toBeDefined();
    });

    it('should handle refunded status filter', async () => {
      // Create a return request with refunded status
      const returnRequest = new Return({
        order: testOrder._id,
        buyer: testBuyer._id,
        seller: new mongoose.Types.ObjectId(),
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Defective product'
          }
        ],
        status: 'REFUNDED',
        description: 'Product is defective',
        preferredResolution: 'refund'
      });

      await returnRequest.save();

      const filters = { trackingStatus: 'REFUNDED' };
   
      const result = await getOrdersService.getOrders(testBuyer._id.toString(), filters);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].returnStatus).toBe('REFUNDED');
    });

    it('should handle empty filters and pagination', async () => {
      const result = await getOrdersService.getOrders(testBuyer._id.toString(), {}, {});

      expect(result).toEqual({
        data: expect.any(Array),
        pagination: {}
      });
    });

    it('should handle buyer with no orders', async () => {
      // Create a buyer with no orders
      const emptyBuyer = new Buyer({
        firstName: 'Empty',
        lastName: 'User',
        email: 'empty@example.com',
        username: 'emptyuser',
      phoneNumber: '+2348012345678',
        password: 'password123'
      });

      await emptyBuyer.save();

      const result = await getOrdersService.getOrders(emptyBuyer._id.toString(), {});

      expect(result.data).toHaveLength(0);
      expect(result.pagination).toEqual({});
    });

    it('should handle complex filtering scenarios', async () => {
      // Create multiple orders with different statuses
      const order1 = new Order({
        buyer: testBuyer._id,
        seller: new mongoose.Types.ObjectId(),
        buyerDetails: { _id: testBuyer._id },
        order_id: 'OR11111',
        totalAmount: 500,
        status: 'processing',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            productName: 'Product 1',
            seller: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 500
          }
        ],
        shipping: {
          tracking: {
            status: 'pending'
          }
        }
      });

      const order2 = new Order({
        buyer: testBuyer._id,
        seller: new mongoose.Types.ObjectId(),
        buyerDetails: { _id: testBuyer._id },
        order_id: 'OR22222',
        totalAmount: 1500,
        status: 'delivered',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            productName: 'Product 2',
            seller: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 1500
          }
        ],
        shipping: {
          tracking: {
            status: 'delivered'
          }
        }
      });

      await order1.save();
      await order2.save();

      // Test search filter
      const searchResult = await getOrdersService.getOrders(testBuyer._id.toString(), { search: 'Product 1' });
      expect(searchResult.data).toHaveLength(1);
      expect(searchResult.data[0].order_id).toBe(order1.order_id);

      // Test status filter
      const statusResult = await getOrdersService.getOrders(testBuyer._id.toString(), { trackingStatus: 'delivered' });
      expect(statusResult.data).toHaveLength(2); // Including the original test order
    });
  });

  describe('getPaginatedOrders', () => {
    let testBuyer;
    let testOrder;

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
    });

    it('should retrieve paginated orders successfully', async () => {
      const params = {
        page: 1,
        limit: 10,
        filters: {}
      };

      const result = await getOrdersService.getPaginatedOrders(testBuyer._id.toString(), params);

      expect(result).toEqual({
        data: expect.any(Array),
        pagination: expect.objectContaining({
          currentPage: 1,
          totalPages: expect.any(Number),
          totalOrders: expect.any(Number),
          hasMore: expect.any(Boolean),
          hasPrevious: expect.any(Boolean)
        })
      });
    });

    it('should handle pagination with multiple pages', async () => {
      // Create multiple orders to test pagination
      for (let i = 1; i <= 15; i++) {
        const order = new Order({
          buyer: testBuyer._id,
          seller: new mongoose.Types.ObjectId(),
          buyerDetails: { _id: testBuyer._id },
          order_id: `OR${i.toString().padStart(5, '0')}`,
          totalAmount: 1000,
          status: 'delivered',
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              productName: `Product ${i}`,
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
        await order.save();
      }

      const params = {
        page: 2,
        limit: 10,
        filters: {}
      };

      const result = await getOrdersService.getPaginatedOrders(testBuyer._id.toString(), params);

      expect(result.data).toHaveLength(6); // 16 total orders, 10 on page 1, 6 on page 2
      expect(result.pagination.currentPage).toBe(2);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.hasPrevious).toBe(true);
    });

    it('should handle filters with pagination', async () => {
      const params = {
        page: 1,
        limit: 10,
        filters: { trackingStatus: 'delivered' }
      };

      const result = await getOrdersService.getPaginatedOrders(testBuyer._id.toString(), params);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].order_id).toBe(testOrder.order_id);
    });
  });

  describe('getPaginationOptions', () => {
    it('should extract pagination options from request', () => {
      const req = {
        query: {
          page: '2',
          limit: '15'
        }
      };

      const result = getOrdersService.getPaginationOptions(req);

      expect(result).toEqual({
        enabled: true,
        page: 2,
        limit: 15
      });
    });

    it('should return disabled pagination when page and limit are missing', () => {
      const req = {
        query: {}
      };

      const result = getOrdersService.getPaginationOptions(req);

      expect(result).toEqual({
        enabled: false,
        page: 1,
        limit: 10
      });
    });
  });

  describe('getFilters', () => {
    it('should extract filters from request', () => {
      const req = {
        query: {
          trackingStatus: 'delivered',
          hasReturn: 'true',
          search: 'OR12345'
        }
      };

      const result = getOrdersService.getFilters(req);

      expect(result).toEqual({
        trackingStatus: 'delivered',
        hasReturn: 'true',
        search: 'OR12345'
      });
    });

    it('should return empty filters when no query parameters', () => {
      const req = {
        query: {}
      };

      const result = getOrdersService.getFilters(req);

      expect(result).toEqual({});
    });
  });
}); 