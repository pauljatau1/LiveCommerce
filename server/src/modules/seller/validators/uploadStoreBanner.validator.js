/**
 * Upload Store Banner Validator
 *
 * This validator handles validation for uploaded store banner files.
 * It ensures that the file adheres to security, format, and size requirements
 * before processing the upload.
 *
 * Validation Rules:
 * - file: Required, must be an object
 *   - buffer: Required, must be a valid Buffer object and not empty
 *   - originalname: Required, must be a string, not empty, and max 255 characters
 *   - mimetype: Required, must be a string and a valid image format (JPEG, PNG, GIF, WebP)
 *   - size: Required, must be a number, positive, and max 10MB (10 * 1024 * 1024 bytes)
 *
 * @module uploadStoreBannerValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates the uploaded file data for store banner.
 *
 * This function orchestrates the validation of all aspects of the uploaded file,
 * including its presence, buffer content, filename, MIME type, and size.
 *
 * Validation Process:
 * - Checks for file presence
 * - Validates file buffer
 * - Validates file name
 * - Validates MIME type
 * - Validates file size
 * - Collects all validation errors
 * - Throws ValidationError if any issues found
 *
 * @param {Object} file - The file object from multer to validate
 * @param {Buffer} file.buffer - File content buffer
 * @param {string} file.originalname - Original filename
 * @param {string} file.mimetype - File MIME type
 * @param {number} file.size - File size in bytes
 * @throws {ValidationError} If validation fails with detailed error messages
 */
function validateUploadStoreBannerData(file) {
  const errors = [];

  // Step 1: Check if file is provided
  if (!file) {
    errors.push({ field: 'banner', message: 'Banner file is required' });
    throwValidationError(errors);
  }

  // Step 2: Validate file buffer
  validateFileBuffer(file.buffer, errors);

  // Step 3: Validate file name
  validateFileName(file.originalname, errors);

  // Step 4: Validate MIME type
  validateMimeType(file.mimetype, errors);

  // Step 5: Validate file size
  validateFileSize(file.size, errors);

  // Step 6: Throw validation error if any issues found
  throwValidationError(errors);
}

/**
 * Validates file buffer.
 *
 * @param {Buffer} buffer - The file buffer to validate
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateFileBuffer(buffer, errors) {
  if (!buffer) {
    errors.push({ field: 'file.buffer', message: 'File buffer is required' });
  } else if (!Buffer.isBuffer(buffer)) {
    errors.push({ field: 'file.buffer', message: 'File buffer must be a valid Buffer object' });
  } else if (buffer.length === 0) {
    errors.push({ field: 'file.buffer', message: 'File buffer cannot be empty' });
  }
}

/**
 * Validates file name.
 *
 * @param {string} fileName - The file name to validate
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateFileName(fileName, errors) {
  if (!fileName) {
    errors.push({ field: 'file.originalname', message: 'File name is required' });
  } else if (typeof fileName !== 'string') {
    errors.push({ field: 'file.originalname', message: 'File name must be a string' });
  } else if (fileName.trim() === '') {
    errors.push({ field: 'file.originalname', message: 'File name is required' });
  } else if (fileName.length > 255) {
    errors.push({ field: 'file.originalname', message: 'File name cannot exceed 255 characters' });
  }
}

/**
 * Validates MIME type.
 *
 * @param {string} mimeType - The MIME type to validate
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateMimeType(mimeType, errors) {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!mimeType) {
    errors.push({ field: 'file.mimetype', message: 'File MIME type is required' });
  } else if (typeof mimeType !== 'string') {
    errors.push({ field: 'file.mimetype', message: 'File MIME type must be a string' });
  } else if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
    errors.push({ field: 'file.mimetype', message: 'File must be a valid image format (JPEG, PNG, GIF, WebP)' });
  }
}

/**
 * Validates file size.
 *
 * @param {number} fileSize - The file size to validate
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateFileSize(fileSize, errors) {
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  if (fileSize === undefined || fileSize === null) {
    errors.push({ field: 'file.size', message: 'File size is required' });
  } else if (typeof fileSize !== 'number') {
    errors.push({ field: 'file.size', message: 'File size must be a number' });
  } else if (fileSize <= 0) {
    errors.push({ field: 'file.size', message: 'File size must be a positive number' });
  } else if (fileSize > maxFileSize) {
    errors.push({ field: 'file.size', message: `File size cannot exceed ${maxFileSize / (1024 * 1024)}MB` });
  }
}

/**
 * Throws validation error if any errors are found.
 *
 * @param {Array} errors - The errors array to check
 * @throws {ValidationError} If validation fails with detailed error messages
 */
function throwValidationError(errors) {
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateUploadStoreBannerData
};
