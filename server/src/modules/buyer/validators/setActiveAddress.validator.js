/**
 * Set Active Address Validator
 *
 * This validator handles validation for setting a shipping address as active.
 * It provides comprehensive input validation to ensure data integrity and
 * proper address activation functionality.
 *
 * The validator ensures that:
 * - Address ID format is valid
 * - Buyer ID format is valid
 * - Required fields are present
 * - Data types are correct
 * - Input sanitization is applied
 *
 * Validation Features:
 * - Comprehensive input validation
 * - Data type validation
 * - Format validation for IDs
 * - Required field validation
 * - Input sanitization
 * - Error message generation
 *
 * @module setActiveAddressValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates MongoDB ObjectId format
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid ObjectId format
 */
function isValidObjectId(id) {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
}

/**
 * Validates the set active address request data.
 *
 * This function performs comprehensive validation on the request data
 * to ensure all required fields are present and properly formatted.
 *
 * Validation Rules:
 * - addressId: Required, must be a valid MongoDB ObjectId
 * - buyerId: Required, must be a valid MongoDB ObjectId
 *
 * Error Handling:
 * - Collects all validation errors
 * - Throws ValidationError with detailed error messages
 * - Provides field-specific error information
 *
 * @param {Object} data - The request data to validate
 * @param {string} data.addressId - The address ID to set as active
 * @param {string} data.buyerId - The buyer's ID
 * @throws {ValidationError} If validation fails
 *
 * @example
 * // Valid data
 * await validateSetActiveAddressData({
 *   addressId: '507f1f77bcf86cd799439011',
 *   buyerId: '507f1f77bcf86cd799439012'
 * });
 * // No error thrown
 *
 * @example
 * // Invalid data - missing addressId
 * try {
 *   await validateSetActiveAddressData({
 *     buyerId: '507f1f77bcf86cd799439012'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function validateSetActiveAddressData(data) {
  const errors = [];

  // Validate addressId
  if (!data.addressId) {
    errors.push({ field: 'addressId', message: 'Address ID is required' });
  } else if (typeof data.addressId !== 'string') {
    errors.push({ field: 'addressId', message: 'Address ID must be a string' });
  } else if (!isValidObjectId(data.addressId)) {
    errors.push({ field: 'addressId', message: 'Address ID must be a valid MongoDB ObjectId' });
  }

  // Validate buyerId
  if (!data.buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (typeof data.buyerId !== 'string') {
    errors.push({ field: 'buyerId', message: 'Buyer ID must be a string' });
  } else if (!isValidObjectId(data.buyerId)) {
    errors.push({ field: 'buyerId', message: 'Buyer ID must be a valid MongoDB ObjectId' });
  }

  // If there are validation errors, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateSetActiveAddressData,
};
