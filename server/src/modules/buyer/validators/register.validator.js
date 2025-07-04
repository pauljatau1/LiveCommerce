const validator = require('validator');
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');
const { validateXSS, validateEmailFormat } = require('../../../utils/validator');

/**
 * Validate all user data before creation.
 * 
 * @param {Object} data - User input data.
 * @throws {Error} If validation fails.
 */
async function validateRegisterData(data) {
  await validateFirstName(data.firstName)
  await validateLastName(data.lastName)
  await validateEmail(data.email)
  await validatePhoneNumber(data.phoneNumber)
  await validateUsername(data.username)
  await validatePassword(data.password)
}

/**
 * Validate the password field.
 * 
 * @param {string} password
 */
async function validatePassword(password) {
  const errors = [];
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate the username field.
 * 
 * @param {string} username
 */
async function validateUsername(username) {
  const errors = [];
  if (!username) {
    errors.push({ field: 'username', message: 'Username is required' });
  }

  // Check if username contains spaces
  if (username && username.includes(' ')) {
    errors.push({ field: 'username', message: 'Username cannot contain spaces' });
  }

  // Check if username exists
  const results = await buyerRepository.findAll({ "username": username });
  if (results.length > 0) {
    errors.push({ field: 'username', message: 'Username is already registered' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate the phoneNumber field.
 * 
 * @param {string} phoneNumber
 */
async function validatePhoneNumber(phoneNumber) {
  const errors = [];
  if (!phoneNumber) {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
  }

  // Check if phoneNumber exists
  const results = await buyerRepository.findAll({ "phoneNumber": phoneNumber });
  if (results.length > 0) {
    errors.push({ field: 'phoneNumber', message: 'Phone number is already registered' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate email.
 * 
 * @param {string} email
 */
async function validateEmail(email) {
  const errors = [];
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  }

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

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate the lastName field.
 * 
 * @param {string} lastName
 */
async function validateLastName(lastName) {
  const errors = [];
  if (!lastName) {
    errors.push({ field: 'lastName', message: 'lastName is required' });
  }

  // Check for XSS patterns
  const xssError = validateXSS(lastName, 'lastName');
  if (xssError) {
    errors.push(xssError);
  }

  // Check maximum length
  if (lastName && lastName.length > 100) {
    errors.push({ field: 'lastName', message: 'lastName must not exceed 100 characters' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

/**
 * Validate the firstName field.
 * 
 * @param {string} firstName
 */
async function validateFirstName(firstName) {
  const errors = [];
  if (!firstName) {
    errors.push({ field: 'firstName', message: 'firstName is required' });
  }

  // Check for XSS patterns
  const xssError = validateXSS(firstName, 'firstName');
  if (xssError) {
    errors.push(xssError);
  }

  // Check maximum length
  if (firstName && firstName.length > 100) {
    errors.push({ field: 'firstName', message: 'firstName must not exceed 100 characters' });
  }
  
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return;
}

module.exports = {
  validateRegisterData,
};