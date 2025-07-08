// validators/verifyOTP.validator.js
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates email field.
 *
 * @param {string} email - Email to validate
 * @throws {ValidationError} If validation fails
 */
function validateEmail(email) {
  const errors = [];
  
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  }
  
  if (email && typeof email !== 'string') {
    errors.push({ field: 'email', message: 'Email must be a string' });
  }
  
  if (email && typeof email === 'string' && !email.includes('@')) {
    errors.push({ field: 'email', message: 'Email must be a valid email address' });
  }
  
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validates OTP field.
 *
 * @param {string|number} otp - OTP to validate
 * @throws {ValidationError} If validation fails
 */
function validateOTP(otp) {
  const errors = [];
  
  if (!otp) {
    errors.push({ field: 'otp', message: 'OTP is required' });
  }
  
  if (otp && typeof otp !== 'string' && typeof otp !== 'number') {
    errors.push({ field: 'otp', message: 'OTP must be a string or number' });
  }
  
  if (otp && otp.toString().length !== 4) {
    errors.push({ field: 'otp', message: 'OTP must be 4 digits' });
  }
  
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validates verifyOTP input manually.
 *
 * @param {Object} data
 * @throws {ValidationError} If validation fails
 */
function validateVerifyOTPInput(data) {
  if (!data || data === null || data === undefined) {
    throw new ValidationError([
      { field: 'email', message: 'Email is required' },
      { field: 'otp', message: 'OTP is required' }
    ]);
  }

  validateEmail(data.email);
  validateOTP(data.otp);
}

module.exports = {
  validateVerifyOTPInput,
}; 