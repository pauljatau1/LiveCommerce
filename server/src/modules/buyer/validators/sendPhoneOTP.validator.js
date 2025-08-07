const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate phone number format for OTP sending.
 * 
 * @param {string} phoneNumber - The phone number to validate
 * @param {Array} errors - Array to collect validation errors
 */
async function validatePhoneNumberFormat(phoneNumber, errors) {
  if (!phoneNumber) {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
  } else {
    // Validate phone number format (basic validation)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      errors.push({ 
        field: 'phoneNumber', 
        message: 'Invalid phone number format. Please include country code (e.g., +1234567890)' 
      });
    }
  }
}

/**
 * Validate phone number format for OTP sending.
 * 
 * @param {string} phoneNumber - The phone number to validate
 * @throws {ValidationError} If validation fails
 */
async function validatePhoneNumberFormatAndThrow(phoneNumber) {
  const errors = [];
  
  await validatePhoneNumberFormat(phoneNumber, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validatePhoneNumberFormat,
  validatePhoneNumberFormatAndThrow
}; 