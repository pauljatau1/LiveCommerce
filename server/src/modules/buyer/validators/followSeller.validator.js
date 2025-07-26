const mongoose = require('mongoose');
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');
const Seller = require('../../../models/Seller');

/**
 * Validate follow seller data.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {string} sellerId - The seller's ID to follow
 * @throws {ValidationError} If validation fails
 */
async function validateFollowSellerData(buyerId, sellerId) {
  await validateBuyerId(buyerId);
  await validateSellerId(sellerId);
  await validateBuyerExists(buyerId);
  await validateSellerExists(sellerId);
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
 * Validate seller ID format.
 * 
 * @param {string} sellerId
 */
async function validateSellerId(sellerId) {
  const errors = [];
  
  if (!sellerId) {
    errors.push({ field: 'sellerId', message: 'Seller ID is required' });
  }

  if (sellerId && !mongoose.Types.ObjectId.isValid(sellerId)) {
    errors.push({ field: 'sellerId', message: 'Invalid seller ID format' });
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

/**
 * Validate that seller exists.
 * 
 * @param {string} sellerId
 */
async function validateSellerExists(sellerId) {
  const errors = [];
  
  const seller = await Seller.findById(sellerId);
  if (!seller) {
    errors.push({ field: 'sellerId', message: 'Seller not found' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateFollowSellerData
}; 