const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates seller ID format and structure.
 *
 * @param {string} sellerId - The seller ID to validate
 * @returns {void}
 * @throws {ValidationError} If seller ID is invalid
 */
function validateSellerId(sellerId) {
  const errors = [];

  if (!sellerId) {
    errors.push({ field: 'sellerId', message: 'Seller ID is required' });
  } else if (typeof sellerId !== 'string') {
    errors.push({ field: 'sellerId', message: 'Seller ID must be a string' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validates all input data for getSellerProfile.
 *
 * @param {Object} data - Input data containing sellerId
 * @param {string} data.sellerId - The seller's ID
 * @returns {void}
 * @throws {ValidationError} If validation fails
 */
async function validateGetSellerProfileData(data) {
  validateSellerId(data.sellerId);
}

module.exports = {
  validateGetSellerProfileData,
  validateSellerId
}; 