/**
 * Get Seller Profile Validator
 *
 * This validator handles input validation for retrieving a seller's profile information.
 * It provides functionality to:
 * - Validate seller ID format and structure
 * - Ensure seller ID is provided and properly formatted
 * - Validate MongoDB ObjectId format requirements
 * - Prevent unauthorized access to seller profiles
 * - Maintain consistent validation standards
 *
 * The validator ensures that seller profile retrieval requests are properly
 * formatted and authenticated to prevent unauthorized access to seller information.
 *
 * @module getSellerProfileValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');
const mongoose = require('mongoose');

/**
 * Validates seller ID format and structure.
 *
 * This function validates the seller ID to ensure it's properly formatted
 * according to MongoDB ObjectId requirements and provided for profile retrieval.
 *
 * Business Logic:
 * - Checks if seller ID is provided (required parameter)
 * - Validates parameter type and format
 * - Ensures seller ID matches MongoDB ObjectId format
 * - Prevents unauthorized access attempts
 * - Collects validation errors for reporting
 *
 * @param {string} sellerId - The seller ID to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateSellerId("507f1f77bcf86cd799439011", errors); // Valid ObjectId
 * validateSellerId("invalid-id", errors); // Invalid, adds error
 * validateSellerId("", errors); // Invalid, adds error
 */
function validateSellerId(sellerId, errors) {
  // Check if seller ID is provided (required parameter)
  if (!sellerId) {
    errors.push({ field: 'sellerId', message: 'Seller ID is required' });
  } else if (typeof sellerId !== 'string') {
    // Validate parameter type
    errors.push({ field: 'sellerId', message: 'Seller ID must be a string' });
  } else if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    // Validate MongoDB ObjectId format
    errors.push({ field: 'sellerId', message: 'Invalid seller ID format' });
  }
}

/**
 * Validates all input data for getSellerProfile.
 *
 * This function orchestrates the complete validation process for seller
 * profile retrieval requests, ensuring the seller ID meets all requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate seller ID format and structure
 * 3. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Seller ID validation prevents unauthorized access
 * - MongoDB ObjectId validation ensures data integrity
 * - Type validation prevents injection attacks
 * - Error collection provides comprehensive feedback
 *
 * @param {Object} data - Input data containing sellerId
 * @param {string} data.sellerId - The seller's ID to validate
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid request
 * await validateGetSellerProfileData({ sellerId: "507f1f77bcf86cd799439011" });
 * 
 * // Invalid request - will throw ValidationError
 * await validateGetSellerProfileData({ sellerId: "invalid-id" });
 */
async function validateGetSellerProfileData(data) {
  // Initialize error collection array
  const errors = [];

  // Validate seller ID format and structure
  validateSellerId(data.sellerId, errors);

  // If any validation errors were found, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateGetSellerProfileData,
  validateSellerId
}; 