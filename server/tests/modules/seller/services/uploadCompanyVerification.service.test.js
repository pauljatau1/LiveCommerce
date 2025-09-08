const uploadCompanyVerificationService = require('@modules/seller/services/uploadCompanyVerification.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const uploadCompanyVerificationValidator = require('@modules/seller/validators/uploadCompanyVerification.validator');

// Mock the dependencies
jest.mock('@modules/seller/repositories/seller.repository');
jest.mock('@config/awsConfig', () => ({
  s3: {
    upload: jest.fn().mockReturnValue({
      promise: jest.fn()
    })
  }
}));
jest.mock('@modules/seller/validators/uploadCompanyVerification.validator');

const { s3 } = require('@config/awsConfig');
const { validateCompanyVerificationDocuments } = require('@modules/seller/validators/uploadCompanyVerification.validator');

describe('uploadCompanyVerificationService', () => {
  const mockSellerId = '507f1f77bcf86cd799439011';
  const mockFiles = {
    certificateOfIncorporation: [{
      originalname: 'certificate.pdf',
      buffer: Buffer.from('test'),
      mimetype: 'application/pdf',
      size: 1024000
    }],
    businessTaxId: [{
      originalname: 'tax-id.pdf',
      buffer: Buffer.from('test'),
      mimetype: 'application/pdf',
      size: 2048000
    }]
  };

  const mockSeller = {
    _id: mockSellerId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    verificationDocuments: [],
    hasFilledVerificationDocuments: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set default successful S3 upload mock
    s3.upload().promise.mockResolvedValue({
      Location: 'https://s3.amazonaws.com/bucket/test-key',
      Key: 'test-key'
    });
  });

  describe('uploadCompanyVerification', () => {
    it('should upload company verification documents successfully', async () => {
      // Arrange: Mock successful validation and repository calls
      validateCompanyVerificationDocuments.mockImplementation(() => {}); // No error thrown
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue({
        ...mockSeller,
        verificationDocuments: {
          type: 'company',
          documents: [
            {
              documentType: 'certificateOfIncorporation',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/company/uuid-certificate.pdf`,
              public_id: 'verification/507f1f77bcf86cd799439011/company/uuid-certificate.pdf'
            },
            {
              documentType: 'businessTaxId',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/company/uuid-tax-id.pdf`,
              public_id: 'verification/507f1f77bcf86cd799439011/company/uuid-tax-id.pdf'
            }
          ]
        },
        hasFilledVerificationDocuments: true
      });

      // Act: Call the service
      const result = await uploadCompanyVerificationService.uploadCompanyVerification(mockSellerId, mockFiles);

      // Assert: Verify all expected calls were made
      expect(validateCompanyVerificationDocuments).toHaveBeenCalledWith(mockFiles);
      expect(sellerRepository.findById).toHaveBeenCalledWith(mockSellerId);
      expect(s3.upload().promise).toHaveBeenCalledTimes(2); // Called for both files
      
      // Verify the save call was made with correct data structure
      expect(sellerRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        verificationDocuments: expect.objectContaining({
          type: 'company',
          documents: expect.any(Array)
        }),
        hasFilledVerificationDocuments: true
      }));

      // Verify the result structure
      expect(result.verificationDocuments.type).toBe('company');
      expect(result.verificationDocuments.documents).toHaveLength(2);
      expect(result.hasFilledVerificationDocuments).toBe(true);
    });

    it('should upload only required document when optional document is not provided', async () => {
      // Arrange: Mock files with only required document
      const filesWithOnlyRequired = {
        certificateOfIncorporation: [{
          originalname: 'certificate.pdf',
          buffer: Buffer.from('test'),
          mimetype: 'application/pdf',
          size: 1024000
        }]
      };

      validateCompanyVerificationDocuments.mockImplementation(() => {}); // No error thrown
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue({
        ...mockSeller,
        verificationDocuments: {
          type: 'company',
          documents: [
            {
              documentType: 'certificateOfIncorporation',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/company/uuid-certificate.pdf`,
              public_id: 'verification/507f1f77bcf86cd799439011/company/uuid-certificate.pdf'
            }
          ]
        },
        hasFilledVerificationDocuments: true
      });

      // Act: Call the service
      const result = await uploadCompanyVerificationService.uploadCompanyVerification(mockSellerId, filesWithOnlyRequired);

      // Assert: Verify only one S3 upload was made
      expect(s3.upload().promise).toHaveBeenCalledTimes(1);
      expect(result.verificationDocuments.documents).toHaveLength(1);
      expect(result.verificationDocuments.documents[0].documentType).toBe('certificateOfIncorporation');
    });

    it('should throw ValidationError when validation fails', async () => {
      // Arrange: Mock validation to fail
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = [
        { field: 'certificateOfIncorporation', message: 'Certificate of Incorporation is required' }
      ];
      validateCompanyVerificationDocuments.mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert: Should throw ValidationError
      await expect(uploadCompanyVerificationService.uploadCompanyVerification(mockSellerId, mockFiles))
        .rejects.toThrow('Validation failed');
    });

    it('should throw Error when seller not found', async () => {
      // Arrange: Mock validation to pass but seller not found
      validateCompanyVerificationDocuments.mockImplementation(() => {}); // No error thrown
      sellerRepository.findById.mockResolvedValue(null);

      // Act & Assert: Should throw Error
      await expect(uploadCompanyVerificationService.uploadCompanyVerification(mockSellerId, mockFiles))
        .rejects.toThrow('Seller not found');
    });

    it('should handle S3 upload errors gracefully', async () => {
      // Arrange: Mock successful validation, seller found, but S3 upload fails
      validateCompanyVerificationDocuments.mockImplementation(() => {}); // No error thrown
      sellerRepository.findById.mockResolvedValue(mockSeller);
      s3.upload().promise.mockRejectedValue(new Error('S3 upload failed'));

      // Act & Assert: Should throw Error
      await expect(uploadCompanyVerificationService.uploadCompanyVerification(mockSellerId, mockFiles))
        .rejects.toThrow('S3 upload failed');
    });

    it('should handle database save errors gracefully', async () => {
      // Arrange: Mock successful validation, seller found, and S3 upload, but database save fails
      validateCompanyVerificationDocuments.mockImplementation(() => {}); // No error thrown
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockRejectedValue(new Error('Database save failed'));

      // Act & Assert: Should throw Error
      await expect(uploadCompanyVerificationService.uploadCompanyVerification(mockSellerId, mockFiles))
        .rejects.toThrow('Database save failed');
    });
  });
});
