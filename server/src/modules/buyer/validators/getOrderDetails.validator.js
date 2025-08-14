const mongoose = require('mongoose');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates the order ID parameter.
 *
 * @param {string} orderId - The order ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateOrderId(orderId, errors) {
  if (!orderId) {
    errors.push({ field: 'id', message: 'Order ID is required' });
  } else if (typeof orderId !== 'string') {
    errors.push({ field: 'id', message: 'Order ID must be a string' });
  } else if (orderId.trim() === '') {
    errors.push({ field: 'id', message: 'Order ID cannot be empty' });
  } else if (!mongoose.Types.ObjectId.isValid(orderId.trim())) {
    errors.push({ field: 'id', message: 'Invalid order ID format. Order ID must be a valid 24-character hexadecimal string' });
  }
}

/**
 * Validates the order ID parameter for getOrderDetails.
 *
 * @param {Object} data - The request parameters
 * @param {string} data.id - The order ID to validate
 * @throws {ValidationError} If validation fails
 */
async function validateGetOrderDetailsData(data) {
  const errors = [];

  if (!data || data === null || data === undefined) {
    errors.push({ field: 'id', message: 'Order ID is required' });
  } else {
    validateOrderId(data.id, errors);
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateGetOrderDetailsData
}; 