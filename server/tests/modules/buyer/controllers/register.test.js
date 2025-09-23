const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Mock the register service
jest.mock('@modules/buyer/services/register.service', () => ({
  register: jest.fn()
}));

// Import the mocked service
const registerService = require('@modules/buyer/services/register.service');

// Mock Firebase
jest.mock('@firebase', () => ({
  saveToken: jest.fn(),
  getToken: jest.fn(),
}));

let mongoServer;

describe('Buyer Controller - Register', () => {
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

  describe('register', () => {
    const validRegistrationData = {
      username: 'johndoe',
      email: 'john.doe@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      country: 'NG',
      phoneNumber: '+2348012345678',
      expoPushToken: 'test-expo-token'
    };

    it('should call register service and return success response', async () => {
      // Arrange
      const mockReq = {
        body: validRegistrationData
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

      registerService.register.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.register(mockReq, mockRes, mockNext);

      // Assert
      expect(registerService.register).toHaveBeenCalledWith(validRegistrationData);
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Buyer registered successfully',
        201
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // Arrange
      const mockReq = {
        body: validRegistrationData
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();
      const mockError = new Error('Service error');

      registerService.register.mockRejectedValue(mockError);

      // Act
      await buyerController.register(mockReq, mockRes, mockNext);

      // Assert
      expect(registerService.register).toHaveBeenCalledWith(validRegistrationData);
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('Integration Tests - POST /api/v2/buyers/auth/register', () => {
    it('should register a new buyer successfully via HTTP', async () => {
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

      registerService.register.mockResolvedValue(mockServiceResponse);

      const validRegistrationData = {
        username: 'johndoe',
        email: 'john.doe@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        country: 'NG',
        phoneNumber: '+2348012345678',
        expoPushToken: 'test-expo-token'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(validRegistrationData)
        .expect(201);

      // Assert
      expect(registerService.register).toHaveBeenCalledWith(validRegistrationData);
              expect(response.body).toEqual({
          success: true,
          data: expectedResponse,
          message: 'Buyer registered successfully',
          pagination: null
        });
    });

    it('should return 500 for service error via HTTP', async () => {
      // Arrange
      const mockError = new Error('Service error');
      registerService.register.mockRejectedValue(mockError);

      const validRegistrationData = {
        username: 'johndoe',
        email: 'john.doe@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        country: 'NG',
        phoneNumber: '+2348012345678'
      };

      // Act & Assert
      await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(validRegistrationData)
        .expect(500);
    });
  });
}); 