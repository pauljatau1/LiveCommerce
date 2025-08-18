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
 * @param {Array} errors - Array to collect validation errors
 */
function validateEmailPresence(email, errors) {
  if (!email) {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_REQUIRED });
  }
}

/**
 * Validates that email is a string.
 *
 * @param {string} email - Email to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateEmailType(email, errors) {
  if (email && typeof email !== 'string') {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_MUST_BE_STRING });
  }
}

/**
 * Validates email format structure.
 *
 * @param {string} email - Email to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateEmailFormat(email, errors) {
  if (!email.includes('@')) {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_INVALID_FORMAT });
    return;
  }
  
  const parts = email.split('@');
  if (parts.length !== 2) {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_INVALID_FORMAT });
    return;
  }
  
  const [localPart, domain] = parts;
  if (!localPart || localPart.trim() === '') {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_INVALID_FORMAT });
  }
  if (!domain || domain.trim() === '') {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_INVALID_FORMAT });
  }
}

/**
 * Validates email field.
 *
 * @param {string} email - Email to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateEmail(email, errors) {
  // Check email presence
  validateEmailPresence(email, errors);
  
  // Check email type
  validateEmailType(email, errors);
  
  // Check email format (only if email is a string)
  if (email && typeof email === 'string') {
    validateEmailFormat(email, errors);
  }
}

/**
 * Validates resendOTP data.
 *
 * @param {Object} data - Data to validate
 * @param {string} data.email - The email to validate
 * @throws {ValidationError} If validation fails
 */
async function validateResendOTPData(data) {
  const errors = [];

  if (!data || data === null || data === undefined) {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_REQUIRED });
  } else {
    validateEmail(data.email, errors);
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateResendOTPData,
}; 