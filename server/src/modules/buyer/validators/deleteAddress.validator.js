const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');

/**
 * Validate that address ID is required.
 * 
 * @param {string} addressId - The address ID
 * @param {Array} errors - Array to collect errors
 */
function validateAddressIdRequired(addressId, errors) {
  if (!addressId) {
    errors.push({ field: 'addressId', message: 'Address ID is required' });
  }
}

/**
 * Validate that address ID is a string.
 * 
 * @param {string} addressId - The address ID
 * @param {Array} errors - Array to collect errors
 */
function validateAddressIdType(addressId, errors) {
  if (addressId && typeof addressId !== 'string') {
    errors.push({ field: 'addressId', message: 'Address ID must be a string' });
  }
}

/**
 * Validate that address ID has valid ObjectId format.
 * 
 * @param {string} addressId - The address ID
 * @param {Array} errors - Array to collect errors
 */
function validateAddressIdFormat(addressId, errors) {
  if (addressId && typeof addressId === 'string' && !require('mongoose').Types.ObjectId.isValid(addressId)) {
    errors.push({ field: 'addressId', message: 'Invalid address ID format' });
  }
}

/**
 * Validate address ID format.
 * 
 * @param {string} addressId - The address ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateAddressId(addressId, errors) {
  validateAddressIdRequired(addressId, errors);
  validateAddressIdType(addressId, errors);
  validateAddressIdFormat(addressId, errors);
}

/**
 * Validate that buyer ID is required.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {Array} errors - Array to collect validation errors
 */
function validateBuyerIdRequired(buyerId, errors) {
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  }
}

/**
 * Validate that buyer ID is a string.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {Array} errors - Array to collect validation errors
 */
function validateBuyerIdType(buyerId, errors) {
  if (buyerId && typeof buyerId !== 'string') {
    errors.push({ field: 'buyerId', message: 'Buyer ID must be a string' });
  }
}

/**
 * Validate that buyer ID has valid ObjectId format.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {Array} errors - Array to collect validation errors
 */
function validateBuyerIdFormat(buyerId, errors) {
  if (buyerId && typeof buyerId === 'string' && !require('mongoose').Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
  }
}

/**
 * Validate buyer ID format.
 * 
 * @param {string} buyerId - The buyer's ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBuyerId(buyerId, errors) {
  validateBuyerIdRequired(buyerId, errors);
  validateBuyerIdType(buyerId, errors);
  validateBuyerIdFormat(buyerId, errors);
}

/**
 * Validate address deletion data.
 * 
 * @param {Object} data - Data to validate
 * @param {string} data.addressId - The address ID to delete
 * @param {string} data.buyerId - The buyer's ID
 * @throws {ValidationError} If validation fails
 */
async function validateDeleteAddressData(data) {
  const errors = [];

  // Validate address ID format
  validateAddressId(data.addressId, errors);

  // Validate buyer ID format
  validateBuyerId(data.buyerId, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateDeleteAddressData
}; 