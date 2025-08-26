/**
 * Select Major Categories Validator
 *
 * This validator handles input validation for major category selection operations
 * for buyers. It provides functionality to:
 * - Validate buyer ID format and requirements
 * - Validate major category IDs array structure and content
 * - Ensure all category IDs are valid MongoDB ObjectIds
 * - Check for required fields and proper data types
 * - Validate array format and non-empty requirements
 * - Ensure data integrity and security standards
 * - Maintain consistent validation patterns
 *
 * The validator ensures that major category selection requests are properly
 * formatted and contain valid data to prevent database errors and maintain
 * data integrity in the category selection process.
 *
 * @module selectMajorCategoriesValidator
 */

const { ObjectId } = require('mongodb');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Check if majorCategoryIds is provided (not null or undefined)
 *
 * This function validates that the majorCategoryIds parameter is provided
 * and is not null or undefined, which are required for category selection.
 *
 * Business Logic:
 * - Checks if majorCategoryIds is null or undefined
 * - Adds validation error if the field is missing
 * - Ensures required field presence before further validation
 *
 * Security Considerations:
 * - Required field validation prevents null/undefined data processing
 * - Early validation prevents downstream errors
 * - Clear error messaging for debugging
 *
 * @param {Array} majorCategoryIds - The major category IDs array to check
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * checkMajorCategoryIdsProvided(null, errors); // Adds error
 * checkMajorCategoryIdsProvided(undefined, errors); // Adds error
 * checkMajorCategoryIdsProvided([], errors); // No error
 */
function checkMajorCategoryIdsProvided(majorCategoryIds, errors) {
  // Step 1: Check if majorCategoryIds is null or undefined
  // This ensures the required field is provided before proceeding with validation
  if (majorCategoryIds === null || majorCategoryIds === undefined) {
    errors.push({ field: 'majorCategoryIds', message: 'majorCategoryIds array is required' });
  }
}

/**
 * Check if majorCategoryIds is an array
 *
 * This function validates that the majorCategoryIds parameter is actually
 * an array data type, which is required for category selection operations.
 *
 * Business Logic:
 * - Uses Array.isArray() to check if the parameter is an array
 * - Adds validation error if the field is not an array
 * - Ensures proper data type before array-specific validation
 *
 * Security Considerations:
 * - Type validation prevents processing of incorrect data types
 * - Prevents potential runtime errors from non-array operations
 * - Clear error messaging for debugging
 *
 * @param {Array} majorCategoryIds - The major category IDs array to check
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * checkMajorCategoryIdsIsArray("not-an-array", errors); // Adds error
 * checkMajorCategoryIdsIsArray({}, errors); // Adds error
 * checkMajorCategoryIdsIsArray([], errors); // No error
 */
function checkMajorCategoryIdsIsArray(majorCategoryIds, errors) {
  // Step 1: Check if majorCategoryIds is an array using Array.isArray()
  // This ensures the parameter is the correct data type for array operations
  if (!Array.isArray(majorCategoryIds)) {
    errors.push({ field: 'majorCategoryIds', message: 'majorCategoryIds must be an array' });
  }
}

/**
 * Check if majorCategoryIds array is not empty
 *
 * This function validates that the majorCategoryIds array contains at least
 * one element, ensuring meaningful category selection operations.
 *
 * Business Logic:
 * - Checks if the array length is greater than 0
 * - Adds validation error if the array is empty
 * - Ensures meaningful category selection data
 *
 * Security Considerations:
 * - Empty array validation prevents meaningless operations
 * - Ensures data has actual content for processing
 * - Clear error messaging for debugging
 *
 * @param {Array} majorCategoryIds - The major category IDs array to check
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * checkMajorCategoryIdsNotEmpty([], errors); // Adds error
 * checkMajorCategoryIdsNotEmpty(['category1'], errors); // No error
 * checkMajorCategoryIdsNotEmpty(['cat1', 'cat2'], errors); // No error
 */
function checkMajorCategoryIdsNotEmpty(majorCategoryIds, errors) {
  // Step 1: Check if the array has at least one element
  // This ensures the category selection contains meaningful data
  if (majorCategoryIds.length === 0) {
    errors.push({ field: 'majorCategoryIds', message: 'majorCategoryIds array cannot be empty' });
  }
}

