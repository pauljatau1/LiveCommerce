const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Mock the register service
jest.mock('@modules/seller/services/register.service', () => ({
  register: jest.fn()
}));

// Import the mocked service
const registerService = require('@modules/seller/services/register.service');

const ValidationError = require('@utils/errors/ValidationError');

let mongoServer;

describe('Seller Controller - Register', () => {
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

  describe('POST /api/v2/sellers/register', () => {
    const validRegistrationData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      phoneNumber: '+2348012345678',
      storeName: "John's Store"
    };

    const mockSellerResponse = {
      user: {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+2348012345678',
        storeName: "John's Store",
        agoraUid: 123456789,
        emailVerified: false,
        createdAt: new Date().toISOString()
      },
      token: 'mock-jwt-token'
    };

    it('should successfully register a new seller', async () => {
      // Arrange
      registerService.register.mockResolvedValue(mockSellerResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send(validRegistrationData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: 'Seller registered successfully',
        data: mockSellerResponse,
        pagination: null
      });
      expect(registerService.register).toHaveBeenCalledWith(validRegistrationData);
    });

    it('should return 422 for validation errors', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email is required' }
      ]);
      registerService.register.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send({ firstName: 'John' });

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

    it('should return 422 when email already exists', async () => {
      // Arrange
      const emailExistsError = new ValidationError([
        { field: 'email', message: 'Email is already in use.' }
      ]);
      registerService.register.mockRejectedValue(emailExistsError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send(validRegistrationData);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 500 for internal server errors', async () => {
      // Arrange
      const serverError = new Error('Database connection failed');
      registerService.register.mockRejectedValue(serverError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send(validRegistrationData);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Something went wrong!');
    });

    it('should handle missing required fields', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'firstName', message: 'First name is required' },
        { field: 'email', message: 'Email is required' }
      ]);
      registerService.register.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send({ lastName: 'Doe' });

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toHaveLength(2);
    });

    it('should handle invalid JSON in request body', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/sellers/register')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      // Assert
      expect(response.status).toBe(400);
    });

    it('should handle empty request body', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'firstName', message: 'First name is required' },
        { field: 'lastName', message: 'Last name is required' },
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' },
        { field: 'phoneNumber', message: 'Phone number is required' },
        { field: 'storeName', message: 'Store name is required' }
      ]);
      registerService.register.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send();

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should handle whitespace in input fields', async () => {
      // Arrange
      const dataWithWhitespace = {
        firstName: '  John  ',
        lastName: '  Doe  ',
        email: '  john.doe@example.com  ',
        password: '  password123  ',
        phoneNumber: '  +2348012345678  ',
        storeName: "  John's Store  "
      };
      registerService.register.mockResolvedValue(mockSellerResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send(dataWithWhitespace);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(registerService.register).toHaveBeenCalledWith(dataWithWhitespace);
    });

    it('should handle service throwing generic errors', async () => {
      // Arrange
      const genericError = new Error('Generic error');
      registerService.register.mockRejectedValue(genericError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send(validRegistrationData);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Something went wrong!');
    });

    it('should handle service throwing errors with status codes', async () => {
      // Arrange
      const errorWithStatus = new Error('Custom error');
      errorWithStatus.status = 401;
      registerService.register.mockRejectedValue(errorWithStatus);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send(validRegistrationData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Custom error');
    });

    describe('request validation', () => {
      it('should validate firstName field', async () => {
        // Arrange
        const validationError = new ValidationError([
          { field: 'firstName', message: 'First name is required' }
        ]);
        registerService.register.mockRejectedValue(validationError);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send({ lastName: 'Doe', email: 'john@example.com' });

        // Assert
        expect(response.status).toBe(422);
        expect(response.body.errors[0].field).toBe('firstName');
      });

      it('should validate lastName field', async () => {
        // Arrange
        const validationError = new ValidationError([
          { field: 'lastName', message: 'Last name is required' }
        ]);
        registerService.register.mockRejectedValue(validationError);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send({ firstName: 'John', email: 'john@example.com' });

        // Assert
        expect(response.status).toBe(422);
        expect(response.body.errors[0].field).toBe('lastName');
      });

      it('should validate email field', async () => {
        // Arrange
        const validationError = new ValidationError([
          { field: 'email', message: 'Email is required' }
        ]);
        registerService.register.mockRejectedValue(validationError);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send({ firstName: 'John', lastName: 'Doe' });

        // Assert
        expect(response.status).toBe(422);
        expect(response.body.errors[0].field).toBe('email');
      });

      it('should validate password field', async () => {
        // Arrange
        const validationError = new ValidationError([
          { field: 'password', message: 'Password is required' }
        ]);
        registerService.register.mockRejectedValue(validationError);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send({ firstName: 'John', lastName: 'Doe', email: 'john@example.com' });

        // Assert
        expect(response.status).toBe(422);
        expect(response.body.errors[0].field).toBe('password');
      });

      it('should validate phoneNumber field', async () => {
        // Arrange
        const validationError = new ValidationError([
          { field: 'phoneNumber', message: 'Phone number is required' }
        ]);
        registerService.register.mockRejectedValue(validationError);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send({ firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'password123' });

        // Assert
        expect(response.status).toBe(422);
        expect(response.body.errors[0].field).toBe('phoneNumber');
      });

      it('should validate storeName field', async () => {
        // Arrange
        const validationError = new ValidationError([
          { field: 'storeName', message: 'Store name is required' }
        ]);
        registerService.register.mockRejectedValue(validationError);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send({ firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'password123', phoneNumber: '+2348012345678' });

        // Assert
        expect(response.status).toBe(422);
        expect(response.body.errors[0].field).toBe('storeName');
      });
    });

    describe('response format', () => {
      it('should return correct response structure on success', async () => {
        // Arrange
        registerService.register.mockResolvedValue(mockSellerResponse);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send(validRegistrationData);

        // Assert
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Seller registered successfully');
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
        registerService.register.mockRejectedValue(validationError);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send({ firstName: 'John' });

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
          firstName: 'a'.repeat(1000),
          lastName: 'b'.repeat(1000),
          email: 'c'.repeat(1000) + '@example.com',
          password: 'd'.repeat(1000),
          phoneNumber: '+2348012345678',
          storeName: 'e'.repeat(1000)
        };
        registerService.register.mockResolvedValue(mockSellerResponse);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send(longInputData);

        // Assert
        expect(response.status).toBe(201);
        expect(registerService.register).toHaveBeenCalledWith(longInputData);
      });

      it('should handle special characters in input', async () => {
        // Arrange
        const specialCharData = {
          firstName: 'Jöhn',
          lastName: 'Döe',
          email: 'john+test@example.com',
          password: 'p@ssw0rd!@#$%^&*()',
          phoneNumber: '+234-801-234-5678',
          storeName: "John's Store & More!"
        };
        registerService.register.mockResolvedValue(mockSellerResponse);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send(specialCharData);

        // Assert
        expect(response.status).toBe(201);
        expect(registerService.register).toHaveBeenCalledWith(specialCharData);
      });

      it('should handle unicode characters in input', async () => {
        // Arrange
        const unicodeData = {
          firstName: 'José',
          lastName: 'García',
          email: 'josé.garcía@example.com',
          password: 'pássw0rd',
          phoneNumber: '+2348012345678',
          storeName: 'Tienda de José'
        };
        registerService.register.mockResolvedValue(mockSellerResponse);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send(unicodeData);

        // Assert
        expect(response.status).toBe(201);
        expect(registerService.register).toHaveBeenCalledWith(unicodeData);
      });
    });
  });
});
