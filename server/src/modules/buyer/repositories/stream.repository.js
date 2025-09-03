const Stream = require('../../../models/Stream');

/**
 * Count streams created by a seller.
 * 
 * This function counts the number of streams created by a specific seller.
 * It uses MongoDB's countDocuments method for efficient counting.
 *
 * @param {string} sellerId - The seller's ID to count streams for
 * @returns {Promise<number>} Number of streams created by the seller
 */
async function countStreamsBySeller(sellerId) {
  return Stream.countDocuments({ seller: sellerId });
}

module.exports = {
  countStreamsBySeller
};
