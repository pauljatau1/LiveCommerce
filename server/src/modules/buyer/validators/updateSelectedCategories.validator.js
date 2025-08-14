const { validateXSS } = require('../../../utils/validator');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates the basic structure of selectedCategories array.
 * 
 * @param {Array} selectedCategories - Array of category objects
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
  if (selectedCategories.length > 50) {
    errors.push({ field: 'selectedCategories', message: 'Cannot select more than 50 categories' });
  }
}

/**
 * Validates the selectedCategories array structure.
 * 
 * @param {Array} selectedCategories - Array of category objects
 * @param {Array} errors - Array to collect validation errors
 */
function validateSelectedCategories(selectedCategories, errors) {
  // Validate basic structure
  validateSelectedCategoriesStructure(selectedCategories, errors);

  // If there are structure errors, don't validate individual categories
  if (errors.length > 0) {
    return;
  }

  // Validate each category
  selectedCategories.forEach((category, index) => {
    validateCategory(category, index, errors);
  });
}

/**
 * Validates category name for XSS and length constraints.
 * 
 * @param {string} name - Category name to validate
 * @param {string} fieldPath - Field path for error messages
 * @param {Array} errors - Array to collect validation errors
 */
function validateCategoryName(name, fieldPath, errors) {
  // Check for XSS patterns
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
 * @param {Array} subCategories - Subcategories array to validate
 * @param {number} categoryIndex - Index of the parent category
 * @param {Array} errors - Array to collect validation errors
 */
function validateSubCategoriesArray(subCategories, categoryIndex, errors) {
  // Allow null/undefined subCategories (will be converted to empty array)
  if (subCategories === null || subCategories === undefined) {
    return;
  }

  if (!Array.isArray(subCategories)) {
    errors.push({ 
      field: `selectedCategories[${categoryIndex}].subCategories`, 
      message: 'Subcategories must be an array' 
    });
    return;
  }

  // Check maximum number of subcategories per category
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
 * @param {Object} category - Category object
 * @param {number} index - Index of the category in the array
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
  if (category.name === undefined || category.name === null || typeof category.name !== 'string') {
    errors.push({ 
      field: `selectedCategories[${index}].name`, 
      message: 'Category name is required and must be a string' 
    });
  } else {
    validateCategoryName(category.name, `selectedCategories[${index}].name`, errors);
  }

  // Validate subCategories
  validateSubCategoriesArray(category.subCategories, index, errors);
}

/**
 * Validates subcategory name for XSS and length constraints.
 * 
 * @param {string} name - Subcategory name to validate
 * @param {string} fieldPath - Field path for error messages
 * @param {Array} errors - Array to collect validation errors
 */
function validateSubCategoryName(name, fieldPath, errors) {
  // Check for XSS patterns
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
 * @param {Object} subCategory - Subcategory object
 * @param {number} categoryIndex - Index of the parent category
 * @param {number} subCategoryIndex - Index of the subcategory
 * @param {Array} errors - Array to collect validation errors
 */
function validateSubCategory(subCategory, categoryIndex, subCategoryIndex, errors) {
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
  if (subCategory.name === undefined || subCategory.name === null || typeof subCategory.name !== 'string') {
    errors.push({ 
      field: `${fieldPath}.name`, 
      message: 'Subcategory name is required and must be a string' 
    });
  } else {
    validateSubCategoryName(subCategory.name, `${fieldPath}.name`, errors);
  }
}

/**
 * Validate buyer ID from request.
 * 
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBuyerId(buyerId, errors) {
  if (!buyerId) {
    errors.push({
      field: 'buyerId',
      message: 'Buyer ID is required'
    });
    return;
  }

  if (typeof buyerId !== 'string') {
    errors.push({
      field: 'buyerId',
      message: 'Buyer ID must be a string'
    });
    return;
  }

  // Check if it's a valid ObjectId format
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(buyerId)) {
    errors.push({
      field: 'buyerId',
      message: 'Invalid buyer ID format'
    });
  }
}

/**
 * Validates the complete updateSelectedCategories request data.
 * 
 * @param {Object} data - Request data containing buyerId and selectedCategories
 * @param {string} data.buyerId - The buyer ID to validate
 * @param {Array} data.selectedCategories - The selected categories to validate
 * @throws {ValidationError} If validation fails
 */
async function validateUpdateSelectedCategoriesData(data) {
  const errors = [];

  // Check if data is provided
  if (!data || typeof data !== 'object') {
    errors.push({ field: 'data', message: 'Request data is required' });
  } else {
    // Validate buyer ID
    validateBuyerId(data.buyerId, errors);
    
    // Validate selectedCategories
    validateSelectedCategories(data.selectedCategories, errors);
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateUpdateSelectedCategoriesData
}; 