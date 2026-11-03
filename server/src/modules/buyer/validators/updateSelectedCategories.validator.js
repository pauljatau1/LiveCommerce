/**
 * Update Selected Categories Validator
 *
 * This validator handles input validation for buyer category selection updates.
 * It provides comprehensive validation for hierarchical category structures including
 * main categories and their subcategories.
 *
 * The validator ensures that:
 * - Buyer ID is provided and valid
 * - Selected categories array is properly structured
 * - Category names are safe from XSS attacks
 * - Length constraints are enforced
 * - Hierarchical relationships are maintained
 * - No malicious or invalid data is accepted
 *
 * Category Structure:
 * - Main categories with names and optional subcategories
 * - Subcategories with names under parent categories
 * - Maximum limits for categories and subcategories
 * - XSS protection for all text fields
 *
 * Validation Features:
 * - XSS (Cross-Site Scripting) protection
 * - Length constraints (1-100 characters)
 * - Array structure validation
 * - Object type validation
 * - Hierarchical relationship validation
 * - Maximum limits enforcement
 *
 * @module updateSelectedCategoriesValidator
 */

const { validateXSS } = require('../../../utils/validator');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates the basic structure of selectedCategories array.
 * 
 * This function performs fundamental validation on the selectedCategories array
 * including presence, type checking, and maximum limit enforcement.
 *
 * Validation Checks:
 * - Array is provided (not null/undefined)
 * - Array is actually an array type
 * - Array length doesn't exceed maximum limit (50 categories)
 *
 * @param {Array} selectedCategories - Array of category objects to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateSelectedCategoriesStructure(selectedCategories, errors) {
  // Check if selectedCategories is provided
  if (selectedCategories === null || selectedCategories === undefined) {
    errors.push({ field: 'selectedCategories', message: 'selectedCategories is required' });
    return;
  }

  // Check if selectedCategories is an array
  if (!Array.isArray(selectedCategories)) {
    errors.push({ field: 'selectedCategories', message: 'selectedCategories must be an array' });
    return;
  }

  // Check maximum number of categories
  // This prevents performance issues and maintains reasonable limits
  if (selectedCategories.length > 50) {
    errors.push({ field: 'selectedCategories', message: 'Cannot select more than 50 categories' });
  }
}

/**
 * Validates the selectedCategories array structure and content.
 * 
 * This function orchestrates the complete validation of the selectedCategories array.
 * It first validates the basic structure, then validates each individual category
 * if the structure is valid.
 *
 * Validation Flow:
 * 1. Validate basic array structure
 * 2. If structure is valid, validate each category
 * 3. Early return if structure validation fails
 *
 * @param {Array} selectedCategories - Array of category objects to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateSelectedCategories(selectedCategories, errors) {
  // Step 1: Validate basic structure
  validateSelectedCategoriesStructure(selectedCategories, errors);

  // Step 2: If there are structure errors, don't validate individual categories
  // This prevents cascading errors and provides cleaner error messages
  if (errors.length > 0) {
    return;
  }

  // Step 3: Validate each category
  selectedCategories.forEach((category, index) => {
    validateCategory(category, index, errors);
  });
}

/**
 * Validates category name for XSS and length constraints.
 * 
 * This function ensures category names are safe and meet length requirements.
 * It performs XSS validation and enforces character limits for consistency.
 *
 * Validation Checks:
 * - XSS protection using validateXSS utility
 * - Minimum length (1 character)
 * - Maximum length (100 characters)
 *
 * @param {string} name - Category name to validate
 * @param {string} fieldPath - Field path for error messages (e.g., 'selectedCategories[0].name')
 * @param {Array} errors - Array to collect validation errors
 */
function validateCategoryName(name, fieldPath, errors) {
  // Check for XSS patterns
  // This prevents malicious script injection
  const xssError = validateXSS(name, fieldPath);
  if (xssError) {
    errors.push(xssError);
  }

  // Check length constraints
  if (name.length < 1) {
    errors.push({ 
      field: fieldPath, 
      message: 'Category name cannot be empty' 
    });
  }

  if (name.length > 100) {
    errors.push({ 
      field: fieldPath, 
      message: 'Category name must not exceed 100 characters' 
    });
  }
}

