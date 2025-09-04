/**
 * Upload Individual Verification Validator Tests
 *
 * This test suite covers all validation scenarios for individual verification
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
 * @module uploadIndividualVerificationValidatorTests
 */

const uploadIndividualVerificationValidator = require('@modules/seller/validators/uploadIndividualVerification.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Upload Individual Verification Validator', () => {
  describe('validateIndividualVerificationDocuments', () => {
    it('should pass validation with valid government ID and proof of address only', () => {
      // Arrange: Create valid files object with only required documents
      const validFiles = {
        governmentId: [{
          originalname: 'government-id.pdf',
          mimetype: 'application/pdf',
          size: 1024000 // 1MB
        }],
        proofOfAddress: [{
          originalname: 'address-proof.pdf',
          mimetype: 'application/pdf',
          size: 2048000 // 2MB
        }]
      };

      // Act & Assert: Should not throw any error
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(validFiles);
      }).not.toThrow();
    });

    it('should pass validation with valid individual tax ID, government ID, and proof of address', () => {
      // Arrange: Create valid files object with all documents
      const validFiles = {
        individualTaxId: [{
          originalname: 'tax-id.pdf',
          mimetype: 'application/pdf',
          size: 1024000 // 1MB
        }],
        governmentId: [{
          originalname: 'government-id.pdf',
          mimetype: 'application/pdf',
          size: 2048000 // 2MB
        }],
        proofOfAddress: [{
          originalname: 'address-proof.jpg',
          mimetype: 'image/jpeg',
          size: 3072000 // 3MB
        }]
      };

      // Act & Assert: Should not throw any error
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(validFiles);
      }).not.toThrow();
    });

    it('should throw ValidationError when government ID is missing', () => {
      // Arrange: Create files object without required government ID
      const invalidFiles = {
        proofOfAddress: [{
          originalname: 'address-proof.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'governmentId', message: 'Government ID is required' }
        ]);
      }
    });

    it('should throw ValidationError when proof of address is missing', () => {
      // Arrange: Create files object without required proof of address
      const invalidFiles = {
        governmentId: [{
          originalname: 'government-id.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'proofOfAddress', message: 'Proof of Address is required' }
        ]);
      }
    });

    it('should throw ValidationError when both required documents are missing', () => {
      // Arrange: Create files object without any required documents
      const invalidFiles = {
        individualTaxId: [{
          originalname: 'tax-id.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific messages
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'governmentId', message: 'Government ID is required' },
          { field: 'proofOfAddress', message: 'Proof of Address is required' }
        ]);
      }
    });

    it('should throw ValidationError when government ID array is empty', () => {
      // Arrange: Create files object with empty government ID array
      const invalidFiles = {
        governmentId: [],
        proofOfAddress: [{
          originalname: 'address-proof.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'governmentId', message: 'Government ID is required' }
        ]);
      }
    });

    it('should throw ValidationError when proof of address array is empty', () => {
      // Arrange: Create files object with empty proof of address array
      const invalidFiles = {
        governmentId: [{
          originalname: 'government-id.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }],
        proofOfAddress: []
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'proofOfAddress', message: 'Proof of Address is required' }
        ]);
      }
    });

    it('should throw ValidationError when files object is null', () => {
      // Arrange: Create null files object
      const invalidFiles = null;

      // Act & Assert: Should throw ValidationError with specific messages
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'governmentId', message: 'Government ID is required' },
          { field: 'proofOfAddress', message: 'Proof of Address is required' }
        ]);
      }
    });

    it('should throw ValidationError when files object is undefined', () => {
      // Arrange: Create undefined files object
      const invalidFiles = undefined;

      // Act & Assert: Should throw ValidationError with specific messages
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'governmentId', message: 'Government ID is required' },
          { field: 'proofOfAddress', message: 'Proof of Address is required' }
        ]);
      }
    });

    it('should throw ValidationError when individual tax ID file size exceeds limit', () => {
      // Arrange: Create files object with oversized individual tax ID
      const invalidFiles = {
        individualTaxId: [{
          originalname: 'tax-id.pdf',
          mimetype: 'application/pdf',
          size: 15 * 1024 * 1024 // 15MB
        }],
        governmentId: [{
          originalname: 'government-id.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }],
        proofOfAddress: [{
          originalname: 'address-proof.pdf',
          mimetype: 'application/pdf',
          size: 2048000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'individualTaxId', message: 'Individual Tax ID file size must not exceed 10MB' }
        ]);
      }
    });

    it('should throw ValidationError when government ID file size exceeds limit', () => {
      // Arrange: Create files object with oversized government ID
      const invalidFiles = {
        governmentId: [{
          originalname: 'government-id.pdf',
          mimetype: 'application/pdf',
          size: 15 * 1024 * 1024 // 15MB
        }],
        proofOfAddress: [{
          originalname: 'address-proof.pdf',
          mimetype: 'application/pdf',
          size: 2048000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'governmentId', message: 'Government ID file size must not exceed 10MB' }
        ]);
      }
    });

    it('should throw ValidationError when proof of address file size exceeds limit', () => {
      // Arrange: Create files object with oversized proof of address
      const invalidFiles = {
        governmentId: [{
          originalname: 'government-id.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }],
        proofOfAddress: [{
          originalname: 'address-proof.pdf',
          mimetype: 'application/pdf',
          size: 15 * 1024 * 1024 // 15MB
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'proofOfAddress', message: 'Proof of Address file size must not exceed 10MB' }
        ]);
      }
    });

    it('should throw ValidationError when individual tax ID has invalid MIME type', () => {
      // Arrange: Create files object with invalid MIME type for individual tax ID
      const invalidFiles = {
        individualTaxId: [{
          originalname: 'tax-id.html',
          mimetype: 'text/html',
          size: 1024000
        }],
        governmentId: [{
          originalname: 'government-id.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }],
        proofOfAddress: [{
          originalname: 'address-proof.pdf',
          mimetype: 'application/pdf',
          size: 2048000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'individualTaxId', message: 'Individual Tax ID must be a PDF, image, or Word document' },
          { field: 'individualTaxId', message: 'Individual Tax ID must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' }
        ]);
      }
    });

    it('should throw ValidationError when government ID has invalid MIME type', () => {
      // Arrange: Create files object with invalid MIME type for government ID
      const invalidFiles = {
        governmentId: [{
          originalname: 'government-id.exe',
          mimetype: 'application/x-msdownload',
          size: 1024000
        }],
        proofOfAddress: [{
          originalname: 'address-proof.pdf',
          mimetype: 'application/pdf',
          size: 2048000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'governmentId', message: 'Government ID must be a PDF, image, or Word document' },
          { field: 'governmentId', message: 'Government ID must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' }
        ]);
      }
    });

    it('should throw ValidationError when proof of address has invalid MIME type', () => {
      // Arrange: Create files object with invalid MIME type for proof of address
      const invalidFiles = {
        governmentId: [{
          originalname: 'government-id.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }],
        proofOfAddress: [{
          originalname: 'address-proof.bat',
          mimetype: 'application/x-msdownload',
          size: 2048000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'proofOfAddress', message: 'Proof of Address must be a PDF, image, or Word document' },
          { field: 'proofOfAddress', message: 'Proof of Address must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' }
        ]);
      }
    });

    it('should throw ValidationError when individual tax ID has invalid file extension', () => {
      // Arrange: Create files object with invalid file extension for individual tax ID
      const invalidFiles = {
        individualTaxId: [{
          originalname: 'tax-id.exe',
          mimetype: 'application/pdf',
          size: 1024000
        }],
        governmentId: [{
          originalname: 'government-id.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }],
        proofOfAddress: [{
          originalname: 'address-proof.pdf',
          mimetype: 'application/pdf',
          size: 2048000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'individualTaxId', message: 'Individual Tax ID must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' }
        ]);
      }
    });

    it('should throw ValidationError when government ID has invalid file extension', () => {
      // Arrange: Create files object with invalid file extension for government ID
      const invalidFiles = {
        governmentId: [{
          originalname: 'government-id.bat',
          mimetype: 'application/pdf',
          size: 1024000
        }],
        proofOfAddress: [{
          originalname: 'address-proof.pdf',
          mimetype: 'application/pdf',
          size: 2048000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'governmentId', message: 'Government ID must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' }
        ]);
      }
    });

    it('should throw ValidationError when proof of address has invalid file extension', () => {
      // Arrange: Create files object with invalid file extension for proof of address
      const invalidFiles = {
        governmentId: [{
          originalname: 'government-id.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }],
        proofOfAddress: [{
          originalname: 'address-proof.sh',
          mimetype: 'application/pdf',
          size: 2048000
        }]
      };

      // Act & Assert: Should throw ValidationError with specific message
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([
          { field: 'proofOfAddress', message: 'Proof of Address must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' }
        ]);
      }
    });

    it('should pass validation with all valid file types and extensions', () => {
      // Arrange: Create files object with all valid file types and extensions
      const validFiles = {
        individualTaxId: [{
          originalname: 'tax-id.pdf',
          mimetype: 'application/pdf',
          size: 1024000
        }],
        governmentId: [{
          originalname: 'government-id.jpg',
          mimetype: 'image/jpeg',
          size: 2048000
        }],
        proofOfAddress: [{
          originalname: 'address-proof.docx',
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 3072000
        }]
      };

      // Act & Assert: Should not throw any error
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(validFiles);
      }).not.toThrow();
    });

    it('should pass validation with image file types', () => {
      // Arrange: Create files object with image file types
      const validFiles = {
        governmentId: [{
          originalname: 'government-id.png',
          mimetype: 'image/png',
          size: 1024000
        }],
        proofOfAddress: [{
          originalname: 'address-proof.gif',
          mimetype: 'image/gif',
          size: 2048000
        }]
      };

      // Act & Assert: Should not throw any error
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(validFiles);
      }).not.toThrow();
    });

    it('should pass validation with Word document types', () => {
      // Arrange: Create files object with Word document types
      const validFiles = {
        governmentId: [{
          originalname: 'government-id.doc',
          mimetype: 'application/msword',
          size: 1024000
        }],
        proofOfAddress: [{
          originalname: 'address-proof.docx',
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 2048000
        }]
      };

      // Act & Assert: Should not throw any error
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(validFiles);
      }).not.toThrow();
    });

    it('should handle multiple validation errors simultaneously', () => {
      // Arrange: Create files object with multiple validation issues
      const invalidFiles = {
        individualTaxId: [{
          originalname: 'tax-id.exe',
          mimetype: 'application/x-msdownload',
          size: 15 * 1024 * 1024 // 15MB
        }],
        governmentId: [{
          originalname: 'government-id.bat',
          mimetype: 'text/plain',
          size: 20 * 1024 * 1024 // 20MB
        }],
        proofOfAddress: [{
          originalname: 'address-proof.sh',
          mimetype: 'text/x-sh',
          size: 25 * 1024 * 1024 // 25MB
        }]
      };

      // Act & Assert: Should throw ValidationError with multiple error messages
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      }).toThrow(ValidationError);

      try {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(invalidFiles);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toHaveLength(9); // 3 size + 3 type + 3 extension errors
        expect(error.errors).toEqual(expect.arrayContaining([
          { field: 'individualTaxId', message: 'Individual Tax ID file size must not exceed 10MB' },
          { field: 'governmentId', message: 'Government ID file size must not exceed 10MB' },
          { field: 'proofOfAddress', message: 'Proof of Address file size must not exceed 10MB' },
          { field: 'individualTaxId', message: 'Individual Tax ID must be a PDF, image, or Word document' },
          { field: 'governmentId', message: 'Government ID must be a PDF, image, or Word document' },
          { field: 'proofOfAddress', message: 'Proof of Address must be a PDF, image, or Word document' },
          { field: 'individualTaxId', message: 'Individual Tax ID must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' },
          { field: 'governmentId', message: 'Government ID must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' },
          { field: 'proofOfAddress', message: 'Proof of Address must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' }
        ]));
      }
    });

    it('should handle edge case with exact file size limit', () => {
      // Arrange: Create files object with exact file size limit
      const validFiles = {
        governmentId: [{
          originalname: 'government-id.pdf',
          mimetype: 'application/pdf',
          size: 10 * 1024 * 1024 // Exactly 10MB
        }],
        proofOfAddress: [{
          originalname: 'address-proof.pdf',
          mimetype: 'application/pdf',
          size: 10 * 1024 * 1024 // Exactly 10MB
        }]
      };

      // Act & Assert: Should not throw any error
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(validFiles);
      }).not.toThrow();
    });

    it('should handle edge case with file size just under limit', () => {
      // Arrange: Create files object with file size just under limit
      const validFiles = {
        governmentId: [{
          originalname: 'government-id.pdf',
          mimetype: 'application/pdf',
          size: (10 * 1024 * 1024) - 1 // Just under 10MB
        }],
        proofOfAddress: [{
          originalname: 'address-proof.pdf',
          mimetype: 'application/pdf',
          size: (10 * 1024 * 1024) - 1 // Just under 10MB
        }]
      };

      // Act & Assert: Should not throw any error
      expect(() => {
        uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(validFiles);
      }).not.toThrow();
    });
  });
});
