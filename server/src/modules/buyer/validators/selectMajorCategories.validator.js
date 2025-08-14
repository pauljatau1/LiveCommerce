const { ObjectId } = require('mongodb');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Check if majorCategoryIds is provided (not null or undefined)
 * @param {Array} majorCategoryIds - The major category IDs array to check
 * @param {Array} errors - Array to collect validation errors
 */
function checkMajorCategoryIdsProvided(majorCategoryIds, errors) {
  if (majorCategoryIds === null || majorCategoryIds === undefined) {
    errors.push({ field: 'majorCategoryIds', message: 'majorCategoryIds array is required' });
  }
}

/**
 * Check if majorCategoryIds is an array
 * @param {Array} majorCategoryIds - The major category IDs array to check
 * @param {Array} errors - Array to collect validation errors
 */
function checkMajorCategoryIdsIsArray(majorCategoryIds, errors) {
  if (!Array.isArray(majorCategoryIds)) {
    errors.push({ field: 'majorCategoryIds', message: 'majorCategoryIds must be an array' });
  }
}

/**
 * Check if majorCategoryIds array is not empty
 * @param {Array} majorCategoryIds - The major category IDs array to check
 * @param {Array} errors - Array to collect validation errors
 */
function checkMajorCategoryIdsNotEmpty(majorCategoryIds, errors) {
  if (majorCategoryIds.length === 0) {
    errors.push({ field: 'majorCategoryIds', message: 'majorCategoryIds array cannot be empty' });
  }
}

/**
 * Check if all majorCategoryIds are valid ObjectIds
 * @param {Array} majorCategoryIds - The major category IDs array to check
 * @param {Array} errors - Array to collect validation errors
 */
function checkMajorCategoryIdsValidObjectIds(majorCategoryIds, errors) {
  for (let i = 0; i < majorCategoryIds.length; i++) {
    const categoryId = majorCategoryIds[i];
    
    // Check if each item is a string
    if (typeof categoryId !== 'string') {
      errors.push({ field: `majorCategoryIds[${i}]`, message: 'must be a string' });
      continue;
    }
    
    // Check if each item is a valid ObjectId
    if (!ObjectId.isValid(categoryId)) {
      errors.push({ field: `majorCategoryIds[${i}]`, message: 'must be a valid ObjectId' });
    }
  }
}

/**
 * Validate major category IDs for selection operations
 * @param {Array} majorCategoryIds - The major category IDs array to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateMajorCategoryIds(majorCategoryIds, errors) {
  // Check if majorCategoryIds is provided
  checkMajorCategoryIdsProvided(majorCategoryIds, errors);
  if (errors.length > 0) {
    return;
  }

  // Check if majorCategoryIds is an array
  checkMajorCategoryIdsIsArray(majorCategoryIds, errors);
  if (errors.length > 0) {
    return;
  }

  // Check if majorCategoryIds array is not empty
  checkMajorCategoryIdsNotEmpty(majorCategoryIds, errors);
  if (errors.length > 0) {
    return;
  }

  // Check if all majorCategoryIds are valid ObjectIds
  checkMajorCategoryIdsValidObjectIds(majorCategoryIds, errors);
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
 * Validate select major categories data
 * @param {Object} data - The data to validate
 * @param {string} data.buyerId - The buyer ID to validate
 * @param {Array} data.majorCategoryIds - The major category IDs array to validate
 * @returns {Promise<void>}
 * @throws {ValidationError} If validation fails
 */
async function validateSelectMajorCategoriesData(data) {
  const errors = [];

  // Validate buyer ID
  validateBuyerId(data.buyerId, errors);

  // Validate majorCategoryIds
  validateMajorCategoryIds(data.majorCategoryIds, errors);

  // If there are validation errors, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateSelectMajorCategoriesData
};
