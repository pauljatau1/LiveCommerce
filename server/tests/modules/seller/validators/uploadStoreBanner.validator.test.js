const { validateUploadStoreBannerData } = require('@modules/seller/validators/uploadStoreBanner.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Upload Store Banner Validator', () => {
  describe('validateUploadStoreBannerData', () => {
    describe('Valid Inputs', () => {
      it('should not throw for valid file data', () => {
        const validFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.jpg',
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(validFile)).not.toThrow();
      });

      it('should not throw for valid PNG file', () => {
        const validFile = {
          buffer: Buffer.from('fake-png-data'),
          originalname: 'banner.png',
          mimetype: 'image/png',
          size: 2048000
        };

        expect(() => validateUploadStoreBannerData(validFile)).not.toThrow();
      });

      it('should not throw for valid GIF file', () => {
        const validFile = {
          buffer: Buffer.from('fake-gif-data'),
          originalname: 'banner.gif',
          mimetype: 'image/gif',
          size: 512000
        };

        expect(() => validateUploadStoreBannerData(validFile)).not.toThrow();
      });

      it('should not throw for valid WebP file', () => {
        const validFile = {
          buffer: Buffer.from('fake-webp-data'),
          originalname: 'banner.webp',
          mimetype: 'image/webp',
          size: 768000
        };

        expect(() => validateUploadStoreBannerData(validFile)).not.toThrow();
      });

      it('should not throw for valid file with maximum size', () => {
        const validFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.jpg',
          mimetype: 'image/jpeg',
          size: 10 * 1024 * 1024 // 10MB
        };

        expect(() => validateUploadStoreBannerData(validFile)).not.toThrow();
      });

      it('should not throw for valid file with minimum size', () => {
        const validFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.jpg',
          mimetype: 'image/jpeg',
          size: 1
        };

        expect(() => validateUploadStoreBannerData(validFile)).not.toThrow();
      });

      it('should not throw for valid file with special characters in filename', () => {
        const validFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner-with-special-chars_123.jpg',
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(validFile)).not.toThrow();
      });

      it('should not throw for valid file with unicode characters in filename', () => {
        const validFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: '横幅.jpg',
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(validFile)).not.toThrow();
      });

      it('should not throw for valid file with long filename', () => {
        const validFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'a'.repeat(250) + '.jpg', // 254 characters
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(validFile)).not.toThrow();
      });
    });

    describe('Invalid Inputs - Missing File', () => {
      it('should throw ValidationError when file is null', () => {
        expect(() => validateUploadStoreBannerData(null))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when file is undefined', () => {
        expect(() => validateUploadStoreBannerData(undefined))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when file is not provided', () => {
        expect(() => validateUploadStoreBannerData())
          .toThrow(ValidationError);
      });
    });

    describe('Invalid Inputs - File Buffer', () => {
      it('should throw ValidationError when buffer is missing', () => {
        const invalidFile = {
          originalname: 'banner.jpg',
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when buffer is null', () => {
        const invalidFile = {
          buffer: null,
          originalname: 'banner.jpg',
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when buffer is not a Buffer object', () => {
        const invalidFile = {
          buffer: 'not-a-buffer',
          originalname: 'banner.jpg',
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when buffer is empty', () => {
        const invalidFile = {
          buffer: Buffer.alloc(0),
          originalname: 'banner.jpg',
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });
    });

    describe('Invalid Inputs - File Name', () => {
      it('should throw ValidationError when originalname is missing', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when originalname is null', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: null,
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when originalname is not a string', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 123,
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when originalname is empty string', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: '',
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when originalname is too long', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'a'.repeat(256) + '.jpg', // 260 characters
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });
    });

    describe('Invalid Inputs - MIME Type', () => {
      it('should throw ValidationError when mimetype is missing', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.jpg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when mimetype is null', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.jpg',
          mimetype: null,
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when mimetype is not a string', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.jpg',
          mimetype: 123,
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when mimetype is invalid', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.txt',
          mimetype: 'text/plain',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when mimetype is video', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-video-data'),
          originalname: 'banner.mp4',
          mimetype: 'video/mp4',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when mimetype is application', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-pdf-data'),
          originalname: 'banner.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });
    });

    describe('Invalid Inputs - File Size', () => {
      it('should throw ValidationError when size is missing', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.jpg',
          mimetype: 'image/jpeg'
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when size is null', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.jpg',
          mimetype: 'image/jpeg',
          size: null
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when size is not a number', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.jpg',
          mimetype: 'image/jpeg',
          size: 'not-a-number'
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when size is zero', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.jpg',
          mimetype: 'image/jpeg',
          size: 0
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when size is negative', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.jpg',
          mimetype: 'image/jpeg',
          size: -1000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError when size exceeds maximum', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.jpg',
          mimetype: 'image/jpeg',
          size: 10 * 1024 * 1024 + 1 // 10MB + 1 byte
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
      });
    });

    describe('Error Message Validation', () => {
      it('should throw error with correct message when file is missing', () => {
        expect(() => validateUploadStoreBannerData(null))
          .toThrow(ValidationError);
        
        // Test the specific error structure
        let error;
        try {
          validateUploadStoreBannerData(null);
        } catch (e) {
          error = e;
        }
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toEqual([
          { field: 'banner', message: 'Banner file is required' }
        ]);
      });

      it('should throw error with correct message when buffer is invalid', () => {
        const invalidFile = {
          buffer: 'not-a-buffer',
          originalname: 'banner.jpg',
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
        
        // Test the specific error structure
        let error;
        try {
          validateUploadStoreBannerData(invalidFile);
        } catch (e) {
          error = e;
        }
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toEqual([
          { field: 'file.buffer', message: 'File buffer must be a valid Buffer object' }
        ]);
      });

      it('should throw error with correct message when filename is empty', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: '',
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
        
        // Test the specific error structure
        let error;
        try {
          validateUploadStoreBannerData(invalidFile);
        } catch (e) {
          error = e;
        }
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toEqual([
          { field: 'file.originalname', message: 'File name is required' }
        ]);
      });

      it('should throw error with correct message when mimetype is invalid', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.txt',
          mimetype: 'text/plain',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
        
        // Test the specific error structure
        let error;
        try {
          validateUploadStoreBannerData(invalidFile);
        } catch (e) {
          error = e;
        }
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toEqual([
          { field: 'file.mimetype', message: 'File must be a valid image format (JPEG, PNG, GIF, WebP)' }
        ]);
      });

      it('should throw error with correct message when file size is too large', () => {
        const invalidFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.jpg',
          mimetype: 'image/jpeg',
          size: 10 * 1024 * 1024 + 1
        };

        expect(() => validateUploadStoreBannerData(invalidFile))
          .toThrow(ValidationError);
        
        // Test the specific error structure
        let error;
        try {
          validateUploadStoreBannerData(invalidFile);
        } catch (e) {
          error = e;
        }
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toEqual([
          { field: 'file.size', message: 'File size cannot exceed 10MB' }
        ]);
      });

      it('should throw multiple errors when multiple fields are invalid', () => {
        const testData = {
          buffer: 'not-a-buffer',
          originalname: '',
          mimetype: 'text/plain',
          size: 'not-a-number'
        };

        // Act & Assert: Should throw error with multiple validation errors
        expect(() => validateUploadStoreBannerData(testData))
          .toThrow(ValidationError);
        
        // Also check the specific error structure
        let error;
        try {
          validateUploadStoreBannerData(testData);
        } catch (e) {
          error = e;
        }
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toEqual(expect.arrayContaining([
          { field: 'file.buffer', message: 'File buffer must be a valid Buffer object' },
          { field: 'file.originalname', message: 'File name is required' },
          { field: 'file.mimetype', message: 'File must be a valid image format (JPEG, PNG, GIF, WebP)' },
          { field: 'file.size', message: 'File size must be a number' }
        ]));
      });
    });

    describe('Edge Cases', () => {
      it('should handle case-insensitive MIME types', () => {
        const validFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.JPG',
          mimetype: 'IMAGE/JPEG', // Uppercase
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(validFile)).not.toThrow();
      });

      it('should handle mixed case MIME types', () => {
        const validFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.jpg',
          mimetype: 'Image/Jpeg', // Mixed case
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(validFile)).not.toThrow();
      });

      it('should handle filename with spaces', () => {
        const validFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner with spaces.jpg',
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(validFile)).not.toThrow();
      });

      it('should handle filename with dots', () => {
        const validFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'banner.v2.final.jpg',
          mimetype: 'image/jpeg',
          size: 1024000
        };

        expect(() => validateUploadStoreBannerData(validFile)).not.toThrow();
      });
    });
  });
});
