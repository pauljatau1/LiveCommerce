const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Mock the login service
jest.mock('@modules/seller/services/login.service', () => ({
  login: jest.fn()
}));

// Import the mocked service
const loginService = require('@modules/seller/services/login.service');

const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

let mongoServer;

describe('Seller Controller - Login', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v2/sellers/login', () => {
    const validLoginData = {
      email: 'seller@example.com',
      password: 'password123'
    };

    const mockLoginResponse = {
      user: {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'seller@example.com',
        phoneNumber: '+2348012345678',
        storeName: "John's Store",
        agoraUid: 123456789,
        emailVerified: true,
        createdAt: new Date().toISOString()
      },
      token: 'mock-jwt-token'
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      loginService.login.mockResolvedValue(mockLoginResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/login')
        .send(validLoginData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Login successful',
        data: mockLoginResponse,
        pagination: null
      });
      expect(loginService.login).toHaveBeenCalledWith(validLoginData);
    });

    it('should return 422 for validation errors', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email is required' }
      ]);
      loginService.login.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/login')
        .send({ password: 'password123' });

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' }
        ]
      });
    });

    it('should return 404 for invalid credentials', async () => {
      // Arrange
      const notFoundError = new NotFoundException('Invalid credentials');
      loginService.login.mockRejectedValue(notFoundError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/login')
        .send(validLoginData);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid credentials'
      });
    });

    it('should return 500 for internal server errors', async () => {
      // Arrange
      loginService.login.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/login')
        .send(validLoginData);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should handle missing required fields', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' }
      ]);
      loginService.login.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/login')
        .send({});

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toHaveLength(2);
    });

    it('should handle invalid JSON in request body', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/sellers/login')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      // Assert
      expect(response.status).toBe(400);
    });

    it('should handle empty request body', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' }
      ]);
      loginService.login.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/login')
        .send();

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should handle whitespace in input fields', async () => {
      // Arrange
      const loginDataWithWhitespace = {
        email: '  seller@example.com  ',
        password: '  password123  '
      };
      loginService.login.mockResolvedValue(mockLoginResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/login')
        .send(loginDataWithWhitespace);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(loginService.login).toHaveBeenCalledWith(loginDataWithWhitespace);
    });

    it('should handle service throwing generic errors', async () => {
      // Arrange
      loginService.login.mockRejectedValue(new Error('Generic error'));

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/login')
        .send(validLoginData);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Something went wrong!');
    });

    it('should handle service throwing errors with status codes', async () => {
      // Arrange
      const errorWithStatus = new Error('Custom error');
      errorWithStatus.status = 401;
      loginService.login.mockRejectedValue(errorWithStatus);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/login')
        .send(validLoginData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Custom error');
    });

    describe('request validation', () => {
      it('should validate email field', async () => {
        // Arrange
        const validationError = new ValidationError([
          { field: 'email', message: 'Email is required' }
        ]);
        loginService.login.mockRejectedValue(validationError);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/login')
          .send({ password: 'password123' });

        // Assert
        expect(response.status).toBe(422);
        expect(response.body.errors[0].field).toBe('email');
      });

      it('should validate password field', async () => {
        // Arrange
        const validationError = new ValidationError([
          { field: 'password', message: 'Password is required' }
        ]);
        loginService.login.mockRejectedValue(validationError);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/login')
          .send({ email: 'seller@example.com' });

        // Assert
        expect(response.status).toBe(422);
        expect(response.body.errors[0].field).toBe('password');
      });
    });

    describe('response format', () => {
      it('should return correct response structure on success', async () => {
        // Arrange
        loginService.login.mockResolvedValue(mockLoginResponse);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/login')
          .send(validLoginData);

        // Assert
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Login successful');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination', null);
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data).toHaveProperty('token');
      });

      it('should return correct error response structure', async () => {
        // Arrange
        const validationError = new ValidationError([
          { field: 'email', message: 'Email is required' }
        ]);
        loginService.login.mockRejectedValue(validationError);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/login')
          .send({ password: 'password123' });

        // Assert
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('errors');
        expect(Array.isArray(response.body.errors)).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle very long input values', async () => {
        // Arrange
        const longInputData = {
          email: 'a'.repeat(1000) + '@example.com',
          password: 'b'.repeat(1000)
        };
        loginService.login.mockResolvedValue(mockLoginResponse);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/login')
          .send(longInputData);

        // Assert
        expect(response.status).toBe(200);
        expect(loginService.login).toHaveBeenCalledWith(longInputData);
      });

      it('should handle special characters in input', async () => {
        // Arrange
        const specialCharData = {
          email: 'seller+test@example.com',
          password: 'p@ssw0rd!@#$%^&*()'
        };
        loginService.login.mockResolvedValue(mockLoginResponse);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/login')
          .send(specialCharData);

        // Assert
        expect(response.status).toBe(200);
        expect(loginService.login).toHaveBeenCalledWith(specialCharData);
      });

      it('should handle unicode characters in input', async () => {
        // Arrange
        const unicodeData = {
          email: 'séller@éxample.com',
          password: 'pássw0rd'
        };
        loginService.login.mockResolvedValue(mockLoginResponse);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/login')
          .send(unicodeData);

        // Assert
        expect(response.status).toBe(200);
        expect(loginService.login).toHaveBeenCalledWith(unicodeData);
      });
    });
  });
});
