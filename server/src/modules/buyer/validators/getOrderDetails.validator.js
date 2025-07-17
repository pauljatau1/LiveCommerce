const mongoose = require('mongoose');

/**
 * Validates the order ID parameter for getOrderDetails.
 *
 * @param {Object} data - The request parameters
 * @returns {Array} Array of validation errors
 */
function validateGetOrderDetailsInput(data) {
  const errors = [];

  if (!data || data === null || data === undefined) {
    errors.push({ field: 'id', message: 'Order ID is required' });
    return errors;
  }

  if (!data.id) {
    errors.push({ field: 'id', message: 'Order ID is required' });
  } else if (typeof data.id !== 'string') {
    errors.push({ field: 'id', message: 'Order ID must be a string' });
  } else if (data.id.trim() === '') {
    errors.push({ field: 'id', message: 'Order ID cannot be empty' });
  } else if (!mongoose.Types.ObjectId.isValid(data.id.trim())) {
    errors.push({ field: 'id', message: 'Invalid order ID format. Order ID must be a valid 24-character hexadecimal string' });
  }

  return errors;
}

module.exports = {
  validateGetOrderDetailsInput
}; 