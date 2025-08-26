const Buyer = require('../../../models/Buyer');
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
  return buyer.followers.length;
}

/**
 * Get the count of users the buyer is following (sellers).
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<number>} Number of users being followed
 */
async function getFollowingCount(buyerId) {
  const buyer = await Buyer.findById(buyerId).select('activityFeed');
  return buyer.activityFeed.filter(activity =>
    activity.type === 'follow' &&
    activity.referenceModel === 'Seller'
  ).length;
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
  return Buyer.findByIdAndUpdate(
    buyerId,
    { $push: { shippingAddresses: addressData } },
    { new: true, runValidators: true }
  );
}

/**
 * Update a shipping address for a buyer.
 * @param {string} buyerId - The buyer's ID
 * @param {string} addressId - The address ID to update
 * @param {Object} updateData - The address data to update
 * @returns {Promise<Buyer>} Updated buyer with modified address
 */
async function updateShippingAddress(buyerId, addressId, updateData) {
  // Build the update object with dot notation for each field
  const updateObject = {};
  Object.keys(updateData).forEach(key => {
    updateObject[`shippingAddresses.$.${key}`] = updateData[key];
  });

  return Buyer.findOneAndUpdate(
    {
      _id: buyerId,
      'shippingAddresses._id': addressId
    },
    {
      $set: updateObject
    },
    { new: true }
  );
}

/**
 * Delete a shipping address for a buyer.
 * @param {string} buyerId - The buyer's ID
 * @param {string} addressId - The address ID to delete
 * @returns {Promise<Buyer>} Updated buyer with address removed
 */
async function deleteShippingAddress(buyerId, addressId) {
  return Buyer.findByIdAndUpdate(
    buyerId,
    { $pull: { shippingAddresses: { _id: addressId } } },
    { new: true }
  );
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
 * 
 * This function updates the phone verification information for a buyer.
 * It uses findByIdAndUpdate to ensure atomic updates and returns the updated document.
 * The runValidators option ensures that any schema validations are applied during the update.
 *
 * @param {string} buyerId - The buyer's ID to update
 * @param {Object} phoneVerificationData - The phone verification data to update
 * @param {string} phoneVerificationData.otp - The OTP code for phone verification
 * @param {Date} phoneVerificationData.expiresAt - When the OTP expires
 * @param {boolean} phoneVerificationData.verified - Whether the phone is verified
 * @returns {Promise<Buyer>} Updated buyer document with new phone verification data
 */
async function updatePhoneVerification(buyerId, phoneVerificationData) {
  return Buyer.findByIdAndUpdate(
    buyerId,
    { $set: { phoneVerification: phoneVerificationData } }, // Use $set to update the entire phoneVerification object
    { new: true, runValidators: true } // Return updated document and run schema validations
  );
}

/**
 * Find a user by ID based on userType.
 * 
 * This function provides a generic way to find either a buyer or seller
 * based on the userType parameter. It routes the query to the appropriate
 * model (Buyer or Seller) based on the userType.
 *
 * @param {string} userId - The user ID to find
 * @param {string} userType - The type of user ('buyer' or 'seller')
 * @returns {Promise<Object>} The found user document (Buyer or Seller)
 * @throws {Error} If userType is not 'buyer' or 'seller'
 */
async function findUserById(userId, userType) {
  if (userType === 'seller') {
    return await Seller.findById(userId); // Query the Seller collection
  }
  return await Buyer.findById(userId); // Query the Buyer collection
}

/**
 * Find a seller by ID with selected fields for public profile display.
 * 
 * This function retrieves a seller with carefully selected fields that are
 * appropriate for public display. It excludes sensitive information like
 * passwords, internal IDs, and private business details while including
 * all necessary information for store display and user interaction.
 *
 * Selected Fields Include:
 * - Basic Info: firstName, lastName, email
 * - Business Info: businessName, businessType, businessEmail, businessNumber
 * - Store Info: storeName, aboutStore, storeAvatar, storeBanner
 * - Verification: isVerified, verificationDocuments, smileIdVerification
 * - Categories: categories (for store categorization)
 * - Social: socialMedia, followers
 * - Stats: reviews, stats (for store performance metrics)
 * - Settings: vacationMode, shippingOptions, warehouseDetails
 *
 * @param {string} sellerId - The seller's ID to retrieve
 * @returns {Promise<Seller|null>} Seller document with selected fields or null if not found
 */
async function findSellerById(sellerId) {
  return Seller.findById(sellerId)
    .select('firstName lastName email businessName businessType taxInformation businessEmail businessNumber accountPending businessAddress accountType isVerified isInternational verificationDocuments smileIdVerification cancelledStreamCount lastStreamCancellation categories shippingOptions warehouseDetails storeName aboutStore storeAvatar storeBanner socialMedia vacationMode createdAt updatedAt followers reviews stats')
    .populate('reviews'); // Populate reviews for immediate access to review data
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
 * Count streams for a seller.
 * 
 * This function counts the total number of streams created by a seller.
 * It's used for seller statistics and profile information.
 *
 * @param {string} sellerId - The seller's ID to count streams for
 * @returns {Promise<number>} Number of streams created by the seller
 */
async function countStreamsBySeller(sellerId) {
  return Stream.countDocuments({ seller: sellerId });
}

/**
 * Count buyers following a seller.
 * 
 * This function counts the number of buyers who are following a specific seller.
 * It retrieves only the followers field to optimize performance and then
 * returns the length of the followers array.
 *
 * @param {string} sellerId - The seller's ID to count followers for
 * @returns {Promise<number>} Number of buyers following the seller
 */
async function countBuyersFollowingSeller(sellerId) {
  const seller = await Seller.findById(sellerId).select('followers'); // Only retrieve followers field
  return seller.followers.length; // Return the count of followers
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
async function getSellerReviewStats(sellerId) {
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
        _id: null, // Group all documents together
        totalReviews: { $sum: 1 }, // Count total reviews
        averageRating: { $avg: '$productData.reviews.rating' } // Calculate average rating
      }
    }
  ]);
}

