const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Mock the checkToken service
jest.mock('@modules/buyer/services/checkToken.service', () => ({
  checkToken: jest.fn()
}));

// Import the mocked service
const checkTokenService = require('@modules/buyer/services/checkToken.service');

// Mock Firebase
jest.mock('@firebase', () => ({
  saveToken: jest.fn(),
  getToken: jest.fn(),
}));

let mongoServer;

describe('Buyer Controller - CheckToken', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB with compatible version
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3' // Use a version compatible with Debian 12
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
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('checkToken', () => {
    it('should call checkToken service and return success response', async () => {
      // Arrange
      const mockReq = {
        headers: {
          authorization: 'Bearer valid-token'
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = {
        message: 'Token is valid',
        token: 'new-jwt-token'
      };

      checkTokenService.checkToken.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.checkToken(mockReq, mockRes, mockNext);

      // Assert
      expect(checkTokenService.checkToken).toHaveBeenCalledWith('valid-token');
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Token validated successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // Arrange
      const mockReq = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();
      const mockError = new Error('Invalid token');

      checkTokenService.checkToken.mockRejectedValue(mockError);

      // Act
      await buyerController.checkToken(mockReq, mockRes, mockNext);

      // Assert
      expect(checkTokenService.checkToken).toHaveBeenCalledWith('invalid-token');
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('Integration Tests - GET /api/v2/buyers/auth/check-token', () => {
    it('should check token successfully via HTTP', async () => {
      // Arrange
      const mockServiceResponse = {
        message: 'Token is valid',
        token: 'new-jwt-token'
      };

      checkTokenService.checkToken.mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/auth/check-token')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Assert
      expect(checkTokenService.checkToken).toHaveBeenCalledWith('valid-token');
      expect(response.body).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Token validated successfully',
        pagination: null
      });
    });

    it('should return 500 for service error via HTTP', async () => {
      // Arrange
      const mockError = new Error('Service error');
      checkTokenService.checkToken.mockRejectedValue(mockError);

      // Act & Assert
      await request(app)
        .get('/api/v2/buyers/auth/check-token')
        .set('Authorization', 'Bearer invalid-token')
        .expect(500);
    });
  });
}); 