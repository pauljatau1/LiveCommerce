/**
 * Upload Store Avatar Validator
 *
 * This validator handles validation for store avatar upload data.
 * It ensures that the uploaded file meets security and format requirements
 * before processing the avatar upload.
 *
 * Validation Rules:
 * - file: Required, must be a valid file object
 * - file.buffer: Required, must be a Buffer object
 * - file.originalname: Required, must be a non-empty string
 * - file.mimetype: Required, must be a valid image MIME type
 * - file.size: Optional, but if provided must be within reasonable limits
 *
 * @module uploadStoreAvatarValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates store avatar upload data.
 *
 * This function validates the uploaded file data structure and ensures
 * all required fields are present and valid for secure avatar upload.
 *
 * Validation Process:
 * - Checks for file presence and structure
 * - Validates file buffer content
 * - Validates file name and MIME type
 * - Ensures file size is within reasonable limits
 * - Collects all validation errors
 * - Throws validation error if any issues found
 *
 * @param {Object} file - The uploaded file object from multer
 * @param {Buffer} file.buffer - File content buffer
 * @param {string} file.originalname - Original filename
 * @param {string} file.mimetype - File MIME type
 * @param {number} file.size - File size in bytes
 * @throws {ValidationError} If validation fails with detailed error messages
 */
function validateUploadStoreAvatarData(file) {
  const errors = [];

  // Step 1: Check if file is provided
  if (!file) {
    errors.push({ field: 'avatar', message: 'Avatar file is required' });
    throwValidationError(errors);
    return;
  }

  // Step 2: Validate file buffer
  validateFileBuffer(file.buffer, errors);

  // Step 3: Validate file name
  validateFileName(file.originalname, errors);

  // Step 4: Validate MIME type
  validateMimeType(file.mimetype, errors);

  // Step 5: Validate file size if provided
  if (file.size !== undefined) {
    validateFileSize(file.size, errors);
  }

  // Step 6: Throw validation error if any issues found
  throwValidationError(errors);
}

/**
 * Validates file buffer content.
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
    errors.push({ field: 'file.originalname', message: 'File name cannot be empty' });
  } else if (fileName.length > 255) {
    errors.push({ field: 'file.originalname', message: 'File name cannot exceed 255 characters' });
  }
}

/**
 * Validates MIME type for image files.
 *
 * @param {string} mimeType - The MIME type to validate
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateMimeType(mimeType, errors) {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (!mimeType) {
    errors.push({ field: 'file.mimetype', message: 'File MIME type is required' });
  } else if (typeof mimeType !== 'string') {
    errors.push({ field: 'file.mimetype', message: 'File MIME type must be a string' });
  } else if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
    errors.push({ 
      field: 'file.mimetype', 
      message: 'File must be a valid image format (JPEG, PNG, GIF, WebP)' 
    });
  }
}

/**
 * Validates file size.
 *
 * @param {number} fileSize - The file size in bytes to validate
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateFileSize(fileSize, errors) {
  const maxSizeInBytes = 10 * 1024 * 1024; // 10MB

  if (typeof fileSize !== 'number') {
    errors.push({ field: 'file.size', message: 'File size must be a number' });
  } else if (fileSize <= 0) {
    errors.push({ field: 'file.size', message: 'File size must be greater than 0' });
  } else if (fileSize > maxSizeInBytes) {
    errors.push({ 
      field: 'file.size', 
      message: 'File size cannot exceed 10MB' 
    });
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
  validateUploadStoreAvatarData
};
