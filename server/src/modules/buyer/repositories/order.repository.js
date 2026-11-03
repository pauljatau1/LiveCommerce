/**
 * Order Repository
 *
 * This repository contains all database operations related to the Order model.
 * It provides methods for finding, updating, and managing order data.
 *
 * @module orderRepository
 */

const Order = require('../../../models/Order');

/**
 * Count orders that match the given query.
 * 
 * This function provides a simple way to count orders based on various filters.
 * It's commonly used for pagination and statistics.
 *
 * @param {Object} query - MongoDB query filters
 * @returns {Promise<number>} Count of matching orders
 */
async function countOrders(query) {
  return Order.countDocuments(query);
}

/**
 * Find orders for a buyer with pagination and filters.
 * 
 * This function retrieves orders with support for pagination, sorting, and population
 * of related data. It's optimized for order listing and management.
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
    .populate('items.product', 'name images price')
    .populate('items.seller', 'storeName');
}



/**
 * Find a specific order by ID that belongs to a buyer.
 * 
 * This function retrieves a specific order with full population of related data.
 * It ensures the order belongs to the specified buyer for security.
 *
 * @param {string} orderId - The order's ID
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object|null>} Order with populated data or null if not found
 */
async function findByIdAndBuyer(orderId, buyerId) {
  return Order.findOne({
    _id: orderId,
    buyer: buyerId
  })
    .populate('items.product')
    .populate('items.seller', 'storeName email phoneNumber');
}

/**
 * Find all orders for a buyer.
 * 
 * This function retrieves all orders belonging to a specific buyer.
 * It's used for buyer order history and management.
 *
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Array>} Array of orders
 */
async function findBuyerOrders(buyerId) {
  return Order.find({ buyer: buyerId });
}

/**
 * Find recent orders for a buyer with populated data.
 * 
 * This function retrieves the most recent orders for a buyer with
 * populated product information. It's optimized for dashboard displays.
 *
 * @param {string} buyerId - The buyer's ID
 * @param {number} limit - Number of recent orders to retrieve
 * @returns {Promise<Array>} Array of recent orders with populated data
 */
async function findRecentOrders(buyerId, limit = 5) {
  return Order.find({ buyer: buyerId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('items.product', 'name images price');
}

/**
 * Check if a buyer has verified purchase from a seller.
 * 
 * This function checks if a buyer has made a verified purchase from a specific seller.
 * It's used for review permissions and seller-buyer relationship validation.
 *
 * Verification Criteria:
 * - Order must belong to the buyer
 * - Order must contain items from the seller
 * - Order status must be 'delivered' or 'completed'
 * - Order must have been delivered within a reasonable timeframe
 *
 * @param {string} buyerId - The buyer's ID
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<boolean>} True if buyer has verified purchase, false otherwise
 */
async function hasVerifiedPurchase(buyerId, sellerId) {
  const completedOrder = await Order.findOne({
    buyer: buyerId,
    seller: sellerId,
    'paymentInfo.status': 'completed',
    'shipping.tracking.status': 'delivered'
  });
  return !!completedOrder;
}

/**
 * Find orders for a seller.
 * 
 * This function retrieves all orders that belong to a specific seller.
 * It's used for seller dashboard and order management functionality.
 *
 * @param {string} sellerId - The seller's ID to find orders for
 * @returns {Promise<Array>} Array of order documents belonging to the seller
 */
async function findOrdersBySeller(sellerId) {
  return Order.find({ seller: sellerId });
}

/**
 * Get review statistics for a seller using MongoDB aggregation.
 * 
 * This function performs a complex aggregation pipeline to calculate
 * review statistics for a seller's products. It:
 * 1. Matches orders for the specific seller
 * 2. Unwinds order items to process each product individually
 * 3. Looks up product data to get review information
 * 4. Unwinds product reviews to process each review
 * 5. Groups and calculates total reviews and average rating
 *
 * Aggregation Pipeline Steps:
 * - $match: Filters orders by seller ID
 * - $unwind: Expands order items array
 * - $lookup: Joins with products collection to get review data
 * - $unwind: Expands product data array (should only have one element)
 * - $unwind: Expands reviews array to process each review individually
 * - $group: Calculates statistics (total reviews, average rating)
 *
 * @param {string} sellerId - The seller's ID to get review stats for
 * @returns {Promise<Array>} Array containing review statistics object
 *   - totalReviews: {number} - Total number of reviews
 *   - averageRating: {number} - Average rating across all reviews
 */
async function getReviewStats(sellerId) {
  const mongoose = require('mongoose');
  
  return Order.aggregate([
    // Step 1: Match orders for the specific seller
    { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
    
    // Step 2: Unwind order items to process each product individually
    { $unwind: '$items' },
    
    // Step 3: Lookup product data to get review information
    {
      $lookup: {
        from: 'products', // Collection to join with
        localField: 'items.product', // Field from orders collection
        foreignField: '_id', // Field from products collection
        as: 'productData' // Output array name
      }
    },
    
    // Step 4: Unwind product data array (should only have one element)
    { $unwind: '$productData' },
    
    // Step 5: Unwind reviews array to process each review individually
    { $unwind: '$productData.reviews' },
    
    // Step 6: Group and calculate statistics
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 }, // Count total reviews
        averageRating: { $avg: '$productData.reviews.rating' } // Calculate average rating
      }
    }
  ]);
}

module.exports = {
  countOrders,
  findOrders,
  findByIdAndBuyer,
  findBuyerOrders,
  findRecentOrders,
  hasVerifiedPurchase,
  findOrdersBySeller,
  getReviewStats
};
