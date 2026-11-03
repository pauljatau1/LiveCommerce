const uploadIndividualVerificationService = require('@modules/seller/services/uploadIndividualVerification.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const uploadIndividualVerificationValidator = require('@modules/seller/validators/uploadIndividualVerification.validator');

// Mock the dependencies
jest.mock('@modules/seller/repositories/seller.repository');
jest.mock('@config/awsConfig', () => ({
  s3: {
    upload: jest.fn().mockReturnValue({
      promise: jest.fn()
    })
  }
}));
jest.mock('@modules/seller/validators/uploadIndividualVerification.validator');

const { s3 } = require('@config/awsConfig');
const { validateIndividualVerificationDocuments } = require('@modules/seller/validators/uploadIndividualVerification.validator');

describe('uploadIndividualVerificationService', () => {
  const mockSellerId = '507f1f77bcf86cd799439011';
  const mockFiles = {
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

  describe('uploadIndividualVerification', () => {
    it('should upload individual verification documents successfully with all files', async () => {
      // Arrange: Mock successful validation and repository calls
      validateIndividualVerificationDocuments.mockImplementation(() => {}); // No error thrown
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue({
        ...mockSeller,
        verificationDocuments: {
          type: 'individual',
          documents: [
            {
              documentType: 'individualTaxId',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/individual/uuid-tax-id.pdf`,
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-tax-id.pdf'
            },
            {
              documentType: 'governmentId',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf`,
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf'
            },
            {
              documentType: 'proofOfAddress',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf`,
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf'
            }
          ]
        },
        hasFilledVerificationDocuments: true
      });

      // Act: Call the service
      const result = await uploadIndividualVerificationService.uploadIndividualVerification(mockSellerId, mockFiles);

      // Assert: Verify all expected calls were made
      expect(validateIndividualVerificationDocuments).toHaveBeenCalledWith(mockFiles);
      expect(sellerRepository.findById).toHaveBeenCalledWith(mockSellerId);
      expect(s3.upload().promise).toHaveBeenCalledTimes(3); // Called for all three files
      expect(sellerRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        verificationDocuments: {
          type: 'individual',
          documents: expect.any(Array)
        },
        hasFilledVerificationDocuments: true
      }));

      // Verify the result structure
      expect(result.verificationDocuments.type).toBe('individual');
      expect(result.verificationDocuments.documents).toHaveLength(3);
      expect(result.hasFilledVerificationDocuments).toBe(true);
    });

    it('should upload only required documents when optional document is not provided', async () => {
      // Arrange: Mock files with only required documents
      const filesWithOnlyRequired = {
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
      };

      validateIndividualVerificationDocuments.mockImplementation(() => {}); // No error thrown
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue({
        ...mockSeller,
        verificationDocuments: {
          type: 'individual',
          documents: [
            {
              documentType: 'governmentId',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf`,
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf'
            },
            {
              documentType: 'proofOfAddress',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf`,
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf'
            }
          ]
        },
        hasFilledVerificationDocuments: true
      });

      // Act: Call the service
      const result = await uploadIndividualVerificationService.uploadIndividualVerification(mockSellerId, filesWithOnlyRequired);

      // Assert: Verify only two S3 uploads were made
      expect(s3.upload().promise).toHaveBeenCalledTimes(2);
      expect(result.verificationDocuments.documents).toHaveLength(2);
      expect(result.verificationDocuments.documents[0].documentType).toBe('governmentId');
      expect(result.verificationDocuments.documents[1].documentType).toBe('proofOfAddress');
    });

    it('should throw ValidationError when validation fails', async () => {
      // Arrange: Mock validation to fail
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = [
        { field: 'governmentId', message: 'Government ID is required' }
      ];
      validateIndividualVerificationDocuments.mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert: Should throw ValidationError
      await expect(uploadIndividualVerificationService.uploadIndividualVerification(mockSellerId, mockFiles))
        .rejects.toThrow('Validation failed');
    });

    it('should throw Error when seller not found', async () => {
      // Arrange: Mock validation to pass but seller not found
      validateIndividualVerificationDocuments.mockImplementation(() => {}); // No error thrown
      sellerRepository.findById.mockResolvedValue(null);

      // Act & Assert: Should throw Error
      await expect(uploadIndividualVerificationService.uploadIndividualVerification(mockSellerId, mockFiles))
        .rejects.toThrow('Seller not found');
    });

    it('should handle S3 upload errors gracefully', async () => {
      // Arrange: Mock successful validation, seller found, but S3 upload fails
      validateIndividualVerificationDocuments.mockImplementation(() => {}); // No error thrown
      sellerRepository.findById.mockResolvedValue(mockSeller);
      s3.upload().promise.mockRejectedValue(new Error('S3 upload failed'));

      // Act & Assert: Should throw Error
      await expect(uploadIndividualVerificationService.uploadIndividualVerification(mockSellerId, mockFiles))
        .rejects.toThrow('S3 upload failed');
    });

    it('should handle database save errors gracefully', async () => {
      // Arrange: Mock successful validation, seller found, and S3 upload, but database save fails
      validateIndividualVerificationDocuments.mockImplementation(() => {}); // No error thrown
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockRejectedValue(new Error('Database save failed'));

      // Act & Assert: Should throw Error
      await expect(uploadIndividualVerificationService.uploadIndividualVerification(mockSellerId, mockFiles))
        .rejects.toThrow('Database save failed');
    });

    it('should create correct verification documents structure', async () => {
      // Arrange: Mock successful validation and repository calls
      validateIndividualVerificationDocuments.mockImplementation(() => {}); // No error thrown
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue({
        ...mockSeller,
        verificationDocuments: {
          type: 'individual',
          documents: [
            {
              documentType: 'governmentId',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf`,
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf'
            },
            {
              documentType: 'proofOfAddress',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf`,
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf'
            }
          ]
        },
        hasFilledVerificationDocuments: true
      });

      // Act: Call the service
      const result = await uploadIndividualVerificationService.uploadIndividualVerification(mockSellerId, {
        governmentId: mockFiles.governmentId,
        proofOfAddress: mockFiles.proofOfAddress
      });

      // Assert: Verify the verification documents structure
      expect(result.verificationDocuments.type).toBe('individual');
      expect(result.verificationDocuments.documents).toHaveLength(2);
      expect(result.verificationDocuments.documents[0].documentType).toBe('governmentId');
      expect(result.verificationDocuments.documents[1].documentType).toBe('proofOfAddress');
      expect(result.hasFilledVerificationDocuments).toBe(true);
    });

    it('should handle files with different MIME types correctly', async () => {
      // Arrange: Mock files with different MIME types
      const filesWithDifferentTypes = {
        individualTaxId: [{
          originalname: 'tax-id.jpg',
          buffer: Buffer.from('test'),
          mimetype: 'image/jpeg',
          size: 1024000
        }],
        governmentId: [{
          originalname: 'government-id.docx',
          buffer: Buffer.from('test'),
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 2048000
        }],
        proofOfAddress: [{
          originalname: 'address-proof.png',
          buffer: Buffer.from('test'),
          mimetype: 'image/png',
          size: 3072000
        }]
      };

      validateIndividualVerificationDocuments.mockImplementation(() => {}); // No error thrown
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue({
        ...mockSeller,
        verificationDocuments: {
          type: 'individual',
          documents: [
            {
              documentType: 'individualTaxId',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/individual/uuid-tax-id.jpg`,
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-tax-id.jpg'
            },
            {
              documentType: 'governmentId',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/individual/uuid-government-id.docx`,
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-government-id.docx'
            },
            {
              documentType: 'proofOfAddress',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.png`,
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.png'
            }
          ]
        },
        hasFilledVerificationDocuments: true
      });

      // Act: Call the service
      const result = await uploadIndividualVerificationService.uploadIndividualVerification(mockSellerId, filesWithDifferentTypes);

      // Assert: Verify all three S3 uploads were made
      expect(s3.upload().promise).toHaveBeenCalledTimes(3);
      expect(result.verificationDocuments.documents).toHaveLength(3);
      expect(result.verificationDocuments.documents[0].documentType).toBe('individualTaxId');
      expect(result.verificationDocuments.documents[1].documentType).toBe('governmentId');
      expect(result.verificationDocuments.documents[2].documentType).toBe('proofOfAddress');
    });

    it('should generate unique file names for each upload', async () => {
      // Arrange: Mock successful validation and repository calls
      validateIndividualVerificationDocuments.mockImplementation(() => {}); // No error thrown
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue({
        ...mockSeller,
        verificationDocuments: {
          type: 'individual',
          documents: [
            {
              documentType: 'governmentId',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/individual/uuid1-government-id.pdf`,
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid1-government-id.pdf'
            },
            {
              documentType: 'proofOfAddress',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/individual/uuid2-address-proof.pdf`,
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid2-address-proof.pdf'
            }
          ]
        },
        hasFilledVerificationDocuments: true
      });

      // Act: Call the service
      await uploadIndividualVerificationService.uploadIndividualVerification(mockSellerId, {
        governmentId: mockFiles.governmentId,
        proofOfAddress: mockFiles.proofOfAddress
      });

      // Assert: Verify unique keys are generated
      const uploadCalls = s3.upload.mock.calls;
      expect(uploadCalls).toHaveLength(3); // First call is empty, then 2 actual calls
      
      // Get the actual upload calls (skip the first empty one)
      const actualUploadCalls = uploadCalls.filter(call => call.length > 0 && call[0].Key);
      expect(actualUploadCalls).toHaveLength(2);
      
      // Check that the first and second calls have different keys
      const firstKey = actualUploadCalls[0][0].Key;
      const secondKey = actualUploadCalls[1][0].Key;
      expect(firstKey).not.toBe(secondKey);
      
      // Verify the key format matches expected pattern
      expect(firstKey).toMatch(/^verification\/507f1f77bcf86cd799439011\/individual\/[a-f0-9-]+-government-id\.pdf$/);
      expect(secondKey).toMatch(/^verification\/507f1f77bcf86cd799439011\/individual\/[a-f0-9-]+-address-proof\.pdf$/);
    });

    it('should set hasFilledVerificationDocuments to true after successful upload', async () => {
      // Arrange: Mock successful validation and repository calls
      validateIndividualVerificationDocuments.mockImplementation(() => {}); // No error thrown
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue({
        ...mockSeller,
        verificationDocuments: {
          type: 'individual',
          documents: [
            {
              documentType: 'governmentId',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf`,
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf'
            },
            {
              documentType: 'proofOfAddress',
              fileUrl: `https://${process.env.CDN_URL}/verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf`,
              public_id: 'verification/507f1f77bcf86cd799439011/individual/uuid-address-proof.pdf'
            }
          ]
        },
        hasFilledVerificationDocuments: true
      });

      // Act: Call the service
      const result = await uploadIndividualVerificationService.uploadIndividualVerification(mockSellerId, {
        governmentId: mockFiles.governmentId,
        proofOfAddress: mockFiles.proofOfAddress
      });

      // Assert: Verify hasFilledVerificationDocuments is set to true
      expect(result.hasFilledVerificationDocuments).toBe(true);
      expect(sellerRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        hasFilledVerificationDocuments: true
      }));
    });
  });
});
