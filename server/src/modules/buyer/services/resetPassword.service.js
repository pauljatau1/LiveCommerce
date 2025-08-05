/**
 * Reset Password Service
 * 
 * This service handles the business logic for resetting a buyer's password.
 * It provides functionality to:
 * - Validate input data (email, OTP, new password)
 * - Verify OTP validity and expiration
 * - Hash the new password
 * - Update the buyer's password and clear reset fields
 * 
 * @module resetPasswordService
 */

const bcrypt = require('bcrypt');
const buyerRepository = require('../repositories/buyer.repository');
const resetPasswordValidator = require('../validators/resetPassword.validator');

/**
 * Hash a password using bcrypt.
 * 
 * This function securely hashes a password using bcrypt with a salt round of 10.
 * The hashed password is suitable for storage in the database.
 * 
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} The hashed password
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Process password reset request.
 * 
 * This service handles the business logic for resetting a buyer's password.
 * It validates the input data, verifies the OTP, hashes the new password,
 * and updates the buyer record while clearing the reset fields.
 * 
 * @param {Object} data - Password reset request data
 * @param {string} data.email - The buyer's email address
 * @param {string} data.otp - The reset OTP code
 * @param {string} data.newPassword - The new password
 * @returns {Promise<Object>} Success response object with message
 * @throws {ValidationError} If input validation fails (invalid email, OTP, or password)
 * @throws {Error} If password hashing or database update fails
 * 
 * @example
 * // Successful password reset
 * const result = await resetPassword({ 
 *   email: 'user@example.com', 
 *   otp: '1234', 
 *   newPassword: 'newSecurePassword123' 
 * });
 * // Returns: { message: 'Password reset successfully' }
 * 
 * @example
 * // Failed validation
 * try {
 *   await resetPassword({ email: 'invalid-email', otp: '123', newPassword: 'weak' });
 * } catch (error) {
 *   // error instanceof ValidationError
 * }
 */
async function resetPassword(data) {
  // Step 1: Validate input data using the validator
  // This ensures email format is correct, OTP is valid, and password meets requirements
  const buyer = await resetPasswordValidator.validateResetPasswordData(data);
  
  // Step 2: Hash the new password for secure storage
  // This converts the plain text password to a secure hash
  const hashedPassword = await hashPassword(data.newPassword);
  
  // Step 3: Update the buyer record with new password and clear reset fields
  // This atomically updates the password and removes the OTP fields
  const updatedBuyer = await buyerRepository.resetPassword(buyer._id, hashedPassword);
  
  // Verify that the database update was successful
  if (!updatedBuyer) {
    throw new Error('Failed to update buyer password');
  }
  
  // Step 4: Return success response
  // Note: We don't return the password in the response for security reasons
  return {
    message: 'Password reset successfully'
  };
}

module.exports = {
  resetPassword
}; 