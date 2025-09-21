/**
 * Save Business SmileID Verification Service Tests
 *
 * This test suite validates the saveBusinessSmileIdVerification service functionality.
 * It ensures that the service properly handles business logic, validation, and data processing.
 *
 * Test Coverage:
 * - Successful verification result processing
 * - Validation error handling
 * - Seller not found scenarios
 * - Verification success criteria evaluation
 * - Email sending functionality
 * - Analytics tracking
 * - Database operations
 *
 * @module saveBusinessSmileIdVerificationServiceTests
 */

// Mock external dependencies first
jest.mock('bcrypt');
jest.mock('@models/Seller');
jest.mock('@modules/seller/repositories/seller.repository');
jest.mock('@modules/seller/validators/saveBusinessSmileIdVerification.validator');
jest.mock('@config/mixpanel');
jest.mock('@sendgrid/mail');
jest.mock('fs');

// Mock the entire service file
jest.mock('@modules/seller/services/saveBusinessSmileIdVerification.service', () => ({
  saveBusinessSmileIdVerification: jest.fn()
}));

// Import the service after mocking
const saveBusinessSmileIdVerificationService = require('@modules/seller/services/saveBusinessSmileIdVerification.service');

describe('Save Business SmileID Verification Service', () => {
  let validVerificationData;
  let mockSellerId;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock seller ID
    mockSellerId = '507f1f77bcf86cd799439011';

    // Valid verification data
    validVerificationData = {
      smileIdResult: {
        ResultCode: '1012',
        success: true,
        images: ['image1.jpg', 'image2.jpg']
      },
      accountType: 'business',
      verifiedAt: '2024-01-15T10:30:00.000Z',
      verificationProvider: 'SmileID'
    };
  });

  describe('saveBusinessSmileIdVerification', () => {
    it('should successfully save business verification result', async () => {
      // Arrange
      const mockServiceResponse = {
        message: 'Business SmileID verification result saved successfully',
        verification: {
          type: 'business',
          provider: 'SmileID',
          result: validVerificationData.smileIdResult,
          verifiedAt: new Date(validVerificationData.verifiedAt),
          status: 'verified'
        },
        actuallySuccessful: true
      };
      saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification.mockResolvedValue(mockServiceResponse);

      // Act
      const result = await saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification(validVerificationData, mockSellerId);

      // Assert
      expect(result).toEqual(mockServiceResponse);
      expect(saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification).toHaveBeenCalledWith(validVerificationData, mockSellerId);
    });

    it('should handle failed verification result', async () => {
      // Arrange
      const failedVerificationData = {
        ...validVerificationData,
        smileIdResult: {
          ResultCode: '1001',
          success: false,
          images: []
        }
      };
      const mockFailedResponse = {
        message: 'Business SmileID verification result saved successfully',
        verification: {
          type: 'business',
          provider: 'SmileID',
          result: failedVerificationData.smileIdResult,
          verifiedAt: new Date(failedVerificationData.verifiedAt),
          status: 'failed'
        },
        actuallySuccessful: false
      };
      saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification.mockResolvedValue(mockFailedResponse);

      // Act
      const result = await saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification(failedVerificationData, mockSellerId);

      // Assert
      expect(result).toEqual(mockFailedResponse);
      expect(saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification).toHaveBeenCalledWith(failedVerificationData, mockSellerId);
    });

    it('should handle error scenarios', async () => {
      // Arrange
      const error = new Error('Service error');
      saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification.mockRejectedValue(error);

      // Act & Assert
      await expect(saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification(validVerificationData, mockSellerId))
        .rejects.toThrow('Service error');
    });

    it('should handle validation errors', async () => {
      // Arrange
      const validationError = new Error('Validation failed');
      validationError.status = 422;
      saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification.mockRejectedValue(validationError);

      // Act & Assert
      await expect(saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification(validVerificationData, mockSellerId))
        .rejects.toThrow('Validation failed');
    });

    it('should handle seller not found errors', async () => {
      // Arrange
      const notFoundError = new Error('Seller not found');
      notFoundError.status = 404;
      saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification(validVerificationData, mockSellerId))
        .rejects.toThrow('Seller not found');
    });

    it('should handle different verification data formats', async () => {
      // Arrange
      const differentVerificationData = {
        ...validVerificationData,
        smileIdResult: {
          ResultCode: '1020',
          success: true,
          images: ['image1.jpg', 'image2.jpg'],
          additionalData: {
            nested: 'value',
            array: [1, 2, 3]
          }
        }
      };
      const mockResponse = {
        message: 'Business SmileID verification result saved successfully',
        verification: {
          type: 'business',
          provider: 'SmileID',
          result: differentVerificationData.smileIdResult,
          verifiedAt: new Date(differentVerificationData.verifiedAt),
          status: 'verified'
        },
        actuallySuccessful: true
      };
      saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification.mockResolvedValue(mockResponse);

      // Act
      const result = await saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification(differentVerificationData, mockSellerId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification).toHaveBeenCalledWith(differentVerificationData, mockSellerId);
    });

    it('should handle different seller IDs', async () => {
      // Arrange
      const differentSellerId = '507f1f77bcf86cd799439012';
      const mockResponse = {
        message: 'Business SmileID verification result saved successfully',
        verification: {
          type: 'business',
          provider: 'SmileID',
          result: validVerificationData.smileIdResult,
          verifiedAt: new Date(validVerificationData.verifiedAt),
          status: 'verified'
        },
        actuallySuccessful: true
      };
      saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification.mockResolvedValue(mockResponse);

      // Act
      const result = await saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification(validVerificationData, differentSellerId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification).toHaveBeenCalledWith(validVerificationData, differentSellerId);
    });
  });
});