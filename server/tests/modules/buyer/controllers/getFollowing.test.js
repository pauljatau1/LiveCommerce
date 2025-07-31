const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import the app
const { app } = require('@/app');

describe('GET /api/v2/buyers/following', () => {
  let mongoServer;
  let testBuyerId;
  let testSellerId;

  beforeAll(async () => {
    // Start MongoDB Memory Server with compatible version for Debian 12
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3'
      }
    });
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear collections before each test
    const Buyer = require('@modules/buyer/models/buyer.model');
    const Seller = require('@/models/Seller');
    await Buyer.deleteMany({});
    await Seller.deleteMany({});

    // Create test buyer
    const testBuyer = new Buyer({
      firstName: 'Test',
      lastName: 'Buyer',
      email: 'test@example.com',
      password: 'password123',
      username: 'testbuyer'
    });
    await testBuyer.save();
    testBuyerId = testBuyer._id;

    // Create test seller
    const testSeller = new Seller({
      firstName: 'Test',
      lastName: 'Seller',
      email: 'seller@example.com',
      phoneNumber: '+1234567890',
      password: 'password123',
      username: 'testseller',
      storeName: 'Test Store',
      businessName: 'Test Business'
    });
    await testSeller.save();
    testSellerId = testSeller._id;
  });

  function generateToken(buyerId) {
    return jwt.sign(
      { 
        id: buyerId, 
        email: 'test@example.com',
        role: 'Buyer'
      },
      process.env.JWT_SECRET || 'test-jwt-secret',
      { expiresIn: '1h' }
    );
  }

  describe('Authentication', () => {
    test('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/v2/buyers/following')
        .expect(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    test('should return 401 when invalid token is provided', async () => {
      const response = await request(app)
        .get('/api/v2/buyers/following')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    test('should return 403 when token has wrong role', async () => {
      const wrongRoleToken = jwt.sign(
        { 
          id: testBuyerId, 
          email: 'test@example.com',
          role: 'Seller'
        },
        process.env.JWT_SECRET || 'test-jwt-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v2/buyers/following')
        .set('Authorization', `Bearer ${wrongRoleToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('Successful requests', () => {
    test('should return 200 with empty following list for new buyer', async () => {
      const token = generateToken(testBuyerId);
      
      const response = await request(app)
        .get('/api/v2/buyers/following')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Following retrieved successfully');
      expect(response.body.data.following).toEqual([]);
      expect(response.body.pagination).toBeNull();
    });

    test('should return 200 with following list when buyer follows sellers', async () => {
      // Add seller to buyer's following
      const Buyer = require('@modules/buyer/models/buyer.model');
      const Seller = require('@/models/Seller');
      
      const buyer = await Buyer.findById(testBuyerId);
      const seller = await Seller.findById(testSellerId);
      
      // Add follower to seller
      seller.followers.push({
        buyerId: testBuyerId,
        followDate: new Date()
      });
      await seller.save();
      
      const token = generateToken(testBuyerId);
      
      const response = await request(app)
        .get('/api/v2/buyers/following')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.following).toHaveLength(1);
      expect(response.body.data.following[0].id).toBe(testSellerId.toString());
      expect(response.body.data.following[0].type).toBe('seller');
      expect(response.body.data.following[0].name).toBe('Test Seller');
      expect(response.body.data.following[0].storeName).toBe('Test Store');
      expect(response.body.pagination).toBeNull();
    });

    test('should handle pagination correctly', async () => {
      // Create multiple sellers
      const Seller = require('@/models/Seller');
      const sellers = [];
      
      for (let i = 1; i <= 15; i++) {
        const seller = new Seller({
          firstName: `Seller${i}`,
          lastName: 'Test',
          email: `seller${i}@example.com`,
          phoneNumber: `+123456789${i}`,
          password: 'password123',
          username: `seller${i}`,
          storeName: `Store ${i}`,
          businessName: `Business ${i}`
        });
        await seller.save();
        sellers.push(seller);
      }
      
      // Add all sellers to buyer's following
      const Buyer = require('@modules/buyer/models/buyer.model');
      const buyer = await Buyer.findById(testBuyerId);
      
      for (const seller of sellers) {
        seller.followers.push({
          buyerId: testBuyerId,
          followDate: new Date()
        });
        await seller.save();
      }
      
      const token = generateToken(testBuyerId);
      
      // Test first page
      const response1 = await request(app)
        .get('/api/v2/buyers/following?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response1.body.data.following).toHaveLength(10);
      expect(response1.body.pagination.total).toBe(15);
      expect(response1.body.pagination.pages).toBe(2);
      expect(response1.body.pagination.page).toBe(1);
      
      // Test second page
      const response2 = await request(app)
        .get('/api/v2/buyers/following?page=2&limit=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response2.body.data.following).toHaveLength(5);
      expect(response2.body.pagination.page).toBe(2);
    });

    test('should sort following by follow date (newest first)', async () => {
      const Seller = require('@/models/Seller');
      
      // Create two sellers
      const seller1 = new Seller({
        firstName: 'First',
        lastName: 'Seller',
        email: 'first@example.com',
        phoneNumber: '+1234567891',
        password: 'password123',
        username: 'firstseller',
        storeName: 'First Store'
      });
      await seller1.save();
      
      const seller2 = new Seller({
        firstName: 'Second',
        lastName: 'Seller',
        email: 'second@example.com',
        phoneNumber: '+1234567892',
        password: 'password123',
        username: 'secondseller',
        storeName: 'Second Store'
      });
      await seller2.save();
      
      // Add followers with different dates
      seller1.followers.push({
        buyerId: testBuyerId,
        followDate: new Date('2024-01-01')
      });
      await seller1.save();
      
      seller2.followers.push({
        buyerId: testBuyerId,
        followDate: new Date('2024-01-15')
      });
      await seller2.save();
      
      const token = generateToken(testBuyerId);
      
      const response = await request(app)
        .get('/api/v2/buyers/following')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.data.following).toHaveLength(2);
      // Second seller should be first (newer follow date)
      expect(response.body.data.following[0].storeName).toBe('Second Store');
      expect(response.body.data.following[1].storeName).toBe('First Store');
    });
  });

  describe('Edge cases', () => {
    test('should handle seller with no store name', async () => {
      const Seller = require('@/models/Seller');
      const seller = new Seller({
        firstName: 'No',
        lastName: 'Store',
        email: 'nostore@example.com',
        phoneNumber: '+1234567893',
        password: 'password123',
        username: 'nostore',
        businessName: 'Business Only'
      });
      await seller.save();
      
      seller.followers.push({
        buyerId: testBuyerId,
        followDate: new Date()
      });
      await seller.save();
      
      const token = generateToken(testBuyerId);
      
      const response = await request(app)
        .get('/api/v2/buyers/following')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.data.following).toHaveLength(1);
      expect(response.body.data.following[0].storeName).toBe('Business Only');
    });

    test('should handle seller with no profile image', async () => {
      const Seller = require('@/models/Seller');
      const seller = new Seller({
        firstName: 'No',
        lastName: 'Image',
        email: 'noimage@example.com',
        phoneNumber: '+1234567894',
        password: 'password123',
        username: 'noimage',
        storeName: 'No Image Store'
      });
      await seller.save();
      
      seller.followers.push({
        buyerId: testBuyerId,
        followDate: new Date()
      });
      await seller.save();
      
      const token = generateToken(testBuyerId);
      
      const response = await request(app)
        .get('/api/v2/buyers/following')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.data.following).toHaveLength(1);
    });

    test('should handle invalid buyer ID in token', async () => {
      const invalidToken = jwt.sign(
        { 
          id: '507f1f77bcf86cd799439011', // Non-existent ID
          email: 'test@example.com',
          role: 'Buyer'
        },
        process.env.JWT_SECRET || 'test-jwt-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v2/buyers/following')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(200); // Should still work but return empty list
      
      expect(response.body.data.following).toEqual([]);
    });
  });
}); 