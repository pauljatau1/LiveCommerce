/**
 * Send Phone Verification Validator
 *
 * This validator handles validation for phone verification OTP sending requests.
 * It ensures that phone numbers are properly formatted and that the seller exists.
 *
 * @module sendPhoneVerificationValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');
const sellerRepository = require('../repositories/seller.repository');

/**
 * Validates phone number format and existence.
 *
 * This function checks if the phone number is in a valid international format
 * and verifies that a seller with this phone number exists in the system.
 *
 * Validation Rules:
 * - Phone number must be present
 * - Phone number must be in international format (e.g., +23490126727)
 * - Phone number must match E.164 format (starts with +, followed by country code and number)
 * - Seller must exist with the provided phone number
 *
 * @param {string} phoneNumber - The phone number to validate
 * @param {Array} errors - Array to collect validation errors
 * @returns {Promise<void>} Resolves when validation is complete
 */
async function validatePhoneNumberFormat(phoneNumber, errors) {
  if (!phoneNumber) {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
    return;
  }

  // Validate phone number format (E.164 international format)
  // Must start with +, followed by country code (1-3 digits), then number (7-14 digits)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!require('../../../utils/phone').normalisePhone(phoneNumber)) {
    errors.push({
      field: 'phoneNumber',
      message: 'Enter an 11-digit phone number starting with 0, e.g. 0803 123 4567.'
    });
    return;
  }

  // Check if seller exists with this phone number
  const existingSeller = await sellerRepository.findByPhoneNumber(phoneNumber);
  if (!existingSeller) {
    errors.push({ field: 'phoneNumber', message: 'No seller account found with this phone number' });
  }
}

/**
 * Validates send phone verification request data.
 *
 * This function performs comprehensive validation on the phone verification
 * request data to ensure all required fields are present and properly formatted.
 *
 * Validation Process:
 * 1. Validates phone number format and existence
 * 2. Collects all validation errors
 * 3. Throws ValidationError if any errors are found
 *
 * @param {Object} data - The phone verification request data
 * @param {string} data.phoneNumber - The seller's phone number (international format)
 * @returns {Promise<void>} Resolves if validation passes
 * @throws {ValidationError} If validation fails
 */
async function validateSendPhoneVerificationData(data) {
  const errors = [];

  // Validate phone number format and existence
  await validatePhoneNumberFormat(data.phoneNumber, errors);

  // If there are any validation errors, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateSendPhoneVerificationData
};

