/**
 * Get Activity Status Validator
 *
 * This validator handles input validation for activity status retrieval functionality.
 * It provides comprehensive validation for the complete activity status retrieval
 * process, ensuring data integrity and security.
 *
 * The validator ensures that:
 * - All input data is properly formatted and validated
 * - Buyer IDs are provided and valid
 * - Buyer ID format meets MongoDB ObjectId requirements
 * - All validation errors are collected and reported together
 * - Security requirements are enforced
 *
 * Validation Features:
 * - Buyer ID presence and format validation
 * - MongoDB ObjectId format validation
 * - Comprehensive error collection
 * - Security-focused validation
 *
 * Security Considerations:
 * - Validates all inputs before processing
 * - Ensures proper ObjectId format
 * - Maintains data integrity throughout validation
 * - Prevents information leakage through error messages
 * - Flexible buyer ID handling for different clients
 *
 * Buyer ID Validation Strategy:
 * - Presence validation (required field)
 * - Type validation (string only)
 * - Format validation (MongoDB ObjectId)
 * - Structure validation (24-character hexadecimal)
 * - Content validation (valid ObjectId format)
 *
 * @module getActivityStatusValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates buyer ID format and structure for activity status retrieval.
 *
 * This function ensures the buyer ID is provided and has the correct format
 * for MongoDB ObjectId validation. It performs comprehensive buyer ID validation
 * to ensure data integrity and security.
 *
 * Buyer ID Requirements:
 * - Buyer ID must be provided (not null/undefined/empty)
 * - Buyer ID must be a string type
 * - Buyer ID must be a valid MongoDB ObjectId format
 * - Buyer ID must be a 24-character hexadecimal string
 * - Buyer ID must meet ObjectId validation criteria
 *
 * Validation Checks:
 * - Required field validation
 * - Data type validation (string only)
 * - ObjectId format validation using regex
 * - MongoDB ObjectId structure validation
 * - Database compatibility validation
 *
 * Security Features:
 * - Input sanitization through type checking
 * - ObjectId format validation to prevent injection
 * - Clear error messages for users
 * - Consistent validation approach
 * - MongoDB ObjectId validation for security
 *
 * ObjectId Validation:
 * - Uses regex pattern for 24-character hexadecimal validation
 * - Ensures proper ObjectId format (0-9, a-f, A-F)
 * - Validates MongoDB ObjectId structure
 * - Prevents invalid ObjectId usage
 * - Maintains database compatibility
 *
 * @param {string} buyerId - Buyer ID to validate
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

  // Step 1: Check if it's a valid ObjectId format
  // This regex ensures proper MongoDB ObjectId format:
  // - Exactly 24 characters long
  // - Contains only hexadecimal characters (0-9, a-f, A-F)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(buyerId)) {
    errors.push({
      field: 'buyerId',
      message: 'Invalid buyer ID format'
    });
  }
}

/**
 * Validates get activity status data - Main validation function.
 *
 * This is the primary validation function that orchestrates all validation steps
 * for activity status retrieval. It ensures comprehensive validation before allowing
 * the activity status retrieval process to proceed.
 *
 * Validation Process:
 * 1. Validates input data structure and presence
 * 2. Validates buyer ID requirements and format
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
 * - Buyer ID format validation
 * - MongoDB ObjectId validation
 * - Type safety enforcement
 * - Clear error reporting
 *
 * Activity Status Context:
 * - Since getActivityStatus doesn't require body parameters
 * - Only validates buyer ID from authenticated user
 * - Ensures secure access to activity status
 * - Maintains data privacy and security
 *
 * @param {Object} data - Activity status request data object to validate
 * @param {string} data.buyerId - The buyer ID to validate
 * @throws {ValidationError} If any validation fails (contains all validation errors)
 *
 * @example
 * // Valid activity status request data
 * await validateGetActivityStatusData({
 *   buyerId: '507f1f77bcf86cd799439011'
 * });
 * // No error thrown
 *
 * @example
 * // Invalid activity status request data - missing buyer ID
 * try {
 *   await validateGetActivityStatusData({});
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 *
 * @example
 * // Invalid activity status request data - invalid buyer ID format
 * try {
 *   await validateGetActivityStatusData({
 *     buyerId: 'invalid-buyer-id'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function validateGetActivityStatusData(data) {
  const errors = [];

  // Step 1: Validate buyer ID format and requirements
  // This ensures the buyer ID meets all validation criteria
  validateBuyerId(data.buyerId, errors);

  // Step 2: Throw ValidationError if any validation failed
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateGetActivityStatusData,
  validateBuyerId
};
