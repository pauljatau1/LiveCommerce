/**
 * Select Categories Validator
 *
 * This validator handles input validation for category selection functionality
 * for sellers. It provides comprehensive validation for the complete category
 * selection process, ensuring data integrity and security.
 *
 * The validator ensures that:
 * - All input data is properly formatted and validated
 * - Categories array is provided and properly structured
 * - Each category has required fields (id, name, subCategories)
 * - All validation errors are collected and reported together
 * - Security requirements are enforced
 *
 * Validation Features:
 * - Categories array presence and format validation
 * - Individual category structure validation
 * - Sub-categories validation
 * - Comprehensive error collection
 * - Security-focused validation
 *
 * Security Considerations:
 * - Validates all inputs before processing
 * - Ensures proper category structure
 * - Maintains data integrity throughout validation
 * - Prevents information leakage through error messages
 * - Flexible category handling for different clients
 *
 * @module selectCategoriesValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');
const mongoose = require('mongoose');

/**
 * Validates categories array for seller category selection.
 *
 * This function ensures the categories array is provided and has the correct format
 * for category selection. It performs comprehensive validation to
 * ensure data integrity and security.
 *
 * Categories Requirements:
 * - Categories must be provided (not null/undefined/empty)
 * - Categories must be an array
 * - Categories array must not be empty
 * - Each category must have required structure
 *
 * Validation Checks:
 * - Required field validation
 * - Data type validation (array only)
 * - Array length validation (not empty)
 * - Structure validation for each category
 *
 * Security Features:
 * - Input sanitization through type checking
 * - Structure validation to prevent injection
 * - Clear error messages for users
 * - Consistent validation approach
 *
 * @param {Array} categories - Categories array to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateCategories(categories, errors) {
  if (!categories) {
    errors.push({ field: 'categories', message: 'Categories are required' });
  } else if (!Array.isArray(categories)) {
    errors.push({ field: 'categories', message: 'Categories must be an array' });
  } else if (categories.length === 0) {
    errors.push({ field: 'categories', message: 'Categories array cannot be empty' });
  } else {
    // Validate each category in the array
    categories.forEach((category, index) => {
      validateCategory(category, index, errors);
    });
  }
}

/**
 * Validates category ID field.
 *
 * This function ensures the category ID is present, properly formatted, and is a valid MongoDB ObjectId.
 * It performs type checking, required field validation, and ObjectId format validation.
 *
 * @param {Object} category - Category object to validate
 * @param {number} index - Index of category in array for error reporting
 * @param {Array} errors - Array to collect validation errors
 */
function validateCategoryId(category, index, errors) {
  if (!category.id) {
    errors.push({ field: `categories[${index}].id`, message: 'Category ID is required' });
  } else if (typeof category.id !== 'string') {
    errors.push({ field: `categories[${index}].id`, message: 'Category ID must be a string' });
  } else if (!mongoose.Types.ObjectId.isValid(category.id)) {
    errors.push({ field: `categories[${index}].id`, message: 'Category ID must be a valid MongoDB ObjectId' });
  }
}

/**
 * Validates category name field.
 *
 * This function ensures the category name is present and properly formatted.
 * It performs type checking and required field validation.
 *
 * @param {Object} category - Category object to validate
 * @param {number} index - Index of category in array for error reporting
 * @param {Array} errors - Array to collect validation errors
 */
function validateCategoryName(category, index, errors) {
  if (!category.name) {
    errors.push({ field: `categories[${index}].name`, message: 'Category name is required' });
  } else if (typeof category.name !== 'string') {
    errors.push({ field: `categories[${index}].name`, message: 'Category name must be a string' });
  }
}

/**
 * Validates category subCategories field.
 *
 * This function ensures the subCategories field is present and properly formatted.
 * It performs type checking and validates each sub-category.
 *
 * @param {Object} category - Category object to validate
 * @param {number} index - Index of category in array for error reporting
 * @param {Array} errors - Array to collect validation errors
 */
function validateCategorySubCategories(category, index, errors) {
  if (!category.subCategories) {
    errors.push({ field: `categories[${index}].subCategories`, message: 'SubCategories are required' });
  } else if (!Array.isArray(category.subCategories)) {
    errors.push({ field: `categories[${index}].subCategories`, message: 'SubCategories must be an array' });
  } else {
    // Validate each subCategory
    category.subCategories.forEach((subCategory, subIndex) => {
      validateSubCategory(subCategory, index, subIndex, errors);
    });
  }
}

