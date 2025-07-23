const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const { app } = require('@/app');
const Buyer = require('@modules/buyer/models/buyer.model');
const jwt = require('jsonwebtoken');

let mongoServer;

describe('Get Addresses Controller', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3'
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
    // Clear database before each test
    await Buyer.deleteMany({});
  });

  const mockBuyerData = {
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    country: 'NG',
    phoneNumber: '+2348012345678',
    password: 'hashedPassword123',
    isActive: true,
    emailVerified: true,
    phoneVerified: false,
    isNewBuyer: true,
    isIdentityVerified: false,
    preferredCurrency: 'NGN',
    preferredLanguage: 'en',
    authProvider: 'local'
  };

  const generateToken = (buyerId) => {
    return jwt.sign({ id: buyerId, role: 'Buyer' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  };

  describe('GET /api/v2/buyers/addresses', () => {
    it('should return shipping addresses for authenticated buyer', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        shippingAddresses: [
          {
            addressType: 'home',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Lagos',
            addressLine1: '123 Main Street',
            addressLine2: 'Apt 4B',
            zipCode: '100001'
          },
          {
            addressType: 'work',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Victoria Island',
            addressLine1: '456 Business Avenue',
            addressLine2: 'Suite 10',
            zipCode: '100002'
          }
        ]
      });
      await buyer.save();

      const token = generateToken(buyer._id);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/addresses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Addresses retrieved successfully');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].addressType).toBe('home');
      expect(response.body.data[0].country).toBe('Nigeria');
      expect(response.body.data[0].state).toBe('Lagos');
      expect(response.body.data[0].city).toBe('Lagos');
      expect(response.body.data[0].addressLine1).toBe('123 Main Street');
      expect(response.body.data[0].addressLine2).toBe('Apt 4B');
      expect(response.body.data[0].zipCode).toBe('100001');
      expect(response.body.data[1].addressType).toBe('work');
      expect(response.body.data[1].addressLine1).toBe('456 Business Avenue');
    });

    it('should return empty array when buyer has no shipping addresses', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        shippingAddresses: []
      });
      await buyer.save();

      const token = generateToken(buyer._id);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/addresses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Addresses retrieved successfully');
      expect(response.body.data).toHaveLength(0);
    });

    it('should return 401 when no token provided', async () => {
      // Act
      const response = await request(app)
        .get('/api/v2/buyers/addresses')
        .expect(401);

      // Assert
      expect(response.body.message).toBe('No token provided');
    });

    it('should return 401 when invalid token provided', async () => {
      // Act
      const response = await request(app)
        .get('/api/v2/buyers/addresses')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Assert
      expect(response.body.message).toBe('Invalid token');
    });

    it('should return 404 when buyer does not exist', async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();
      const token = generateToken(nonExistentId);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/addresses')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Buyer not found');
    });

    it('should handle buyer with null shipping addresses', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        email: 'null@example.com',
        username: 'nulluser',
        shippingAddresses: null
      });
      await buyer.save();

      const token = generateToken(buyer._id);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/addresses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Addresses retrieved successfully');
      expect(response.body.data).toHaveLength(0);
    });

    it('should handle buyer with single shipping address', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        email: 'single@example.com',
        username: 'singleuser',
        shippingAddresses: [
          {
            addressType: 'home',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Lagos',
            addressLine1: '789 Single Street',
            zipCode: '100003'
          }
        ]
      });
      await buyer.save();

      const token = generateToken(buyer._id);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/addresses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Addresses retrieved successfully');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].addressType).toBe('home');
      expect(response.body.data[0].addressLine1).toBe('789 Single Street');
      expect(response.body.data[0].addressLine2).toBeUndefined();
    });

    it('should handle complex address data', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        email: 'complex@example.com',
        username: 'complexuser',
        shippingAddresses: [
          {
            addressType: 'home',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Lagos',
            addressLine1: '123 Main Street',
            addressLine2: 'Apt 4B',
            zipCode: '100001'
          },
          {
            addressType: 'work',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Victoria Island',
            addressLine1: '456 Business Avenue',
            addressLine2: 'Suite 10',
            zipCode: '100002'
          },
          {
            addressType: 'other',
            country: 'Nigeria',
            state: 'Abuja',
            city: 'Abuja',
            addressLine1: '789 Other Street',
            zipCode: '100003'
          }
        ]
      });
      await buyer.save();

      const token = generateToken(buyer._id);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/addresses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Addresses retrieved successfully');
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].addressType).toBe('home');
      expect(response.body.data[1].addressType).toBe('work');
      expect(response.body.data[2].addressType).toBe('other');
      expect(response.body.data[2].state).toBe('Abuja');
      expect(response.body.data[2].city).toBe('Abuja');
    });
  });
}); 