const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Import the Buyer model
const Buyer = require('@modules/buyer/models/buyer.model');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the requestAccountDeletion service
jest.mock('@modules/buyer/services/requestAccountDeletion.service');

const requestAccountDeletionService = require('@modules/buyer/services/requestAccountDeletion.service');

let mongoServer;

// Helper function to generate JWT token
const generateToken = (buyerId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: buyerId, role: 'Buyer' }, process.env.JWT_SECRET || 'test-secret');
};

describe('requestAccountDeletion.controller', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB with compatible version
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
    jest.clearAllMocks();
    await Buyer.deleteMany({});
  });

  describe('POST /api/v2/buyers/request-account-deletion', () => {
    it('should return 200 when request account deletion is successful', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const serviceResponse = {
        message: 'Account deletion verification code sent to your email',
        validFor: '10 minutes'
      };
      requestAccountDeletionService.requestAccountDeletion.mockResolvedValue(serviceResponse);

      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/request-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Account deletion request submitted successfully',
        data: {
          message: 'Account deletion verification code sent to your email',
          validFor: '10 minutes'
        },
        pagination: null
      });
      expect(requestAccountDeletionService.requestAccountDeletion).toHaveBeenCalledWith(buyerId);
    });

    it('should return 422 when validation fails', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const validationError = new ValidationError([
        { field: 'buyerId', message: 'Buyer not found' }
      ]);
      requestAccountDeletionService.requestAccountDeletion.mockRejectedValue(validationError);

      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/request-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'buyerId', message: 'Buyer not found' }
        ]
      });
    });

    it('should return 500 when service throws generic error', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const genericError = new Error('Database connection failed');
      requestAccountDeletionService.requestAccountDeletion.mockRejectedValue(genericError);

      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/request-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should return 401 when no authorization token is provided', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/buyers/request-account-deletion')
        .expect(401);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'No token provided'
      });
    });

    it('should return 401 when invalid authorization token is provided', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/buyers/request-account-deletion')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid token'
      });
    });

    it('should handle service errors with specific error messages', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const serviceError = new Error('Failed to update buyer with deletion OTP');
      requestAccountDeletionService.requestAccountDeletion.mockRejectedValue(serviceError);

      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/request-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should handle SendGrid email sending errors', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const sendGridError = new Error('SendGrid error');
      requestAccountDeletionService.requestAccountDeletion.mockRejectedValue(sendGridError);

      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/request-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should handle template file reading errors', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const fileError = new Error('File not found');
      requestAccountDeletionService.requestAccountDeletion.mockRejectedValue(fileError);

      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/request-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should handle validation errors for account deletion already in progress', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const validationError = new ValidationError([
        { field: 'buyerId', message: 'Account deletion request already in progress' }
      ]);
      requestAccountDeletionService.requestAccountDeletion.mockRejectedValue(validationError);

      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/request-account-deletion')
        .set('Authorization', `Bearer ${token}`)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'buyerId', message: 'Account deletion request already in progress' }
        ]
      });
    });
  });
}); 