/**
 * Add Business Details Controller Tests
 *
 * This test suite validates the addBusinessDetails controller functionality.
 * It ensures that the controller properly handles HTTP requests and responses,
 * delegates to the service layer, and handles errors correctly.
 *
 * Test Coverage:
 * - Successful business details addition
 * - Error handling for service failures
 * - Request/response handling
 * - HTTP status codes
 * - Response structure validation
 * - Authentication token handling
 *
 * @module addBusinessDetailsControllerTests
 */

const request = require('supertest');
const express = require('express');
const { addBusinessDetails } = require('@modules/seller/controllers/seller.controller');
const addBusinessDetailsService = require('@modules/seller/services/addBusinessDetails.service');

// Mock the service
jest.mock('@modules/seller/services/addBusinessDetails.service');

describe('Add Business Details Controller', () => {
  let app;
  let validBusinessDetails;

  beforeEach(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Add response formatter middleware
    app.use((req, res, next) => {
      res.success = (data, message = 'Success') => {
        res.status(200).json({
          success: true,
          message,
          data,
          pagination: null
        });
      };
      next();
    });

    // Add middleware to set req.user from header
    app.use((req, res, next) => {
      if (req.get('user')) {
        req.user = JSON.parse(req.get('user'));
      }
      next();
    });

    // Add route
    app.put('/business-details', addBusinessDetails);

    // Add error handling middleware
    app.use((err, req, res, next) => {
      if (err.name === 'ValidationError') {
        res.status(422).json({
          success: false,
          message: 'Validation failed',
          errors: err.errors,
          data: null,
          pagination: null
        });
      } else if (err.message === 'Seller not found') {
        res.status(404).json({
          success: false,
          message: 'Seller not found',
          errors: null,
          data: null,
          pagination: null
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errors: null,
          data: null,
          pagination: null
        });
      }
    });

    // Valid business details data
    validBusinessDetails = {
      businessName: 'Tech Solutions Ltd',
      businessType: 'LLC',
      taxInformation: 'Tax ID: 123456789'
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /business-details', () => {
    it('should successfully add business details', async () => {
      // Arrange: Mock successful service response
      const mockResponse = {
        message: 'Business details added successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          businessName: 'Tech Solutions Ltd',
          businessType: 'LLC',
          taxInformation: 'Tax ID: 123456789',
          hasFilledBusinessAddress: true,
          hasFilledVerificationDocuments: false
        }
      };

      addBusinessDetailsService.addBusinessDetails.mockResolvedValue(mockResponse);

      // Act: Make request to add business details
      const response = await request(app)
        .put('/business-details')
        .send(validBusinessDetails)
        .set('user', JSON.stringify({ id: '507f1f77bcf86cd799439011' }));


      // Assert: Verify successful response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Business details added successfully',
        data: mockResponse,
        pagination: null
      });

      // Verify service was called with correct parameters
      expect(addBusinessDetailsService.addBusinessDetails).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        validBusinessDetails
      );
    });

    it('should handle validation errors', async () => {
      // Arrange: Mock validation error
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = [
        { field: 'businessName', message: 'Business name is required' }
      ];

      addBusinessDetailsService.addBusinessDetails.mockRejectedValue(validationError);

      // Act: Make request with invalid data
      const response = await request(app)
        .put('/business-details')
        .send({ businessType: 'LLC' })
        .set('user', JSON.stringify({ id: '507f1f77bcf86cd799439011' }));

      // Assert: Verify validation error response
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'businessName', message: 'Business name is required' }
        ],
        data: null,
        pagination: null
      });
    });

    it('should handle seller not found error', async () => {
      // Arrange: Mock seller not found error
      const notFoundError = new Error('Seller not found');
      addBusinessDetailsService.addBusinessDetails.mockRejectedValue(notFoundError);

      // Act: Make request with valid data but non-existent seller
      const response = await request(app)
        .put('/business-details')
        .send(validBusinessDetails)
        .set('user', JSON.stringify({ id: 'nonexistent-seller-id' }));

      // Assert: Verify not found error response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: 'Seller not found',
        errors: null,
        data: null,
        pagination: null
      });
    });

    it('should handle internal server error', async () => {
      // Arrange: Mock internal server error
      const serverError = new Error('Database connection failed');
      addBusinessDetailsService.addBusinessDetails.mockRejectedValue(serverError);

      // Act: Make request with valid data
      const response = await request(app)
        .put('/business-details')
        .send(validBusinessDetails)
        .set('user', JSON.stringify({ id: '507f1f77bcf86cd799439011' }));

      // Assert: Verify internal server error response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error',
        errors: null,
        data: null,
        pagination: null
      });
    });

    it('should handle missing request body', async () => {
      // Arrange: Mock validation error for missing data
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = [
        { field: 'data', message: 'Business details data is required' }
      ];

      addBusinessDetailsService.addBusinessDetails.mockRejectedValue(validationError);

      // Act: Make request without body
      const response = await request(app)
        .put('/business-details')
        .set('user', JSON.stringify({ id: '507f1f77bcf86cd799439011' }));

      // Assert: Verify validation error response
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'data', message: 'Business details data is required' }
        ],
        data: null,
        pagination: null
      });
    });

    it('should handle empty request body', async () => {
      // Arrange: Mock validation error for empty data
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = [
        { field: 'businessName', message: 'Business name is required' },
        { field: 'businessType', message: 'Business type is required' },
        { field: 'taxInformation', message: 'Tax information is required' }
      ];

      addBusinessDetailsService.addBusinessDetails.mockRejectedValue(validationError);

      // Act: Make request with empty body
      const response = await request(app)
        .put('/business-details')
        .send({})
        .set('user', JSON.stringify({ id: '507f1f77bcf86cd799439011' }));

      // Assert: Verify validation error response
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'businessName', message: 'Business name is required' },
          { field: 'businessType', message: 'Business type is required' },
          { field: 'taxInformation', message: 'Tax information is required' }
        ],
        data: null,
        pagination: null
      });
    });

    it('should handle service throwing unexpected error', async () => {
      // Arrange: Mock unexpected error
      const unexpectedError = new Error('Unexpected error occurred');
      addBusinessDetailsService.addBusinessDetails.mockRejectedValue(unexpectedError);

      // Act: Make request with valid data
      const response = await request(app)
        .put('/business-details')
        .send(validBusinessDetails)
        .set('user', JSON.stringify({ id: '507f1f77bcf86cd799439011' }));

      // Assert: Verify internal server error response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error',
        errors: null,
        data: null,
        pagination: null
      });
    });

    it('should preserve request and response integrity', async () => {
      // Arrange: Mock successful service response
      const mockResponse = {
        message: 'Business details added successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          businessName: 'Tech Solutions Ltd',
          businessType: 'LLC',
          taxInformation: 'Tax ID: 123456789'
        }
      };

      addBusinessDetailsService.addBusinessDetails.mockResolvedValue(mockResponse);

      // Act: Make request with specific business details
      const customBusinessDetails = {
        businessName: 'Custom Business Name',
        businessType: 'Corporation',
        taxInformation: 'Custom Tax Info'
      };

      const response = await request(app)
        .put('/business-details')
        .send(customBusinessDetails)
        .set('user', JSON.stringify({ id: '507f1f77bcf86cd799439011' }));

      // Assert: Verify service was called with exact request data
      expect(addBusinessDetailsService.addBusinessDetails).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        customBusinessDetails
      );

      // Verify response structure
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Business details added successfully');
      expect(response.body.data).toEqual(mockResponse);
      expect(response.body.pagination).toBeNull();
    });

    it('should handle different seller IDs correctly', async () => {
      // Arrange: Mock successful service response
      const mockResponse = {
        message: 'Business details added successfully',
        seller: {
          _id: 'different-seller-id',
          businessName: 'Tech Solutions Ltd',
          businessType: 'LLC',
          taxInformation: 'Tax ID: 123456789'
        }
      };

      addBusinessDetailsService.addBusinessDetails.mockResolvedValue(mockResponse);

      // Act: Make request with different seller ID
      const response = await request(app)
        .put('/business-details')
        .send(validBusinessDetails)
        .set('user', JSON.stringify({ id: 'different-seller-id' }));

      // Assert: Verify service was called with correct seller ID
      expect(addBusinessDetailsService.addBusinessDetails).toHaveBeenCalledWith(
        'different-seller-id',
        validBusinessDetails
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle service returning null response', async () => {
      // Arrange: Mock service returning null
      addBusinessDetailsService.addBusinessDetails.mockResolvedValue(null);

      // Act: Make request with valid data
      const response = await request(app)
        .put('/business-details')
        .send(validBusinessDetails)
        .set('user', JSON.stringify({ id: '507f1f77bcf86cd799439011' }));

      // Assert: Verify response handles null data
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Business details added successfully',
        data: null,
        pagination: null
      });
    });

    it('should handle service returning undefined response', async () => {
      // Arrange: Mock service returning undefined
      addBusinessDetailsService.addBusinessDetails.mockResolvedValue(undefined);

      // Act: Make request with valid data
      const response = await request(app)
        .put('/business-details')
        .send(validBusinessDetails)
        .set('user', JSON.stringify({ id: '507f1f77bcf86cd799439011' }));

      // Assert: Verify response handles undefined data
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Business details added successfully',
        data: undefined,
        pagination: null
      });
    });
  });
});
