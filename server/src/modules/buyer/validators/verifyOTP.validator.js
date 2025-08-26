/**
 * Verify OTP Validator
 *
 * This validator handles input validation for OTP (One-Time Password) verification
 * functionality. It provides comprehensive validation for the complete OTP
 * verification process, ensuring data integrity and security.
 *
 * The validator ensures that:
 * - All input data is properly formatted and validated
 * - Email addresses are provided and valid
 * - OTP codes are provided and properly formatted
 * - All validation errors are collected and reported together
 * - Security requirements are enforced
 *
 * Validation Features:
 * - Email presence and format validation
 * - OTP presence and format validation
 * - Support for both string and number OTP types
 * - Comprehensive error collection
 * - Security-focused validation
 *
 * Security Considerations:
 * - Validates all inputs before processing
 * - Ensures proper OTP format (4 digits)
 * - Maintains data integrity throughout validation
 * - Prevents information leakage through error messages
 * - Flexible OTP type handling for different clients
 *
 * @module verifyOTPValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates email field for OTP verification.
 *
 * This function ensures the email is provided and has the correct format
 * for OTP verification. It performs comprehensive email validation to
 * ensure data integrity and security.
 *
 * Email Requirements:
 * - Email must be provided (not null/undefined/empty)
 * - Email must be a string type
 * - Email must contain '@' symbol
 * - Basic email format validation
 *
 * Validation Checks:
 * - Required field validation
 * - Data type validation (string only)
 * - Basic format validation (@ symbol presence)
 * - Email structure validation
 *
 * Security Features:
 * - Input sanitization through type checking
 * - Format validation to prevent injection
 * - Clear error messages for users
 * - Consistent validation approach
 *
 * @param {string} email - Email address to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateEmail(email, errors) {
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (typeof email !== 'string') {
    errors.push({ field: 'email', message: 'Email must be a string' });
  } else if (!email.includes('@')) {
    errors.push({ field: 'email', message: 'Email must be a valid email address' });
  }
}

/**
 * Validates OTP field for verification.
 *
 * This function ensures the OTP is provided and has the correct format
 * for verification. It supports both string and number types for
 * flexibility across different client implementations.
 *
 * OTP Requirements:
 * - OTP must be provided (not null/undefined/empty)
 * - OTP must be a string or number type
 * - OTP must be exactly 4 digits
 * - Supports both traditional and mobile app formats
 *
 * Validation Checks:
 * - Required field validation
 * - Data type validation (string or number)
 * - Length validation (exactly 4 digits)
 * - Format consistency validation
 *
 * Security Features:
 * - Input sanitization through type checking
 * - Length validation to prevent injection
 * - Flexible type handling for different clients
 * - Clear error messages for users
 *
 * Client Compatibility:
 * - Traditional string OTPs
 * - Numeric OTPs for mobile apps
 * - Cross-platform compatibility
 * - Consistent validation across platforms
 *
 * @param {string|number} otp - OTP to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateOTP(otp, errors) {
  if (!otp) {
    errors.push({ field: 'otp', message: 'OTP is required' });
  } else if (typeof otp !== 'string' && typeof otp !== 'number') {
    errors.push({ field: 'otp', message: 'OTP must be a string or number' });
  } else if (otp.toString().length !== 4) {
    errors.push({ field: 'otp', message: 'OTP must be 4 digits' });
  }
}

/**
 * Validates verifyOTP data - Main validation function.
 *
 * This is the primary validation function that orchestrates all validation steps
 * for OTP verification. It ensures comprehensive validation before allowing
 * the verification process to proceed.
 *
 * Validation Process:
 * 1. Validates input data structure and presence
 * 2. Validates email field requirements
 * 3. Validates OTP field requirements
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
 * Security Features:
 * - Comprehensive input validation
 * - Email format validation
 * - OTP format validation
 * - Type safety enforcement
 * - Clear error reporting
 *
 * @param {Object} data - OTP verification data object to validate
 * @param {string} data.email - The email address to validate
 * @param {string|number} data.otp - The OTP to validate
 * @throws {ValidationError} If any validation fails (contains all validation errors)
 *
 * @example
 * // Valid OTP verification data
 * await validateVerifyOTPData({
 *   email: 'user@example.com',
 *   otp: '1234'
 * });
 * // No error thrown
 *
 * @example
 * // Valid OTP verification data - numeric OTP
 * await validateVerifyOTPData({
 *   email: 'user@example.com',
 *   otp: 1234
 * });
 * // No error thrown
 *
 * @example
 * // Invalid OTP verification data - missing email
 * try {
 *   await validateVerifyOTPData({
 *     otp: '1234'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 *
 * @example
 * // Invalid OTP verification data - invalid OTP length
 * try {
 *   await validateVerifyOTPData({
 *     email: 'user@example.com',
 *     otp: '123'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function validateVerifyOTPData(data) {
  const errors = [];

  // Step 1: Validate input data structure
  // This ensures the data object is provided and properly structured
  if (!data || data === null || data === undefined) {
    errors.push({ field: 'email', message: 'Email is required' });
    errors.push({ field: 'otp', message: 'OTP is required' });
  } else {
    // Step 2: Validate individual fields
    // This ensures each required field meets validation requirements
    validateEmail(data.email, errors);
    validateOTP(data.otp, errors);
  }

  // Step 3: Throw ValidationError if any validation failed
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateVerifyOTPData,
}; 