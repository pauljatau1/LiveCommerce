/**
 * Resend OTP Validator
 *
 * This validator handles input validation for OTP (One-Time Password) resend functionality.
 * It provides comprehensive validation for the complete OTP resend process, ensuring
 * data integrity, security, and proper email format validation.
 *
 * The validator ensures that:
 * - All input data is properly formatted and validated
 * - Email addresses are provided and valid
 * - Email format meets security requirements
 * - All validation errors are collected and reported together
 * - Security requirements are enforced
 *
 * Validation Features:
 * - Email presence and format validation
 * - Comprehensive email structure validation
 * - Support for various email formats
 * - Comprehensive error collection
 * - Security-focused validation
 *
 * Security Considerations:
 * - Validates all inputs before processing
 * - Ensures proper email format structure
 * - Maintains data integrity throughout validation
 * - Prevents information leakage through error messages
 * - Comprehensive email format validation
 *
 * Email Validation Strategy:
 * - Presence validation (required field)
 * - Type validation (string only)
 * - Format validation (@ symbol presence)
 * - Structure validation (local part and domain)
 * - Content validation (non-empty parts)
 *
 * @module resendOTPValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

// Error messages for consistent validation feedback
// This ensures uniform error messages across the application
const ERROR_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_MUST_BE_STRING: 'Email must be a string',
  EMAIL_INVALID_FORMAT: 'Email must be a valid email address'
};

/**
 * Validates that email is not empty.
 *
 * This function performs basic presence validation to ensure
 * the email field is provided before proceeding with format validation.
 *
 * Presence Requirements:
 * - Email must be provided (not null/undefined/empty)
 * - Basic required field validation
 * - Prevents processing of empty values
 *
 * Validation Checks:
 * - Required field validation
 * - Presence check for processing
 * - Basic format validation prerequisite
 *
 * @param {string} email - Email address to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateEmailPresence(email, errors) {
  if (!email) {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_REQUIRED });
  }
}

/**
 * Validates that email is a string type.
 *
 * This function ensures the email is of the correct data type
 * before proceeding with format validation. It prevents type-related
 * errors during processing.
 *
 * Type Requirements:
 * - Email must be a string type
 * - Prevents number or object type emails
 * - Ensures consistent data handling
 *
 * Validation Checks:
 * - Data type validation (string only)
 * - Type safety enforcement
 * - Format validation prerequisite
 *
 * @param {string} email - Email address to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateEmailType(email, errors) {
  if (email && typeof email !== 'string') {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_MUST_BE_STRING });
  }
}

/**
 * Validates email format structure comprehensively.
 *
 * This function performs detailed email format validation to ensure
 * the email address has the correct structure and format. It validates
 * both the overall structure and individual components.
 *
 * Format Requirements:
 * - Email must contain '@' symbol
 * - Email must have exactly two parts (local and domain)
 * - Both local and domain parts must be non-empty
 * - Proper email structure validation
 *
 * Validation Checks:
 * - '@' symbol presence validation
 * - Two-part structure validation
 * - Local part content validation
 * - Domain part content validation
 * - Comprehensive format verification
 *
 * Structure Validation:
 * - Splits email into local and domain parts
 * - Validates part count (exactly 2 parts)
 * - Checks for non-empty local part
 * - Checks for non-empty domain part
 * - Ensures proper email structure
 *
 * @param {string} email - Email address to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateEmailFormat(email, errors) {
  // Step 1: Check for '@' symbol presence
  // This ensures the email has the basic email structure
  if (!email.includes('@')) {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_INVALID_FORMAT });
    return;
  }
  
  // Step 2: Split email into parts and validate structure
  // This ensures the email has exactly two parts (local and domain)
  const parts = email.split('@');
  if (parts.length !== 2) {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_INVALID_FORMAT });
    return;
  }
  
  // Step 3: Validate individual parts
  // This ensures both local and domain parts are non-empty
  const [localPart, domain] = parts;
  if (!localPart || localPart.trim() === '') {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_INVALID_FORMAT });
  }
  if (!domain || domain.trim() === '') {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_INVALID_FORMAT });
  }
  
  // Step 4: Check for whitespace in parts
  // This ensures no whitespace in local or domain parts
  if (localPart && localPart.includes(' ')) {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_INVALID_FORMAT });
  }
  if (domain && domain.includes(' ')) {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_INVALID_FORMAT });
  }
}

/**
 * Validates email field comprehensively.
 *
 * This function orchestrates all email validation steps to ensure
 * comprehensive validation of the email field. It performs validation
 * in a logical order to provide efficient and thorough validation.
 *
 * Validation Process:
 * 1. Validates email presence (required field)
 * 2. Validates email type (string only)
 * 3. Validates email format (structure and content)
 *
 * Validation Strategy:
 * - Performs presence validation first (fast, no processing)
 * - Validates type for data consistency
 * - Performs format validation only if type is correct
 * - Collects all errors for comprehensive feedback
 *
 * Error Collection:
 * - Collects all validation errors in a single array
 * - Provides comprehensive feedback to users
 * - Maintains validation efficiency
 * - Ensures thorough validation coverage
 *
 * @param {string} email - Email address to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateEmail(email, errors) {
  // Step 1: Check email presence
  // This ensures the email is provided before proceeding
  validateEmailPresence(email, errors);
  
  // Step 2: Check email type
  // This ensures the email is a string before format validation
  validateEmailType(email, errors);
  
  // Step 3: Check email format (only if email is a string)
  // This performs detailed format validation for valid string emails
  if (email && typeof email === 'string') {
    validateEmailFormat(email, errors);
  }
}

/**
 * Validates resendOTP data - Main validation function.
 *
 * This is the primary validation function that orchestrates all validation steps
 * for OTP resend functionality. It ensures comprehensive validation before allowing
 * the resend process to proceed.
 *
 * Validation Process:
 * 1. Validates input data structure and presence
 * 2. Validates email field requirements
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
 * - Email format validation
 * - Type safety enforcement
 * - Clear error reporting
 * - Consistent validation approach
 *
 * @param {Object} data - OTP resend data object to validate
 * @param {string} data.email - The email address to validate
 * @throws {ValidationError} If any validation fails (contains all validation errors)
 *
 * @example
 * // Valid resend OTP data
 * await validateResendOTPData({
 *   email: 'user@example.com'
 * });
 * // No error thrown
 *
 * @example
 * // Invalid resend OTP data - missing email
 * await validateResendOTPData({});
 * // Throws: ValidationError with errors array containing validation details
 *
 * @example
 * // Invalid resend OTP data - invalid email format
 * await validateResendOTPData({
 *   email: 'invalid-email'
 * });
 * // Throws: ValidationError with errors array containing validation details
 */
async function validateResendOTPData(data) {
  const errors = [];

  // Step 1: Validate input data structure
  // This ensures the data object is provided and properly structured
  if (!data || data === null || data === undefined) {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_REQUIRED });
  } else {
    // Step 2: Validate email field
    // This ensures the email meets all validation requirements
    validateEmail(data.email, errors);
  }

  // Step 3: Throw ValidationError if any validation failed
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateResendOTPData,
};
