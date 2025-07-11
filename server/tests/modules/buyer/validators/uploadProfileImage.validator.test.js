const { 
  validateUploadedFile,
  validateFileSize,
  validateFileType,
  validateFileExtension
} = require('@modules/buyer/validators/uploadProfileImage.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('uploadProfileImage.validator', () => {
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

    it('should handle case-insensitive file extensions', () => {
      const file = {
        originalname: 'profile.JPG',
        mimetype: 'image/jpeg',
        size: 1024 * 1024
      };
      const errors = [];

      validateFileExtension(file, errors);

      expect(errors).toHaveLength(0);
    });
  });

  describe('validateUploadedFile', () => {
    it('should pass validation with valid JPEG file', () => {
      const file = {
        originalname: 'profile.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 1024 // 1MB
      };

      expect(() => validateUploadedFile(file)).not.toThrow();
    });

    it('should pass validation with valid PNG file', () => {
      const file = {
        originalname: 'profile.png',
        mimetype: 'image/png',
        size: 2 * 1024 * 1024 // 2MB
      };

      expect(() => validateUploadedFile(file)).not.toThrow();
    });

    it('should pass validation with valid GIF file', () => {
      const file = {
        originalname: 'profile.gif',
        mimetype: 'image/gif',
        size: 3 * 1024 * 1024 // 3MB
      };

      expect(() => validateUploadedFile(file)).not.toThrow();
    });

    it('should pass validation with valid WebP file', () => {
      const file = {
        originalname: 'profile.webp',
        mimetype: 'image/webp',
        size: 4 * 1024 * 1024 // 4MB
      };

      expect(() => validateUploadedFile(file)).not.toThrow();
    });

    it('should throw ValidationError when no file provided', () => {
      expect(() => validateUploadedFile(null)).toThrow(ValidationError);
      expect(() => validateUploadedFile(undefined)).toThrow(ValidationError);
    });

    it('should throw ValidationError for file too large', () => {
      const file = {
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024 // 6MB (over 5MB limit)
      };

      expect(() => validateUploadedFile(file)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid file type', () => {
      const file = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024 * 1024
      };

      expect(() => validateUploadedFile(file)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid file extension', () => {
      const file = {
        originalname: 'profile.bmp',
        mimetype: 'image/bmp',
        size: 1024 * 1024
      };

      expect(() => validateUploadedFile(file)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid MIME type', () => {
      const file = {
        originalname: 'profile.jpg',
        mimetype: 'text/plain',
        size: 1024 * 1024
      };

      expect(() => validateUploadedFile(file)).toThrow(ValidationError);
    });

    it('should accumulate multiple validation errors', () => {
      const file = {
        originalname: 'large.pdf',
        mimetype: 'application/pdf',
        size: 6 * 1024 * 1024 // 6MB
      };

      try {
        validateUploadedFile(file);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toHaveLength(3);
        expect(error.errors).toEqual(
          expect.arrayContaining([
            { field: 'avatar', message: 'File size must not exceed 5MB' },
            { field: 'avatar', message: 'Only JPEG, PNG, GIF, and WebP images are allowed' },
            { field: 'avatar', message: 'Only .jpg, .jpeg, .png, .gif, and .webp files are allowed' }
          ])
        );
      }
    });
  });

}); 