/**
 * Get Wishlist Validator
 *
 * This validator handles input validation for retrieving a buyer's wishlist.
 * It provides functionality to:
 * - Validate buyer ID format and structure
 * - Ensure buyer ID is provided and properly formatted
 * - Validate MongoDB ObjectId format requirements
 * - Verify buyer existence in database
 * - Prevent unauthorized access to wishlists
 * - Maintain consistent validation standards
 *
 * The validator ensures that wishlist retrieval requests are properly
 * formatted and authenticated to prevent unauthorized access to user wishlists.
 *
 * @module getWishlistValidator
 */

const mongoose = require('mongoose');
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');

/**
 * Validate buyer ID format.
 * 
 * This function validates the buyer ID to ensure it's properly formatted
 * according to MongoDB ObjectId requirements.
 *
 * Business Logic:
 * - Checks if buyer ID is provided (required parameter)
 * - Validates MongoDB ObjectId format
 * - Prevents invalid ID format requests
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
async function validateBuyerId(buyerId, errors) {
  // Check if buyer ID is provided (required parameter)
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    // Validate MongoDB ObjectId format
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
  }
}

/**
 * Validate that buyer exists.
 * 
 * This function verifies that the buyer exists in the database after
 * format validation has passed to ensure data integrity.
 *
 * Business Logic:
 * - Queries database for buyer existence
 * - Prevents access to non-existent buyers
 * - Ensures data integrity and security
 * - Collects validation errors for reporting
 *
 * @param {string} buyerId - The buyer ID to validate existence
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * await validateBuyerExists("507f1f77bcf86cd799439011", errors); // Valid if exists
 * await validateBuyerExists("507f1f77bcf86cd799439012", errors); // Invalid if not exists
 */
async function validateBuyerExists(buyerId, errors) {
  // Query database to check if buyer exists
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    errors.push({ field: 'buyerId', message: 'Buyer not found' });
  }
}

/**
 * Validate get wishlist data.
 * 
 * This function orchestrates the complete validation process for wishlist
 * retrieval requests, ensuring the buyer ID meets all requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate buyer ID format (first validation step)
 * 3. If format validation passes, check buyer existence
 * 4. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Buyer ID validation prevents unauthorized access
 * - MongoDB ObjectId validation ensures data integrity
 * - Buyer existence verification prevents access to non-existent users
 * - Two-step validation process ensures efficiency
 * - Error collection provides comprehensive feedback
 *
 * @param {string} buyerId - The buyer's ID to validate
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid request
 * await validateGetWishlistData("507f1f77bcf86cd799439011");
 * 
 * // Invalid request - will throw ValidationError
 * await validateGetWishlistData("invalid-id");
 */
async function validateGetWishlistData(buyerId) {
  // Initialize error collection array
  const errors = [];

  // Step 1: First validate format
  // This ensures the buyer ID is properly formatted before database queries
  await validateBuyerId(buyerId, errors);

  // Step 2: If format validation passes, then check existence
  // This prevents unnecessary database queries for invalid IDs
  if (errors.length === 0) {
    await validateBuyerExists(buyerId, errors);
  }

  // If any validation errors were found, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateGetWishlistData
}; 