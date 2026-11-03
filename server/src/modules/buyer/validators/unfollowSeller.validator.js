/**
 * Unfollow Seller Validator
 *
 * This validator handles input validation for unfollowing a seller by a buyer.
 * It provides functionality to:
 * - Validate buyer ID format and structure
 * - Validate seller ID format and structure
 * - Ensure both IDs are provided and properly formatted
 * - Verify buyer and seller existence in database
 * - Validate MongoDB ObjectId format requirements
 * - Maintain consistent validation standards
 *
 * The validator ensures that unfollow requests are properly formatted and
 * authenticated to prevent unauthorized unfollow operations.
 *
 * @module unfollowSellerValidator
 */

const mongoose = require('mongoose');
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');
const Seller = require('../../../models/Seller');

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
 * Validate seller ID format.
 *
 * This function validates the seller ID to ensure it's properly formatted
 * according to MongoDB ObjectId requirements.
 *
 * Business Logic:
 * - Checks if seller ID is provided (required parameter)
 * - Validates MongoDB ObjectId format
 * - Prevents invalid ID format requests
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
async function validateSellerId(sellerId, errors) {
  if (!sellerId) {
    errors.push({ field: 'sellerId', message: 'Seller ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    errors.push({ field: 'sellerId', message: 'Invalid seller ID format' });
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
 * - Prevents unfollow operations on non-existent buyers
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
 * Validate that seller exists.
 *
 * This function verifies that the seller exists in the database after
 * format validation has passed to ensure data integrity.
 *
 * Business Logic:
 * - Queries database for seller existence
 * - Prevents unfollow operations on non-existent sellers
 * - Ensures data integrity and security
 * - Collects validation errors for reporting
 *
 * @param {string} sellerId - The seller ID to validate existence
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * await validateSellerExists("507f1f77bcf86cd799439011", errors); // Valid if exists
 * await validateSellerExists("507f1f77bcf86cd799439012", errors); // Invalid if not exists
 */
async function validateSellerExists(sellerId, errors) {
  const seller = await Seller.findById(sellerId);
  if (!seller) {
    errors.push({ field: 'sellerId', message: 'Seller not found' });
  }
}

/**
 * Validate unfollow seller data.
 *
 * This function orchestrates the complete validation process for unfollow
 * requests, ensuring both buyer and seller meet all requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate buyer ID format (first validation step)
 * 3. Validate seller ID format (first validation step)
 * 4. If format validation passes, check buyer existence
 * 5. If format validation passes, check seller existence
 * 6. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Buyer ID validation prevents unauthorized access
 * - Seller ID validation prevents invalid operations
 * - MongoDB ObjectId validation ensures data integrity
 * - Buyer/seller existence verification prevents operations on non-existent entities
 * - Two-step validation process ensures efficiency
 * - Error collection provides comprehensive feedback
 *
 * @param {string} buyerId - The buyer's ID to validate
 * @param {string} sellerId - The seller's ID to unfollow
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid request
 * await validateUnfollowSellerData("507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012");
 * 
 * // Invalid request - will throw ValidationError
 * await validateUnfollowSellerData("invalid-id", "invalid-id");
 */
async function validateUnfollowSellerData(buyerId, sellerId) {
  // Initialize error collection array
  const errors = [];

  // Step 1: First validate format
  // This ensures the IDs are properly formatted before database queries
  await validateBuyerId(buyerId, errors);
  await validateSellerId(sellerId, errors);

  // Step 2: If format validation passes, then check existence
  // This prevents unnecessary database queries for invalid IDs
  if (errors.length === 0) {
    await validateBuyerExists(buyerId, errors);
    await validateSellerExists(sellerId, errors);
  }

  // If any validation errors were found, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateUnfollowSellerData
}; 