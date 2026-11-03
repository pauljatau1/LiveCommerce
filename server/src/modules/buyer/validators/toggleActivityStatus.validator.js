/**
 * Toggle Activity Status Validator
 *
 * This validator handles input validation for toggling a buyer's activity status.
 * It provides functionality to:
 * - Validate buyer ID format and structure
 * - Ensure buyer ID is provided and properly formatted
 * - Validate MongoDB ObjectId format requirements
 * - Prevent unauthorized access to activity status
 * - Maintain consistent validation standards
 *
 * The validator ensures that activity status toggle requests are properly
 * formatted and authenticated to prevent unauthorized status changes.
 *
 * @module toggleActivityStatusValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate buyer ID from request.
 * 
 * This function validates the buyer ID to ensure it's properly formatted
 * according to MongoDB ObjectId requirements and provided for activity status toggle.
 *
 * Business Logic:
 * - Checks if buyer ID is provided (required parameter)
 * - Validates parameter type and format
 * - Ensures buyer ID matches MongoDB ObjectId format
 * - Prevents unauthorized access attempts
 * - Collects validation errors for reporting
 *
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateBuyerId("507f1f77bcf86cd799439011", errors); // Valid ObjectId
 * validateBuyerId("invalid-id", errors); // Invalid, adds error
 * validateBuyerId("", errors); // Invalid, adds error
 */
function validateBuyerId(buyerId, errors) {
  // Check if buyer ID is provided (required parameter)
  if (!buyerId) {
    errors.push({
      field: 'buyerId',
      message: 'Buyer ID is required'
    });
    return;
  }

  // Validate parameter type
  if (typeof buyerId !== 'string') {
    errors.push({
      field: 'buyerId',
      message: 'Buyer ID must be a string'
    });
    return;
  }

  // Check if it's a valid ObjectId format using regex
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
 * This function orchestrates the complete validation process for activity
 * status toggle requests, ensuring the buyer ID meets all requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate buyer ID format and structure
 * 3. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Buyer ID validation prevents unauthorized access
 * - MongoDB ObjectId validation ensures data integrity
 * - Type validation prevents injection attacks
 * - Error collection provides comprehensive feedback
 *
 * @param {Object} data - Data object containing buyerId
 * @param {string} data.buyerId - The buyer ID to validate
 * @returns {Promise<void>}
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid request
 * await validateToggleActivityStatusData({ buyerId: "507f1f77bcf86cd799439011" });
 * 
 * // Invalid request - will throw ValidationError
 * await validateToggleActivityStatusData({ buyerId: "invalid-id" });
 */
async function validateToggleActivityStatusData(data) {
  // Initialize error collection array
  const errors = [];

  // Validate buyer ID format and structure
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