/**
 * Check if all majorCategoryIds are valid ObjectIds
 *
 * This function validates that each element in the majorCategoryIds array
 * is a valid MongoDB ObjectId format, ensuring database compatibility.
 *
 * Business Logic:
 * - Iterates through each category ID in the array
 * - Validates each ID is a string data type
 * - Checks each ID follows MongoDB ObjectId format (24 hex characters)
 * - Provides specific error messages for each invalid element
 * - Continues validation even if individual elements fail
 *
 * Security Considerations:
 * - ObjectId validation prevents database query errors
 * - String type validation ensures proper data format
 * - Individual element validation provides detailed error feedback
 * - Prevents injection attacks through malformed IDs
 *
 * Validation Rules:
 * - Each element must be a string
 * - Each string must be exactly 24 characters long
 * - Each string must contain only hexadecimal characters (0-9, a-f, A-F)
 *
 * @param {Array} majorCategoryIds - The major category IDs array to check
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * checkMajorCategoryIdsValidObjectIds(['507f1f77bcf86cd799439011'], errors); // Valid
 * checkMajorCategoryIdsValidObjectIds(['invalid-id'], errors); // Adds error
 * checkMajorCategoryIdsValidObjectIds([123], errors); // Adds error (not string)
 * checkMajorCategoryIdsValidObjectIds(['507f1f77bcf86cd799439011', 'invalid'], errors); // Adds error for invalid
 */
function checkMajorCategoryIdsValidObjectIds(majorCategoryIds, errors) {
  // Step 1: Iterate through each category ID in the array
  // This validates each element individually for comprehensive error reporting
  for (let i = 0; i < majorCategoryIds.length; i++) {
    const categoryId = majorCategoryIds[i];
    
    // Step 2: Check if each item is a string data type
    // This ensures proper format before ObjectId validation
    if (typeof categoryId !== 'string') {
      errors.push({ field: `majorCategoryIds[${i}]`, message: 'must be a string' });
      continue; // Skip ObjectId validation for non-string values
    }
    
    // Step 3: Check if each item is a valid MongoDB ObjectId
    // This ensures database compatibility and prevents query errors
    if (!ObjectId.isValid(categoryId)) {
      errors.push({ field: `majorCategoryIds[${i}]`, message: 'must be a valid ObjectId' });
    }
  }
}

/**
 * Validate major category IDs for selection operations
 *
 * This function orchestrates the complete validation process for major category IDs,
 * ensuring all validation rules are applied in the correct order with early termination.
 *
 * Business Logic Flow:
 * 1. Check if majorCategoryIds is provided (not null/undefined)
 * 2. Check if majorCategoryIds is an array data type
 * 3. Check if majorCategoryIds array is not empty
 * 4. Check if all majorCategoryIds are valid ObjectIds
 *
 * Validation Strategy:
 * - Early termination on first validation failure
 * - Cascading validation ensures proper data structure
 * - Comprehensive error collection for debugging
 * - Prevents unnecessary validation on invalid data
 *
 * Security Considerations:
 * - Structured validation prevents processing of invalid data
 * - Early termination reduces unnecessary processing
 * - Comprehensive error reporting for debugging
 * - Maintains data integrity throughout validation process
 *
 * @param {Array} majorCategoryIds - The major category IDs array to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateMajorCategoryIds(null, errors); // Adds error, returns early
 * validateMajorCategoryIds("not-array", errors); // Adds error, returns early
 * validateMajorCategoryIds([], errors); // Adds error, returns early
 * validateMajorCategoryIds(['invalid-id'], errors); // Adds error for invalid ObjectId
 * validateMajorCategoryIds(['507f1f77bcf86cd799439011'], errors); // Valid
 */
function validateMajorCategoryIds(majorCategoryIds, errors) {
  // Step 1: Check if majorCategoryIds is provided (not null/undefined)
  // This ensures the required field exists before proceeding with validation
  checkMajorCategoryIdsProvided(majorCategoryIds, errors);
  if (errors.length > 0) {
    return; // Early termination if field is missing
  }

  // Step 2: Check if majorCategoryIds is an array data type
  // This ensures proper data structure before array-specific validation
  checkMajorCategoryIdsIsArray(majorCategoryIds, errors);
  if (errors.length > 0) {
    return; // Early termination if not an array
  }

  // Step 3: Check if majorCategoryIds array is not empty
  // This ensures meaningful data content before detailed validation
  checkMajorCategoryIdsNotEmpty(majorCategoryIds, errors);
  if (errors.length > 0) {
    return; // Early termination if array is empty
  }

  // Step 4: Check if all majorCategoryIds are valid ObjectIds
  // This ensures database compatibility for all category IDs
  checkMajorCategoryIdsValidObjectIds(majorCategoryIds, errors);
}

