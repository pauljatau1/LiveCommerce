const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('@/app');
const Buyer = require('@models/Buyer');
const Seller = require('@models/Seller');

let mongoServer;

describe('Get Followers Controller', () => {
  const mockBuyerId = '507f1f77bcf86cd799439011';
  const mockSellerId = '507f1f77bcf86cd799439012';

  const generateToken = (buyerId) => {
    return jwt.sign({ id: buyerId, role: 'Buyer' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  };

  beforeAll(async () => {
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
    await Buyer.deleteMany({});
    await Seller.deleteMany({});
  });

  afterEach(async () => {
    await Buyer.deleteMany({});
    await Seller.deleteMany({});
  });

  describe('GET /api/v2/buyers/followers', () => {
    it('should successfully get followers with default pagination', async () => {
      // Create test seller
      const seller = new Seller({
        _id: new mongoose.Types.ObjectId(mockSellerId),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        password: 'password123',
        storeName: 'John\'s Electronics',
        businessName: 'Doe Enterprises',
        profileImage: { url: 'https://cdn.example.com/profile.jpg' },
        storeAvatar: { url: 'https://cdn.example.com/avatar.jpg' }
      });
      await seller.save();

      // Create test buyer with followers
      const buyer = new Buyer({
        _id: new mongoose.Types.ObjectId(mockBuyerId),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        username: 'janesmith',
        password: 'password123',
        followers: [{
          sellerId: seller._id,
          storeName: 'John\'s Electronics',
          followDate: new Date('2024-01-15T10:30:00.000Z')
        }]
      });
      await buyer.save();

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/followers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Followers retrieved successfully');
      expect(response.body.data.followers).toBeDefined();
      expect(response.body.data.followers).toHaveLength(1);
      expect(response.body.data.followers[0]).toHaveProperty('id');
      expect(response.body.data.followers[0]).toHaveProperty('type', 'seller');
      expect(response.body.data.followers[0]).toHaveProperty('name');
      expect(response.body.data.followers[0]).toHaveProperty('storeName');
      expect(response.body.pagination).toBeNull()
    });

    it('should successfully get followers with custom pagination', async () => {
      // Create test sellers
      const seller1 = new Seller({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        password: 'password123',
        storeName: 'John\'s Electronics',
        businessName: 'Doe Enterprises',
        profileImage: { url: 'https://cdn.example.com/profile1.jpg' },
        storeAvatar: { url: 'https://cdn.example.com/avatar1.jpg' }
      });
      await seller1.save();

      const seller2 = new Seller({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
        firstName: 'Jane',
        lastName: 'Wilson',
        email: 'jane.wilson@example.com',
        phoneNumber: '+1234567891',
        password: 'password123',
        storeName: 'Jane\'s Store',
        businessName: 'Wilson Enterprises',
        profileImage: { url: 'https://cdn.example.com/profile2.jpg' },
        storeAvatar: { url: 'https://cdn.example.com/avatar2.jpg' }
      });
      await seller2.save();

      // Create test buyer with followers
      const buyer = new Buyer({
        _id: new mongoose.Types.ObjectId(mockBuyerId),
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob.smith@example.com',
        username: 'bobsmith',
        password: 'password123',
        followers: [
          {
            sellerId: seller1._id,
            storeName: 'John\'s Electronics',
            followDate: new Date('2024-01-15T10:30:00.000Z')
          },
          {
            sellerId: seller2._id,
            storeName: 'Jane\'s Store',
            followDate: new Date('2024-01-16T11:30:00.000Z')
          }
        ]
      });
      await buyer.save();

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/followers?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Followers retrieved successfully');
      expect(response.body.data.followers).toBeDefined();
      expect(response.body.data.followers).toHaveLength(1);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.pages).toBe(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should handle buyer with no followers', async () => {
      const buyer = new Buyer({
        _id: new mongoose.Types.ObjectId(mockBuyerId),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        username: 'janesmith',
      phoneNumber: '+2348012345678',
        password: 'password123',
        followers: []
      });
      await buyer.save();

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/followers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Followers retrieved successfully');
      expect(response.body.data.followers).toHaveLength(0);
      expect(response.body.pagination).toBeNull;
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(app)
        .get('/api/v2/buyers/followers')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('No token provided');
    });

    it('should return 401 when invalid token provided', async () => {
      const response = await request(app)
        .get('/api/v2/buyers/followers')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid token');
    });

    it('should return 403 when token is for non-buyer user', async () => {
      const sellerToken = jwt.sign(
        { id: '507f1f77bcf86cd799439099', role: 'Seller' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v2/buyers/followers')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Access denied');
    });

    it('should return 404 when buyer not found', async () => {
      const nonExistentBuyerId = '507f1f77bcf86cd799439099';
      const token = generateToken(nonExistentBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/followers')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Buyer not found');
    });

    it('should handle string pagination parameters', async () => {
      // Create test seller
      const seller = new Seller({
        _id: new mongoose.Types.ObjectId(mockSellerId),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        password: 'password123',
        storeName: 'John\'s Electronics',
        businessName: 'Doe Enterprises',
        profileImage: { url: 'https://cdn.example.com/profile.jpg' },
        storeAvatar: { url: 'https://cdn.example.com/avatar.jpg' }
      });
      await seller.save();

      // Create test buyer with followers
      const buyer = new Buyer({
        _id: new mongoose.Types.ObjectId(mockBuyerId),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        username: 'janesmith',
        password: 'password123',
        followers: [{
          sellerId: seller._id,
          storeName: 'John\'s Electronics',
          followDate: new Date('2024-01-15T10:30:00.000Z')
        }]
      });
      await buyer.save();

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/followers?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.followers).toBeDefined();
      expect(response.body.data.followers).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should handle pagination for second page', async () => {
      // Create test sellers
      const seller1 = new Seller({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        password: 'password123',
        storeName: 'John\'s Electronics',
        businessName: 'Doe Enterprises',
        profileImage: { url: 'https://cdn.example.com/profile1.jpg' },
        storeAvatar: { url: 'https://cdn.example.com/avatar1.jpg' }
      });
      await seller1.save();

      const seller2 = new Seller({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
        firstName: 'Jane',
        lastName: 'Wilson',
        email: 'jane.wilson@example.com',
        phoneNumber: '+1234567891',
        password: 'password123',
        storeName: 'Jane\'s Store',
        businessName: 'Wilson Enterprises',
        profileImage: { url: 'https://cdn.example.com/profile2.jpg' },
        storeAvatar: { url: 'https://cdn.example.com/avatar2.jpg' }
      });
      await seller2.save();

      // Create test buyer with followers
      const buyer = new Buyer({
        _id: new mongoose.Types.ObjectId(mockBuyerId),
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob.smith@example.com',
        username: 'bobsmith',
        password: 'password123',
        followers: [
          {
            sellerId: seller1._id,
            storeName: 'John\'s Electronics',
            followDate: new Date('2024-01-15T10:30:00.000Z')
          },
          {
            sellerId: seller2._id,
            storeName: 'Jane\'s Store',
            followDate: new Date('2024-01-16T11:30:00.000Z')
          }
        ]
      });
      await buyer.save();

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/followers?page=2&limit=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.followers).toBeDefined();
      expect(response.body.data.followers).toHaveLength(1);
      expect(response.body.data.followers[0].id).toBe(seller2._id.toString());
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.pages).toBe(2);
    });

    it('should handle missing pagination parameters', async () => {
      // Create test seller
      const seller = new Seller({
        _id: new mongoose.Types.ObjectId(mockSellerId),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        password: 'password123',
        storeName: 'John\'s Electronics',
        businessName: 'Doe Enterprises',
        profileImage: { url: 'https://cdn.example.com/profile.jpg' },
        storeAvatar: { url: 'https://cdn.example.com/avatar.jpg' }
      });
      await seller.save();

      // Create test buyer with followers
      const buyer = new Buyer({
        _id: new mongoose.Types.ObjectId(mockBuyerId),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        username: 'janesmith',
        password: 'password123',
        followers: [{
          sellerId: seller._id,
          storeName: 'John\'s Electronics',
          followDate: new Date('2024-01-15T10:30:00.000Z')
        }]
      });
      await buyer.save();

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/followers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Followers retrieved successfully');
      expect(response.body.data.followers).toHaveLength(1);
      expect(response.body.pagination).toBeNull;
    });
  });
}); 