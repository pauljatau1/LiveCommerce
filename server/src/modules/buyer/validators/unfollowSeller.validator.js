const mongoose = require('mongoose');
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');
const Seller = require('../../../models/Seller');

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
 * Validate seller ID format.
 * 
 * @param {string} sellerId
 * @param {Array} errors - Array to collect validation errors
 */
async function validateSellerId(sellerId, errors) {
  if (!sellerId) {
    errors.push({ field: 'sellerId', message: 'Seller ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    errors.push({ field: 'sellerId', message: 'Invalid seller ID format' });
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
 * Validate that seller exists.
 * 
 * @param {string} sellerId
 * @param {Array} errors - Array to collect validation errors
 */
async function validateSellerExists(sellerId, errors) {
  const seller = await Seller.findById(sellerId);
  if (!seller) {
    errors.push({ field: 'sellerId', message: 'Seller not found' });
  }
}

/**
 * Validate unfollow seller data.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {string} sellerId - The seller's ID to unfollow
 * @throws {ValidationError} If validation fails
 */
async function validateUnfollowSellerData(buyerId, sellerId) {
  const errors = [];

  // First validate format
  await validateBuyerId(buyerId, errors);
  await validateSellerId(sellerId, errors);

  // If format validation passes, then check existence
  if (errors.length === 0) {
    await validateBuyerExists(buyerId, errors);
    await validateSellerExists(sellerId, errors);
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateUnfollowSellerData
}; 