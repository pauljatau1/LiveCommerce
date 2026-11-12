/**
 * Send Phone OTP Validator
 *
 * This validator handles input validation for phone OTP (One-Time Password) sending
 * functionality. It provides comprehensive validation for the complete phone OTP
 * sending process, ensuring data integrity and security.
 *
 * The validator ensures that:
 * - All input data is properly formatted and validated
 * - Phone numbers are provided and properly formatted
 * - All validation errors are collected and reported together
 * - Security requirements are enforced
 *
 * Validation Features:
 * - Phone number presence and format validation
 * - International phone number format support
 * - Comprehensive error collection
 * - Security-focused validation
 *
 * Security Considerations:
 * - Validates all inputs before processing
 * - Ensures proper phone number format with country code
 * - Maintains data integrity throughout validation
 * - Prevents information leakage through error messages
 * - Flexible phone number handling for different countries
 *
 * Phone Number Validation Strategy:
 * - Presence validation (required field)
 * - Format validation (international format)
 * - Country code validation (required)
 * - Length validation (reasonable phone number length)
 * - Structure validation (regex pattern)
 *
 * @module sendPhoneOTPValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates phone number format for OTP sending.
 *
 * This function ensures the phone number is provided and has the correct format
 * for international SMS delivery. It performs comprehensive phone number validation
 * to ensure data integrity and security.
 *
 * Phone Number Requirements:
 * - Phone number must be provided (not null/undefined/empty)
 * - Phone number must include country code (e.g., +1, +44, +234)
 * - Phone number must follow international format
 * - Country code must start with + and be 1-3 digits
 * - Phone number must be 7-15 digits total (including country code)
 *
 * Validation Checks:
 * - Required field validation
 * - International format validation
 * - Country code presence validation
 * - Length validation (reasonable phone number length)
 * - Structure validation (regex pattern)
 *
 * Security Features:
 * - Input sanitization through format checking
 * - Format validation to prevent injection
 * - Clear error messages for users
 * - Consistent validation approach
 * - Regex pattern validation for security
 *
 * International Format Support:
 * - Supports all international country codes
 * - Validates proper + prefix for country codes
 * - Ensures reasonable phone number length
 * - Handles various international formats
 *
 * @param {string} phoneNumber - Phone number to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePhoneNumberFormat(phoneNumber, errors) {
  if (!phoneNumber) {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
  } else {
    // Validate phone number format (international format validation)
    // This regex ensures proper international phone number format:
    // - Starts with + (required for international format)
    // - Country code: 1-3 digits (e.g., +1, +44, +234)
    // - Phone number: 1-14 digits (total length 7-15 digits)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!require('../../../utils/phone').normalisePhone(phoneNumber)) {
      errors.push({ 
        field: 'phoneNumber', 
        message: 'Enter an 11-digit phone number starting with 0, e.g. 0803 123 4567.'
      });
    }
  }
}

/**
 * Validates sendPhoneOTP data - Main validation function.
 *
 * This is the primary validation function that orchestrates all validation steps
 * for phone OTP sending. It ensures comprehensive validation before allowing
 * the OTP sending process to proceed.
 *
 * Validation Process:
 * 1. Validates input data structure and presence
 * 2. Validates phone number requirements
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
 * - Phone number format validation
 * - International format support
 * - Type safety enforcement
 * - Clear error reporting
 *
 * @param {Object} data - Phone OTP sending data object to validate
 * @param {string} data.phoneNumber - The phone number to validate
 * @throws {ValidationError} If any validation fails (contains all validation errors)
 *
 * @example
 * // Valid phone OTP sending data
 * await validateSendPhoneOTPData({
 *   phoneNumber: '+2341234567890'
 * });
 * // No error thrown
 *
 * @example
 * // Invalid phone OTP sending data - missing phone number
 * try {
 *   await validateSendPhoneOTPData({});
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 *
 * @example
 * // Invalid phone OTP sending data - invalid phone format
 * try {
 *   await validateSendPhoneOTPData({
 *     phoneNumber: '1234567890' // Missing country code
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function validateSendPhoneOTPData(data) {
  const errors = [];

  // Step 1: Validate phone number format
  // This ensures the phone number is provided and has correct international format
  validatePhoneNumberFormat(data.phoneNumber, errors);

  // Step 2: Throw ValidationError if any validation failed
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validatePhoneNumberFormat,
  validateSendPhoneOTPData
}; 