const Buyer = require('../models/buyer.model');
const Post = require('../../../models/Post');
const Seller = require('../../../models/Seller');
const Order = require('../../../models/Order');
const Stream = require('../../../models/Stream');

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

/**
 * Find a seller by ID with selected fields.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<Seller|null>} Seller with selected fields or null if not found
 */
async function findSellerById(sellerId) {
  return Seller.findById(sellerId)
    .select('firstName lastName email businessName businessType taxInformation businessEmail businessNumber accountPending businessAddress accountType isVerified isInternational verificationDocuments smileIdVerification cancelledStreamCount lastStreamCancellation categories shippingOptions warehouseDetails storeName aboutStore storeAvatar storeBanner socialMedia vacationMode createdAt updatedAt followers reviews stats')
    .populate('reviews');
}

/**
 * Find orders for a seller.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<Array>} Array of orders
 */
async function findOrdersBySeller(sellerId) {
  return Order.find({ seller: sellerId });
}

/**
 * Count streams for a seller.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<number>} Number of streams
 */
async function countStreamsBySeller(sellerId) {
  return Stream.countDocuments({ seller: sellerId });
}

/**
 * Count buyers following a seller.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<number>} Number of followers
 */
async function countBuyersFollowingSeller(sellerId) {
  const seller = await Seller.findById(sellerId).select('followers');
  return seller ? (seller.followers?.length || 0) : 0;
}

/**
 * Get review statistics for a seller.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<Object>} Review statistics
 */
async function getSellerReviewStats(sellerId) {
  const mongoose = require('mongoose');
  
  return Order.aggregate([
    { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productData'
      }
    },
    { $unwind: '$productData' },
    { $unwind: '$productData.reviews' },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$productData.reviews.rating' }
      }
    }
  ]);
}

/**
 * Increment store visits for a seller.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<Seller|null>} Updated seller or null if not found
 */
async function incrementSellerStoreVisits(sellerId) {
  return Seller.findByIdAndUpdate(sellerId, { $inc: { storeVisits: 1 } }, { new: true });
}

/**
 * Find buyer with populated followers.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Buyer|null>} Buyer with populated followers or null if not found
 */
async function findByIdWithPopulatedFollowers(buyerId) {
  return Buyer.findById(buyerId)
    .populate({
      path: 'followers.sellerId',
      select: 'firstName lastName storeName businessName profileImage storeAvatar'
    });
}

/**
 * Find sellers that a buyer follows.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Array>} Array of sellers that the buyer follows
 */
async function findSellersFollowingByBuyer(buyerId) {
  return Seller.find({
    'followers.buyerId': buyerId
  }).select('_id firstName lastName storeName businessName storeAvatar profileImage followers');
}

/**
 * Find buyers that a buyer follows.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Array>} Array of buyers that the buyer follows
 */
async function findBuyersFollowingByBuyer(buyerId) {
  // Note: Buyers don't follow other buyers in the current schema
  // This method is kept for future extensibility
  return [];
}

/**
 * Check if buyer has made a verified purchase from seller.
 * @param {string} buyerId - The buyer's ID
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<boolean>} True if buyer has made a verified purchase
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
 * Save a seller instance.
 * @param {Object} seller - The seller instance to save
 * @returns {Promise<Seller>} The saved seller
 */
async function saveSeller(seller) {
  return seller.save();
}

/**
 * Find seller with reviews and stats.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<Seller|null>} Seller with reviews and stats or null if not found
 */
async function findSellerWithReviews(sellerId) {
  // Query seller by ID and select only the fields needed for reviews functionality
  return Seller.findById(sellerId)
    .select('reviews stats.averageRating stats.totalReviews stats.ratingDistribution');
}

/**
 * Find buyer by ID with selected fields.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Buyer|null>} Buyer with selected fields or null if not found
 */
async function findBuyerByIdWithFields(buyerId) {
  // Query buyer by ID and select only the fields needed for review population
  return Buyer.findById(buyerId)
    .select('firstName lastName profileImage');
}

/**
 * Find buyer by ID with notification preferences field selected.
 * 
 * This method retrieves a buyer from the database and selects only the
 * notificationPreferences field to optimize performance when only preferences
 * are needed.
 * 
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object|null>} The buyer with notification preferences or null if not found
 */
async function findBuyerWithNotificationPreferences(buyerId) {
  // Use findById with field selection to only retrieve notificationPreferences
  // This optimizes database queries when only preferences are needed
  return Buyer.findById(buyerId).select('notificationPreferences');
}

