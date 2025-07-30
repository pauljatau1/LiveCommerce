const buyerRepository = require('../repositories/buyer.repository');
const verifyPhoneOTPValidator = require('../validators/verifyPhoneOTP.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Checks if there's an ongoing phone verification process.
 * 
 * @param {Object} buyer - Buyer object
 * @returns {boolean} True if verification is in progress
 */
function hasOngoingVerification(buyer) {
  return buyer.phoneVerification && buyer.phoneVerification.otp;
}

/**
 * Checks if the OTP has expired.
 * 
 * @param {Object} buyer - Buyer object
 * @returns {boolean} True if OTP has expired
 */
function isOTPExpired(buyer) {
  return new Date() > new Date(buyer.phoneVerification.expiresAt);
}

/**
 * Checks if maximum attempts have been exceeded.
 * 
 * @param {Object} buyer - Buyer object
 * @returns {boolean} True if max attempts exceeded
 */
function hasExceededMaxAttempts(buyer) {
  return buyer.phoneVerification.attempts >= 3;
}

/**
 * Validates OTP against stored value.
 * 
 * @param {Object} buyer - Buyer object
 * @param {string} otp - OTP to validate
 * @returns {boolean} True if OTP is valid
 */
function isValidOTP(buyer, otp) {
  return buyer.phoneVerification.otp === otp;
}

/**
 * Clears phone verification data.
 * 
 * @param {string} buyerId - Buyer's ID
 * @returns {Promise<Object>} Updated buyer
 */
async function clearPhoneVerification(buyerId) {
  return await buyerRepository.updateById(buyerId, {
    phoneVerification: undefined
  });
}

/**
 * Increments failed attempts and updates buyer.
 * 
 * @param {string} buyerId - Buyer's ID
 * @param {Object} buyer - Buyer object
 * @returns {Promise<Object>} Updated buyer
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
 * @param {string} buyerId - Buyer's ID
 * @returns {Promise<Object>} Updated buyer
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
 * @param {Object} buyer - Buyer object
 * @param {string} buyerId - Buyer's ID
 * @throws {ValidationError} If verification process is invalid
 */
async function validateVerificationProcess(buyer, buyerId) {
  if (!hasOngoingVerification(buyer)) {
    throw new ValidationError([{
      field: 'otp',
      message: 'No verification in progress. Please request a new OTP.'
    }]);
  }

  if (isOTPExpired(buyer)) {
    await clearPhoneVerification(buyerId);
    throw new ValidationError([{
      field: 'otp',
      message: 'OTP has expired. Please request a new one.'
    }]);
  }

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
 * @param {Object} buyer - Buyer object
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
 * Verifies phone OTP for buyer phone verification.
 * 
 * This function:
 * - Validates input data
 * - Checks if buyer exists
 * - Validates verification process status
 * - Checks OTP expiration and attempts
 * - Verifies OTP and updates phone verification status
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {string} otp - The OTP to verify
 * @returns {Promise<Object>} Verification result
 */
async function verifyPhoneOTP(buyerId, otp) {
  // Validate input data
  await verifyPhoneOTPValidator.validateVerifyPhoneOTPData({ buyerId, otp });

  // Find buyer
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Validate verification process
  await validateVerificationProcess(buyer, buyerId);

  // Validate OTP
  await validateOTP(buyer, buyerId, otp);

  // OTP is valid - update verification status
  await markPhoneAsVerified(buyerId);

  return {
    message: 'Phone number verified successfully',
    phoneVerified: true
  };
}

module.exports = {
  verifyPhoneOTP
}; 