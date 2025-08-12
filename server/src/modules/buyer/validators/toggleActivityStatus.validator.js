const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate buyer ID from request.
 * 
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBuyerId(buyerId, errors) {
  if (!buyerId) {
    errors.push({
      field: 'buyerId',
      message: 'Buyer ID is required'
    });
    return;
  }

  if (typeof buyerId !== 'string') {
    errors.push({
      field: 'buyerId',
      message: 'Buyer ID must be a string'
    });
    return;
  }

  // Check if it's a valid ObjectId format
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(buyerId)) {
    errors.push({
      field: 'buyerId',
      message: 'Invalid buyer ID format'
    });
  }
}

/**
 * Validate toggle activity status data.
 * 
 * This function validates the buyer ID from the request.
 * Since toggleActivityStatus doesn't require any body parameters,
 * we only validate the buyer ID from the authenticated user.
 * 
 * @param {Object} data - Data object containing buyerId
 * @returns {Promise<void>}
 * @throws {ValidationError} If validation fails
 */
async function validateToggleActivityStatusData(data) {
  const errors = [];

  // Validate buyer ID
  validateBuyerId(data.buyerId, errors);

  // If there are validation errors, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateToggleActivityStatusData,
  validateBuyerId
};
