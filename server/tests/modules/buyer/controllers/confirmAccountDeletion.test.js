const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('@/app').app;
const Buyer = require('@models/Buyer');
const ValidationError = require('@utils/errors/ValidationError');
const confirmAccountDeletionService = require('@modules/buyer/services/confirmAccountDeletion.service');

// Mock the service
jest.mock('@modules/buyer/services/confirmAccountDeletion.service');

describe('confirmAccountDeletion.controller', () => {
  let mongoServer;

  // Helper function to generate JWT tokens
  const generateToken = (buyerId) => {
    return jwt.sign(
      { id: buyerId, type: 'buyer' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and close connections
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up database after each test
    await Buyer.deleteMany({});
  });

  describe('POST /api/v2/buyers/confirm-account-deletion', () => {
    const mockBuyerData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'hashedPassword123',
      username: 'johndoe123',
      phoneNumber: '+1234567890',
      isVerified: true,
      accountDeletion: {
        otp: '1234',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0
      }
    };

    it('should return 200 when account deletion confirmation is successful', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const token = generateToken(savedBuyer._id.toString());

      const requestBody = {
        otp: '1234'
      };

      const serviceResponse = {
        message: 'Account deleted successfully'
      };

      confirmAccountDeletionService.confirmAccountDeletion.mockResolvedValue(serviceResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/confirm-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Account deleted successfully',
        data: serviceResponse,
        pagination: null
      });

      expect(confirmAccountDeletionService.confirmAccountDeletion).toHaveBeenCalledWith(
        savedBuyer._id.toString(),
        '1234'
      );
    });

    it('should return 422 when validation fails due to invalid OTP', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const token = generateToken(savedBuyer._id.toString());

      const requestBody = {
        otp: 'invalid'
      };

      const validationError = new ValidationError([{
        field: 'otp',
        message: 'Invalid verification code'
      }]);

      confirmAccountDeletionService.confirmAccountDeletion.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/confirm-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    });

    it('should return 422 when OTP is incorrect with remaining attempts', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const token = generateToken(savedBuyer._id.toString());

      const requestBody = {
        otp: '5678'
      };

      const validationError = new ValidationError([{
        field: 'otp',
        message: 'Validation failed',
        remainingAttempts: 3
      }]);

      confirmAccountDeletionService.confirmAccountDeletion.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/confirm-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    });

    it('should return 422 when account deletion request has expired', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const token = generateToken(savedBuyer._id.toString());

      const requestBody = {
        otp: '1234'
      };

      const validationError = new ValidationError([{
        field: 'accountDeletion',
        message: 'Verification code has expired. Please request a new one.'
      }]);

      confirmAccountDeletionService.confirmAccountDeletion.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/confirm-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    });

    it('should return 422 when too many attempts have been made', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const token = generateToken(savedBuyer._id.toString());

      const requestBody = {
        otp: '1234'
      };

      const validationError = new ValidationError([{
        field: 'accountDeletion',
        message: 'Too many failed attempts. Please request a new verification code.'
      }]);

      confirmAccountDeletionService.confirmAccountDeletion.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/confirm-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    });

    it('should return 422 when no deletion request exists', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const token = generateToken(savedBuyer._id.toString());

      const requestBody = {
        otp: '1234'
      };

      const validationError = new ValidationError([{
        field: 'accountDeletion',
        message: 'No deletion request found. Please request account deletion first.'
      }]);

      confirmAccountDeletionService.confirmAccountDeletion.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/confirm-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    });

    it('should return 500 when service throws unexpected error', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const token = generateToken(savedBuyer._id.toString());

      const requestBody = {
        otp: '1234'
      };

      const serviceError = new Error('Database connection failed');
      confirmAccountDeletionService.confirmAccountDeletion.mockRejectedValue(serviceError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/confirm-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should return 401 when no authorization token is provided', async () => {
      // Arrange
      const requestBody = {
        otp: '1234'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/confirm-account-deletion')
        .send(requestBody)
        .expect(401);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'No token provided'
      });
    });

    it('should return 401 when invalid authorization token is provided', async () => {
      // Arrange
      const requestBody = {
        otp: '1234'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/confirm-account-deletion')
        .set('Authorization', 'Bearer invalid-token')
        .send(requestBody)
        .expect(401);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid token'
      });
    });

    it('should return 422 when request body is missing OTP', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const token = generateToken(savedBuyer._id.toString());

      const requestBody = {}; // Missing OTP

      const validationError = new ValidationError([{
        field: 'otp',
        message: 'OTP is required'
      }]);

      confirmAccountDeletionService.confirmAccountDeletion.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/confirm-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    });

    it('should return 422 when OTP is not a string', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const token = generateToken(savedBuyer._id.toString());

      const requestBody = {
        otp: 1234 // Number instead of string
      };

      const validationError = new ValidationError([{
        field: 'otp',
        message: 'OTP must be a string'
      }]);

      confirmAccountDeletionService.confirmAccountDeletion.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/confirm-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    });

    it('should return 422 when OTP is not exactly 4 digits', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const token = generateToken(savedBuyer._id.toString());

      const requestBody = {
        otp: '123' // Only 3 digits
      };

      const validationError = new ValidationError([{
        field: 'otp',
        message: 'OTP must be exactly 4 digits'
      }]);

      confirmAccountDeletionService.confirmAccountDeletion.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/confirm-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    });

    it('should handle service errors with specific error messages', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const token = generateToken(savedBuyer._id.toString());

      const requestBody = {
        otp: '1234'
      };

      const serviceError = new Error('Failed to send confirmation email');
      confirmAccountDeletionService.confirmAccountDeletion.mockRejectedValue(serviceError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/confirm-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });

      expect(confirmAccountDeletionService.confirmAccountDeletion).toHaveBeenCalledWith(
        savedBuyer._id.toString(),
        '1234'
      );
    });

    it('should properly extract buyerId from authenticated user token', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const token = generateToken(savedBuyer._id.toString());

      const requestBody = {
        otp: '1234'
      };

      const serviceResponse = {
        message: 'Account deleted successfully'
      };

      confirmAccountDeletionService.confirmAccountDeletion.mockResolvedValue(serviceResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/confirm-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(200);

      // Assert
      expect(confirmAccountDeletionService.confirmAccountDeletion).toHaveBeenCalledWith(
        savedBuyer._id.toString(),
        '1234'
      );
    });

    it('should handle malformed JSON in request body', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      const token = generateToken(savedBuyer._id.toString());

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/confirm-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .send('{"otp": invalid}') // Malformed JSON
        .expect(400);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid JSON in request body',
        error: 'Bad Request'
      });
    });
  });
});