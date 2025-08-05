const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Import the Buyer model
const Buyer = require('@modules/buyer/models/buyer.model');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the resetPassword service
jest.mock('@modules/buyer/services/resetPassword.service');

const resetPasswordService = require('@modules/buyer/services/resetPassword.service');

let mongoServer;

describe('resetPassword.controller', () => {
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

  describe('POST /api/v2/buyers/reset-password', () => {
    it('should return 200 when reset password request is successful', async () => {
      // Arrange
      const requestData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };
      const serviceResponse = { message: 'Password reset successfully' };
      resetPasswordService.resetPassword.mockResolvedValue(serviceResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/reset-password')
        .send(requestData)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Password reset successfully',
        data: { message: 'Password reset successfully' },
        pagination: null
      });
      expect(resetPasswordService.resetPassword).toHaveBeenCalledWith(requestData);
    });

    it('should return 422 when validation fails', async () => {
      // Arrange
      const requestData = {
        email: 'invalid-email',
        otp: '123',
        newPassword: 'weak'
      };
      const validationError = new ValidationError([
        { field: 'email', message: 'Invalid email format' },
        { field: 'otp', message: 'OTP must be a 4-digit number' },
        { field: 'newPassword', message: 'Password must be at least 6 characters long' }
      ]);
      resetPasswordService.resetPassword.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/reset-password')
        .send(requestData)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'otp', message: 'OTP must be a 4-digit number' },
          { field: 'newPassword', message: 'Password must be at least 6 characters long' }
        ]
      });
    });

    it('should return 500 when service throws generic error', async () => {
      // Arrange
      const requestData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };
      const serviceError = new Error('Database connection failed');
      resetPasswordService.resetPassword.mockRejectedValue(serviceError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/reset-password')
        .send(requestData)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should return 400 when email is missing', async () => {
      // Arrange
      const requestData = {
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };
      const validationError = new ValidationError([
        { field: 'email', message: 'Email is required' }
      ]);
      resetPasswordService.resetPassword.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/reset-password')
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

    it('should return 422 when OTP is invalid', async () => {
      // Arrange
      const requestData = {
        email: 'john.doe@example.com',
        otp: 'abcd',
        newPassword: 'newSecurePassword123'
      };
      const validationError = new ValidationError([
        { field: 'otp', message: 'OTP must be a 4-digit number' }
      ]);
      resetPasswordService.resetPassword.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/reset-password')
        .send(requestData)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'otp', message: 'OTP must be a 4-digit number' }
        ]
      });
    });

    it('should return 422 when password is too weak', async () => {
      // Arrange
      const requestData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: '123456'
      };
      const validationError = new ValidationError([
        { field: 'newPassword', message: 'Password must contain at least one letter and one number' }
      ]);
      resetPasswordService.resetPassword.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/reset-password')
        .send(requestData)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'newPassword', message: 'Password must contain at least one letter and one number' }
        ]
      });
    });

    it('should return 422 when OTP has expired', async () => {
      // Arrange
      const requestData = {
        email: 'john.doe@example.com',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };
      const validationError = new ValidationError([
        { field: 'otp', message: 'Reset code has expired' }
      ]);
      resetPasswordService.resetPassword.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/reset-password')
        .send(requestData)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'otp', message: 'Reset code has expired' }
        ]
      });
    });

    it('should return 422 when OTP does not match', async () => {
      // Arrange
      const requestData = {
        email: 'john.doe@example.com',
        otp: '5678',
        newPassword: 'newSecurePassword123'
      };
      const validationError = new ValidationError([
        { field: 'otp', message: 'Invalid reset code' }
      ]);
      resetPasswordService.resetPassword.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/reset-password')
        .send(requestData)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'otp', message: 'Invalid reset code' }
        ]
      });
    });

    it('should return 422 when buyer does not exist', async () => {
      // Arrange
      const requestData = {
        email: 'nonexistent@example.com',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };
      const validationError = new ValidationError([
        { field: 'email', message: 'No account found with this email' }
      ]);
      resetPasswordService.resetPassword.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/reset-password')
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

    it('should handle case insensitive email matching', async () => {
      // Arrange
      const requestData = {
        email: 'JOHN.DOE@EXAMPLE.COM',
        otp: '1234',
        newPassword: 'newSecurePassword123'
      };
      const serviceResponse = { message: 'Password reset successfully' };
      resetPasswordService.resetPassword.mockResolvedValue(serviceResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/reset-password')
        .send(requestData)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Password reset successfully',
        data: { message: 'Password reset successfully' },
        pagination: null
      });
      expect(resetPasswordService.resetPassword).toHaveBeenCalledWith(requestData);
    });
  });
}); 