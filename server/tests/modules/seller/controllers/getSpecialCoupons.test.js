const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import the app without starting the server
const { app } = require('@/app');

// Import models
const Coupon = require('@models/Coupon');
const Seller = require('@models/Seller');
const Product = require('@models/Product');

let mongoServer;

describe('Seller Controller - Get Special Coupons', () => {
  beforeAll(async () => {
    // Set JWT secret for testing
    process.env.JWT_SECRET = 'test-secret-key';
    
    // Start in-memory MongoDB with compatible version
    mongoServer = await MongoMemoryServer.create({
      binary: { version: '7.0.3' }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database
    await Coupon.deleteMany({});
    await Seller.deleteMany({});
    await Product.deleteMany({});
  });

  describe('GET /api/coupons/special', () => {
    let testSeller;
    let authToken;

    beforeEach(async () => {
      // Create a test seller
      testSeller = await Seller.create({
        firstName: 'Test',
        lastName: 'Seller',
        email: 'test@example.com',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        storeName: 'Test Store',
        isVerified: true
      });

      // Generate auth token
      authToken = jwt.sign(
        { id: testSeller._id.toString(), role: 'Seller' },
        process.env.JWT_SECRET
      );
    });

    it('should return empty array when no coupons exist', async () => {
      const response = await request(app)
        .get('/api/coupons/special')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('coupons');
      expect(response.body.coupons).toEqual([]);
      expect(response.body).toHaveProperty('currentPage');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('totalCoupons');
    });

    it('should return special coupons successfully', async () => {
      // Create a test product
      const testProduct = await Product.create({
        name: 'Test Product',
        description: 'Test product description',
        price: 1000,
        seller: testSeller._id,
        category: 'Electronics',
        stock: 10
      });

      // Create a special coupon
      const coupon = await Coupon.create({
        seller: testSeller._id,
        name: 'Test Coupon',
        code: 'TESTCODE',
        discountType: 'percentage',
        discountPercentage: 10,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000), // 1 day from now
        applicableProducts: [{
          product: testProduct._id,
          originalPrice: 1000,
          discountedPrice: 900
        }]
      });

      const response = await request(app)
        .get('/api/coupons/special')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.coupons).toHaveLength(1);
      expect(response.body.coupons[0]).toHaveProperty('_id');
      expect(response.body.coupons[0]).toHaveProperty('name', 'Test Coupon');
      expect(response.body.coupons[0]).toHaveProperty('code', 'TESTCODE');
      expect(response.body.coupons[0]).toHaveProperty('applicableProductIds');
      expect(response.body.coupons[0].applicableProductIds).toHaveLength(1);
    });

    it('should handle null products gracefully (deleted products)', async () => {
      // Create a product and then delete it to simulate a deleted product reference
      const testProduct = await Product.create({
        name: 'Test Product',
        description: 'Test product description',
        price: 1000,
        seller: testSeller._id,
        category: 'Electronics',
        stock: 10
      });

      const productId = testProduct._id;

      // Create a coupon with the product
      const coupon = await Coupon.create({
        seller: testSeller._id,
        name: 'Test Coupon',
        code: 'TESTCODE2',
        discountType: 'percentage',
        discountPercentage: 10,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        applicableProducts: [{
          product: productId,
          originalPrice: 1000,
          discountedPrice: 900
        }]
      });

      // Delete the product to simulate a deleted product scenario
      await Product.deleteOne({ _id: productId });

      // The endpoint should handle this gracefully without throwing an error
      const response = await request(app)
        .get('/api/coupons/special')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.coupons).toHaveLength(1);
      expect(response.body.coupons[0]).toHaveProperty('name', 'Test Coupon');
      // The applicableProductIds should be empty or filtered out null entries
      expect(response.body.coupons[0]).toHaveProperty('applicableProductIds');
      expect(Array.isArray(response.body.coupons[0].applicableProductIds)).toBe(true);
      // Should not throw error even with null products
      expect(response.body.coupons[0].applicableProducts).toBeDefined();
      expect(Array.isArray(response.body.coupons[0].applicableProducts)).toBe(true);
    });

    it('should filter coupons by status', async () => {
      // Create active coupon
      await Coupon.create({
        seller: testSeller._id,
        name: 'Active Coupon',
        code: 'ACTIVE',
        discountType: 'percentage',
        discountPercentage: 10,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000)
      });

      // Create inactive coupon
      await Coupon.create({
        seller: testSeller._id,
        name: 'Inactive Coupon',
        code: 'INACTIVE',
        discountType: 'percentage',
        discountPercentage: 10,
        status: 'inactive',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000)
      });

      const response = await request(app)
        .get('/api/coupons/special?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.coupons).toHaveLength(1);
      expect(response.body.coupons[0].status).toBe('active');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/coupons/special')
        .expect(401);
    });
  });
});
