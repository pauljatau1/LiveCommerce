/**
 * Verify Phone OTP Validator
 *
 * This validator handles input validation for phone OTP (One-Time Password) verification
 * functionality. It provides comprehensive validation for the complete phone OTP
 * verification process, ensuring data integrity and security.
 *
 * The validator ensures that:
 * - All input data is properly formatted and validated
 * - Buyer IDs are provided and valid
 * - OTP codes are provided and properly formatted
 * - All validation errors are collected and reported together
 * - Security requirements are enforced
 *
 * Validation Features:
 * - Buyer ID presence and format validation
 * - OTP presence and format validation
 * - Support for 6-digit numeric OTP format
 * - Comprehensive error collection
 * - Security-focused validation
 *
 * Security Considerations:
 * - Validates all inputs before processing
 * - Ensures proper OTP format (6 digits)
 * - Maintains data integrity throughout validation
 * - Prevents information leakage through error messages
 * - Flexible OTP type handling for different clients
 *
 * OTP Validation Strategy:
 * - Presence validation (required field)
 * - Type validation (string only)
 * - Format validation (6-digit numeric)
 * - Structure validation (exact length)
 * - Content validation (numeric only)
 *
 * @module verifyPhoneOTPValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');
const mongoose = require('mongoose');

/**
 * Validates OTP format and structure for phone verification.
 *
 * This function ensures the OTP is provided and has the correct format
 * for phone verification. It performs comprehensive OTP validation to
 * ensure data integrity and security.
 *
 * OTP Requirements:
 * - OTP must be provided (not null/undefined/empty)
 * - OTP must be a string type
 * - OTP must be exactly 6 digits
 * - OTP must contain only numeric characters
 *
 * Validation Checks:
 * - Required field validation
 * - Data type validation (string only)
 * - Length validation (exactly 6 digits)
 * - Format validation (numeric only)
 * - Structure validation (regex pattern)
 *
 * Security Features:
 * - Input sanitization through type checking
 * - Format validation to prevent injection
 * - Clear error messages for users
 * - Consistent validation approach
 * - Regex pattern validation for security
 *
 * @param {string} otp - OTP code to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateOTPFormat(otp, errors) {
  if (!otp) {
    errors.push({ field: 'otp', message: 'OTP is required' });
  } else if (typeof otp !== 'string') {
    errors.push({ field: 'otp', message: 'OTP must be a string' });
  } else if (!/^\d{6}$/.test(otp)) {
    errors.push({ field: 'otp', message: 'OTP must be a 6-digit number' });
  }
}

/**
 * Validates buyer ID format and structure.
 *
 * This function ensures the buyer ID is provided and has the correct format
 * for database operations. It performs comprehensive ID validation to
 * ensure data integrity and security.
 *
 * Buyer ID Requirements:
 * - Buyer ID must be provided (not null/undefined/empty)
 * - Buyer ID must be a string type
 * - Buyer ID must be a valid MongoDB ObjectId format
 * - Buyer ID must meet ObjectId validation criteria
 *
 * Validation Checks:
 * - Required field validation
 * - Data type validation (string only)
 * - ObjectId format validation
 * - MongoDB ObjectId structure validation
 * - Database compatibility validation
 *
 * Security Features:
 * - Input sanitization through type checking
 * - ObjectId format validation to prevent injection
 * - Clear error messages for users
 * - Consistent validation approach
 * - MongoDB ObjectId validation for security
 *
 * @param {string} buyerId - Buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBuyerId(buyerId, errors) {
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (typeof buyerId !== 'string') {
    errors.push({ field: 'buyerId', message: 'Buyer ID must be a string' });
  } else if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
  }
}

/**
 * Validates all input data for verifyPhoneOTP - Main validation function.
 *
 * This is the primary validation function that orchestrates all validation steps
 * for phone OTP verification. It ensures comprehensive validation before allowing
 * the verification process to proceed.
 *
 * Validation Process:
 * 1. Validates input data structure and presence
 * 2. Validates buyer ID requirements
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
 * - Buyer ID format validation
 * - OTP format validation
 * - Type safety enforcement
 * - Clear error reporting
 *
 * @param {Object} data - Phone OTP verification data object to validate
 * @param {string} data.otp - The OTP to verify
 * @param {string} data.buyerId - The buyer's ID
 * @throws {ValidationError} If any validation fails (contains all validation errors)
 *
 * @example
 * // Valid phone OTP verification data
 * await validateVerifyPhoneOTPData({
 *   buyerId: '507f1f77bcf86cd799439011',
 *   otp: '123456'
 * });
 * // No error thrown
 *
 * @example
 * // Invalid phone OTP verification data - missing buyer ID
 * try {
 *   await validateVerifyPhoneOTPData({
 *     otp: '123456'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 *
 * @example
 * // Invalid phone OTP verification data - invalid OTP format
 * try {
 *   await validateVerifyPhoneOTPData({
 *     buyerId: '507f1f77bcf86cd799439011',
 *     otp: '12345' // Only 5 digits
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function validateVerifyPhoneOTPData(data) {
  const errors = [];

  // Step 1: Validate input data structure
  // This ensures the data object is provided and properly structured
  if (!data || typeof data !== 'object') {
    errors.push({ field: 'data', message: 'Request data is required' });
  } else {
    // Step 2: Validate individual fields
    // This ensures each required field meets validation requirements
    validateBuyerId(data.buyerId, errors);
    validateOTPFormat(data.otp, errors);
  }

  // Step 3: Throw ValidationError if any validation failed
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateVerifyPhoneOTPData,
  validateOTPFormat,
  validateBuyerId
}; 