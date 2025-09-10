const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import the app without starting the server
const { app } = require('@/app');

// Mock the generateSmileIdToken service
jest.mock('@modules/seller/services/generateSmileIdToken.service', () => ({
  generateSmileIdToken: jest.fn()
}));

// Import the mocked service
const generateSmileIdTokenService = require('@modules/seller/services/generateSmileIdToken.service');

const ValidationError = require('@utils/errors/ValidationError');
const Seller = require('@models/Seller');

let mongoServer;

describe('Seller Controller - Generate SmileID Token', () => {
  beforeAll(async () => {
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
    await Seller.deleteMany({});
    jest.clearAllMocks();
  });

  // Helper function to create a valid JWT token
  const createAuthToken = (userId = '507f1f77bcf86cd799439011', role = 'Seller') => {
    return jwt.sign(
      { id: userId, role: role },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
  };

  describe('POST /api/v2/sellers/verification/smileid/token', () => {
    const validTokenData = {
      accountType: 'individual',
      idType: 'NIN_SLIP',
      userId: 'user123'
    };

    const mockTokenResponse = {
      token: 'mock-smileid-token',
      expiresAt: '2024-01-01T01:00:00.000Z',
      userId: 'seller-507f1f77bcf86cd799439011-1704067200000',
      jobId: 'job-507f1f77bcf86cd799439011-1704067200000',
      product: 'enhanced_kyc',
      accountType: 'individual',
      idType: 'NIN_SLIP',
      success: true
    };

    let authToken;
    let seller;

    beforeEach(async () => {
      // Create a test seller
      seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      await seller.save();

      // Generate auth token for the seller
      authToken = createAuthToken(seller._id.toString());
    });

    it('should successfully generate SmileID token for individual account', async () => {
      // Arrange
      generateSmileIdTokenService.generateSmileIdToken.mockResolvedValue(mockTokenResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/verification/smileid/token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validTokenData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'SmileID token generated successfully',
        data: mockTokenResponse,
        pagination: null
      });
      expect(generateSmileIdTokenService.generateSmileIdToken).toHaveBeenCalledWith(validTokenData, seller._id.toString());
    });

    it('should successfully generate SmileID token for business account', async () => {
      // Arrange
      const businessTokenData = {
        accountType: 'business',
        idType: 'BN',
        userId: 'user456'
      };

      const businessTokenResponse = {
        ...mockTokenResponse,
        product: 'doc_verification',
        accountType: 'business',
        idType: 'BN'
      };

      generateSmileIdTokenService.generateSmileIdToken.mockResolvedValue(businessTokenResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/verification/smileid/token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(businessTokenData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'SmileID token generated successfully',
        data: businessTokenResponse,
        pagination: null
      });
      expect(generateSmileIdTokenService.generateSmileIdToken).toHaveBeenCalledWith(businessTokenData, seller._id.toString());
    });

    it('should successfully generate SmileID token without optional userId', async () => {
      // Arrange
      const tokenDataWithoutUserId = {
        accountType: 'individual',
        idType: 'BVN'
      };

      const tokenResponseWithoutUserId = {
        ...mockTokenResponse,
        idType: 'BVN',
        userId: 'seller-507f1f77bcf86cd799439011-1704067200001'
      };

      generateSmileIdTokenService.generateSmileIdToken.mockResolvedValue(tokenResponseWithoutUserId);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/verification/smileid/token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tokenDataWithoutUserId);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'SmileID token generated successfully',
        data: tokenResponseWithoutUserId,
        pagination: null
      });
      expect(generateSmileIdTokenService.generateSmileIdToken).toHaveBeenCalledWith(tokenDataWithoutUserId, seller._id.toString());
    });

    it('should return 422 for validation errors', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'accountType', message: 'Account type is required' }
      ]);
      generateSmileIdTokenService.generateSmileIdToken.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/verification/smileid/token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ idType: 'NIN_SLIP' });

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'accountType', message: 'Account type is required' }
        ]
      });
    });

    it('should return 404 when seller not found', async () => {
      // Arrange
      generateSmileIdTokenService.generateSmileIdToken.mockRejectedValue(new Error('Seller not found'));

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/verification/smileid/token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validTokenData);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should return 500 for SmileID API errors', async () => {
      // Arrange
      generateSmileIdTokenService.generateSmileIdToken.mockRejectedValue(new Error('SmileID API Error'));

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/verification/smileid/token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validTokenData);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should return 401 when no authorization token provided', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/sellers/verification/smileid/token')
        .send(validTokenData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'No token provided'
      });
    });

    it('should return 401 when invalid authorization token provided', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/sellers/verification/smileid/token')
        .set('Authorization', 'Bearer invalid-token')
        .send(validTokenData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid token'
      });
    });

    it('should return 401 when malformed authorization header provided', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/sellers/verification/smileid/token')
        .set('Authorization', 'InvalidFormat')
        .send(validTokenData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'No token provided'
      });
    });

    it('should handle multiple validation errors', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'accountType', message: 'Account type is required' },
        { field: 'idType', message: 'ID type is required' }
      ]);
      generateSmileIdTokenService.generateSmileIdToken.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/verification/smileid/token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'accountType', message: 'Account type is required' },
          { field: 'idType', message: 'ID type is required' }
        ]
      });
    });

    it('should handle service throwing generic error', async () => {
      // Arrange
      generateSmileIdTokenService.generateSmileIdToken.mockRejectedValue(new Error('Generic error'));

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/verification/smileid/token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validTokenData);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should handle empty request body', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'accountType', message: 'Account type is required' },
        { field: 'idType', message: 'ID type is required' }
      ]);
      generateSmileIdTokenService.generateSmileIdToken.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/verification/smileid/token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'accountType', message: 'Account type is required' },
          { field: 'idType', message: 'ID type is required' }
        ]
      });
    });
  });
});
