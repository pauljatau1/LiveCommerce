const mongoose = require('mongoose');
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');

/**
 * Validate upload identity document data.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {Object} file - The uploaded file object
 * @throws {ValidationError} If validation fails
 */
async function validateUploadIdentityDocumentData(buyerId, file) {
  await validateBuyerId(buyerId);
  await validateFile(file);
  await validateBuyerExists(buyerId);
}

/**
 * Validate buyer ID format.
 * 
 * @param {string} buyerId
 */
async function validateBuyerId(buyerId) {
  const errors = [];
  
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  }

  if (buyerId && !mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validate file existence and basic properties.
 * 
 * @param {Object} file
 * @returns {Array} Array of validation errors
 */
function validateFileExistence(file) {
  const errors = [];
  
  if (!file) {
    errors.push({ field: 'file', message: 'No identity document uploaded' });
    return errors;
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

  return errors;
}

/**
 * Validate file type.
 * 
 * @param {Object} file
 * @returns {Array} Array of validation errors
 */
function validateFileType(file) {
  const errors = [];
  
  if (!file || !file.mimetype) {
    return errors;
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

  return errors;
}

/**
 * Validate file size.
 * 
 * @param {Object} file
 * @returns {Array} Array of validation errors
 */
function validateFileSize(file) {
  const errors = [];
  
  if (!file || !file.size) {
    return errors;
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push({ field: 'file', message: 'File size too large. Maximum size is 10MB' });
  }

  return errors;
}

/**
 * Validate uploaded file.
 * 
 * @param {Object} file
 */
async function validateFile(file) {
  const errors = [
    ...validateFileExistence(file),
    ...validateFileType(file),
    ...validateFileSize(file)
  ];

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validate that buyer exists.
 * 
 * @param {string} buyerId
 */
async function validateBuyerExists(buyerId) {
  const errors = [];
  
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    errors.push({ field: 'buyerId', message: 'Buyer not found' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateUploadIdentityDocumentData
}; 