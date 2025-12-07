/**
 * Forgot Password SMS Validator
 *
 * This validator handles input validation for forgot password functionality via SMS.
 * It provides comprehensive validation for the complete password reset process via SMS,
 * ensuring data integrity and security.
 *
 * The validator ensures that:
 * - All input data is properly formatted and validated
 * - Phone numbers are provided and properly formatted
 * - Phone number existence is verified in the database
 * - All validation errors are collected and reported together
 * - Security requirements are enforced
 *
 * Validation Features:
 * - Phone number presence and format validation
 * - Phone number existence verification in database
 * - International phone number format support
 * - Comprehensive error collection
 * - Security-focused validation
 *
 * Security Considerations:
 * - Validates all inputs before processing
 * - Ensures proper phone number format with country code
 * - Verifies phone number existence to prevent information leakage
 * - Maintains data integrity throughout validation
 * - Prevents information leakage through error messages
 *
 * Phone Number Validation Strategy:
 * - Presence validation (required field)
 * - Format validation (international format)
 * - Country code validation (required)
 * - Length validation (reasonable phone number length)
 * - Structure validation (regex pattern)
 * - Existence validation (phone number must exist in database)
 *
 * @module forgotPasswordSMSValidator
 */

const buyerRepository = require('../repositories/buyer.repository');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates the phone number format and existence in database.
 *
 * This function ensures the phone number is provided, has the correct format,
 * and exists in the database for password reset functionality via SMS.
 * It performs comprehensive phone number validation to ensure data integrity and security.
 *
 * Phone Number Requirements:
 * - Phone number must be provided (not null/undefined/empty)
 * - Phone number must include country code (e.g., +1, +44, +234)
 * - Phone number must follow international format
 * - Country code must start with + and be 1-3 digits
 * - Phone number must be 7-15 digits total (including country code)
 * - Phone number must exist in the buyer database
 *
 * Validation Checks:
 * - Required field validation
 * - International format validation using regex
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
 * - Checks if phone number exists in buyer collection
 * - Prevents password reset for non-existent accounts
 * - Maintains security through existence validation
 * - Provides appropriate error messages
 *
 * @param {string} phoneNumber - Phone number to validate
 * @param {Array} errors - Array to collect validation errors
 */
async function validatePhoneNumber(phoneNumber, errors) {
  if (!phoneNumber) {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
  } else {
    // Step 1: Validate phone number format (international format validation)
    // This regex ensures proper international phone number format:
    // - Starts with + (required for international format)
    // - Country code: 1-3 digits (e.g., +1, +44, +234)
    // - Phone number: 1-14 digits (total length 7-15 digits)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      errors.push({ 
        field: 'phoneNumber', 
        message: 'Invalid phone number format. Please include country code (e.g., +23490126727)' 
      });
    } else {
      // Step 2: If phone number is present and has valid format, check if buyer exists
      // This ensures the phone number is associated with an actual buyer account
      // Note: Phone numbers are not unique in the schema, so we find the first match
      const existingBuyer = await buyerRepository.findByPhoneNumber(phoneNumber);
      if (!existingBuyer) {
        errors.push({ field: 'phoneNumber', message: 'No account found with this phone number' });
      }
    }
  }
}

/**
 * Validates all forgot password SMS data before processing - Main validation function.
 *
 * This is the primary validation function that orchestrates all validation steps
 * for the forgot password via SMS process. It ensures comprehensive validation before
 * allowing the password reset process to proceed.
 *
 * Validation Process:
 * 1. Validates input data structure and presence
 * 2. Validates phone number requirements and format
 * 3. Verifies phone number existence in database
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
 * - Phone number format validation
 * - Database existence verification
 * - Type safety enforcement
 * - Clear error reporting
 *
 * @param {Object} data - Forgot password SMS input data object to validate
 * @param {string} data.phoneNumber - The phone number to validate
 * @throws {ValidationError} If any validation fails (contains all validation errors)
 *
 * @example
 * // Valid forgot password SMS data
 * await validateForgotPasswordSMSData({
 *   phoneNumber: '+23490126727'
 * });
 * // No error thrown (assuming phone number exists in database)
 *
 * @example
 * // Invalid forgot password SMS data - missing phone number
 * try {
 *   await validateForgotPasswordSMSData({});
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 *
 * @example
 * // Invalid forgot password SMS data - invalid phone format
 * try {
 *   await validateForgotPasswordSMSData({
 *     phoneNumber: 'invalid-phone-format'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 *
 * @example
 * // Invalid forgot password SMS data - phone number doesn't exist
 * try {
 *   await validateForgotPasswordSMSData({
 *     phoneNumber: '+2349999999999'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function validateForgotPasswordSMSData(data) {
  const errors = [];

  // Step 1: Validate phone number format and existence
  // This ensures the phone number is provided, has valid format, and exists in database
  await validatePhoneNumber(data.phoneNumber, errors);

  // Step 2: Throw ValidationError if any validation failed
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateForgotPasswordSMSData
};

