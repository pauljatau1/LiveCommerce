/**
 * Upload Profile Image Validator
 *
 * This validator handles input validation for profile image uploads.
 * It provides functionality to:
 * - Validate file presence and basic properties
 * - Validate file size against maximum allowed size
 * - Validate file MIME type against allowed types
 * - Validate file extension against allowed extensions
 * - Ensure data integrity and security standards
 * - Maintain consistent validation patterns
 *
 * The validator ensures that profile image uploads are properly formatted
 * and contain valid image files to prevent security vulnerabilities and data corruption.
 *
 * @module uploadProfileImageValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates file size against maximum allowed size.
 *
 * This function checks if the uploaded file size is within the acceptable
 * limits for profile image uploads.
 *
 * Business Logic:
 * - Defines maximum file size (5MB)
 * - Validates file size against limit
 * - Prevents oversized file uploads
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - File size limits prevent DoS attacks
 * - Prevents storage space exhaustion
 * - Maintains reasonable upload performance
 *
 * @param {Object} file - The uploaded file object
 * @param {number} file.size - File size in bytes
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateFileSize({ size: 1024000 }, errors); // Valid (1MB)
 * validateFileSize({ size: 10 * 1024 * 1024 }, errors); // Invalid, adds error (10MB)
 */
function validateFileSize(file, errors) {
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    errors.push({ 
      field: 'avatar', 
      message: 'File size must not exceed 5MB' 
    });
  }
}

/**
 * Validates file MIME type against allowed types.
 *
 * This function checks if the uploaded file has an acceptable MIME type
 * for profile image uploads.
 *
 * Business Logic:
 * - Defines allowed MIME types for images
 * - Validates file MIME type against allowed list
 * - Prevents non-image file uploads
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - MIME type validation prevents malicious file uploads
 * - Restricts uploads to image formats only
 * - Prevents executable file uploads
 *
 * @param {Object} file - The uploaded file object
 * @param {string} file.mimetype - File MIME type
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateFileType({ mimetype: 'image/jpeg' }, errors); // Valid
 * validateFileType({ mimetype: 'image/png' }, errors); // Valid
 * validateFileType({ mimetype: 'application/pdf' }, errors); // Invalid, adds error
 */
function validateFileType(file, errors) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push({ 
      field: 'avatar', 
      message: 'Only JPEG, PNG, GIF, and WebP images are allowed' 
    });
  }
}

/**
 * Validates file extension against allowed extensions.
 *
 * This function checks if the uploaded file has an acceptable file extension
 * for profile image uploads.
 *
 * Business Logic:
 * - Defines allowed file extensions for images
 * - Extracts file extension from original filename
 * - Validates extension against allowed list
 * - Prevents files with invalid extensions
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - Extension validation provides additional security layer
 * - Prevents files with misleading extensions
 * - Ensures consistency between MIME type and extension
 *
 * @param {Object} file - The uploaded file object
 * @param {string} file.originalname - Original filename
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateFileExtension({ originalname: 'profile.jpg' }, errors); // Valid
 * validateFileExtension({ originalname: 'profile.png' }, errors); // Valid
 * validateFileExtension({ originalname: 'document.pdf' }, errors); // Invalid, adds error
 */
function validateFileExtension(file, errors) {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    errors.push({ 
      field: 'avatar', 
      message: 'Only .jpg, .jpeg, .png, .gif, and .webp files are allowed' 
    });
  }
}

/**
 * Validates upload profile image data.
 *
 * This function orchestrates the complete validation process for profile
 * image uploads, ensuring all file properties meet validation requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate file presence (required)
 * 3. If file exists, validate file size
 * 4. If file exists, validate file MIME type
 * 5. If file exists, validate file extension
 * 6. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - File presence validation prevents null uploads
 * - Size validation prevents DoS attacks
 * - Type validation prevents malicious uploads
 * - Extension validation ensures consistency
 * - Error collection provides comprehensive feedback
 *
 * @param {Object} data - Data to validate
 * @param {Object} data.file - The uploaded file object to validate
 * @param {number} data.file.size - File size in bytes
 * @param {string} data.file.mimetype - File MIME type
 * @param {string} data.file.originalname - Original filename
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid request
 * await validateUploadProfileImageData({
 *   file: { size: 1024000, mimetype: 'image/jpeg', originalname: 'profile.jpg' }
 * });
 * 
 * // Invalid request - will throw ValidationError
 * await validateUploadProfileImageData({
 *   file: { size: 10 * 1024 * 1024, mimetype: 'application/pdf', originalname: 'document.pdf' }
 * });
 */
async function validateUploadProfileImageData(data) {
  // Initialize error collection array
  const errors = [];

  // Step 1: Validate file presence
  // This ensures a file was actually uploaded
  if (!data.file) {
    errors.push({ 
      field: 'avatar', 
      message: 'No file provided. Please upload an image file.' 
    });
  } else {
    // Step 2: Validate file size
    // This ensures the file is not too large
    validateFileSize(data.file, errors);

    // Step 3: Validate file MIME type
    // This ensures the file is actually an image
    validateFileType(data.file, errors);

    // Step 4: Validate file extension
    // This ensures the file extension matches the content
    validateFileExtension(data.file, errors);
  }

  // If any validation errors were found, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateUploadProfileImageData,
  validateFileSize,
  validateFileType,
  validateFileExtension,
}; 