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

/**
 * Count orders for a specific seller with date range filter.
 * @param {string} sellerId - The seller's ID
 * @param {Object} dateFilter - Date range filter object
 * @param {Date} dateFilter.$gte - Start date (inclusive)
 * @param {Date} dateFilter.$lt - End date (exclusive)
 * @returns {Promise<number>} Number of orders for the seller in the date range
 */
async function countOrdersBySellerWithDateRange(sellerId, dateFilter = {}) {
  const query = { 
    'items.seller': new mongoose.Types.ObjectId(sellerId), 
    isStale: { $ne: true } 
  };
  
  if (Object.keys(dateFilter).length > 0) {
    query.createdAt = dateFilter;
  }
  
  return Order.countDocuments(query);
}

/**
 * Get distinct buyers who have placed orders with a specific seller.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<Array>} Array of unique buyer IDs
 */
async function getDistinctBuyersBySeller(sellerId) {
  return Order.distinct('buyer', { 
    'items.seller': new mongoose.Types.ObjectId(sellerId), 
    isStale: { $ne: true } 
  });
}

/**
 * Count orders for a seller with filters.
 * 
 * This function provides a simple way to count orders for a seller based on various filters.
 * It's commonly used for pagination and statistics.
 *
 * @param {Object} query - MongoDB query filters for seller orders
 * @returns {Promise<number>} Count of matching orders
 */
async function countOrders(query) {
  return Order.countDocuments(query);
}

/**
 * Find orders for a seller with pagination and filters.
 * 
 * This function retrieves orders with support for pagination, sorting, and population
 * of related data. It's optimized for order listing and management for sellers.
 *
 * @param {Object} query - Query object with filters
 * @param {Object} options - Pagination and sorting options
 * @param {Object} options.sort - Sorting criteria
 * @param {number} options.skip - Number of documents to skip
 * @param {number} options.limit - Number of documents to return
 * @returns {Promise<Array>} Array of orders with populated data
 */
async function findOrders(query, options) {
  return Order.find(query)
    .sort(options.sort)
    .skip(options.skip)
    .limit(options.limit)
    .populate('buyer', 'firstName lastName email')
    .populate('items.product', 'name images price');
}

module.exports = {
  countOrdersBySeller,
  getTopProductsBySeller,
  countOrdersBySellerWithDateRange,
  getDistinctBuyersBySeller,
  countOrders,
  findOrders
};
