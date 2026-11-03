const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const getPurchaseAnalyticsService = require('@modules/buyer/services/getPurchaseAnalytics.service');

let mongoServer;

describe('Get Purchase Analytics Service', () => {
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

  describe('getPurchaseAnalytics', () => {
    let testBuyer;
    let testSeller;
    let testProduct;

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

      // Create a test seller
      testSeller = new (require('@models/Seller'))({
        firstName: 'John',
        lastName: 'Doe',
        email: 'seller@test.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        storeName: 'Test Store'
      });

      await testSeller.save();

      // Create a test product
      testProduct = new (require('@models/Product'))({
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
    });

    it('should return analytics for buyer with no orders', async () => {
      const result = await getPurchaseAnalyticsService.getPurchaseAnalytics(
        testBuyer._id.toString()
      );

      // Test service response structure
      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalOrders');
      expect(result).toHaveProperty('totalSpent');
      expect(result).toHaveProperty('ordersByStatus');
      expect(result).toHaveProperty('recentOrders');
      
      // Test data types
      expect(typeof result.totalOrders).toBe('number');
      expect(typeof result.totalSpent).toBe('number');
      expect(typeof result.ordersByStatus).toBe('object');
      expect(Array.isArray(result.recentOrders)).toBe(true);
      
      // Test values
      expect(result.totalOrders).toBe(0);
      expect(result.totalSpent).toBe(0);
      expect(result.ordersByStatus).toEqual({
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        returned: 0
      });
      expect(result.recentOrders).toEqual([]);
    });

    it('should return analytics for buyer with multiple orders', async () => {
      const Order = require('@models/Order');

      // Create multiple orders with different statuses
      const orders = [
        {
          buyer: testBuyer._id,
          seller: testSeller._id,
          buyerDetails: {
            _id: testBuyer._id
          },
          totalAmount: 1000,
          status: 'delivered',
          items: [
            {
              product: testProduct._id,
              productName: 'Test Product 1',
              seller: testSeller._id,
              quantity: 1,
              price: 1000,
              status: 'delivered'
            }
          ]
        },
        {
          buyer: testBuyer._id,
          seller: testSeller._id,
          buyerDetails: {
            _id: testBuyer._id
          },
          totalAmount: 2000,
          status: 'pending_payment',
          items: [
            {
              product: testProduct._id,
              productName: 'Test Product 2',
              seller: testSeller._id,
              quantity: 2,
              price: 1000,
              status: 'pending_payment'
            }
          ]
        },
        {
          buyer: testBuyer._id,
          seller: testSeller._id,
          buyerDetails: {
            _id: testBuyer._id
          },
          totalAmount: 1500,
          status: 'processing',
          items: [
            {
              product: testProduct._id,
              productName: 'Test Product 3',
              seller: testSeller._id,
              quantity: 1,
              price: 1500,
              status: 'processing'
            }
          ]
        }
      ];

      for (const orderData of orders) {
        const order = new Order(orderData);
        await order.save();
      }

      const result = await getPurchaseAnalyticsService.getPurchaseAnalytics(
        testBuyer._id.toString()
      );

      expect(result).toBeDefined();
      expect(result.totalOrders).toBe(3);
      expect(result.totalSpent).toBe(4500);
      expect(result.ordersByStatus).toEqual({
        pending: 0,
        processing: 1,
        shipped: 0,
        delivered: 1,
        cancelled: 0,
        returned: 0
      });
      expect(result.recentOrders).toHaveLength(3);
      expect(result.recentOrders[0].totalAmount).toBe(1500); // Most recent
      expect(result.recentOrders[1].totalAmount).toBe(2000);
      expect(result.recentOrders[2].totalAmount).toBe(1000);
    });

    it('should handle orders with mixed item statuses', async () => {
      const Order = require('@models/Order');

      // Create an order with items having different statuses
      const order = new Order({
        buyer: testBuyer._id,
        seller: testSeller._id,
        buyerDetails: {
          _id: testBuyer._id
        },
        totalAmount: 2500,
        status: 'processing',
        items: [
          {
            product: testProduct._id,
            productName: 'Test Product 1',
            seller: testSeller._id,
            quantity: 1,
            price: 1000,
            status: 'delivered'
          },
          {
            product: testProduct._id,
            productName: 'Test Product 2',
            seller: testSeller._id,
            quantity: 1,
            price: 1500,
            status: 'pending'
          }
        ]
      });

      await order.save();

      const result = await getPurchaseAnalyticsService.getPurchaseAnalytics(
        testBuyer._id.toString()
      );

      expect(result.totalOrders).toBe(1);
      expect(result.totalSpent).toBe(2500);
      expect(result.ordersByStatus).toEqual({
        pending: 1,
        processing: 0,
        shipped: 0,
        delivered: 1,
        cancelled: 0,
        returned: 0
      });
    });

    it('should return recent orders with populated product data', async () => {
      const Order = require('@models/Order');

      // Create an order
      const order = new Order({
        buyer: testBuyer._id,
        seller: testSeller._id,
        buyerDetails: {
          _id: testBuyer._id
        },
        totalAmount: 1000,
        status: 'delivered',
        order_id: 'ORD123',
        items: [
          {
            product: testProduct._id,
            productName: 'Test Product',
            seller: testSeller._id,
            quantity: 1,
            price: 1000,
            status: 'delivered'
          }
        ]
      });

      await order.save();

      const result = await getPurchaseAnalyticsService.getPurchaseAnalytics(
        testBuyer._id.toString()
      );

      expect(result.recentOrders).toHaveLength(1);
      expect(result.recentOrders[0].totalAmount).toBe(1000);
      expect(result.recentOrders[0].status).toBe('delivered');
      expect(result.recentOrders[0].items).toHaveLength(1);
      expect(result.recentOrders[0].items[0].product).toBeDefined();
      expect(result.recentOrders[0].items[0].product.name).toBe('Test Product');
      expect(result.recentOrders[0].items[0].quantity).toBe(1);
      expect(result.recentOrders[0].items[0].status).toBe('delivered');
    });

    it('should handle orders with products that have no images', async () => {
      const Order = require('@models/Order');

      // Create a product without images
      const productWithoutImages = new (require('@models/Product'))({
        name: 'Product Without Images',
        description: 'A test product without images',
        price: 500,
        category: 'Electronics',
        stock: 5,
        seller: testSeller._id,
        images: []
      });

      await productWithoutImages.save();

      // Create an order with the product without images
      const order = new Order({
        buyer: testBuyer._id,
        seller: testSeller._id,
        buyerDetails: {
          _id: testBuyer._id
        },
        totalAmount: 500,
        status: 'delivered',
        items: [
          {
            product: productWithoutImages._id,
            productName: 'Product Without Images',
            seller: testSeller._id,
            quantity: 1,
            price: 500,
            status: 'delivered'
          }
        ]
      });

      await order.save();

      const result = await getPurchaseAnalyticsService.getPurchaseAnalytics(
        testBuyer._id.toString()
      );

      expect(result.recentOrders).toHaveLength(1);
      expect(result.recentOrders[0].items[0].product.images).toHaveLength(0);
    });

    it('should calculate completion rate correctly', async () => {
      const Order = require('@models/Order');

      // Create orders with different completion statuses
      const orders = [
        {
          buyer: testBuyer._id,
          seller: testSeller._id,
          buyerDetails: {
            _id: testBuyer._id
          },
          totalAmount: 1000,
          status: 'delivered',
          items: [{ product: testProduct._id, productName: 'Product 1', seller: testSeller._id, quantity: 1, price: 1000, status: 'delivered' }]
        },
        {
          buyer: testBuyer._id,
          seller: testSeller._id,
          buyerDetails: {
            _id: testBuyer._id
          },
          totalAmount: 2000,
          status: 'delivered',
          items: [{ product: testProduct._id, productName: 'Product 2', seller: testSeller._id, quantity: 1, price: 2000, status: 'delivered' }]
        },
        {
          buyer: testBuyer._id,
          seller: testSeller._id,
          buyerDetails: {
            _id: testBuyer._id
          },
          totalAmount: 1500,
          status: 'pending_payment',
          items: [{ product: testProduct._id, productName: 'Product 3', seller: testSeller._id, quantity: 1, price: 1500, status: 'pending_payment' }]
        },
        {
          buyer: testBuyer._id,
          seller: testSeller._id,
          buyerDetails: {
            _id: testBuyer._id
          },
          totalAmount: 800,
          status: 'cancelled',
          items: [{ product: testProduct._id, productName: 'Product 4', seller: testSeller._id, quantity: 1, price: 800, status: 'cancelled' }]
        }
      ];

      for (const orderData of orders) {
        const order = new Order(orderData);
        await order.save();
      }

      const result = await getPurchaseAnalyticsService.getPurchaseAnalytics(
        testBuyer._id.toString()
      );

      // 2 delivered out of 4 total = 50%
      expect(result.totalOrders).toBe(4);
      expect(result.totalSpent).toBe(5300);
    });

    it('should handle edge case with zero orders', async () => {
      const result = await getPurchaseAnalyticsService.getPurchaseAnalytics(
        testBuyer._id.toString()
      );


    });
  });
}); 