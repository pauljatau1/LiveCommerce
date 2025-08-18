const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates file size against maximum allowed size.
 * 
 * @param {Object} file - The uploaded file object
 * @param {Array} errors - Array to collect validation errors
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
 * @param {Object} file - The uploaded file object
 * @param {Array} errors - Array to collect validation errors
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
 * @param {Object} file - The uploaded file object
 * @param {Array} errors - Array to collect validation errors
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
 * @param {Object} data - Data to validate
 * @param {Object} data.file - The uploaded file object to validate
 * @throws {ValidationError} If validation fails
 */
async function validateUploadProfileImageData(data) {
  const errors = [];

  // Validate file presence
  if (!data.file) {
    errors.push({ 
      field: 'avatar', 
      message: 'No file provided. Please upload an image file.' 
    });
  } else {
    validateFileSize(data.file, errors);
    validateFileType(data.file, errors);
    validateFileExtension(data.file, errors);
  }

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