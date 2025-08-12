const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate page parameter for pagination.
 * 
 * @param {string|number} page - Page number
 * @param {Array} errors - Array to collect validation errors
 */
function validatePage(page, errors) {
  if (page !== undefined) {
    const parsedPage = parseInt(page);
    if (isNaN(parsedPage) || parsedPage < 1) {
      errors.push({ field: 'page', message: 'Page must be a positive integer' });
    }
  }
}

/**
 * Validate limit parameter for pagination.
 * 
 * @param {string|number} limit - Number of items per page
 * @param {Array} errors - Array to collect validation errors
 */
function validateLimit(limit, errors) {
  if (limit !== undefined) {
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      errors.push({ field: 'limit', message: 'Limit must be a positive integer between 1 and 100' });
    }
  }
}

/**
 * Validate search parameter.
 * 
 * @param {string} search - Search term
 * @param {Array} errors - Array to collect validation errors
 */
function validateSearch(search, errors) {
  if (search !== undefined && typeof search !== 'string') {
    errors.push({ field: 'search', message: 'Search must be a string' });
  }
}

/**
 * Validate category parameter.
 * 
 * @param {string} category - Category filter
 * @param {Array} errors - Array to collect validation errors
 */
function validateCategory(category, errors) {
  if (category !== undefined && typeof category !== 'string') {
    errors.push({ field: 'category', message: 'Category must be a string' });
  }
}

/**
 * Validate sort parameter.
 * 
 * @param {string} sort - Sort criteria
 * @param {Array} errors - Array to collect validation errors
 */
function validateSort(sort, errors) {
  if (sort !== undefined) {
    const validSortOptions = ['rating', 'followers', 'newest'];
    if (!validSortOptions.includes(sort)) {
      errors.push({ field: 'sort', message: 'Sort must be one of: rating, followers, newest' });
    }
  }
}

/**
 * Validate all query parameters for getSellersToFollow.
 * 
 * @param {Object} data - Query parameters to validate
 * @throws {ValidationError} If validation fails
 */
async function validateGetSellersToFollowData(data) {
  const errors = [];

  // Validate each parameter
  validatePage(data.page, errors);
  validateLimit(data.limit, errors);
  validateSearch(data.search, errors);
  validateCategory(data.category, errors);
  validateSort(data.sort, errors);

  // If there are validation errors, throw them
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateGetSellersToFollowData
};
