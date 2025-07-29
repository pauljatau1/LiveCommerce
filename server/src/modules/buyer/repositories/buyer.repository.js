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

/**
 * Find all orders for a buyer.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Array>} Array of orders
 */
async function findBuyerOrders(buyerId) {
  const Order = require('../../../models/Order');
  return Order.find({ buyer: buyerId });
}

/**
 * Find recent orders for a buyer with populated data.
 * @param {string} buyerId - The buyer's ID
 * @param {number} limit - Number of recent orders to retrieve
 * @returns {Promise<Array>} Array of recent orders with populated data
 */
async function findRecentOrders(buyerId, limit = 5) {
  const Order = require('../../../models/Order');
  return Order.find({ buyer: buyerId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('items.product', 'name images price');
}

/**
 * Find buyer by ID and select only shipping addresses.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Buyer|null>} Buyer with shipping addresses or null if not found
 */
async function findByIdWithShippingAddresses(buyerId) {
  return Buyer.findById(buyerId).select('shippingAddresses');
}

/**
 * Add a new shipping address to a buyer.
 * @param {string} buyerId - The buyer's ID
 * @param {Object} addressData - The address data to add
 * @returns {Promise<Buyer>} Updated buyer with new address
 */
async function addShippingAddress(buyerId, addressData) {
  const buyer = await Buyer.findById(buyerId);
  if (!buyer) {
    return null;
  }

  // Add new address to the array
  buyer.shippingAddresses = [...buyer.shippingAddresses, addressData];

  // Save the updated buyer document
  return await buyer.save();
}

/**
 * Update a shipping address for a buyer.
 * @param {string} buyerId - The buyer's ID
 * @param {string} addressId - The address ID to update
 * @param {Object} updateData - The address data to update
 * @returns {Promise<Buyer>} Updated buyer with modified address
 */
async function updateShippingAddress(buyerId, addressId, updateData) {
  const buyer = await Buyer.findById(buyerId);
  if (!buyer) {
    return null;
  }

  const addressIndex = buyer.shippingAddresses.findIndex(
    addr => addr._id.toString() === addressId
  );

  if (addressIndex === -1) {
    return null;
  }

  const updatedAddress = {
    ...buyer.shippingAddresses[addressIndex].toObject(),
    ...updateData
  };

  buyer.shippingAddresses[addressIndex] = updatedAddress;
  return await buyer.save();
}

/**
 * Delete a shipping address for a buyer.
 * @param {string} buyerId - The buyer's ID
 * @param {string} addressId - The address ID to delete
 * @returns {Promise<Buyer|null>} Updated buyer with address removed or null if not found
 */
async function deleteShippingAddress(buyerId, addressId) {
  const buyer = await Buyer.findById(buyerId);
  if (!buyer) {
    return null;
  }

  if (!buyer.shippingAddresses) {
    return null;
  }

  const addressIndex = buyer.shippingAddresses.findIndex(
    addr => addr._id.toString() === addressId
  );

  if (addressIndex === -1) {
    return null;
  }

  buyer.shippingAddresses.splice(addressIndex, 1);
  return await buyer.save();
}

/**
 * Find a buyer by ID with populated wishlist data.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Buyer|null>} Buyer with populated wishlist or null if not found
 */
async function findByIdWithPopulatedWishlist(buyerId) {
  return Buyer.findById(buyerId)
    .populate({
      path: 'wishlist.product',
      select: 'name description price images category brand stock',
      populate: {
        path: 'seller',
        select: 'storeName businessName'
      }
    });
}

/**
 * Update buyer's phone verification data.
 * @param {string} buyerId - The buyer's ID
 * @param {Object} phoneVerificationData - The phone verification data to update
 * @returns {Promise<Buyer|null>} Updated buyer or null if not found
 */
async function updatePhoneVerification(buyerId, phoneVerificationData) {
  const buyer = await Buyer.findById(buyerId);
  if (!buyer) {
    return null;
  }

  buyer.phoneVerification = phoneVerificationData;
  return await buyer.save();
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
  findOrderByIdAndBuyer,
  findBuyerOrders,
  findRecentOrders,
  findByIdWithShippingAddresses,
  addShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  findByIdWithPopulatedWishlist,
  updatePhoneVerification
};