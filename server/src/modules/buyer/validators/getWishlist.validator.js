const mongoose = require('mongoose');
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');

/**
 * Validate get wishlist data.
 * 
 * @param {string} buyerId - The buyer's ID
 * @throws {ValidationError} If validation fails
 */
async function validateGetWishlistData(buyerId) {
  await validateBuyerId(buyerId);
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
  validateGetWishlistData
}; 