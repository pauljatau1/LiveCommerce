/**
 * Upload Individual Verification Controller Tests
 *
 * This test suite covers all controller scenarios for individual verification
 * document uploads, ensuring comprehensive test coverage for HTTP handling,
 * response formatting, and error handling.
 *
 * Test Coverage:
 * - Successful document uploads
 * - Response formatting with responseFormatter
 * - Error handling and propagation
 * - Service integration
 * - Request data extraction
 *
 * @module uploadIndividualVerificationControllerTests
 */

const uploadIndividualVerificationService = require('@modules/seller/services/uploadIndividualVerification.service');
const sellerController = require('@modules/seller/controllers/seller.controller');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the service
jest.mock('@modules/seller/services/uploadIndividualVerification.service');

describe('Upload Individual Verification Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock request object
    mockReq = {
      user: {
        id: '507f1f77bcf86cd799439011'
      },
      files: {
        individualTaxId: [{
          originalname: 'tax-id.pdf',
          buffer: Buffer.from('test'),
          mimetype: 'application/pdf',
          size: 1024000
        }],
        governmentId: [{
          originalname: 'government-id.pdf',
          buffer: Buffer.from('test'),
          mimetype: 'application/pdf',
          size: 2048000
        }],
        proofOfAddress: [{
          originalname: 'address-proof.pdf',
          buffer: Buffer.from('test'),
          mimetype: 'application/pdf',
          size: 3072000
        }]
      }
    };

    // Mock response object with responseFormatter methods
    mockRes = {
      success: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock next function
    mockNext = jest.fn();
  });

  describe('uploadIndividualVerification', () => {
    it('should successfully upload individual verification documents and return formatted response', async () => {
      // Arrange: Mock successful service response
      const mockServiceResponse = {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        verificationDocuments: {
          type: 'individual',
          documents: [
            {
              documentType: 'individualTaxId',
              fileUrl: 'https://cdn.example.com/verification/507f1f77bcf86cd799439011/individual/uuid-tax-id.pdf',
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-tax-id.pdf'
            },
            {
              documentType: 'governmentId',
              fileUrl: 'https://cdn.example.com/verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf',
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf'
            },
            {
              documentType: 'proofOfAddress',
              fileUrl: 'https://cdn.example.com/verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf',
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf'
            }
          ]
        },
        hasFilledVerificationDocuments: true
      };

      uploadIndividualVerificationService.uploadIndividualVerification.mockResolvedValue(mockServiceResponse);

      // Act: Call the controller method
      await sellerController.uploadIndividualVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with correct parameters
      expect(uploadIndividualVerificationService.uploadIndividualVerification).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockReq.files
      );

      // Assert: Verify response was formatted correctly using responseFormatter
      expect(mockRes.success).toHaveBeenCalledWith(
        {
          message: 'Individual verification documents uploaded successfully',
          documents: mockServiceResponse.verificationDocuments
        },
        'Individual verification documents uploaded successfully'
      );

      // Assert: Verify next was not called (no errors)
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service validation errors and propagate them', async () => {
      // Arrange: Mock service to throw ValidationError
      const validationError = new ValidationError([
        { field: 'governmentId', message: 'Government ID is required' }
      ]);
      uploadIndividualVerificationService.uploadIndividualVerification.mockRejectedValue(validationError);

      // Act: Call the controller method
      await sellerController.uploadIndividualVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called
      expect(uploadIndividualVerificationService.uploadIndividualVerification).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockReq.files
      );

      // Assert: Verify response was not sent
      expect(mockRes.success).not.toHaveBeenCalled();

      // Assert: Verify error was propagated to next middleware
      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it('should handle service errors and propagate them', async () => {
      // Arrange: Mock service to throw generic error
      const serviceError = new Error('Seller not found');
      uploadIndividualVerificationService.uploadIndividualVerification.mockRejectedValue(serviceError);

      // Act: Call the controller method
      await sellerController.uploadIndividualVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called
      expect(uploadIndividualVerificationService.uploadIndividualVerification).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockReq.files
      );

      // Assert: Verify response was not sent
      expect(mockRes.success).not.toHaveBeenCalled();

      // Assert: Verify error was propagated to next middleware
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it('should handle S3 upload errors and propagate them', async () => {
      // Arrange: Mock service to throw S3 upload error
      const s3Error = new Error('S3 upload failed');
      uploadIndividualVerificationService.uploadIndividualVerification.mockRejectedValue(s3Error);

      // Act: Call the controller method
      await sellerController.uploadIndividualVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called
      expect(uploadIndividualVerificationService.uploadIndividualVerification).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockReq.files
      );

      // Assert: Verify response was not sent
      expect(mockRes.success).not.toHaveBeenCalled();

      // Assert: Verify error was propagated to next middleware
      expect(mockNext).toHaveBeenCalledWith(s3Error);
    });

    it('should handle database errors and propagate them', async () => {
      // Arrange: Mock service to throw database error
      const dbError = new Error('Database connection failed');
      uploadIndividualVerificationService.uploadIndividualVerification.mockRejectedValue(dbError);

      // Act: Call the controller method
      await sellerController.uploadIndividualVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called
      expect(uploadIndividualVerificationService.uploadIndividualVerification).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockReq.files
      );

      // Assert: Verify response was not sent
      expect(mockRes.success).not.toHaveBeenCalled();

      // Assert: Verify error was propagated to next middleware
      expect(mockNext).toHaveBeenCalledWith(dbError);
    });

    it('should extract seller ID from authenticated user', async () => {
      // Arrange: Mock successful service response
      const mockServiceResponse = {
        _id: '507f1f77bcf86cd799439011',
        verificationDocuments: {
          type: 'individual',
          documents: [
            {
              documentType: 'governmentId',
              fileUrl: 'https://cdn.example.com/verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf',
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf'
            },
            {
              documentType: 'proofOfAddress',
              fileUrl: 'https://cdn.example.com/verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf',
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf'
            }
          ]
        },
        hasFilledVerificationDocuments: true
      };

      uploadIndividualVerificationService.uploadIndividualVerification.mockResolvedValue(mockServiceResponse);

      // Act: Call the controller method
      await sellerController.uploadIndividualVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with correct seller ID
      expect(uploadIndividualVerificationService.uploadIndividualVerification).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockReq.files
      );
    });

    it('should extract files from request object', async () => {
      // Arrange: Mock successful service response
      const mockServiceResponse = {
        _id: '507f1f77bcf86cd799439011',
        verificationDocuments: {
          type: 'individual',
          documents: [
            {
              documentType: 'governmentId',
              fileUrl: 'https://cdn.example.com/verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf',
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf'
            },
            {
              documentType: 'proofOfAddress',
              fileUrl: 'https://cdn.example.com/verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf',
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf'
            }
          ]
        },
        hasFilledVerificationDocuments: true
      };

      uploadIndividualVerificationService.uploadIndividualVerification.mockResolvedValue(mockServiceResponse);

      // Act: Call the controller method
      await sellerController.uploadIndividualVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with correct files
      expect(uploadIndividualVerificationService.uploadIndividualVerification).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockReq.files
      );
    });

    it('should handle request with only required documents', async () => {
      // Arrange: Mock request with only required documents
      const mockReqRequiredOnly = {
        user: {
          id: '507f1f77bcf86cd799439011'
        },
        files: {
          governmentId: [{
            originalname: 'government-id.pdf',
            buffer: Buffer.from('test'),
            mimetype: 'application/pdf',
            size: 1024000
          }],
          proofOfAddress: [{
            originalname: 'address-proof.pdf',
            buffer: Buffer.from('test'),
            mimetype: 'application/pdf',
            size: 2048000
          }]
        }
      };

      const mockServiceResponse = {
        _id: '507f1f77bcf86cd799439011',
        verificationDocuments: {
          type: 'individual',
          documents: [
            {
              documentType: 'governmentId',
              fileUrl: 'https://cdn.example.com/verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf',
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf'
            },
            {
              documentType: 'proofOfAddress',
              fileUrl: 'https://cdn.example.com/verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf',
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf'
            }
          ]
        },
        hasFilledVerificationDocuments: true
      };

      uploadIndividualVerificationService.uploadIndividualVerification.mockResolvedValue(mockServiceResponse);

      // Act: Call the controller method
      await sellerController.uploadIndividualVerification(mockReqRequiredOnly, mockRes, mockNext);

      // Assert: Verify service was called with correct parameters
      expect(uploadIndividualVerificationService.uploadIndividualVerification).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockReqRequiredOnly.files
      );

      // Assert: Verify response was formatted correctly
      expect(mockRes.success).toHaveBeenCalledWith(
        {
          message: 'Individual verification documents uploaded successfully',
          documents: mockServiceResponse.verificationDocuments
        },
        'Individual verification documents uploaded successfully'
      );
    });

    it('should maintain exact same response structure as original function', async () => {
      // Arrange: Mock successful service response
      const mockServiceResponse = {
        _id: '507f1f77bcf86cd799439011',
        verificationDocuments: {
          type: 'individual',
          documents: [
            {
              documentType: 'governmentId',
              fileUrl: 'https://cdn.example.com/verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf',
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf'
            },
            {
              documentType: 'proofOfAddress',
              fileUrl: 'https://cdn.example.com/verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf',
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf'
            }
          ]
        },
        hasFilledVerificationDocuments: true
      };

      uploadIndividualVerificationService.uploadIndividualVerification.mockResolvedValue(mockServiceResponse);

      // Act: Call the controller method
      await sellerController.uploadIndividualVerification(mockReq, mockRes, mockNext);

      // Assert: Verify the response structure matches the original function exactly
      // Original: { message: 'Individual verification documents uploaded successfully', documents: seller.verificationDocuments }
      // New v2: { success: true, message: 'Individual verification documents uploaded successfully', data: { message: 'Individual verification documents uploaded successfully', documents: seller.verificationDocuments }, pagination: null }
      expect(mockRes.success).toHaveBeenCalledWith(
        {
          message: 'Individual verification documents uploaded successfully',
          documents: mockServiceResponse.verificationDocuments
        },
        'Individual verification documents uploaded successfully'
      );
    });
  });
});
