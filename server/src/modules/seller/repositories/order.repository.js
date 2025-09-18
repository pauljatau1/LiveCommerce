/**
 * Order Repository
 *
 * This repository contains all database operations related to the Order model
 * for seller-specific operations.
 *
 * @module orderRepository
 */

const Order = require('../../../models/Order');

const mongoose = require('mongoose');

/**
 * Count orders for a specific seller.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<number>} Number of orders for the seller
 */
async function countOrdersBySeller(sellerId) {
  return Order.countDocuments({ seller: sellerId });
}

/**
 * Get top selling products for a specific seller using aggregation.
 * @param {string} sellerId - The seller's ID
 * @param {number} limit - Maximum number of products to return (default: 4)
 * @returns {Promise<Array>} Array of top selling products with details
 */
async function getTopProductsBySeller(sellerId, limit = 4) {
  return Order.aggregate([
    // Match orders for this seller
    { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
    // Unwind the items array
    { $unwind: '$items' },
    // Group by product and sum quantities
    { 
      $group: {
        _id: '$items.product',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    // Sort by quantity sold
    { $sort: { totalQuantity: -1 } },
    // Limit to top products
    { $limit: limit },
    // Lookup product details
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: '$productDetails' }
  ]);
}

module.exports = {
  countOrdersBySeller,
  getTopProductsBySeller
};
