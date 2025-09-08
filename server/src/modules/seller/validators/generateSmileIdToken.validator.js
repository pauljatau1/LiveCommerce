/**
 * Generate SmileID Token Validator
 *
 * This validator handles input validation for SmileID token generation operations.
 * It provides functionality to:
 * - Validate required fields (accountType, idType)
 * - Validate account type values (individual, business)
 * - Validate ID type based on account type
 * - Ensure data integrity and security standards
 * - Maintain consistent validation patterns
 *
 * The validator ensures that SmileID token generation requests are properly formatted
 * and contain valid data to prevent security vulnerabilities and maintain
 * data integrity in the seller verification process.
 *
 * @module generateSmileIdTokenValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate the account type field.
 *
 * This function validates the account type field to ensure it meets
 * requirements for SmileID token generation.
 *
 * Business Logic:
 * - Checks if account type is provided (required field)
 * - Validates account type against allowed values (individual, business)
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - Required field validation prevents null account types
 * - Enum validation ensures only valid account types are accepted
 * - Error collection provides clear feedback
 *
 * @param {string} accountType - The account type to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * await validateAccountType("individual", errors); // Valid
 * await validateAccountType("invalid", errors); // Invalid, adds error
 * await validateAccountType("", errors); // Invalid, adds error
 */
function validateAccountType(accountType, errors) {
  // Step 1: Check if account type is provided (required field validation)
  // This ensures the account type field is not empty or null
  if (!accountType) {
    errors.push({ field: 'accountType', message: 'Account type is required' });
  } else {
    // Step 2: Validate account type against allowed values
    // This ensures only valid account types are accepted for SmileID integration
    const validAccountTypes = ['individual', 'business'];
    if (!validAccountTypes.includes(accountType)) {
      errors.push({ 
        field: 'accountType', 
        message: 'Account type must be either "individual" or "business"' 
      });
    }
  }
}

/**
 * Validate the ID type field based on account type.
 *
 * This function validates the ID type field to ensure it is compatible
 * with the selected account type for SmileID verification.
 *
 * Business Logic:
 * - Checks if ID type is provided (required field)
 * - Validates ID type based on account type (individual vs business)
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - Required field validation prevents null ID types
 * - Account type specific validation ensures proper verification flow
 * - Error collection provides clear feedback
 *
 * @param {string} idType - The ID type to validate
 * @param {string} accountType - The account type to validate against
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * await validateIdType("NIN_SLIP", "individual", errors); // Valid
 * await validateIdType("BN", "business", errors); // Valid
 * await validateIdType("NIN_SLIP", "business", errors); // Invalid, adds error
 * await validateIdType("", "individual", errors); // Invalid, adds error
 */
function validateIdType(idType, accountType, errors) {
  // Step 1: Check if ID type is provided (required field validation)
  // This ensures the ID type field is not empty or null
  if (!idType) {
    errors.push({ field: 'idType', message: 'ID type is required' });
  } else {
    // Step 2: Validate ID type based on account type
    // This ensures the ID type is compatible with the selected account type
    let validIdTypes;
    if (accountType === 'individual') {
      validIdTypes = ['NIN_SLIP', 'BVN', 'V_NIN', 'PHONE_NUMBER'];
    } else if (accountType === 'business') {
      validIdTypes = ['BN', 'CO', 'IT'];
    } else {
      // If account type is invalid, skip ID type validation
      return;
    }

    if (!validIdTypes.includes(idType)) {
      errors.push({ 
        field: 'idType', 
        message: `Invalid ID type for ${accountType} account. Valid types: ${validIdTypes.join(', ')}` 
      });
    }
  }
}

/**
 * Validate the userId field (optional).
 *
 * This function validates the optional userId field to ensure it meets
 * format requirements if provided.
 *
 * Business Logic:
 * - Validates userId format if provided (optional field)
 * - Checks for reasonable length constraints
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - Length validation prevents oversized data
 * - Format validation ensures proper user identification
 * - Error collection provides clear feedback
 *
 * @param {string} userId - The user ID to validate (optional)
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * await validateUserId("user123", errors); // Valid
 * await validateUserId("", errors); // Valid (optional field)
 * await validateUserId(null, errors); // Valid (optional field)
 */
function validateUserId(userId, errors) {
  // Step 1: Check if userId is provided and validate format
  // This ensures the userId meets format requirements if provided
  if (userId && userId.length > 100) {
    errors.push({ 
      field: 'userId', 
      message: 'User ID must not exceed 100 characters' 
    });
  }
}

/**
 * Validate all SmileID token generation data.
 *
 * This function orchestrates the complete validation process for SmileID
 * token generation, ensuring all required fields meet validation requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate account type (required, enum validation)
 * 3. Validate ID type (required, account type specific)
 * 4. Validate user ID (optional, format validation)
 * 5. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Comprehensive field validation prevents data corruption
 * - Account type specific validation ensures proper verification flow
 * - Format validation ensures data consistency
 * - Error collection provides comprehensive feedback
 *
 * @param {Object} data - SmileID token generation data to validate
 * @param {string} data.accountType - The account type to validate
 * @param {string} data.idType - The ID type to validate
 * @param {string} [data.userId] - The optional user ID to validate
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid token generation data
 * await validateGenerateSmileIdTokenData({
 *   accountType: "individual",
 *   idType: "NIN_SLIP",
 *   userId: "user123"
 * });
 *
 * // Invalid token generation data - will throw ValidationError
 * await validateGenerateSmileIdTokenData({
 *   accountType: "invalid",
 *   idType: "NIN_SLIP"
 * });
 */
function validateGenerateSmileIdTokenData(data) {
  // Step 1: Initialize error collection array
  // This will collect all validation errors for comprehensive reporting
  const errors = [];

  // Step 2: Validate account type (required, enum validation)
  // This ensures the account type meets all security and format requirements
  validateAccountType(data.accountType, errors);

  // Step 3: Validate ID type (required, account type specific)
  // This ensures the ID type is compatible with the selected account type
  validateIdType(data.idType, data.accountType, errors);

  // Step 4: Validate user ID (optional, format validation)
  // This ensures the user ID meets format requirements if provided
  validateUserId(data.userId, errors);

  // Step 5: Throw ValidationError if any validation fails
  // This provides comprehensive error feedback to the caller
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateGenerateSmileIdTokenData,
};
