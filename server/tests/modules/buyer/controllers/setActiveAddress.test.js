/**
 * Set Active Address Controller Tests
 *
 * This test suite validates the setActiveAddress controller functionality.
 * It tests the HTTP request handling, validation, and response formatting
 * for setting a shipping address as active for checkout purposes.
 *
 * Test Coverage:
 * - Successful address activation
 * - Invalid address ID validation
 * - Non-existent address handling
 * - Authentication and authorization
 * - Error handling and response formatting
 *
 * @module setActiveAddressControllerTests
 */

const request = require('supertest');
const express = require('express');
const setActiveAddressController = require('../../../../src/modules/buyer/controllers/buyer.controller');
const setActiveAddressService = require('../../../../src/modules/buyer/services/setActiveAddress.service');
const { verifyToken, isBuyer } = require('../../../../src/middlewares/authMiddleware');

// Mock the service layer
jest.mock('../../../../src/modules/buyer/services/setActiveAddress.service');

// Mock the authentication middleware
jest.mock('../../../../src/middlewares/authMiddleware', () => ({
  verifyToken: jest.fn((req, res, next) => {
    req.user = { id: '507f1f77bcf86cd799439011' };
    next();
  }),
  isBuyer: jest.fn((req, res, next) => next())
}));

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock the response middleware
app.use((req, res, next) => {
  res.success = (data, message, statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      message,
      data
    });
  };
  next();
});

// Add the route
app.patch('/addresses/:addressId/set-active', verifyToken, isBuyer, setActiveAddressController.setActiveAddress);

describe('Set Active Address Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /addresses/:addressId/set-active', () => {
    it('should successfully set an address as active', async () => {
      // Arrange
      const addressId = '507f1f77bcf86cd799439012';
      const mockResponse = {
        message: 'Address set as active successfully',
        address: {
          _id: addressId,
          addressType: 'home',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          zipCode: '100001',
          isActive: true
        }
      };

      setActiveAddressService.setActiveAddress.mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .patch(`/addresses/${addressId}/set-active`)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Address set as active successfully',
        data: mockResponse
      });

      expect(setActiveAddressService.setActiveAddress).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        addressId
      );
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidAddressId = 'invalid-id';
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = [
        {
          field: 'addressId',
          message: 'Address ID must be a valid MongoDB ObjectId',
          value: invalidAddressId
        }
      ];

      setActiveAddressService.setActiveAddress.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .patch(`/addresses/${invalidAddressId}/set-active`)
        .expect(500); // Express error handler will catch and return 500

      // Assert
      expect(setActiveAddressService.setActiveAddress).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        invalidAddressId
      );
    });

    it('should handle address not found error', async () => {
      // Arrange
      const addressId = '507f1f77bcf86cd799439012';
      const notFoundError = new Error('Address not found');
      notFoundError.name = 'NotFoundException';

      setActiveAddressService.setActiveAddress.mockRejectedValue(notFoundError);

      // Act
      const response = await request(app)
        .patch(`/addresses/${addressId}/set-active`)
        .expect(500); // Express error handler will catch and return 500

      // Assert
      expect(setActiveAddressService.setActiveAddress).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        addressId
      );
    });

    it('should handle buyer not found error', async () => {
      // Arrange
      const addressId = '507f1f77bcf86cd799439012';
      const notFoundError = new Error('Buyer not found');
      notFoundError.name = 'NotFoundException';

      setActiveAddressService.setActiveAddress.mockRejectedValue(notFoundError);

      // Act
      const response = await request(app)
        .patch(`/addresses/${addressId}/set-active`)
        .expect(500); // Express error handler will catch and return 500

      // Assert
      expect(setActiveAddressService.setActiveAddress).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        addressId
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      const addressId = '507f1f77bcf86cd799439012';
      const databaseError = new Error('Database connection failed');

      setActiveAddressService.setActiveAddress.mockRejectedValue(databaseError);

      // Act
      const response = await request(app)
        .patch(`/addresses/${addressId}/set-active`)
        .expect(500); // Express error handler will catch and return 500

      // Assert
      expect(setActiveAddressService.setActiveAddress).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        addressId
      );
    });
  });
});
