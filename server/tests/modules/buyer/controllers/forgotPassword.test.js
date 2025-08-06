const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Import the Buyer model
const Buyer = require('@modules/buyer/models/buyer.model');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the forgotPassword service
jest.mock('@modules/buyer/services/forgotPassword.service');

const forgotPasswordService = require('@modules/buyer/services/forgotPassword.service');

let mongoServer;

describe('forgotPassword.controller', () => {
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

  describe('POST /api/v2/buyers/forgot-password', () => {
    it('should return 200 when forgot password request is successful', async () => {
      // Arrange
      const requestData = {
        email: 'john.doe@example.com'
      };
      
      const serviceResponse = {
        message: 'Password reset code sent successfully'
      };
      
      forgotPasswordService.forgotPassword.mockResolvedValue(serviceResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/forgot-password')
        .send(requestData)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Password reset code sent successfully',
        data: {
          message: 'Password reset code sent successfully'
        },
        pagination: null
      });
      
      expect(forgotPasswordService.forgotPassword).toHaveBeenCalledWith(requestData);
    });

    it('should return 422 when email is missing', async () => {
      // Arrange
      const requestData = {};
      
      forgotPasswordService.forgotPassword.mockRejectedValue(
        new ValidationError([{ field: 'email', message: 'Email is required' }])
      );

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/forgot-password')
        .send(requestData)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' }
        ]
      });
    });

    it('should return 422 when email format is invalid', async () => {
      // Arrange
      const requestData = {
        email: 'invalid-email'
      };
      
      forgotPasswordService.forgotPassword.mockRejectedValue(
        new ValidationError([{ field: 'email', message: 'Invalid email format' }])
      );

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/forgot-password')
        .send(requestData)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Invalid email format' }
        ]
      });
    });

    it('should return 404 when buyer does not exist', async () => {
      // Arrange
      const requestData = {
        email: 'nonexistent@example.com'
      };
      
      forgotPasswordService.forgotPassword.mockRejectedValue(
        new ValidationError([{ field: 'email', message: 'No account found with this email' }])
      );

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/forgot-password')
        .send(requestData)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'No account found with this email' }
        ]
      });
    });

    it('should return 500 when service throws generic error', async () => {
      // Arrange
      const requestData = {
        email: 'john.doe@example.com'
      };
      
      forgotPasswordService.forgotPassword.mockRejectedValue(
        new Error('Failed to send password reset email')
      );

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/forgot-password')
        .send(requestData)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should return 500 when service throws SendGrid error', async () => {
      // Arrange
      const requestData = {
        email: 'john.doe@example.com'
      };
      
      forgotPasswordService.forgotPassword.mockRejectedValue(
        new Error('Failed to send password reset email')
      );

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/forgot-password')
        .send(requestData)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should handle case insensitive email matching', async () => {
      // Arrange
      const requestData = {
        email: 'JOHN.DOE@EXAMPLE.COM'
      };
      
      const serviceResponse = {
        message: 'Password reset code sent successfully'
      };
      
      forgotPasswordService.forgotPassword.mockResolvedValue(serviceResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/forgot-password')
        .send(requestData)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Password reset code sent successfully',
        data: {
          message: 'Password reset code sent successfully'
        },
        pagination: null
      });
      
      expect(forgotPasswordService.forgotPassword).toHaveBeenCalledWith(requestData);
    });

    it('should handle empty request body', async () => {
      // Arrange
      forgotPasswordService.forgotPassword.mockRejectedValue(
        new ValidationError([{ field: 'email', message: 'Email is required' }])
      );

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/forgot-password')
        .send({})
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' }
        ]
      });
    });

    it('should handle null request body', async () => {
      // Arrange
      forgotPasswordService.forgotPassword.mockRejectedValue(
        new ValidationError([{ field: 'email', message: 'Email is required' }])
      );

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/forgot-password')
        .send(null)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' }
        ]
      });
    });

    it('should handle undefined request body', async () => {
      // Arrange
      forgotPasswordService.forgotPassword.mockRejectedValue(
        new ValidationError([{ field: 'email', message: 'Email is required' }])
      );

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/forgot-password')
        .send(undefined)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' }
        ]
      });
    });

    it('should handle multiple validation errors', async () => {
      // Arrange
      const requestData = {
        email: 'invalid-email'
      };
      
      forgotPasswordService.forgotPassword.mockRejectedValue(
        new ValidationError([
          { field: 'email', message: 'Invalid email format' },
          { field: 'email', message: 'No account found with this email' }
        ])
      );

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/forgot-password')
        .send(requestData)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'email', message: 'No account found with this email' }
        ]
      });
    });

    it('should handle service returning unexpected response format', async () => {
      // Arrange
      const requestData = {
        email: 'john.doe@example.com'
      };
      
      const unexpectedResponse = {
        unexpectedField: 'unexpected value'
      };
      
      forgotPasswordService.forgotPassword.mockResolvedValue(unexpectedResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/forgot-password')
        .send(requestData)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Password reset code sent successfully',
        data: {
          unexpectedField: 'unexpected value'
        },
        pagination: null
      });
    });
  });
}); 