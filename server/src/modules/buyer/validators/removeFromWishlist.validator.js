const mongoose = require('mongoose');
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');

/**
 * Validate buyer ID format.
 * 
 * @param {string} buyerId
 * @param {Array} errors - Array to collect validation errors
 */
async function validateBuyerId(buyerId, errors) {
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
  }
}

/**
 * Validate product ID format.
 * 
 * @param {string} productId
 * @param {Array} errors - Array to collect validation errors
 */
async function validateProductId(productId, errors) {
  if (!productId) {
    errors.push({ field: 'productId', message: 'Product ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(productId)) {
    errors.push({ field: 'productId', message: 'Invalid product ID format' });
  }
}

/**
 * Validate that buyer exists.
 * 
 * @param {string} buyerId
 * @param {Array} errors - Array to collect validation errors
 */
async function validateBuyerExists(buyerId, errors) {
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    errors.push({ field: 'buyerId', message: 'Buyer not found' });
  }
}

/**
 * Validate remove from wishlist data.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {string} productId - The product's ID to remove from wishlist
 * @throws {ValidationError} If validation fails
 */
async function validateRemoveFromWishlistData(buyerId, productId) {
  const errors = [];

  // First validate format
  await validateBuyerId(buyerId, errors);
  await validateProductId(productId, errors);

  // If format validation passes, then check existence
  if (errors.length === 0) {
    await validateBuyerExists(buyerId, errors);
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateRemoveFromWishlistData
}; 