const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Mock the login service
jest.mock('@modules/buyer/services/login.service', () => ({
  login: jest.fn()
}));

// Import the mocked service
const loginService = require('@modules/buyer/services/login.service');

// Mock Firebase
jest.mock('@firebase', () => ({
  saveToken: jest.fn(),
  getToken: jest.fn(),
}));

let mongoServer;

describe('Buyer Controller - Login', () => {
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

  describe('login', () => {
    const validLoginData = {
      email: 'john.doe@example.com',
      password: 'password123',
      expoPushToken: 'test-expo-token'
    };

    it('should call login service and return success response', async () => {
      // Arrange
      const mockReq = {
        body: validLoginData
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockObjectId = new mongoose.Types.ObjectId();
      const mockServiceResponse = {
        user: {
          _id: mockObjectId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe'
        },
        token: 'mock-jwt-token'
      };

      loginService.login.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.login(mockReq, mockRes, mockNext);

      // Assert
      expect(loginService.login).toHaveBeenCalledWith(validLoginData);
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Login successful'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // Arrange
      const mockReq = {
        body: validLoginData
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();
      const mockError = new Error('Invalid credentials');

      loginService.login.mockRejectedValue(mockError);

      // Act
      await buyerController.login(mockReq, mockRes, mockNext);

      // Assert
      expect(loginService.login).toHaveBeenCalledWith(validLoginData);
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('Integration Tests - POST /api/v2/buyers/auth/login', () => {
    it('should login successfully via HTTP', async () => {
      // Arrange
      const mockObjectId = new mongoose.Types.ObjectId();
      const mockServiceResponse = {
        user: {
          _id: mockObjectId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe'
        },
        token: 'mock-jwt-token'
      };

      // Create expected response with string ID (as it would be serialized)
      const expectedResponse = {
        user: {
          _id: mockObjectId.toString(),
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe'
        },
        token: 'mock-jwt-token'
      };

      loginService.login.mockResolvedValue(mockServiceResponse);

      const validLoginData = {
        email: 'john.doe@example.com',
        password: 'password123',
        expoPushToken: 'test-expo-token'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/auth/login')
        .send(validLoginData)
        .expect(200);

      // Assert
      expect(loginService.login).toHaveBeenCalledWith(validLoginData);
              expect(response.body).toEqual({
          success: true,
          data: expectedResponse,
          message: 'Login successful',
          pagination: null
        });
    });

    it('should return 500 for service error via HTTP', async () => {
      // Arrange
      const mockError = new Error('Service error');
      loginService.login.mockRejectedValue(mockError);

      const validLoginData = {
        email: 'john.doe@example.com',
        password: 'password123'
      };

      // Act & Assert
      await request(app)
        .post('/api/v2/buyers/auth/login')
        .send(validLoginData)
        .expect(500);
    });
  });
}); 