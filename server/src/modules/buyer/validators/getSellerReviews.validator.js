const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates seller ID
 * @param {string} sellerId - The seller ID to validate
 * @throws {ValidationError} If sellerId is invalid
 */
function validateSellerId(sellerId) {
  // Check if sellerId is provided and is a string
  if (!sellerId || typeof sellerId !== 'string') {
    throw new ValidationError([
      { field: 'sellerId', message: 'Seller ID is required and must be a string' }
    ]);
  }
}

/**
 * Validates sort parameter
 * @param {string} sort - The sort parameter to validate
 * @throws {ValidationError} If sort is invalid
 */
function validateSortParam(sort) {
  // Define valid sort options for seller reviews
  const validSortOptions = ['recent', 'rating-high', 'rating-low'];
  
  // Allow empty string (defaults to 'recent' in service)
  // Only validate if sort is provided and not empty
  if (sort && sort !== '' && !validSortOptions.includes(sort)) {
    throw new ValidationError([
      { field: 'sort', message: 'Sort must be one of: recent, rating-high, rating-low' }
    ]);
  }
}

/**
 * Validates get seller reviews data
 * @param {string} sellerId - The seller ID
 * @param {Object} params - Request parameters containing sort and pagination info
 * @throws {ValidationError} If validation fails
 */
async function validateGetSellerReviewsData(sellerId, params) {
  // Validate the seller ID first
  validateSellerId(sellerId);
  
  // Validate the sort parameter if provided
  validateSortParam(params.sort);
}

module.exports = {
  validateSellerId,
  validateSortParam,
  validateGetSellerReviewsData
}; 