/**
 * Update notification preferences for a buyer.
 * 
 * This method updates the notification preferences for a specific buyer
 * using findByIdAndUpdate with optimistic concurrency control.
 * The method returns the updated document with the new preferences.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {Object} preferences - The notification preferences to update
 * @returns {Promise<Object|null>} The updated buyer document or null if not found
 */
async function updateNotificationPreferences(buyerId, preferences) {
  // Use findByIdAndUpdate with $set to update only the notificationPreferences field
  // This ensures atomic updates and returns the updated document
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $set: {
        notificationPreferences: preferences
      }
    },
    {
      new: true,        // Return the updated document
      runValidators: true  // Run Mongoose validators on the update
    }
  );
}

/**
 * Update buyer with reset password OTP and expiry.
 * 
 * This method updates the reset password OTP fields for a specific buyer
 * using findByIdAndUpdate to ensure atomic updates.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {string} resetOTP - The reset OTP to set
 * @param {Date} expiresAt - The expiry date for the OTP
 * @returns {Promise<Object|null>} The updated buyer document or null if not found
 */
async function updateResetPasswordOTP(buyerId, resetOTP, expiresAt) {
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $set: {
        resetPasswordOTP: resetOTP,
        resetPasswordOTPExpires: expiresAt
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
}

/**
 * Reset buyer password and clear reset OTP fields.
 * 
 * This method updates the buyer's password and clears the reset OTP fields
 * using findByIdAndUpdate to ensure atomic updates.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {string} newPassword - The new hashed password
 * @returns {Promise<Object|null>} The updated buyer document or null if not found
 */
async function resetPassword(buyerId, newPassword) {
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $set: {
        password: newPassword
      },
      $unset: {
        resetPasswordOTP: 1,
        resetPasswordOTPExpires: 1
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
}

/**
 * Update buyer with account deletion OTP and expiry.
 * 
 * This method updates the account deletion OTP fields for a specific buyer
 * using findByIdAndUpdate to ensure atomic updates.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {string} deletionOTP - The deletion OTP to set
 * @param {Date} expiresAt - The expiry date for the OTP
 * @returns {Promise<Object|null>} The updated buyer document or null if not found
 */
async function updateAccountDeletionOTP(buyerId, deletionOTP, expiresAt) {
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $set: {
        'accountDeletion.otp': deletionOTP,
        'accountDeletion.expiresAt': expiresAt,
        'accountDeletion.attempts': 0
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
}

/**
 * Increments the account deletion OTP verification attempts for a buyer.
 * This function is used for security tracking and brute force prevention.
 * It atomically increments the failed attempt counter to ensure data consistency
 * even in concurrent scenarios.
 * 
 * @param {string} buyerId - The buyer ID (MongoDB ObjectId string)
 * @returns {Promise<Object|null>} The updated buyer document with incremented attempts or null if buyer not found
 */
async function incrementAccountDeletionAttempts(buyerId) {
  // Use MongoDB's atomic $inc operator to safely increment the attempts counter
  // This prevents race conditions when multiple requests occur simultaneously
  return Buyer.findByIdAndUpdate(
    buyerId,                          // Filter: find buyer by ID
    {
      $inc: {
        'accountDeletion.attempts': 1  // Increment attempts by 1 using atomic operation
      }
    },
    {
      new: true,                      // Return the updated document (after modification)
      runValidators: true             // Ensure Mongoose schema validators are applied
    }
  );
}

/**
 * Permanently deletes a buyer account by ID.
 * This is an irreversible operation that completely removes the buyer document
 * from the database. Use with extreme caution as this cannot be undone.
 * All associated data should be handled by cascade operations or cleanup processes.
 * 
 * @param {string} buyerId - The buyer ID (MongoDB ObjectId string)
 * @returns {Promise<Object|null>} The deleted buyer document or null if buyer not found
 */
async function deleteById(buyerId) {
  // Permanently remove the buyer document from the database
  // This is the final step in account deletion process
  return Buyer.findByIdAndDelete(buyerId);
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
  updatePhoneVerification,
  findSellerById,
  findOrdersBySeller,
  countStreamsBySeller,
  countBuyersFollowingSeller,
  getSellerReviewStats,
  incrementSellerStoreVisits,
  findByIdWithPopulatedFollowers,
  findSellersFollowingByBuyer,
  findBuyersFollowingByBuyer,
  hasVerifiedPurchase,
  saveSeller,
  findSellerWithReviews,
  findBuyerByIdWithFields,
  findBuyerWithNotificationPreferences,
  updateNotificationPreferences,
  updateResetPasswordOTP,
  resetPassword,
  updateAccountDeletionOTP,
  incrementAccountDeletionAttempts,
  deleteById
};