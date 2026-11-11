/**
 * Reset Password Service
 *
 * This service handles the business logic for resetting a buyer's password after
 * OTP verification. It provides functionality to:
 * - Validate input data (email, OTP, new password)
 * - Verify OTP validity and expiration
 * - Securely hash the new password using bcrypt
 * - Update the buyer's password and clear reset fields
 * - Maintain security standards and data integrity
 *
 * The service ensures that password resets are performed securely with proper
 * validation and password hashing to protect user accounts.
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
 * The hashed password is suitable for storage in the database and provides
 * strong protection against rainbow table attacks.
 *
 * Business Logic:
 * - Uses bcrypt with salt rounds of 10 for optimal security/performance balance
 * - Generates unique salt for each password
 * - Returns hashed password ready for database storage
 * - Handles hashing errors gracefully
 *
 * Security Considerations:
 * - Salt rounds of 10 provide strong security without excessive performance impact
 * - Unique salt per password prevents rainbow table attacks
 * - Bcrypt is designed to be computationally expensive to prevent brute force attacks
 *
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} The hashed password ready for database storage
 * @throws {Error} If password hashing fails
 * @example
 * const hashedPassword = await hashPassword('mySecurePassword123');
 * // Returns: '$2b$10$...' (bcrypt hash)
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Process password reset request.
 *
 * This function orchestrates the complete password reset process, including
 * validation, OTP verification, password hashing, and database updates.
 *
 * Business Logic Flow:
 * 1. Validate input data (email format, OTP validity, password requirements)
 * 2. Retrieve buyer record from database
 * 3. Securely hash the new password
 * 4. Update buyer record with new password and clear reset fields
 * 5. Return success response
 *
 * Security Considerations:
 * - Input validation prevents malicious data injection
 * - OTP verification ensures legitimate reset requests
 * - Password hashing protects against data breaches
 * - Reset field clearing prevents reuse of expired OTPs
 * - No password data returned in response for security
 *
 * @param {Object} data - Password reset request data
 * @param {string} data.email - The buyer's email address
 * @param {string} data.otp - The reset OTP code (4-digit numeric)
 * @param {string} data.newPassword - The new password to set
 * @returns {Promise<Object>} Success response object with message
 * @throws {ValidationError} If input validation fails (invalid email, OTP, or password)
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If password hashing or database update fails
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
async function legacyResetPassword(data) {
  // Step 1: Validate input data using the validator
  // This ensures email format is correct, OTP is valid, and password meets requirements
  await resetPasswordValidator.validateResetPasswordData(data);
  
  // Step 2: Get the buyer object for password update
  // Since validation passed, we know the buyer exists and OTP is valid
  const buyer = await buyerRepository.findByEmail(data.email);
  
  // Step 3: Hash the new password for secure storage
  // This converts the plain text password to a secure hash using bcrypt
  const hashedPassword = await hashPassword(data.newPassword);
  
  // Step 4: Update the buyer record with new password and clear reset fields
  // This atomically updates the password and removes the OTP fields for security
  const updatedBuyer = await buyerRepository.resetPassword(buyer._id, hashedPassword);
  
  // Step 5: Verify that the database update was successful
  // This ensures the password reset was properly completed
  if (!updatedBuyer) {
    throw new Error('Failed to update buyer password');
  }
  
  // Step 6: Return success response
  // Note: We don't return the password in the response for security reasons
  return {
    message: 'Password reset successfully'
  };
}

async function resetPassword(data) { return require('../../../services/auth/passwordReset').reset('Buyer', data); }

module.exports = {
  resetPassword
}; 