/**
 * Increment store visits for a seller.
 * 
 * This function atomically increments the storeVisits counter for a seller.
 * It uses the $inc operator to ensure thread-safe increment operations
 * and returns the updated seller document.
 *
 * @param {string} sellerId - The seller's ID to increment visits for
 * @returns {Promise<Seller|null>} Updated seller document with incremented storeVisits or null if not found
 */
async function incrementSellerStoreVisits(sellerId) {
  return Seller.findByIdAndUpdate(
    sellerId, 
    { $inc: { storeVisits: 1 } }, // Atomically increment storeVisits by 1
    { new: true } // Return the updated document
  );
}

/**
 * Find buyer with populated followers.
 * 
 * This function retrieves a buyer with their followers list populated with
 * seller information. It's used for displaying buyer's following relationships
 * with detailed seller information.
 *
 * Populated Fields:
 * - sellerId: Full seller object with basic information
 * - firstName, lastName: Seller's name
 * - storeName, businessName: Store information
 * - profileImage, storeAvatar: Visual elements
 *
 * @param {string} buyerId - The buyer's ID to retrieve followers for
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
 * 
 * This function retrieves all sellers that a specific buyer is following.
 * It queries the Seller collection to find sellers who have the buyer
 * in their followers list.
 *
 * Query Strategy:
 * - Searches Seller collection for sellers with buyer in followers array
 * - Selects essential fields for display
 * - Returns array of seller objects with follower information
 *
 * @param {string} buyerId - The buyer's ID to find followed sellers for
 * @returns {Promise<Array>} Array of sellers that the buyer follows
 */
async function findSellersFollowingByBuyer(buyerId) {
  return Seller.find({
    'followers.buyerId': buyerId
  }).select('_id firstName lastName storeName businessName storeAvatar profileImage followers');
}

/**
 * Find buyers that a buyer follows.
 * 
 * This function is a placeholder for potential future functionality where
 * buyers might follow other buyers. Currently, the schema doesn't support
 * buyer-to-buyer following, so this returns empty results.
 *
 * Note: This query is intentionally designed to return empty results
 * as the current schema doesn't support buyer-to-buyer following.
 *
 * @param {string} buyerId - The buyer's ID to find followed buyers for
 * @returns {Promise<Array>} Array of buyers that the buyer follows (currently empty)
 */
async function findBuyersFollowingByBuyer(buyerId) {
  // Note: Buyers don't follow other buyers in the current schema
  // This is a proper database query that returns empty results
  return Buyer.find({
    'followers.buyerId': buyerId
  }).select('_id firstName lastName profileImage');
}

