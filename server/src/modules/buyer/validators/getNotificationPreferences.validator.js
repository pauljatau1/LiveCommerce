/**
 * Get Notification Preferences Validator
 *
 * This validator handles input validation for retrieving a buyer's notification preferences.
 * It provides functionality to:
 * - Validate buyer ID format and structure
 * - Ensure buyer ID is provided and properly formatted
 * - Prevent unauthorized access to notification preferences
 * - Maintain consistent validation standards
 * - Handle edge cases and data validation
 *
 * The validator ensures that notification preference retrieval requests are properly
 * authenticated and formatted to prevent unauthorized access to user preferences.
 *
 * @module getNotificationPreferencesValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate buyer ID for notification preferences retrieval.
 *
 * This function validates the buyer ID to ensure it's properly formatted and
 * provided for notification preferences retrieval requests.
 *
 * Business Logic:
 * - Checks if buyer ID is provided (required parameter)
 * - Validates parameter type and format
 * - Ensures buyer ID is not empty or whitespace
 * - Prevents unauthorized access attempts
 * - Collects validation errors for reporting
 *
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateBuyerId("507f1f77bcf86cd799439011", errors); // Valid
 * validateBuyerId("", errors); // Invalid, adds error
 * validateBuyerId(null, errors); // Invalid, adds error
 */
function validateBuyerId(buyerId, errors) {
  // Check if buyer ID is provided (required parameter)
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (typeof buyerId !== 'string') {
    // Validate parameter type
    errors.push({ field: 'buyerId', message: 'Buyer ID must be a string' });
  } else if (buyerId.trim() === '') {
    // Ensure buyer ID is not empty or whitespace
    errors.push({ field: 'buyerId', message: 'Buyer ID cannot be empty' });
  }
}

/**
 * Validate get notification preferences data.
 *
 * This function orchestrates the complete validation process for notification
 * preferences retrieval requests, ensuring the buyer ID meets all requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate buyer ID format and structure
 * 3. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Buyer ID validation prevents unauthorized access
 * - Type validation ensures data integrity
 * - Empty string validation prevents invalid requests
 * - Error collection provides comprehensive feedback
 *
 * @param {string} buyerId - The buyer ID to validate
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid request
 * await validateGetNotificationPreferencesData("507f1f77bcf86cd799439011");
 * 
 * // Invalid request - will throw ValidationError
 * await validateGetNotificationPreferencesData("");
 */
async function validateGetNotificationPreferencesData(buyerId) {
  // Initialize error collection array
  const errors = [];

  // Validate buyer ID format and structure
  validateBuyerId(buyerId, errors);

  // If any validation errors were found, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateBuyerId,
  validateGetNotificationPreferencesData
}; 