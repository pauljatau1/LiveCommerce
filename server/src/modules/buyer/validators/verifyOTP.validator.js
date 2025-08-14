// validators/verifyOTP.validator.js
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates email field.
 *
 * @param {string} email - Email to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateEmail(email, errors) {
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (typeof email !== 'string') {
    errors.push({ field: 'email', message: 'Email must be a string' });
  } else if (!email.includes('@')) {
    errors.push({ field: 'email', message: 'Email must be a valid email address' });
  }
}

/**
 * Validates OTP field.
 *
 * @param {string|number} otp - OTP to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateOTP(otp, errors) {
  if (!otp) {
    errors.push({ field: 'otp', message: 'OTP is required' });
  } else if (typeof otp !== 'string' && typeof otp !== 'number') {
    errors.push({ field: 'otp', message: 'OTP must be a string or number' });
  } else if (otp.toString().length !== 4) {
    errors.push({ field: 'otp', message: 'OTP must be 4 digits' });
  }
}

/**
 * Validates verifyOTP data.
 *
 * @param {Object} data - Data to validate
 * @param {string} data.email - The email to validate
 * @param {string|number} data.otp - The OTP to validate
 * @throws {ValidationError} If validation fails
 */
async function validateVerifyOTPData(data) {
  const errors = [];

  if (!data || data === null || data === undefined) {
    errors.push({ field: 'email', message: 'Email is required' });
    errors.push({ field: 'otp', message: 'OTP is required' });
  } else {
    validateEmail(data.email, errors);
    validateOTP(data.otp, errors);
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateVerifyOTPData,
}; 