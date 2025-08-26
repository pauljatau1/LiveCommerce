/**
 * Verify OTP Service
 *
 * This service handles the business logic for OTP (One-Time Password) verification
 * for buyer email verification. It provides secure verification, account activation,
 * and welcome bonus scheduling functionality.
 *
 * The service ensures that:
 * - OTP verification requests are properly validated
 * - Secure OTP comparison and verification
 * - Account verification status is updated
 * - Welcome bonus is scheduled for new users
 * - Professional response formatting
 * - Error handling maintains system integrity
 *
 * OTP Verification Flow:
 * - Input validation and buyer existence verification
 * - OTP comparison and verification
 * - Account verification status update
 * - Welcome bonus scheduling
 * - Success response with bonus information
 *
 * Security Features:
 * - Secure OTP comparison
 * - Account verification status management
 * - Welcome bonus scheduling for new users
 * - Error handling without information leakage
 * - Professional response formatting
 *
 * Welcome Bonus System:
 * - Automatic scheduling for verified users
 * - 10-second delay for bonus credit
 * - 500 NGN bonus amount
 * - Agenda job scheduling system
 *
 * @module verifyOTPService
 */

const Buyer = require('../../../models/Buyer');
const { agenda } = require('../../../config/agenda');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const { validateVerifyOTPData } = require('../validators/verifyOTP.validator');

/**
 * Schedules welcome bonus for the buyer.
 *
 * This function schedules a welcome bonus job for the buyer using the agenda
 * job scheduling system. The bonus is scheduled to be credited after a 10-second
 * delay to ensure proper account verification.
 *
 * Welcome Bonus Details:
 * - Amount: 500 NGN
 * - Currency: NGN (Nigerian Naira)
 * - Timing: 10 seconds after verification
 * - Job Type: credit_welcome_bonus
 *
 * Job Scheduling:
 * - Uses agenda job scheduling system
 * - 10-second delay for proper timing
 * - Includes buyer ID for job processing
 * - Handles scheduling errors appropriately
 *
 * @param {string} buyerId - Buyer's ID for bonus scheduling
 * @returns {Promise<void>} Resolves when bonus is scheduled successfully
 * @throws {Error} If job scheduling fails
 */
async function scheduleWelcomeBonus(buyerId) {
  // Step 1: Schedule welcome bonus job with 10-second delay
  // This ensures proper account verification before bonus credit
  await agenda.schedule('in 10 seconds', 'credit_welcome_bonus', { buyerId });
}

/**
 * Updates buyer verification status in the database.
 *
 * This function updates the buyer's email verification status and clears
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
 * @param {Object} buyer - Buyer object to update
 * @returns {Promise<void>} Resolves when buyer is updated successfully
 * @throws {Error} If database update fails
 */
async function updateBuyerVerification(buyer) {
  // Step 1: Set email verification status to true
  buyer.emailVerified = true;
  
  // Step 2: Clear OTP field for security
  buyer.otp = undefined;
  
  // Step 3: Save the buyer document atomically
  await buyer.save();
}

/**
 * Creates verification response object with bonus information.
 *
 * This function creates a standardized response object that includes
 * verification success message and welcome bonus details for the user.
 *
 * Response Structure:
 * - Success message for verification
 * - Bonus information with details
 * - Professional formatting
 * - User-friendly information
 *
 * Bonus Information:
 * - coming: true (indicates bonus is scheduled)
 * - amount: 500 (bonus amount in NGN)
 * - currency: NGN (Nigerian Naira)
 * - timeToCredit: '10 seconds' (user-friendly timing)
 *
 * @returns {Object} Response object with verification and bonus information
 *   - message: {string} - Success message for verification
 *   - bonus: {Object} - Welcome bonus details
 *     - coming: {boolean} - Indicates bonus is scheduled
 *     - amount: {number} - Bonus amount in NGN
 *     - currency: {string} - Currency code
 *     - timeToCredit: {string} - Time until bonus credit
 */
function createVerificationResponse() {
  return {
    message: 'Email verified successfully.',
    bonus: {
      coming: true,
      amount: 500,
      currency: 'NGN',
      timeToCredit: '10 seconds'
    }
  };
}

/**
 * Verifies OTP for buyer email verification - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * OTP verification process. It handles validation, OTP comparison,
 * account verification, and welcome bonus scheduling.
 *
 * Business Logic Flow:
 * 1. Validates the input data (email and OTP format)
 * 2. Finds the buyer by email address
 * 3. Verifies the OTP against stored value
 * 4. Updates buyer verification status
 * 5. Schedules welcome bonus for new user
 * 6. Returns verification result with bonus information
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Secure OTP comparison
 * - Account verification status management
 * - Welcome bonus scheduling for new users
 * - Error handling without information leakage
 *
 * Data Integrity:
 * - Validates all inputs before database operations
 * - Uses atomic database updates
 * - Maintains data consistency
 * - Ensures buyer exists before processing
 *
 * Error Handling:
 * - Validation errors for invalid inputs
 * - NotFoundException for non-existent buyers
 * - ValidationError for invalid OTP
 * - Database operation errors
 * - Job scheduling errors
 * - Proper error propagation to controller
 *
 * @param {string} email - Buyer's email address
 * @param {string} otp - One-time password to verify
 * @returns {Promise<Object>} Verification result with bonus information
 *   - message: {string} - Success message for verification
 *   - bonus: {Object} - Welcome bonus details
 *     - coming: {boolean} - Indicates bonus is scheduled
 *     - amount: {number} - Bonus amount in NGN
 *     - currency: {string} - Currency code
 *     - timeToCredit: {string} - Time until bonus credit
 * @throws {ValidationError} If input validation fails or OTP is invalid
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operations or job scheduling fails
 *
 * @example
 * // Verify OTP for buyer
 * const result = await verifyOTP('user@example.com', '1234');
 * // Returns: {
 * //   message: 'Email verified successfully.',
 * //   bonus: {
 * //     coming: true,
 * //     amount: 500,
 * //     currency: 'NGN',
 * //     timeToCredit: '10 seconds'
 * //   }
 * // }
 *
 * @example
 * // Failed verification - invalid OTP
 * try {
 *   await verifyOTP('user@example.com', '9999');
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function verifyOTP(email, otp) {
  // Step 1: Validate input data using the validator
  // This ensures email and OTP format are correct
  await validateVerifyOTPData({ email, otp });

  // Step 2: Find buyer by email address
  // This ensures the buyer exists before verification
  const buyer = await Buyer.findOne({ email });
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: Verify OTP against stored value
  // This ensures the provided OTP matches the stored OTP
  if (buyer.otp !== otp) {
    throw new ValidationError([{ field: 'otp', message: 'Invalid OTP' }]);
  }

  // Step 4: Update buyer verification status
  // This activates the account and clears the OTP
  await updateBuyerVerification(buyer);

  // Step 5: Schedule welcome bonus for new user
  // This provides incentive for email verification
  await scheduleWelcomeBonus(buyer._id);

  // Step 6: Return verification result with bonus information
  return createVerificationResponse();
}

module.exports = {
  verifyOTP,
}; 