/**
 * Seller Registration Validator
 *
 * This validator handles all validation logic for seller registration.
 * It ensures that all required fields are present and properly formatted
 * before processing the registration request.
 *
 * @module registerValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates a required name field (firstName).
 *
 * @param {string} value - The name value to validate
 * @param {string} fieldName - The field name for error messages
 * @param {Array} errors - Array to collect validation errors
 */
function validateNameField(value, fieldName, errors) {
  if (!value) {
    errors.push({ field: fieldName, message: `${fieldName} is required` });
  } else if (typeof value !== 'string') {
    errors.push({ field: fieldName, message: `${fieldName} must be a string` });
  } else if (value.trim().length < 2) {
    errors.push({ field: fieldName, message: `${fieldName} must be at least 2 characters long` });
  } else if (value.trim().length > 50) {
    errors.push({ field: fieldName, message: `${fieldName} must not exceed 50 characters` });
  }
}

/**
 * Validates an optional name field (lastName).
 * lastName is optional, but if provided, it must meet validation requirements.
 *
 * @param {string} value - The name value to validate (optional)
 * @param {string} fieldName - The field name for error messages
 * @param {Array} errors - Array to collect validation errors
 */
function validateOptionalNameField(value, fieldName, errors) {
  // If value is not provided, skip validation (field is optional)
  if (!value) {
    return;
  }
  
  // If provided, validate it as a string
  if (typeof value !== 'string') {
    errors.push({ field: fieldName, message: `${fieldName} must be a string` });
  } else if (value.trim().length < 2) {
    errors.push({ field: fieldName, message: `${fieldName} must be at least 2 characters long` });
  } else if (value.trim().length > 50) {
    errors.push({ field: fieldName, message: `${fieldName} must not exceed 50 characters` });
  }
}

/**
 * Validates email field.
 *
 * @param {string} email - The email value to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateEmailField(email, errors) {
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (typeof email !== 'string') {
    errors.push({ field: 'email', message: 'Email must be a string' });
  } else if (email.trim().length < 3) {
    errors.push({ field: 'email', message: 'Email must be at least 3 characters long' });
  } else if (email.trim().length > 254) {
    errors.push({ field: 'email', message: 'Email must not exceed 254 characters' });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ field: 'email', message: 'Please provide a valid email address' });
    }
  }
}

/**
 * Validates password field.
 *
 * @param {string} password - The password value to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePasswordField(password, errors) {
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password must be a string' });
  } else if (password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }
}

/**
 * Validates phone number field.
 *
 * @param {string} phoneNumber - The phone number value to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePhoneNumberField(phoneNumber, errors) {
  if (!phoneNumber) {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
  } else if (typeof phoneNumber !== 'string') {
    errors.push({ field: 'phoneNumber', message: 'Phone number must be a string' });
  } else if (phoneNumber.trim().length < 10) {
    errors.push({ field: 'phoneNumber', message: 'Phone number must be at least 10 characters long' });
  } else if (phoneNumber.trim().length > 15) {
    errors.push({ field: 'phoneNumber', message: 'Phone number must not exceed 15 characters' });
  } else if (!require('../../../utils/phone').normalisePhone(phoneNumber)) {
    errors.push({field:'phoneNumber',message:require('../../../utils/phone').PHONE_ERROR});
  }
}

/**
 * Validates store name field.
 *
 * @param {string} storeName - The store name value to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateStoreNameField(storeName, errors) {
  if (!storeName) {
    errors.push({ field: 'storeName', message: 'Store name is required' });
  } else if (typeof storeName !== 'string') {
    errors.push({ field: 'storeName', message: 'Store name must be a string' });
  } else if (storeName.trim().length < 2) {
    errors.push({ field: 'storeName', message: 'Store name must be at least 2 characters long' });
  } else if (storeName.trim().length > 100) {
    errors.push({ field: 'storeName', message: 'Store name must not exceed 100 characters' });
  }
}

/**
 * Validates seller registration data.
 *
 * This function performs comprehensive validation on the seller registration
 * data to ensure all required fields are present and properly formatted.
 * It checks for required fields, email format, password strength, and
 * phone number format.
 *
 * Validation Rules:
 * - firstName: Required, string, 2-50 characters
 * - lastName: Optional, string, 2-50 characters (if provided)
 * - email: Required, valid email format, 3-254 characters
 * - password: Required, string, minimum 6 characters
 * - phoneNumber: Required, string, 10-15 characters
 * - storeName: Required, string, 2-100 characters
 *
 * @param {Object} data - The registration data to validate
 * @param {string} data.firstName - Seller's first name
 * @param {string} [data.lastName] - Seller's last name (optional)
 * @param {string} data.email - Seller's email address
 * @param {string} data.password - Seller's password
 * @param {string} data.phoneNumber - Seller's phone number
 * @param {string} data.storeName - Seller's store name
 * @throws {ValidationError} If validation fails (contains all validation errors)
 */
function validateRegisterData(data) {
  const errors = [];

  // Validate all fields using helper functions
  validateNameField(data.firstName, 'firstName', errors);
  validateOptionalNameField(data.lastName, 'lastName', errors); // lastName is optional
  validateEmailField(data.email, errors);
  validatePasswordField(data.password, errors);
  validatePhoneNumberField(data.phoneNumber, errors);
  validateStoreNameField(data.storeName, errors);

  // If there are validation errors, throw them
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateRegisterData
};
