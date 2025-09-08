/**
 * Upload Company Verification Validator Tests
 *
 * This test suite covers all validation scenarios for company verification
 * document uploads, ensuring comprehensive test coverage for security and
 * data integrity requirements.
 *
 * Test Coverage:
 * - Required document validation
 * - File size validation
 * - File type validation
 * - File extension validation
 * - Error message accuracy
 * - Edge cases and boundary conditions
 *
 * @module uploadCompanyVerificationValidatorTests
 */

const uploadCompanyVerificationValidator = require('@modules/seller/validators/uploadCompanyVerification.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Upload Company Verification Validator', () => {
  describe('validateCompanyVerificationDocuments', () => {
    it('should pass validation with valid certificate of incorporation only', () => {
      // Arrange: Create valid files object with only required document
      const validFiles = {
        certificateOfIncorporation: [{
          originalname: 'certificate.pdf',
          mimetype: 'application/pdf',
          size: 1024000 // 1MB
        }]
      };

      // Act & Assert: Should not throw any error
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(validFiles);
      }).not.toThrow();
    });

    it('should pass validation with valid certificate of incorporation and business tax ID', () => {
      // Arrange: Create valid files object with both documents
      const validFiles = {
        certificateOfIncorporation: [{
          originalname: 'certificate.pdf',
          mimetype: 'application/pdf',
          size: 1024000 // 1MB
        }],
        businessTaxId: [{
          originalname: 'tax-id.jpg',
          mimetype: 'image/jpeg',
          size: 2048000 // 2MB
        }]
      };

      // Act & Assert: Should not throw any error
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(validFiles);
      }).not.toThrow();
    });

    it('should throw ValidationError when certificate of incorporation is missing', () => {
      // Arrange: Create files object without required document
      const invalidFiles = {
        businessTaxId: [{
          originalname: 'tax-id.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'certificateOfIncorporation', message: 'Certificate of Incorporation is required' }
        ]);
      }
    });

    it('should throw ValidationError when certificate of incorporation array is empty', () => {
      // Arrange: Create files object with empty certificate array
      const invalidFiles = {
        certificateOfIncorporation: [],
        businessTaxId: [{
          originalname: 'tax-id.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'certificateOfIncorporation', message: 'Certificate of Incorporation is required' }
        ]);
      }
    });

    it('should throw ValidationError when files object is null', () => {
      // Arrange: Create null files object
      const invalidFiles = null;

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'certificateOfIncorporation', message: 'Certificate of Incorporation is required' }
        ]);
      }
    });

    it('should throw ValidationError when files object is undefined', () => {
      // Arrange: Create undefined files object
      const invalidFiles = undefined;

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'certificateOfIncorporation', message: 'Certificate of Incorporation is required' }
        ]);
      }
    });

    it('should throw ValidationError when certificate of incorporation file size exceeds limit', () => {
      // Arrange: Create files object with oversized certificate
      const invalidFiles = {
        certificateOfIncorporation: [{
          originalname: 'certificate.pdf',
          mimetype: 'application/pdf',
          size: 15 * 1024 * 1024 // 15MB (exceeds 10MB limit)
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'certificateOfIncorporation', message: 'Certificate of Incorporation file size must not exceed 10MB' }
        ]);
      }
    });

    it('should throw ValidationError when business tax ID file size exceeds limit', () => {
      // Arrange: Create files object with oversized business tax ID
      const invalidFiles = {
        certificateOfIncorporation: [{
          originalname: 'certificate.pdf',
          mimetype: 'application/pdf',
          size: 1024000 // 1MB
        }],
        businessTaxId: [{
          originalname: 'tax-id.pdf',
          mimetype: 'application/pdf',
          size: 12 * 1024 * 1024 // 12MB (exceeds 10MB limit)
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'businessTaxId', message: 'Business Tax ID file size must not exceed 10MB' }
        ]);
      }
    });

    it('should throw ValidationError when certificate of incorporation has invalid MIME type', () => {
      // Arrange: Create files object with invalid MIME type
      const invalidFiles = {
        certificateOfIncorporation: [{
          originalname: 'certificate.exe',
          mimetype: 'application/x-msdownload', // Executable file type
          size: 1024000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'certificateOfIncorporation', message: 'Certificate of Incorporation must be a PDF, image, or Word document' },
          { field: 'certificateOfIncorporation', message: 'Certificate of Incorporation must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' }
        ]);
      }
    });

    it('should throw ValidationError when business tax ID has invalid MIME type', () => {
      // Arrange: Create files object with invalid MIME type for business tax ID
      const invalidFiles = {
        certificateOfIncorporation: [{
          originalname: 'certificate.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }],
        businessTaxId: [{
          originalname: 'tax-id.txt',
          mimetype: 'text/plain', // Text file type (not allowed)
          size: 1024000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'businessTaxId', message: 'Business Tax ID must be a PDF, image, or Word document' },
          { field: 'businessTaxId', message: 'Business Tax ID must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' }
        ]);
      }
    });

    it('should throw ValidationError when certificate of incorporation has invalid file extension', () => {
      // Arrange: Create files object with invalid file extension
      const invalidFiles = {
        certificateOfIncorporation: [{
          originalname: 'certificate.exe',
          mimetype: 'application/octet-stream',
          size: 1024000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'certificateOfIncorporation', message: 'Certificate of Incorporation must be a PDF, image, or Word document' },
          { field: 'certificateOfIncorporation', message: 'Certificate of Incorporation must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' }
        ]);
      }
    });

    it('should throw ValidationError when business tax ID has invalid file extension', () => {
      // Arrange: Create files object with invalid file extension for business tax ID
      const invalidFiles = {
        certificateOfIncorporation: [{
          originalname: 'certificate.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }],
        businessTaxId: [{
          originalname: 'tax-id.bat',
          mimetype: 'application/x-msdownload',
          size: 1024000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'businessTaxId', message: 'Business Tax ID must be a PDF, image, or Word document' },
          { field: 'businessTaxId', message: 'Business Tax ID must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' }
        ]);
      }
    });

    it('should pass validation with all valid file types and extensions', () => {
      // Arrange: Create files object with various valid file types
      const validFiles = {
        certificateOfIncorporation: [{
          originalname: 'certificate.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }],
        businessTaxId: [{
          originalname: 'tax-id.docx',
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 2048000
        }]
      };

      // Act & Assert: Should not throw any error
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(validFiles);
      }).not.toThrow();
    });

    it('should pass validation with image file types', () => {
      // Arrange: Create files object with image file types
      const validFiles = {
        certificateOfIncorporation: [{
          originalname: 'certificate.jpg',
          mimetype: 'image/jpeg',
          size: 1024000
        }],
        businessTaxId: [{
          originalname: 'tax-id.png',
          mimetype: 'image/png',
          size: 2048000
        }]
      };

      // Act & Assert: Should not throw any error
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(validFiles);
      }).not.toThrow();
    });

    it('should pass validation with Word document types', () => {
      // Arrange: Create files object with Word document types
      const validFiles = {
        certificateOfIncorporation: [{
          originalname: 'certificate.doc',
          mimetype: 'application/msword',
          size: 1024000
        }],
        businessTaxId: [{
          originalname: 'tax-id.docx',
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 2048000
        }]
      };

      // Act & Assert: Should not throw any error
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(validFiles);
      }).not.toThrow();
    });

    it('should handle multiple validation errors simultaneously', () => {
      // Arrange: Create files object with multiple validation issues
      const invalidFiles = {
        certificateOfIncorporation: [{
          originalname: 'certificate.exe',
          mimetype: 'application/x-msdownload',
          size: 15 * 1024 * 1024 // 15MB
        }],
        businessTaxId: [{
          originalname: 'tax-id.bat',
          mimetype: 'application/x-msdownload',
          size: 12 * 1024 * 1024 // 12MB
        }]
      };

      // Act & Assert: Should throw ValidationError with multiple error messages
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toHaveLength(6); // Multiple validation errors
        expect(error.errors).toEqual(
          expect.arrayContaining([
            { field: 'certificateOfIncorporation', message: 'Certificate of Incorporation file size must not exceed 10MB' },
            { field: 'certificateOfIncorporation', message: 'Certificate of Incorporation must be a PDF, image, or Word document' },
            { field: 'certificateOfIncorporation', message: 'Certificate of Incorporation must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' },
            { field: 'businessTaxId', message: 'Business Tax ID file size must not exceed 10MB' },
            { field: 'businessTaxId', message: 'Business Tax ID must be a PDF, image, or Word document' },
            { field: 'businessTaxId', message: 'Business Tax ID must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' }
          ])
        );
      }
    });

    it('should handle edge case with exact file size limit', () => {
      // Arrange: Create files object with exact file size limit
      const validFiles = {
        certificateOfIncorporation: [{
          originalname: 'certificate.pdf',
          mimetype: 'application/pdf',
          size: 10 * 1024 * 1024 // Exactly 10MB
        }]
      };

      // Act & Assert: Should not throw any error (size is at the limit, not exceeding)
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(validFiles);
      }).not.toThrow();
    });

    it('should handle edge case with file size just under limit', () => {
      // Arrange: Create files object with file size just under limit
      const validFiles = {
        certificateOfIncorporation: [{
          originalname: 'certificate.pdf',
          mimetype: 'application/pdf',
          size: (10 * 1024 * 1024) - 1 // Just under 10MB
        }]
      };

      // Act & Assert: Should not throw any error
      expect(() => {
        uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(validFiles);
      }).not.toThrow();
    });
  });
});
