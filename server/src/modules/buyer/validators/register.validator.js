const validator = require('validator');
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');
const { validateXSS, validateEmailFormat } = require('../../../utils/validator');

/**
 * Validate the password field.
 * 
 * @param {string} password
 * @param {Array} errors - Array to collect validation errors
 */
async function validatePassword(password, errors) {
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }
}

/**
 * Validate the username field.
 * 
 * @param {string} username
 * @param {Array} errors - Array to collect validation errors
 */
async function validateUsername(username, errors) {
  if (!username) {
    errors.push({ field: 'username', message: 'Username is required' });
  } else {
    // Check if username contains spaces
    if (username.includes(' ')) {
      errors.push({ field: 'username', message: 'Username cannot contain spaces' });
    }

    // Check if username exists
    const results = await buyerRepository.findAll({ "username": username });
    if (results.length > 0) {
      errors.push({ field: 'username', message: 'Username is already registered' });
    }
  }
}

/**
 * Validate the phoneNumber field.
 * 
 * @param {string} phoneNumber
 * @param {Array} errors - Array to collect validation errors
 */
async function validatePhoneNumber(phoneNumber, errors) {
  if (!phoneNumber) {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
  } else {
    // Check if phoneNumber exists
    const results = await buyerRepository.findAll({ "phoneNumber": phoneNumber });
    if (results.length > 0) {
      errors.push({ field: 'phoneNumber', message: 'Phone number is already registered' });
    }
  }
}

/**
 * Validate email.
 * 
 * @param {string} email
 * @param {Array} errors - Array to collect validation errors
 */
async function validateEmail(email, errors) {
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else {
    // Check email format
    const emailFormatError = validateEmailFormat(email, 'email');
    if (emailFormatError) {
      errors.push(emailFormatError);
    }

    // Check if email exists
    const results = await buyerRepository.findAll({ "email": email });
    if (results.length > 0) {
      errors.push({ field: 'email', message: 'Email is already registered' });
    }
  }
}

/**
 * Validate the lastName field.
 * 
 * @param {string} lastName
 * @param {Array} errors - Array to collect validation errors
 */
async function validateLastName(lastName, errors) {
  if (!lastName) {
    errors.push({ field: 'lastName', message: 'lastName is required' });
  } else {
    // Check for XSS patterns
    const xssError = validateXSS(lastName, 'lastName');
    if (xssError) {
      errors.push(xssError);
    }

    // Check maximum length
    if (lastName.length > 100) {
      errors.push({ field: 'lastName', message: 'lastName must not exceed 100 characters' });
    }
  }
}

/**
 * Validate the firstName field.
 * 
 * @param {string} firstName
 * @param {Array} errors - Array to collect validation errors
 */
async function validateFirstName(firstName, errors) {
  if (!firstName) {
    errors.push({ field: 'firstName', message: 'firstName is required' });
  } else {
    // Check for XSS patterns
    const xssError = validateXSS(firstName, 'firstName');
    if (xssError) {
      errors.push(xssError);
    }

    // Check maximum length
    if (firstName.length > 100) {
      errors.push({ field: 'firstName', message: 'firstName must not exceed 100 characters' });
    }
  }
}

/**
 * Validate all user data before creation.
 * 
 * @param {Object} data - User input data.
 * @throws {ValidationError} If validation fails.
 */
async function validateRegisterData(data) {
  const errors = [];

  await validateFirstName(data.firstName, errors);
  await validateLastName(data.lastName, errors);
  await validateEmail(data.email, errors);
  await validatePhoneNumber(data.phoneNumber, errors);
  await validateUsername(data.username, errors);
  await validatePassword(data.password, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateRegisterData,
};