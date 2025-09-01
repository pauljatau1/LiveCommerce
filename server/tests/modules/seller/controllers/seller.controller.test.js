const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app and service
const { app } = require('@/app');
const registerService = require('@modules/seller/services/register.service');

// Mock the register service
jest.mock('@modules/seller/services/register.service');

describe('Seller Controller', () => {
  let mongoServer;

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
      phoneNumber: '1234567890',
      storeName: 'John Store'
    };

    const mockSellerResponse = {
      user: {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '1234567890',
        storeName: 'John Store',
        agoraUid: 123456789,
        emailVerified: false,
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    };

    it('should successfully register a new seller', async () => {
      registerService.register.mockResolvedValue(mockSellerResponse);

      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Seller registered successfully');
      expect(response.body.data).toEqual(mockSellerResponse);
      expect(registerService.register).toHaveBeenCalledWith(validRegistrationData);
    });

    it('should return 422 for validation errors', async () => {
      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'firstName', message: 'First name is required' },
        { field: 'email', message: 'Please provide a valid email address' }
      ]);
      registerService.register.mockRejectedValue(validationError);

      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send({
          firstName: '',
          lastName: 'Doe',
          email: 'invalid-email',
          password: '123',
          phoneNumber: '123',
          storeName: ''
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 422 when email already exists', async () => {
      const ValidationError = require('@utils/errors/ValidationError');
      const emailExistsError = new ValidationError([{ field: 'email', message: 'Email is already in use.' }]);
      registerService.register.mockRejectedValue(emailExistsError);

      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send(validRegistrationData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 500 for internal server errors', async () => {
      const serverError = new Error('Database connection failed');
      registerService.register.mockRejectedValue(serverError);

      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send(validRegistrationData)
        .expect(500);

      expect(response.body.error).toBe('Something went wrong!');
    });

    it('should handle missing required fields', async () => {
      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'lastName', message: 'Last name is required' },
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' },
        { field: 'phoneNumber', message: 'Phone number is required' },
        { field: 'storeName', message: 'Store name is required' }
      ]);
      registerService.register.mockRejectedValue(validationError);

      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send({
          firstName: 'John',
          // Missing other required fields
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/v2/sellers/register')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid JSON in request body');
    });

    it('should handle empty request body', async () => {
      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'firstName', message: 'First name is required' },
        { field: 'lastName', message: 'Last name is required' },
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' },
        { field: 'phoneNumber', message: 'Phone number is required' },
        { field: 'storeName', message: 'Store name is required' }
      ]);
      registerService.register.mockRejectedValue(validationError);

      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send({})
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should handle whitespace in input fields', async () => {
      const dataWithWhitespace = {
        firstName: '  John  ',
        lastName: '  Doe  ',
        email: '  john.doe@example.com  ',
        password: 'password123',
        phoneNumber: '  1234567890  ',
        storeName: '  John Store  '
      };

      registerService.register.mockResolvedValue(mockSellerResponse);

      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send(dataWithWhitespace)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(registerService.register).toHaveBeenCalledWith(dataWithWhitespace);
    });

    it('should handle service throwing generic errors', async () => {
      const genericError = new Error('Something went wrong in service');
      registerService.register.mockRejectedValue(genericError);

      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send(validRegistrationData)
        .expect(500);

      expect(response.body.error).toBe('Something went wrong!');
    });

    it('should handle service throwing errors with status codes', async () => {
      const errorWithStatus = new Error('Custom error');
      errorWithStatus.status = 401;
      registerService.register.mockRejectedValue(errorWithStatus);

      const response = await request(app)
        .post('/api/v2/sellers/register')
        .send(validRegistrationData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Custom error');
    });

    describe('request validation', () => {
      it('should validate firstName field', async () => {
        const ValidationError = require('@utils/errors/ValidationError');
        const validationError = new ValidationError([
          { field: 'firstName', message: 'First name is required' }
        ]);
        registerService.register.mockRejectedValue(validationError);

        const invalidData = {
          ...validRegistrationData,
          firstName: ''
        };

        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send(invalidData)
          .expect(422);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('should validate lastName field', async () => {
        const ValidationError = require('@utils/errors/ValidationError');
        const validationError = new ValidationError([
          { field: 'lastName', message: 'Last name is required' }
        ]);
        registerService.register.mockRejectedValue(validationError);

        const invalidData = {
          ...validRegistrationData,
          lastName: ''
        };

        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send(invalidData)
          .expect(422);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('should validate email field', async () => {
        const ValidationError = require('@utils/errors/ValidationError');
        const validationError = new ValidationError([
          { field: 'email', message: 'Please provide a valid email address' }
        ]);
        registerService.register.mockRejectedValue(validationError);

        const invalidData = {
          ...validRegistrationData,
          email: 'invalid-email'
        };

        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send(invalidData)
          .expect(422);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('should validate password field', async () => {
        const ValidationError = require('@utils/errors/ValidationError');
        const validationError = new ValidationError([
          { field: 'password', message: 'Password must be at least 6 characters long' }
        ]);
        registerService.register.mockRejectedValue(validationError);

        const invalidData = {
          ...validRegistrationData,
          password: '123'
        };

        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send(invalidData)
          .expect(422);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('should validate phoneNumber field', async () => {
        const ValidationError = require('@utils/errors/ValidationError');
        const validationError = new ValidationError([
          { field: 'phoneNumber', message: 'Phone number must be at least 10 characters long' }
        ]);
        registerService.register.mockRejectedValue(validationError);

        const invalidData = {
          ...validRegistrationData,
          phoneNumber: '123'
        };

        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send(invalidData)
          .expect(422);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('should validate storeName field', async () => {
        const ValidationError = require('@utils/errors/ValidationError');
        const validationError = new ValidationError([
          { field: 'storeName', message: 'Store name is required' }
        ]);
        registerService.register.mockRejectedValue(validationError);

        const invalidData = {
          ...validRegistrationData,
          storeName: ''
        };

        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send(invalidData)
          .expect(422);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });
    });

    describe('response format', () => {
      it('should return correct response structure on success', async () => {
        registerService.register.mockResolvedValue(mockSellerResponse);

        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send(validRegistrationData)
          .expect(201);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Seller registered successfully');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data.user).toHaveProperty('_id');
        expect(response.body.data.user).toHaveProperty('firstName');
        expect(response.body.data.user).toHaveProperty('lastName');
        expect(response.body.data.user).toHaveProperty('email');
        expect(response.body.data.user).toHaveProperty('phoneNumber');
        expect(response.body.data.user).toHaveProperty('storeName');
        expect(response.body.data.user).toHaveProperty('agoraUid');
        expect(response.body.data.user).toHaveProperty('emailVerified');
        expect(response.body.data.user).toHaveProperty('createdAt');
      });

      it('should return correct error response structure', async () => {
        const ValidationError = require('@utils/errors/ValidationError');
        const validationError = new ValidationError([
          { field: 'firstName', message: 'First name is required' }
        ]);
        registerService.register.mockRejectedValue(validationError);

        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send({ firstName: '' })
          .expect(422);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('errors');
        expect(Array.isArray(response.body.errors)).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle very long input values', async () => {
        const ValidationError = require('@utils/errors/ValidationError');
        const validationError = new ValidationError([
          { field: 'firstName', message: 'First name must not exceed 50 characters' },
          { field: 'lastName', message: 'Last name must not exceed 50 characters' },
          { field: 'phoneNumber', message: 'Phone number must not exceed 15 characters' },
          { field: 'storeName', message: 'Store name must not exceed 100 characters' }
        ]);
        registerService.register.mockRejectedValue(validationError);

        const longData = {
          firstName: 'A'.repeat(51),
          lastName: 'B'.repeat(51),
          email: 'a'.repeat(250) + '@example.com',
          password: 'password123',
          phoneNumber: '1'.repeat(16),
          storeName: 'C'.repeat(101)
        };

        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send(longData)
          .expect(422);

        expect(response.body.success).toBe(false);
      });

      it('should handle special characters in input', async () => {
        const specialCharData = {
          firstName: 'John!@#$%',
          lastName: 'Doe&*()',
          email: 'john.doe+test@example.com',
          password: 'password123',
          phoneNumber: '+1-234-567-8900',
          storeName: 'John\'s Store & More!'
        };

        registerService.register.mockResolvedValue(mockSellerResponse);

        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send(specialCharData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(registerService.register).toHaveBeenCalledWith(specialCharData);
      });

      it('should handle unicode characters in input', async () => {
        const unicodeData = {
          firstName: 'José',
          lastName: 'García',
          email: 'jose.garcia@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
          storeName: 'José\'s Store'
        };

        registerService.register.mockResolvedValue(mockSellerResponse);

        const response = await request(app)
          .post('/api/v2/sellers/register')
          .send(unicodeData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(registerService.register).toHaveBeenCalledWith(unicodeData);
      });
    });
  });
});
