/**
 * Stream Repository
 *
 * This repository contains all database operations related to the Stream model
 * for seller-specific operations.
 *
 * @module streamRepository
 */

const Stream = require('../../../models/Stream');

/**
 * Count streams for a specific seller.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<number>} Number of streams for the seller
 */
async function countStreamsBySeller(sellerId) {
  return Stream.countDocuments({ seller: sellerId });
}

module.exports = {
  countStreamsBySeller
};
