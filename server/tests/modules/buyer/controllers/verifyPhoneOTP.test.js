const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Buyer = require('@models/Buyer');
const verifyPhoneOTPService = require('@modules/buyer/services/verifyPhoneOTP.service');

// Mock the service
jest.mock('@modules/buyer/services/verifyPhoneOTP.service');

let mongoServer;

describe('Verify Phone OTP Controller', () => {
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
      email: 'john@example.com',
      username: 'johndoe',
      password: 'password123',
      phoneNumber: '+1234567890',
      phoneVerification: {
        otp: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        attempts: 0
      },
      phoneVerified: false
    });
    await testBuyer.save();

    // Generate token for the test buyer
    token = generateToken(testBuyer._id.toString());
  });

  afterEach(async () => {
    // Clean up test data
    await Buyer.deleteMany({});
  });

  describe('POST /api/v2/buyers/verify-phone-otp', () => {
    it('should return 200 when OTP is verified successfully', async () => {
      // Arrange
      const otp = '123456';
      const mockResponse = {
        message: 'Phone number verified successfully',
        phoneVerified: true
      };

      verifyPhoneOTPService.verifyPhoneOTP.mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/verify-phone-otp')
        .set('Authorization', `Bearer ${token}`)
        .send({ otp })
        .expect(200);

      // Assert
      expect(verifyPhoneOTPService.verifyPhoneOTP).toHaveBeenCalledWith(testBuyer._id.toString(), otp);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Phone number verified successfully');
      expect(response.body.data.message).toBe('Phone number verified successfully');
      expect(response.body.data.phoneVerified).toBe(true);
    });

    it('should return 401 when no token provided', async () => {
      await request(app)
        .post('/api/v2/buyers/verify-phone-otp')
        .send({ otp: '123456' })
        .expect(401);
    });

    it('should return 401 when invalid token provided', async () => {
      await request(app)
        .post('/api/v2/buyers/verify-phone-otp')
        .set('Authorization', 'Bearer invalid-token')
        .send({ otp: '123456' })
        .expect(401);
    });

    it('should return 401 when no token provided', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/buyers/verify-phone-otp')
        .send({ otp: '123456' })
        .expect(401);

      // Assert
      expect(verifyPhoneOTPService.verifyPhoneOTP).not.toHaveBeenCalled();
      expect(response.body.message).toBe('No token provided');
    });

    it('should return 401 when invalid token provided', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/buyers/verify-phone-otp')
        .set('Authorization', 'Bearer invalid-token')
        .send({ otp: '123456' })
        .expect(401);

      // Assert
      expect(verifyPhoneOTPService.verifyPhoneOTP).not.toHaveBeenCalled();
      expect(response.body.message).toBe('Invalid token');
    });

    it('should return 422 when service throws ValidationError', async () => {
      // Arrange
      const otp = '123456';
      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([{ field: 'otp', message: 'Invalid OTP' }]);

      verifyPhoneOTPService.verifyPhoneOTP.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/verify-phone-otp')
        .set('Authorization', `Bearer ${token}`)
        .send({ otp })
        .expect(422);

      // Assert
      expect(verifyPhoneOTPService.verifyPhoneOTP).toHaveBeenCalledWith(testBuyer._id.toString(), otp);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 404 when service throws NotFoundException', async () => {
      // Arrange
      const otp = '123456';
      const NotFoundException = require('@utils/errors/NotFoundException');
      const notFoundError = new NotFoundException('Buyer not found');

      verifyPhoneOTPService.verifyPhoneOTP.mockRejectedValue(notFoundError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/verify-phone-otp')
        .set('Authorization', `Bearer ${token}`)
        .send({ otp })
        .expect(404);

      // Assert
      expect(verifyPhoneOTPService.verifyPhoneOTP).toHaveBeenCalledWith(testBuyer._id.toString(), otp);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Buyer not found');
    });
  });
}); 