/**
 * Add Business Information Validator
 *
 * This validator handles validation for business information data.
 * It ensures that all required fields are present and valid before
 * processing business information updates.
 *
 * Validation Rules:
 * - businessEmail: Required, must be a valid email format
 * - businessNumber: Required, must be a valid phone number format
 * - businessAddress: Required, must be a valid address object
 * - businessAddress.country: Required, must be a non-empty string
 * - businessAddress.state: Required, must be a non-empty string
 * - businessAddress.city: Required, must be a non-empty string
 * - businessAddress.addressLine1: Required, must be a non-empty string
 * - businessAddress.addressLine2: Optional, must be a string if provided
 * - businessAddress.zipCode: Required, must be a non-empty string
 *
 * @module addBusinessInformationValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');
const { normalizePhoneNumber } = require('../../../helpers/formatters');

/**
 * Validates business information data.
 *
 * This function validates the business information data structure
 * and ensures all required fields are present and valid.
 *
 * Validation Process:
 * - Checks for required fields presence
 * - Validates email format for business email
 * - Validates phone number format for business number
 * - Validates business address structure and required fields
 * - Collects all validation errors
 * - Throws validation error if any issues found
 *
 * @param {Object} data - The business information data to validate
 * @param {string} data.businessEmail - The business email address
 * @param {string} data.businessNumber - The business phone number
 * @param {Object} data.businessAddress - The business address details
 * @param {string} data.businessAddress.country - The country
 * @param {string} data.businessAddress.state - The state/province
 * @param {string} data.businessAddress.city - The city
 * @param {string} data.businessAddress.addressLine1 - The primary address line
 * @param {string} [data.businessAddress.addressLine2] - The secondary address line
 * @param {string} data.businessAddress.zipCode - The postal/zip code
 * @throws {Error} If validation fails with detailed error messages
 */
function validateAddBusinessInformationData(data) {
  const errors = [];

  // Step 1: Check if data is null or undefined
  if (!data) {
    addNullDataErrors(errors);
    throwValidationError(errors);
    return;
  }

  // Step 2: Validate all business information fields
  validateBusinessEmail(data.businessEmail, errors);
  validateBusinessNumber(data.businessNumber, errors);
  validateBusinessAddressField(data.businessAddress, errors);

  // Step 3: Throw validation error if any issues found
  throwValidationError(errors);
}

/**
 * Adds validation errors for null or undefined data.
 *
 * @param {Array} errors - The errors array to append validation errors to
 */
function addNullDataErrors(errors) {
  errors.push({ field: 'businessEmail', message: 'Business email is required' });
  errors.push({ field: 'businessNumber', message: 'Business number is required' });
  errors.push({ field: 'businessAddress', message: 'Business address is required' });
}

/**
 * Throws validation error if any errors are found.
 *
 * @param {Array} errors - The errors array to check
 * @throws {Error} If validation fails with detailed error messages
 */
function throwValidationError(errors) {
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validates business email field.
 *
 * @param {string} businessEmail - The business email to validate
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateBusinessEmail(businessEmail, errors) {
  if (!businessEmail) {
    errors.push({ field: 'businessEmail', message: 'Business email is required' });
  } else if (!isValidEmail(businessEmail)) {
    errors.push({ field: 'businessEmail', message: 'Business email must be a valid email format' });
  }
}

/**
 * Validates business number field.
 * 
 * This function normalizes the phone number before validation to support
 * various input formats (e.g., "081", "8124634152", "+2348124634152").
 *
 * @param {string} businessNumber - The business number to validate
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateBusinessNumber(businessNumber, errors) {
  if (!businessNumber) {
    errors.push({ field: 'businessNumber', message: 'Business number is required' });
  } else {
    // Normalize the phone number first to support various input formats
    const normalizedNumber = normalizePhoneNumber(businessNumber);

    if (!isValidPhoneNumber(normalizedNumber)) {
      errors.push({ field: 'businessNumber', message: 'Business number must be a valid phone number format' });
    }
  }
}

/**
 * Validates business address field.
 *
 * @param {Object} businessAddress - The business address to validate
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateBusinessAddressField(businessAddress, errors) {
  if (!businessAddress) {
    errors.push({ field: 'businessAddress', message: 'Business address is required' });
  } else {
    validateBusinessAddress(businessAddress, errors);
  }
}

/**
 * Validates business address structure and fields.
 *
 * This function validates the business address object and ensures
 * all required address fields are present and valid.
 *
 * @param {Object} businessAddress - The business address object to validate
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateBusinessAddress(businessAddress, errors) {
  validateRequiredStringField(businessAddress.country, 'businessAddress.country', 'Country is required', errors);
  validateRequiredStringField(businessAddress.state, 'businessAddress.state', 'State is required', errors);
  validateRequiredStringField(businessAddress.city, 'businessAddress.city', 'City is required', errors);
  validateRequiredStringField(businessAddress.addressLine1, 'businessAddress.addressLine1', 'Address line 1 is required', errors);
  validateOptionalStringField(businessAddress.addressLine2, 'businessAddress.addressLine2', 'Address line 2 must be a string', errors);
  validateRequiredStringField(businessAddress.zipCode, 'businessAddress.zipCode', 'Zip code is required', errors);
}

/**
 * Validates a required string field.
 *
 * @param {string} value - The value to validate
 * @param {string} fieldName - The field name for error reporting
 * @param {string} errorMessage - The error message to use
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateRequiredStringField(value, fieldName, errorMessage, errors) {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    errors.push({ field: fieldName, message: errorMessage });
  }
}

/**
 * Validates an optional string field.
 *
 * @param {string} value - The value to validate
 * @param {string} fieldName - The field name for error reporting
 * @param {string} errorMessage - The error message to use
 * @param {Array} errors - The errors array to append validation errors to
 */
function validateOptionalStringField(value, fieldName, errorMessage, errors) {
  if (value && typeof value !== 'string') {
    errors.push({ field: fieldName, message: errorMessage });
  }
}

/**
 * Validates email format.
 *
 * This function checks if the provided email address
 * follows a valid email format pattern.
 *
 * @param {string} email - The email address to validate
 * @returns {boolean} True if email format is valid, false otherwise
 */
function isValidEmail(email) {
  // Step 1: Define email validation regex pattern
  // This pattern checks for basic email format requirements and prevents consecutive dots
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Step 2: Additional check for consecutive dots
  if (email.includes('..')) {
    return false;
  }

  // Step 3: Test email against regex pattern
  // This returns true if the email matches the valid format
  return emailRegex.test(email);
}

/**
 * Validates phone number format.
 *
 * This function checks if the provided phone number is in the normalized format.
 * The normalized format is a 10-digit number without leading zero (e.g., 8106430258).
 * 
 * Note: Phone numbers should be normalized before calling this function.
 * Use normalizePhoneNumber() from helpers/formatters.js to normalize first.
 *
 * @param {string} phoneNumber - The normalized phone number to validate
 * @returns {boolean} True if phone number format is valid, false otherwise
 */
function isValidPhoneNumber(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  // Validate normalized format: exactly 10 digits, starts with a digit 7-9
  // (Nigerian mobile numbers typically start with 7, 8, or 9)
  const normalizedPhoneRegex = /^[7-9]\d{9}$/;

  return normalizedPhoneRegex.test(phoneNumber);
}

module.exports = {
  validateAddBusinessInformationData
};
