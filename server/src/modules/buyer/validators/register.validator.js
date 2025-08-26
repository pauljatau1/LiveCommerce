/**
 * Register Validator
 *
 * This validator handles input validation for buyer registration operations.
 * It provides functionality to:
 * - Validate all required registration fields (firstName, lastName, email, phoneNumber, username, password)
 * - Check for XSS vulnerabilities in text fields
 * - Validate email format and uniqueness
 * - Validate phone number uniqueness
 * - Validate username format and uniqueness
 * - Ensure data integrity and security standards
 * - Maintain consistent validation patterns
 *
 * The validator ensures that registration requests are properly formatted
 * and contain valid data to prevent security vulnerabilities and maintain
 * data integrity in the buyer registration process.
 *
 * @module registerValidator
 */

const validator = require('validator');
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');
const { validateXSS, validateEmailFormat } = require('../../../utils/validator');

/**
 * Validate the password field.
 *
 * This function validates the password field to ensure it meets basic
 * requirements for buyer registration.
 *
 * Business Logic:
 * - Checks if password is provided (required field)
 * - Ensures password is not empty or null
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - Required field validation prevents null passwords
 * - Basic validation ensures password presence
 * - Error collection provides clear feedback
 *
 * @param {string} password - The password to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * await validatePassword("mypassword123", errors); // Valid
 * await validatePassword("", errors); // Invalid, adds error
 * await validatePassword(null, errors); // Invalid, adds error
 */
async function validatePassword(password, errors) {
  // Step 1: Check if password is provided (required field validation)
  // This ensures the password field is not empty or null
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }
}

/**
 * Validate the username field.
 *
 * This function validates the username field to ensure it meets format
 * requirements and is unique across all buyers.
 *
 * Business Logic:
 * - Checks if username is provided (required field)
 * - Validates username format (no spaces allowed)
 * - Checks username uniqueness in database
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - Required field validation prevents null usernames
 * - Format validation prevents problematic usernames
 * - Uniqueness validation prevents duplicate accounts
 * - Database query validation maintains data integrity
 *
 * @param {string} username - The username to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * await validateUsername("john_doe", errors); // Valid
 * await validateUsername("john doe", errors); // Invalid, adds error (contains space)
 * await validateUsername("", errors); // Invalid, adds error
 */
async function validateUsername(username, errors) {
  // Step 1: Check if username is provided (required field validation)
  // This ensures the username field is not empty or null
  if (!username) {
    errors.push({ field: 'username', message: 'Username is required' });
  } else {
    // Step 2: Validate username format (no spaces allowed)
    // This prevents problematic usernames that could cause issues
    if (username.includes(' ')) {
      errors.push({ field: 'username', message: 'Username cannot contain spaces' });
    }

    // Step 3: Check username uniqueness in database
    // This ensures no duplicate usernames exist across all buyers
    const results = await buyerRepository.findAll({ "username": username });
    if (results.length > 0) {
      errors.push({ field: 'username', message: 'Username is already registered' });
    }
  }
}

/**
 * Validate the phoneNumber field.
 *
 * This function validates the phone number field to ensure it is provided
 * and unique across all buyers.
 *
 * Business Logic:
 * - Checks if phone number is provided (required field)
 * - Validates phone number uniqueness in database
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - Required field validation prevents null phone numbers
 * - Uniqueness validation prevents duplicate accounts
 * - Database query validation maintains data integrity
 *
 * @param {string} phoneNumber - The phone number to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * await validatePhoneNumber("+1234567890", errors); // Valid
 * await validatePhoneNumber("", errors); // Invalid, adds error
 * await validatePhoneNumber(null, errors); // Invalid, adds error
 */
async function validatePhoneNumber(phoneNumber, errors) {
  // Step 1: Check if phone number is provided (required field validation)
  // This ensures the phone number field is not empty or null
  if (!phoneNumber) {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
  } else {
    // Step 2: Check phone number uniqueness in database
    // This ensures no duplicate phone numbers exist across all buyers
    const results = await buyerRepository.findAll({ "phoneNumber": phoneNumber });
    if (results.length > 0) {
      errors.push({ field: 'phoneNumber', message: 'Phone number is already registered' });
    }
  }
}

/**
 * Validate email.
 *
 * This function validates the email field to ensure it meets format requirements
 * and is unique across all buyers.
 *
 * Business Logic:
 * - Checks if email is provided (required field)
 * - Validates email format using utility function
 * - Checks email uniqueness in database
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - Required field validation prevents null emails
 * - Format validation prevents invalid email addresses
 * - Uniqueness validation prevents duplicate accounts
 * - Database query validation maintains data integrity
 *
 * @param {string} email - The email to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * await validateEmail("user@example.com", errors); // Valid
 * await validateEmail("invalid-email", errors); // Invalid, adds format error
 * await validateEmail("", errors); // Invalid, adds error
 */
async function validateEmail(email, errors) {
  // Step 1: Check if email is provided (required field validation)
  // This ensures the email field is not empty or null
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else {
    // Step 2: Validate email format using utility function
    // This ensures the email follows proper email format standards
    const emailFormatError = validateEmailFormat(email, 'email');
    if (emailFormatError) {
      errors.push(emailFormatError);
    }

    // Step 3: Check email uniqueness in database
    // This ensures no duplicate emails exist across all buyers
    const results = await buyerRepository.findAll({ "email": email });
    if (results.length > 0) {
      errors.push({ field: 'email', message: 'Email is already registered' });
    }
  }
}

