/**
 * Upload Individual Verification Validator
 *
 * This validator handles input validation for individual verification document uploads.
 * It provides functionality to:
 * - Validate required document files
 * - Validate file sizes against maximum allowed sizes
 * - Validate file MIME types against allowed types
 * - Validate file extensions against allowed extensions
 * - Ensure data integrity and security standards
 * - Maintain consistent validation patterns
 *
 * The validator ensures that individual verification document uploads are properly formatted
 * and contain valid files to prevent security vulnerabilities and data corruption.
 *
 * @module uploadIndividualVerificationValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates that required documents are present.
 *
 * This function checks if the required government ID and proof of address
 * documents are present in the uploaded files.
 *
 * Business Logic:
 * - Government ID is mandatory for individual verification
 * - Proof of Address is mandatory for individual verification
 * - Individual Tax ID is optional but can be provided
 * - Ensures minimum required documents are uploaded
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - Prevents empty document uploads
 * - Ensures required verification documents are provided
 * - Maintains verification process integrity
 *
 * @param {Object} files - The uploaded files object from multer
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateRequiredDocuments({ governmentId: [file], proofOfAddress: [file] }, errors); // Valid
 * validateRequiredDocuments({}, errors); // Invalid, adds errors
 */
function validateRequiredDocuments(files, errors) {
  // Government ID is mandatory for individual verification
  if (!files) {
    errors.push({ 
      field: 'governmentId', 
      message: 'Government ID is required' 
    });
  } else if (!files.governmentId) {
    errors.push({ 
      field: 'governmentId', 
      message: 'Government ID is required' 
    });
  } else if (files.governmentId.length === 0) {
    errors.push({ 
      field: 'governmentId', 
      message: 'Government ID is required' 
    });
  }

  // Proof of Address is mandatory for individual verification
  if (!files) {
    errors.push({ 
      field: 'proofOfAddress', 
      message: 'Proof of Address is required' 
    });
  } else if (!files.proofOfAddress) {
    errors.push({ 
      field: 'proofOfAddress', 
      message: 'Proof of Address is required' 
    });
  } else if (files.proofOfAddress.length === 0) {
    errors.push({ 
      field: 'proofOfAddress', 
      message: 'Proof of Address is required' 
    });
  }
}

/**
 * Validates file size against maximum allowed size.
 *
 * This function checks if the uploaded file size is within the acceptable
 * limits for verification document uploads.
 *
 * Business Logic:
 * - Defines maximum file size (10MB) for verification documents
 * - Validates file size against limit for each uploaded file
 * - Prevents oversized file uploads
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - File size limits prevent DoS attacks
 * - Prevents storage space exhaustion
 * - Maintains reasonable upload performance
 *
 * @param {Object} files - The uploaded files object
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateFileSizes({ governmentId: [{ size: 1024000 }] }, errors); // Valid (1MB)
 * validateFileSizes({ governmentId: [{ size: 15 * 1024 * 1024 }] }, errors); // Invalid, adds error (15MB)
 */
function validateFileSizes(files, errors) {
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes for verification documents
  
  // Validate Individual Tax ID file size if provided
  if (files.individualTaxId && files.individualTaxId[0]) {
    if (files.individualTaxId[0].size > maxSize) {
      errors.push({ 
        field: 'individualTaxId', 
        message: 'Individual Tax ID file size must not exceed 10MB' 
      });
    }
  }

  // Validate Government ID file size
  if (files.governmentId && files.governmentId[0]) {
    if (files.governmentId[0].size > maxSize) {
      errors.push({ 
        field: 'governmentId', 
        message: 'Government ID file size must not exceed 10MB' 
      });
    }
  }

  // Validate Proof of Address file size
  if (files.proofOfAddress && files.proofOfAddress[0]) {
    if (files.proofOfAddress[0].size > maxSize) {
      errors.push({ 
        field: 'proofOfAddress', 
        message: 'Proof of Address file size must not exceed 10MB' 
      });
    }
  }
}

/**
 * Validates file MIME types against allowed types.
 *
 * This function checks if the uploaded files have acceptable MIME types
 * for verification document uploads.
 *
 * Business Logic:
 * - Defines allowed MIME types for verification documents
 * - Validates MIME type for each uploaded file
 * - Prevents files with dangerous MIME types
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - MIME type validation prevents malicious file uploads
 * - Ensures only document and image files are accepted
 * - Maintains consistent file type validation
 *
 * @param {Object} files - The uploaded files object
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateFileTypes({ governmentId: [{ mimetype: 'application/pdf' }] }, errors); // Valid
 * validateFileTypes({ governmentId: [{ mimetype: 'text/html' }] }, errors); // Invalid, adds error
 */
