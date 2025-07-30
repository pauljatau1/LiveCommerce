const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates OTP format and structure.
 * 
 * @param {string} otp - The OTP to validate
 * @returns {void}
 * @throws {ValidationError} If OTP is invalid
 */
function validateOTPFormat(otp) {
  const errors = [];
  
  if (!otp) {
    errors.push({ field: 'otp', message: 'OTP is required' });
  } else if (typeof otp !== 'string') {
    errors.push({ field: 'otp', message: 'OTP must be a string' });
  } else if (!/^\d{6}$/.test(otp)) {
    errors.push({ field: 'otp', message: 'OTP must be a 6-digit number' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validates buyer ID format.
 * 
 * @param {string} buyerId - The buyer ID to validate
 * @returns {void}
 * @throws {ValidationError} If buyer ID is invalid
 */
function validateBuyerId(buyerId) {
  const errors = [];
  
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (typeof buyerId !== 'string') {
    errors.push({ field: 'buyerId', message: 'Buyer ID must be a string' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validates all input data for verifyPhoneOTP.
 * 
 * @param {Object} data - Input data containing otp and buyerId
 * @param {string} data.otp - The OTP to verify
 * @param {string} data.buyerId - The buyer's ID
 * @returns {void}
 * @throws {ValidationError} If validation fails
 */
async function validateVerifyPhoneOTPData(data) {
  validateBuyerId(data.buyerId);
  validateOTPFormat(data.otp);
}

module.exports = {
  validateVerifyPhoneOTPData,
  validateOTPFormat,
  validateBuyerId
}; 