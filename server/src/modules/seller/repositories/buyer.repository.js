/**
 * Buyer Repository
 *
 * This repository contains all database operations related to the Buyer model
 * for seller-specific operations.
 *
 * @module buyerRepository
 */

const Buyer = require('../../../models/Buyer');

/**
 * Count buyers following a specific seller.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<number>} Number of buyers following the seller
 */
async function countBuyersFollowingSeller(sellerId) {
  return Buyer.countDocuments({ 'followers.sellerId': sellerId });
}

/**
 * Count buyers that a seller is following.
 * 
 * This function counts the number of buyers that have the specified seller
 * in their followers array. This represents how many buyers the seller is following.
 *
 * @param {string} sellerId - The seller's ID to count following for
 * @returns {Promise<number>} Number of buyers the seller is following
 */
async function countBuyersFollowedBySeller(sellerId) {
  return await Buyer.countDocuments({
    'followers.sellerId': sellerId
  });
}

module.exports = {
  countBuyersFollowingSeller,
  countBuyersFollowedBySeller
};
