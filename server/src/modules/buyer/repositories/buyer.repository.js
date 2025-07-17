const Buyer = require('../models/buyer.model');
const Post = require('../../../models/Post');

/**
 * Retrieves all buyers that match the given filters.
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - MongoDB query filters
 * @returns {Promise<Array>} List of users excluding sensitive fields
 */
async function findAll(filters = {}) {
  return await Buyer.find(filters).select('-__v -password'); // Exclude sensitive or unneeded fields
}

/**
 * Create a new buyer.
 *
 * @param {Object} buyer - new buyer object
 * @returns {Promise<Array>} List of users excluding sensitive fields
 */
async function save(newBuyer) {
  return await newBuyer.save();
}

/**
 * Find a Buyer by email.
 * @param {string} email 
 * @returns {Promise<Buyer|null>}
 */
async function findByEmail(email) {
  return Buyer.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
}

/**
 * Save a new Buyer.
 * @param {Buyer} buyerInstance
 * @returns {Promise<Buyer>}
 */
async function saveBuyer(buyerInstance) {
  return buyerInstance.save();
}

/**
 * Find a buyer by ID.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Buyer|null>}
 */
async function findById(buyerId) {
  return Buyer.findById(buyerId);
}

/**
 * Find a buyer by ID with specific fields selected.
 * @param {string} buyerId - The buyer's ID
 * @param {Object} fields - Object specifying which fields to include/exclude
 * @returns {Promise<Buyer|null>}
 */
async function findByIdWithFields(buyerId, fields) {
  return Buyer.findById(buyerId).select(fields).lean();
}

/**
 * Get the count of followers for a buyer.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<number>} Number of followers
 */
async function getFollowersCount(buyerId) {
  const buyer = await Buyer.findById(buyerId).select('followers');
  return buyer?.followers?.length || 0;
}

/**
 * Get the count of users the buyer is following (sellers).
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<number>} Number of users being followed
 */
async function getFollowingCount(buyerId) {
  const buyer = await Buyer.findById(buyerId).select('activityFeed');
  return buyer?.activityFeed?.filter(activity =>
    activity.type === 'follow' &&
    activity.referenceModel === 'Seller'
  ).length || 0;
}

/**
 * Get the count of posts by a buyer.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<number>} Number of posts
 */
async function getPostsCount(buyerId) {
  return Post.countDocuments({ 
    'author.userId': buyerId, 
    'author.userModel': 'Buyer' 
  });
}

/**
 * Find a buyer by username.
 * @param {string} username - The username to search for
 * @returns {Promise<Buyer|null>}
 */
async function findByUsername(username) {
  return Buyer.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
}

/**
 * Update a buyer by ID.
 * @param {string} buyerId - The buyer's ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Buyer>}
 */
async function updateById(buyerId, updateData) {
  return Buyer.findByIdAndUpdate(
    buyerId, 
    updateData, 
    { new: true, runValidators: true }
  );
}

/**
 * Find a buyer by ID with selected categories populated.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Buyer|null>}
 */
async function findByIdWithSelectedCategories(buyerId) {
  return Buyer.findById(buyerId)
    .select('selectedCategories')
    .populate({
      path: 'selectedCategories',
      select: 'name subCategories'
    });
}

/**
 * Count orders for a buyer with optional filters.
 * @param {Object} query - Query object with filters
 * @returns {Promise<number>}
 */
async function countOrders(query) {
  const Order = require('../../../models/Order');
  return Order.countDocuments(query);
}

/**
 * Find orders for a buyer with pagination and filters.
 * @param {Object} query - Query object with filters
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Array>}
 */
async function findOrders(query, options) {
  const Order = require('../../../models/Order');
  return Order.find(query)
    .sort(options.sort)
    .skip(options.skip)
    .limit(options.limit)
    .populate('items.product', 'name images price')
    .populate('items.seller', 'storeName');
}

/**
 * Find return requests for orders.
 * @param {Array} orderIds - Array of order IDs
 * @returns {Promise<Array>}
 */
async function findReturnRequests(orderIds) {
  const Return = require('../../../models/Return');
  return Return.find({
    order: { $in: orderIds }
  }, '_id order status');
}

/**
 * Find a specific order by ID that belongs to a buyer.
 * @param {string} orderId - The order's ID
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object|null>} Order with populated data or null if not found
 */
async function findOrderByIdAndBuyer(orderId, buyerId) {
  const Order = require('../../../models/Order');
  const mongoose = require('mongoose');
  
  // Check if orderId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return null;
  }
  
  return Order.findOne({
    _id: orderId,
    buyer: buyerId
  })
    .populate('items.product')
    .populate('items.seller', 'storeName email phoneNumber');
}

module.exports = {
  findAll,
  save,
  findByEmail,
  saveBuyer,
  findById,
  findByIdWithFields,
  getFollowersCount,
  getFollowingCount,
  getPostsCount,
  findByUsername,
  updateById,
  findByIdWithSelectedCategories,
  countOrders,
  findOrders,
  findReturnRequests,
  findOrderByIdAndBuyer
};