const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate buyer ID for notification preferences retrieval
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBuyerId(buyerId, errors) {
  // Check if buyer ID is provided
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (typeof buyerId !== 'string') {
    errors.push({ field: 'buyerId', message: 'Buyer ID must be a string' });
  } else if (buyerId.trim() === '') {
    errors.push({ field: 'buyerId', message: 'Buyer ID cannot be empty' });
  }
}

/**
 * Validate get notification preferences data
 * @param {string} buyerId - The buyer ID
 * @throws {ValidationError} If validation fails
 */
async function validateGetNotificationPreferencesData(buyerId) {
  const errors = [];

  validateBuyerId(buyerId, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateBuyerId,
  validateGetNotificationPreferencesData
}; 