/**
 * Validate the lastName field.
 *
 * This function validates the last name field to ensure it meets security
 * and format requirements for buyer registration.
 *
 * Business Logic:
 * - Checks if last name is provided (required field)
 * - Validates against XSS vulnerabilities
 * - Checks maximum length constraints
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - Required field validation prevents null last names
 * - XSS validation prevents malicious script injection
 * - Length validation prevents oversized data
 * - Error collection provides clear feedback
 *
 * @param {string} lastName - The last name to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * await validateLastName("Smith", errors); // Valid
 * await validateLastName("<script>alert('xss')</script>", errors); // Invalid, adds XSS error
 * await validateLastName("", errors); // Invalid, adds error
 */
async function validateLastName(lastName, errors) {
  // Step 1: Check if last name is provided (required field validation)
  // This ensures the last name field is not empty or null
  if (!lastName) {
    errors.push({ field: 'lastName', message: 'lastName is required' });
  } else {
    // Step 2: Validate against XSS vulnerabilities
    // This prevents malicious script injection in the last name field
    const xssError = validateXSS(lastName, 'lastName');
    if (xssError) {
      errors.push(xssError);
    }

    // Step 3: Check maximum length constraints
    // This prevents oversized data that could cause database issues
    if (lastName.length > 100) {
      errors.push({ field: 'lastName', message: 'lastName must not exceed 100 characters' });
    }
  }
}

/**
 * Validate the firstName field.
 *
 * This function validates the first name field to ensure it meets security
 * and format requirements for buyer registration.
 *
 * Business Logic:
 * - Checks if first name is provided (required field)
 * - Validates against XSS vulnerabilities
 * - Checks maximum length constraints
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - Required field validation prevents null first names
 * - XSS validation prevents malicious script injection
 * - Length validation prevents oversized data
 * - Error collection provides clear feedback
 *
 * @param {string} firstName - The first name to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * await validateFirstName("John", errors); // Valid
 * await validateFirstName("<script>alert('xss')</script>", errors); // Invalid, adds XSS error
 * await validateFirstName("", errors); // Invalid, adds error
 */
async function validateFirstName(firstName, errors) {
  // Step 1: Check if first name is provided (required field validation)
  // This ensures the first name field is not empty or null
  if (!firstName) {
    errors.push({ field: 'firstName', message: 'firstName is required' });
  } else {
    // Step 2: Validate against XSS vulnerabilities
    // This prevents malicious script injection in the first name field
    const xssError = validateXSS(firstName, 'firstName');
    if (xssError) {
      errors.push(xssError);
    }

    // Step 3: Check maximum length constraints
    // This prevents oversized data that could cause database issues
    if (firstName.length > 100) {
      errors.push({ field: 'firstName', message: 'firstName must not exceed 100 characters' });
    }
  }
}

/**
 * Validate all user data before creation.
 *
 * This function orchestrates the complete validation process for buyer
 * registration, ensuring all required fields meet validation requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate first name (required, XSS, length)
 * 3. Validate last name (required, XSS, length)
 * 4. Validate email (required, format, uniqueness)
 * 5. Validate phone number (required, uniqueness)
 * 6. Validate username (required, format, uniqueness)
 * 7. Validate password (required)
 * 8. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Comprehensive field validation prevents data corruption
 * - XSS validation prevents malicious script injection
 * - Uniqueness validation prevents duplicate accounts
 * - Format validation ensures data consistency
 * - Error collection provides comprehensive feedback
 *
 * @param {Object} data - User input data to validate
 * @param {string} data.firstName - The first name to validate
 * @param {string} data.lastName - The last name to validate
 * @param {string} data.email - The email to validate
 * @param {string} data.phoneNumber - The phone number to validate
 * @param {string} data.username - The username to validate
 * @param {string} data.password - The password to validate
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid registration data
 * await validateRegisterData({
 *   firstName: "John",
 *   lastName: "Smith",
 *   email: "john@example.com",
 *   phoneNumber: "+1234567890",
 *   username: "john_smith",
 *   password: "securepassword123"
 * });
 *
 * // Invalid registration data - will throw ValidationError
 * await validateRegisterData({
 *   firstName: "",
 *   lastName: "",
 *   email: "invalid-email",
 *   phoneNumber: "",
 *   username: "",
 *   password: ""
 * });
 */
async function validateRegisterData(data) {
  // Step 1: Initialize error collection array
  // This will collect all validation errors for comprehensive reporting
  const errors = [];

  // Step 2: Validate first name (required, XSS, length)
  // This ensures the first name meets all security and format requirements
  await validateFirstName(data.firstName, errors);

  // Step 3: Validate last name (required, XSS, length)
  // This ensures the last name meets all security and format requirements
  await validateLastName(data.lastName, errors);

  // Step 4: Validate email (required, format, uniqueness)
  // This ensures the email is valid and unique across all buyers
  await validateEmail(data.email, errors);

  // Step 5: Validate phone number (required, uniqueness)
  // This ensures the phone number is provided and unique across all buyers
  await validatePhoneNumber(data.phoneNumber, errors);

  // Step 6: Validate username (required, format, uniqueness)
  // This ensures the username meets format requirements and is unique
  await validateUsername(data.username, errors);

  // Step 7: Validate password (required)
  // This ensures the password field is provided
  await validatePassword(data.password, errors);

  // Step 8: Throw ValidationError if any validation fails
  // This provides comprehensive error feedback to the caller
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateRegisterData,
};