// validators/login.validator.js

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
  }
}

/**
 * Validates password field.
 *
 * @param {string|number} password - Password to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePassword(password, errors) {
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (typeof password !== 'string' && typeof password !== 'number') {
    errors.push({ field: 'password', message: 'Password must be a string or number' });
  }
}

/**
 * Validates login data.
 *
 * @param {Object} data - Login data to validate
 * @param {string} data.email - The email to validate
 * @param {string|number} data.password - The password to validate
 * @throws {ValidationError} If validation fails
 */
async function validateLoginData(data) {
  const errors = [];

  if (!data || data === null || data === undefined) {
    errors.push({ field: 'email', message: 'Email is required' });
    errors.push({ field: 'password', message: 'Password is required' });
  } else {
    validateEmail(data.email, errors);
    validatePassword(data.password, errors);
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateLoginData,
};