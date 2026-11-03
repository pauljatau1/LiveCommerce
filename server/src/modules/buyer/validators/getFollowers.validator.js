/**
 * Get Followers Validator
 *
 * This validator handles input validation for retrieving a buyer's followers
 * with optional pagination parameters. It provides functionality to:
 * - Validate pagination parameters (page, limit)
 * - Ensure parameter types and ranges are correct
 * - Apply default values for missing parameters
 * - Prevent invalid pagination requests
 * - Maintain consistent validation standards
 *
 * The validator ensures that follower retrieval requests are properly formatted
 * and within acceptable bounds to prevent performance issues and data exposure.
 *
 * @module getFollowersValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates a single page parameter.
 *
 * This function validates the page parameter to ensure it's a valid positive integer
 * within acceptable bounds for pagination requests.
 *
 * Business Logic:
 * - Checks if page parameter is provided (optional)
 * - Validates parameter type and format
 * - Ensures page number is positive
 * - Prevents invalid pagination requests
 * - Collects validation errors for reporting
 *
 * @param {any} page - The page value to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validatePageParam(1, errors); // Valid
 * validatePageParam(-1, errors); // Invalid, adds error
 * validatePageParam("abc", errors); // Invalid, adds error
 */
function validatePageParam(page, errors) {
  // Skip validation if page parameter is not provided (optional parameter)
  if (page === undefined) {
    return;
  }
  
  // Convert to integer and validate format
  const pageNum = parseInt(page);
  if (isNaN(pageNum) || pageNum < 1) {
    errors.push({ field: 'page', message: 'Page must be a positive integer' });
  }
}

/**
 * Validates a single limit parameter.
 *
 * This function validates the limit parameter to ensure it's a valid positive integer
 * within acceptable bounds to prevent performance issues from large data requests.
 *
 * Business Logic:
 * - Checks if limit parameter is provided (optional)
 * - Validates parameter type and format
 * - Ensures limit is within acceptable range (1-100)
 * - Prevents excessive data requests
 * - Collects validation errors for reporting
 *
 * @param {any} limit - The limit value to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateLimitParam(10, errors); // Valid
 * validateLimitParam(150, errors); // Invalid, exceeds max limit
 * validateLimitParam(0, errors); // Invalid, must be positive
 */
function validateLimitParam(limit, errors) {
  // Skip validation if limit parameter is not provided (optional parameter)
  if (limit === undefined) {
    return;
  }
  
  // Convert to integer and validate format and range
  const limitNum = parseInt(limit);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    errors.push({ field: 'limit', message: 'Limit must be a positive integer between 1 and 100' });
  }
}

/**
 * Validates the getFollowers data.
 *
 * This function orchestrates the complete validation process for follower
 * retrieval requests, ensuring all parameters meet validation requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Extract pagination parameters with defaults
 * 3. Validate page parameter if provided
 * 4. Validate limit parameter if provided
 * 5. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Parameter validation prevents injection attacks
 * - Range validation prevents performance issues
 * - Type validation ensures data integrity
 * - Error collection provides comprehensive feedback
 *
 * @param {Object} data - The data to validate
 * @param {number} data.page - The page number (optional, defaults to 1)
 * @param {number} data.limit - The number of items per page (optional, defaults to 10)
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid request
 * await validateGetFollowersData({ page: 1, limit: 10 });
 * 
 * // Invalid request - will throw ValidationError
 * await validateGetFollowersData({ page: -1, limit: 150 });
 */
async function validateGetFollowersData(data) {
  // Initialize error collection array
  const errors = [];
  
  // Extract parameters with default values for optional parameters
  const { page = 1, limit = 10 } = data;
  
  // Validate page parameter if provided
  validatePageParam(page, errors);
  
  // Validate limit parameter if provided
  validateLimitParam(limit, errors);

  // If any validation errors were found, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateGetFollowersData,
  validatePageParam,
  validateLimitParam,
}; 