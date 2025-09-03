/**
 * Select Account Type Validator
 *
 * This validator handles input validation for account type selection.
 * It provides functionality to:
 * - Validate account type format and structure
 * - Ensure account type is provided and properly formatted
 * - Validate account type against allowed values
 * - Maintain consistent validation standards
 *
 * The validator ensures that account type selection requests are properly
 * formatted and contain valid account type values.
 *
 * @module selectAccountTypeValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate account type value.
 *
 * This function performs comprehensive account type validation for selection
 * requests, ensuring the account type is valid and allowed.
 *
 * Business Logic:
 * - Checks if accountType is provided (required parameter)
 * - Validates accountType format (string)
 * - Verifies that accountType is one of the allowed values
 * - Collects validation errors for reporting
 *
 * @param {string} accountType - The account type to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateAccountType("individual", errors); // Valid
 * validateAccountType("business", errors); // Valid
 * validateAccountType("invalid", errors); // Invalid, adds error
 * validateAccountType("", errors); // Invalid, adds error
 */
function validateAccountType(accountType, errors) {
  // Step 1: Check if accountType is provided (required parameter)
  if (!accountType) {
    errors.push({ field: 'accountType', message: 'Account type is required' });
    return;
  }

  // Step 2: Validate accountType format (string)
  if (typeof accountType !== 'string') {
    errors.push({ field: 'accountType', message: 'Account type must be a string' });
    return;
  }

  // Step 3: Convert to lowercase for consistent validation
  const lowerCaseAccountType = accountType.toLowerCase();

  // Step 4: Check if accountType is one of the allowed values
  const validAccountTypes = ['individual', 'business'];
  if (!validAccountTypes.includes(lowerCaseAccountType)) {
    errors.push({ 
      field: 'accountType', 
      message: 'Invalid account type. Must be either "individual" or "business"' 
    });
  }
}

/**
 * Validate all select account type data before processing.
 *
 * This function orchestrates the complete validation process for account
 * type selection requests, ensuring all requirements are met before proceeding.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate account type format and value
 * 3. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Account type validation prevents invalid account type selection
 * - String format validation ensures data integrity
 * - Allowed values validation maintains system consistency
 * - Error collection provides comprehensive feedback
 *
 * @param {Object} data - The request data containing accountType
 * @throws {ValidationError} If any validation fails (missing accountType, invalid format, or invalid value)
 * @example
 * // Valid request
 * validateSelectAccountTypeData({ accountType: "individual" });
 * validateSelectAccountTypeData({ accountType: "business" });
 * 
 * // Invalid request - will throw ValidationError
 * validateSelectAccountTypeData({ accountType: "invalid" });
 * validateSelectAccountTypeData({});
 */
function validateSelectAccountTypeData(data) {
  // Initialize error collection array
  const errors = [];

  // Check if data is provided and is an object
  if (!data || typeof data !== 'object') {
    errors.push({ field: 'data', message: 'Request data is required and must be an object' });
    throw new ValidationError(errors);
  }

  // Extract account type from request data
  const { accountType } = data;

  // Validate account type
  validateAccountType(accountType, errors);

  // If any validation errors exist, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateSelectAccountTypeData
};