/**
 * Validates subcategories array for a category.
 * 
 * This function validates the subcategories array structure and content.
 * It handles optional subcategories and enforces limits on the number of subcategories.
 *
 * Validation Features:
 * - Allows null/undefined subcategories (converted to empty array)
 * - Validates array type
 * - Enforces maximum subcategory limit (20 per category)
 * - Validates each subcategory individually
 *
 * @param {Array} subCategories - Subcategories array to validate
 * @param {number} categoryIndex - Index of the parent category for error messages
 * @param {Array} errors - Array to collect validation errors
 */
function validateSubCategoriesArray(subCategories, categoryIndex, errors) {
  // Allow null/undefined subCategories (will be converted to empty array)
  // This provides flexibility for categories without subcategories
  if (subCategories === null || subCategories === undefined) {
    return;
  }

  // Validate that subCategories is an array
  if (!Array.isArray(subCategories)) {
    errors.push({ 
      field: `selectedCategories[${categoryIndex}].subCategories`, 
      message: 'Subcategories must be an array' 
    });
    return;
  }

  // Check maximum number of subcategories per category
  // This prevents performance issues and maintains reasonable limits
  if (subCategories.length > 20) {
    errors.push({ 
      field: `selectedCategories[${categoryIndex}].subCategories`, 
      message: 'Cannot have more than 20 subcategories per category' 
    });
    return;
  }

  // Validate each subcategory
  subCategories.forEach((subCategory, subIndex) => {
    validateSubCategory(subCategory, categoryIndex, subIndex, errors);
  });
}

/**
 * Validates a single category object.
 * 
 * This function validates the structure and content of individual category objects.
 * It ensures each category has the required fields and validates nested subcategories.
 *
 * Category Object Structure:
 * - name: Required string field
 * - subCategories: Optional array of subcategory objects
 *
 * Validation Checks:
 * - Category is an object
 * - Category name is present and valid
 * - Subcategories array is valid (if present)
 *
 * @param {Object} category - Category object to validate
 * @param {string} category.name - Category name
 * @param {Array} category.subCategories - Optional subcategories array
 * @param {number} index - Index of the category in the array for error messages
 * @param {Array} errors - Array to collect validation errors
 */
function validateCategory(category, index, errors) {
  // Check if category is an object
  if (!category || typeof category !== 'object') {
    errors.push({ 
      field: `selectedCategories[${index}]`, 
      message: 'Category must be an object' 
    });
    return;
  }

  // Validate category name
  // Check for presence, type, and content validation
  if (category.name === undefined || category.name === null || typeof category.name !== 'string') {
    errors.push({ 
      field: `selectedCategories[${index}].name`, 
      message: 'Category name is required and must be a string' 
    });
  } else {
    // Validate category name content (XSS, length, etc.)
    validateCategoryName(category.name, `selectedCategories[${index}].name`, errors);
  }

  // Validate subCategories
  // This handles the nested subcategories array
  validateSubCategoriesArray(category.subCategories, index, errors);
}

/**
 * Validates subcategory name for XSS and length constraints.
 * 
 * This function ensures subcategory names are safe and meet length requirements.
 * It performs the same validation as category names for consistency.
 *
 * Validation Checks:
 * - XSS protection using validateXSS utility
 * - Minimum length (1 character)
 * - Maximum length (100 characters)
 *
 * @param {string} name - Subcategory name to validate
 * @param {string} fieldPath - Field path for error messages
 * @param {Array} errors - Array to collect validation errors
 */
function validateSubCategoryName(name, fieldPath, errors) {
  // Check for XSS patterns
  // This prevents malicious script injection in subcategory names
  const xssError = validateXSS(name, fieldPath);
  if (xssError) {
    errors.push(xssError);
  }

  // Check length constraints
  if (name.length < 1) {
    errors.push({ 
      field: fieldPath, 
      message: 'Subcategory name cannot be empty' 
    });
  }

  if (name.length > 100) {
    errors.push({ 
      field: fieldPath, 
      message: 'Subcategory name must not exceed 100 characters' 
    });
  }
}

/**
 * Validates a single subcategory object.
 * 
 * This function validates the structure and content of individual subcategory objects.
 * It ensures each subcategory has the required fields and meets validation criteria.
 *
 * Subcategory Object Structure:
 * - name: Required string field
 *
 * Validation Checks:
 * - Subcategory is an object
 * - Subcategory name is present and valid
 * - Name passes XSS and length validation
 *
 * @param {Object} subCategory - Subcategory object to validate
 * @param {string} subCategory.name - Subcategory name
 * @param {number} categoryIndex - Index of the parent category for error messages
 * @param {number} subCategoryIndex - Index of the subcategory for error messages
 * @param {Array} errors - Array to collect validation errors
 */
