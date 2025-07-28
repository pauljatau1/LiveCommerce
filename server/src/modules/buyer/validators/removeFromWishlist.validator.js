const mongoose = require('mongoose');
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');

/**
 * Validate remove from wishlist data.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {string} productId - The product's ID to remove from wishlist
 * @throws {ValidationError} If validation fails
 */
async function validateRemoveFromWishlistData(buyerId, productId) {
  await validateBuyerId(buyerId);
  await validateProductId(productId);
  await validateBuyerExists(buyerId);
}

/**
 * Validate buyer ID format.
 * 
 * @param {string} buyerId
 */
async function validateBuyerId(buyerId) {
  const errors = [];
  
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  }

  if (buyerId && !mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validate product ID format.
 * 
 * @param {string} productId
 */
async function validateProductId(productId) {
  const errors = [];
  
  if (!productId) {
    errors.push({ field: 'productId', message: 'Product ID is required' });
  }

  if (productId && !mongoose.Types.ObjectId.isValid(productId)) {
    errors.push({ field: 'productId', message: 'Invalid product ID format' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validate that buyer exists.
 * 
 * @param {string} buyerId
 */
async function validateBuyerExists(buyerId) {
  const errors = [];
  
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    errors.push({ field: 'buyerId', message: 'Buyer not found' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateRemoveFromWishlistData
}; 