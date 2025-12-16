/**
 * Verify Phone Validator
 *
 * This validator handles validation for phone verification OTP verification requests.
 * It ensures that phone numbers and OTP codes are properly formatted and valid.
 *
 * @module verifyPhoneValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');
const sellerRepository = require('../repositories/seller.repository');

/**
 * Validates phone number format.
 *
 * This function checks if the phone number is in a valid international format.
 *
 * Validation Rules:
 * - Phone number must be present
 * - Phone number must be in international format (e.g., +23490126727)
 * - Phone number must match E.164 format (starts with +, followed by country code and number)
 *
 * @param {string} phoneNumber - The phone number to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePhoneNumberFormat(phoneNumber, errors) {
  if (!phoneNumber) {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
    return;
  }

  // Validate phone number format (E.164 international format)
  // Must start with +, followed by country code (1-3 digits), then number (7-14 digits)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    errors.push({
      field: 'phoneNumber',
      message: 'Invalid phone number format. Please include country code (e.g., +23490126727)'
    });
  }
}

/**
 * Validates OTP format.
 *
 * This function checks if the OTP is in the correct format (4-digit numeric).
 *
 * Validation Rules:
 * - OTP must be present
 * - OTP must be exactly 4 digits
 * - OTP must be numeric only
 *
 * @param {string} otp - The OTP to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateOTPFormat(otp, errors) {
  if (!otp) {
    errors.push({ field: 'otp', message: 'OTP is required' });
    return;
  }

  // Validate OTP format (4-digit numeric)
  const otpRegex = /^\d{4}$/;
  if (!otpRegex.test(otp.toString())) {
    errors.push({
      field: 'otp',
      message: 'Invalid OTP format. OTP must be a 4-digit number'
    });
  }
}

/**
 * Validates verify phone request data.
 *
 * This function performs comprehensive validation on the phone verification
 * request data to ensure all required fields are present and properly formatted.
 *
 * Validation Process:
 * 1. Validates phone number format
 * 2. Validates OTP format
 * 3. Collects all validation errors
 * 4. Throws ValidationError if any errors are found
 *
 * @param {Object} data - The phone verification request data
 * @param {string} data.phoneNumber - The seller's phone number (international format)
 * @param {string} data.otp - The 4-digit OTP code
 * @returns {Promise<void>} Resolves if validation passes
 * @throws {ValidationError} If validation fails
 */
async function validateVerifyPhoneData(data) {
  const errors = [];

  // Validate phone number format
  validatePhoneNumberFormat(data.phoneNumber, errors);

  // Validate OTP format
  validateOTPFormat(data.otp, errors);

  // If there are any validation errors, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateVerifyPhoneData
};

