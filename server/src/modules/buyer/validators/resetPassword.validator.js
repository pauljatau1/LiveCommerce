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
 * @returns {Promise<Object|null>} The buyer object if validation passes, null if validation fails
 * 
 * @example
 * // Valid email
 * const buyer = await validateEmail('john.doe@example.com', errors);
 * 
 * @example
 * // Invalid email format
 * validateEmail('invalid-email', errors);
 * // errors array will contain validation details
 */
async function validateEmail(email, errors) {
  // Check if email is provided
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
    return null;
  }
  
  // Validate email format using validator.js library
  if (!validator.isEmail(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
    return null;
  }
  
  // Check if buyer exists with this email (case-insensitive search)
  const buyer = await buyerRepository.findByEmail(email);
  if (!buyer) {
    errors.push({ field: 'email', message: 'No account found with this email' });
    return null;
  }
  
  return buyer;
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
 * @returns {boolean} True if OTP is valid
 * 
 * @example
 * // Valid OTP (string type)
 * validateOTP('1234', errors); // Returns true
 * 
 * @example
 * // Invalid OTP - too short
 * validateOTP('123', errors);
 * // errors array will contain validation details
 * 
 * @example
 * // Invalid OTP - not a string
 * validateOTP(1234, errors);
 * // errors array will contain validation details
 */
function validateOTP(otp, errors) {
  // Check if OTP is provided
  if (!otp) {
    errors.push({ field: 'otp', message: 'OTP is required' });
    return false;
  }
  
  // Validate that OTP is a string type
  if (typeof otp !== 'string') {
    errors.push({ field: 'otp', message: 'OTP must be a string' });
    return false;
  }
  
  // Validate OTP format: must contain only numeric characters and exactly 4 digits
  if (!validator.isNumeric(otp) || otp.length !== 4) {
    errors.push({ field: 'otp', message: 'OTP must be a 4-digit number' });
    return false;
  }
  
  return true;
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
 * @returns {boolean} True if password meets all requirements
 * 
 * @example
 * // Valid password
 * validateNewPassword('SecurePass123', errors); // Returns true
 * 
 * @example
 * // Invalid password - too short
 * validateNewPassword('weak', errors);
 * // errors array will contain validation details
 */
function validateNewPassword(newPassword, errors) {
  // Check if password is provided
  if (!newPassword) {
    errors.push({ field: 'newPassword', message: 'New password is required' });
    return false;
  }
  
  // Validate minimum length requirement
  if (newPassword.length < 6) {
    errors.push({ field: 'newPassword', message: 'Password must be at least 6 characters long' });
    return false;
  }
  
  // Validate complexity: must contain at least one letter and one number
  // This regex ensures: (?=.*[A-Za-z]) - at least one letter
  //                    (?=.*\d) - at least one digit
  if (!validator.matches(newPassword, /^(?=.*[A-Za-z])(?=.*\d)/)) {
    errors.push({ field: 'newPassword', message: 'Password must contain at least one letter and one number' });
    return false;
  }
  
  return true;
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
 * @returns {Promise<Object>} The buyer object if all validations pass
 * @throws {ValidationError} If any validation fails (invalid email, OTP, password, or expired/mismatched OTP)
 * 
 * @example
 * // Successful validation
 * const buyer = await validateResetPasswordData({
 *   email: 'john.doe@example.com',
 *   otp: '1234',
 *   newPassword: 'newSecurePassword123'
 * });
 * 
 * @example
 * // Failed validation - expired OTP
 * try {
 *   await validateResetPasswordData({
 *     email: 'john.doe@example.com',
 *     otp: '1234',
 *     newPassword: 'newSecurePassword123'
 *   });
 * } catch (error) {
 *   // error.message contains validation details
 * }
 */
async function validateResetPasswordData(data) {
  const errors = [];
  
  // Step 1: Validate email and get buyer object
  // This also ensures the buyer exists in the database
  const buyer = await validateEmail(data.email, errors);
  
  // Step 2: Validate OTP format
  // This ensures the OTP is in the correct format before checking against stored value
  const isOTPValid = validateOTP(data.otp, errors);
  
  // Step 3: Validate new password requirements
  // This ensures the new password meets security standards
  const isPasswordValid = validateNewPassword(data.newPassword, errors);

  // Only proceed with OTP verification if we have a valid buyer and OTP format
  if (buyer && isOTPValid) {
    // Step 4: Verify OTP matches the stored value
    // This prevents unauthorized password resets with incorrect OTP
    if (buyer.resetPasswordOTP !== data.otp) {
      errors.push({ field: 'otp', message: 'Invalid reset code' });
    } else {
      // Step 5: Check if OTP has expired
      // This ensures the reset link hasn't expired for security reasons
      if (!buyer.resetPasswordOTPExpires || buyer.resetPasswordOTPExpires < new Date()) {
        errors.push({ field: 'otp', message: 'Reset code has expired' });
      }
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
  
  // All validations passed, return the buyer object
  // The service layer can now proceed with password reset
  return buyer;
}

module.exports = {
  validateResetPasswordData
}; 