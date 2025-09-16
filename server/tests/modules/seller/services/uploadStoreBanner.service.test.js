const { uploadStoreBanner } = require('@modules/seller/services/uploadStoreBanner.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const { validateUploadStoreBannerData } = require('@modules/seller/validators/uploadStoreBanner.validator');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');
const { DeleteS3Objects } = require('@utils/s3');

// Mock dependencies
jest.mock('@modules/seller/repositories/seller.repository');
jest.mock('@modules/seller/validators/uploadStoreBanner.validator');
jest.mock('@config/awsConfig', () => ({
  s3: {
    upload: jest.fn().mockReturnValue({
      promise: jest.fn()
    })
  }
}));
jest.mock('@utils/s3', () => ({
  DeleteS3Objects: jest.fn()
}));
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123')
}));

describe('Upload Store Banner Service', () => {
  let sellerId;
  let mockSeller;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup test data
    sellerId = '507f1f77bcf86cd799439011';
    mockSeller = {
      _id: sellerId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'Seller',
      phoneNumber: '+1234567890',
      businessName: 'Test Business',
      businessType: 'retail',
      accountType: 'business',
      isVerified: true,
      storeName: 'Test Store',
      aboutStore: 'A test store',
      storeAvatar: {
        url: 'https://test-cdn-url/avatar.jpg',
        public_id: 'avatar.jpg'
      },
      storeBanner: {
        url: 'https://test-cdn-url/old-banner.jpg',
        public_id: 'old-banner.jpg'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockResolvedValue({
        _id: sellerId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'Seller',
        phoneNumber: '+1234567890',
        businessName: 'Test Business',
        businessType: 'retail',
        accountType: 'business',
        isVerified: true,
        storeName: 'Test Store',
        aboutStore: 'A test store',
        storeAvatar: {
          url: 'https://test-cdn-url/avatar.jpg',
          public_id: 'avatar.jpg'
        },
        storeBanner: {
          url: 'https://test-cdn-url/mock-uuid-123-banner.jpg',
          public_id: 'mock-uuid-123-banner.jpg'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      })
    };
  });

  describe('uploadStoreBanner', () => {
    const mockFile = {
      buffer: Buffer.from('fake-banner-data'),
      originalname: 'banner.jpg',
      mimetype: 'image/jpeg',
      size: 1024000
    };

    const mockUploadData = {
      Key: 'mock-uuid-123-banner.jpg',
      Location: 'https://s3.amazonaws.com/bucket/mock-uuid-123-banner.jpg'
    };

    it('should successfully upload store banner', async () => {
      // Arrange: Mock dependencies
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(mockSeller);
      validateUploadStoreBannerData.mockImplementation(() => {});
      
      const { s3 } = require('@config/awsConfig');
      s3.upload().promise.mockResolvedValue(mockUploadData);
      DeleteS3Objects.mockResolvedValue({ Errors: [] });

      // Act: Call the service
      const result = await uploadStoreBanner(sellerId, mockFile);

      // Assert: Verify the result
      expect(result).toEqual({
        message: 'Store banner uploaded successfully',
        seller: expect.objectContaining({
          _id: sellerId,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'Seller',
          storeBanner: expect.objectContaining({
            url: expect.stringContaining('mock-uuid-123-banner.jpg'),
            public_id: expect.stringContaining('mock-uuid-123-banner.jpg')
          })
        })
      });

      // Verify validator was called
      expect(validateUploadStoreBannerData).toHaveBeenCalledWith(mockFile);

      // Verify repository methods were called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);
      expect(sellerRepository.save).toHaveBeenCalledWith(mockSeller);

      // Verify S3 upload was called
      expect(s3.upload).toHaveBeenCalledWith({
        Bucket: process.env.CDN_S3_BUCKET,
        Key: 'mock-uuid-123-banner.jpg',
        Body: mockFile.buffer,
        ContentType: mockFile.mimetype
      });

      // Verify previous banner deletion was attempted
      expect(DeleteS3Objects).toHaveBeenCalledWith(
        [{ Key: 'old-banner.jpg' }],
        process.env.CDN_S3_BUCKET
      );
    });

    it('should throw ValidationError for invalid file data', async () => {
      // Arrange: Mock validator to throw ValidationError
      const validationError = new ValidationError([
        { field: 'file.buffer', message: 'File buffer must be a valid Buffer object' }
      ]);
      validateUploadStoreBannerData.mockImplementation(() => {
        throw validationError;
      });

      const invalidFile = {
        buffer: 'not-a-buffer',
        originalname: '',
        mimetype: 'text/plain',
        size: 'not-a-number'
      };

      // Act & Assert: Should throw ValidationError
      await expect(uploadStoreBanner(sellerId, invalidFile))
        .rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundException when seller is not found', async () => {
      // Arrange: Mock validator and repository
      validateUploadStoreBannerData.mockImplementation(() => {});
      sellerRepository.findById.mockResolvedValue(null);

      const nonExistentSellerId = '507f1f77bcf86cd799439012';

      // Act & Assert: Should throw NotFoundException
      await expect(uploadStoreBanner(nonExistentSellerId, mockFile))
        .rejects.toThrow(NotFoundException);
    });

    it('should handle seller without existing banner', async () => {
      // Arrange: Mock seller without banner
      const sellerWithoutBanner = {
        _id: sellerId,
        email: 'test2@example.com',
        firstName: 'Test2',
        lastName: 'Seller2',
        storeBanner: null,
        save: jest.fn().mockResolvedValue({
          _id: sellerId,
          storeBanner: {
            url: 'https://test-cdn-url/mock-uuid-123-banner.jpg',
            public_id: 'mock-uuid-123-banner.jpg'
          }
        })
      };

      sellerRepository.findById.mockResolvedValue(sellerWithoutBanner);
      sellerRepository.save.mockResolvedValue(sellerWithoutBanner);
      validateUploadStoreBannerData.mockImplementation(() => {});
      
      const { s3 } = require('@config/awsConfig');
      s3.upload().promise.mockResolvedValue(mockUploadData);

      // Act: Call the service
      const result = await uploadStoreBanner(sellerId, mockFile);

      // Assert: Verify the result
      expect(result).toEqual({
        message: 'Store banner uploaded successfully',
        seller: expect.objectContaining({
          _id: sellerId,
          email: 'test2@example.com',
          firstName: 'Test2',
          lastName: 'Seller2',
          storeBanner: expect.objectContaining({
            url: expect.stringContaining('mock-uuid-123-banner.jpg'),
            public_id: expect.stringContaining('mock-uuid-123-banner.jpg')
          })
        })
      });

      // Verify DeleteS3Objects was not called since there was no previous banner
      expect(DeleteS3Objects).not.toHaveBeenCalled();
    });

    it('should handle previous banner deletion with errors gracefully', async () => {
      // Arrange: Mock S3 upload and deletion with errors
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(mockSeller);
      validateUploadStoreBannerData.mockImplementation(() => {});
      
      const { s3 } = require('@config/awsConfig');
      s3.upload().promise.mockResolvedValue(mockUploadData);
      DeleteS3Objects.mockResolvedValue({ 
        Errors: [{ Key: 'old-banner.jpg', Code: 'NoSuchKey', Message: 'The specified key does not exist.' }] 
      });

      // Act: Call the service
      const result = await uploadStoreBanner(sellerId, mockFile);

      // Assert: Should still succeed despite deletion errors
      expect(result).toEqual({
        message: 'Store banner uploaded successfully',
        seller: expect.objectContaining({
          _id: sellerId,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'Seller',
          storeBanner: expect.objectContaining({
            url: expect.stringContaining('mock-uuid-123-banner.jpg'),
            public_id: expect.stringContaining('mock-uuid-123-banner.jpg')
          })
        })
      });

      // Verify deletion was attempted
      expect(DeleteS3Objects).toHaveBeenCalledWith(
        [{ Key: 'old-banner.jpg' }],
        process.env.CDN_S3_BUCKET
      );
    });

    it('should handle S3 upload failure', async () => {
      // Arrange: Mock S3 upload failure
      validateUploadStoreBannerData.mockImplementation(() => {});
      sellerRepository.findById.mockResolvedValue(mockSeller);
      
      const { s3 } = require('@config/awsConfig');
      s3.upload().promise.mockRejectedValue(new Error('S3 upload failed'));

      // Act & Assert: Should throw the S3 error
      await expect(uploadStoreBanner(sellerId, mockFile))
        .rejects.toThrow('S3 upload failed');
    });

    it('should handle database save failure', async () => {
      // Arrange: Mock S3 upload success but database save failure
      validateUploadStoreBannerData.mockImplementation(() => {});
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockRejectedValue(new Error('Database save failed'));
      
      const { s3 } = require('@config/awsConfig');
      s3.upload().promise.mockResolvedValue(mockUploadData);

      // Act & Assert: Should throw the database error
      await expect(uploadStoreBanner(sellerId, mockFile))
        .rejects.toThrow('Database save failed');
    });

    it('should handle different file types correctly', async () => {
      // Arrange: Test with PNG file
      const pngFile = {
        buffer: Buffer.from('fake-png-data'),
        originalname: 'banner.png',
        mimetype: 'image/png',
        size: 2048000
      };

      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(mockSeller);
      validateUploadStoreBannerData.mockImplementation(() => {});
      
      const { s3 } = require('@config/awsConfig');
      s3.upload().promise.mockResolvedValue({
        Key: 'mock-uuid-123-banner.png',
        Location: 'https://s3.amazonaws.com/bucket/mock-uuid-123-banner.png'
      });

      DeleteS3Objects.mockResolvedValue({ Errors: [] });

      // Act: Call the service
      const result = await uploadStoreBanner(sellerId, pngFile);

      // Assert: Verify the result
      expect(result).toEqual({
        message: 'Store banner uploaded successfully',
        seller: expect.objectContaining({
          _id: sellerId,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'Seller',
          storeBanner: expect.objectContaining({
            url: expect.stringContaining('mock-uuid-123-banner.png'),
            public_id: expect.stringContaining('mock-uuid-123-banner.png')
          })
        })
      });

      // Verify S3 upload was called with correct content type
      expect(s3.upload).toHaveBeenCalledWith({
        Bucket: process.env.CDN_S3_BUCKET,
        Key: 'mock-uuid-123-banner.png',
        Body: pngFile.buffer,
        ContentType: 'image/png'
      });
    });
  });
});