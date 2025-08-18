const { 
  validateFileSize,
  validateFileType,
  validateFileExtension,
  validateUploadProfileImageData
} = require('@modules/buyer/validators/uploadProfileImage.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Upload Profile Image Validator', () => {
  describe('validateFileSize', () => {
    it('should pass validation with file under size limit', () => {
      const file = {
        originalname: 'profile.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 1024 // 1MB
      };
      const errors = [];

      validateFileSize(file, errors);

      expect(errors).toHaveLength(0);
    });

    it('should add error for file over size limit', () => {
      const file = {
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024 // 6MB (over 5MB limit)
      };
      const errors = [];

      validateFileSize(file, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'avatar',
        message: 'File size must not exceed 5MB'
      });
    });
  });

  describe('validateFileType', () => {
    it('should pass validation with valid MIME types', () => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      
      validTypes.forEach(mimetype => {
        const file = {
          originalname: 'profile.jpg',
          mimetype,
          size: 1024 * 1024
        };
        const errors = [];

        validateFileType(file, errors);

        expect(errors).toHaveLength(0);
      });
    });

    it('should add error for invalid MIME type', () => {
      const file = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024 * 1024
      };
      const errors = [];

      validateFileType(file, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'avatar',
        message: 'Only JPEG, PNG, GIF, and WebP images are allowed'
      });
    });
  });

  describe('validateFileExtension', () => {
    it('should pass validation with valid file extensions', () => {
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      validExtensions.forEach(ext => {
        const file = {
          originalname: `profile${ext}`,
          mimetype: 'image/jpeg',
          size: 1024 * 1024
        };
        const errors = [];

        validateFileExtension(file, errors);

        expect(errors).toHaveLength(0);
      });
    });

    it('should add error for invalid file extension', () => {
      const file = {
        originalname: 'profile.bmp',
        mimetype: 'image/bmp',
        size: 1024 * 1024
      };
      const errors = [];

      validateFileExtension(file, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'avatar',
        message: 'Only .jpg, .jpeg, .png, .gif, and .webp files are allowed'
      });
    });
  });

  describe('validateUploadProfileImageData', () => {
    it('should not throw for valid file', async () => {
      const validData = {
        file: {
          originalname: 'profile.jpg',
          mimetype: 'image/jpeg',
          size: 1024 * 1024 // 1MB
        }
      };

      await expect(validateUploadProfileImageData(validData)).resolves.not.toThrow();
    });

    it('should not throw for valid PNG file', async () => {
      const validData = {
        file: {
          originalname: 'profile.png',
          mimetype: 'image/png',
          size: 2 * 1024 * 1024 // 2MB
        }
      };

      await expect(validateUploadProfileImageData(validData)).resolves.not.toThrow();
    });

    it('should not throw for valid GIF file', async () => {
      const validData = {
        file: {
          originalname: 'profile.gif',
          mimetype: 'image/gif',
          size: 3 * 1024 * 1024 // 3MB
        }
      };

      await expect(validateUploadProfileImageData(validData)).resolves.not.toThrow();
    });

    it('should not throw for valid WebP file', async () => {
      const validData = {
        file: {
          originalname: 'profile.webp',
          mimetype: 'image/webp',
          size: 4 * 1024 * 1024 // 4MB
        }
      };

      await expect(validateUploadProfileImageData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError when no file provided', async () => {
      const invalidData = {};

      await expect(validateUploadProfileImageData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUploadProfileImageData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'avatar', message: 'No file provided. Please upload an image file.' }]
      });
    });

    it('should throw ValidationError when file is null', async () => {
      const invalidData = { file: null };

      await expect(validateUploadProfileImageData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUploadProfileImageData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'avatar', message: 'No file provided. Please upload an image file.' }]
      });
    });

    it('should throw ValidationError when file is undefined', async () => {
      const invalidData = { file: undefined };

      await expect(validateUploadProfileImageData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUploadProfileImageData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'avatar', message: 'No file provided. Please upload an image file.' }]
      });
    });

    it('should throw ValidationError for file too large', async () => {
      const invalidData = {
        file: {
          originalname: 'large.jpg',
          mimetype: 'image/jpeg',
          size: 6 * 1024 * 1024 // 6MB (over 5MB limit)
        }
      };

      await expect(validateUploadProfileImageData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUploadProfileImageData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'avatar', message: 'File size must not exceed 5MB' }]
      });
    });

    it('should throw ValidationError for invalid file type', async () => {
      const invalidData = {
        file: {
          originalname: 'document.pdf',
          mimetype: 'application/pdf',
          size: 1024 * 1024
        }
      };

      await expect(validateUploadProfileImageData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUploadProfileImageData(invalidData)).rejects.toMatchObject({
        errors: expect.arrayContaining([
          { field: 'avatar', message: 'Only JPEG, PNG, GIF, and WebP images are allowed' },
          { field: 'avatar', message: 'Only .jpg, .jpeg, .png, .gif, and .webp files are allowed' }
        ])
      });
    });

    it('should throw ValidationError for invalid file extension', async () => {
      const invalidData = {
        file: {
          originalname: 'profile.bmp',
          mimetype: 'image/bmp',
          size: 1024 * 1024
        }
      };

      await expect(validateUploadProfileImageData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUploadProfileImageData(invalidData)).rejects.toMatchObject({
        errors: expect.arrayContaining([
          { field: 'avatar', message: 'Only JPEG, PNG, GIF, and WebP images are allowed' },
          { field: 'avatar', message: 'Only .jpg, .jpeg, .png, .gif, and .webp files are allowed' }
        ])
      });
    });

    it('should throw ValidationError for invalid MIME type', async () => {
      const invalidData = {
        file: {
          originalname: 'profile.jpg',
          mimetype: 'text/plain',
          size: 1024 * 1024
        }
      };

      await expect(validateUploadProfileImageData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUploadProfileImageData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'avatar', message: 'Only JPEG, PNG, GIF, and WebP images are allowed' }]
      });
    });

    it('should accumulate multiple validation errors', async () => {
      const invalidData = {
        file: {
          originalname: 'large.pdf',
          mimetype: 'application/pdf',
          size: 6 * 1024 * 1024 // 6MB
        }
      };

      await expect(validateUploadProfileImageData(invalidData)).rejects.toMatchObject({
        errors: expect.arrayContaining([
          { field: 'avatar', message: 'File size must not exceed 5MB' },
          { field: 'avatar', message: 'Only JPEG, PNG, GIF, and WebP images are allowed' },
          { field: 'avatar', message: 'Only .jpg, .jpeg, .png, .gif, and .webp files are allowed' }
        ])
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing file', async () => {
        await expect(validateUploadProfileImageData({})).rejects.toMatchObject({
          errors: [{ field: 'avatar', message: 'No file provided. Please upload an image file.' }]
        });
      });

      it('should include specific error message for null file', async () => {
        await expect(validateUploadProfileImageData({ file: null })).rejects.toMatchObject({
          errors: [{ field: 'avatar', message: 'No file provided. Please upload an image file.' }]
        });
      });

      it('should include specific error message for undefined file', async () => {
        await expect(validateUploadProfileImageData({ file: undefined })).rejects.toMatchObject({
          errors: [{ field: 'avatar', message: 'No file provided. Please upload an image file.' }]
        });
      });

      it('should include specific error message for file too large', async () => {
        await expect(validateUploadProfileImageData({
          file: {
            originalname: 'large.jpg',
            mimetype: 'image/jpeg',
            size: 6 * 1024 * 1024
          }
        })).rejects.toMatchObject({
          errors: [{ field: 'avatar', message: 'File size must not exceed 5MB' }]
        });
      });

      it('should include specific error message for invalid file type', async () => {
        await expect(validateUploadProfileImageData({
          file: {
            originalname: 'document.pdf',
            mimetype: 'application/pdf',
            size: 1024 * 1024
          }
        })).rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'avatar', message: 'Only JPEG, PNG, GIF, and WebP images are allowed' },
            { field: 'avatar', message: 'Only .jpg, .jpeg, .png, .gif, and .webp files are allowed' }
          ])
        });
      });

      it('should include specific error message for invalid file extension', async () => {
        await expect(validateUploadProfileImageData({
          file: {
            originalname: 'profile.bmp',
            mimetype: 'image/bmp',
            size: 1024 * 1024
          }
        })).rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'avatar', message: 'Only JPEG, PNG, GIF, and WebP images are allowed' },
            { field: 'avatar', message: 'Only .jpg, .jpeg, .png, .gif, and .webp files are allowed' }
          ])
        });
      });

      it('should include specific error message for invalid MIME type', async () => {
        await expect(validateUploadProfileImageData({
          file: {
            originalname: 'profile.jpg',
            mimetype: 'text/plain',
            size: 1024 * 1024
          }
        })).rejects.toMatchObject({
          errors: [{ field: 'avatar', message: 'Only JPEG, PNG, GIF, and WebP images are allowed' }]
        });
      });

      it('should include multiple error messages for multiple validation failures', async () => {
        await expect(validateUploadProfileImageData({
          file: {
            originalname: 'large.pdf',
            mimetype: 'application/pdf',
            size: 6 * 1024 * 1024
          }
        })).rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'avatar', message: 'File size must not exceed 5MB' },
            { field: 'avatar', message: 'Only JPEG, PNG, GIF, and WebP images are allowed' },
            { field: 'avatar', message: 'Only .jpg, .jpeg, .png, .gif, and .webp files are allowed' }
          ])
        });
      });
    });
  });
}); 