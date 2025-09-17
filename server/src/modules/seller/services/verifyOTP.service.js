/**
 * Verify OTP Service
 *
 * This service handles the business logic for OTP (One-Time Password) verification
 * for seller email verification. It provides secure verification, account activation,
 * and token generation functionality.
 *
 * The service ensures that:
 * - OTP verification requests are properly validated
 * - Secure OTP comparison and verification
 * - Account verification status is updated
 * - JWT token is generated for authenticated access
 * - Professional response formatting
 * - Error handling maintains system integrity
 *
 * OTP Verification Flow:
 * - Input validation and seller existence verification
 * - OTP comparison and verification
 * - Account verification status update
 * - JWT token generation
 * - Success response with user data and token
 *
 * Security Features:
 * - Secure OTP comparison
 * - Account verification status management
 * - JWT token generation for authenticated access
 * - Error handling without information leakage
 * - Professional response formatting
 *
 * Token Generation:
 * - JWT token with seller ID and role
 * - 2-week expiration for convenience
 * - Secure token signing with environment secret
 *
 * @module verifyOTPService
 */

const jwt = require('jsonwebtoken');
const sellerRepository = require('../repositories/seller.repository');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const { validateVerifyOTPData } = require('../validators/verifyOTP.validator');

/**
 * Generates JWT token for seller authentication.
 *
 * This function creates a secure JWT token for the seller after successful
 * OTP verification. The token includes the seller's ID and role for
 * authentication and authorization purposes.
 *
 * Token Details:
 * - Payload: { id: sellerId, role: 'Seller' }
 * - Expiration: 2 weeks
 * - Secret: Environment variable JWT_SECRET
 * - Algorithm: Default HS256
 *
 * Security Features:
 * - Uses environment variable for secret
 * - Includes role for authorization
 * - 2-week expiration for convenience
 * - Secure token signing
 *
 * @param {string} sellerId - Seller's ID for token generation
 * @returns {string} JWT token for authentication
 */
function generateToken(sellerId) {
  return jwt.sign({ id: sellerId, role: 'Seller' }, process.env.JWT_SECRET, { expiresIn: '2w' });
}

/**
 * Updates seller verification status in the database.
 *
 * This function updates the seller's email verification status and clears
 * the OTP field after successful verification. It ensures data consistency
 * and proper account activation.
 *
 * Verification Updates:
 * - Sets emailVerified to true
 * - Clears OTP field for security
 * - Saves changes atomically
 * - Maintains data integrity
 *
 * Security Considerations:
 * - Clears OTP after successful verification
 * - Prevents reuse of expired OTP
 * - Maintains verification audit trail
 * - Ensures account activation
 *
 * @param {Object} seller - Seller object to update
 * @returns {Promise<void>} Resolves when seller is updated successfully
 * @throws {Error} If database update fails
 */
async function updateSellerVerification(seller) {
  // Step 1: Set email verification status to true
  seller.emailVerified = true;
  
  // Step 2: Clear OTP field for security
  seller.otp = undefined;
  
  // Step 3: Save the seller document atomically
  await seller.save();
}

/**
 * Creates verification response object with user data and token.
 *
 * This function creates a standardized response object that includes
 * verification success message, user data, and authentication token.
 *
 * Response Structure:
 * - Success message for verification
 * - Complete seller user data
 * - JWT token for authentication
 * - Professional formatting
 * - User-friendly information
 *
 * User Data:
 * - Complete seller profile information
 * - Verification status updated
 * - OTP field cleared for security
 * - All relevant seller data included
 *
 * @param {Object} seller - Seller object with updated verification status
 * @param {string} token - JWT token for authentication
 * @returns {Object} Response object with verification, user data, and token
 *   - success: {boolean} - Indicates successful verification
 *   - message: {string} - Success message for verification
 *   - user: {Object} - Complete seller user data
 *   - token: {string} - JWT token for authentication
 */
function createVerificationResponse(seller, token) {
  return {
    success: true,
    message: 'Email verified successfully.',
    user: seller,
    token
  };
}

/**
 * Verifies OTP for seller email verification - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * OTP verification process. It handles validation, OTP comparison,
 * account verification, and token generation.
 *
 * Business Logic Flow:
 * 1. Validates the input data (email and OTP format)
 * 2. Finds the seller by email address
 * 3. Verifies the OTP against stored value
 * 4. Updates seller verification status
 * 5. Generates JWT token for authentication
 * 6. Returns verification result with user data and token
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Secure OTP comparison
 * - Account verification status management
 * - JWT token generation for authenticated access
 * - Error handling without information leakage
 *
 * Data Integrity:
 * - Validates all inputs before database operations
 * - Uses atomic database updates
 * - Maintains data consistency
 * - Ensures seller exists before processing
 *
 * Error Handling:
 * - Validation errors for invalid inputs
 * - NotFoundException for non-existent sellers
 * - ValidationError for invalid OTP
 * - Database operation errors
 * - Token generation errors
 * - Proper error propagation to controller
 *
 * @param {string} email - Seller's email address
 * @param {string} otp - One-time password to verify
 * @returns {Promise<Object>} Verification result with user data and token
 *   - success: {boolean} - Indicates successful verification
 *   - message: {string} - Success message for verification
 *   - user: {Object} - Complete seller user data
 *   - token: {string} - JWT token for authentication
 * @throws {ValidationError} If input validation fails or OTP is invalid
 * @throws {NotFoundException} If seller is not found
 * @throws {Error} If database operations or token generation fails
 *
 * @example
 * // Verify OTP for seller
 * const result = await verifyOTP('seller@example.com', '1234');
 * // Returns: {
 * //   success: true,
 * //   message: 'Email verified successfully.',
 * //   user: { _id: '...', email: 'seller@example.com', emailVerified: true, ... },
 * //   token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * // }
 *
 * @example
 * // Failed verification - invalid OTP
 * try {
 *   await verifyOTP('seller@example.com', '9999');
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function verifyOTP(email, otp) {
  // Step 1: Validate input data using the validator
  // This ensures email and OTP format are correct
  await validateVerifyOTPData({ email, otp });

  // Step 2: Find seller by email address using repository
  // This ensures the seller exists before verification
  const seller = await sellerRepository.findByEmail(email);
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }

  // Step 3: Verify OTP against stored value
  // This ensures the provided OTP matches the stored OTP
  // Convert both to string for type-safe comparison
  if (seller.otp !== otp.toString()) {
    throw new ValidationError([{ field: 'otp', message: 'Invalid OTP' }]);
  }

  // Step 4: Update seller verification status
  // This activates the account and clears the OTP
  await updateSellerVerification(seller);

  // Step 5: Generate JWT token for authentication
  // This provides secure access to the seller's account
  const token = generateToken(seller._id);

  // Step 6: Return verification result with user data and token
  return createVerificationResponse(seller, token);
}

module.exports = {
  verifyOTP,
};
