/**
 * Add Shipping Warehouse Controller Tests
 *
 * This test suite validates the addShippingWarehouse controller functionality.
 * It ensures that the controller properly handles HTTP requests and responses,
 * delegates to the service layer, and handles errors correctly.
 *
 * Test Coverage:
 * - Successful shipping and warehouse information addition
 * - Error handling for service failures
 * - Request/response handling
 * - HTTP status codes
 * - Response structure validation
 * - Authentication token handling
 * - Validation error handling
 *
 * @module addShippingWarehouseControllerTests
 */

const request = require('supertest');
const express = require('express');
const { addShippingWarehouse } = require('@modules/seller/controllers/seller.controller');
const addShippingWarehouseService = require('@modules/seller/services/addShippingWarehouse.service');

// Mock the service
jest.mock('@modules/seller/services/addShippingWarehouse.service');

describe('Add Shipping Warehouse Controller', () => {
  let app;
  let validShippingWarehouseData;

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
        // Mock user ID from token
        req.user = { id: '507f1f77bcf86cd799439011' };
      }
      next();
    });

    // Add the controller route
    app.put('/shipping-warehouse', addShippingWarehouse);

    // Add error handling middleware
    app.use((err, req, res, next) => {
      if (err.name === 'ValidationError') {
        res.status(422).json({
          success: false,
          message: err.message,
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
          message: err.message || 'Internal server error',
          errors: null,
          data: null,
          pagination: null
        });
      }
    });

    // Valid shipping and warehouse information data
    validShippingWarehouseData = {
      shippingOptions: {
        shippingMethod: 'Standard Shipping',
        returnsAndExchangePolicy: '30-day return policy'
      },
      warehouseDetails: {
        name: 'Main Warehouse',
        contactNumber: '+2348012345678',
        address: {
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Warehouse Street',
          addressLine2: 'Building A',
          zipCode: '100001'
        }
      }
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /shipping-warehouse', () => {
    it('should successfully add shipping and warehouse information', async () => {
      // Arrange: Setup service mock
      const mockResponse = {
        message: 'Shipping and warehouse information added successfully',
        seller: {
          shippingOptions: validShippingWarehouseData.shippingOptions,
          warehouseDetails: validShippingWarehouseData.warehouseDetails
        }
      };

      addShippingWarehouseService.addShippingWarehouse.mockResolvedValue(mockResponse);

      // Act: Make request
      const response = await request(app)
        .put('/shipping-warehouse')
        .set('Authorization', 'Bearer valid-token')
        .send(validShippingWarehouseData);

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Shipping and warehouse information added successfully',
        data: mockResponse,
        pagination: null
      });

      // Verify service was called with correct parameters
      expect(addShippingWarehouseService.addShippingWarehouse).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        validShippingWarehouseData
      );
    });

    it('should successfully add only shipping options', async () => {
      // Arrange: Setup service mock for shipping options only
      const shippingOptionsData = {
        shippingOptions: {
          shippingMethod: 'Express Shipping',
          returnsAndExchangePolicy: '14-day return policy'
        }
      };

      const mockResponse = {
        message: 'Shipping and warehouse information added successfully',
        seller: {
          shippingOptions: shippingOptionsData.shippingOptions,
          warehouseDetails: null
        }
      };

      addShippingWarehouseService.addShippingWarehouse.mockResolvedValue(mockResponse);

      // Act: Make request
      const response = await request(app)
        .put('/shipping-warehouse')
        .set('Authorization', 'Bearer valid-token')
        .send(shippingOptionsData);

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Shipping and warehouse information added successfully',
        data: mockResponse,
        pagination: null
      });

      // Verify service was called with correct parameters
      expect(addShippingWarehouseService.addShippingWarehouse).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        shippingOptionsData
      );
    });

    it('should successfully add only warehouse details', async () => {
      // Arrange: Setup service mock for warehouse details only
      const warehouseData = {
        warehouseDetails: {
          name: 'Secondary Warehouse',
          contactNumber: '+2348098765432',
          address: {
            country: 'Nigeria',
            state: 'Abuja',
            city: 'Abuja',
            addressLine1: '456 Storage Avenue',
            zipCode: '900001'
          }
        }
      };

      const mockResponse = {
        message: 'Shipping and warehouse information added successfully',
        seller: {
          shippingOptions: null,
          warehouseDetails: warehouseData.warehouseDetails
        }
      };

      addShippingWarehouseService.addShippingWarehouse.mockResolvedValue(mockResponse);

      // Act: Make request
      const response = await request(app)
        .put('/shipping-warehouse')
        .set('Authorization', 'Bearer valid-token')
        .send(warehouseData);

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Shipping and warehouse information added successfully',
        data: mockResponse,
        pagination: null
      });

      // Verify service was called with correct parameters
      expect(addShippingWarehouseService.addShippingWarehouse).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        warehouseData
      );
    });

    it('should handle empty data object', async () => {
      // Arrange: Setup service mock for empty data
      const emptyData = {};
      const mockResponse = {
        message: 'Shipping and warehouse information added successfully',
        seller: {
          shippingOptions: null,
          warehouseDetails: null
        }
      };

      addShippingWarehouseService.addShippingWarehouse.mockResolvedValue(mockResponse);

      // Act: Make request
      const response = await request(app)
        .put('/shipping-warehouse')
        .set('Authorization', 'Bearer valid-token')
        .send(emptyData);

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Shipping and warehouse information added successfully',
        data: mockResponse,
        pagination: null
      });

      // Verify service was called with correct parameters
      expect(addShippingWarehouseService.addShippingWarehouse).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        emptyData
      );
    });

    it('should handle validation errors', async () => {
      // Arrange: Setup service mock to throw validation error
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = [
        { field: 'shippingOptions', message: 'Shipping options must be an object' }
      ];

      addShippingWarehouseService.addShippingWarehouse.mockRejectedValue(validationError);

      // Act: Make request with invalid data
      const response = await request(app)
        .put('/shipping-warehouse')
        .set('Authorization', 'Bearer valid-token')
        .send({ shippingOptions: 'invalid' });

      // Assert: Verify error response
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'shippingOptions', message: 'Shipping options must be an object' }
        ],
        data: null,
        pagination: null
      });
    });

    it('should handle seller not found error', async () => {
      // Arrange: Setup service mock to throw seller not found error
      const notFoundError = new Error('Seller not found');
      addShippingWarehouseService.addShippingWarehouse.mockRejectedValue(notFoundError);

      // Act: Make request
      const response = await request(app)
        .put('/shipping-warehouse')
        .set('Authorization', 'Bearer valid-token')
        .send(validShippingWarehouseData);

      // Assert: Verify error response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Seller not found',
        errors: null,
        data: null,
        pagination: null
      });
    });

    it('should handle database errors', async () => {
      // Arrange: Setup service mock to throw database error
      const databaseError = new Error('Database connection failed');
      addShippingWarehouseService.addShippingWarehouse.mockRejectedValue(databaseError);

      // Act: Make request
      const response = await request(app)
        .put('/shipping-warehouse')
        .set('Authorization', 'Bearer valid-token')
        .send(validShippingWarehouseData);

      // Assert: Verify error response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Database connection failed',
        errors: null,
        data: null,
        pagination: null
      });
    });

    it('should handle malformed JSON', async () => {
      // Act: Make request with malformed JSON
      const response = await request(app)
        .put('/shipping-warehouse')
        .set('Authorization', 'Bearer valid-token')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      // Assert: Verify error response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid JSON',
        errors: null,
        data: null,
        pagination: null
      });
    });

    it('should handle missing authorization token', async () => {
      // Act: Make request without authorization header
      const response = await request(app)
        .put('/shipping-warehouse')
        .send(validShippingWarehouseData);

      // Assert: Verify error response (req.user.id will be undefined)
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle invalid authorization token format', async () => {
      // Act: Make request with invalid authorization header format
      const response = await request(app)
        .put('/shipping-warehouse')
        .set('Authorization', 'InvalidFormat')
        .send(validShippingWarehouseData);

      // Assert: Verify error response (req.user.id will be undefined)
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle service throwing unexpected error', async () => {
      // Arrange: Setup service mock to throw unexpected error
      const unexpectedError = new Error('Unexpected error occurred');
      addShippingWarehouseService.addShippingWarehouse.mockRejectedValue(unexpectedError);

      // Act: Make request
      const response = await request(app)
        .put('/shipping-warehouse')
        .set('Authorization', 'Bearer valid-token')
        .send(validShippingWarehouseData);

      // Assert: Verify error response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Unexpected error occurred',
        errors: null,
        data: null,
        pagination: null
      });
    });

    it('should handle service throwing error without message', async () => {
      // Arrange: Setup service mock to throw error without message
      const errorWithoutMessage = new Error();
      addShippingWarehouseService.addShippingWarehouse.mockRejectedValue(errorWithoutMessage);

      // Act: Make request
      const response = await request(app)
        .put('/shipping-warehouse')
        .set('Authorization', 'Bearer valid-token')
        .send(validShippingWarehouseData);

      // Assert: Verify error response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error',
        errors: null,
        data: null,
        pagination: null
      });
    });
  });
});