/**
 * Check if buyer has made a verified purchase from seller.
 * 
 * This function verifies whether a buyer has completed a purchase from
 * a specific seller by checking for orders that meet specific criteria.
 *
 * Verification Criteria:
 * - Order belongs to the specified buyer and seller
 * - Payment status is 'completed'
 * - Shipping tracking status is 'delivered'
 * - This ensures only fully completed transactions are considered
 *
 * @param {string} buyerId - The buyer's ID to check purchase history for
 * @param {string} sellerId - The seller's ID to check against
 * @returns {Promise<boolean>} True if buyer has made a verified purchase from this seller
 */
async function hasVerifiedPurchase(buyerId, sellerId) {
  const completedOrder = await Order.findOne({
    buyer: buyerId,
    seller: sellerId,
    'paymentInfo.status': 'completed', // Payment must be completed
    'shipping.tracking.status': 'delivered' // Order must be delivered
  });
  return !!completedOrder; // Convert to boolean
}

/**
 * Save a seller instance.
 * 
 * This function saves a seller document to the database. It's used when
 * seller data has been modified and needs to be persisted.
 *
 * @param {Object} seller - The seller instance to save
 * @returns {Promise<Seller>} The saved seller document
 */
async function saveSeller(seller) {
  return seller.save();
}

/**
 * Find seller with reviews and stats.
 * 
 * This function retrieves a seller with their review statistics and
 * rating information. It's optimized to only fetch the fields needed
 * for review-related functionality.
 *
 * Selected Fields:
 * - reviews: Array of review objects
 * - stats.averageRating: Average rating across all reviews
 * - stats.totalReviews: Total number of reviews
 * - stats.ratingDistribution: Breakdown of ratings by level
 *
 * @param {string} sellerId - The seller's ID to retrieve reviews for
 * @returns {Promise<Seller|null>} Seller with reviews and stats or null if not found
 */
async function findSellerWithReviews(sellerId) {
  // Query seller by ID and select only the fields needed for reviews functionality
  return Seller.findById(sellerId)
    .select('reviews stats.averageRating stats.totalReviews stats.ratingDistribution');
}

/**
 * Find buyer by ID with selected fields.
 * 
 * This function retrieves a buyer with only the fields needed for
 * review population. It's optimized for performance when only basic
 * buyer information is required.
 *
 * Selected Fields:
 * - firstName, lastName: Buyer's name for review display
 * - profileImage: Buyer's profile image for review display
 *
 * @param {string} buyerId - The buyer's ID to retrieve
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
 * are needed. It's used for notification preference management.
 * 
 * Performance Optimization:
 * - Only retrieves notificationPreferences field
 * - Reduces data transfer and memory usage
 * - Optimized for preference-only operations
 * 
 * @param {string} buyerId - The buyer's ID to retrieve preferences for
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
 * Update Strategy:
 * - Uses $set operator for atomic updates
 * - Returns updated document for confirmation
 * - Handles concurrent updates safely
 * - Optimized for preference-only updates
 * 
 * @param {string} buyerId - The buyer's ID to update preferences for
 * @param {Object} preferences - The notification preferences object to update
 * @returns {Promise<Object|null>} The updated buyer document or null if not found
 */
async function updateNotificationPreferences(buyerId, preferences) {
  // Use findByIdAndUpdate with $set to update only the notificationPreferences field
  // This ensures atomic updates and returns the updated document
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $set: { notificationPreferences: preferences }
    },
    { new: true } // Return the updated document
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

/**
 * Adds a new report to a buyer's reports array.
 * This function safely adds a report document to the buyer's reports collection
 * using MongoDB's $push operator for atomic array operations.
 * 
 * @param {string} buyerId - The buyer ID (MongoDB ObjectId string) who is making the report
 * @param {Object} reportData - The report data to add
 * @returns {Promise<Object|null>} The updated buyer document with the new report or null if buyer not found
 */
