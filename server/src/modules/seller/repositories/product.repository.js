/**
 * Product Repository
 *
 * This repository contains all database operations related to the Product model
 * for seller-specific operations.
 *
 * @module productRepository
 */

const Product = require('../../../models/Product');

/**
 * Find products by seller with blips information.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<Array>} Array of products with blips
 */
async function findProductsBySeller(sellerId) {
  return Product.find({ seller: sellerId }).select('blips').lean();
}

module.exports = {
  findProductsBySeller
};
