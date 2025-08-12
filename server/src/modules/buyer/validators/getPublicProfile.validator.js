const ValidationError = require('../../../utils/errors/ValidationError');
const mongoose = require('mongoose');

/**
 * Validates buyer ID format and structure.
 *
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBuyerId(buyerId, errors) {
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (typeof buyerId !== 'string') {
    errors.push({ field: 'buyerId', message: 'Buyer ID must be a string' });
  } else if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
  }
}

/**
 * Validates all input data for getPublicProfile.
 *
 * @param {Object} data - Input data containing buyerId
 * @param {string} data.buyerId - The buyer's ID
 * @throws {ValidationError} If validation fails
 */
async function validateGetPublicProfileData(data) {
  const errors = [];

  validateBuyerId(data.buyerId, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateGetPublicProfileData,
  validateBuyerId
};
