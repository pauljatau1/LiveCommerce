const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Import the Buyer model
const Buyer = require('@modules/buyer/models/buyer.model');

// Mock the OTP services
jest.mock('@modules/buyer/services/verifyOTP.service', () => ({
  verifyOTP: jest.fn()
}));

jest.mock('@modules/buyer/services/resendOTP.service', () => ({
  resendOTP: jest.fn()
}));

// Import the mocked services
const verifyOTPService = require('@modules/buyer/services/verifyOTP.service');
const resendOTPService = require('@modules/buyer/services/resendOTP.service');

// Mock Firebase
jest.mock('@firebase', () => ({
  saveToken: jest.fn(),
  getToken: jest.fn(),
}));

let mongoServer;

describe('Buyer Controller - OTP', () => {
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

  describe('verifyOTP', () => {
    it('should call verifyOTP service and return success response', async () => {
      // Arrange
      const mockReq = {
        body: {
          email: 'test@example.com',
          otp: '1234'
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = {
        message: 'Email verified successfully.',
        bonus: {
          coming: true,
          amount: 500,
          currency: 'NGN',
          timeToCredit: '10 seconds'
        }
      };

      verifyOTPService.verifyOTP.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.verifyOTP(mockReq, mockRes, mockNext);

      // Assert
      expect(verifyOTPService.verifyOTP).toHaveBeenCalledWith(
        mockReq.body.email,
        mockReq.body.otp
      );
      expect(mockRes.success).toHaveBeenCalledWith(mockServiceResponse, 'OTP verified successfully');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // Arrange
      const mockReq = {
        body: {
          email: 'test@example.com',
          otp: '1234'
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();
      const mockError = new Error('Service error');

      verifyOTPService.verifyOTP.mockRejectedValue(mockError);

      // Act
      await buyerController.verifyOTP(mockReq, mockRes, mockNext);

      // Assert
      expect(verifyOTPService.verifyOTP).toHaveBeenCalledWith(
        mockReq.body.email,
        mockReq.body.otp
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('resendOTP', () => {
    it('should call resendOTP service and return success response', async () => {
      // Arrange
      const mockReq = {
        body: {
          email: 'test@example.com'
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = {
        message: 'OTP resent successfully'
      };

      resendOTPService.resendOTP.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.resendOTP(mockReq, mockRes, mockNext);

      // Assert
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(mockReq.body.email);
      expect(mockRes.success).toHaveBeenCalledWith(mockServiceResponse, 'OTP resent successfully');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // Arrange
      const mockReq = {
        body: {
          email: 'test@example.com'
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();
      const mockError = new Error('Service error');

      resendOTPService.resendOTP.mockRejectedValue(mockError);

      // Act
      await buyerController.resendOTP(mockReq, mockRes, mockNext);

      // Assert
      expect(resendOTPService.resendOTP).toHaveBeenCalledWith(mockReq.body.email);
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('Integration Tests - OTP Endpoints', () => {
    describe('POST /api/v2/buyers/auth/verify-otp', () => {
      it('should verify OTP successfully via HTTP', async () => {
        const mockResponse = {
          message: 'Email verified successfully.',
          bonus: {
            coming: true,
            amount: 500,
            currency: 'NGN',
            timeToCredit: '10 seconds'
          }
        };

        verifyOTPService.verifyOTP.mockResolvedValue(mockResponse);

        const response = await request(app)
          .post('/api/v2/buyers/auth/verify-otp')
          .send({
            email: 'test@example.com',
            otp: '1234'
          })
          .expect(200);

        expect(verifyOTPService.verifyOTP).toHaveBeenCalledWith('test@example.com', '1234');
        expect(response.body).toEqual({
          success: true,
          data: mockResponse,
          message: 'OTP verified successfully',
          pagination: null
        });
      });

      it('should return 500 for service error via HTTP', async () => {
        const mockError = new Error('Service error');
        verifyOTPService.verifyOTP.mockRejectedValue(mockError);

        await request(app)
          .post('/api/v2/buyers/auth/verify-otp')
          .send({
            email: 'test@example.com',
            otp: '1234'
          })
          .expect(500);
      });
    });

    describe('POST /api/v2/buyers/auth/resend-otp', () => {
      it('should resend OTP successfully via HTTP', async () => {
        const mockResponse = {
          message: 'OTP resent successfully'
        };

        resendOTPService.resendOTP.mockResolvedValue(mockResponse);

        const response = await request(app)
          .post('/api/v2/buyers/auth/resend-otp')
          .send({
            email: 'test@example.com'
          })
          .expect(200);

        expect(resendOTPService.resendOTP).toHaveBeenCalledWith('test@example.com');
        expect(response.body).toEqual({
          success: true,
          data: mockResponse,
          message: 'OTP resent successfully',
          pagination: null
        });
      });

      it('should return 500 for service error via HTTP', async () => {
        const mockError = new Error('Service error');
        resendOTPService.resendOTP.mockRejectedValue(mockError);

        await request(app)
          .post('/api/v2/buyers/auth/resend-otp')
          .send({
            email: 'test@example.com'
          })
          .expect(500);
      });
    });
  });
}); 