/**
 * Upload Company Verification Validator
 *
 * This validator handles input validation for company verification document uploads.
 * It provides functionality to:
 * - Validate required document files
 * - Validate file sizes against maximum allowed sizes
 * - Validate file MIME types against allowed types
 * - Validate file extensions against allowed extensions
 * - Ensure data integrity and security standards
 * - Maintain consistent validation patterns
 *
 * The validator ensures that company verification document uploads are properly formatted
 * and contain valid files to prevent security vulnerabilities and data corruption.
 *
 * @module uploadCompanyVerificationValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates that required documents are present.
 *
 * This function checks if the required certificate of incorporation
 * document is present in the uploaded files.
 *
 * Business Logic:
 * - Certificate of Incorporation is mandatory for company verification
 * - Business Tax ID is optional but can be provided
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
 * validateRequiredDocuments({ certificateOfIncorporation: [file] }, errors); // Valid
 * validateRequiredDocuments({}, errors); // Invalid, adds error
 */
function validateRequiredDocuments(files, errors) {
  // Certificate of Incorporation is mandatory for company verification
  if (!files || !files.certificateOfIncorporation || files.certificateOfIncorporation.length === 0) {
    errors.push({ 
      field: 'certificateOfIncorporation', 
      message: 'Certificate of Incorporation is required' 
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
 * validateFileSizes({ certificateOfIncorporation: [{ size: 1024000 }] }, errors); // Valid (1MB)
 * validateFileSizes({ certificateOfIncorporation: [{ size: 15 * 1024 * 1024 }] }, errors); // Invalid, adds error (15MB)
 */
function validateFileSizes(files, errors) {
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes for verification documents
  
  // Validate Certificate of Incorporation file size
  if (files.certificateOfIncorporation && files.certificateOfIncorporation[0]) {
    const certFile = files.certificateOfIncorporation[0];
    if (certFile.size > maxSize) {
      errors.push({ 
        field: 'certificateOfIncorporation', 
        message: 'Certificate of Incorporation file size must not exceed 10MB' 
      });
    }
  }
  
  // Validate Business Tax ID file size if provided
  if (files.businessTaxId && files.businessTaxId[0]) {
    const taxFile = files.businessTaxId[0];
    if (taxFile.size > maxSize) {
      errors.push({ 
        field: 'businessTaxId', 
        message: 'Business Tax ID file size must not exceed 10MB' 
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
 * - Validates file MIME type against allowed list for each file
 * - Prevents non-document file uploads
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - MIME type validation prevents malicious file uploads
 * - Restricts uploads to document formats only
 * - Prevents executable file uploads
 *
 * @param {Object} files - The uploaded files object
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateFileTypes({ certificateOfIncorporation: [{ mimetype: 'application/pdf' }] }, errors); // Valid
 * validateFileTypes({ certificateOfIncorporation: [{ mimetype: 'image/jpeg' }] }, errors); // Valid
 * validateFileTypes({ certificateOfIncorporation: [{ mimetype: 'application/exe' }] }, errors); // Invalid, adds error
 */
function validateFileTypes(files, errors) {
  const allowedTypes = [
    'application/pdf',           // PDF documents
    'image/jpeg',               // JPEG images
    'image/jpg',                // JPG images
    'image/png',                // PNG images
    'image/gif',                // GIF images
    'application/msword',        // DOC files
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX files
  ];
  
  // Validate Certificate of Incorporation file type
  if (files.certificateOfIncorporation && files.certificateOfIncorporation[0]) {
    const certFile = files.certificateOfIncorporation[0];
    if (!allowedTypes.includes(certFile.mimetype)) {
      errors.push({ 
        field: 'certificateOfIncorporation', 
        message: 'Certificate of Incorporation must be a PDF, image, or Word document' 
      });
    }
  }
  
  // Validate Business Tax ID file type if provided
  if (files.businessTaxId && files.businessTaxId[0]) {
    const taxFile = files.businessTaxId[0];
    if (!allowedTypes.includes(taxFile.mimetype)) {
      errors.push({ 
        field: 'businessTaxId', 
        message: 'Business Tax ID must be a PDF, image, or Word document' 
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
 * validateFileExtensions({ certificateOfIncorporation: [{ originalname: 'cert.pdf' }] }, errors); // Valid
 * validateFileExtensions({ certificateOfIncorporation: [{ originalname: 'cert.exe' }] }, errors); // Invalid, adds error
 */
function validateFileExtensions(files, errors) {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx'];
  
  // Validate Certificate of Incorporation file extension
  if (files.certificateOfIncorporation && files.certificateOfIncorporation[0]) {
    const certFile = files.certificateOfIncorporation[0];
    const fileExtension = certFile.originalname.toLowerCase().substring(certFile.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push({ 
        field: 'certificateOfIncorporation', 
        message: 'Certificate of Incorporation must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' 
      });
    }
  }
  
  // Validate Business Tax ID file extension if provided
  if (files.businessTaxId && files.businessTaxId[0]) {
    const taxFile = files.businessTaxId[0];
    const fileExtension = taxFile.originalname.toLowerCase().substring(taxFile.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push({ 
        field: 'businessTaxId', 
        message: 'Business Tax ID must have a valid file extension (PDF, JPG, PNG, GIF, DOC, DOCX)' 
      });
    }
  }
}

/**
 * Main validation function for company verification document uploads.
 *
 * This function orchestrates all validation checks for company verification
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
 *   validateCompanyVerificationDocuments(req.files);
 *   // Validation passed, proceed with upload
 * } catch (error) {
 *   // Handle validation errors
 *   console.log(error.errors); // Array of validation errors
 * }
 */
function validateCompanyVerificationDocuments(files) {
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

module.exports = { validateCompanyVerificationDocuments };
