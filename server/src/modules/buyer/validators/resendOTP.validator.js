// validators/resendOTP.validator.js
const ValidationError = require('../../../utils/errors/ValidationError');

// Error messages
const ERROR_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_MUST_BE_STRING: 'Email must be a string',
  EMAIL_INVALID_FORMAT: 'Email must be a valid email address'
};

/**
 * Validates that email is not empty.
 *
 * @param {string} email - Email to validate
 * @returns {Array} Array of errors
 */
function validateEmailPresence(email) {
  const errors = [];
  if (!email) {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_REQUIRED });
  }
  return errors;
}

/**
 * Validates that email is a string.
 *
 * @param {string} email - Email to validate
 * @returns {Array} Array of errors
 */
function validateEmailType(email) {
  const errors = [];
  if (email && typeof email !== 'string') {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_MUST_BE_STRING });
  }
  return errors;
}

/**
 * Validates email format structure.
 *
 * @param {string} email - Email to validate
 * @returns {Array} Array of errors
 */
function validateEmailFormat(email) {
  const errors = [];
  
  if (!email.includes('@')) {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_INVALID_FORMAT });
    return errors;
  }
  
  const parts = email.split('@');
  if (parts.length !== 2) {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_INVALID_FORMAT });
    return errors;
  }
  
  const [localPart, domain] = parts;
  if (!localPart || localPart.trim() === '') {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_INVALID_FORMAT });
  }
  if (!domain || domain.trim() === '') {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_INVALID_FORMAT });
  }
  
  return errors;
}

/**
 * Validates email field.
 *
 * @param {string} email - Email to validate
 * @throws {ValidationError} If validation fails
 */
function validateEmail(email) {
  const errors = [];
  
  // Check email presence
  errors.push(...validateEmailPresence(email));
  
  // Check email type
  errors.push(...validateEmailType(email));
  
  // Check email format (only if email is a string)
  if (email && typeof email === 'string') {
    errors.push(...validateEmailFormat(email));
  }
  
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validates resendOTP input manually.
 *
 * @param {Object} data
 * @throws {ValidationError} If validation fails
 */
function validateResendOTPInput(data) {
  if (!data || data === null || data === undefined) {
    throw new ValidationError([
      { field: 'email', message: ERROR_MESSAGES.EMAIL_REQUIRED }
    ]);
  }

  validateEmail(data.email);
}

module.exports = {
  validateResendOTPInput,
}; 