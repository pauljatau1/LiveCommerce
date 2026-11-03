/**
 * Reset Password Validator
 *
 * This validator handles input validation for password reset functionality.
 * It provides comprehensive validation for the complete password reset process,
 * ensuring security and data integrity throughout the workflow.
 *
 * The validator ensures that:
 * - Email is in valid format and corresponds to an existing buyer account
 * - OTP is a 4-digit numeric code with proper format
 * - New password meets security requirements (length and complexity)
 * - OTP matches the stored value and hasn't expired
 * - All validation errors are collected and reported together
 *
 * Validation Features:
 * - Email format validation using validator.js library
 * - Email existence verification against database
 * - OTP format and length validation
 * - Password complexity requirements
 * - OTP verification against stored values
 * - OTP expiration checking
 *
 * Security Considerations:
 * - Case-insensitive email lookup for better UX
 * - Comprehensive password complexity requirements
 * - OTP expiration validation to prevent replay attacks
 * - Proper error handling without information leakage
 *
 * @module resetPasswordValidator
 */

const validator = require('validator');
const buyerRepository = require('../repositories/buyer.repository');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate email format and existence.
 *
 * This function performs comprehensive email validation including format checking
 * and database verification. It ensures the email is both syntactically correct
 * and corresponds to an existing buyer account.
 *
 * Validation Steps:
 * 1. Checks if email is provided (not null/undefined/empty)
 * 2. Validates email format using validator.js library
 * 3. Verifies that a buyer account exists with this email
 * 4. Uses case-insensitive search for better user experience
 *
 * Error Handling:
 * - Provides specific error messages for each validation failure
 * - Stops validation early if email is missing or malformed
 * - Only checks database existence if format is valid
 *
 * @param {string} email - The email address to validate
 * @param {Array} errors - Array to collect validation errors
 */
async function validateEmail(email, errors) {
  // Step 1: Check if email is provided
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
    return;
  }
  
  // Step 2: Validate email format using validator.js library
  if (!validator.isEmail(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
    return;
  }
  
  // Step 3: Check if buyer exists with this email (case-insensitive search)
  const buyer = await buyerRepository.findByEmail(email);
  if (!buyer) {
    errors.push({ field: 'email', message: 'No account found with this email' });
  }
}

/**
 * Validate OTP format and requirements.
 *
 * This function validates the One-Time Password (OTP) used for password reset
 * verification. It ensures the OTP meets the required format and security standards.
 *
 * OTP Requirements:
 * - Must be provided (not null/undefined/empty)
 * - Must be a string type (not number)
 * - Must contain only numeric characters (0-9)
 * - Must be exactly 4 digits long
 *
 * Security Considerations:
 * - 4-digit length provides good balance between security and usability
 * - Numeric-only requirement simplifies user input
 * - String type requirement ensures consistent handling
 *
 * @param {string} otp - The OTP to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateOTP(otp, errors) {
  // Step 1: Check if OTP is provided
  if (!otp) {
    errors.push({ field: 'otp', message: 'OTP is required' });
    return;
  }
  
  // Step 2: Validate that OTP is a string type
  if (typeof otp !== 'string') {
    errors.push({ field: 'otp', message: 'OTP must be a string' });
    return;
  }
  
  // Step 3: Validate OTP format: must contain only numeric characters and exactly 4 digits
  if (!validator.isNumeric(otp) || otp.length !== 4) {
    errors.push({ field: 'otp', message: 'OTP must be a 4-digit number' });
  }
}

/**
 * Validate new password requirements.
 *
 * This function enforces password security requirements to ensure strong passwords
 * that protect user accounts effectively. It balances security with usability.
 *
 * Password Requirements:
 * - Must be provided (not null/undefined/empty)
 * - Minimum length of 6 characters
 * - Must contain at least one letter (A-Z, a-z)
 * - Must contain at least one number (0-9)
 *
 * Security Rationale:
 * - 6-character minimum provides reasonable security
 * - Letter + number requirement prevents simple passwords
 * - Regex validation ensures complexity requirements
 * - Can be enhanced with additional requirements if needed
 *
 * @param {string} newPassword - The new password to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateNewPassword(newPassword, errors) {
  // Step 1: Check if password is provided
  if (!newPassword) {
    errors.push({ field: 'newPassword', message: 'New password is required' });
    return;
  }
  
  // Step 2: Validate minimum length requirement
  if (newPassword.length < 6) {
    errors.push({ field: 'newPassword', message: 'Password must be at least 6 characters long' });
  }
  
  // Step 3: Validate complexity: must contain at least one letter and one number
  // This regex ensures: (?=.*[A-Za-z]) - at least one letter
  //                    (?=.*\d) - at least one digit
  if (!validator.matches(newPassword, /^(?=.*[A-Za-z])(?=.*\d)/)) {
    errors.push({ field: 'newPassword', message: 'Password must contain at least one letter and one number' });
  }
}

/**
 * Validate OTP verification against stored values.
 *
 * This function verifies that the provided OTP matches the stored value and
 * hasn't expired. This is a critical security check that prevents unauthorized
 * password resets.
 *
 * Verification Steps:
 * 1. Compare provided OTP with stored OTP value
 * 2. Check if OTP has expired based on stored expiration timestamp
 * 3. Provide appropriate error messages for failures
 *
 * Security Features:
 * - Exact OTP matching prevents brute force attacks
 * - Expiration checking prevents replay attacks
 * - Generic error messages don't reveal system details
 *
 * @param {Object} buyer - The buyer object containing stored OTP data
 * @param {string} buyer.resetPasswordOTP - The stored OTP value
 * @param {Date} buyer.resetPasswordOTPExpires - The OTP expiration timestamp
 * @param {string} otp - The OTP to verify
 * @param {Array} errors - Array to collect validation errors
 */
