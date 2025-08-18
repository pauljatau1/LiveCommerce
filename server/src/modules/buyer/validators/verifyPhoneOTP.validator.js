const ValidationError = require('../../../utils/errors/ValidationError');
const mongoose = require('mongoose');

/**
 * Validates OTP format and structure.
 * 
 * @param {string} otp - The OTP to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateOTPFormat(otp, errors) {
  if (!otp) {
    errors.push({ field: 'otp', message: 'OTP is required' });
  } else if (typeof otp !== 'string') {
    errors.push({ field: 'otp', message: 'OTP must be a string' });
  } else if (!/^\d{6}$/.test(otp)) {
    errors.push({ field: 'otp', message: 'OTP must be a 6-digit number' });
  }
}

/**
 * Validates buyer ID format.
 * 
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBuyerId(buyerId, errors) {
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (typeof buyerId !== 'string') {
    errors.push({ field: 'buyerId', message: 'Buyer ID must be a string' });
  } else if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
  }
}

/**
 * Validates all input data for verifyPhoneOTP.
 * 
 * @param {Object} data - Input data containing otp and buyerId
 * @param {string} data.otp - The OTP to verify
 * @param {string} data.buyerId - The buyer's ID
 * @throws {ValidationError} If validation fails
 */
async function validateVerifyPhoneOTPData(data) {
  const errors = [];

  // Check if data is provided
  if (!data || typeof data !== 'object') {
    errors.push({ field: 'data', message: 'Request data is required' });
  } else {
    validateBuyerId(data.buyerId, errors);
    validateOTPFormat(data.otp, errors);
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateVerifyPhoneOTPData,
  validateOTPFormat,
  validateBuyerId
}; 