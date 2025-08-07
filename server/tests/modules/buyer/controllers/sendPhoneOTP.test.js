const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Buyer = require('@modules/buyer/models/buyer.model');
const sendPhoneOTPService = require('@modules/buyer/services/sendPhoneOTP.service');

// Mock the service
jest.mock('@modules/buyer/services/sendPhoneOTP.service');

// Mock AWS SDK
jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ MessageId: 'test-message-id' })
  })),
  PublishCommand: jest.fn().mockImplementation((params) => ({
    input: params
  }))
}));

let mongoServer;

describe('Send Phone OTP Controller', () => {
  let testBuyer;
  let token;

  // Import the app without starting the server
  const { app } = require('@/app');

  beforeAll(async () => {
    // Start in-memory MongoDB
    const { MongoMemoryServer } = require('mongodb-memory-server');
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

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a test buyer
    testBuyer = new Buyer({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'johndoe',
      password: 'password123',
      phoneNumber: '+2348012345678'
    });
    await testBuyer.save();

          // Generate token for the test buyer
      token = generateToken(testBuyer._id.toString());
  });

  afterEach(async () => {
    // Clean up test data
    await Buyer.deleteMany({});
  });

  describe('POST /api/v2/buyers/send-phone-otp', () => {
    it('should return 200 when OTP is sent successfully', async () => {
      // Arrange
      const phoneNumber = '+2348012345678';
      const mockResponse = {
        message: 'OTP sent successfully',
        validFor: '10 minutes'
      };

      sendPhoneOTPService.sendPhoneOTP.mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/send-phone-otp')
        .set('Authorization', `Bearer ${token}`)
        .send({ phoneNumber })
        .expect(200);

      // Assert
      expect(sendPhoneOTPService.sendPhoneOTP).toHaveBeenCalledWith(testBuyer._id.toString(), phoneNumber);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('OTP sent successfully');
      expect(response.body.data).toEqual(mockResponse);
    });

    it('should return 401 when no token provided', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/buyers/send-phone-otp')
        .send({ phoneNumber: '+2348012345678' })
        .expect(401);

      // Assert
      expect(sendPhoneOTPService.sendPhoneOTP).not.toHaveBeenCalled();
      expect(response.body.message).toBe('No token provided');
    });

    it('should return 401 when invalid token provided', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/buyers/send-phone-otp')
        .set('Authorization', 'Bearer invalid-token')
        .send({ phoneNumber: '+2348012345678' })
        .expect(401);

      // Assert
      expect(sendPhoneOTPService.sendPhoneOTP).not.toHaveBeenCalled();
      expect(response.body.message).toBe('Invalid token');
    });
  });
}); 