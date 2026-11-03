/**
 * SmileID Callback Controller Tests
 *
 * This test suite validates the smileIdCallback controller functionality.
 * It ensures that the controller properly handles HTTP requests and responses,
 * delegates to the service layer, and handles errors correctly.
 *
 * Test Coverage:
 * - Successful callback processing
 * - Error handling for service failures
 * - Request/response handling
 * - HTTP status codes
 * - Response structure validation
 *
 * @module smileIdCallbackControllerTests
 */

const request = require('supertest');
const express = require('express');
const { smileIdCallback } = require('@modules/seller/controllers/seller.controller');
const smileIdCallbackService = require('@modules/seller/services/smileIdCallback.service');

// Mock the service
jest.mock('@modules/seller/services/smileIdCallback.service');

describe('SmileID Callback Controller', () => {
  let app;
  let validCallbackData;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Mock response.success method
    app.use((req, res, next) => {
      res.success = (data, message, statusCode = 200) => {
        res.status(statusCode).json({
          success: true,
          message: message,
          data: data,
          pagination: null
        });
      };
      next();
    });

    app.post('/callback', smileIdCallback);

    // Mock error handling middleware (must be after routes)
    app.use((err, req, res, next) => {
      let statusCode = 500;
      let message = err.message || 'Internal server error';
      let errors = null;

      // Handle ValidationError
      if (err.name === 'ValidationError' || err.errors) {
        statusCode = 422;
        message = 'Validation failed';
        errors = err.errors;
      }
      // Handle specific error messages
      else if (err.message === 'Seller not found') {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        message: message,
        errors: errors
      });
    });

    // Valid callback data
    validCallbackData = {
      job_id: 'job_123456789',
      user_id: 'user_123456789',
      partner_params: {
        seller_id: '507f1f77bcf86cd799439011',
        account_type: 'business'
      },
      ResultCode: '1012',
      ResultText: 'Success',
      job_complete: true,
      success: true,
      Images: ['image1.jpg', 'image2.jpg']
    };
  });

  describe('Successful callback processing', () => {
    it('should process callback successfully and return correct response', async () => {
      // Arrange
      const mockServiceResponse = {
        message: 'Callback received successfully',
        job_id: 'job_123456789',
        processed: true,
        assessment: {
          hasImages: true,
          resultCode: '1012',
          isSuccessful: true
        }
      };
      smileIdCallbackService.processSmileIdCallback.mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app)
        .post('/callback')
        .send(validCallbackData)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Callback received successfully',
        data: mockServiceResponse,
        pagination: null
      });
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(validCallbackData);
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle callback with alternative field names', async () => {
      // Arrange
      const alternativeCallbackData = {
        job_id: 'job_123456789',
        user_id: 'user_123456789',
        partner_params: {
          seller_id: '507f1f77bcf86cd799439011',
          account_type: 'individual'
        },
        result_code: '1020',
        result_text: 'Success',
        job_complete: true,
        success: true,
        images: ['image1.jpg', 'image2.jpg']
      };

      const mockServiceResponse = {
        message: 'Callback received successfully',
        job_id: 'job_123456789',
        processed: true,
        assessment: {
          hasImages: true,
          resultCode: '1020',
          isSuccessful: true
        }
      };
      smileIdCallbackService.processSmileIdCallback.mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app)
        .post('/callback')
        .send(alternativeCallbackData)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Callback received successfully',
        data: mockServiceResponse,
        pagination: null
      });
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(alternativeCallbackData);
    });

    it('should handle unsuccessful verification callback', async () => {
      // Arrange
      const unsuccessfulCallbackData = {
        job_id: 'job_123456789',
        user_id: 'user_123456789',
        partner_params: {
          seller_id: '507f1f77bcf86cd799439011',
          account_type: 'business'
        },
        ResultCode: '1001',
        ResultText: 'Failed',
        job_complete: false,
        success: false,
        Images: []
      };

      const mockServiceResponse = {
        message: 'Callback received successfully',
        job_id: 'job_123456789',
        processed: true,
        assessment: {
          hasImages: false,
          resultCode: '1001',
          isSuccessful: false
        }
      };
      smileIdCallbackService.processSmileIdCallback.mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app)
        .post('/callback')
        .send(unsuccessfulCallbackData)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Callback received successfully',
        data: mockServiceResponse,
        pagination: null
      });
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(unsuccessfulCallbackData);
    });
  });

  describe('Error handling', () => {
    it('should handle validation errors from service', async () => {
      // Arrange
      const validationError = new Error('Validation failed');
      validationError.errors = [
        { field: 'job_id', message: 'Job ID is required' },
        { field: 'partner_params', message: 'Partner parameters are required' }
      ];
      smileIdCallbackService.processSmileIdCallback.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/callback')
        .send({}) // Invalid data
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith({});
    });

    it('should handle seller not found error', async () => {
      // Arrange
      const notFoundError = new Error('Seller not found');
      smileIdCallbackService.processSmileIdCallback.mockRejectedValue(notFoundError);

      // Act
      const response = await request(app)
        .post('/callback')
        .send(validCallbackData)
        .expect(404);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Seller not found',
        errors: null
      });
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(validCallbackData);
    });

    it('should handle internal server errors', async () => {
      // Arrange
      const serverError = new Error('Database connection failed');
      smileIdCallbackService.processSmileIdCallback.mockRejectedValue(serverError);

      // Act
      const response = await request(app)
        .post('/callback')
        .send(validCallbackData)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Database connection failed',
        errors: null
      });
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(validCallbackData);
    });

    it('should handle missing request body', async () => {
      // Arrange
      const validationError = new Error('Validation failed');
      validationError.errors = [{ field: 'data', message: 'Callback data is required' }];
      smileIdCallbackService.processSmileIdCallback.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/callback')
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    });

  });

  describe('Request/Response handling', () => {
    it('should preserve request body data integrity', async () => {
      // Arrange
      const complexCallbackData = {
        job_id: 'job_123456789',
        user_id: 'user_123456789',
        partner_params: {
          seller_id: '507f1f77bcf86cd799439011',
          account_type: 'business',
          custom_field: 'custom_value'
        },
        ResultCode: '1012',
        ResultText: 'Success',
        job_complete: true,
        success: true,
        Images: ['image1.jpg', 'image2.jpg'],
        additional_data: {
          nested: {
            value: 'test'
          }
        }
      };

      const mockServiceResponse = {
        message: 'Callback received successfully',
        job_id: 'job_123456789',
        processed: true,
        assessment: {
          hasImages: true,
          resultCode: '1012',
          isSuccessful: true
        }
      };
      smileIdCallbackService.processSmileIdCallback.mockResolvedValue(mockServiceResponse);

      // Act
      await request(app)
        .post('/callback')
        .send(complexCallbackData)
        .expect(200);

      // Assert
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(complexCallbackData);
    });

    it('should return correct response structure for successful callback', async () => {
      // Arrange
      const mockServiceResponse = {
        message: 'Callback received successfully',
        job_id: 'job_123456789',
        processed: true,
        assessment: {
          hasImages: true,
          resultCode: '1012',
          isSuccessful: true
        }
      };
      smileIdCallbackService.processSmileIdCallback.mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app)
        .post('/callback')
        .send(validCallbackData)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Callback received successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination', null);
      expect(response.body.data).toEqual(mockServiceResponse);
    });

    it('should handle service timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Service timeout');
      smileIdCallbackService.processSmileIdCallback.mockRejectedValue(timeoutError);

      // Act
      const response = await request(app)
        .post('/callback')
        .send(validCallbackData)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Service timeout',
        errors: null
      });
    });
  });

  describe('HTTP status codes', () => {
    it('should return 200 for successful callback processing', async () => {
      // Arrange
      const mockServiceResponse = {
        message: 'Callback received successfully',
        job_id: 'job_123456789',
        processed: true,
        assessment: {
          hasImages: true,
          resultCode: '1012',
          isSuccessful: true
        }
      };
      smileIdCallbackService.processSmileIdCallback.mockResolvedValue(mockServiceResponse);

      // Act & Assert
      await request(app)
        .post('/callback')
        .send(validCallbackData)
        .expect(200);
    });

    it('should return 422 for validation errors', async () => {
      // Arrange
      const validationError = new Error('Validation failed');
      validationError.errors = [{ field: 'job_id', message: 'Job ID is required' }];
      smileIdCallbackService.processSmileIdCallback.mockRejectedValue(validationError);

      // Act & Assert
      await request(app)
        .post('/callback')
        .send({})
        .expect(422);
    });

    it('should return 404 for seller not found', async () => {
      // Arrange
      const notFoundError = new Error('Seller not found');
      smileIdCallbackService.processSmileIdCallback.mockRejectedValue(notFoundError);

      // Act & Assert
      await request(app)
        .post('/callback')
        .send(validCallbackData)
        .expect(404);
    });

    it('should return 500 for internal server errors', async () => {
      // Arrange
      const serverError = new Error('Internal server error');
      smileIdCallbackService.processSmileIdCallback.mockRejectedValue(serverError);

      // Act & Assert
      await request(app)
        .post('/callback')
        .send(validCallbackData)
        .expect(500);
    });
  });
});
