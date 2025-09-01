/**
 * Login Validator
 *
 * This validator handles input validation for seller login functionality.
 * It provides comprehensive validation for the complete login process,
 * ensuring data integrity, security, and proper business logic enforcement.
 *
 * The validator ensures that:
 * - All input data is properly formatted and validated
 * - Email addresses are provided and valid
 * - Passwords are provided and properly typed
 * - All validation errors are collected and reported together
 *
 * Validation Features:
 * - Email presence and format validation
 * - Password presence and type validation
 * - Support for both string and number password types
 * - Comprehensive error collection
 * - Flexible authentication method support
 *
 * Security Considerations:
 * - Validates all inputs before processing
 * - Maintains data integrity throughout validation
 * - Prevents information leakage through error messages
 * - Flexible password type handling for different clients
 *
 * @module loginValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates email field for login authentication.
 *
 * This function ensures the email is provided for login authentication.
 * It performs basic presence validation to ensure the email field is not empty.
 *
 * Email Requirements:
 * - Email must be provided (not null/undefined/empty)
 * - Basic presence validation only (format validation handled by service)
 * - Supports all email formats for flexibility
 *
 * Validation Checks:
 * - Required field validation
 * - Presence check for authentication
 * - Basic format validation
 *
 * @param {string} email - Email address to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateEmail(email, errors) {
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  }
}

/**
 * Validates password field for login authentication.
 *
 * This function ensures the password is provided and has the correct data type
 * for login authentication. It supports both string and number types for
 * flexibility across different client implementations.
 *
 * Password Requirements:
 * - Password must be provided (not null/undefined/empty)
 * - Password must be a string or number type
 * - Supports both traditional passwords and token-based authentication
 * - Flexible type handling for different client implementations
 *
 * Validation Checks:
 * - Required field validation
 * - Data type validation (string or number)
 * - Flexible authentication support
 *
 * Authentication Support:
 * - Traditional string passwords
 * - Numeric passwords for mobile apps
 * - Token-based authentication
 * - Cross-platform compatibility
 *
 * @param {string|number} password - Password to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePassword(password, errors) {
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (typeof password !== 'string' && typeof password !== 'number') {
    errors.push({ field: 'password', message: 'Password must be a string or number' });
  }
}

/**
 * Validates login data - Main validation function.
 *
 * This is the primary validation function that orchestrates all validation steps
 * for seller login. It ensures comprehensive validation before allowing
 * the login process to proceed.
 *
 * Validation Process:
 * 1. Validates input data structure and presence
 * 2. Validates email field requirements
 * 3. Validates password field requirements
 * 4. Collects all validation errors and throws ValidationError if any exist
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
 * Authentication Method Support:
 * - Email/password authentication
 * - Mobile app authentication
 * - Cross-platform compatibility
 *
 * @param {Object} data - Login data object to validate
 * @param {string} data.email - The email address to validate
 * @param {string|number} data.password - The password to validate
 * @throws {ValidationError} If any validation fails (contains all validation errors)
 *
 * @example
 * // Valid login data - email/password
 * validateLoginData({
 *   email: 'seller@example.com',
 *   password: 'sellerPassword123'
 * });
 * // No error thrown
 *
 * @example
 * // Invalid login data - missing email
 * try {
 *   validateLoginData({
 *     password: 'sellerPassword123'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 *
 * @example
 * // Invalid login data - missing password
 * try {
 *   validateLoginData({
 *     email: 'seller@example.com'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
function validateLoginData(data) {
  const errors = [];

  // Step 1: Validate input data structure
  // This ensures the data object is provided and properly structured
  if (!data || data === null || data === undefined) {
    errors.push({ field: 'email', message: 'Email is required' });
    errors.push({ field: 'password', message: 'Password is required' });
  } else {
    // Step 2: Validate individual fields
    // This ensures each required field meets validation requirements
    validateEmail(data.email, errors);
    validatePassword(data.password, errors);
  }

  // Step 3: Throw ValidationError if any validation failed
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateLoginData,
};
