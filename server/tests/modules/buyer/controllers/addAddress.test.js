const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import the app without starting the server
const { app } = require('@/app');

// Import the Buyer model
const Buyer = require('@models/Buyer');

// Mock Firebase
jest.mock('@firebase', () => ({
  saveToken: jest.fn(),
  getToken: jest.fn(),
}));

let mongoServer;

describe('Add Address Controller', () => {
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
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database
    await Buyer.deleteMany({});
  });

  const generateToken = (buyerId) => {
    return jwt.sign({ id: buyerId, role: 'Buyer' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  };

  describe('POST /api/v2/buyers/addresses', () => {
    let testBuyer;
    let token;
    const validAddressData = {
      addressType: 'home',
      country: 'Nigeria',
      state: 'Lagos',
      city: 'Lagos',
      addressLine1: '123 Main Street',
      addressLine2: 'Apt 4B',
      zipCode: '100001'
    };

    beforeEach(async () => {
      // Create a test buyer
      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
      phoneNumber: '+2348012345678',
        password: 'password123',
        shippingAddresses: []
      });
      await testBuyer.save();

      // Generate token for the test buyer
      token = generateToken(testBuyer._id.toString());
    });

    it('should add address successfully for authenticated buyer', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/buyers/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(validAddressData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Address added successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.message).toBe('Address added successfully');
      expect(response.body.data.address).toBeDefined();
      expect(response.body.data.address.addressType).toBe('home');
      expect(response.body.data.address.country).toBe('Nigeria');
      expect(response.body.data.address.state).toBe('Lagos');
      expect(response.body.data.address.city).toBe('Lagos');
      expect(response.body.data.address.addressLine1).toBe('123 Main Street');
      expect(response.body.data.address.addressLine2).toBe('Apt 4B');
      expect(response.body.data.address.zipCode).toBe('100001');
    });

    it('should add address to buyer with existing addresses', async () => {
      // Arrange - Add existing address
      const existingAddress = {
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        zipCode: '100002'
      };

      testBuyer.shippingAddresses = [existingAddress];
      await testBuyer.save();

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(validAddressData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.address.addressType).toBe('home');
      expect(response.body.data.address.addressLine1).toBe('123 Main Street');
    });

    it('should return 422 when required fields are missing', async () => {
      // Arrange - Missing required fields
      const invalidAddressData = {
        addressType: 'home',
        country: 'Nigeria'
        // Missing state, city, addressLine1, zipCode
      };

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidAddressData)
        .expect(422);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should return 422 when address type is invalid', async () => {
      // Arrange - Invalid address type
      const invalidAddressData = {
        ...validAddressData,
        addressType: 'invalid'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidAddressData)
        .expect(422);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 when no token provided', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/buyers/addresses')
        .send(validAddressData)
        .expect(401);

      // Assert
      expect(response.body.message).toBe('No token provided');
    });

    it('should return 401 when invalid token provided', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/buyers/addresses')
        .set('Authorization', 'Bearer invalid-token')
        .send(validAddressData)
        .expect(401);

      // Assert
      expect(response.body.message).toBe('Invalid token');
    });

    it('should return 404 when buyer does not exist', async () => {
      // Arrange - Use token for non-existent buyer
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const invalidToken = generateToken(nonExistentId);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/addresses')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send(validAddressData)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Buyer not found');
    });

    it('should handle address without optional fields', async () => {
      // Arrange - Address without optional fields
      const addressWithoutOptional = {
        addressType: 'other',
        country: 'Nigeria',
        state: 'Abuja',
        city: 'Abuja',
        addressLine1: '789 Other Street',
        zipCode: '100003'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(addressWithoutOptional)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.address.addressType).toBe('other');
      expect(response.body.data.address.addressLine2).toBeUndefined();
    });

    it('should handle complex address data', async () => {
      // Arrange - Complex address data
      const complexAddress = {
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        addressLine2: 'Suite 10, Floor 5, Building A',
        zipCode: '100002'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(complexAddress)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.address.addressType).toBe('work');
      expect(response.body.data.address.addressLine2).toBe('Suite 10, Floor 5, Building A');
    });

    it('should return 403 when user is not a buyer', async () => {
      // Arrange - Generate token with different role
      const sellerToken = jwt.sign(
        { id: testBuyer._id.toString(), role: 'Seller' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/addresses')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(validAddressData)
        .expect(403);

      // Assert
      expect(response.body.message).toBe('Access denied. Buyers only.');
    });
  });
}); 