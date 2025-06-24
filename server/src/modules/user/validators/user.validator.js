const validator = require('validator');
const User = require('../models/user.model');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate the email format and uniqueness in DB.
 * 
 * @param {string} email
 */
async function validateEmail(email) {
  const errors = [];
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validator.isEmail(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // If email present and valid format, check uniqueness
  if (email && validator.isEmail(email)) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      errors.push({ field: 'email', message: 'Email already exists' });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate the companyName field.
 * 
 * @param {string} companyName
 */
async function validateCompanyName(companyName) {
  const errors = [];
  if (!companyName) {
    errors.push({ field: 'companyName', message: 'companyName is required' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate all user data before creation.
 * 
 * @param {Object} data - User input data.
 * @throws {Error} If validation fails.
 */
async function validateCreateData(data) {
  await validateCompanyName(data.companyName);
  await validateEmail(data.email);
  // Add more field validations here if needed (e.g. password, name)
}

/**
 * Validate all user data before update.
 * 
 * @param {Object} data - User input data.
 * @throws {Error} If validation fails.
 */
async function validateUpdateData(data) {
  // validate only if data is present
  if (data.companyName) {
    await validateCompanyName(data.companyName);
  }
  if (data.email) {
    await validateEmail(data.email);
  }
  
  // Add more field validations here if needed (e.g. password, name)
}

module.exports = {
  validateCreateData,
  validateUpdateData
};