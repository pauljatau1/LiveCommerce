/**
 * Remove From Wishlist Validator
 *
 * This validator handles input validation for removing products from a buyer's wishlist.
 * It provides functionality to:
 * - Validate buyer ID format and structure
 * - Validate product ID format and structure
 * - Ensure both IDs are provided and properly formatted
 * - Verify buyer existence in database
 * - Validate MongoDB ObjectId format requirements
 * - Maintain consistent validation standards
 *
 * The validator ensures that remove from wishlist requests are properly formatted and
 * authenticated to prevent unauthorized operations.
 *
 * @module removeFromWishlistValidator
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
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
  }
}

/**
 * Validate product ID format.
 *
 * This function validates the product ID to ensure it's properly formatted
 * according to MongoDB ObjectId requirements.
 *
 * Business Logic:
 * - Checks if product ID is provided (required parameter)
 * - Validates MongoDB ObjectId format
 * - Prevents invalid ID format requests
 * - Collects validation errors for reporting
 *
 * @param {string} productId - The product ID to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateProductId("507f1f77bcf86cd799439011", errors); // Valid ObjectId
 * validateProductId("invalid-id", errors); // Invalid, adds error
 * validateProductId("", errors); // Invalid, adds error
 */
async function validateProductId(productId, errors) {
  if (!productId) {
    errors.push({ field: 'productId', message: 'Product ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(productId)) {
    errors.push({ field: 'productId', message: 'Invalid product ID format' });
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
 * - Prevents remove from wishlist operations on non-existent buyers
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
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    errors.push({ field: 'buyerId', message: 'Buyer not found' });
  }
}

/**
 * Validate remove from wishlist data.
 *
 * This function orchestrates the complete validation process for remove from wishlist
 * requests, ensuring both buyer and product meet all requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate buyer ID format (first validation step)
 * 3. Validate product ID format (first validation step)
 * 4. If format validation passes, check buyer existence
 * 5. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Buyer ID validation prevents unauthorized access
 * - Product ID validation prevents invalid operations
 * - MongoDB ObjectId validation ensures data integrity
 * - Buyer existence verification prevents operations on non-existent entities
 * - Two-step validation process ensures efficiency
 * - Error collection provides comprehensive feedback
 *
 * @param {string} buyerId - The buyer's ID to validate
 * @param {string} productId - The product's ID to remove from wishlist
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid request
 * await validateRemoveFromWishlistData("507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012");
 * 
 * // Invalid request - will throw ValidationError
 * await validateRemoveFromWishlistData("invalid-id", "invalid-id");
 */
async function validateRemoveFromWishlistData(buyerId, productId) {
  // Initialize error collection array
  const errors = [];

  // Step 1: First validate format
  // This ensures the IDs are properly formatted before database queries
  await validateBuyerId(buyerId, errors);
  await validateProductId(productId, errors);

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
  validateRemoveFromWishlistData
}; 