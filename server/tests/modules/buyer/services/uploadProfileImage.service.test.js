const uploadProfileImageService = require('@modules/buyer/services/uploadProfileImage.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const NotFoundException = require('@utils/errors/NotFoundException');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the dependencies
jest.mock('@modules/buyer/repositories/buyer.repository');
jest.mock('@config/awsConfig', () => ({
  s3: {
    upload: jest.fn().mockReturnValue({
      promise: jest.fn()
    })
  }
}));
jest.mock('@modules/buyer/validators/uploadProfileImage.validator', () => ({
  validateUploadedFile: jest.fn()
}));

const { s3 } = require('@config/awsConfig');
const { validateUploadedFile } = require('@modules/buyer/validators/uploadProfileImage.validator');

describe('uploadProfileImageService', () => {
  const mockFile = {
    originalname: 'profile.jpg',
    buffer: Buffer.from('test'),
    mimetype: 'image/jpeg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFileToS3', () => {
    it('should upload file to S3 successfully', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg'
      };

      const mockUploadResult = {
        Location: 'https://s3.amazonaws.com/bucket/test-key.jpg',
        Key: 'test-key'
      };

      s3.upload().promise.mockResolvedValue(mockUploadResult);

      const result = await uploadProfileImageService.uploadFileToS3(mockFile);

      expect(s3.upload).toHaveBeenCalledWith({
        Bucket: process.env.CDN_S3_BUCKET,
        Key: expect.stringMatching(/^[a-f0-9-]+-test\.jpg$/),
        Body: mockFile.buffer,
        ContentType: mockFile.mimetype,
      });
      expect(result).toEqual(mockUploadResult);
    });
  });

  describe('createDefaultImageData', () => {
    it('should return default image data', () => {
      const result = uploadProfileImageService.createDefaultImageData();

      expect(result).toEqual({
        Location: 'https://res.cloudinary.com/dljgzevaj/image/upload/v1730579531/user-account-management-logo-user-icon-11562867145a56rus2zwu_cgs18m.png',
        Key: 'default-profile-image',
      });
    });
  });

  describe('createProfileImageObject', () => {
    it('should create profile image object from upload data', () => {
      const uploadData = {
        Location: 'https://s3.amazonaws.com/bucket/test-key.jpg',
        Key: 'test-key'
      };

      const result = uploadProfileImageService.createProfileImageObject(uploadData);

      expect(result).toEqual({
        url: `https://${process.env.CDN_URL}/test-key`,
        public_id: 'test-key',
      });
    });
  });

  describe('uploadProfileImage', () => {
    const mockBuyerId = '507f1f77bcf86cd799439011';
    const mockBuyer = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      profileImage: {
        url: 'https://old-image.jpg',
        public_id: 'old-image'
      }
    };

    it('should upload profile image successfully with file', async () => {
      const mockUploadResult = {
        Location: 'https://s3.amazonaws.com/bucket/new-key.jpg',
        Key: 'new-key'
      };

      validateUploadedFile.mockImplementation(() => {});
      buyerRepository.findByIdWithFields.mockResolvedValue(mockBuyer);
      s3.upload().promise.mockResolvedValue(mockUploadResult);
      buyerRepository.updateById.mockResolvedValue({
        ...mockBuyer,
        profileImage: {
          url: `https://${process.env.CDN_URL}/new-key`,
          public_id: 'new-key'
        }
      });

      const result = await uploadProfileImageService.uploadProfileImage(mockBuyerId, mockFile);

      expect(validateUploadedFile).toHaveBeenCalledWith(mockFile);
      expect(buyerRepository.findByIdWithFields).toHaveBeenCalledWith(mockBuyerId, {
        firstName: 1,
        lastName: 1,
        username: 1,
        email: 1,
        profileImage: 1
      });
      expect(s3.upload().promise).toHaveBeenCalled();
      expect(buyerRepository.updateById).toHaveBeenCalledWith(mockBuyerId, {
        profileImage: {
          url: `https://${process.env.CDN_URL}/new-key`,
          public_id: 'new-key'
        }
      });
      expect(result.profileImage.url).toBe(`https://${process.env.CDN_URL}/new-key`);
    });

    it('should throw ValidationError when no file provided', async () => {
      const validationError = new ValidationError([
        { field: 'avatar', message: 'No file provided. Please upload an image file.' }
      ]);

      validateUploadedFile.mockImplementation(() => {
        throw validationError;
      });

      await expect(uploadProfileImageService.uploadProfileImage(mockBuyerId, null))
        .rejects.toThrow(ValidationError);
      
      // Test that the error contains the validation details
      try {
        await uploadProfileImageService.uploadProfileImage(mockBuyerId, null);
      } catch (error) {
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({
          field: 'avatar',
          message: 'No file provided. Please upload an image file.'
        });
      }
    });

    it('should throw NotFoundException when buyer not found', async () => {
      validateUploadedFile.mockImplementation(() => {}); // Reset mock
      buyerRepository.findByIdWithFields.mockResolvedValue(null);

      await expect(uploadProfileImageService.uploadProfileImage(mockBuyerId, mockFile))
        .rejects.toThrow(NotFoundException);
      await expect(uploadProfileImageService.uploadProfileImage(mockBuyerId, mockFile))
        .rejects.toThrow('Buyer not found');
    });

    it('should handle S3 upload errors', async () => {
      validateUploadedFile.mockImplementation(() => {}); // Reset mock
      buyerRepository.findByIdWithFields.mockResolvedValue(mockBuyer);
      s3.upload().promise.mockRejectedValue(new Error('S3 upload failed'));

      await expect(uploadProfileImageService.uploadProfileImage(mockBuyerId, mockFile))
        .rejects.toThrow('S3 upload failed');
    });

    it('should throw ValidationError when file validation fails', async () => {
      const mockFile = {
        originalname: 'large.pdf',
        buffer: Buffer.from('test'),
        mimetype: 'application/pdf',
        size: 6 * 1024 * 1024
      };

      const validationError = new ValidationError([
        { field: 'avatar', message: 'File size must not exceed 5MB' },
        { field: 'avatar', message: 'Only JPEG, PNG, GIF, and WebP images are allowed' }
      ]);

      validateUploadedFile.mockImplementation(() => {
        throw validationError;
      });

      await expect(uploadProfileImageService.uploadProfileImage(mockBuyerId, mockFile))
        .rejects.toThrow(ValidationError);
      
      // Test that the error contains the validation details
      try {
        await uploadProfileImageService.uploadProfileImage(mockBuyerId, mockFile);
      } catch (error) {
        expect(error.errors).toHaveLength(2);
        expect(error.errors).toEqual(
          expect.arrayContaining([
            { field: 'avatar', message: 'File size must not exceed 5MB' },
            { field: 'avatar', message: 'Only JPEG, PNG, GIF, and WebP images are allowed' }
          ])
        );
      }
    });
  });
}); 