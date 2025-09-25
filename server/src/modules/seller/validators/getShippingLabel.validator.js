/**
 * Get Shipping Label Validator
 *
 * This validator handles input validation for shipping label generation requests.
 * It ensures all required fields are present and properly formatted before
 * processing the shipping label generation.
 *
 * Validation Rules:
 * - orderId: Required, must be a valid MongoDB ObjectId
 * - itemId: Required, must be a valid MongoDB ObjectId
 * - sellerId: Required, must be a valid MongoDB ObjectId
 *
 * @module getShippingLabelValidator
 */

const mongoose = require('mongoose');

/**
 * Validates the shipping label generation request data.
 *
 * This function performs comprehensive validation on the input data
 * to ensure all required fields are present and properly formatted.
 *
 * Validation Checks:
 * - Verifies orderId is provided and is a valid ObjectId
 * - Ensures itemId is provided and is a valid ObjectId
 * - Validates sellerId is provided and is a valid ObjectId
 * - Checks for any additional validation requirements
 *
 * @param {Object} data - The shipping label request data to validate
 * @param {string} data.orderId - The order ID (required, must be valid ObjectId)
 * @param {string} data.itemId - The order item ID (required, must be valid ObjectId)
 * @param {string} data.sellerId - The seller ID (required, must be valid ObjectId)
 * @throws {ValidationError} If validation fails with specific error details
 *
 * @example
 * // Validate shipping label request data
 * await validateGetShippingLabelData({
 *   orderId: '507f1f77bcf86cd799439011',
 *   itemId: '507f1f77bcf86cd799439012',
 *   sellerId: '507f1f77bcf86cd799439013'
 * });
 * // Throws ValidationError if any field is invalid
 */
async function validateGetShippingLabelData(data) {
  const errors = [];

  // Validate orderId
  if (!data.orderId) {
    errors.push('Order ID is required');
  } else if (!mongoose.Types.ObjectId.isValid(data.orderId)) {
    errors.push('Order ID must be a valid ObjectId');
  }

  // Validate itemId
  if (!data.itemId) {
    errors.push('Item ID is required');
  } else if (!mongoose.Types.ObjectId.isValid(data.itemId)) {
    errors.push('Item ID must be a valid ObjectId');
  }

  // Validate sellerId
  if (!data.sellerId) {
    errors.push('Seller ID is required');
  } else if (!mongoose.Types.ObjectId.isValid(data.sellerId)) {
    errors.push('Seller ID must be a valid ObjectId');
  }

  // If there are validation errors, throw a ValidationError
  if (errors.length > 0) {
    const ValidationError = require('../../../utils/errors/ValidationError');
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateGetShippingLabelData
};