async function addReport(buyerId, reportData) {
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $push: {
        reports: reportData
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
}

/**
 * Find buyer by ID with populated wallet on-hold items.
 * This function retrieves a buyer document with their wallet on-hold items
 * populated with product information including auction status and images.
 * 
 * @param {string} buyerId - The buyer ID (MongoDB ObjectId string)
 * @returns {Promise<Object|null>} The buyer document with populated wallet on-hold items or null if not found
 */
async function findByIdWithWalletOnHoldItems(buyerId) {
  return Buyer.findById(buyerId)
    .populate('wallet.onHoldItems.productId', 'name images auction.status auction.endDate');
}

/**
 * Update buyer's wallet on-hold items and recalculated on-hold amount.
 * This function atomically updates the buyer's wallet with filtered on-hold items
 * and the recalculated on-hold amount when ended auctions are released.
 * 
 * @param {string} buyerId - The buyer ID (MongoDB ObjectId string)
 * @param {Array} filteredOnHoldItems - The filtered on-hold items (ended auctions removed)
 * @param {number} recalculatedOnHoldAmount - The recalculated total on-hold amount
 * @returns {Promise<Object|null>} The updated buyer document or null if buyer not found
 */
async function updateWalletOnHoldItems(buyerId, filteredOnHoldItems, recalculatedOnHoldAmount) {
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $set: {
        'wallet.onHoldItems': filteredOnHoldItems,
        'wallet.onHoldAmount': recalculatedOnHoldAmount
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
}

/**
 * Find a buyer by ID with wallet transactions.
 * This function retrieves a buyer document with their wallet information
 * including transactions and balance.
 * 
 * @param {string} buyerId - The buyer ID (MongoDB ObjectId string)
 * @returns {Promise<Object|null>} The buyer document with wallet information or null if not found
 */
async function findByIdWithWallet(buyerId) {
  return Buyer.findById(buyerId).select('wallet firstName lastName email');
}

/**
 * Update buyer's wallet with new transaction and balance.
 * This function adds a new transaction to the buyer's wallet and updates the balance.
 * 
 * @param {string} buyerId - The buyer ID (MongoDB ObjectId string)
 * @param {Object} transaction - The transaction object to add
 * @param {number} newBalance - The new wallet balance after transaction
 * @returns {Promise<Object|null>} The updated buyer document or null if buyer not found
 */
async function updateWalletWithTransaction(buyerId, transaction, newBalance) {
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $push: { 'wallet.transactions': transaction },
      $set: { 'wallet.balance': newBalance }
    },
    {
      new: true,
      runValidators: true
    }
  );
}

/**
 * Update an existing wallet transaction status.
 * This function updates the status of an existing transaction in the buyer's wallet.
 * 
 * @param {string} buyerId - The buyer ID (MongoDB ObjectId string)
 * @param {string} paymentReference - The payment reference to find the transaction
 * @param {string} newStatus - The new status for the transaction
 * @param {number} newBalance - The new wallet balance after status update
 * @returns {Promise<Object|null>} The updated buyer document or null if buyer not found
 */
