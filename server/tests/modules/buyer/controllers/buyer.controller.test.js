const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Import the Buyer model
const Buyer = require('@modules/buyer/models/buyer.model');

// Mock the entire service modules
jest.mock('@modules/buyer/services/register.service', () => ({
  register: jest.fn()
}));

jest.mock('@modules/buyer/services/login.service', () => ({
  login: jest.fn()
}));

jest.mock('@modules/buyer/services/profile.service', () => ({
  getProfile: jest.fn()
}));

jest.mock('@modules/buyer/services/checkToken.service', () => ({
  checkToken: jest.fn()
}));

jest.mock('@modules/buyer/services/updateProfile.service', () => ({
  updateProfile: jest.fn()
}));

// Import the mocked services
const registerService = require('@modules/buyer/services/register.service');
const loginService = require('@modules/buyer/services/login.service');
const profileService = require('@modules/buyer/services/profile.service');
const checkTokenService = require('@modules/buyer/services/checkToken.service');
const updateProfileService = require('@modules/buyer/services/updateProfile.service');

// Mock Firebase
jest.mock('@firebase', () => ({
  saveToken: jest.fn(),
  getToken: jest.fn(),
}));

let mongoServer;

describe('Buyer Controller', () => {
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
    
    // Clear database
    await Buyer.deleteMany({});
  });

  describe('Register Function', () => {
    const validRegistrationData = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john.doe@example.com',
      country: 'NG',
      phoneNumber: '+2348012345678',
      password: 'password123',
      expoPushToken: 'test-expo-token'
    };

    describe('Unit Tests - register method', () => {
    it('should call register service and return success response', async () => {
      // Arrange
      const mockReq = {
        body: validRegistrationData
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = {
        user: {
          _id: new mongoose.Types.ObjectId(),
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

    it('should handle empty request body', async () => {
      // Arrange
      const mockReq = {
        body: {}
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();
      const mockError = new Error('Missing required fields');

      registerService.register.mockRejectedValue(mockError);

      // Act
      await buyerController.register(mockReq, mockRes, mockNext);

      // Assert
      expect(registerService.register).toHaveBeenCalledWith({});
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle null request body', async () => {
      // Arrange
      const mockReq = {
        body: null
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();
      const mockError = new Error('Invalid request body');

      registerService.register.mockRejectedValue(mockError);

      // Act
      await buyerController.register(mockReq, mockRes, mockNext);

      // Assert
      expect(registerService.register).toHaveBeenCalledWith(null);
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle undefined request body', async () => {
      // Arrange
      const mockReq = {};

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();
      const mockError = new Error('Request body is undefined');

      registerService.register.mockRejectedValue(mockError);

      // Act
      await buyerController.register(mockReq, mockRes, mockNext);

      // Assert
      expect(registerService.register).toHaveBeenCalledWith(undefined);
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

      registerService.register.mockResolvedValue(mockServiceResponse);

      // Act & Assert
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Buyer registered successfully',
        data: {
          user: {
            _id: mockObjectId.toString(), // ObjectId gets serialized to string
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            username: 'johndoe'
          },
          token: 'mock-jwt-token'
        },
        pagination: null
      });

      expect(registerService.register).toHaveBeenCalledWith(validRegistrationData);
    });

    it('should return 422 for missing required fields', async () => {
      // Arrange
      const invalidData = {
        firstName: 'John'
        // Missing lastName, email, etc.
      };

      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'lastName', message: 'lastName is required' },
        { field: 'email', message: 'Email is required' },
        { field: 'username', message: 'Username is required' },
        { field: 'phoneNumber', message: 'Phone number is required' },
        { field: 'password', message: 'Password is required' }
      ]);
      registerService.register.mockRejectedValue(validationError);

      // Act & Assert
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(invalidData)
        .expect(422); // ValidationError returns 422 status code

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should handle registration without expoPushToken', async () => {
      // Arrange
      const dataWithoutToken = { ...validRegistrationData };
      delete dataWithoutToken.expoPushToken;

      const mockServiceResponse = {
        user: {
          _id: new mongoose.Types.ObjectId(),
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe'
        },
        token: 'mock-jwt-token'
      };

      registerService.register.mockResolvedValue(mockServiceResponse);

      // Act & Assert
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(dataWithoutToken)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(registerService.register).toHaveBeenCalledWith(dataWithoutToken);
    });

    it('should handle registration with only required fields', async () => {
      // Arrange
      const minimalData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john.doe@example.com',
        phoneNumber: '+2348012345678',
        password: 'password123'
      };

      const mockServiceResponse = {
        user: {
          _id: new mongoose.Types.ObjectId(),
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe'
        },
        token: 'mock-jwt-token'
      };

      registerService.register.mockResolvedValue(mockServiceResponse);

      // Act & Assert
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(minimalData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(registerService.register).toHaveBeenCalledWith(minimalData);
    });

    it('should accept names with maximum allowed length', async () => {
      // Arrange
      const maxLengthData = {
        ...validRegistrationData,
        firstName: 'a'.repeat(100), // Exactly 100 characters
        lastName: 'b'.repeat(100)   // Exactly 100 characters
      };

      const mockServiceResponse = {
        user: {
          _id: new mongoose.Types.ObjectId(),
          firstName: 'a'.repeat(100),
          lastName: 'b'.repeat(100),
          email: 'john.doe@example.com',
          username: 'johndoe'
        },
        token: 'mock-jwt-token'
      };

      registerService.register.mockResolvedValue(mockServiceResponse);

      // Act & Assert
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(maxLengthData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(registerService.register).toHaveBeenCalledWith(maxLengthData);
    });

    it('should accept usernames without spaces', async () => {
      // Arrange
      const validUsernameData = {
        ...validRegistrationData,
        username: 'valid_username_123'
      };

      const mockServiceResponse = {
        user: {
          _id: new mongoose.Types.ObjectId(),
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'valid_username_123'
        },
        token: 'mock-jwt-token'
      };

      registerService.register.mockResolvedValue(mockServiceResponse);

      // Act & Assert
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(validUsernameData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(registerService.register).toHaveBeenCalledWith(validUsernameData);
    });

    it('should accept valid email formats', async () => {
      // Arrange
      const validEmailData = {
        ...validRegistrationData,
        email: 'test.user+tag@example.co.uk'
      };

      const mockServiceResponse = {
        user: {
          _id: new mongoose.Types.ObjectId(),
          firstName: 'John',
          lastName: 'Doe',
          email: 'test.user+tag@example.co.uk',
          username: 'johndoe'
        },
        token: 'mock-jwt-token'
      };

      registerService.register.mockResolvedValue(mockServiceResponse);

      // Act & Assert
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(validEmailData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(registerService.register).toHaveBeenCalledWith(validEmailData);
    });
  });

  describe('Request Body Validation Tests', () => {
    it('should validate email format', async () => {
      // Arrange
      const invalidEmailData = {
        ...validRegistrationData,
        email: 'invalid-email'
      };

      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'email', message: 'Invalid email format for email' }
      ]);
      registerService.register.mockRejectedValue(validationError);

      // Act & Assert
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(invalidEmailData)
        .expect(422); // ValidationError returns 422 status code

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should validate username format', async () => {
      // Arrange
      const invalidUsernameData = {
        ...validRegistrationData,
        username: 'user name with spaces'
      };

      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'username', message: 'Username cannot contain spaces' }
      ]);
      registerService.register.mockRejectedValue(validationError);

      // Act & Assert
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(invalidUsernameData)
        .expect(422); // ValidationError returns 422 status code

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long input fields', async () => {
      // Arrange
      const longData = {
        ...validRegistrationData,
        firstName: 'a'.repeat(101), // Exceeds 100 character limit
        lastName: 'b'.repeat(101)   // Exceeds 100 character limit
      };

      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'firstName', message: 'firstName must not exceed 100 characters' },
        { field: 'lastName', message: 'lastName must not exceed 100 characters' }
      ]);
      registerService.register.mockRejectedValue(validationError);

      // Act & Assert
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(longData)
        .expect(422); // ValidationError returns 422 status code

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should handle special characters in input', async () => {
      // Arrange
      const specialCharData = {
        ...validRegistrationData,
        firstName: 'John<script>alert("xss")</script>',
        lastName: 'Doe<script>alert("xss")</script>'
      };

      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'firstName', message: 'Invalid characters detected in firstName' },
        { field: 'lastName', message: 'Invalid characters detected in lastName' }
      ]);
      registerService.register.mockRejectedValue(validationError);

      // Act & Assert
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(specialCharData)
        .expect(422); // ValidationError returns 422 status code

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should handle empty string values', async () => {
      // Arrange
      const emptyData = {
        ...validRegistrationData,
        firstName: '',
        lastName: ''
      };

      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'firstName', message: 'firstName is required' },
        { field: 'lastName', message: 'lastName is required' }
      ]);
      registerService.register.mockRejectedValue(validationError);

      // Act & Assert
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(emptyData)
        .expect(422); // ValidationError returns 422 status code

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should handle null values in request body', async () => {
      // Arrange
      const nullData = {
        ...validRegistrationData,
        firstName: null,
        lastName: null
      };

      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'firstName', message: 'firstName is required' },
        { field: 'lastName', message: 'lastName is required' }
      ]);
      registerService.register.mockRejectedValue(validationError);

      // Act & Assert
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(nullData)
        .expect(422); // ValidationError returns 422 status code

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Response Format Tests', () => {
    it('should return correct response structure on success', async () => {
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

      registerService.register.mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(validRegistrationData)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Buyer registered successfully');
      expect(response.body.data).toMatchObject({
        user: {
          _id: mockObjectId.toString(), // ObjectId gets serialized to string
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe'
        },
        token: 'mock-jwt-token'
      });
      expect(response.body).toHaveProperty('pagination', null);
    });

    it('should return correct error response structure', async () => {
      // Arrange
      const invalidData = {
        firstName: 'John',
        // Missing required fields like lastName, email, etc.
      };

      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'lastName', message: 'lastName is required' },
        { field: 'email', message: 'Email is required' },
        { field: 'username', message: 'Username is required' },
        { field: 'phoneNumber', message: 'Phone number is required' },
        { field: 'password', message: 'Password is required' }
      ]);
      registerService.register.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/auth/register')
        .send(invalidData)
        .expect(422); // ValidationError returns 422 status code

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Buyer Controller - Login Function', () => {
    const validLoginData = {
      email: 'john.doe@example.com',
      password: 'password123',
      expoPushToken: 'test-expo-token'
    };

    describe('Unit Tests - login method', () => {
      it('should call login service and return success response', async () => {
        // Arrange
        const mockReq = {
          body: validLoginData
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();

        const mockServiceResponse = {
          user: {
            _id: new mongoose.Types.ObjectId(),
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

      it('should handle empty request body', async () => {
        // Arrange
        const mockReq = {
          body: {}
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('Missing required fields');

        loginService.login.mockRejectedValue(mockError);

        // Act
        await buyerController.login(mockReq, mockRes, mockNext);

        // Assert
        expect(loginService.login).toHaveBeenCalledWith({});
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle null request body', async () => {
        // Arrange
        const mockReq = {
          body: null
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('Invalid request body');

        loginService.login.mockRejectedValue(mockError);

        // Act
        await buyerController.login(mockReq, mockRes, mockNext);

        // Assert
        expect(loginService.login).toHaveBeenCalledWith(null);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle undefined request body', async () => {
        // Arrange
        const mockReq = {};

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('Request body is undefined');

        loginService.login.mockRejectedValue(mockError);

        // Act
        await buyerController.login(mockReq, mockRes, mockNext);

        // Assert
        expect(loginService.login).toHaveBeenCalledWith(undefined);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle Google login data', async () => {
        // Arrange
        const googleLoginData = {
          email: 'john.doe@example.com',
          googleToken: 'google-token',
          expoPushToken: 'test-expo-token'
        };

        const mockReq = {
          body: googleLoginData
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();

        const mockServiceResponse = {
          user: {
            _id: new mongoose.Types.ObjectId(),
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com'
          },
          token: 'mock-jwt-token'
        };

        loginService.login.mockResolvedValue(mockServiceResponse);

        // Act
        await buyerController.login(mockReq, mockRes, mockNext);

        // Assert
        expect(loginService.login).toHaveBeenCalledWith(googleLoginData);
        expect(mockRes.success).toHaveBeenCalledWith(
          mockServiceResponse,
          'Login successful'
        );
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('Buyer Controller - GetProfile Function', () => {
    const mockUserId = new mongoose.Types.ObjectId();

    describe('Unit Tests - getProfile method', () => {
      it('should call profile service and return success response', async () => {
        // Arrange
        const mockReq = {
          user: {
            id: mockUserId.toString()
          }
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();

        const mockServiceResponse = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe',
          followersCount: 5,
          followingCount: 3,
          postsCount: 10,
          profilePictureUrl: 'https://example.com/profile.jpg',
          bio: 'Test bio'
        };

        profileService.getProfile.mockResolvedValue(mockServiceResponse);

        // Act
        await buyerController.getProfile(mockReq, mockRes, mockNext);

        // Assert
        expect(profileService.getProfile).toHaveBeenCalledWith(mockUserId.toString());
        expect(mockRes.success).toHaveBeenCalledWith(
          mockServiceResponse,
          'Profile retrieved successfully'
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should call next with error when service throws', async () => {
        // Arrange
        const mockReq = {
          user: {
            id: mockUserId.toString()
          }
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('Buyer not found');

        profileService.getProfile.mockRejectedValue(mockError);

        // Act
        await buyerController.getProfile(mockReq, mockRes, mockNext);

        // Assert
        expect(profileService.getProfile).toHaveBeenCalledWith(mockUserId.toString());
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle missing user id', async () => {
        // Arrange
        const mockReq = {
          user: {}
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('User ID is required');

        profileService.getProfile.mockRejectedValue(mockError);

        // Act
        await buyerController.getProfile(mockReq, mockRes, mockNext);

        // Assert
        expect(profileService.getProfile).toHaveBeenCalledWith(undefined);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle null user', async () => {
        // Arrange
        const mockReq = {
          user: null
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('User not found');

        profileService.getProfile.mockRejectedValue(mockError);

        // Act
        await buyerController.getProfile(mockReq, mockRes, mockNext);

        // Assert
        expect(profileService.getProfile).not.toHaveBeenCalled(undefined);
        expect(mockRes.success).not.toHaveBeenCalled();

      });

      it('should handle undefined user', async () => {
        // Arrange
        const mockReq = {};

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('User not found');

        profileService.getProfile.mockRejectedValue(mockError);

        // Act
        await buyerController.getProfile(mockReq, mockRes, mockNext);

        // Assert
        expect(profileService.getProfile).not.toHaveBeenCalled();
        expect(mockRes.success).not.toHaveBeenCalled();
      });
    });
  });

  describe('Buyer Controller - CheckToken Function', () => {
    describe('Unit Tests - checkToken method', () => {
      it('should call checkToken service and return success response', async () => {
        // Arrange
        const mockToken = 'valid.jwt.token';
        const mockReq = {
          headers: {
            authorization: `Bearer ${mockToken}`
          }
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();

        const mockServiceResponse = {
          message: 'Token is valid',
          token: 'new.jwt.token'
        };

        checkTokenService.checkToken.mockResolvedValue(mockServiceResponse);

        // Act
        await buyerController.checkToken(mockReq, mockRes, mockNext);

        // Assert
        expect(checkTokenService.checkToken).toHaveBeenCalledWith(mockToken);
        expect(mockRes.success).toHaveBeenCalledWith(
          mockServiceResponse,
          'Token validated successfully'
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should call next with error when service throws', async () => {
        // Arrange
        const mockToken = 'invalid.jwt.token';
        const mockReq = {
          headers: {
            authorization: `Bearer ${mockToken}`
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
        expect(checkTokenService.checkToken).toHaveBeenCalledWith(mockToken);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle missing authorization header', async () => {
        // Arrange
        const mockReq = {
          headers: {}
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('No token provided');

        checkTokenService.checkToken.mockRejectedValue(mockError);

        // Act
        await buyerController.checkToken(mockReq, mockRes, mockNext);

        // Assert
        expect(checkTokenService.checkToken).toHaveBeenCalledWith(undefined);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle malformed authorization header', async () => {
        // Arrange
        const mockReq = {
          headers: {
            authorization: 'InvalidFormat'
          }
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('Invalid token format');

        checkTokenService.checkToken.mockRejectedValue(mockError);

        // Act
        await buyerController.checkToken(mockReq, mockRes, mockNext);

        // Assert
        expect(checkTokenService.checkToken).toHaveBeenCalledWith(undefined);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle null authorization header', async () => {
        // Arrange
        const mockReq = {
          headers: {
            authorization: null
          }
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('No token provided');

        checkTokenService.checkToken.mockRejectedValue(mockError);

        // Act
        await buyerController.checkToken(mockReq, mockRes, mockNext);

        // Assert
        expect(checkTokenService.checkToken).toHaveBeenCalledWith(undefined);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle undefined authorization header', async () => {
        // Arrange
        const mockReq = {
          headers: {}
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('No token provided');

        checkTokenService.checkToken.mockRejectedValue(mockError);

        // Act
        await buyerController.checkToken(mockReq, mockRes, mockNext);

        // Assert
        expect(checkTokenService.checkToken).toHaveBeenCalledWith(undefined);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle expired token', async () => {
        // Arrange
        const mockToken = 'expired.jwt.token';
        const mockReq = {
          headers: {
            authorization: `Bearer ${mockToken}`
          }
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('Token has expired');

        checkTokenService.checkToken.mockRejectedValue(mockError);

        // Act
        await buyerController.checkToken(mockReq, mockRes, mockNext);

        // Assert
        expect(checkTokenService.checkToken).toHaveBeenCalledWith(mockToken);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle valid token with different formats', async () => {
        // Arrange
        const testCases = [
          'valid.token.1',
          'valid.token.2',
          'valid.token.3'
        ];

        for (const token of testCases) {
          const mockReq = {
            headers: {
              authorization: `Bearer ${token}`
            }
          };

          const mockRes = {
            success: jest.fn()
          };

          const mockNext = jest.fn();

          const mockServiceResponse = {
            message: 'Token is valid',
            token: `new.${token}`
          };

          checkTokenService.checkToken.mockResolvedValue(mockServiceResponse);

          // Act
          await buyerController.checkToken(mockReq, mockRes, mockNext);

          // Assert
          expect(checkTokenService.checkToken).toHaveBeenCalledWith(token);
          expect(mockRes.success).toHaveBeenCalledWith(
            mockServiceResponse,
            'Token validated successfully'
          );
          expect(mockNext).not.toHaveBeenCalled();

          // Clear mocks for next iteration
          jest.clearAllMocks();
        }
      });
    });
  });

  describe('Login Function', () => {
    const validLoginData = {
      email: 'john.doe@example.com',
      password: 'password123',
      expoPushToken: 'test-expo-token'
    };

    describe('Unit Tests - login method', () => {
      it('should call login service and return success response', async () => {
        // Arrange
        const mockReq = {
          body: validLoginData
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();

        const mockServiceResponse = {
          user: {
            _id: new mongoose.Types.ObjectId(),
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

      it('should handle empty request body', async () => {
        // Arrange
        const mockReq = {
          body: {}
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('Missing required fields');

        loginService.login.mockRejectedValue(mockError);

        // Act
        await buyerController.login(mockReq, mockRes, mockNext);

        // Assert
        expect(loginService.login).toHaveBeenCalledWith({});
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle null request body', async () => {
        // Arrange
        const mockReq = {
          body: null
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('Invalid request body');

        loginService.login.mockRejectedValue(mockError);

        // Act
        await buyerController.login(mockReq, mockRes, mockNext);

        // Assert
        expect(loginService.login).toHaveBeenCalledWith(null);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle undefined request body', async () => {
        // Arrange
        const mockReq = {};

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('Request body is undefined');

        loginService.login.mockRejectedValue(mockError);

        // Act
        await buyerController.login(mockReq, mockRes, mockNext);

        // Assert
        expect(loginService.login).toHaveBeenCalledWith(undefined);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle Google login data', async () => {
        // Arrange
        const googleLoginData = {
          email: 'john.doe@example.com',
          googleToken: 'google-token',
          expoPushToken: 'test-expo-token'
        };

        const mockReq = {
          body: googleLoginData
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();

        const mockServiceResponse = {
          user: {
            _id: new mongoose.Types.ObjectId(),
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com'
          },
          token: 'mock-jwt-token'
        };

        loginService.login.mockResolvedValue(mockServiceResponse);

        // Act
        await buyerController.login(mockReq, mockRes, mockNext);

        // Assert
        expect(loginService.login).toHaveBeenCalledWith(googleLoginData);
        expect(mockRes.success).toHaveBeenCalledWith(
          mockServiceResponse,
          'Login successful'
        );
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('GetProfile Function', () => {
    const mockUserId = new mongoose.Types.ObjectId();

    describe('Unit Tests - getProfile method', () => {
      it('should call profile service and return success response', async () => {
        // Arrange
        const mockReq = {
          user: {
            id: mockUserId.toString()
          }
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();

        const mockServiceResponse = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe',
          followersCount: 5,
          followingCount: 3,
          postsCount: 10,
          profilePictureUrl: 'https://example.com/profile.jpg',
          bio: 'Test bio'
        };

        profileService.getProfile.mockResolvedValue(mockServiceResponse);

        // Act
        await buyerController.getProfile(mockReq, mockRes, mockNext);

        // Assert
        expect(profileService.getProfile).toHaveBeenCalledWith(mockUserId.toString());
        expect(mockRes.success).toHaveBeenCalledWith(
          mockServiceResponse,
          'Profile retrieved successfully'
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should call next with error when service throws', async () => {
        // Arrange
        const mockReq = {
          user: {
            id: mockUserId.toString()
          }
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('Buyer not found');

        profileService.getProfile.mockRejectedValue(mockError);

        // Act
        await buyerController.getProfile(mockReq, mockRes, mockNext);

        // Assert
        expect(profileService.getProfile).toHaveBeenCalledWith(mockUserId.toString());
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle missing user id', async () => {
        // Arrange
        const mockReq = {
          user: {}
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('User ID is required');

        profileService.getProfile.mockRejectedValue(mockError);

        // Act
        await buyerController.getProfile(mockReq, mockRes, mockNext);

        // Assert
        expect(profileService.getProfile).toHaveBeenCalledWith(undefined);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle null user', async () => {
        // Arrange
        const mockReq = {
          user: null
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();

        // Act
        await buyerController.getProfile(mockReq, mockRes, mockNext);

        // Assert
        expect(profileService.getProfile).not.toHaveBeenCalled();
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(expect.any(TypeError));
      });

      it('should handle undefined user', async () => {
        // Arrange
        const mockReq = {};

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();

        // Act
        await buyerController.getProfile(mockReq, mockRes, mockNext);

        // Assert
        expect(profileService.getProfile).not.toHaveBeenCalled();
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(expect.any(TypeError));
      });
    });
  });

  describe('CheckToken Function', () => {
    describe('Unit Tests - checkToken method', () => {
      it('should call checkToken service and return success response', async () => {
        // Arrange
        const mockToken = 'valid.jwt.token';
        const mockReq = {
          headers: {
            authorization: `Bearer ${mockToken}`
          }
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();

        const mockServiceResponse = {
          message: 'Token is valid',
          token: 'new.jwt.token'
        };

        checkTokenService.checkToken.mockResolvedValue(mockServiceResponse);

        // Act
        await buyerController.checkToken(mockReq, mockRes, mockNext);

        // Assert
        expect(checkTokenService.checkToken).toHaveBeenCalledWith(mockToken);
        expect(mockRes.success).toHaveBeenCalledWith(
          mockServiceResponse,
          'Token validated successfully'
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should call next with error when service throws', async () => {
        // Arrange
        const mockToken = 'invalid.jwt.token';
        const mockReq = {
          headers: {
            authorization: `Bearer ${mockToken}`
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
        expect(checkTokenService.checkToken).toHaveBeenCalledWith(mockToken);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle missing authorization header', async () => {
        // Arrange
        const mockReq = {
          headers: {}
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('No token provided');

        checkTokenService.checkToken.mockRejectedValue(mockError);

        // Act
        await buyerController.checkToken(mockReq, mockRes, mockNext);

        // Assert
        expect(checkTokenService.checkToken).toHaveBeenCalledWith(undefined);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle malformed authorization header', async () => {
        // Arrange
        const mockReq = {
          headers: {
            authorization: 'InvalidFormat'
          }
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('Invalid token format');

        checkTokenService.checkToken.mockRejectedValue(mockError);

        // Act
        await buyerController.checkToken(mockReq, mockRes, mockNext);

        // Assert
        expect(checkTokenService.checkToken).toHaveBeenCalledWith(undefined);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle null authorization header', async () => {
        // Arrange
        const mockReq = {
          headers: {
            authorization: null
          }
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('No token provided');

        checkTokenService.checkToken.mockRejectedValue(mockError);

        // Act
        await buyerController.checkToken(mockReq, mockRes, mockNext);

        // Assert
        expect(checkTokenService.checkToken).toHaveBeenCalledWith(undefined);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle undefined authorization header', async () => {
        // Arrange
        const mockReq = {
          headers: {}
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('No token provided');

        checkTokenService.checkToken.mockRejectedValue(mockError);

        // Act
        await buyerController.checkToken(mockReq, mockRes, mockNext);

        // Assert
        expect(checkTokenService.checkToken).toHaveBeenCalledWith(undefined);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle expired token', async () => {
        // Arrange
        const mockToken = 'expired.jwt.token';
        const mockReq = {
          headers: {
            authorization: `Bearer ${mockToken}`
          }
        };

        const mockRes = {
          success: jest.fn()
        };

        const mockNext = jest.fn();
        const mockError = new Error('Token has expired');

        checkTokenService.checkToken.mockRejectedValue(mockError);

        // Act
        await buyerController.checkToken(mockReq, mockRes, mockNext);

        // Assert
        expect(checkTokenService.checkToken).toHaveBeenCalledWith(mockToken);
        expect(mockRes.success).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(mockError);
      });

      it('should handle valid token with different formats', async () => {
        // Arrange
        const testCases = [
          'valid.token.1',
          'valid.token.2',
          'valid.token.3'
        ];

        for (const token of testCases) {
          const mockReq = {
            headers: {
              authorization: `Bearer ${token}`
            }
          };

          const mockRes = {
            success: jest.fn()
          };

          const mockNext = jest.fn();

          const mockServiceResponse = {
            message: 'Token is valid',
            token: `new.${token}`
          };

          checkTokenService.checkToken.mockResolvedValue(mockServiceResponse);

          // Act
          await buyerController.checkToken(mockReq, mockRes, mockNext);

          // Assert
          expect(checkTokenService.checkToken).toHaveBeenCalledWith(token);
          expect(mockRes.success).toHaveBeenCalledWith(
            mockServiceResponse,
            'Token validated successfully'
          );
          expect(mockNext).not.toHaveBeenCalled();

          // Clear mocks for next iteration
          jest.clearAllMocks();
        }
      });
    });
  });

  describe('updateProfile', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      mockReq = {
        user: { id: '507f1f77bcf86cd799439011' },
        body: {
          firstName: 'Jane',
          lastName: 'Smith',
          bio: 'Updated bio'
        }
      };

      mockRes = {
        success: jest.fn()
      };

      mockNext = jest.fn();
    });

    it('should update profile successfully', async () => {
      const mockResponse = {
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'johndoe',
        email: 'john@example.com',
        bio: 'Updated bio'
      };

      updateProfileService.updateProfile.mockResolvedValue(mockResponse);

      await buyerController.updateProfile(mockReq, mockRes, mockNext);

      expect(updateProfileService.updateProfile).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.body
      );
      expect(mockRes.success).toHaveBeenCalledWith(mockResponse, 'Profile updated successfully');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors and pass to next middleware', async () => {
      const mockError = new Error('Service error');
      updateProfileService.updateProfile.mockRejectedValue(mockError);

      await buyerController.updateProfile(mockReq, mockRes, mockNext);

      expect(updateProfileService.updateProfile).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.body
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle validation errors', async () => {
      const ValidationError = require('@utils/errors/ValidationError');
      const mockError = new ValidationError([
        { field: 'username', message: 'Username already taken' }
      ]);

      updateProfileService.updateProfile.mockRejectedValue(mockError);

      await buyerController.updateProfile(mockReq, mockRes, mockNext);

      expect(updateProfileService.updateProfile).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.body
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle not found errors', async () => {
      const NotFoundException = require('@utils/errors/NotFoundException');
      const mockError = new NotFoundException('Buyer not found');

      updateProfileService.updateProfile.mockRejectedValue(mockError);

      await buyerController.updateProfile(mockReq, mockRes, mockNext);

      expect(updateProfileService.updateProfile).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.body
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});
});