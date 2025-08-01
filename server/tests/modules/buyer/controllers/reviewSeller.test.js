const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import the app
const { app } = require('@/app');

describe('POST /api/v2/buyers/seller/:sellerId/review', () => {
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
    const Order = require('@/models/Order');
    await Buyer.deleteMany({});
    await Seller.deleteMany({});
    await Order.deleteMany({});

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
      businessName: 'Test Business',
      reviews: [],
      stats: {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
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
        .post(`/api/v2/buyers/seller/${testSellerId}/review`)
        .send({
          rating: 5,
          comment: 'Great seller with excellent service!'
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    test('should return 401 when invalid token is provided', async () => {
      const response = await request(app)
        .post(`/api/v2/buyers/seller/${testSellerId}/review`)
        .set('Authorization', 'Bearer invalid-token')
        .send({
          rating: 5,
          comment: 'Great seller with excellent service!'
        })
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
        .post(`/api/v2/buyers/seller/${testSellerId}/review`)
        .set('Authorization', `Bearer ${wrongRoleToken}`)
        .send({
          rating: 5,
          comment: 'Great seller with excellent service!'
        })
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('Validation', () => {
    test('should return 422 when rating is less than 1', async () => {
      const token = generateToken(testBuyerId);
      
      const response = await request(app)
        .post(`/api/v2/buyers/seller/${testSellerId}/review`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 0,
          comment: 'Great seller with excellent service!'
        })
        .expect(422);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    test('should return 422 when rating is greater than 5', async () => {
      const token = generateToken(testBuyerId);
      
      const response = await request(app)
        .post(`/api/v2/buyers/seller/${testSellerId}/review`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 6,
          comment: 'Great seller with excellent service!'
        })
        .expect(422);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    test('should return 422 when comment is too short', async () => {
      const token = generateToken(testBuyerId);
      
      const response = await request(app)
        .post(`/api/v2/buyers/seller/${testSellerId}/review`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          comment: 'Short'
        })
        .expect(422);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    test('should return 422 when comment is missing', async () => {
      const token = generateToken(testBuyerId);
      
      const response = await request(app)
        .post(`/api/v2/buyers/seller/${testSellerId}/review`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5
        })
        .expect(422);
      
      expect(response.body.success).toBe(false);
    });

    test('should return 422 when rating is missing', async () => {
      const token = generateToken(testBuyerId);
      
      const response = await request(app)
        .post(`/api/v2/buyers/seller/${testSellerId}/review`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          comment: 'Great seller with excellent service!'
        })
        .expect(422);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('Business Logic', () => {
    test('should return 404 when seller not found', async () => {
      const token = generateToken(testBuyerId);
      const nonExistentSellerId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post(`/api/v2/buyers/seller/${nonExistentSellerId}/review`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          comment: 'Great seller with excellent service!'
        })
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Seller not found');
    });

    test('should return 422 when buyer has already reviewed seller', async () => {
      const token = generateToken(testBuyerId);
      
      // Add existing review
      const Seller = require('@/models/Seller');
      const seller = await Seller.findById(testSellerId);
      seller.reviews.push({
        buyer: testBuyerId,
        rating: 4,
        comment: 'Previous review',
        buyerName: 'Test Buyer',
        createdAt: new Date(),
        isVerifiedPurchase: true
      });
      await seller.save();
      
      const response = await request(app)
        .post(`/api/v2/buyers/seller/${testSellerId}/review`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          comment: 'Great seller with excellent service!'
        })
        .expect(422);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    test('should return 422 when buyer has no purchase and is not follower', async () => {
      const token = generateToken(testBuyerId);
      
      const response = await request(app)
        .post(`/api/v2/buyers/seller/${testSellerId}/review`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          comment: 'Great seller with excellent service!'
        })
        .expect(422);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('Successful Review Creation', () => {
    test('should create review successfully when buyer has made a purchase', async () => {
      // Create a completed order
      const Order = require('@/models/Order');
      const order = new Order({
        buyer: testBuyerId,
        seller: testSellerId,
        totalAmount: 100,
        buyerDetails: {
          _id: testBuyerId
        },
        paymentInfo: {
          status: 'completed'
        },
        shipping: {
          tracking: {
            status: 'delivered'
          }
        },
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            seller: testSellerId,
            quantity: 1,
            price: 100
          }
        ]
      });
      await order.save();

      const token = generateToken(testBuyerId);
      
      const response = await request(app)
        .post(`/api/v2/buyers/seller/${testSellerId}/review`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          comment: 'Excellent seller with great service and fast delivery!'
        })
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Review submitted successfully');
      expect(response.body.data.review).toBeDefined();
      expect(response.body.data.review.rating).toBe(5);
      expect(response.body.data.review.comment).toBe('Excellent seller with great service and fast delivery!');
      expect(response.body.data.review.buyerName).toBe('Test Buyer');
      expect(response.body.data.review.isVerifiedPurchase).toBe(true);
    });

    test('should create review successfully when buyer is a follower', async () => {
      // Make buyer a follower of seller
      const Buyer = require('@modules/buyer/models/buyer.model');
      const buyer = await Buyer.findById(testBuyerId);
      buyer.followers.push({
        sellerId: testSellerId,
        followDate: new Date()
      });
      await buyer.save();

      const token = generateToken(testBuyerId);
      
      const response = await request(app)
        .post(`/api/v2/buyers/seller/${testSellerId}/review`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 4,
          comment: 'Good seller with reliable service and quality products!'
        })
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Review submitted successfully');
      expect(response.body.data.review).toBeDefined();
      expect(response.body.data.review.rating).toBe(4);
      expect(response.body.data.review.comment).toBe('Good seller with reliable service and quality products!');
      expect(response.body.data.review.buyerName).toBe('Test Buyer');
      expect(response.body.data.review.isVerifiedPurchase).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle buyer without profile image', async () => {
      // Create a completed order
      const Order = require('@/models/Order');
      const order = new Order({
        buyer: testBuyerId,
        seller: testSellerId,
        totalAmount: 100,
        buyerDetails: {
          _id: testBuyerId
        },
        paymentInfo: {
          status: 'completed'
        },
        shipping: {
          tracking: {
            status: 'delivered'
          }
        },
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            seller: testSellerId,
            quantity: 1,
            price: 100
          }
        ]
      });
      await order.save();

      const token = generateToken(testBuyerId);
      
      const response = await request(app)
        .post(`/api/v2/buyers/seller/${testSellerId}/review`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 3,
          comment: 'Average seller with decent service and products!'
        })
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.review.buyerImage).toBeUndefined();
    });

    test('should handle invalid seller ID format', async () => {
      const token = generateToken(testBuyerId);
      
      const response = await request(app)
        .post('/api/v2/buyers/seller/invalid-id/review')
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          comment: 'Great seller with excellent service!'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });
}); 