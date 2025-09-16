/**
 * Upload Store Avatar Validator Tests
 *
 * This test suite validates the uploadStoreAvatar validator functionality.
 * It ensures that the validator properly validates uploaded file data,
 * handles various input scenarios, and provides appropriate error messages.
 *
 * Test Coverage:
 * - Valid file upload data
 * - Invalid file data types
 * - Missing file properties
 * - File size validation
 * - MIME type validation
 * - File name validation
 * - Buffer validation
 * - Multiple validation errors
 * - Edge cases and boundary conditions
 *
 * @module uploadStoreAvatarValidatorTests
 */

const { validateUploadStoreAvatarData } = require('@modules/seller/validators/uploadStoreAvatar.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Upload Store Avatar Validator', () => {
  let validFileData;

  beforeEach(() => {
    // Valid file data
    validFileData = {
      buffer: Buffer.from('fake-image-data'),
      originalname: 'avatar.jpg',
      mimetype: 'image/jpeg',
      size: 1024000
    };
  });

  describe('validateUploadStoreAvatarData', () => {
    it('should validate valid file data', () => {
      // Act & Assert: Should not throw any error for valid file data
      expect(() => validateUploadStoreAvatarData(validFileData)).not.toThrow();
    });

    it('should validate valid file data with different image formats', () => {
      const imageFormats = [
        { mimetype: 'image/jpeg', originalname: 'avatar.jpg' },
        { mimetype: 'image/jpg', originalname: 'avatar.jpg' },
        { mimetype: 'image/png', originalname: 'avatar.png' },
        { mimetype: 'image/gif', originalname: 'avatar.gif' },
        { mimetype: 'image/webp', originalname: 'avatar.webp' }
      ];

      imageFormats.forEach(format => {
        const testData = {
          ...validFileData,
          mimetype: format.mimetype,
          originalname: format.originalname
        };

        // Act & Assert: Should not throw error for valid image formats
        expect(() => validateUploadStoreAvatarData(testData)).not.toThrow();
      });
    });

    it('should validate valid file data with case insensitive MIME types', () => {
      const testData = {
        ...validFileData,
        mimetype: 'IMAGE/JPEG'
      };

      // Act & Assert: Should not throw error for case insensitive MIME types
      expect(() => validateUploadStoreAvatarData(testData)).not.toThrow();
    });

    it('should validate valid file data without size property', () => {
      const testData = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg'
        // size property omitted
      };

      // Act & Assert: Should not throw error when size is not provided
      expect(() => validateUploadStoreAvatarData(testData)).not.toThrow();
    });

    it('should validate valid file data with maximum allowed size', () => {
      const testData = {
        ...validFileData,
        size: 10 * 1024 * 1024 // 10MB
      };

      // Act & Assert: Should not throw error for maximum allowed size
      expect(() => validateUploadStoreAvatarData(testData)).not.toThrow();
    });

    it('should validate valid file data with long filename', () => {
      const testData = {
        ...validFileData,
        originalname: 'a'.repeat(250) + '.jpg' // 254 characters total (under 255 limit)
      };

      // Act & Assert: Should not throw error for maximum allowed filename length
      expect(() => validateUploadStoreAvatarData(testData)).not.toThrow();
    });

    it('should throw error when file is not provided', () => {
      // Act & Assert: Should throw error when file is null
      expect(() => validateUploadStoreAvatarData(null))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'avatar', message: 'Avatar file is required' }
          ]
        }));

      // Act & Assert: Should throw error when file is undefined
      expect(() => validateUploadStoreAvatarData(undefined))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'avatar', message: 'Avatar file is required' }
          ]
        }));
    });

    it('should throw error when file buffer is missing', () => {
      const testData = {
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
        // buffer property missing
      };

      // Act & Assert: Should throw error for missing buffer
      expect(() => validateUploadStoreAvatarData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'file.buffer', message: 'File buffer is required' }
          ]
        }));
    });

    it('should throw error when file buffer is not a Buffer', () => {
      const testData = {
        buffer: 'not-a-buffer',
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      // Act & Assert: Should throw error for non-Buffer buffer
      expect(() => validateUploadStoreAvatarData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'file.buffer', message: 'File buffer must be a valid Buffer object' }
          ]
        }));
    });

    it('should throw error when file buffer is empty', () => {
      const testData = {
        buffer: Buffer.alloc(0),
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      // Act & Assert: Should throw error for empty buffer
      expect(() => validateUploadStoreAvatarData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'file.buffer', message: 'File buffer cannot be empty' }
          ]
        }));
    });

    it('should throw error when file name is missing', () => {
      const testData = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        size: 1024000
        // originalname property missing
      };

      // Act & Assert: Should throw error for missing filename
      expect(() => validateUploadStoreAvatarData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'file.originalname', message: 'File name is required' }
          ]
        }));
    });

    it('should throw error when file name is not a string', () => {
      const testData = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 123,
        mimetype: 'image/jpeg',
        size: 1024000
      };

      // Act & Assert: Should throw error for non-string filename
      expect(() => validateUploadStoreAvatarData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'file.originalname', message: 'File name must be a string' }
          ]
        }));
    });

    it('should throw error when file name is empty string', () => {
      const testData = {
        buffer: Buffer.from('fake-image-data'),
        originalname: '',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      // Act & Assert: Should throw error for empty filename
      expect(() => validateUploadStoreAvatarData(testData))
        .toThrow(ValidationError);
      
      // Also check the specific error structure
      try {
        validateUploadStoreAvatarData(testData);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toEqual([
          { field: 'file.originalname', message: 'File name is required' }
        ]);
      }
    });

    it('should throw error when file name is whitespace only', () => {
      const testData = {
        buffer: Buffer.from('fake-image-data'),
        originalname: '   ',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      // Act & Assert: Should throw error for whitespace-only filename
      expect(() => validateUploadStoreAvatarData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'file.originalname', message: 'File name cannot be empty' }
          ]
        }));
    });

    it('should throw error when file name exceeds maximum length', () => {
      const testData = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'a'.repeat(256) + '.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      // Act & Assert: Should throw error for filename exceeding maximum length
      expect(() => validateUploadStoreAvatarData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'file.originalname', message: 'File name cannot exceed 255 characters' }
          ]
        }));
    });

    it('should throw error when MIME type is missing', () => {
      const testData = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'avatar.jpg',
        size: 1024000
        // mimetype property missing
      };

      // Act & Assert: Should throw error for missing MIME type
      expect(() => validateUploadStoreAvatarData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'file.mimetype', message: 'File MIME type is required' }
          ]
        }));
    });

    it('should throw error when MIME type is not a string', () => {
      const testData = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'avatar.jpg',
        mimetype: 123,
        size: 1024000
      };

      // Act & Assert: Should throw error for non-string MIME type
      expect(() => validateUploadStoreAvatarData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'file.mimetype', message: 'File MIME type must be a string' }
          ]
        }));
    });

    it('should throw error when MIME type is not a valid image format', () => {
      const invalidMimeTypes = [
        'text/plain',
        'application/pdf',
        'video/mp4',
        'audio/mp3',
        'application/zip',
        'image/svg+xml',
        'image/bmp',
        'image/tiff'
      ];

      invalidMimeTypes.forEach(mimeType => {
        const testData = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'avatar.jpg',
          mimetype: mimeType,
          size: 1024000
        };

        // Act & Assert: Should throw error for invalid MIME types
        expect(() => validateUploadStoreAvatarData(testData))
          .toThrow(expect.objectContaining({
            errors: [
              { field: 'file.mimetype', message: 'File must be a valid image format (JPEG, PNG, GIF, WebP)' }
            ]
          }));
      });
    });

    it('should throw error when file size is not a number', () => {
      const testData = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        size: 'not-a-number'
      };

      // Act & Assert: Should throw error for non-number file size
      expect(() => validateUploadStoreAvatarData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'file.size', message: 'File size must be a number' }
          ]
        }));
    });

    it('should throw error when file size is zero', () => {
      const testData = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        size: 0
      };

      // Act & Assert: Should throw error for zero file size
      expect(() => validateUploadStoreAvatarData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'file.size', message: 'File size must be greater than 0' }
          ]
        }));
    });

    it('should throw error when file size is negative', () => {
      const testData = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        size: -1000
      };

      // Act & Assert: Should throw error for negative file size
      expect(() => validateUploadStoreAvatarData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'file.size', message: 'File size must be greater than 0' }
          ]
        }));
    });

    it('should throw error when file size exceeds maximum limit', () => {
      const testData = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        size: (10 * 1024 * 1024) + 1 // 10MB + 1 byte
      };

      // Act & Assert: Should throw error for file size exceeding limit
      expect(() => validateUploadStoreAvatarData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'file.size', message: 'File size cannot exceed 10MB' }
          ]
        }));
    });

    it('should throw multiple errors when multiple fields are invalid', () => {
      const testData = {
        buffer: 'not-a-buffer',
        originalname: '',
        mimetype: 'text/plain',
        size: 'not-a-number'
      };

      // Act & Assert: Should throw error with multiple validation errors
      expect(() => validateUploadStoreAvatarData(testData))
        .toThrow(ValidationError);
      
      // Also check the specific error structure
      try {
        validateUploadStoreAvatarData(testData);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toEqual(expect.arrayContaining([
          { field: 'file.buffer', message: 'File buffer must be a valid Buffer object' },
          { field: 'file.originalname', message: 'File name is required' },
          { field: 'file.mimetype', message: 'File must be a valid image format (JPEG, PNG, GIF, WebP)' },
          { field: 'file.size', message: 'File size must be a number' }
        ]));
      }
    });

    it('should validate valid file data with special characters in filename', () => {
      const testData = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'avatar-with-special-chars_123.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      // Act & Assert: Should not throw error for special characters in filename
      expect(() => validateUploadStoreAvatarData(testData)).not.toThrow();
    });

    it('should validate valid file data with unicode characters in filename', () => {
      const testData = {
        buffer: Buffer.from('fake-image-data'),
        originalname: '头像.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      // Act & Assert: Should not throw error for unicode characters in filename
      expect(() => validateUploadStoreAvatarData(testData)).not.toThrow();
    });

    it('should validate valid file data with mixed case MIME type', () => {
      const testData = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'avatar.jpg',
        mimetype: 'Image/Jpeg',
        size: 1024000
      };

      // Act & Assert: Should not throw error for mixed case MIME type
      expect(() => validateUploadStoreAvatarData(testData)).not.toThrow();
    });
  });
});
