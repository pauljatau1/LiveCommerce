/**
 * Order Repository
 *
 * This repository contains all database operations related to the Order model
 * for seller-specific operations.
 *
 * @module orderRepository
 */

const Order = require('../../../models/Order');

/**
 * Count orders for a specific seller.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<number>} Number of orders for the seller
 */
async function countOrdersBySeller(sellerId) {
  return Order.countDocuments({ seller: sellerId });
}

module.exports = {
  countOrdersBySeller
};
