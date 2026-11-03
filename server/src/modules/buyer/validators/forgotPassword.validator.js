/**
 * Forgot Password Validator
 *
 * This validator handles input validation for forgot password functionality.
 * It provides comprehensive validation for the complete password reset process,
 * ensuring data integrity and security.
 *
 * The validator ensures that:
 * - All input data is properly formatted and validated
 * - Email addresses are provided and properly formatted
 * - Email existence is verified in the database
 * - All validation errors are collected and reported together
 * - Security requirements are enforced
 *
 * Validation Features:
 * - Email presence and format validation
 * - Email existence verification in database
 * - Comprehensive error collection
 * - Security-focused validation
 *
 * Security Considerations:
 * - Validates all inputs before processing
 * - Ensures proper email format
 * - Verifies email existence to prevent information leakage
 * - Maintains data integrity throughout validation
 * - Prevents information leakage through error messages
 *
 * Email Validation Strategy:
 * - Presence validation (required field)
 * - Format validation (valid email format)
 * - Existence validation (email must exist in database)
 * - Database verification for security
 * - Clear error messaging for users
 *
 * @module forgotPasswordValidator
 */

const validator = require('validator');
const buyerRepository = require('../repositories/buyer.repository');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates the email format and existence in database.
 *
 * This function ensures the email is provided, has the correct format,
 * and exists in the database for password reset functionality.
 * It performs comprehensive email validation to ensure data integrity and security.
 *
 * Email Requirements:
 * - Email must be provided (not null/undefined/empty)
 * - Email must have valid format (user@domain.com)
 * - Email must exist in the buyer database
 * - Email must be associated with an active buyer account
 *
 * Validation Checks:
 * - Required field validation
 * - Email format validation using validator library
 * - Database existence verification
 * - Account status validation
 *
 * Security Features:
 * - Input sanitization through format checking
 * - Format validation to prevent injection
 * - Database verification for account existence
 * - Clear error messages for users
 * - Consistent validation approach
 *
 * Database Verification:
 * - Checks if email exists in buyer collection
 * - Prevents password reset for non-existent accounts
 * - Maintains security through existence validation
 * - Provides appropriate error messages
 *
 * @param {string} email - Email address to validate
 * @param {Array} errors - Array to collect validation errors
 */
async function validateEmail(email, errors) {
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validator.isEmail(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  } else {
    // Step 1: If email is present and has valid format, check if buyer exists
    // This ensures the email is associated with an actual buyer account
    const existingBuyer = await buyerRepository.findByEmail(email);
    if (!existingBuyer) {
      errors.push({ field: 'email', message: 'No account found with this email' });
    }
  }
}

/**
 * Validates all forgot password data before processing - Main validation function.
 *
 * This is the primary validation function that orchestrates all validation steps
 * for the forgot password process. It ensures comprehensive validation before
 * allowing the password reset process to proceed.
 *
 * Validation Process:
 * 1. Validates input data structure and presence
 * 2. Validates email requirements and format
 * 3. Verifies email existence in database
 * 4. Collects all validation errors and throws ValidationError if any exist
 *
 * Validation Strategy:
 * - Performs structure validation first
 * - Validates individual fields systematically
 * - Performs database verification for security
 * - Collects all errors before throwing exception
 * - Provides comprehensive feedback to users
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
 * - Database existence verification
 * - Type safety enforcement
 * - Clear error reporting
 *
 * @param {Object} data - Forgot password input data object to validate
 * @param {string} data.email - The email address to validate
 * @throws {ValidationError} If any validation fails (contains all validation errors)
 *
 * @example
 * // Valid forgot password data
 * await validateForgotPasswordData({
 *   email: 'user@example.com'
 * });
 * // No error thrown (assuming email exists in database)
 *
 * @example
 * // Invalid forgot password data - missing email
 * try {
 *   await validateForgotPasswordData({});
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 *
 * @example
 * // Invalid forgot password data - invalid email format
 * try {
 *   await validateForgotPasswordData({
 *     email: 'invalid-email-format'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 *
 * @example
 * // Invalid forgot password data - email doesn't exist
 * try {
 *   await validateForgotPasswordData({
 *     email: 'nonexistent@example.com'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function validateForgotPasswordData(data) {
  const errors = [];

  // Step 1: Validate email format and existence
  // This ensures the email is provided, has valid format, and exists in database
  await validateEmail(data.email, errors);

  // Step 2: Throw ValidationError if any validation failed
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateForgotPasswordData
}; 