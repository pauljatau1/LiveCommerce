const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import the app without starting the server
const { app } = require('@/app');

// Mock the getShippingLabel service
jest.mock('@modules/seller/services/getShippingLabel.service', () => ({
  getShippingLabel: jest.fn()
}));

// Import the mocked service
const getShippingLabelService = require('@modules/seller/services/getShippingLabel.service');
const Order = require('@models/Order');
const Buyer = require('@models/Buyer');
const Product = require('@models/Product');
const Seller = require('@models/Seller');

describe('Get Shipping Label Controller', () => {
  let mongoServer;
  let testOrder;
  let testBuyer;
  let testProduct;
  let testSeller;
  let authToken;

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
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up test data
    await Order.deleteMany({});
    await Buyer.deleteMany({});
    await Product.deleteMany({});
    await Seller.deleteMany({});
    jest.clearAllMocks();

    // Create test seller
    testSeller = new Seller({
      firstName: 'John',
      lastName: 'Seller',
      email: 'seller@test.com',
      password: 'hashedPassword',
      phoneNumber: '+2348012345678',
      storeName: 'Test Store'
    });
    await testSeller.save();

    // Create test buyer
    testBuyer = new Buyer({
      firstName: 'Jane',
      lastName: 'Buyer',
      email: 'buyer@test.com',
      password: 'hashedPassword',
      username: 'jane_buyer'
    });
    await testBuyer.save();

    // Create test product
    testProduct = new Product({
      name: 'Test Product',
      description: 'Test product description',
      price: 25.99,
      weight: 1.5,
      dimensions: '10x15x5cm',
      category: 'Electronics',
      stock: 10,
      seller: testSeller._id
    });
    await testProduct.save();

    // Create test order
    testOrder = new Order({
      buyer: testBuyer._id,
      seller: testSeller._id,
      buyerDetails: {
        _id: testBuyer._id,
        firstName: testBuyer.firstName,
        lastName: testBuyer.lastName,
        email: testBuyer.email
      },
      items: [{
        product: testProduct._id,
        seller: testSeller._id,
        quantity: 2,
        price: 25.99
      }],
      totalAmount: 51.98
    });
    await testOrder.save();

    // Generate JWT token for authentication
    authToken = jwt.sign(
      { id: testSeller._id, role: 'Seller' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('GET /orders/:orderId/items/:itemId/shipping-label', () => {
    it('should generate shipping label successfully with valid parameters', async () => {
      // Mock service response
      const mockShippingLabel = {
        orderId: testOrder._id.toString(),
        trackingNumber: 'TN1234567890',
        labelUrl: 'https://shipping-label-url.com'
      };

      getShippingLabelService.getShippingLabel.mockResolvedValue(mockShippingLabel);

      // Make request
      const response = await request(app)
        .get(`/api/v2/sellers/orders/${testOrder._id}/shipping-label?itemId=${testOrder.items[0]._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Shipping label generated successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(mockShippingLabel);

      // Verify service was called with correct parameters
      expect(getShippingLabelService.getShippingLabel).toHaveBeenCalledWith({
        orderId: testOrder._id.toString(),
        itemId: testOrder.items[0]._id.toString(),
        sellerId: testSeller._id.toString()
      });
    });

    it('should return 400 when service throws ValidationError', async () => {
      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError(['Order ID is required']);
      
      getShippingLabelService.getShippingLabel.mockRejectedValue(validationError);

      // Make request
      const response = await request(app)
        .get(`/api/v2/sellers/orders/${testOrder._id}/shipping-label?itemId=${testOrder.items[0]._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(422);

      // Verify error response
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body).toHaveProperty('errors', ['Order ID is required']);
    });

    it('should return 404 when service throws "Order not found" error', async () => {
      const NotFoundException = require('@utils/errors/NotFoundException');
      getShippingLabelService.getShippingLabel.mockRejectedValue(new NotFoundException('Order not found'));

      // Make request
      const response = await request(app)
        .get(`/api/v2/sellers/orders/${testOrder._id}/shipping-label?itemId=${testOrder.items[0]._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Verify error response
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Order not found');
    });

    it('should return 403 when service throws "Unauthorized to access this order item" error', async () => {
      const ForbiddenException = require('@utils/errors/ForbiddenException');
      getShippingLabelService.getShippingLabel.mockRejectedValue(new ForbiddenException('Unauthorized to access this order item'));

      // Make request
      const response = await request(app)
        .get(`/api/v2/sellers/orders/${testOrder._id}/shipping-label?itemId=${testOrder.items[0]._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      // Verify error response
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Unauthorized to access this order item');
    });

    it('should return 500 when service throws unexpected error', async () => {
      getShippingLabelService.getShippingLabel.mockRejectedValue(new Error('Unexpected error'));

      // Make request
      const response = await request(app)
        .get(`/api/v2/sellers/orders/${testOrder._id}/shipping-label?itemId=${testOrder.items[0]._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      // Verify error response
      expect(response.body).toHaveProperty('error', 'Something went wrong!');
    });

    it('should handle invalid ObjectId format in URL parameters', async () => {
      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError(['Order ID must be a valid ObjectId']);
      
      getShippingLabelService.getShippingLabel.mockRejectedValue(validationError);

      // Make request with invalid ObjectId
      const response = await request(app)
        .get('/api/v2/sellers/orders/invalid-id/shipping-label?itemId=invalid-item-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(422);

      // Verify error response
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body).toHaveProperty('errors', ['Order ID must be a valid ObjectId']);
    });

    it('should extract seller ID from authenticated user', async () => {
      // Mock service response
      const mockShippingLabel = {
        orderId: testOrder._id.toString(),
        trackingNumber: 'TN1234567890',
        labelUrl: 'https://shipping-label-url.com'
      };

      getShippingLabelService.getShippingLabel.mockResolvedValue(mockShippingLabel);

      // Make request
      await request(app)
        .get(`/api/v2/sellers/orders/${testOrder._id}/shipping-label?itemId=${testOrder.items[0]._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify service was called with seller ID from authenticated user
      expect(getShippingLabelService.getShippingLabel).toHaveBeenCalledWith({
        orderId: testOrder._id.toString(),
        itemId: testOrder.items[0]._id.toString(),
        sellerId: testSeller._id.toString()
      });
    });

    it('should handle service timeout gracefully', async () => {
      // Mock service to timeout
      getShippingLabelService.getShippingLabel.mockRejectedValue(new Error('Service timeout'));

      // Make request
      const response = await request(app)
        .get(`/api/v2/sellers/orders/${testOrder._id}/shipping-label?itemId=${testOrder.items[0]._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      // Verify error response
      expect(response.body).toHaveProperty('error', 'Something went wrong!');
    });

    it('should handle multiple order items correctly', async () => {
      // Create another product
      const anotherProduct = new Product({
        name: 'Another Product',
        description: 'Another product description',
        price: 15.99,
        weight: 0.5,
        dimensions: '5x10x3cm',
        category: 'Electronics',
        stock: 5,
        seller: testSeller._id
      });
      await anotherProduct.save();

      // Add another item to the order
      testOrder.items.push({
        product: anotherProduct._id,
        seller: testSeller._id,
        quantity: 1,
        price: 15.99
      });
      await testOrder.save();

      // Mock service response for second item
      const mockShippingLabel = {
        orderId: testOrder._id.toString(),
        trackingNumber: 'TN1234567891',
        labelUrl: 'https://shipping-label-url.com'
      };

      getShippingLabelService.getShippingLabel.mockResolvedValue(mockShippingLabel);

      // Make request for second item
      const response = await request(app)
        .get(`/api/v2/sellers/orders/${testOrder._id}/shipping-label?itemId=${testOrder.items[1]._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.orderId).toBe(testOrder._id.toString());

      // Verify service was called with correct item ID
      expect(getShippingLabelService.getShippingLabel).toHaveBeenCalledWith({
        orderId: testOrder._id.toString(),
        itemId: testOrder.items[1]._id.toString(),
        sellerId: testSeller._id.toString()
      });
    });
  });
});
