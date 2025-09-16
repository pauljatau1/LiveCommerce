/**
 * Add Business Information Controller Tests
 *
 * This test suite validates the addBusinessInformation controller functionality.
 * It ensures that the controller properly handles HTTP requests and responses,
 * delegates to the service layer, and handles errors correctly.
 *
 * Test Coverage:
 * - Successful business information addition
 * - Error handling for service failures
 * - Request/response handling
 * - HTTP status codes
 * - Response structure validation
 * - Authentication token handling
 * - Validation error handling
 *
 * @module addBusinessInformationControllerTests
 */

const request = require('supertest');
const express = require('express');
const { addBusinessInformation } = require('@modules/seller/controllers/seller.controller');
const addBusinessInformationService = require('@modules/seller/services/addBusinessInformation.service');

// Mock the service
jest.mock('@modules/seller/services/addBusinessInformation.service');

describe('Add Business Information Controller', () => {
  let app;
  let validBusinessInformation;

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
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Mock user ID extraction from token
        req.user = { id: '507f1f77bcf86cd799439011' };
      }
      next();
    });

    // Add the controller route
    app.put('/business-information', addBusinessInformation);

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
      } else if (err.type === 'entity.parse.failed') {
        res.status(400).json({
          success: false,
          message: 'Invalid JSON',
          errors: null,
          data: null,
          pagination: null
        });
      } else {
        res.status(500).json({
          success: false,
          message: err.message,
          errors: err.errors || null,
          data: null,
          pagination: null
        });
      }
    });

    // Valid business information data
    validBusinessInformation = {
      businessEmail: 'business@techsolutions.com',
      businessNumber: '+2348012345678',
      businessAddress: {
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Lagos',
        addressLine1: '123 Business Street',
        addressLine2: 'Suite 100',
        zipCode: '100001'
      }
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /business-information', () => {
    it('should successfully add business information with valid data', async () => {
      // Arrange: Mock successful service response
      const mockServiceResponse = {
        message: 'Business information added successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          businessEmail: validBusinessInformation.businessEmail,
          businessNumber: validBusinessInformation.businessNumber,
          businessAddress: validBusinessInformation.businessAddress,
          hasFilledBusinessAddress: true
        }
      };

      addBusinessInformationService.addBusinessInformation.mockResolvedValue(mockServiceResponse);

      // Act: Make request to the endpoint
      const response = await request(app)
        .put('/business-information')
        .set('Authorization', 'Bearer valid-token')
        .send(validBusinessInformation);

      // Assert: Verify response structure and content
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Business information added successfully',
        data: mockServiceResponse,
        pagination: null
      });

      // Assert: Verify service was called with correct parameters
      expect(addBusinessInformationService.addBusinessInformation).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        validBusinessInformation
      );
    });

    it('should handle business information without optional addressLine2', async () => {
      // Arrange: Remove optional addressLine2
      const businessInfoWithoutOptional = { ...validBusinessInformation };
      delete businessInfoWithoutOptional.businessAddress.addressLine2;

      const mockServiceResponse = {
        message: 'Business information added successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          businessEmail: businessInfoWithoutOptional.businessEmail,
          businessNumber: businessInfoWithoutOptional.businessNumber,
          businessAddress: businessInfoWithoutOptional.businessAddress,
          hasFilledBusinessAddress: true
        }
      };

      addBusinessInformationService.addBusinessInformation.mockResolvedValue(mockServiceResponse);

      // Act: Make request to the endpoint
      const response = await request(app)
        .put('/business-information')
        .set('Authorization', 'Bearer valid-token')
        .send(businessInfoWithoutOptional);

      // Assert: Verify response structure and content
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Business information added successfully',
        data: mockServiceResponse,
        pagination: null
      });

      // Assert: Verify service was called with correct parameters
      expect(addBusinessInformationService.addBusinessInformation).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        businessInfoWithoutOptional
      );
    });

    it('should handle validation errors from service', async () => {
      // Arrange: Mock service to throw validation error
      const validationError = new Error('Validation failed');
      validationError.errors = [
        { field: 'businessEmail', message: 'Business email is required' }
      ];
      addBusinessInformationService.addBusinessInformation.mockRejectedValue(validationError);

      // Act: Make request to the endpoint
      const response = await request(app)
        .put('/business-information')
        .set('Authorization', 'Bearer valid-token')
        .send(validBusinessInformation);

      // Assert: Verify error response structure
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'businessEmail', message: 'Business email is required' }
        ],
        data: null,
        pagination: null
      });

      // Assert: Verify service was called
      expect(addBusinessInformationService.addBusinessInformation).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        validBusinessInformation
      );
    });

    it('should handle seller not found error from service', async () => {
      // Arrange: Mock service to throw seller not found error
      const notFoundError = new Error('Seller not found');
      addBusinessInformationService.addBusinessInformation.mockRejectedValue(notFoundError);

      // Act: Make request to the endpoint
      const response = await request(app)
        .put('/business-information')
        .set('Authorization', 'Bearer valid-token')
        .send(validBusinessInformation);

      // Assert: Verify error response structure
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Seller not found',
        errors: null,
        data: null,
        pagination: null
      });

      // Assert: Verify service was called
      expect(addBusinessInformationService.addBusinessInformation).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        validBusinessInformation
      );
    });

    it('should handle database errors from service', async () => {
      // Arrange: Mock service to throw database error
      const databaseError = new Error('Database connection failed');
      addBusinessInformationService.addBusinessInformation.mockRejectedValue(databaseError);

      // Act: Make request to the endpoint
      const response = await request(app)
        .put('/business-information')
        .set('Authorization', 'Bearer valid-token')
        .send(validBusinessInformation);

      // Assert: Verify error response structure
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Database connection failed',
        errors: null,
        data: null,
        pagination: null
      });

      // Assert: Verify service was called
      expect(addBusinessInformationService.addBusinessInformation).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        validBusinessInformation
      );
    });

    it('should handle missing authorization header', async () => {
      // Act: Make request without authorization header
      const response = await request(app)
        .put('/business-information')
        .send(validBusinessInformation);

      // Assert: Verify error response (req.user will be undefined)
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: "Cannot read properties of undefined (reading 'id')",
        errors: null,
        data: null,
        pagination: null
      });

      // Assert: Verify service was not called
      expect(addBusinessInformationService.addBusinessInformation).not.toHaveBeenCalled();
    });

    it('should handle invalid authorization header format', async () => {
      // Act: Make request with invalid authorization header
      const response = await request(app)
        .put('/business-information')
        .set('Authorization', 'InvalidFormat')
        .send(validBusinessInformation);

      // Assert: Verify error response (req.user will be undefined)
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: "Cannot read properties of undefined (reading 'id')",
        errors: null,
        data: null,
        pagination: null
      });

      // Assert: Verify service was not called
      expect(addBusinessInformationService.addBusinessInformation).not.toHaveBeenCalled();
    });

    it('should handle empty request body', async () => {
      // Arrange: Mock service to throw validation error for empty body
      const validationError = new Error('Validation failed');
      validationError.errors = [
        { field: 'businessEmail', message: 'Business email is required' },
        { field: 'businessNumber', message: 'Business number is required' },
        { field: 'businessAddress', message: 'Business address is required' }
      ];
      addBusinessInformationService.addBusinessInformation.mockRejectedValue(validationError);

      // Act: Make request with empty body
      const response = await request(app)
        .put('/business-information')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      // Assert: Verify error response structure
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'businessEmail', message: 'Business email is required' },
          { field: 'businessNumber', message: 'Business number is required' },
          { field: 'businessAddress', message: 'Business address is required' }
        ],
        data: null,
        pagination: null
      });

      // Assert: Verify service was called with empty object
      expect(addBusinessInformationService.addBusinessInformation).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {}
      );
    });

    it('should handle malformed JSON in request body', async () => {
      // Act: Make request with malformed JSON
      const response = await request(app)
        .put('/business-information')
        .set('Authorization', 'Bearer valid-token')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      // Assert: Verify error response (Express will handle JSON parsing error)
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid JSON',
        errors: null,
        data: null,
        pagination: null
      });
    });

    it('should handle special characters in business information', async () => {
      // Arrange: Business information with special characters
      const businessInfoWithSpecialChars = {
        businessEmail: 'business+test@tech-solutions.co.uk',
        businessNumber: '+1-234-567-8900',
        businessAddress: {
          country: 'United States',
          state: 'New York',
          city: 'New York City',
          addressLine1: '123 Main St. #456',
          addressLine2: 'Apt. 7B',
          zipCode: '10001-1234'
        }
      };

      const mockServiceResponse = {
        message: 'Business information added successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          businessEmail: businessInfoWithSpecialChars.businessEmail,
          businessNumber: businessInfoWithSpecialChars.businessNumber,
          businessAddress: businessInfoWithSpecialChars.businessAddress,
          hasFilledBusinessAddress: true
        }
      };

      addBusinessInformationService.addBusinessInformation.mockResolvedValue(mockServiceResponse);

      // Act: Make request to the endpoint
      const response = await request(app)
        .put('/business-information')
        .set('Authorization', 'Bearer valid-token')
        .send(businessInfoWithSpecialChars);

      // Assert: Verify response structure and content
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Business information added successfully',
        data: mockServiceResponse,
        pagination: null
      });

      // Assert: Verify service was called with correct parameters
      expect(addBusinessInformationService.addBusinessInformation).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        businessInfoWithSpecialChars
      );
    });

    it('should handle large business information data', async () => {
      // Arrange: Business information with large data
      const largeBusinessInfo = {
        businessEmail: 'business@techsolutions.com',
        businessNumber: '+2348012345678',
        businessAddress: {
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: 'A'.repeat(200), // Max length address
          addressLine2: 'B'.repeat(200), // Max length address
          zipCode: '100001'
        }
      };

      const mockServiceResponse = {
        message: 'Business information added successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          businessEmail: largeBusinessInfo.businessEmail,
          businessNumber: largeBusinessInfo.businessNumber,
          businessAddress: largeBusinessInfo.businessAddress,
          hasFilledBusinessAddress: true
        }
      };

      addBusinessInformationService.addBusinessInformation.mockResolvedValue(mockServiceResponse);

      // Act: Make request to the endpoint
      const response = await request(app)
        .put('/business-information')
        .set('Authorization', 'Bearer valid-token')
        .send(largeBusinessInfo);

      // Assert: Verify response structure and content
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Business information added successfully',
        data: mockServiceResponse,
        pagination: null
      });

      // Assert: Verify service was called with correct parameters
      expect(addBusinessInformationService.addBusinessInformation).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        largeBusinessInfo
      );
    });

    it('should handle unexpected service errors', async () => {
      // Arrange: Mock service to throw unexpected error
      const unexpectedError = new Error('Unexpected error occurred');
      addBusinessInformationService.addBusinessInformation.mockRejectedValue(unexpectedError);

      // Act: Make request to the endpoint
      const response = await request(app)
        .put('/business-information')
        .set('Authorization', 'Bearer valid-token')
        .send(validBusinessInformation);

      // Assert: Verify error response structure
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Unexpected error occurred',
        errors: null,
        data: null,
        pagination: null
      });

      // Assert: Verify service was called
      expect(addBusinessInformationService.addBusinessInformation).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        validBusinessInformation
      );
    });
  });
});
