/**
 * Verify Phone OTP Service
 *
 * This service handles the business logic for OTP (One-Time Password) verification
 * for buyer phone verification. It provides secure verification, attempt tracking,
 * and phone verification status management.
 *
 * The service ensures that:
 * - OTP verification requests are properly validated
 * - Secure OTP comparison and verification
 * - Attempt tracking and limit enforcement
 * - Phone verification status is updated
 * - Error handling maintains system integrity
 *
 * Phone OTP Verification Flow:
 * - Input validation and buyer existence verification
 * - Verification process status validation
 * - OTP comparison and verification
 * - Attempt tracking and limit enforcement
 * - Phone verification status update
 * - Success response and confirmation
 *
 * Security Features:
 * - Secure OTP comparison
 * - Attempt limit enforcement (3 attempts)
 * - OTP expiry validation
 * - Verification status management
 * - Error handling without information leakage
 *
 * Verification Management:
 * - Ongoing verification process validation
 * - OTP expiry checking
 * - Attempt limit enforcement
 * - Verification status updates
 * - Data cleanup after verification
 *
 * @module verifyPhoneOTPService
 */

const buyerRepository = require('../repositories/buyer.repository');
const verifyPhoneOTPValidator = require('../validators/verifyPhoneOTP.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Checks if there's an ongoing phone verification process.
 * 
 * This function validates that a phone verification process is currently
 * active for the buyer before proceeding with OTP verification.
 *
 * Verification Status Check:
 * - Validates phoneVerification object exists
 * - Checks for active OTP presence
 * - Ensures verification process is ongoing
 * - Prevents verification without active process
 *
 * @param {Object} buyer - Buyer object containing verification data
 * @param {Object} buyer.phoneVerification - Phone verification data
 * @param {string} buyer.phoneVerification.otp - Active OTP code
 * @returns {boolean} True if verification is in progress
 */
function hasOngoingVerification(buyer) {
  return buyer.phoneVerification && buyer.phoneVerification.otp;
}

/**
 * Checks if the OTP has expired.
 * 
 * This function validates that the OTP is still valid by checking
 * the expiry timestamp against the current time.
 *
 * Expiry Validation:
 * - Compares current time with expiry timestamp
 * - Ensures OTP is still valid for verification
 * - Prevents expired OTP usage
 * - Maintains security through time limits
 *
 * @param {Object} buyer - Buyer object containing verification data
 * @param {Date} buyer.phoneVerification.expiresAt - OTP expiry timestamp
 * @returns {boolean} True if OTP has expired
 */
function isOTPExpired(buyer) {
  return new Date() > new Date(buyer.phoneVerification.expiresAt);
}

/**
 * Checks if maximum attempts have been exceeded.
 * 
 * This function validates that the user hasn't exceeded the maximum
 * allowed verification attempts (3 attempts).
 *
 * Attempt Limit Enforcement:
 * - Validates against maximum attempt limit (3)
 * - Prevents brute force attacks
 * - Ensures security through attempt limiting
 * - Maintains verification integrity
 *
 * @param {Object} buyer - Buyer object containing verification data
 * @param {number} buyer.phoneVerification.attempts - Current attempt count
 * @returns {boolean} True if max attempts exceeded
 */
function hasExceededMaxAttempts(buyer) {
  return buyer.phoneVerification.attempts >= 3;
}

/**
 * Validates OTP against stored value.
 * 
 * This function compares the provided OTP with the stored OTP
 * to determine if the verification is successful.
 *
 * OTP Comparison:
 * - Compares provided OTP with stored value
 * - Ensures exact match for verification
 * - Maintains security through precise validation
 * - Prevents partial or incorrect OTP acceptance
 *
 * @param {Object} buyer - Buyer object containing verification data
 * @param {string} buyer.phoneVerification.otp - Stored OTP code
 * @param {string} otp - OTP to validate
 * @returns {boolean} True if OTP is valid
 */
function isValidOTP(buyer, otp) {
  return buyer.phoneVerification.otp === otp.toString();
}

/**
 * Clears phone verification data.
 * 
 * This function removes the phone verification data from the buyer
 * record, typically after successful verification or when clearing
 * expired/invalid verification attempts.
 *
 * Data Cleanup:
 * - Removes phoneVerification object from buyer
 * - Clears verification data after processing
 * - Maintains clean database state
 * - Prevents data accumulation
 *
 * @param {string} buyerId - Buyer's ID
 * @returns {Promise<Object>} Updated buyer object
 */
async function clearPhoneVerification(buyerId) {
  return await buyerRepository.updateById(buyerId, {
    phoneVerification: undefined
  });
}

/**
 * Increments failed attempts and updates buyer.
 * 
 * This function increments the failed attempt counter and updates
 * the buyer record to track verification attempts.
 *
 * Attempt Tracking:
 * - Increments failed attempt counter
 * - Updates buyer record with new attempt count
 * - Maintains attempt tracking for security
 * - Enables attempt limit enforcement
 *
 * @param {string} buyerId - Buyer's ID
 * @param {Object} buyer - Buyer object containing current verification data
 * @param {number} buyer.phoneVerification.attempts - Current attempt count
 * @returns {Promise<Object>} Updated buyer object
 */
async function incrementFailedAttempts(buyerId, buyer) {
  const updatedVerification = {
    ...buyer.phoneVerification,
    attempts: buyer.phoneVerification.attempts + 1
  };
  
  return await buyerRepository.updateById(buyerId, {
    phoneVerification: updatedVerification
  });
}

/**
 * Marks phone as verified and clears verification data.
 * 
 * This function updates the buyer's phone verification status to true
 * and clears the verification data after successful verification.
 *
 * Verification Completion:
 * - Sets phoneVerified to true
 * - Clears verification data
 * - Updates buyer verification status
 * - Maintains clean database state
 *
 * @param {string} buyerId - Buyer's ID
 * @returns {Promise<Object>} Updated buyer object
 */
async function markPhoneAsVerified(buyerId) {
  return await buyerRepository.updateById(buyerId, {
    phoneVerified: true,
    phoneVerification: undefined
  });
}

/**
 * Validates verification process status and throws appropriate errors.
 * 
 * This function performs comprehensive validation of the verification
 * process status and throws appropriate errors for different scenarios.
 *
 * Process Validation:
 * - Checks for ongoing verification process
 * - Validates OTP expiry status
 * - Enforces attempt limits
 * - Clears invalid verification data
 * - Throws appropriate validation errors
 *
 * Error Scenarios:
 * - No ongoing verification process
 * - Expired OTP
 * - Exceeded maximum attempts
 * - Invalid verification state
 *
 * @param {Object} buyer - Buyer object containing verification data
 * @param {string} buyerId - Buyer's ID
 * @throws {ValidationError} If verification process is invalid
 */
async function validateVerificationProcess(buyer, buyerId) {
  // Step 1: Check for ongoing verification process
  if (!hasOngoingVerification(buyer)) {
    throw new ValidationError([{
      field: 'otp',
      message: 'No verification in progress. Please request a new OTP.'
    }]);
  }

  // Step 2: Check for OTP expiry
  if (isOTPExpired(buyer)) {
    await clearPhoneVerification(buyerId);
    throw new ValidationError([{
      field: 'otp',
      message: 'OTP has expired. Please request a new one.'
    }]);
  }

  // Step 3: Check for exceeded attempts
  if (hasExceededMaxAttempts(buyer)) {
    await clearPhoneVerification(buyerId);
    throw new ValidationError([{
      field: 'otp',
      message: 'Too many failed attempts. Please request a new OTP.'
    }]);
  }
}

/**
 * Validates OTP and handles invalid OTP scenarios.
 * 
 * This function validates the provided OTP against the stored value
 * and handles invalid OTP scenarios by incrementing attempt counters.
 *
 * OTP Validation:
 * - Compares provided OTP with stored value
 * - Increments failed attempts for invalid OTP
 * - Calculates remaining attempts
 * - Throws validation error with attempt information
 *
 * Attempt Management:
 * - Tracks failed verification attempts
 * - Provides remaining attempt information
 * - Maintains security through attempt limiting
 * - Enables user feedback on attempt status
 *
 * @param {Object} buyer - Buyer object containing verification data
 * @param {string} buyerId - Buyer's ID
 * @param {string} otp - OTP to validate
 * @throws {ValidationError} If OTP is invalid
 */
async function validateOTP(buyer, buyerId, otp) {
  if (!isValidOTP(buyer, otp)) {
    await incrementFailedAttempts(buyerId, buyer);
    const remainingAttempts = 3 - (buyer.phoneVerification.attempts + 1);
    
    throw new ValidationError([{
      field: 'otp',
      message: 'Invalid OTP',
      remainingAttempts
    }]);
  }
}

/**
 * Verifies phone OTP for buyer phone verification - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * phone OTP verification process. It handles validation, OTP comparison,
 * attempt tracking, and phone verification status updates.
 *
 * Business Logic Flow:
 * 1. Validates the input data (buyer ID and OTP format)
 * 2. Finds the buyer by ID for verification
 * 3. Validates verification process status
 * 4. Validates OTP against stored value
 * 5. Updates phone verification status
 * 6. Returns verification result
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Secure OTP comparison
 * - Attempt limit enforcement (3 attempts)
 * - OTP expiry validation
 * - Verification status management
 * - Error handling without information leakage
 *
 * Verification Process:
 * - Ongoing verification process validation
 * - OTP expiry checking
 * - Attempt limit enforcement
 * - OTP comparison and validation
 * - Verification status updates
 * - Data cleanup after verification
 *
 * Error Handling:
 * - Validation errors for invalid inputs
 * - NotFoundException for non-existent buyers
 * - ValidationError for invalid verification process
 * - ValidationError for invalid OTP
 * - Database operation errors
 * - Proper error propagation to controller
 *
 * @param {string} buyerId - The buyer's ID
 * @param {string} otp - The OTP to verify
 * @returns {Promise<Object>} Verification result with status
 *   - message: {string} - Success message for verification
 *   - phoneVerified: {boolean} - Phone verification status
 * @throws {ValidationError} If input validation fails or verification process is invalid
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Verify phone OTP
 * const result = await verifyPhoneOTP('507f1f77bcf86cd799439011', '123456');
 * // Returns: { message: 'Phone number verified successfully', phoneVerified: true }
 *
 * @example
 * // Failed verification - invalid OTP
 * try {
 *   await verifyPhoneOTP('507f1f77bcf86cd799439011', '999999');
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details with remainingAttempts
 * }
 */
async function verifyPhoneOTP(buyerId, otp) {
  // Step 1: Validate input data using the validator
  // This ensures buyer ID and OTP format are correct
  await verifyPhoneOTPValidator.validateVerifyPhoneOTPData({ buyerId, otp });

  // Step 2: Find buyer by ID
  // This ensures the buyer exists before proceeding with verification
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: Validate verification process status
  // This ensures verification process is valid and active
  await validateVerificationProcess(buyer, buyerId);

  // Step 4: Validate OTP against stored value
  // This compares the provided OTP with the stored OTP
  await validateOTP(buyer, buyerId, otp);

  // Step 5: OTP is valid - update verification status
  // This marks the phone as verified and clears verification data
  await markPhoneAsVerified(buyerId);

  // Step 6: Return verification result
  return {
    message: 'Phone number verified successfully',
    phoneVerified: true
  };
}

module.exports = {
  verifyPhoneOTP
}; 