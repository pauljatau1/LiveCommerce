const request = require('supertest');

// Import the app without starting the server
const { app } = require('@/app');

// Mock the verifyOTP service
jest.mock('@modules/seller/services/verifyOTP.service', () => ({
  verifyOTP: jest.fn()
}));

// Import the mocked service
const verifyOTPService = require('@modules/seller/services/verifyOTP.service');

const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

describe('Seller Controller - Verify OTP', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v2/sellers/verify-otp', () => {
    const validVerifyOTPData = {
      email: 'seller@example.com',
      otp: '1234'
    };

    const mockVerifyOTPResponse = {
      success: true,
      message: 'Email verified successfully.',
      user: {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'seller@example.com',
        emailVerified: true,
        storeName: 'John\'s Store'
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    };

    it('should successfully verify OTP and return formatted response', async () => {
      // Arrange: Mock successful service response
      verifyOTPService.verifyOTP.mockResolvedValue(mockVerifyOTPResponse);

      // Act: Make request to verify OTP endpoint
      const response = await request(app)
        .post('/api/v2/sellers/verify-otp')
        .send(validVerifyOTPData)
        .expect(200);

      // Assert: Verify response structure and content
      expect(response.body).toMatchObject({
        success: true,
        message: 'Email verified successfully',
        data: mockVerifyOTPResponse,
        pagination: null
      });

      // Assert: Verify service was called with correct parameters
      expect(verifyOTPService.verifyOTP).toHaveBeenCalledWith(
        validVerifyOTPData.email,
        validVerifyOTPData.otp
      );
      expect(verifyOTPService.verifyOTP).toHaveBeenCalledTimes(1);
    });

    it('should handle request with numeric OTP', async () => {
      // Arrange: Prepare request with numeric OTP
      const requestData = {
        email: 'seller@example.com',
        otp: 1234
      };

      verifyOTPService.verifyOTP.mockResolvedValue(mockVerifyOTPResponse);

      // Act: Make request with numeric OTP
      const response = await request(app)
        .post('/api/v2/sellers/verify-otp')
        .send(requestData)
        .expect(200);

      // Assert: Verify response
      expect(response.body.success).toBe(true);
      expect(verifyOTPService.verifyOTP).toHaveBeenCalledWith(
        requestData.email,
        requestData.otp
      );
    });

    it('should handle ValidationError from service', async () => {
      // Arrange: Mock ValidationError from service
      const validationError = new ValidationError([
        { field: 'otp', message: 'Invalid OTP' }
      ]);
      verifyOTPService.verifyOTP.mockRejectedValue(validationError);

      // Act: Make request with invalid OTP
      const response = await request(app)
        .post('/api/v2/sellers/verify-otp')
        .send(validVerifyOTPData)
        .expect(422);

      // Assert: Verify error response
      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'otp', message: 'Invalid OTP' }
        ]
      });

      expect(verifyOTPService.verifyOTP).toHaveBeenCalledWith(
        validVerifyOTPData.email,
        validVerifyOTPData.otp
      );
    });

    it('should handle NotFoundException from service', async () => {
      // Arrange: Mock NotFoundException from service
      const notFoundError = new NotFoundException('Seller not found');
      verifyOTPService.verifyOTP.mockRejectedValue(notFoundError);

      // Act: Make request with non-existent email
      const response = await request(app)
        .post('/api/v2/sellers/verify-otp')
        .send(validVerifyOTPData)
        .expect(404);

      // Assert: Verify error response
      expect(response.body).toMatchObject({
        success: false,
        message: 'Seller not found'
      });

      expect(verifyOTPService.verifyOTP).toHaveBeenCalledWith(
        validVerifyOTPData.email,
        validVerifyOTPData.otp
      );
    });

    it('should handle request with missing email', async () => {
      // Arrange: Prepare request without email
      const invalidData = {
        otp: '1234'
      };

      const validationError = new ValidationError([
        { field: 'email', message: 'Email is required' }
      ]);
      verifyOTPService.verifyOTP.mockRejectedValue(validationError);

      // Act: Make request without email
      const response = await request(app)
        .post('/api/v2/sellers/verify-otp')
        .send(invalidData)
        .expect(422);

      // Assert: Verify error response
      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' }
        ]
      });
    });

    it('should handle request with missing OTP', async () => {
      // Arrange: Prepare request without OTP
      const invalidData = {
        email: 'seller@example.com'
      };

      const validationError = new ValidationError([
        { field: 'otp', message: 'OTP is required' }
      ]);
      verifyOTPService.verifyOTP.mockRejectedValue(validationError);

      // Act: Make request without OTP
      const response = await request(app)
        .post('/api/v2/sellers/verify-otp')
        .send(invalidData)
        .expect(422);

      // Assert: Verify error response
      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'otp', message: 'OTP is required' }
        ]
      });
    });

    it('should handle request with empty body', async () => {
      // Arrange: Prepare empty request body
      const validationError = new ValidationError([
        { field: 'email', message: 'Email is required' },
        { field: 'otp', message: 'OTP is required' }
      ]);
      verifyOTPService.verifyOTP.mockRejectedValue(validationError);

      // Act: Make request with empty body
      const response = await request(app)
        .post('/api/v2/sellers/verify-otp')
        .send({})
        .expect(422);

      // Assert: Verify error response
      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' },
          { field: 'otp', message: 'OTP is required' }
        ]
      });
    });

    it('should handle generic Error from service', async () => {
      // Arrange: Mock generic error from service
      const genericError = new Error('Database connection failed');
      verifyOTPService.verifyOTP.mockRejectedValue(genericError);

      // Act: Make request
      const response = await request(app)
        .post('/api/v2/sellers/verify-otp')
        .send(validVerifyOTPData)
        .expect(500);

      // Assert: Verify error response
      expect(response.body).toMatchObject({
        error: 'Something went wrong!'
      });
    });

    it('should handle request with extra fields in body', async () => {
      // Arrange: Prepare request with extra fields
      const requestDataWithExtra = {
        email: 'seller@example.com',
        otp: '1234',
        extraField: 'should be ignored',
        anotherField: 123
      };

      verifyOTPService.verifyOTP.mockResolvedValue(mockVerifyOTPResponse);

      // Act: Make request with extra fields
      const response = await request(app)
        .post('/api/v2/sellers/verify-otp')
        .send(requestDataWithExtra)
        .expect(200);

      // Assert: Verify response
      expect(response.body.success).toBe(true);
      expect(verifyOTPService.verifyOTP).toHaveBeenCalledWith(
        requestDataWithExtra.email,
        requestDataWithExtra.otp
      );
    });

    it('should handle request with undefined body properties', async () => {
      // Arrange: Prepare request with undefined properties
      const requestDataWithUndefined = {
        email: undefined,
        otp: undefined
      };

      const validationError = new ValidationError([
        { field: 'email', message: 'Email is required' },
        { field: 'otp', message: 'OTP is required' }
      ]);
      verifyOTPService.verifyOTP.mockRejectedValue(validationError);

      // Act: Make request with undefined properties
      const response = await request(app)
        .post('/api/v2/sellers/verify-otp')
        .send(requestDataWithUndefined)
        .expect(422);

      // Assert: Verify error response
      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' },
          { field: 'otp', message: 'OTP is required' }
        ]
      });
    });
  });
});
