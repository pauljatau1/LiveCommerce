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

module.exports = {
  countBuyersFollowingSeller
};
