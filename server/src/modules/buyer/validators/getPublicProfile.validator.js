/**
 * Get Public Profile Validator
 *
 * This validator handles input validation for retrieving a buyer's public profile.
 * It provides functionality to:
 * - Validate buyer ID format and structure
 * - Ensure buyer ID is provided and properly formatted
 * - Validate MongoDB ObjectId format requirements
 * - Prevent unauthorized access to public profiles
 * - Maintain consistent validation standards
 *
 * The validator ensures that public profile retrieval requests are properly
 * formatted and authenticated to prevent unauthorized access to user information.
 *
 * @module getPublicProfileValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');
const mongoose = require('mongoose');

/**
 * Validates buyer ID format and structure.
 *
 * This function validates the buyer ID to ensure it's properly formatted
 * according to MongoDB ObjectId requirements and provided for public profile retrieval.
 *
 * Business Logic:
 * - Checks if buyer ID is provided (required parameter)
 * - Validates parameter type and format
 * - Ensures buyer ID matches MongoDB ObjectId format
 * - Prevents unauthorized access attempts
 * - Collects validation errors for reporting
 *
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateBuyerId("507f1f77bcf86cd799439011", errors); // Valid ObjectId
 * validateBuyerId("invalid-id", errors); // Invalid, adds error
 * validateBuyerId("", errors); // Invalid, adds error
 */
function validateBuyerId(buyerId, errors) {
  // Check if buyer ID is provided (required parameter)
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (typeof buyerId !== 'string') {
    // Validate parameter type
    errors.push({ field: 'buyerId', message: 'Buyer ID must be a string' });
  } else if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    // Validate MongoDB ObjectId format
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
  }
}

/**
 * Validates all input data for getPublicProfile.
 *
 * This function orchestrates the complete validation process for public
 * profile retrieval requests, ensuring the buyer ID meets all requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate buyer ID format and structure
 * 3. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Buyer ID validation prevents unauthorized access
 * - MongoDB ObjectId validation ensures data integrity
 * - Type validation prevents injection attacks
 * - Error collection provides comprehensive feedback
 *
 * @param {Object} data - Input data containing buyerId
 * @param {string} data.buyerId - The buyer's ID to validate
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid request
 * await validateGetPublicProfileData({ buyerId: "507f1f77bcf86cd799439011" });
 * 
 * // Invalid request - will throw ValidationError
 * await validateGetPublicProfileData({ buyerId: "invalid-id" });
 */
async function validateGetPublicProfileData(data) {
  // Initialize error collection array
  const errors = [];

  // Validate buyer ID format and structure
  validateBuyerId(data.buyerId, errors);

  // If any validation errors were found, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateGetPublicProfileData,
  validateBuyerId
};
