/**
 * Update Categories Validator
 *
 * This validator handles input validation for category update functionality
 * for sellers. It provides comprehensive validation for the complete category
 * update process, ensuring data integrity and security.
 *
 * The validator ensures that:
 * - All input data is properly formatted and validated
 * - Categories array is provided and properly structured
 * - Each category has required fields (id, name, subCategories)
 * - Category IDs are valid MongoDB ObjectIds
 * - SubCategories are properly formatted
 * - All validation errors are collected and reported together
 * - Security requirements are enforced
 *
 * Validation Features:
 * - Categories array presence and format validation
 * - Category ID presence, type, and ObjectId format validation
 * - Category name presence and type validation
 * - SubCategories array presence and format validation
 * - SubCategory name presence and type validation
 * - Comprehensive error collection
 * - Security-focused validation
 *
 * Security Considerations:
 * - Validates all inputs before processing
 * - Ensures proper ObjectId format for category IDs
 * - Maintains data integrity throughout validation
 * - Prevents information leakage through error messages
 * - Flexible category handling for different clients
 *
 * @module updateCategoriesValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');
const mongoose = require('mongoose');

/**
 * Validates categories array for seller category update.
 *
 * This function ensures the categories array is provided and has the correct format
 * for category update operations. It performs comprehensive validation to ensure
 * data integrity and security.
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
 * This function ensures the subCategories array is present and properly formatted.
 * It performs type checking, required field validation, and validates each subCategory.
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
 * Validates individual category object.
 *
 * This function ensures the category object is properly structured and contains
 * all required fields. It performs comprehensive validation for category update operations.
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
 * Validates individual subCategory object.
 *
 * This function ensures the subCategory object is properly structured and contains
 * all required fields. It performs comprehensive validation for subCategory operations.
 *
 * @param {Object} subCategory - SubCategory object to validate
 * @param {number} categoryIndex - Index of parent category in array for error reporting
 * @param {number} subIndex - Index of subCategory in array for error reporting
 * @param {Array} errors - Array to collect validation errors
 */
function validateSubCategory(subCategory, categoryIndex, subIndex, errors) {
  if (!subCategory || typeof subCategory !== 'object') {
    errors.push({ 
      field: `categories[${categoryIndex}].subCategories[${subIndex}]`, 
      message: 'SubCategory must be an object' 
    });
    return;
  }

  if (!subCategory.name) {
    errors.push({ 
      field: `categories[${categoryIndex}].subCategories[${subIndex}].name`, 
      message: 'SubCategory name is required' 
    });
  } else if (typeof subCategory.name !== 'string') {
    errors.push({ 
      field: `categories[${categoryIndex}].subCategories[${subIndex}].name`, 
      message: 'SubCategory name must be a string' 
    });
  }
}

/**
 * Validates update categories data for seller category update operations.
 *
 * This is the main validation function that orchestrates the complete validation
 * process for category update operations. It ensures all input data meets the
 * required format and security standards.
 *
 * The validation process includes:
 * 1. Input data structure validation
 * 2. Categories array validation
 * 3. Individual category validation
 * 4. Error collection and reporting
 *
 * @param {Object} data - Data object containing categories to validate
 * @param {Array} data.categories - Array of categories to validate
 * @throws {ValidationError} Throws ValidationError if validation fails
 * 
 * @example
 * // Valid data structure
 * const validData = {
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
 * };
 * 
 * try {
 *   await validateUpdateCategoriesData(validData);
 *   // Validation passed, proceed with category update
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function validateUpdateCategoriesData(data) {
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
  validateUpdateCategoriesData,
};
