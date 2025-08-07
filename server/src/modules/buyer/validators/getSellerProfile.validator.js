const ValidationError = require('../../../utils/errors/ValidationError');
const mongoose = require('mongoose');

/**
 * Validates seller ID format and structure.
 *
 * @param {string} sellerId - The seller ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateSellerId(sellerId, errors) {
  if (!sellerId) {
    errors.push({ field: 'sellerId', message: 'Seller ID is required' });
  } else if (typeof sellerId !== 'string') {
    errors.push({ field: 'sellerId', message: 'Seller ID must be a string' });
  } else if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    errors.push({ field: 'sellerId', message: 'Invalid seller ID format' });
  }
}

/**
 * Validates all input data for getSellerProfile.
 *
 * @param {Object} data - Input data containing sellerId
 * @param {string} data.sellerId - The seller's ID
 * @throws {ValidationError} If validation fails
 */
async function validateGetSellerProfileData(data) {
  const errors = [];

  validateSellerId(data.sellerId, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateGetSellerProfileData,
  validateSellerId
}; 