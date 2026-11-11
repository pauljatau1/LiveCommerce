// Controller contract tests; persistent IP/email quotas are exercised in passwordResetLimit.test.js.
jest.mock('@/middlewares/passwordResetLimit', () => (req, res, next) => next());
const request = require('supertest');

// Import the app without starting the server
const { app } = require('@/app');

// Mock the resendOTP service
jest.mock('@modules/seller/services/resendOTP.service', () => ({
  resendOTP: jest.fn()
}));

// Import the mocked service
const resendOTPService = require('@modules/seller/services/resendOTP.service');

const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

describe('Seller Controller - Resend OTP', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v2/sellers/resend-otp', () => {
    const validResendOTPData = {
      email: 'seller@example.com'
    };

    const mockResendOTPResponse = {
      message: 'OTP resent successfully'
    };

    it('should successfully resend OTP with valid email', async () => {
      // Arrange
      resendOTPService.resendOTP.mockResolvedValue(mockResendOTPResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send(validResendOTPData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'OTP resent successfully',
        data: mockResendOTPResponse,
        pagination: null
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(validResendOTPData.email);
    });

    it('should return 422 for validation errors', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email is required' }
      ]);
      resendOTPService.resendOTP.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send({});

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' }
        ]
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(undefined);
    });

    it('should return 422 for invalid email format', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email must be a valid email address' }
      ]);
      resendOTPService.resendOTP.mockRejectedValue(validationError);

      const invalidData = {
        email: 'invalid-email'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send(invalidData);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email must be a valid email address' }
        ]
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(invalidData.email);
    });

    it('should return 404 when seller not found', async () => {
      // Arrange
      const notFoundError = new NotFoundException('Seller not found');
      resendOTPService.resendOTP.mockRejectedValue(notFoundError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send(validResendOTPData);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: 'Seller not found'
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(validResendOTPData.email);
    });

    it('should return 500 for database errors', async () => {
      // Arrange
      const databaseError = new Error('Database connection failed');
      resendOTPService.resendOTP.mockRejectedValue(databaseError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send(validResendOTPData);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(validResendOTPData.email);
    });

    it('should return 500 for email sending errors', async () => {
      // Arrange
      const emailError = new Error('Failed to send email');
      resendOTPService.resendOTP.mockRejectedValue(emailError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send(validResendOTPData);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(validResendOTPData.email);
    });

    it('should handle missing email field', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email is required' }
      ]);
      resendOTPService.resendOTP.mockRejectedValue(validationError);

      const missingEmailData = {};

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send(missingEmailData);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' }
        ]
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(undefined);
    });

    it('should handle empty email string', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email is required' }
      ]);
      resendOTPService.resendOTP.mockRejectedValue(validationError);

      const emptyEmailData = {
        email: ''
      };

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send(emptyEmailData);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' }
        ]
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith('');
    });

    it('should handle null email', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email is required' }
      ]);
      resendOTPService.resendOTP.mockRejectedValue(validationError);

      const nullEmailData = {
        email: null
      };

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send(nullEmailData);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' }
        ]
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(null);
    });

    it('should handle undefined email', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email is required' }
      ]);
      resendOTPService.resendOTP.mockRejectedValue(validationError);

      const undefinedEmailData = {
        email: undefined
      };

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send(undefinedEmailData);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' }
        ]
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(undefined);
    });

    it('should handle non-string email types', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email must be a string' }
      ]);
      resendOTPService.resendOTP.mockRejectedValue(validationError);

      const nonStringEmailData = {
        email: 123
      };

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send(nonStringEmailData);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email must be a string' }
        ]
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(123);
    });

    it('should handle email without @ symbol', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email must be a valid email address' }
      ]);
      resendOTPService.resendOTP.mockRejectedValue(validationError);

      const invalidEmailData = {
        email: 'invalidemail.com'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send(invalidEmailData);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email must be a valid email address' }
        ]
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(invalidEmailData.email);
    });

    it('should handle email with multiple @ symbols', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email must be a valid email address' }
      ]);
      resendOTPService.resendOTP.mockRejectedValue(validationError);

      const invalidEmailData = {
        email: 'test@@example.com'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send(invalidEmailData);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email must be a valid email address' }
        ]
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(invalidEmailData.email);
    });

    it('should handle email starting with @', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email must be a valid email address' }
      ]);
      resendOTPService.resendOTP.mockRejectedValue(validationError);

      const invalidEmailData = {
        email: '@example.com'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send(invalidEmailData);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email must be a valid email address' }
        ]
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(invalidEmailData.email);
    });

    it('should handle email ending with @', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email must be a valid email address' }
      ]);
      resendOTPService.resendOTP.mockRejectedValue(validationError);

      const invalidEmailData = {
        email: 'test@'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send(invalidEmailData);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email must be a valid email address' }
        ]
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(invalidEmailData.email);
    });

    it('should handle various valid email formats', async () => {
      // Arrange
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        '123@numbers.com',
        'user-name@subdomain.example.com',
        'user_name@example.com',
        'user@example-domain.com'
      ];

      for (const email of validEmails) {
        resendOTPService.resendOTP.mockResolvedValue(mockResendOTPResponse);

        // Act
        const response = await request(app)
          .post('/api/v2/sellers/resend-otp')
          .send({ email });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(resendOTPService.resendOTP).toHaveBeenCalledWith(email);
      }
    });

    it('should handle request with extra fields gracefully', async () => {
      // Arrange
      resendOTPService.resendOTP.mockResolvedValue(mockResendOTPResponse);

      const dataWithExtraFields = {
        email: 'seller@example.com',
        extraField: 'extra value',
        anotherField: 123
      };

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send(dataWithExtraFields);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'OTP resent successfully',
        data: mockResendOTPResponse,
        pagination: null
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(dataWithExtraFields.email);
    });

    it('should handle malformed JSON gracefully', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .set('Content-Type', 'application/json')
        .send('{"email": "seller@example.com"'); // Malformed JSON

      // Assert
      expect(response.status).toBe(400);
      expect(resendOTPService.resendOTP).not.toHaveBeenCalled();
    });

    it('should handle empty request body', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'email', message: 'Email is required' }
      ]);
      resendOTPService.resendOTP.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/sellers/resend-otp')
        .send({});

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' }
        ]
      });
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(undefined);
    });
  });
});