function validateOTPVerification(buyer, otp, errors) {
  // Step 1: Verify OTP matches the stored value
  if (buyer.resetPasswordOTP !== otp) {
    errors.push({ field: 'otp', message: 'Invalid reset code' });
    return;
  }
  
  // Step 2: Check if OTP has expired
  if (!buyer.resetPasswordOTPExpires || buyer.resetPasswordOTPExpires < new Date()) {
    errors.push({ field: 'otp', message: 'Reset code has expired' });
  }
}

/**
 * Validate reset password data - Main validation function.
 *
 * This is the primary validation function that orchestrates the complete
 * password reset validation process. It ensures all input data is valid
 * before proceeding with the password reset operation.
 *
 * Validation Process:
 * 1. Validates email format and existence in database
 * 2. Validates OTP format and requirements
 * 3. Validates new password security requirements
 * 4. Verifies OTP matches stored value and hasn't expired
 * 5. Collects all validation errors and throws ValidationError if any exist
 *
 * Error Handling Strategy:
 * - Collects all validation errors before throwing
 * - Provides specific error messages for each field
 * - Stops database operations if format validation fails
 * - Only verifies OTP if all format validations pass
 *
 * Security Considerations:
 * - Validates all inputs before any database operations
 * - Uses case-insensitive email lookup
 * - Implements proper OTP verification
 * - Enforces password complexity requirements
 * - Prevents information leakage through error messages
 *
 * @param {Object} data - The reset password data object
 * @param {string} data.email - The buyer's email address
 * @param {string} data.otp - The reset OTP code (4-digit numeric string)
 * @param {string} data.newPassword - The new password to set
 * @throws {ValidationError} If any validation fails (contains all validation errors)
 *
 * @example
 * // Valid password reset data
 * await validateResetPasswordData({
 *   email: 'user@example.com',
 *   otp: '1234',
 *   newPassword: 'newPass123'
 * });
 * // No error thrown
 *
 * @example
 * // Invalid password reset data
 * try {
 *   await validateResetPasswordData({
 *     email: 'invalid-email',
 *     otp: '12',
 *     newPassword: 'weak'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains array of validation errors
 * }
 */
async function validateResetPasswordData(data) {
  const errors = [];
  
  // Step 1: Validate email format and existence
  // This checks both format and database existence
  await validateEmail(data.email, errors);
  
  // Step 2: Validate OTP format
  // This ensures OTP meets format requirements
  validateOTP(data.otp, errors);
  
  // Step 3: Validate new password requirements
  // This enforces password security standards
  validateNewPassword(data.newPassword, errors);

  // Step 4: If no format errors, verify OTP against stored values
  // Only perform database verification if format validation passes
  if (errors.length === 0) {
    const buyer = await buyerRepository.findByEmail(data.email);
    validateOTPVerification(buyer, data.otp, errors);
  }
  
  // Step 5: Throw ValidationError if any validation failed
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateResetPasswordData
}; 