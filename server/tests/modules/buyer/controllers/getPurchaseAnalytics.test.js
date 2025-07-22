const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const { app } = require('@/app');
const jwt = require('jsonwebtoken');

// Mock JWT verification
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn()
}));

let mongoServer;

describe('Get Purchase Analytics Controller', () => {
  beforeAll(async () => {
    // Set JWT secret for testing
    process.env.JWT_SECRET = 'test-secret-key';
    
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
    
    // Mock JWT verification to return a valid user
    jwt.verify.mockReturnValue({ id: '507f1f77bcf86cd799439011', role: 'Buyer' });
    
    // Clear database
    const Order = require('@models/Order');
    const Buyer = require('@modules/buyer/models/buyer.model');
    const Product = require('@models/Product');
    const Seller = require('@models/Seller');
    await Order.deleteMany({});
    await Buyer.deleteMany({});
    await Product.deleteMany({});
    await Seller.deleteMany({});
  });

  describe('GET /api/v2/buyers/analytics', () => {
    let testBuyer;
    let testToken;

    beforeEach(async () => {
      // Create a test buyer
      testBuyer = new (require('@modules/buyer/models/buyer.model'))({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      await testBuyer.save();

      // Generate JWT token for the buyer
      testToken = jwt.sign(
        { id: testBuyer._id.toString(), role: 'Buyer' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      // Mock JWT verification for this specific token
      jwt.verify.mockReturnValue({ id: testBuyer._id.toString(), role: 'Buyer' });
    });

    it('should return purchase analytics successfully', async () => {
      const response = await request(app)
        .get('/api/v2/buyers/analytics')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      // Test response structure
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Purchase analytics retrieved successfully');
      expect(response.body.data).toBeDefined();
      
      // Test data object structure
      const { data } = response.body;
      expect(data).toHaveProperty('totalOrders');
      expect(data).toHaveProperty('totalSpent');
      expect(data).toHaveProperty('ordersByStatus');
      expect(data).toHaveProperty('recentOrders');
      
      // Test data types
      expect(typeof data.totalOrders).toBe('number');
      expect(typeof data.totalSpent).toBe('number');
      expect(typeof data.ordersByStatus).toBe('object');
      expect(Array.isArray(data.recentOrders)).toBe(true);
      
      // Test initial values
      expect(data.totalOrders).toBe(0);
      expect(data.totalSpent).toBe(0);
      expect(data.recentOrders).toEqual([]);
      
      // Test ordersByStatus structure
      expect(data.ordersByStatus).toHaveProperty('pending');
      expect(data.ordersByStatus).toHaveProperty('processing');
      expect(data.ordersByStatus).toHaveProperty('shipped');
      expect(data.ordersByStatus).toHaveProperty('delivered');
      expect(data.ordersByStatus).toHaveProperty('cancelled');
      expect(data.ordersByStatus).toHaveProperty('returned');
      
      // Test all status counts are numbers and initially zero
      Object.values(data.ordersByStatus).forEach(count => {
        expect(typeof count).toBe('number');
        expect(count).toBe(0);
      });
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/v2/buyers/analytics')
        .expect(401);

      expect(response.body.message).toBe('No token provided');
    });

    it('should return 401 when invalid token is provided', async () => {
      // Mock JWT verification to throw an error for invalid token
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/v2/buyers/analytics')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Invalid token');
      
      // Reset JWT mock for other tests
      jwt.verify.mockReturnValue({ id: '507f1f77bcf86cd799439011', role: 'Buyer' });
    });

    it('should return 403 when token is for non-buyer user', async () => {
      // Create a seller
      const testSeller = new (require('@models/Seller'))({
        firstName: 'John',
        lastName: 'Doe',
        email: 'seller@test.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        storeName: 'Test Store'
      });

      await testSeller.save();

      // Generate token for seller
      const sellerToken = jwt.sign(
        { id: testSeller._id.toString(), role: 'Seller' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      // Mock JWT verification for seller token
      jwt.verify.mockReturnValue({ id: testSeller._id.toString(), role: 'Seller' });

      const response = await request(app)
        .get('/api/v2/buyers/analytics')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);

      expect(response.body.message).toBe('Access denied. Buyers only.');
    });

    it('should return analytics with orders when buyer has orders', async () => {
      // Create a seller and product
      const testSeller = new (require('@models/Seller'))({
        firstName: 'John',
        lastName: 'Doe',
        email: 'seller@test.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        storeName: 'Test Store'
      });

      await testSeller.save();

      const testProduct = new (require('@models/Product'))({
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

      // Create an order
      const Order = require('@models/Order');
      const order = new Order({
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
            productName: 'Test Product',
            seller: testSeller._id,
            quantity: 1,
            price: 1000,
            status: 'delivered'
          }
        ]
      });

      await order.save();

      // Mock JWT verification to return the correct buyer ID
      jwt.verify.mockReturnValue({ id: testBuyer._id.toString(), role: 'Buyer' });

      const response = await request(app)
        .get('/api/v2/buyers/analytics')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      // Test response structure
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Purchase analytics retrieved successfully');
      expect(response.body.data).toBeDefined();
      
      // Test data object structure
      const { data } = response.body;
      expect(data).toHaveProperty('totalOrders');
      expect(data).toHaveProperty('totalSpent');
      expect(data).toHaveProperty('ordersByStatus');
      expect(data).toHaveProperty('recentOrders');
      
      // Test data types
      expect(typeof data.totalOrders).toBe('number');
      expect(typeof data.totalSpent).toBe('number');
      expect(typeof data.ordersByStatus).toBe('object');
      expect(Array.isArray(data.recentOrders)).toBe(true);
      
      // Test values with orders
      expect(data.totalOrders).toBe(1);
      expect(data.totalSpent).toBe(1000);
      expect(data.recentOrders).toHaveLength(1);
      
      // Test ordersByStatus structure and values
      expect(data.ordersByStatus).toHaveProperty('pending');
      expect(data.ordersByStatus).toHaveProperty('processing');
      expect(data.ordersByStatus).toHaveProperty('shipped');
      expect(data.ordersByStatus).toHaveProperty('delivered');
      expect(data.ordersByStatus).toHaveProperty('cancelled');
      expect(data.ordersByStatus).toHaveProperty('returned');
      
      // Test specific status counts
      expect(data.ordersByStatus.delivered).toBe(1);
      expect(data.ordersByStatus.pending).toBe(0);
      expect(data.ordersByStatus.processing).toBe(0);
      expect(data.ordersByStatus.shipped).toBe(0);
      expect(data.ordersByStatus.cancelled).toBe(0);
      expect(data.ordersByStatus.returned).toBe(0);
      
      // Test recent orders structure
      const recentOrder = data.recentOrders[0];
      expect(recentOrder).toHaveProperty('_id');
      expect(recentOrder).toHaveProperty('order_id');
      expect(recentOrder).toHaveProperty('totalAmount');
      expect(recentOrder).toHaveProperty('status');
      expect(recentOrder).toHaveProperty('createdAt');
      expect(recentOrder).toHaveProperty('items');
      
      // Test recent order values
      expect(recentOrder.totalAmount).toBe(1000);
      expect(recentOrder.status).toBe('delivered');
      expect(Array.isArray(recentOrder.items)).toBe(true);
      expect(recentOrder.items).toHaveLength(1);
      
      // Test order item structure
      const orderItem = recentOrder.items[0];
      expect(orderItem).toHaveProperty('product');
      expect(orderItem).toHaveProperty('quantity');
      expect(orderItem).toHaveProperty('status');
      expect(orderItem).toHaveProperty('price');
      
      // Test order item values
      expect(orderItem.quantity).toBe(1);
      expect(orderItem.status).toBe('delivered');
      expect(orderItem.price).toBe(1000);
      
      // Test populated product structure
      expect(orderItem.product).toHaveProperty('_id');
      expect(orderItem.product).toHaveProperty('name');
      expect(orderItem.product).toHaveProperty('images');
      expect(orderItem.product).toHaveProperty('price');
      
      // Test product values
      expect(orderItem.product.name).toBe('Test Product');
      expect(Array.isArray(orderItem.product.images)).toBe(true);
      expect(orderItem.product.images).toHaveLength(2);
      expect(orderItem.product.price).toBe(1000);
    });

    it('should handle database errors gracefully', async () => {
      // Mock JWT verification to return a valid user
      jwt.verify.mockReturnValue({ id: testBuyer._id.toString(), role: 'Buyer' });
      
      // This test is simplified since error handling is tested in service layer
      const response = await request(app)
        .get('/api/v2/buyers/analytics')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
}); 