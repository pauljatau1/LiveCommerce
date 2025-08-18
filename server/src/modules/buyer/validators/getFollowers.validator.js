const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates a single page parameter.
 *
 * @param {any} page - The page value to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePageParam(page, errors) {
  if (page === undefined) {
    return;
  }
  
  const pageNum = parseInt(page);
  if (isNaN(pageNum) || pageNum < 1) {
    errors.push({ field: 'page', message: 'Page must be a positive integer' });
  }
}

/**
 * Validates a single limit parameter.
 *
 * @param {any} limit - The limit value to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateLimitParam(limit, errors) {
  if (limit === undefined) {
    return;
  }
  
  const limitNum = parseInt(limit);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    errors.push({ field: 'limit', message: 'Limit must be a positive integer between 1 and 100' });
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
  const errors = [];
  const { page = 1, limit = 10 } = data;
  
  validatePageParam(page, errors);
  validateLimitParam(limit, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateGetFollowersData,
  validatePageParam,
  validateLimitParam,
}; 