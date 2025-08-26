const Buyer = require('../../../models/Buyer');
const { agenda } = require('../../../config/agenda');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const { validateVerifyOTPData } = require('../validators/verifyOTP.validator');

/**
 * Schedules welcome bonus for the buyer.
 *
 * @param {string} buyerId - Buyer's ID
 * @returns {Promise<void>}
 */
async function scheduleWelcomeBonus(buyerId) {
  await agenda.schedule('in 10 seconds', 'credit_welcome_bonus', { buyerId });
}

/**
 * Updates buyer verification status.
 *
 * @param {Object} buyer - Buyer object
 * @returns {Promise<void>}
 */
async function updateBuyerVerification(buyer) {
  buyer.emailVerified = true;
  buyer.otp = undefined;
  await buyer.save();
}

/**
 * Creates verification response object.
 *
 * @returns {Object} Response object
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
 * Verifies OTP for buyer email verification.
 *
 * @param {string} email - Buyer's email address
 * @param {string} otp - One-time password to verify
 * @returns {Promise<Object>} - Verification result with bonus information
 */
async function verifyOTP(email, otp) {
  // Validate input data
  await validateVerifyOTPData({ email, otp });

  // Find buyer by email
  const buyer = await Buyer.findOne({ email });
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Verify OTP
  if (buyer.otp !== otp) {
    throw new ValidationError([{ field: 'otp', message: 'Invalid OTP' }]);
  }

  // Update buyer verification status
  await updateBuyerVerification(buyer);

  // Schedule welcome bonus
  await scheduleWelcomeBonus(buyer._id);

  // Return verification result
  return createVerificationResponse();
}

module.exports = {
  verifyOTP,
}; 