/**
 * Validates individual category structure.
 *
 * This function ensures each category has the required structure
 * for proper category selection. It validates all required fields
 * and nested structures.
 *
 * Category Requirements:
 * - Category must be an object
 * - Category must have 'id' field
 * - Category must have 'name' field
 * - Category must have 'subCategories' field
 * - SubCategories must be an array
 *
 * Validation Checks:
 * - Object type validation
 * - Required field validation (id, name, subCategories)
 * - SubCategories array validation
 * - Nested structure validation
 *
 * Security Features:
 * - Input sanitization through type checking
 * - Structure validation to prevent injection
 * - Clear error messages for users
 * - Consistent validation approach
 *
 * @param {Object} category - Category object to validate
 * @param {number} index - Index of category in array for error reporting
 * @param {Array} errors - Array to collect validation errors
 */
function validateCategory(category, index, errors) {
  if (!category || typeof category !== 'object') {
    errors.push({ field: `categories[${index}]`, message: 'Category must be an object' });
    return;
  }

  // Validate category fields using helper functions
  validateCategoryId(category, index, errors);
  validateCategoryName(category, index, errors);
  validateCategorySubCategories(category, index, errors);
}

/**
 * Validates individual sub-category structure.
 *
 * This function ensures each sub-category has the required structure
 * for proper category selection. It validates all required fields.
 *
 * SubCategory Requirements:
 * - SubCategory must be an object
 * - SubCategory must have 'name' field
 *
 * Validation Checks:
 * - Object type validation
 * - Required field validation (name)
 * - String type validation
 *
 * Security Features:
 * - Input sanitization through type checking
 * - Structure validation to prevent injection
 * - Clear error messages for users
 * - Consistent validation approach
 *
 * @param {Object} subCategory - SubCategory object to validate
 * @param {number} categoryIndex - Index of parent category in array
 * @param {number} subCategoryIndex - Index of subCategory in array
 * @param {Array} errors - Array to collect validation errors
 */
function validateSubCategory(subCategory, categoryIndex, subCategoryIndex, errors) {
  if (!subCategory || typeof subCategory !== 'object') {
    errors.push({ 
      field: `categories[${categoryIndex}].subCategories[${subCategoryIndex}]`, 
      message: 'SubCategory must be an object' 
    });
    return;
  }

  // Validate subCategory name
  if (!subCategory.name) {
    errors.push({ 
      field: `categories[${categoryIndex}].subCategories[${subCategoryIndex}].name`, 
      message: 'SubCategory name is required' 
    });
  } else if (typeof subCategory.name !== 'string') {
    errors.push({ 
      field: `categories[${categoryIndex}].subCategories[${subCategoryIndex}].name`, 
      message: 'SubCategory name must be a string' 
    });
  }
}

/**
 * Validates selectCategories data - Main validation function.
 *
 * This is the primary validation function that orchestrates all validation steps
 * for category selection. It ensures comprehensive validation before allowing
 * the selection process to proceed.
 *
 * Validation Process:
 * 1. Validates input data structure and presence
 * 2. Validates categories array requirements
 * 3. Validates individual category structures
 * 4. Collects all validation errors and throws ValidationError if any exist
 *
 * Validation Strategy:
 * - Comprehensive validation of all input fields
 * - Type checking for all data structures
 * - Required field validation
 * - Nested structure validation
 * - Error collection for complete feedback
 *
 * Error Handling:
 * - Collects all validation errors in a single pass
 * - Provides detailed field-specific error messages
 * - Throws ValidationError with all errors at once
 * - Maintains consistent error format
 *
 * @param {Object} data - Data object containing categories to validate
 * @param {Array} data.categories - Array of categories to validate
 * @throws {ValidationError} If any validation fails (contains all validation errors)
 *
 * @example
 * // Valid category selection data
 * await validateSelectCategoriesData({
 *   categories: [
 *     {
 *       id: '507f1f77bcf86cd799439011',
 *       name: 'Electronics',
 *       subCategories: [
 *         { name: 'Smartphones' },
 *         { name: 'Laptops' }
 *       ]
 *     }
 *   ]
 * });
 * // No error thrown
 *
 * @example
 * // Invalid category selection data - missing categories
 * try {
 *   await validateSelectCategoriesData({});
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function validateSelectCategoriesData(data) {
  const errors = [];

  // Step 1: Validate input data structure
  // This ensures the data object is provided and properly structured
  if (!data || data === null || data === undefined) {
    errors.push({ field: 'categories', message: 'Categories are required' });
  } else {
    // Step 2: Validate categories array
    // This ensures the categories array meets validation requirements
    validateCategories(data.categories, errors);
  }

  // Step 3: Throw ValidationError if any validation failed
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateSelectCategoriesData,
};