/**
 * Validate buyer ID from request.
 *
 * This function validates the buyer ID to ensure it meets format requirements
 * and follows MongoDB ObjectId standards for database operations.
 *
 * Business Logic:
 * - Checks if buyer ID is provided (required field)
 * - Validates buyer ID is a string data type
 * - Validates buyer ID follows MongoDB ObjectId format (24 hex characters)
 * - Provides early termination on validation failures
 *
 * Security Considerations:
 * - Required field validation prevents null/undefined processing
 * - Type validation ensures proper data format
 * - ObjectId format validation prevents database query errors
 * - Early termination reduces unnecessary processing
 * - Prevents injection attacks through malformed IDs
 *
 * Validation Rules:
 * - Buyer ID must be provided (not null, undefined, or empty)
 * - Buyer ID must be a string data type
 * - Buyer ID must be exactly 24 characters long
 * - Buyer ID must contain only hexadecimal characters (0-9, a-f, A-F)
 *
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateBuyerId(null, errors); // Adds error, returns early
 * validateBuyerId("", errors); // Adds error, returns early
 * validateBuyerId(123, errors); // Adds error, returns early
 * validateBuyerId("invalid-id", errors); // Adds error for invalid format
 * validateBuyerId("507f1f77bcf86cd799439011", errors); // Valid
 */
function validateBuyerId(buyerId, errors) {
  // Step 1: Check if buyer ID is provided (required field validation)
  // This ensures the buyer ID exists before proceeding with format validation
  if (!buyerId) {
    errors.push({
      field: 'buyerId',
      message: 'Buyer ID is required'
    });
    return; // Early termination if buyer ID is missing
  }

  // Step 2: Check if buyer ID is a string data type
  // This ensures proper format before ObjectId validation
  if (typeof buyerId !== 'string') {
    errors.push({
      field: 'buyerId',
      message: 'Buyer ID must be a string'
    });
    return; // Early termination if buyer ID is not a string
  }

  // Step 3: Check if buyer ID follows MongoDB ObjectId format
  // This validates the 24-character hexadecimal format for database compatibility
  const objectIdRegex = /^[0-9a-fA-F]{24}$/; // Regex for 24 hex characters
  if (!objectIdRegex.test(buyerId)) {
    errors.push({
      field: 'buyerId',
      message: 'Invalid buyer ID format'
    });
  }
}

/**
 * Validate select major categories data
 *
 * This function orchestrates the complete validation process for major category
 * selection operations, ensuring both buyer ID and category IDs meet all requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate buyer ID (required, string type, ObjectId format)
 * 3. Validate major category IDs (required, array type, non-empty, valid ObjectIds)
 * 4. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Comprehensive field validation prevents data corruption
 * - ObjectId validation prevents database query errors
 * - Type validation ensures proper data format
 * - Error collection provides comprehensive feedback
 * - Prevents injection attacks through malformed data
 *
 * Validation Requirements:
 * - buyerId: Required string in MongoDB ObjectId format (24 hex characters)
 * - majorCategoryIds: Required non-empty array of valid ObjectId strings
 *
 * @param {Object} data - The data to validate
 * @param {string} data.buyerId - The buyer ID to validate
 * @param {Array} data.majorCategoryIds - The major category IDs array to validate
 * @returns {Promise<void>}
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid data
 * await validateSelectMajorCategoriesData({
 *   buyerId: '507f1f77bcf86cd799439011',
 *   majorCategoryIds: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013']
 * });
 *
 * // Invalid data - will throw ValidationError
 * await validateSelectMajorCategoriesData({
 *   buyerId: 'invalid-id',
 *   majorCategoryIds: ['invalid-category-id']
 * });
 */
async function validateSelectMajorCategoriesData(data) {
  // Step 1: Initialize error collection array
  // This will collect all validation errors for comprehensive reporting
  const errors = [];

  // Step 2: Validate buyer ID (required, string type, ObjectId format)
  // This ensures the buyer ID meets all format and security requirements
  validateBuyerId(data.buyerId, errors);

  // Step 3: Validate major category IDs (required, array type, non-empty, valid ObjectIds)
  // This ensures all category IDs are properly formatted and database-compatible
  validateMajorCategoryIds(data.majorCategoryIds, errors);

  // Step 4: Throw ValidationError if any validation fails
  // This provides comprehensive error feedback to the caller
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateSelectMajorCategoriesData
};
