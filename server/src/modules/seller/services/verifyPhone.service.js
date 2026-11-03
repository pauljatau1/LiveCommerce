/**
 * Verify Phone Service
 *
 * This service handles the business logic for phone verification OTP verification for sellers.
 * It provides secure verification, phone verification status update, and proper error handling.
 *
 * The service ensures that:
 * - OTP verification requests are properly validated
 * - Secure OTP comparison and verification
 * - Phone verification status is updated
 * - Professional response formatting
 * - Error handling maintains system integrity
 *
 * Phone Verification Flow:
 * - Input validation and seller existence verification
 * - OTP comparison and expiration check
 * - Phone verification status update
 * - Success response with verification confirmation
 *
 * Security Features:
 * - Secure OTP comparison
 * - OTP expiration validation
 * - Phone verification status management
 * - Error handling without information leakage
 * - Professional response formatting
 *
 * @module verifyPhoneService
 */

const sellerRepository = require('../repositories/seller.repository');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const { validateVerifyPhoneData } = require('../validators/verifyPhone.validator');

/**
 * Verifies OTP and expiration for phone verification.
 *
 * This function checks if the provided OTP matches the stored OTP and
 * ensures that the OTP has not expired. It validates both the OTP code
 * and the expiration time to ensure security.
 *
 * Verification Checks:
 * - OTP code matches stored value
 * - OTP has not expired
 * - OTP exists in seller record
 *
 * @param {Object} seller - Seller object with OTP information
 * @param {string} otp - The OTP code to verify
 * @returns {boolean} True if OTP is valid and not expired
 */
function verifyOTPAndExpiration(seller, otp) {
  // Check if OTP exists
  if (!seller.phoneVerificationOTP) {
    return false;
  }

  // Check if OTP matches
  if (seller.phoneVerificationOTP !== otp.toString()) {
    return false;
  }

  // Check if OTP has expired
  if (!seller.phoneVerificationOTPExpires || new Date() > new Date(seller.phoneVerificationOTPExpires)) {
    return false;
  }

  return true;
}

/**
 * Updates seller phone verification status in the database.
 *
 * This function updates the seller's phone verification status and clears
 * the OTP fields after successful verification. It ensures data consistency
 * and proper account activation.
 *
 * Verification Updates:
 * - Sets isPhoneVerified to true
 * - Clears phoneVerificationOTP field for security
 * - Clears phoneVerificationOTPExpires field
 * - Saves changes atomically
 *
 * @param {string} sellerId - Seller ID to update
 * @returns {Promise<Object>} Updated seller data
 * @throws {Error} If database update fails
 */
async function updateSellerPhoneVerification(sellerId) {
  return await sellerRepository.verifyPhoneNumber(sellerId);
}

/**
 * Verifies phone OTP for seller - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * phone verification OTP verification process. It handles validation,
 * OTP comparison, expiration check, and phone verification status update.
 *
 * Business Logic Flow:
 * 1. Validates the input data (phone number and OTP format)
 * 2. Finds the seller by phone number
 * 3. Verifies the OTP against stored value and checks expiration
 * 4. Updates seller phone verification status
 * 5. Returns verification result
 *
 * @param {Object} data - Phone verification request data
 * @param {string} data.phoneNumber - Seller's phone number
 * @param {string} data.otp - One-time password to verify
 * @returns {Promise<Object>} Verification result
 *   - success: {boolean} - Indicates successful verification
 *   - message: {string} - Success message for verification
 * @throws {ValidationError} If input validation fails or OTP is invalid/expired
 * @throws {NotFoundException} If seller is not found
 * @throws {Error} If database operations fail
 */
async function verifyPhone(data) {
  // Step 1: Validate input data using the validator
  await validateVerifyPhoneData(data);

  // Step 2: Find seller by phone number
  const seller = await sellerRepository.findByPhoneNumber(data.phoneNumber);
  if (!seller) {
    throw new NotFoundException('No seller account found with this phone number');
  }

  // Step 3: Verify OTP and expiration
  if (!verifyOTPAndExpiration(seller, data.otp)) {
    throw new ValidationError([{ field: 'otp', message: 'Invalid or expired OTP' }]);
  }

  // Step 4: Update seller phone verification status
  await updateSellerPhoneVerification(seller._id);

  // Step 5: Return verification result
  return {
    success: true,
    message: 'Phone number verified successfully'
  };
}

module.exports = {
  verifyPhone
};

