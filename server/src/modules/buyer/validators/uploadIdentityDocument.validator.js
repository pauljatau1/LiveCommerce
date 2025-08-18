const mongoose = require('mongoose');
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');

/**
 * Validate buyer ID format.
 * 
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
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
 * @param {Object} file - The file to validate
 * @param {Array} errors - Array to collect validation errors
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
 * @param {Object} file - The file to validate
 * @param {Array} errors - Array to collect validation errors
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
 * @param {Object} file - The file to validate
 * @param {Array} errors - Array to collect validation errors
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
 * @param {Object} file - The file to validate
 * @param {Array} errors - Array to collect validation errors
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
 * @param {Object} data - Data to validate
 * @param {string} data.buyerId - The buyer's ID
 * @param {Object} data.file - The uploaded file object
 * @throws {ValidationError} If validation fails
 */
async function validateUploadIdentityDocumentData(data) {
  const errors = [];

  // Validate buyer ID format
  validateBuyerId(data.buyerId, errors);

  // Validate file
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