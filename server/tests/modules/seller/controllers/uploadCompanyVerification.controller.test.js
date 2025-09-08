/**
 * Upload Company Verification Controller Tests
 *
 * This test suite covers all HTTP request handling scenarios for company verification
 * document uploads, ensuring comprehensive test coverage for the controller layer.
 *
 * Test Coverage:
 * - Successful document uploads
 * - Error handling and forwarding
 * - Request data extraction
 * - Service delegation
 * - Response formatting
 * - Error scenarios and edge cases
 *
 * @module uploadCompanyVerificationControllerTests
 */

const uploadCompanyVerificationService = require('@modules/seller/services/uploadCompanyVerification.service');
const sellerController = require('@modules/seller/controllers/seller.controller');
const ValidationError = require('@utils/errors/ValidationError');

// Mock dependencies
jest.mock('@modules/seller/services/uploadCompanyVerification.service');

describe('Upload Company Verification Controller', () => {
  const mockSellerId = '507f1f77bcf86cd799439011';
  const mockFiles = {
    certificateOfIncorporation: [{
      originalname: 'certificate.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('certificate content'),
      size: 1024000
    }],
    businessTaxId: [{
      originalname: 'tax-id.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('tax id content'),
      size: 2048000
    }]
  };

  const mockServiceResponse = {
    _id: mockSellerId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    verificationDocuments: {
      type: 'company',
      documents: [
        {
          documentType: 'certificateOfIncorporation',
          fileUrl: 'https://cdn.example.com/verification/507f1f77bcf86cd799439011/company/uuid-certificate.pdf',
          public_id: 'verification/507f1f77bcf86cd799439011/company/uuid-certificate.pdf'
        },
        {
          documentType: 'businessTaxId',
          fileUrl: 'https://cdn.example.com/verification/507f1f77bcf86cd799439011/company/uuid-tax-id.pdf',
          public_id: 'verification/507f1f77bcf86cd799439011/company/uuid-tax-id.pdf'
        }
      ]
    },
    hasFilledVerificationDocuments: true
  };

  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup mock request object
    mockReq = {
      user: { id: mockSellerId },
      files: mockFiles
    };

    // Setup mock response object with success method
    mockRes = {
      success: jest.fn()
    };

    // Setup mock next function
    mockNext = jest.fn();
  });

  describe('uploadCompanyVerification', () => {
    it('should successfully upload company verification documents and return success response', async () => {
      // Arrange: Mock service to return successful response
      uploadCompanyVerificationService.uploadCompanyVerification.mockResolvedValue(mockServiceResponse);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with correct parameters
      expect(uploadCompanyVerificationService.uploadCompanyVerification).toHaveBeenCalledWith(mockSellerId, mockFiles);
      
      // Assert: Verify success response was sent with correct data structure
      expect(mockRes.success).toHaveBeenCalledWith(
        {
          message: 'Company verification documents uploaded successfully',
          documents: mockServiceResponse.verificationDocuments
        },
        'Company verification documents uploaded successfully'
      );
      
      // Assert: Verify next was not called (no errors)
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with ValidationError when service throws validation error', async () => {
      // Arrange: Mock service to throw ValidationError
      const validationError = new ValidationError([
        { field: 'certificateOfIncorporation', message: 'Certificate of Incorporation file size must not exceed 10MB' }
      ]);
      uploadCompanyVerificationService.uploadCompanyVerification.mockRejectedValue(validationError);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with correct parameters
      expect(uploadCompanyVerificationService.uploadCompanyVerification).toHaveBeenCalledWith(mockSellerId, mockFiles);
      
      // Assert: Verify next was called with the error
      expect(mockNext).toHaveBeenCalledWith(validationError);
      
      // Assert: Verify success was not called
      expect(mockRes.success).not.toHaveBeenCalled();
    });

    it('should call next with Error when service throws seller not found error', async () => {
      // Arrange: Mock service to throw Error
      const notFoundError = new Error('Seller not found');
      uploadCompanyVerificationService.uploadCompanyVerification.mockRejectedValue(notFoundError);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with correct parameters
      expect(uploadCompanyVerificationService.uploadCompanyVerification).toHaveBeenCalledWith(mockSellerId, mockFiles);
      
      // Assert: Verify next was called with the error
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
      
      // Assert: Verify success was not called
      expect(mockRes.success).not.toHaveBeenCalled();
    });

    it('should call next with Error when service throws S3 upload error', async () => {
      // Arrange: Mock service to throw Error
      const s3Error = new Error('S3 upload failed');
      uploadCompanyVerificationService.uploadCompanyVerification.mockRejectedValue(s3Error);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with correct parameters
      expect(uploadCompanyVerificationService.uploadCompanyVerification).toHaveBeenCalledWith(mockSellerId, mockFiles);
      
      // Assert: Verify next was called with the error
      expect(mockNext).toHaveBeenCalledWith(s3Error);
      
      // Assert: Verify success was not called
      expect(mockRes.success).not.toHaveBeenCalled();
    });

    it('should call next with Error when service throws database save error', async () => {
      // Arrange: Mock service to throw Error
      const dbError = new Error('Database save failed');
      uploadCompanyVerificationService.uploadCompanyVerification.mockRejectedValue(dbError);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with correct parameters
      expect(uploadCompanyVerificationService.uploadCompanyVerification).toHaveBeenCalledWith(mockSellerId, mockFiles);
      
      // Assert: Verify next was called with the error
      expect(mockNext).toHaveBeenCalledWith(dbError);
      
      // Assert: Verify success was not called
      expect(mockRes.success).not.toHaveBeenCalled();
    });

    it('should extract seller ID from req.user.id correctly', async () => {
      // Arrange: Mock service to return successful response
      uploadCompanyVerificationService.uploadCompanyVerification.mockResolvedValue(mockServiceResponse);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with correct seller ID
      expect(uploadCompanyVerificationService.uploadCompanyVerification).toHaveBeenCalledWith(mockSellerId, mockFiles);
      
      // Assert: Verify success response was sent
      expect(mockRes.success).toHaveBeenCalled();
    });

    it('should extract files from req.files correctly', async () => {
      // Arrange: Mock service to return successful response
      uploadCompanyVerificationService.uploadCompanyVerification.mockResolvedValue(mockServiceResponse);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with correct files
      expect(uploadCompanyVerificationService.uploadCompanyVerification).toHaveBeenCalledWith(mockSellerId, mockFiles);
      
      // Assert: Verify success response was sent
      expect(mockRes.success).toHaveBeenCalled();
    });

    it('should return response with exact same structure as original function in data object', async () => {
      // Arrange: Mock service to return successful response
      uploadCompanyVerificationService.uploadCompanyVerification.mockResolvedValue(mockServiceResponse);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify response structure matches original function
      // Original: { message: 'Company verification documents uploaded successfully', documents: seller.verificationDocuments }
      // New v2: { success: true, message: 'Company verification documents uploaded successfully', data: { message: 'Company verification documents uploaded successfully', documents: seller.verificationDocuments }, pagination: null }
      expect(mockRes.success).toHaveBeenCalledWith(
        {
          message: 'Company verification documents uploaded successfully',
          documents: mockServiceResponse.verificationDocuments
        },
        'Company verification documents uploaded successfully'
      );
    });

    it('should handle request with only certificate of incorporation file', async () => {
      // Arrange: Mock files with only required document
      const filesWithOnlyCert = {
        certificateOfIncorporation: [mockFiles.certificateOfIncorporation[0]]
      };
      mockReq.files = filesWithOnlyCert;
      
      // Mock service to return successful response
      uploadCompanyVerificationService.uploadCompanyVerification.mockResolvedValue(mockServiceResponse);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with correct files
      expect(uploadCompanyVerificationService.uploadCompanyVerification).toHaveBeenCalledWith(mockSellerId, filesWithOnlyCert);
      
      // Assert: Verify success response was sent
      expect(mockRes.success).toHaveBeenCalled();
    });

    it('should handle request with both certificate and business tax ID files', async () => {
      // Arrange: Mock files with both documents
      const filesWithBoth = {
        certificateOfIncorporation: [mockFiles.certificateOfIncorporation[0]],
        businessTaxId: [mockFiles.businessTaxId[0]]
      };
      mockReq.files = filesWithBoth;
      
      // Mock service to return successful response
      uploadCompanyVerificationService.uploadCompanyVerification.mockResolvedValue(mockServiceResponse);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with correct files
      expect(uploadCompanyVerificationService.uploadCompanyVerification).toHaveBeenCalledWith(mockSellerId, filesWithBoth);
      
      // Assert: Verify success response was sent
      expect(mockRes.success).toHaveBeenCalled();
    });

    it('should handle different seller IDs correctly', async () => {
      // Arrange: Mock different seller ID
      const differentSellerId = '507f1f77bcf86cd799439012';
      mockReq.user.id = differentSellerId;
      
      // Mock service to return successful response
      uploadCompanyVerificationService.uploadCompanyVerification.mockResolvedValue(mockServiceResponse);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with correct seller ID
      expect(uploadCompanyVerificationService.uploadCompanyVerification).toHaveBeenCalledWith(differentSellerId, mockFiles);
      
      // Assert: Verify success response was sent
      expect(mockRes.success).toHaveBeenCalled();
    });

    it('should handle empty files object correctly', async () => {
      // Arrange: Mock empty files object
      const emptyFiles = {};
      mockReq.files = emptyFiles;
      
      // Mock service to return successful response
      uploadCompanyVerificationService.uploadCompanyVerification.mockResolvedValue(mockServiceResponse);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with empty files
      expect(uploadCompanyVerificationService.uploadCompanyVerification).toHaveBeenCalledWith(mockSellerId, emptyFiles);
      
      // Assert: Verify success response was sent
      expect(mockRes.success).toHaveBeenCalled();
    });

    it('should handle null files object correctly', async () => {
      // Arrange: Mock null files object
      mockReq.files = null;
      
      // Mock service to return successful response
      uploadCompanyVerificationService.uploadCompanyVerification.mockResolvedValue(mockServiceResponse);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with null files
      expect(uploadCompanyVerificationService.uploadCompanyVerification).toHaveBeenCalledWith(mockSellerId, null);
      
      // Assert: Verify success response was sent
      expect(mockRes.success).toHaveBeenCalled();
    });

    it('should handle undefined files object correctly', async () => {
      // Arrange: Mock undefined files object
      mockReq.files = undefined;
      
      // Mock service to return successful response
      uploadCompanyVerificationService.uploadCompanyVerification.mockResolvedValue(mockServiceResponse);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with undefined files
      expect(uploadCompanyVerificationService.uploadCompanyVerification).toHaveBeenCalledWith(mockSellerId, undefined);
      
      // Assert: Verify success response was sent
      expect(mockRes.success).toHaveBeenCalled();
    });

    it('should handle service response with different verification document types', async () => {
      // Arrange: Mock service response with different document types
      const serviceResponseWithDifferentTypes = {
        ...mockServiceResponse,
        verificationDocuments: {
          type: 'company',
          documents: [
            {
              documentType: 'certificateOfIncorporation',
              fileUrl: 'https://cdn.example.com/verification/507f1f77bcf86cd799439011/company/uuid-certificate.jpg',
              public_id: 'verification/507f1f77bcf86cd799439011/company/uuid-certificate.jpg'
            }
          ]
        }
      };
      
      uploadCompanyVerificationService.uploadCompanyVerification.mockResolvedValue(serviceResponseWithDifferentTypes);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with correct parameters
      expect(uploadCompanyVerificationService.uploadCompanyVerification).toHaveBeenCalledWith(mockSellerId, mockFiles);
      
      // Assert: Verify success response was sent with different document types
      expect(mockRes.success).toHaveBeenCalledWith(
        {
          message: 'Company verification documents uploaded successfully',
          documents: serviceResponseWithDifferentTypes.verificationDocuments
        },
        'Company verification documents uploaded successfully'
      );
    });

    it('should handle service response with empty verification documents array', async () => {
      // Arrange: Mock service response with empty documents array
      const serviceResponseWithEmptyDocs = {
        ...mockServiceResponse,
        verificationDocuments: {
          type: 'company',
          documents: []
        }
      };
      
      uploadCompanyVerificationService.uploadCompanyVerification.mockResolvedValue(serviceResponseWithEmptyDocs);

      // Act: Call the controller method
      await sellerController.uploadCompanyVerification(mockReq, mockRes, mockNext);

      // Assert: Verify service was called with correct parameters
      expect(uploadCompanyVerificationService.uploadCompanyVerification).toHaveBeenCalledWith(mockSellerId, mockFiles);
      
      // Assert: Verify success response was sent with empty documents array
      expect(mockRes.success).toHaveBeenCalledWith(
        {
          message: 'Company verification documents uploaded successfully',
          documents: serviceResponseWithEmptyDocs.verificationDocuments
        },
        'Company verification documents uploaded successfully'
      );
    });
  });
});
