const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate buyer ID for notification preferences retrieval
 * @param {string} buyerId - The buyer ID to validate
 * @throws {ValidationError} If buyer ID is invalid
 */
function validateBuyerId(buyerId) {
  // Check if buyer ID is provided
  if (!buyerId) {
    throw new ValidationError([
      { field: 'buyerId', message: 'Buyer ID is required' }
    ]);
  }

  // Check if buyer ID is a string
  if (typeof buyerId !== 'string') {
    throw new ValidationError([
      { field: 'buyerId', message: 'Buyer ID must be a string' }
    ]);
  }

  // Check if buyer ID is not empty
  if (buyerId.trim() === '') {
    throw new ValidationError([
      { field: 'buyerId', message: 'Buyer ID cannot be empty' }
    ]);
  }
}

/**
 * Validate get notification preferences data
 * @param {string} buyerId - The buyer ID
 * @throws {ValidationError} If validation fails
 */
async function validateGetNotificationPreferencesData(buyerId) {
  // Validate buyer ID
  validateBuyerId(buyerId);
}

module.exports = {
  validateBuyerId,
  validateGetNotificationPreferencesData
}; 