function validateSubCategory(subCategory, categoryIndex, subCategoryIndex, errors) {
  // Create field path for error messages
  const fieldPath = `selectedCategories[${categoryIndex}].subCategories[${subCategoryIndex}]`;

  // Check if subCategory is an object
  if (!subCategory || typeof subCategory !== 'object') {
    errors.push({ 
      field: fieldPath, 
      message: 'Subcategory must be an object' 
    });
    return;
  }

  // Validate subcategory name
  // Check for presence, type, and content validation
  if (subCategory.name === undefined || subCategory.name === null || typeof subCategory.name !== 'string') {
    errors.push({ 
      field: `${fieldPath}.name`, 
      message: 'Subcategory name is required and must be a string' 
    });
  } else {
    // Validate subcategory name content (XSS, length, etc.)
    validateSubCategoryName(subCategory.name, `${fieldPath}.name`, errors);
  }
}

/**
 * Validate buyer ID from request.
 * 
 * This function ensures the buyer ID is provided, is a string, and follows
 * the MongoDB ObjectId format for consistency with the database schema.
 *
 * Validation Checks:
 * - Buyer ID is provided (not null/undefined/empty)
 * - Buyer ID is a string type
 * - Buyer ID matches MongoDB ObjectId format (24 hex characters)
 *
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBuyerId(buyerId, errors) {
  // Check if buyer ID is provided
  if (!buyerId) {
    errors.push({
      field: 'buyerId',
      message: 'Buyer ID is required'
    });
    return;
  }

  // Check if buyer ID is a string
  if (typeof buyerId !== 'string') {
    errors.push({
      field: 'buyerId',
      message: 'Buyer ID must be a string'
    });
    return;
  }

  // Check if it's a valid ObjectId format
  // MongoDB ObjectId is 24 hexadecimal characters
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(buyerId)) {
    errors.push({
      field: 'buyerId',
      message: 'Invalid buyer ID format'
    });
  }
}

/**
 * Validates the complete updateSelectedCategories request data - Main validation function.
 * 
 * This is the primary validation function that orchestrates the complete
 * validation process for category selection updates. It validates both the
 * buyer ID and the selected categories structure.
 *
 * Validation Process:
 * 1. Validates request data structure
 * 2. Validates buyer ID format and presence
 * 3. Validates selectedCategories array structure
 * 4. Validates each category and subcategory
 * 5. Throws ValidationError if any validation fails
 *
 * Data Structure Expected:
 * - buyerId: String (MongoDB ObjectId format)
 * - selectedCategories: Array of category objects
 *   - Each category has: name (string), subCategories (optional array)
 *   - Each subcategory has: name (string)
 *
 * @param {Object} data - Request data object to validate
 * @param {string} data.buyerId - The buyer ID to validate
 * @param {Array} data.selectedCategories - The selected categories array to validate
 * @throws {ValidationError} If any validation fails (contains all validation errors)
 *
 * @example
 * // Valid category selection
 * await validateUpdateSelectedCategoriesData({
 *   buyerId: '507f1f77bcf86cd799439011',
 *   selectedCategories: [
 *     {
 *       name: 'Electronics',
 *       subCategories: [
 *         { name: 'Smartphones' },
 *         { name: 'Laptops' }
 *       ]
 *     },
 *     {
 *       name: 'Fashion',
 *       subCategories: []
 *     }
 *   ]
 * });
 *
 * @example
 * // Invalid category selection
 * try {
 *   await validateUpdateSelectedCategoriesData({
 *     buyerId: 'invalid-id',
 *     selectedCategories: [
 *       {
 *         name: '<script>alert("xss")</script>', // XSS attack
 *         subCategories: []
 *       }
 *     ]
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains array of validation errors
 * }
 */
async function validateUpdateSelectedCategoriesData(data) {
  const errors = [];

  // Step 1: Check if data is provided
  if (!data || typeof data !== 'object') {
    errors.push({ field: 'data', message: 'Request data is required' });
  } else {
    // Step 2: Validate buyer ID
    validateBuyerId(data.buyerId, errors);
    
    // Step 3: Validate selectedCategories
    validateSelectedCategories(data.selectedCategories, errors);
  }

  // Step 4: Throw ValidationError if any validation failed
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateUpdateSelectedCategoriesData
}; 