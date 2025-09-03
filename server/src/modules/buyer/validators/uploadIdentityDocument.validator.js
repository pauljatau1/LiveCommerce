/**
 * Upload Identity Document Validator
 *
 * This validator handles input validation for identity document uploads.
 * It provides functionality to:
 * - Validate buyer ID format and structure
 * - Validate file presence and basic properties
 * - Validate file type against allowed document types
 * - Validate file size against maximum allowed size
 * - Ensure data integrity and security standards
 * - Maintain consistent validation patterns
 *
 * The validator ensures that identity document uploads are properly formatted
 * and contain valid document files to prevent security vulnerabilities and data corruption.
 *
 * @module uploadIdentityDocumentValidator
 */

const mongoose = require('mongoose');
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');

/**
 * Validate buyer ID format.
 *
 * This function validates the buyer ID to ensure it's properly formatted
 * according to MongoDB ObjectId requirements.
 *
 * Business Logic:
 * - Checks if buyer ID is provided (required parameter)
 * - Validates MongoDB ObjectId format
 * - Prevents invalid ID format requests
 * - Collects validation errors for reporting
 *
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateBuyerId("507f1f77bcf86cd799439011", errors); // Valid ObjectId
 * validateBuyerId("invalid-id", errors); // Invalid, adds error
 * validateBuyerId("", errors); // Invalid, adds error
 */
function validateBuyerId(buyerId, errors) {
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  }

  if (buyerId && !mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
  }
}

/**
 * Validate file existence and basic properties.
 *
 * This function checks if the uploaded file exists and has the required
 * basic properties for identity document uploads.
 *
 * Business Logic:
 * - Checks if file is provided (required parameter)
 * - Validates file buffer presence
 * - Validates original filename presence
 * - Validates MIME type presence
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - File presence validation prevents null uploads
 * - Buffer validation ensures file content exists
 * - Filename validation ensures proper file identification
 * - MIME type validation ensures proper file classification
 *
 * @param {Object} file - The file to validate
 * @param {Buffer} file.buffer - File content buffer
 * @param {string} file.originalname - Original filename
 * @param {string} file.mimetype - File MIME type
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateFileExistence({ buffer: Buffer.from('test'), originalname: 'doc.pdf', mimetype: 'application/pdf' }, errors); // Valid
 * validateFileExistence(null, errors); // Invalid, adds error
 * validateFileExistence({}, errors); // Invalid, adds error
 */
function validateFileExistence(file, errors) {
  if (!file) {
    errors.push({ field: 'file', message: 'No identity document uploaded' });
    return;
  }

  if (!file.buffer) {
    errors.push({ field: 'file', message: 'Invalid file format' });
  }

  if (!file.originalname) {
    errors.push({ field: 'file', message: 'File name is required' });
  }

  if (!file.mimetype) {
    errors.push({ field: 'file', message: 'File type is required' });
  }
}

/**
 * Validate file type.
 *
 * This function checks if the uploaded file has an acceptable MIME type
 * for identity document uploads.
 *
 * Business Logic:
 * - Defines allowed MIME types for identity documents
 * - Validates file MIME type against allowed list
 * - Prevents non-document file uploads
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - MIME type validation prevents malicious file uploads
 * - Restricts uploads to document formats only
 * - Prevents executable file uploads
 * - Supports common document formats (PDF, images, Word docs)
 *
 * @param {Object} file - The file to validate
 * @param {string} file.mimetype - File MIME type
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateFileType({ mimetype: 'application/pdf' }, errors); // Valid
 * validateFileType({ mimetype: 'image/jpeg' }, errors); // Valid
 * validateFileType({ mimetype: 'application/exe' }, errors); // Invalid, adds error
 */
function validateFileType(file, errors) {
  if (!file || !file.mimetype) {
    return;
  }

  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push({ field: 'file', message: 'Invalid file type. Allowed types: PDF, JPEG, PNG, GIF, DOC, DOCX' });
  }
}

/**
 * Validate file size.
 *
 * This function checks if the uploaded file size is within the acceptable
 * limits for identity document uploads.
 *
 * Business Logic:
 * - Defines maximum file size (10MB)
 * - Validates file size against limit
 * - Prevents oversized file uploads
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - File size limits prevent DoS attacks
 * - Prevents storage space exhaustion
 * - Maintains reasonable upload performance
 * - Allows larger files for identity documents
 *
 * @param {Object} file - The file to validate
 * @param {number} file.size - File size in bytes
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateFileSize({ size: 5 * 1024 * 1024 }, errors); // Valid (5MB)
 * validateFileSize({ size: 15 * 1024 * 1024 }, errors); // Invalid, adds error (15MB)
 */
function validateFileSize(file, errors) {
  if (!file || !file.size) {
    return;
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push({ field: 'file', message: 'File size too large. Maximum size is 10MB' });
  }
}

/**
 * Validate uploaded file.
 *
 * This function orchestrates the complete file validation process,
 * checking all file properties in sequence.
 *
 * Business Logic Flow:
 * 1. Validate file existence and basic properties
 * 2. Validate file MIME type
 * 3. Validate file size
 *
 * @param {Object} file - The file to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateFile({ buffer: Buffer.from('test'), originalname: 'doc.pdf', mimetype: 'application/pdf', size: 1024000 }, errors); // Valid
 * validateFile(null, errors); // Invalid, adds error
 */
function validateFile(file, errors) {
  validateFileExistence(file, errors);
  validateFileType(file, errors);
  validateFileSize(file, errors);
}

/**
 * Validate that buyer exists.
 * 
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
async function validateBuyerExists(buyerId, errors) {
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    errors.push({ field: 'buyerId', message: 'Buyer not found' });
  }
}

/**
 * Validate upload identity document data.
 *
 * This function orchestrates the complete validation process for identity
 * document uploads, ensuring all parameters meet validation requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate buyer ID format and structure
 * 3. Validate uploaded file properties
 * 4. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Buyer ID validation prevents unauthorized uploads
 * - File validation prevents malicious uploads
 * - Size validation prevents DoS attacks
 * - Type validation prevents executable uploads
 * - Error collection provides comprehensive feedback
 *
 * @param {Object} data - Data to validate
 * @param {string} data.buyerId - The buyer's ID to validate
 * @param {Object} data.file - The uploaded file object to validate
 * @param {Buffer} data.file.buffer - File content buffer
 * @param {string} data.file.originalname - Original filename
 * @param {string} data.file.mimetype - File MIME type
 * @param {number} data.file.size - File size in bytes
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid request
 * await validateUploadIdentityDocumentData({
 *   buyerId: "507f1f77bcf86cd799439011",
 *   file: { buffer: Buffer.from('test'), originalname: 'id.pdf', mimetype: 'application/pdf', size: 1024000 }
 * });
 * 
 * // Invalid request - will throw ValidationError
 * await validateUploadIdentityDocumentData({
 *   buyerId: "invalid-id",
 *   file: { buffer: Buffer.from('test'), originalname: 'script.exe', mimetype: 'application/exe', size: 15 * 1024 * 1024 }
 * });
 */
async function validateUploadIdentityDocumentData(data) {
  // Initialize error collection array
  const errors = [];

  // Step 1: Validate buyer ID format and structure
  // This ensures the buyer ID is properly formatted
  validateBuyerId(data.buyerId, errors);

  // Step 2: Validate uploaded file properties
  // This ensures the file is valid and meets all requirements
  validateFile(data.file, errors);

  // If format validation passes, then check existence
  if (errors.length === 0) {
    await validateBuyerExists(data.buyerId, errors);
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateUploadIdentityDocumentData
}; 