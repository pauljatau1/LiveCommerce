const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates a single page parameter.
 *
 * @param {any} page - The page value to validate
 * @returns {Object|null} Error object if invalid, null if valid
 */
function validatePageParam(page) {
  if (page === undefined) {
    return null;
  }
  
  const pageNum = parseInt(page);
  if (isNaN(pageNum) || pageNum < 1) {
    return { field: 'page', message: 'Page must be a positive integer' };
  }
  
  return null;
}

/**
 * Validates a single limit parameter.
 *
 * @param {any} limit - The limit value to validate
 * @returns {Object|null} Error object if invalid, null if valid
 */
function validateLimitParam(limit) {
  if (limit === undefined) {
    return null;
  }
  
  const limitNum = parseInt(limit);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return { field: 'limit', message: 'Limit must be a positive integer between 1 and 100' };
  }
  
  return null;
}

/**
 * Validates pagination parameters.
 *
 * @param {number} page - The page number
 * @param {number} limit - The number of items per page
 * @throws {ValidationError} If parameters are invalid
 */
function validatePaginationParams(page, limit) {
  const errors = [];
  
  const pageError = validatePageParam(page);
  if (pageError) {
    errors.push(pageError);
  }
  
  const limitError = validateLimitParam(limit);
  if (limitError) {
    errors.push(limitError);
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validates the getFollowers data.
 *
 * @param {Object} data - The data to validate
 * @param {number} data.page - The page number (optional)
 * @param {number} data.limit - The number of items per page (optional)
 * @throws {ValidationError} If validation fails
 */
async function validateGetFollowersData(data) {
  const { page = 1, limit = 10 } = data;
  validatePaginationParams(page, limit);
}

module.exports = {
  validateGetFollowersData,
  validatePaginationParams,
  validatePageParam,
  validateLimitParam,
}; 