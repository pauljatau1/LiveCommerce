/**
 * Reset Password Validator
 *
 * This validator handles input validation for password reset functionality.
 * It validates email format, OTP format, and password requirements.
 * 
 * The validator ensures that:
 * - Email is in valid format and corresponds to an existing buyer
 * - OTP is a 4-digit numeric code
 * - New password meets security requirements (length and complexity)
 * - OTP matches the stored value and hasn't expired
 *
 * @module resetPasswordValidator
 */

const validator = require('validator');
const buyerRepository = require('../repositories/buyer.repository');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate email format and existence.
 *
 * This function performs comprehensive email validation:
 * 1. Checks if email is provided (not null/undefined/empty)
 * 2. Validates email format using validator.js
 * 3. Verifies that a buyer account exists with this email
 * 
 * The email lookup is case-insensitive to provide better user experience.
 *
 * @param {string} email - The email to validate
 * @param {Array} errors - Array to collect validation errors
 */
async function validateEmail(email, errors) {
  // Check if email is provided
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
    return;
  }
  
  // Validate email format using validator.js library
  if (!validator.isEmail(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
    return;
  }
  
  // Check if buyer exists with this email (case-insensitive search)
  const buyer = await buyerRepository.findByEmail(email);
  if (!buyer) {
    errors.push({ field: 'email', message: 'No account found with this email' });
  }
}

/**
 * Validate OTP format and requirements.
 *
 * This function validates the One-Time Password (OTP) used for password reset:
 * 1. Ensures OTP is provided
 * 2. Validates that OTP is a string
 * 3. Validates that OTP contains only numeric characters
 * 4. Confirms OTP is exactly 4 digits long
 * 
 * The 4-digit requirement provides a good balance between security and usability.
 * OTP must be sent as a string type from the client.
 *
 * @param {string} otp - The OTP to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateOTP(otp, errors) {
  // Check if OTP is provided
  if (!otp) {
    errors.push({ field: 'otp', message: 'OTP is required' });
    return;
  }
  
  // Validate that OTP is a string type
  if (typeof otp !== 'string') {
    errors.push({ field: 'otp', message: 'OTP must be a string' });
    return;
  }
  
  // Validate OTP format: must contain only numeric characters and exactly 4 digits
  if (!validator.isNumeric(otp) || otp.length !== 4) {
    errors.push({ field: 'otp', message: 'OTP must be a 4-digit number' });
  }
}

/**
 * Validate new password requirements.
 *
 * This function enforces password security requirements:
 * 1. Ensures password is provided
 * 2. Validates minimum length (6 characters)
 * 3. Requires at least one letter and one number for complexity
 * 
 * These requirements provide a good balance between security and usability.
 * More complex requirements can be added here if needed.
 *
 * @param {string} newPassword - The new password to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateNewPassword(newPassword, errors) {
  // Check if password is provided
  if (!newPassword) {
    errors.push({ field: 'newPassword', message: 'New password is required' });
    return;
  }
  
  // Validate minimum length requirement
  if (newPassword.length < 6) {
    errors.push({ field: 'newPassword', message: 'Password must be at least 6 characters long' });
  }
  
  // Validate complexity: must contain at least one letter and one number
  // This regex ensures: (?=.*[A-Za-z]) - at least one letter
  //                    (?=.*\d) - at least one digit
  if (!validator.matches(newPassword, /^(?=.*[A-Za-z])(?=.*\d)/)) {
    errors.push({ field: 'newPassword', message: 'Password must contain at least one letter and one number' });
  }
}

/**
 * Validate OTP verification against stored values.
 *
 * This function validates that the OTP matches the stored value and hasn't expired.
 *
 * @param {Object} buyer - The buyer object containing stored OTP data
 * @param {string} otp - The OTP to verify
 * @param {Array} errors - Array to collect validation errors
 */
function validateOTPVerification(buyer, otp, errors) {
  // Verify OTP matches the stored value
  if (buyer.resetPasswordOTP !== otp) {
    errors.push({ field: 'otp', message: 'Invalid reset code' });
    return;
  }
  
  // Check if OTP has expired
  if (!buyer.resetPasswordOTPExpires || buyer.resetPasswordOTPExpires < new Date()) {
    errors.push({ field: 'otp', message: 'Reset code has expired' });
  }
}

/**
 * Validate reset password data.
 *
 * This function orchestrates the complete validation process for password reset:
 * 1. Validates email format and existence
 * 2. Validates OTP format
 * 3. Validates new password requirements
 * 4. Verifies OTP matches the stored value
 * 5. Checks if OTP has expired
 * 
 * This is the main validation function that should be called by the service layer.
 * It ensures all input data is valid before proceeding with the password reset.
 *
 * @param {Object} data - The reset password data
 * @param {string} data.email - The buyer's email address
 * @param {string} data.otp - The reset OTP code (4-digit)
 * @param {string} data.newPassword - The new password to set
 * @throws {ValidationError} If any validation fails (invalid email, OTP, password, or expired/mismatched OTP)
 */
async function validateResetPasswordData(data) {
  const errors = [];
  
  // Step 1: Validate email format and existence
  await validateEmail(data.email, errors);
  
  // Step 2: Validate OTP format
  validateOTP(data.otp, errors);
  
  // Step 3: Validate new password requirements
  validateNewPassword(data.newPassword, errors);

  // Step 4: If no format errors, verify OTP against stored values
  if (errors.length === 0) {
    const buyer = await buyerRepository.findByEmail(data.email);
    validateOTPVerification(buyer, data.otp, errors);
  }
  
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateResetPasswordData
}; 