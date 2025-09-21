/**
 * Save Individual SmileID Verification Controller Tests
 *
 * This test suite validates the saveIndividualSmileIdVerification controller functionality.
 * It ensures that the controller properly handles HTTP requests and responses,
 * delegates to the service layer, and handles errors correctly.
 *
 * Test Coverage:
 * - Successful verification result saving
 * - Error handling for service failures
 * - Authentication token extraction
 * - Request/response handling
 * - HTTP status codes
 * - Response structure validation
 *
 * @module saveIndividualSmileIdVerificationControllerTests
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { saveIndividualSmileIdVerification } = require('@modules/seller/controllers/seller.controller');
const saveIndividualSmileIdVerificationService = require('@modules/seller/services/saveIndividualSmileIdVerification.service');

// Mock the service
jest.mock('@modules/seller/services/saveIndividualSmileIdVerification.service');

describe('Save Individual SmileID Verification Controller', () => {
  let app;
  let mockToken;
  let mockSellerId;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Mock seller ID and token
    mockSellerId = '507f1f77bcf86cd799439011';
    mockToken = jwt.sign(
      { id: mockSellerId, email: 'test@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

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

    // Add the controller route
    app.post('/verification/smileid/individual', (req, res, next) => {
      // Mock authentication middleware - extract from token
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
          req.user = { id: decoded.id };
        } catch (err) {
          req.user = { id: mockSellerId }; // fallback
        }
      } else {
        req.user = { id: mockSellerId }; // fallback
      }
      saveIndividualSmileIdVerification(req, res, next);
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        errors: err.errors || null
      });
    });
  });

  describe('POST /verification/smileid/individual', () => {
    const validVerificationData = {
      smileIdResult: {
        ResultCode: '1012',
        success: true,
        images: ['image1.jpg', 'image2.jpg']
      },
      accountType: 'individual',
      verifiedAt: '2024-01-15T10:30:00.000Z',
      verificationProvider: 'SmileID'
    };

    it('should successfully save individual verification result', async () => {
      // Arrange
      const mockServiceResponse = {
        message: 'Individual SmileID verification result saved successfully',
        verification: {
          type: 'individual',
          provider: 'SmileID',
          result: validVerificationData.smileIdResult,
          verifiedAt: validVerificationData.verifiedAt,
          status: 'verified'
        },
        actuallySuccessful: true
      };
      saveIndividualSmileIdVerificationService.saveIndividualSmileIdVerification.mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app)
        .post('/verification/smileid/individual')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validVerificationData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Individual SmileID verification result saved successfully',
        data: mockServiceResponse,
        pagination: null
      });
      expect(saveIndividualSmileIdVerificationService.saveIndividualSmileIdVerification).toHaveBeenCalledWith(
        validVerificationData,
        mockSellerId
      );
    });

    it('should handle service validation errors', async () => {
      // Arrange
      const validationError = new Error('Validation failed');
      validationError.status = 422;
      validationError.errors = [
        { field: 'smileIdResult', message: 'SmileID result is required' }
      ];
      saveIndividualSmileIdVerificationService.saveIndividualSmileIdVerification.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/verification/smileid/individual')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validVerificationData);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'smileIdResult', message: 'SmileID result is required' }
        ]
      });
    });

    it('should handle seller not found error', async () => {
      // Arrange
      const notFoundError = new Error('Seller not found');
      notFoundError.status = 404;
      saveIndividualSmileIdVerificationService.saveIndividualSmileIdVerification.mockRejectedValue(notFoundError);

      // Act
      const response = await request(app)
        .post('/verification/smileid/individual')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validVerificationData);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: 'Seller not found',
        errors: null
      });
    });

    it('should handle internal server errors', async () => {
      // Arrange
      const serverError = new Error('Database connection failed');
      saveIndividualSmileIdVerificationService.saveIndividualSmileIdVerification.mockRejectedValue(serverError);

      // Act
      const response = await request(app)
        .post('/verification/smileid/individual')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validVerificationData);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Database connection failed',
        errors: null
      });
    });

    it('should handle missing request body', async () => {
      // Arrange
      const validationError = new Error('Validation failed');
      validationError.status = 422;
      saveIndividualSmileIdVerificationService.saveIndividualSmileIdVerification.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/verification/smileid/individual')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({});

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should handle invalid JSON in request body', async () => {
      // Act
      const response = await request(app)
        .post('/verification/smileid/individual')
        .set('Authorization', `Bearer ${mockToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json');

      // Assert
      expect(response.status).toBe(400);
    });

    it('should extract seller ID from authenticated user', async () => {
      // Arrange
      const mockServiceResponse = {
        message: 'Individual SmileID verification result saved successfully',
        verification: {},
        actuallySuccessful: true
      };
      saveIndividualSmileIdVerificationService.saveIndividualSmileIdVerification.mockResolvedValue(mockServiceResponse);

      // Act
      await request(app)
        .post('/verification/smileid/individual')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validVerificationData);

      // Assert
      expect(saveIndividualSmileIdVerificationService.saveIndividualSmileIdVerification).toHaveBeenCalledWith(
        validVerificationData,
        mockSellerId
      );
    });

    it('should handle different seller IDs correctly', async () => {
      // Arrange
      const differentSellerId = '507f1f77bcf86cd799439012';
      const differentToken = jwt.sign(
        { id: differentSellerId, email: 'different@example.com' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const mockServiceResponse = {
        message: 'Individual SmileID verification result saved successfully',
        verification: {},
        actuallySuccessful: true
      };
      saveIndividualSmileIdVerificationService.saveIndividualSmileIdVerification.mockResolvedValue(mockServiceResponse);

      // Act
      await request(app)
        .post('/verification/smileid/individual')
        .set('Authorization', `Bearer ${differentToken}`)
        .send(validVerificationData);

      // Assert
      expect(saveIndividualSmileIdVerificationService.saveIndividualSmileIdVerification).toHaveBeenCalledWith(
        validVerificationData,
        differentSellerId
      );
    });

    it('should preserve request body data integrity', async () => {
      // Arrange
      const complexVerificationData = {
        smileIdResult: {
          ResultCode: '1012',
          success: true,
          images: ['image1.jpg', 'image2.jpg'],
          additionalData: {
            nested: 'value',
            array: [1, 2, 3]
          }
        },
        accountType: 'individual',
        verifiedAt: '2024-01-15T10:30:00.000Z',
        verificationProvider: 'SmileID',
        customField: 'custom value'
      };

      const mockServiceResponse = {
        message: 'Individual SmileID verification result saved successfully',
        verification: {},
        actuallySuccessful: true
      };
      saveIndividualSmileIdVerificationService.saveIndividualSmileIdVerification.mockResolvedValue(mockServiceResponse);

      // Act
      await request(app)
        .post('/verification/smileid/individual')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(complexVerificationData);

      // Assert
      expect(saveIndividualSmileIdVerificationService.saveIndividualSmileIdVerification).toHaveBeenCalledWith(
        complexVerificationData,
        mockSellerId
      );
    });

    it('should return correct response structure for successful verification', async () => {
      // Arrange
      const mockServiceResponse = {
        message: 'Individual SmileID verification result saved successfully',
        verification: {
          type: 'individual',
          provider: 'SmileID',
          status: 'verified'
        },
        actuallySuccessful: true
      };
      saveIndividualSmileIdVerificationService.saveIndividualSmileIdVerification.mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app)
        .post('/verification/smileid/individual')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validVerificationData);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Individual SmileID verification result saved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination', null);
      expect(response.body.data).toEqual(mockServiceResponse);
    });

    it('should handle service timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Service timeout');
      timeoutError.status = 408;
      saveIndividualSmileIdVerificationService.saveIndividualSmileIdVerification.mockRejectedValue(timeoutError);

      // Act
      const response = await request(app)
        .post('/verification/smileid/individual')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validVerificationData);

      // Assert
      expect(response.status).toBe(408);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Service timeout');
    });
  });
});
