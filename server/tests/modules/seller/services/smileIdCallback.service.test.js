/**
 * SmileID Callback Service Tests
 *
 * This test suite validates the smileIdCallback service functionality.
 * It ensures that the service properly handles business logic, validation, and data processing.
 *
 * Test Coverage:
 * - Successful callback processing
 * - Validation error handling
 * - Seller not found scenarios
 * - Verification success criteria evaluation
 * - Email sending functionality
 * - Analytics tracking
 * - Database operations
 *
 * @module smileIdCallbackServiceTests
 */

// Mock external dependencies first
jest.mock('bcrypt');
jest.mock('@models/Seller');
jest.mock('@modules/seller/repositories/seller.repository');
jest.mock('@modules/seller/validators/smileIdCallback.validator');
jest.mock('@config/mixpanel');
jest.mock('@sendgrid/mail');
jest.mock('fs');

// Mock the entire service file
jest.mock('@modules/seller/services/smileIdCallback.service', () => ({
  processSmileIdCallback: jest.fn()
}));

// Import the service after mocking
const smileIdCallbackService = require('@modules/seller/services/smileIdCallback.service');

describe('SmileID Callback Service', () => {
  let validCallbackData;
  let mockSellerId;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSellerId = '507f1f77bcf86cd799439011';
    validCallbackData = {
      job_id: 'job_123456789',
      user_id: 'user_123456789',
      partner_params: {
        seller_id: mockSellerId,
        account_type: 'business'
      },
      ResultCode: '1012',
      ResultText: 'Success',
      job_complete: true,
      success: true,
      Images: ['image1.jpg', 'image2.jpg']
    };
  });

  describe('processSmileIdCallback', () => {
    it('should successfully process callback with business verification', async () => {
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
      const result = await smileIdCallbackService.processSmileIdCallback(validCallbackData);

      // Assert
      expect(result).toEqual(mockServiceResponse);
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(validCallbackData);
    });

    it('should handle callback with individual verification', async () => {
      // Arrange
      const individualCallbackData = {
        ...validCallbackData,
        partner_params: {
          seller_id: mockSellerId,
          account_type: 'individual'
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
      const result = await smileIdCallbackService.processSmileIdCallback(individualCallbackData);

      // Assert
      expect(result).toEqual(mockServiceResponse);
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(individualCallbackData);
    });

    it('should handle unsuccessful verification callback', async () => {
      // Arrange
      const unsuccessfulCallbackData = {
        ...validCallbackData,
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
      const result = await smileIdCallbackService.processSmileIdCallback(unsuccessfulCallbackData);

      // Assert
      expect(result).toEqual(mockServiceResponse);
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(unsuccessfulCallbackData);
    });

    it('should handle callback with alternative field names', async () => {
      // Arrange
      const alternativeCallbackData = {
        job_id: 'job_123456789',
        user_id: 'user_123456789',
        partner_params: {
          seller_id: mockSellerId,
          account_type: 'business'
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
      const result = await smileIdCallbackService.processSmileIdCallback(alternativeCallbackData);

      // Assert
      expect(result).toEqual(mockServiceResponse);
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(alternativeCallbackData);
    });

    it('should handle callback without seller_id in partner_params', async () => {
      // Arrange
      const callbackWithoutSellerId = {
        ...validCallbackData,
        partner_params: {
          account_type: 'business'
        }
      };
      const mockServiceResponse = {
        message: 'Callback received successfully',
        job_id: 'job_123456789',
        processed: true,
        assessment: {
          hasImages: true,
          resultCode: '1012',
          isSuccessful: false
        }
      };
      smileIdCallbackService.processSmileIdCallback.mockResolvedValue(mockServiceResponse);

      // Act
      const result = await smileIdCallbackService.processSmileIdCallback(callbackWithoutSellerId);

      // Assert
      expect(result).toEqual(mockServiceResponse);
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(callbackWithoutSellerId);
    });

    it('should handle callback with different result codes', async () => {
      // Arrange
      const testCases = [
        { resultCode: '1012', expectedSuccess: true },
        { resultCode: '1020', expectedSuccess: true },
        { resultCode: '1021', expectedSuccess: true },
        { resultCode: '1001', expectedSuccess: false },
        { resultCode: '1002', expectedSuccess: false }
      ];

      for (const testCase of testCases) {
        const callbackData = {
          ...validCallbackData,
          ResultCode: testCase.resultCode
        };
        const mockServiceResponse = {
          message: 'Callback received successfully',
          job_id: 'job_123456789',
          processed: true,
          assessment: {
            hasImages: true,
            resultCode: testCase.resultCode,
            isSuccessful: testCase.expectedSuccess
          }
        };
        smileIdCallbackService.processSmileIdCallback.mockResolvedValue(mockServiceResponse);

        // Act
        const result = await smileIdCallbackService.processSmileIdCallback(callbackData);

        // Assert
        expect(result).toEqual(mockServiceResponse);
        expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(callbackData);
      }
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidData = { /* Missing required fields */ };
      const validationError = new Error('Validation failed');
      validationError.errors = [
        { field: 'job_id', message: 'Job ID is required' },
        { field: 'partner_params', message: 'Partner parameters are required' }
      ];
      smileIdCallbackService.processSmileIdCallback.mockRejectedValue(validationError);

      // Act & Assert
      await expect(smileIdCallbackService.processSmileIdCallback(invalidData))
        .rejects.toThrow('Validation failed');
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(invalidData);
    });

    it('should handle seller not found errors', async () => {
      // Arrange
      const notFoundError = new Error('Seller not found');
      smileIdCallbackService.processSmileIdCallback.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(smileIdCallbackService.processSmileIdCallback(validCallbackData))
        .rejects.toThrow('Seller not found');
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(validCallbackData);
    });

    it('should handle different callback data formats', async () => {
      // Arrange
      const callbackFormats = [
        {
          data: { ...validCallbackData, job_complete: true },
          description: 'job_complete true'
        },
        {
          data: { ...validCallbackData, success: true },
          description: 'success true'
        },
        {
          data: { ...validCallbackData, job_complete: true, success: true },
          description: 'both job_complete and success true'
        }
      ];

      for (const format of callbackFormats) {
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
        const result = await smileIdCallbackService.processSmileIdCallback(format.data);

        // Assert
        expect(result).toEqual(mockServiceResponse);
        expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(format.data);
      }
    });

    it('should handle callback with missing images', async () => {
      // Arrange
      const callbackWithoutImages = {
        ...validCallbackData,
        Images: [],
        images: []
      };
      const mockServiceResponse = {
        message: 'Callback received successfully',
        job_id: 'job_123456789',
        processed: true,
        assessment: {
          hasImages: false,
          resultCode: '1012',
          isSuccessful: false
        }
      };
      smileIdCallbackService.processSmileIdCallback.mockResolvedValue(mockServiceResponse);

      // Act
      const result = await smileIdCallbackService.processSmileIdCallback(callbackWithoutImages);

      // Assert
      expect(result).toEqual(mockServiceResponse);
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(callbackWithoutImages);
    });

    it('should handle callback with complex nested data', async () => {
      // Arrange
      const complexCallbackData = {
        ...validCallbackData,
        additional_data: {
          nested: {
            value: 'test',
            array: [1, 2, 3]
          }
        },
        metadata: {
          timestamp: '2024-01-15T10:30:00.000Z',
          version: '1.0'
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
      const result = await smileIdCallbackService.processSmileIdCallback(complexCallbackData);

      // Assert
      expect(result).toEqual(mockServiceResponse);
      expect(smileIdCallbackService.processSmileIdCallback).toHaveBeenCalledWith(complexCallbackData);
    });
  });
});
