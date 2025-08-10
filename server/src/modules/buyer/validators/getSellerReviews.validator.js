const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates seller ID
 * @param {string} sellerId - The seller ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateSellerId(sellerId, errors) {
  // Check if sellerId is provided and is a string
  if (!sellerId || typeof sellerId !== 'string') {
    errors.push({ field: 'sellerId', message: 'Seller ID is required and must be a string' });
  }
}

/**
 * Validates sort parameter
 * @param {string} sort - The sort parameter to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateSortParam(sort, errors) {
  // Define valid sort options for seller reviews
  const validSortOptions = ['recent', 'rating-high', 'rating-low'];
  
  // Allow empty string (defaults to 'recent' in service)
  // Only validate if sort is provided and not empty
  if (sort && sort !== '' && !validSortOptions.includes(sort)) {
    errors.push({ field: 'sort', message: 'Sort must be one of: recent, rating-high, rating-low' });
  }
}

/**
 * Validates get seller reviews data
 * @param {string} sellerId - The seller ID
 * @param {Object} params - Request parameters containing sort and pagination info
 * @throws {ValidationError} If validation fails
 */
async function validateGetSellerReviewsData(sellerId, params) {
  const errors = [];

  // Validate the seller ID first
  validateSellerId(sellerId, errors);
  
  // Validate the sort parameter if provided
  validateSortParam(params.sort, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateSellerId,
  validateSortParam,
  validateGetSellerReviewsData
}; 