function validateFileTypes(files, errors) {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  // Validate Individual Tax ID file type if provided
  if (files.individualTaxId && files.individualTaxId[0]) {
    if (!allowedMimeTypes.includes(files.individualTaxId[0].mimetype)) {
      errors.push({ 
        field: 'individualTaxId', 
        message: 'Individual Tax ID must be a PDF, image, or Word document' 
      });
    }
  }

  // Validate Government ID file type
  if (files.governmentId && files.governmentId[0]) {
    if (!allowedMimeTypes.includes(files.governmentId[0].mimetype)) {
      errors.push({ 
        field: 'governmentId', 
        message: 'Government ID must be a PDF, image, or Word document' 
      });
    }
  }

  // Validate Proof of Address file type
  if (files.proofOfAddress && files.proofOfAddress[0]) {
    if (!allowedMimeTypes.includes(files.proofOfAddress[0].mimetype)) {
      errors.push({ 
        field: 'proofOfAddress', 
        message: 'Proof of Address must be a PDF, image, or Word document' 
      });
    }
  }
}

/**
 * Validates file extensions against allowed extensions.
 *
 * This function checks if the uploaded files have acceptable file extensions
 * for verification document uploads.
 *
 * Business Logic:
 * - Defines allowed file extensions for verification documents
 * - Extracts file extension from original filename
 * - Validates file extension against allowed list for each file
 * - Prevents files with dangerous extensions
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - File extension validation provides additional security layer
 * - Prevents files with potentially dangerous extensions
 * - Maintains consistent file type validation
 *
 * @param {Object} files - The uploaded files object
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateFileExtensions({ governmentId: [{ originalname: 'id.pdf' }] }, errors); // Valid
 * validateFileExtensions({ governmentId: [{ originalname: 'id.exe' }] }, errors); // Invalid, adds error
 */
function validateFileExtensions(files, errors) {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx'];
  
  // Validate Individual Tax ID file extension if provided
  if (files.individualTaxId && files.individualTaxId[0]) {
    const fileExtension = files.individualTaxId[0].originalname.toLowerCase().substring(files.individualTaxId[0].originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push({ 
        field: 'individualTaxId', 
        message: 'Individual Tax ID must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' 
      });
    }
  }

  // Validate Government ID file extension
  if (files.governmentId && files.governmentId[0]) {
    const fileExtension = files.governmentId[0].originalname.toLowerCase().substring(files.governmentId[0].originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push({ 
        field: 'governmentId', 
        message: 'Government ID must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' 
      });
    }
  }

  // Validate Proof of Address file extension
  if (files.proofOfAddress && files.proofOfAddress[0]) {
    const fileExtension = files.proofOfAddress[0].originalname.toLowerCase().substring(files.proofOfAddress[0].originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push({ 
        field: 'proofOfAddress', 
        message: 'Proof of Address must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' 
      });
    }
  }
}

/**
 * Main validation function for individual verification document uploads.
 *
 * This function orchestrates all validation checks for individual verification
 * document uploads, ensuring comprehensive validation coverage.
 *
 * Business Logic:
 * - Validates required documents are present
 * - Validates file sizes within acceptable limits
 * - Validates file types and extensions
 * - Collects all validation errors
 * - Throws ValidationError if any validation fails
 *
 * Validation Flow:
 * 1. Check required documents presence
 * 2. Validate file sizes
 * 3. Validate file types
 * 4. Validate file extensions
 * 5. Throw error if any validation fails
 *
 * @param {Object} files - The uploaded files object from multer
 * @throws {ValidationError} If validation fails with detailed error information
 * @example
 * try {
 *   validateIndividualVerificationDocuments(req.files);
 *   // Validation passed, proceed with upload
 * } catch (error) {
 *   // Handle validation errors
 *   console.log(error.errors); // Array of validation errors
 * }
 */
function validateIndividualVerificationDocuments(files) {
  const errors = [];
  
  // Step 1: Validate required documents are present
  validateRequiredDocuments(files, errors);
  
  // Step 2: Validate file sizes if files are present
  if (files && Object.keys(files).length > 0) {
    validateFileSizes(files, errors);
    validateFileTypes(files, errors);
    validateFileExtensions(files, errors);
  }
  
  // Step 3: Throw ValidationError if any validation failed
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = { validateIndividualVerificationDocuments };
