const validator = require('validator');
const buyerRepository = require('../repositories/buyer.repository');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate the email format and existence in database.
 * 
 * @param {string} email - The email to validate
 * @throws {ValidationError} If validation fails
 */
async function validateEmail(email) {
  const errors = [];
  
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validator.isEmail(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // If email is present and has valid format, check if buyer exists
  if (email && validator.isEmail(email)) {
    const existingBuyer = await buyerRepository.findByEmail(email);
    if (!existingBuyer) {
      errors.push({ field: 'email', message: 'No account found with this email' });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate all forgot password data before processing.
 * 
 * @param {Object} data - Forgot password input data
 * @throws {ValidationError} If validation fails
 */
async function validateForgotPasswordData(data) {
  await validateEmail(data.email);
}

module.exports = {
  validateForgotPasswordData
}; 