async function updateWalletTransactionStatus(buyerId, paymentReference, newStatus, newBalance) {
  return Buyer.findOneAndUpdate(
    {
      _id: buyerId,
      'wallet.transactions.paymentReference': paymentReference
    },
    {
      $set: {
        'wallet.transactions.$.status': newStatus,
        'wallet.balance': newBalance
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
}

/**
 * Find sellers that can be followed with filtering and pagination.
 * 
 * @param {Object} options - Query options
 * @param {Object} options.query - MongoDB query filters
 * @param {Object} options.sortOptions - Sort options
 * @param {number} options.skip - Number of documents to skip
 * @param {number} options.limit - Number of documents to return
 * @returns {Promise<Array>} Array of sellers that can be followed
 */
async function findSellersToFollow({ query, sortOptions, skip, limit }) {
  const Seller = require('../../../models/Seller');
  
  return await Seller.find(query)
    .select(`
      storeName businessName aboutStore storeAvatar 
      categories stats followers isVerified isFeatured 
      createdAt
    `)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean();
}

/**
 * Count sellers that match the given query.
 * 
 * @param {Object} query - MongoDB query filters
 * @returns {Promise<number>} Count of matching sellers
 */
async function countSellersToFollow(query) {
  const Seller = require('../../../models/Seller');
  return await Seller.countDocuments(query);
}

/**
 * Find sellers with randomization.
 * 
 * @param {Object} query - MongoDB query filters
 * @param {number} limit - Number of documents to return
 * @param {number} randomSkip - Random skip value for randomization
 * @returns {Promise<Array>} Array of sellers that can be followed
 */
async function findSellersToFollowRandomized(query, limit, randomSkip) {
  const Seller = require('../../../models/Seller');
  
  return await Seller.find(query)
    .select(`
      storeName businessName aboutStore storeAvatar 
      categories stats followers isVerified isFeatured 
      createdAt
    `)
    .skip(randomSkip)
    .limit(limit)
    .lean();
}

/**
 * Find seller IDs that a buyer is already following.
 * 
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Array>} Array of seller IDs that the buyer follows
 */
async function findFollowedSellerIds(buyerId) {
  const Seller = require('../../../models/Seller');
  return await Seller.find({
    'followers.buyerId': buyerId
  }).distinct('_id');
}

/**
 * Get public profile data for a buyer.
 * 
 * This method retrieves the buyer's public profile information.
 * 
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object|null>} Buyer's public profile data or null if not found
 */
async function getPublicProfileData(buyerId) {
  const Post = require('../../../models/Post');
  
  // Get post count for public posts
  const postCount = await Post.countDocuments({
    'author.userId': buyerId,
    'author.userModel': 'Buyer',
    visibility: 'public'
  });

  // Find buyer with populated fields
  const buyer = await Buyer.findById(buyerId)
    .select([
      'firstName',
      'lastName', 
      'username',
      'profileImage',
      'bio',
      'country',
      'createdAt',
      'isIdentityVerified',
      'selectedCategories',
      'activityFeed',
      'posts',
      'followers'
    ])
    .populate([
      {
        path: 'posts',
        match: { visibility: 'public' }
      }
    ])
    .lean();

  return {
    buyer,
    postCount
  };
}

/**
 * Toggle the activity status of a buyer.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {boolean} newStatus - The new activity status
 * @returns {Promise<Buyer>} Updated buyer object
 */
async function toggleActivityStatus(buyerId, newStatus) {
  return Buyer.findByIdAndUpdate(
    buyerId,
    { $set: { isActive: newStatus } },
    { new: true, runValidators: true }
  );
}

/**
 * Get the activity status of a buyer.
 * 
 * This function retrieves only the isActive field for a buyer.
 * 
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Buyer|null>} Buyer object with isActive field, or null if buyer not found
 */
async function getActivityStatus(buyerId) {
  return Buyer.findById(buyerId).select('isActive').lean();
}

/**
 * Find active major categories with populated categories
 * @param {Array} majorCategoryIds - Array of major category IDs
 * @returns {Promise<Array>} Array of major categories with populated categories
 */
async function findActiveMajorCategories(majorCategoryIds) {
  const MajorCategory = require('../../../models/MajorCategory');
  return await MajorCategory.find({
    _id: { $in: majorCategoryIds },
    isActive: true
  }).populate('categories');
}

/**
 * Find all active major categories with populated categories
 * @returns {Promise<Array>} Array of all active major categories with populated categories
 */
async function findAllActiveMajorCategories() {
  const MajorCategory = require('../../../models/MajorCategory');
  return await MajorCategory.find({ isActive: true }).populate('categories');
}

/**
 * Extract selected category names from buyer's selected categories
 * @param {Object} buyer - The buyer object with selectedCategories
 * @returns {Array} Array of selected category names
 */
function extractSelectedCategoryNames(buyer) {
  return buyer.selectedCategories.map(cat => cat.name);
}

/**
 * Find categories by IDs
 * @param {Array} categoryIds - Array of category IDs
 * @returns {Promise<Array>} Array of categories
 */
async function findCategoriesByIds(categoryIds) {
  const Category = require('../../../models/Category');
  return await Category.find({ _id: { $in: categoryIds } });
}

/**
 * Update buyer's selected categories
 * @param {string} buyerId - The buyer's ID
 * @param {Array} selectedCategories - The new selected categories
 * @returns {Promise<Buyer>} Updated buyer
 */
async function updateBuyerSelectedCategories(buyerId, selectedCategories) {
  return Buyer.findByIdAndUpdate(
    buyerId,
    { $set: { selectedCategories: selectedCategories } },
    { new: true, runValidators: true }
  );
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
  findUserById,
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
  deleteById,
  addReport,
  findByIdWithWalletOnHoldItems,
  updateWalletOnHoldItems,
  findByIdWithWallet,
  updateWalletWithTransaction,
  updateWalletTransactionStatus,
  findSellersToFollow,
  countSellersToFollow,
  findSellersToFollowRandomized,
  findFollowedSellerIds,
  getPublicProfileData,
  toggleActivityStatus,
  getActivityStatus,
  findActiveMajorCategories,
  findAllActiveMajorCategories,
  extractSelectedCategoryNames,
  findCategoriesByIds,
  updateBuyerSelectedCategories
};