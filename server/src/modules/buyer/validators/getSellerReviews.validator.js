/**
 * Get Seller Reviews Validator
 *
 * This validator handles input validation for retrieving seller reviews.
 * It provides functionality to:
 * - Validate seller ID format and structure
 * - Validate sort parameters for review ordering
 * - Ensure seller ID is provided and properly formatted
 * - Prevent invalid sort options
 * - Maintain consistent validation standards
 *
 * The validator ensures that seller review retrieval requests are properly
 * formatted and contain valid parameters for sorting and filtering.
 *
 * @module getSellerReviewsValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates seller ID.
 *
 * This function validates the seller ID to ensure it's properly formatted
 * and provided for review retrieval requests.
 *
 * Business Logic:
 * - Checks if seller ID is provided (required parameter)
 * - Validates parameter type and format
 * - Ensures seller ID is not empty or whitespace
 * - Prevents invalid seller ID requests
 * - Collects validation errors for reporting
 *
 * @param {string} sellerId - The seller ID to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateSellerId("507f1f77bcf86cd799439011", errors); // Valid
 * validateSellerId("", errors); // Invalid, adds error
 * validateSellerId(null, errors); // Invalid, adds error
 */
function validateSellerId(sellerId, errors) {
  // Check if sellerId is provided and is a string
  if (!sellerId || typeof sellerId !== 'string') {
    errors.push({ field: 'sellerId', message: 'Seller ID is required and must be a string' });
  }
}

/**
 * Validates sort parameter.
 *
 * This function validates the sort parameter to ensure it's one of the
 * allowed values for sorting seller reviews.
 *
 * Business Logic:
 * - Defines valid sort options for seller reviews
 * - Allows empty string (defaults to 'recent' in service)
 * - Validates only if sort is provided and not empty
 * - Prevents invalid sort options
 * - Collects validation errors for reporting
 *
 * @param {string} sort - The sort parameter to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateSortParam("recent", errors); // Valid
 * validateSortParam("rating-high", errors); // Valid
 * validateSortParam("invalid-sort", errors); // Invalid, adds error
 * validateSortParam("", errors); // Valid (empty string allowed)
 */
function validateSortParam(sort, errors) {
  // Define valid sort options for seller reviews
  const validSortOptions = ['recent', 'rating-high', 'rating-low'];
  
  // Allow empty string (defaults to 'recent' in service)
  // Only validate if sort is provided and not empty
  if (sort && sort !== '' && !validSortOptions.includes(sort)) {
    errors.push({ field: 'sort', message: 'Sort must be one of: recent, rating-high, rating-low' });
  }
}

/**
 * Validates get seller reviews data.
 *
 * This function orchestrates the complete validation process for seller
 * review retrieval requests, ensuring all parameters meet validation requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate seller ID format and structure
 * 3. Validate sort parameter if provided
 * 4. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Seller ID validation prevents unauthorized access
 * - Type validation ensures data integrity
 * - Sort parameter validation prevents injection attacks
 * - Error collection provides comprehensive feedback
 *
 * @param {string} sellerId - The seller ID to validate
 * @param {Object} params - Request parameters containing sort and pagination info
 * @param {string} params.sort - Sort parameter for review ordering (optional)
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid request
 * await validateGetSellerReviewsData("507f1f77bcf86cd799439011", { sort: "recent" });
 * 
 * // Invalid request - will throw ValidationError
 * await validateGetSellerReviewsData("", { sort: "invalid-sort" });
 */
async function validateGetSellerReviewsData(sellerId, params) {
  // Initialize error collection array
  const errors = [];

  // Step 1: Validate the seller ID first
  // This ensures the seller ID is properly formatted
  validateSellerId(sellerId, errors);
  
  // Step 2: Validate the sort parameter if provided
  // This ensures sort options are valid
  validateSortParam(params.sort, errors);

  // If any validation errors were found, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateSellerId,
  validateSortParam,
  validateGetSellerReviewsData
}; 