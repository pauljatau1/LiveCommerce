/**
 * Upload Store Avatar Service Tests
 *
 * This test suite validates the uploadStoreAvatar service functionality.
 * It ensures that the service properly handles business logic, file validation,
 * S3 upload operations, and database operations for uploading store avatars to seller profiles.
 *
 * Test Coverage:
 * - Successful store avatar upload
 * - File validation error handling
 * - S3 upload operations
 * - Seller not found scenarios
 * - Database operation failures
 * - Previous avatar deletion
 * - Business logic validation
 * - Data integrity checks
 * - Error handling for various failure scenarios
 *
 * @module uploadStoreAvatarServiceTests
 */

const { uploadStoreAvatar } = require('@modules/seller/services/uploadStoreAvatar.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const { validateUploadStoreAvatarData } = require('@modules/seller/validators/uploadStoreAvatar.validator');
const { s3 } = require('@config/awsConfig');
const { DeleteS3Objects } = require('@utils/s3');

// Mock dependencies
jest.mock('@modules/seller/repositories/seller.repository');
jest.mock('@modules/seller/validators/uploadStoreAvatar.validator');
jest.mock('@config/awsConfig');
jest.mock('@utils/s3');

describe('Upload Store Avatar Service', () => {
  let validFileData;
  let mockSeller;
  let mockUploadData;

  beforeEach(() => {
    // Valid file data
    validFileData = {
      buffer: Buffer.from('fake-image-data'),
      originalname: 'avatar.jpg',
      mimetype: 'image/jpeg',
      size: 1024000
    };

    // Mock seller object
    mockSeller = {
      _id: '507f1f77bcf86cd799439011',
      storeAvatar: {
        url: 'https://test-cdn-url/old-avatar.jpg',
        public_id: 'old-avatar.jpg'
      },
      save: jest.fn()
    };

    // Mock S3 upload data
    mockUploadData = {
      Key: 'uuid-avatar.jpg',
      Location: 'https://s3.amazonaws.com/bucket/uuid-avatar.jpg'
    };

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    validateUploadStoreAvatarData.mockImplementation(() => {});
    sellerRepository.findById.mockResolvedValue(mockSeller);
    sellerRepository.save.mockResolvedValue(mockSeller);
    s3.upload.mockReturnValue({
      promise: jest.fn().mockResolvedValue(mockUploadData)
    });
    DeleteS3Objects.mockResolvedValue({ Errors: [] });
  });

  describe('uploadStoreAvatar', () => {
    it('should successfully upload store avatar', async () => {
      // Arrange: Setup mocks
      const sellerId = '507f1f77bcf86cd799439011';
      const updatedSeller = {
        ...mockSeller,
        storeAvatar: {
          url: `https://${process.env.CDN_URL}/${mockUploadData.Key}`,
          public_id: mockUploadData.Key
        }
      };

      sellerRepository.save.mockResolvedValue(updatedSeller);

      // Act: Call the service
      const result = await uploadStoreAvatar(sellerId, validFileData);

      // Assert: Verify the result
      expect(result).toEqual({
        message: 'Store avatar uploaded successfully',
        seller: updatedSeller
      });

      // Verify validator was called
      expect(validateUploadStoreAvatarData).toHaveBeenCalledWith(validFileData);

      // Verify repository methods were called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);
      expect(sellerRepository.save).toHaveBeenCalledWith(mockSeller);

      // Verify S3 upload was called
      expect(s3.upload).toHaveBeenCalledWith({
        Bucket: process.env.CDN_S3_BUCKET,
        Key: expect.stringMatching(/^[0-9a-f-]+-avatar\.jpg$/),
        Body: validFileData.buffer,
        ContentType: validFileData.mimetype
      });

      // Verify previous avatar deletion was called
      expect(DeleteS3Objects).toHaveBeenCalledWith(
        [{ Key: 'old-avatar.jpg' }],
        process.env.CDN_S3_BUCKET
      );

      // Verify seller object was updated
      expect(mockSeller.storeAvatar).toEqual({
        url: `https://${process.env.CDN_URL}/${mockUploadData.Key}`,
        public_id: mockUploadData.Key
      });
    });

    it('should successfully upload store avatar when seller has no existing avatar', async () => {
      // Arrange: Setup mocks for seller with no existing avatar
      const sellerId = '507f1f77bcf86cd799439011';
      const sellerWithoutAvatar = {
        ...mockSeller,
        storeAvatar: null
      };

      sellerRepository.findById.mockResolvedValue(sellerWithoutAvatar);

      // Act: Call the service
      const result = await uploadStoreAvatar(sellerId, validFileData);

      // Assert: Verify the result
      expect(result).toEqual({
        message: 'Store avatar uploaded successfully',
        seller: expect.any(Object)
      });

      // Verify previous avatar deletion was not called (no existing avatar)
      expect(DeleteS3Objects).not.toHaveBeenCalled();
    });

    it('should successfully upload store avatar when seller has empty avatar URL', async () => {
      // Arrange: Setup mocks for seller with empty avatar URL
      const sellerId = '507f1f77bcf86cd799439011';
      const sellerWithEmptyAvatar = {
        ...mockSeller,
        storeAvatar: {
          url: '',
          public_id: ''
        }
      };

      sellerRepository.findById.mockResolvedValue(sellerWithEmptyAvatar);

      // Act: Call the service
      const result = await uploadStoreAvatar(sellerId, validFileData);

      // Assert: Verify the result
      expect(result).toEqual({
        message: 'Store avatar uploaded successfully',
        seller: expect.any(Object)
      });

      // Verify previous avatar deletion was not called (empty URL)
      expect(DeleteS3Objects).not.toHaveBeenCalled();
    });

    it('should handle S3 upload failure gracefully', async () => {
      // Arrange: Setup mocks for S3 upload failure
      const sellerId = '507f1f77bcf86cd799439011';
      const s3Error = new Error('S3 upload failed');

      s3.upload.mockReturnValue({
        promise: jest.fn().mockRejectedValue(s3Error)
      });

      // Act & Assert: Should throw S3 upload error
      await expect(uploadStoreAvatar(sellerId, validFileData)).rejects.toThrow('S3 upload failed');

      // Verify validator was called
      expect(validateUploadStoreAvatarData).toHaveBeenCalledWith(validFileData);

      // Verify repository methods were called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);

      // Verify S3 upload was attempted
      expect(s3.upload).toHaveBeenCalled();

      // Verify seller was not saved (upload failed)
      expect(sellerRepository.save).not.toHaveBeenCalled();

      // Verify previous avatar deletion was not called (upload failed)
      expect(DeleteS3Objects).not.toHaveBeenCalled();
    });

    it('should handle previous avatar deletion failure gracefully', async () => {
      // Arrange: Setup mocks for deletion failure
      const sellerId = '507f1f77bcf86cd799439011';
      const deleteError = new Error('S3 deletion failed');

      DeleteS3Objects.mockRejectedValue(deleteError);

      // Act & Assert: Should throw deletion error
      await expect(uploadStoreAvatar(sellerId, validFileData)).rejects.toThrow('S3 deletion failed');

      // Verify validator was called
      expect(validateUploadStoreAvatarData).toHaveBeenCalledWith(validFileData);

      // Verify repository methods were called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);

      // Verify S3 upload was called
      expect(s3.upload).toHaveBeenCalled();

      // Verify seller was saved
      expect(sellerRepository.save).toHaveBeenCalled();

      // Verify previous avatar deletion was attempted
      expect(DeleteS3Objects).toHaveBeenCalled();
    });

    it('should handle previous avatar deletion with errors gracefully', async () => {
      // Arrange: Setup mocks for deletion with errors
      const sellerId = '507f1f77bcf86cd799439011';
      const deleteResponse = {
        Errors: [
          { Key: 'old-avatar.jpg', Code: 'NoSuchKey', Message: 'The specified key does not exist.' }
        ]
      };

      DeleteS3Objects.mockResolvedValue(deleteResponse);

      // Act: Call the service
      const result = await uploadStoreAvatar(sellerId, validFileData);

      // Assert: Verify the result (should succeed despite deletion errors)
      expect(result).toEqual({
        message: 'Store avatar uploaded successfully',
        seller: expect.any(Object)
      });

      // Verify previous avatar deletion was called
      expect(DeleteS3Objects).toHaveBeenCalledWith(
        [{ Key: 'old-avatar.jpg' }],
        process.env.CDN_S3_BUCKET
      );
    });

    it('should throw error when validation fails', async () => {
      // Arrange: Setup mocks for validation failure
      const sellerId = '507f1f77bcf86cd799439011';
      const validationError = new Error('Validation failed');
      validationError.errors = [
        { field: 'file.mimetype', message: 'File must be a valid image format' }
      ];

      validateUploadStoreAvatarData.mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert: Should throw validation error
      await expect(uploadStoreAvatar(sellerId, validFileData)).rejects.toThrow('Validation failed');

      // Verify validator was called
      expect(validateUploadStoreAvatarData).toHaveBeenCalledWith(validFileData);

      // Verify repository methods were not called
      expect(sellerRepository.findById).not.toHaveBeenCalled();
      expect(sellerRepository.save).not.toHaveBeenCalled();

      // Verify S3 upload was not called
      expect(s3.upload).not.toHaveBeenCalled();

      // Verify previous avatar deletion was not called
      expect(DeleteS3Objects).not.toHaveBeenCalled();
    });

    it('should throw error when seller is not found', async () => {
      // Arrange: Setup mocks for seller not found
      const sellerId = '507f1f77bcf86cd799439011';

      sellerRepository.findById.mockResolvedValue(null);

      // Act & Assert: Should throw error when seller not found
      await expect(uploadStoreAvatar(sellerId, validFileData)).rejects.toThrow('Seller not found');

      // Verify repository methods were called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);
      expect(sellerRepository.save).not.toHaveBeenCalled();

      // Verify S3 upload was not called
      expect(s3.upload).not.toHaveBeenCalled();

      // Verify previous avatar deletion was not called
      expect(DeleteS3Objects).not.toHaveBeenCalled();
    });

    it('should throw error when database save fails', async () => {
      // Arrange: Setup mocks for database save failure
      const sellerId = '507f1f77bcf86cd799439011';
      const databaseError = new Error('Database connection failed');

      sellerRepository.save.mockRejectedValue(databaseError);

      // Act & Assert: Should throw database error
      await expect(uploadStoreAvatar(sellerId, validFileData)).rejects.toThrow('Database connection failed');

      // Verify repository methods were called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);
      expect(sellerRepository.save).toHaveBeenCalledWith(mockSeller);

      // Verify S3 upload was called
      expect(s3.upload).toHaveBeenCalled();

      // Verify previous avatar deletion was not called (save failed)
      expect(DeleteS3Objects).not.toHaveBeenCalled();
    });

    it('should generate unique file names for each upload', async () => {
      // Arrange: Setup mocks
      const sellerId = '507f1f77bcf86cd799439011';

      // Act: Call the service multiple times
      await uploadStoreAvatar(sellerId, validFileData);
      await uploadStoreAvatar(sellerId, validFileData);

      // Assert: Verify unique keys were generated
      const uploadCalls = s3.upload.mock.calls;
      expect(uploadCalls).toHaveLength(2);
      
      const key1 = uploadCalls[0][0].Key;
      const key2 = uploadCalls[1][0].Key;
      
      expect(key1).not.toBe(key2);
      expect(key1).toMatch(/^[0-9a-f-]+-avatar\.jpg$/);
      expect(key2).toMatch(/^[0-9a-f-]+-avatar\.jpg$/);
    });

    it('should handle different file types correctly', async () => {
      // Arrange: Setup mocks for different file types
      const sellerId = '507f1f77bcf86cd799439011';
      const fileTypes = [
        { mimetype: 'image/png', originalname: 'avatar.png' },
        { mimetype: 'image/gif', originalname: 'avatar.gif' },
        { mimetype: 'image/webp', originalname: 'avatar.webp' }
      ];

      for (const fileType of fileTypes) {
        const testFileData = {
          ...validFileData,
          mimetype: fileType.mimetype,
          originalname: fileType.originalname
        };

        // Act: Call the service
        const result = await uploadStoreAvatar(sellerId, testFileData);

        // Assert: Verify the result
        expect(result).toEqual({
          message: 'Store avatar uploaded successfully',
          seller: expect.any(Object)
        });

        // Verify S3 upload was called with correct content type
        expect(s3.upload).toHaveBeenCalledWith(
          expect.objectContaining({
            ContentType: fileType.mimetype
          })
        );
      }
    });

    it('should preserve existing seller data when updating avatar', async () => {
      // Arrange: Setup mocks with existing seller data
      const sellerId = '507f1f77bcf86cd799439011';
      const existingSeller = {
        ...mockSeller,
        businessEmail: 'existing@example.com',
        businessNumber: '+2348012345678',
        storeAvatar: {
          url: 'https://cdn.example.com/old-avatar.jpg',
          public_id: 'old-avatar.jpg'
        }
      };

      sellerRepository.findById.mockResolvedValue(existingSeller);

      // Act: Call the service
      const result = await uploadStoreAvatar(sellerId, validFileData);

      // Assert: Verify the result
      expect(result).toEqual({
        message: 'Store avatar uploaded successfully',
        seller: expect.any(Object)
      });

      // Verify existing data is preserved
      expect(existingSeller.businessEmail).toBe('existing@example.com');
      expect(existingSeller.businessNumber).toBe('+2348012345678');

      // Verify new avatar data is updated
      expect(existingSeller.storeAvatar).toEqual({
        url: `https://${process.env.CDN_URL}/${mockUploadData.Key}`,
        public_id: mockUploadData.Key
      });
    });
  });
});
