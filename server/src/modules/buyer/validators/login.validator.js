// validators/login.validator.js

/**
 * Validates login input manually.
 *
 * @param {Object} data
 * @returns {Array} errors
 */
function validateLoginInput(data) {
  const errors = [];

  if (!data || data === null || data === undefined) {
    errors.push({ field: 'email', message: 'Email is required' });
    return errors;
  }

  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  }

  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (typeof data.password !== 'string' && typeof data.password !== 'number') {
    errors.push({ field: 'password', message: 'Password must be a string or number' });
  }

  return errors;
}

module.exports = {
  validateLoginInput,
};