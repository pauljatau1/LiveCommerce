/**
 * Get Order Details Validator
 *
 * This validator handles input validation for order details retrieval functionality.
 * It provides comprehensive validation for the complete order details retrieval
 * process, ensuring data integrity and security.
 *
 * The validator ensures that:
 * - All input data is properly formatted and validated
 * - Order IDs are provided and valid
 * - Order ID format meets MongoDB ObjectId requirements
 * - All validation errors are collected and reported together
 * - Security requirements are enforced
 *
 * Validation Features:
 * - Order ID presence and format validation
 * - MongoDB ObjectId format validation
 * - Comprehensive error collection
 * - Security-focused validation
 *
 * Security Considerations:
 * - Validates all inputs before processing
 * - Ensures proper ObjectId format
 * - Maintains data integrity throughout validation
 * - Prevents information leakage through error messages
 * - Flexible order ID handling for different clients
 *
 * Order ID Validation Strategy:
 * - Presence validation (required field)
 * - Type validation (string only)
 * - Format validation (MongoDB ObjectId)
 * - Structure validation (24-character hexadecimal)
 * - Content validation (valid ObjectId format)
 *
 * @module getOrderDetailsValidator
 */

const mongoose = require('mongoose');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates the order ID parameter for order details retrieval.
 *
 * This function ensures the order ID is provided and has the correct format
 * for MongoDB ObjectId validation. It performs comprehensive order ID validation
 * to ensure data integrity and security.
 *
 * Order ID Requirements:
 * - Order ID must be provided (not null/undefined/empty)
 * - Order ID must be a string type
 * - Order ID must not be empty after trimming
 * - Order ID must be a valid MongoDB ObjectId format
 * - Order ID must be a 24-character hexadecimal string
 *
 * Validation Checks:
 * - Required field validation
 * - Data type validation (string only)
 * - Empty string validation after trimming
 * - ObjectId format validation using mongoose
 * - Structure validation for MongoDB compatibility
 *
 * Security Features:
 * - Input sanitization through type checking
 * - Format validation to prevent injection
 * - Clear error messages for users
 * - Consistent validation approach
 * - MongoDB ObjectId validation for security
 *
 * ObjectId Validation:
 * - Uses mongoose.Types.ObjectId.isValid for validation
 * - Ensures proper 24-character hexadecimal format
 * - Validates MongoDB ObjectId structure
 * - Prevents invalid ObjectId usage
 * - Maintains database compatibility
 *
 * @param {string} orderId - Order ID to validate
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
 * Validates the order ID parameter for getOrderDetails - Main validation function.
 *
 * This is the primary validation function that orchestrates all validation steps
 * for order details retrieval. It ensures comprehensive validation before allowing
 * the order details retrieval process to proceed.
 *
 * Validation Process:
 * 1. Validates input data structure and presence
 * 2. Validates order ID requirements and format
 * 3. Collects all validation errors and throws ValidationError if any exist
 *
 * Validation Strategy:
 * - Performs structure validation first
 * - Validates individual fields systematically
 * - Collects all errors before throwing exception
 * - Provides comprehensive feedback to users
 * - Maintains validation efficiency
 *
 * Error Handling:
 * - Collects all validation errors in a single array
 * - Throws ValidationError with all errors at once
 * - Provides comprehensive feedback to users
 * - Maintains validation efficiency
 *
 * Security Features:
 * - Comprehensive input validation
 * - Order ID format validation
 * - MongoDB ObjectId validation
 * - Type safety enforcement
 * - Clear error reporting
 *
 * @param {Object} data - Order details request parameters object to validate
 * @param {string} data.id - The order ID to validate
 * @throws {ValidationError} If any validation fails (contains all validation errors)
 *
 * @example
 * // Valid order details request data
 * await validateGetOrderDetailsData({
 *   id: '507f1f77bcf86cd799439011'
 * });
 * // No error thrown
 *
 * @example
 * // Invalid order details request data - missing order ID
 * try {
 *   await validateGetOrderDetailsData({});
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 *
 * @example
 * // Invalid order details request data - invalid order ID format
 * try {
 *   await validateGetOrderDetailsData({
 *     id: 'invalid-order-id'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function validateGetOrderDetailsData(data) {
  const errors = [];

  // Step 1: Validate input data structure
  // This ensures the data object is provided and properly structured
  if (!data || data === null || data === undefined) {
    errors.push({ field: 'id', message: 'Order ID is required' });
  } else {
    // Step 2: Validate order ID format and requirements
    // This ensures the order ID meets all validation criteria
    validateOrderId(data.id, errors);
  }

  // Step 3: Throw ValidationError if any validation failed
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateGetOrderDetailsData
}; 