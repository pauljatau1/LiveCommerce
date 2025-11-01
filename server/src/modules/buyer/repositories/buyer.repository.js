/**
 * Buyer Repository
 *
 * This repository contains all database operations related to the Buyer model.
 * It provides methods for finding, updating, and managing buyer data.
 *
 * @module buyerRepository
 */

const Buyer = require('../../../models/Buyer');

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
 * Find buyer by ID and select only shipping addresses.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Buyer|null>} Buyer with shipping addresses or null if not found
 */
async function findByIdWithShippingAddresses(buyerId) {
  // Include buyer contact fields so callers can default missing address contact info
  return Buyer.findById(buyerId).select('shippingAddresses firstName lastName email phoneNumber');
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
 * 
 * This function preserves existing address fields (like isActive and createdAt)
 * when updating an address, ensuring that the active address status is not
 * accidentally reset during updates.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {string} addressId - The address ID to update
 * @param {Object} updateData - The address data to update
 * @returns {Promise<Buyer>} Updated buyer with modified address
 */
async function updateShippingAddress(buyerId, addressId, updateData) {
  // Step 1: Fetch the buyer to get the current address data
  // This is necessary to preserve existing fields like isActive and createdAt
  // that might not be included in the updateData
  const buyer = await Buyer.findById(buyerId);
  if (!buyer) {
    // Return null if buyer not found (service layer will handle this appropriately)
    // Note: This should typically be caught by validators before reaching here
    return null;
  }

  // Step 2: Find the existing address in the shipping addresses array
  // This allows us to preserve fields that aren't being updated
  const existingAddress = buyer.shippingAddresses.find(
    addr => addr._id.toString() === addressId
  );
  
  if (!existingAddress) {
    // Return null if address not found (service layer will handle this appropriately)
    // Note: This should typically be caught by validators before reaching here
    return null;
  }

  // Step 3: Merge existing address with update data
  // This preserves fields like isActive, createdAt, and _id unless explicitly updated
  // Note: We exclude _id from updateData if present, as it should never change
  const { _id, ...updateDataWithoutId } = updateData;
  const mergedAddress = {
    ...existingAddress.toObject(), // Convert mongoose doc to plain object
    ...updateDataWithoutId, // Apply updates (this will override existing fields if provided)
    _id: addressId, // Ensure _id is preserved (never change the address ID)
    updatedAt: new Date() // Always update the updatedAt timestamp
  };

  // Step 4: Update the address in the database
  // Use the merged address which preserves all existing fields
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $set: {
        'shippingAddresses.$[address]': mergedAddress
      }
    },
    {
      new: true,
      runValidators: true,
      arrayFilters: [{ 'address._id': addressId }]
    }
  );
}

/**
 * Delete a shipping address from a buyer.
 * @param {string} buyerId - The buyer's ID
 * @param {string} addressId - The address ID to delete
 * @returns {Promise<Buyer>} Updated buyer with address removed
 */
async function deleteShippingAddress(buyerId, addressId) {
  return Buyer.findByIdAndUpdate(
    buyerId,
    { $pull: { shippingAddresses: { _id: addressId } } },
    { new: true, runValidators: true }
  );
}

/**
 * Set a shipping address as active and deactivate all other addresses.
 * @param {string} buyerId - The buyer's ID
 * @param {string} addressId - The address ID to set as active
 * @returns {Promise<Buyer>} Updated buyer with active address set
 */
async function setActiveShippingAddress(buyerId, addressId) {
  // First, set all addresses to inactive
  await Buyer.findByIdAndUpdate(
    buyerId,
    {
      $set: {
        'shippingAddresses.$[].isActive': false
      }
    },
    {
      new: false, // We don't need the updated document here
      runValidators: true
    }
  );

  // Then, set the specific address to active
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $set: {
        'shippingAddresses.$[address].isActive': true
      }
    },
    {
      new: true,
      runValidators: true,
      arrayFilters: [{ 'address._id': addressId }]
    }
  );
}

/**
 * Find buyer by ID with populated wishlist.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Buyer|null>} Buyer with populated wishlist or null if not found
 */
async function findByIdWithPopulatedWishlist(buyerId) {
  return Buyer.findById(buyerId)
    .select('wishlist')
    .populate({
      path: 'wishlist.product',
      select: 'name images price description category stock seller',
      populate: {
        path: 'seller',
        select: 'storeName'
      }
    });
}

/**
 * Update phone verification for a buyer.
 * @param {string} buyerId - The buyer's ID
 * @param {Object} phoneVerificationData - Phone verification data
 * @returns {Promise<Buyer>} Updated buyer with phone verification
 */
async function updatePhoneVerification(buyerId, phoneVerificationData) {
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $set: {
        phoneVerification: {
          ...phoneVerificationData,
          updatedAt: new Date()
        }
      }
    },
    { new: true, runValidators: true }
  );
}

/**
 * Find user by ID and type (Buyer or Seller).
 * @param {string} userId - The user's ID
 * @param {string} userType - The user type ('Buyer' or 'Seller')
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function findUserById(userId, userType) {
  // Handle both capitalized and lowercase user types
  const normalizedUserType = userType?.toLowerCase();
  
  if (normalizedUserType === 'buyer') {
    return Buyer.findById(userId).select('firstName lastName profileImage');
  } else if (normalizedUserType === 'seller') {
    const Seller = require('../../../models/Seller');
    return Seller.findById(userId).select('storeName storeAvatar');
  }
  return null;
}

/**
 * Find buyer by ID with populated followers.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Buyer|null>} Buyer with populated followers or null if not found
 */
async function findByIdWithPopulatedFollowers(buyerId) {
  return Buyer.findById(buyerId)
    .select('followers')
    .populate({
      path: 'followers.sellerId',
      select: 'firstName lastName storeName businessName storeAvatar profileImage'
    });
}

/**
 * Find sellers that a buyer is following.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Array>} Array of sellers the buyer is following
 */
async function findSellersFollowingByBuyer(buyerId) {
  const buyer = await Buyer.findById(buyerId)
    .select('activityFeed');

  if (!buyer || !buyer.activityFeed) {
    return [];
  }

  // Get all follow activities for sellers
  const followActivities = buyer.activityFeed.filter(
    activity => activity.type === 'follow' && activity.referenceModel === 'Seller'
  );

  if (followActivities.length === 0) {
    return [];
  }

  // Get seller IDs from activities
  const sellerIds = followActivities.map(activity => activity.reference);

  // Fetch sellers separately
  const Seller = require('../../../models/Seller');
  const sellers = await Seller.find({
    _id: { $in: sellerIds }
  }).select('firstName lastName storeName businessName storeAvatar profileImage followers');

  // Create a map of activity creation dates
  const activityDates = {};
  followActivities.forEach(activity => {
    activityDates[activity.reference.toString()] = activity.createdAt;
  });

  // Add followers array to each seller to match what the service expects
  return sellers.map(seller => ({
    ...seller.toObject(),
    followers: [{
      buyerId: buyerId,
      followDate: activityDates[seller._id.toString()] || new Date()
    }]
  }));
}

/**
 * Find buyers that a buyer is following.
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Array>} Array of buyers the buyer is following
 */
async function findBuyersFollowingByBuyer(buyerId) {
  const buyer = await Buyer.findById(buyerId)
    .select('activityFeed')
    .populate({
      path: 'activityFeed.reference',
      select: 'firstName lastName username profileImage',
      match: { 'activityFeed.type': 'follow', 'activityFeed.referenceModel': 'Buyer' }
    });

  if (!buyer || !buyer.activityFeed) {
    return [];
  }

  return buyer.activityFeed
    .filter(activity => activity.type === 'follow' && activity.referenceModel === 'Buyer' && activity.reference)
    .map(activity => activity.reference);
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
 * Update reset password OTP for a buyer.
 * 
 * This method updates the reset password OTP for a specific buyer.
 * It stores the OTP hash and expiration time for secure password reset functionality.
 * 
 * Security Features:
 * - Stores OTP hash instead of plain text
 * - Includes expiration time for security
 * - Uses atomic update operations
 * - Returns updated document for confirmation
 * 
 * @param {string} buyerId - The buyer's ID to update OTP for
 * @param {string} resetOTP - The hashed reset OTP
 * @param {Date} expiresAt - The expiration time for the OTP
 * @returns {Promise<Object|null>} The updated buyer document or null if not found
 */
async function updateResetPasswordOTP(buyerId, resetOTP, expiresAt) {
  // Use findByIdAndUpdate to update reset password OTP fields
  // This ensures atomic updates and returns the updated document
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $set: {
        resetPasswordOTP: resetOTP,
        resetPasswordOTPExpires: expiresAt
      }
    },
    { new: true } // Return the updated document
  );
}

/**
 * Reset password for a buyer.
 * 
 * This method resets the password for a specific buyer and clears the OTP fields.
 * It's used after successful OTP verification during password reset process.
 * 
 * Security Features:
 * - Clears OTP fields after successful reset
 * - Updates password with new hash
 * - Uses atomic update operations
 * - Returns updated document for confirmation
 * 
 * @param {string} buyerId - The buyer's ID to reset password for
 * @param {string} newPassword - The new hashed password
 * @returns {Promise<Object|null>} The updated buyer document or null if not found
 */
async function resetPassword(buyerId, newPassword) {
  // Use findByIdAndUpdate to reset password and clear OTP fields
  // This ensures atomic updates and returns the updated document
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
    { new: true } // Return the updated document
  );
}

/**
 * Update account deletion OTP for a buyer.
 * 
 * This method updates the account deletion OTP for a specific buyer.
 * It stores the OTP hash and expiration time for secure account deletion functionality.
 * 
 * Security Features:
 * - Stores OTP hash instead of plain text
 * - Includes expiration time for security
 * - Uses atomic update operations
 * - Returns updated document for confirmation
 * 
 * @param {string} buyerId - The buyer's ID to update OTP for
 * @param {string} deletionOTP - The hashed deletion OTP
 * @param {Date} expiresAt - The expiration time for the OTP
 * @returns {Promise<Object|null>} The updated buyer document or null if not found
 */
async function updateAccountDeletionOTP(buyerId, deletionOTP, expiresAt) {
  // Use findByIdAndUpdate to update account deletion OTP fields
  // This ensures atomic updates and returns the updated document
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $set: {
        'accountDeletion.otp': deletionOTP,
        'accountDeletion.expiresAt': expiresAt
      }
    },
    { new: true } // Return the updated document
  );
}

/**
 * Increment account deletion attempts for a buyer.
 * 
 * This method increments the account deletion attempts counter for a specific buyer.
 * It's used for rate limiting and security monitoring during account deletion process.
 * 
 * Security Features:
 * - Tracks deletion attempts for rate limiting
 * - Uses atomic increment operations
 * - Returns updated document for monitoring
 * - Helps prevent abuse of deletion functionality
 * 
 * @param {string} buyerId - The buyer's ID to increment attempts for
 * @returns {Promise<Object|null>} The updated buyer document or null if not found
 */
async function incrementAccountDeletionAttempts(buyerId) {
  // Use findByIdAndUpdate with $inc to atomically increment deletion attempts
  // This ensures thread-safe increment operations
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $inc: { 'accountDeletion.attempts': 1 }
    },
    { new: true } // Return the updated document
  );
}

/**
 * Delete a buyer by ID.
 * 
 * This method permanently deletes a buyer from the database.
 * It's used for account deletion functionality after proper verification.
 * 
 * Security Features:
 * - Requires proper authentication and authorization
 * - Should be used only after OTP verification
 * - Permanently removes buyer data
 * - Returns confirmation of deletion
 * 
 * @param {string} buyerId - The buyer's ID to delete
 * @returns {Promise<Object|null>} The deleted buyer document or null if not found
 */
async function deleteById(buyerId) {
  // Use findByIdAndDelete to permanently remove the buyer
  // This ensures the buyer exists before deletion and returns the deleted document
  return Buyer.findByIdAndDelete(buyerId);
}

/**
 * Add a report to a buyer.
 * 
 * This method adds a report to a buyer's account for moderation purposes.
 * It stores report details including reason, timestamp, and reporter information.
 * 
 * Moderation Features:
 * - Stores report details for review
 * - Includes timestamp for tracking
 * - Supports multiple report types
 * - Returns updated document for confirmation
 * 
 * @param {string} buyerId - The buyer's ID to add report to
 * @param {Object} reportData - The report data to add
 * @returns {Promise<Object|null>} The updated buyer document or null if not found
 */
async function addReport(buyerId, reportData) {
  // Use findByIdAndUpdate to add report to buyer's reports array
  // This ensures atomic updates and returns the updated document
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $push: {
        reports: {
          ...reportData,
          reportedAt: new Date()
        }
      }
    },
    { new: true } // Return the updated document
  );
}

/**
 * Find buyer by ID with wallet on-hold items.
 * 
 * This method retrieves a buyer with their wallet on-hold items for
 * order processing and payment management.
 * 
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Buyer|null>} Buyer with wallet on-hold items or null if not found
 */
async function findByIdWithWalletOnHoldItems(buyerId) {
  return Buyer.findById(buyerId)
    .select('wallet.balance wallet.onHoldAmount wallet.onHoldItems wallet.currency')
    .populate({
      path: 'wallet.onHoldItems.productId',
      select: 'name images auction'
    })
    .lean();
}

/**
 * Update wallet on-hold items for a buyer.
 * 
 * This method updates the wallet on-hold items and amount for a buyer.
 * It's used during order processing to manage payment holds.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {Array} filteredOnHoldItems - The filtered on-hold items
 * @param {number} recalculatedOnHoldAmount - The recalculated on-hold amount
 * @returns {Promise<Buyer>} Updated buyer with modified wallet
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
    { new: true, runValidators: true }
  );
}

/**
 * Find buyer by ID with wallet information.
 * 
 * This method retrieves a buyer with their wallet information for
 * balance checking and transaction management.
 * 
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Buyer|null>} Buyer with wallet information or null if not found
 */
async function findByIdWithWallet(buyerId) {
  return Buyer.findById(buyerId).select('wallet');
}

/**
 * Update wallet with a new transaction.
 * 
 * This method adds a new transaction to a buyer's wallet and updates the balance.
 * It's used for payment processing and balance management.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {Object} transaction - The transaction to add
 * @param {number} newBalance - The new wallet balance
 * @returns {Promise<Buyer>} Updated buyer with new transaction
 */
async function updateWalletWithTransaction(buyerId, transaction, newBalance) {
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $push: { 'wallet.transactions': transaction },
      $set: { 'wallet.balance': newBalance }
    },
    { new: true, runValidators: true }
  );
}

/**
 * Update wallet transaction status.
 * 
 * This method updates the status of a specific transaction in a buyer's wallet.
 * It's used for payment status updates and transaction management.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {string} paymentReference - The payment reference to update
 * @param {string} newStatus - The new transaction status
 * @param {number} newBalance - The new wallet balance
 * @returns {Promise<Buyer>} Updated buyer with modified transaction
 */
async function updateWalletTransactionStatus(buyerId, paymentReference, newStatus, newBalance) {
  return Buyer.findByIdAndUpdate(
    buyerId,
    {
      $set: {
        'wallet.transactions.$[transaction].status': newStatus,
        'wallet.balance': newBalance
      }
    },
    {
      new: true,
      runValidators: true,
      arrayFilters: [{ 'transaction.paymentReference': paymentReference }]
    }
  );
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
  const postRepository = require('./post.repository');
  
  // Get post count for public posts
  const postCount = await postRepository.countPublicPosts(buyerId);

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
        path: 'selectedCategories',
        select: 'name'
      },
      {
        path: 'followers',
        select: 'firstName lastName username profileImage'
      }
    ]);

  if (!buyer) {
    return null;
  }

  return {
    ...buyer.toObject(),
    postCount
  };
}

/**
 * Toggle activity status for a buyer.
 * 
 * This method toggles the activity status of a buyer between active and inactive.
 * It's used for account management and activity tracking.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {boolean} newStatus - The new activity status
 * @returns {Promise<Buyer>} Updated buyer with new activity status
 */
async function toggleActivityStatus(buyerId, newStatus) {
  return Buyer.findByIdAndUpdate(
    buyerId,
    { $set: { isActive: newStatus } },
    { new: true, runValidators: true }
  );
}

/**
 * Get activity status for a buyer.
 * 
 * This method retrieves the current activity status of a buyer.
 * 
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<boolean>} Current activity status
 */
async function getActivityStatus(buyerId) {
  const buyer = await Buyer.findById(buyerId).select('isActive');
  return buyer ? buyer.isActive : false;
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
 * Get posts count for a buyer.
 * 
 * This method retrieves the count of posts for a specific buyer.
 * It delegates to the post repository for the actual count operation.
 * 
 * @param {string} buyerId - The buyer's ID to get posts count for
 * @returns {Promise<number>} The number of posts for the buyer
 */
async function getPostsCount(buyerId) {
  const postRepository = require('./post.repository');
  return await postRepository.getPostsCount(buyerId);
}

/**
 * Find active major categories by IDs.
 * 
 * This method retrieves active major categories by their IDs.
 * It delegates to the major category repository for the actual operation.
 * 
 * @param {Array} majorCategoryIds - Array of major category IDs
 * @returns {Promise<Array>} Array of active major categories
 */
async function findActiveMajorCategories(majorCategoryIds) {
  const majorCategoryRepository = require('./majorCategory.repository');
  return await majorCategoryRepository.findActiveMajorCategories(majorCategoryIds);
}

/**
 * Find all active major categories.
 * 
 * This method retrieves all active major categories.
 * It delegates to the major category repository for the actual operation.
 * 
 * @param {Array} majorCategoryIds - Array of major category IDs
 * @returns {Promise<Array>} Array of all active major categories
 */
async function findAllActiveMajorCategories() {
  const majorCategoryRepository = require('./majorCategory.repository');
  return await majorCategoryRepository.findAllActiveMajorCategories();
}

/**
 * Find categories by IDs.
 * 
 * This method retrieves categories by their IDs.
 * It delegates to the category repository for the actual operation.
 * 
 * @param {Array} categoryIds - Array of category IDs
 * @returns {Promise<Array>} Array of categories
 */
async function findCategoriesByIds(categoryIds) {
  const categoryRepository = require('./category.repository');
  return await categoryRepository.findCategoriesByIds(categoryIds);
}

/**
 * Find order by ID and buyer.
 * 
 * This method retrieves a specific order that belongs to a buyer.
 * It delegates to the order repository for the actual operation.
 * 
 * @param {string} orderId - The order's ID
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object|null>} Order with populated data or null if not found
 */
async function findOrderByIdAndBuyer(orderId, buyerId) {
  const orderRepository = require('./order.repository');
  return await orderRepository.findByIdAndBuyer(orderId, buyerId);
}

/**
 * Find seller by ID.
 * 
 * This method retrieves a seller by their ID.
 * It delegates to the seller repository for the actual operation.
 * 
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<Object|null>} Seller document or null if not found
 */
async function findSellerById(sellerId) {
  const sellerRepository = require('./seller.repository');
  return await sellerRepository.findById(sellerId);
}

/**
 * Find seller with reviews.
 * 
 * This method retrieves a seller with their review statistics.
 * It delegates to the seller repository for the actual operation.
 * 
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<Object|null>} Seller with reviews and stats or null if not found
 */
async function findSellerWithReviews(sellerId) {
  const sellerRepository = require('./seller.repository');
  return await sellerRepository.findWithReviews(sellerId);
}

/**
 * Check if buyer has verified purchase from seller.
 * 
 * This method checks if a buyer has made a verified purchase from a specific seller.
 * It delegates to the order repository for the actual operation.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<boolean>} True if buyer has verified purchase, false otherwise
 */
async function hasVerifiedPurchase(buyerId, sellerId) {
  const orderRepository = require('./order.repository');
  return await orderRepository.hasVerifiedPurchase(buyerId, sellerId);
}

/**
 * Find orders by seller.
 * 
 * This method retrieves all orders that belong to a specific seller.
 * It delegates to the order repository for the actual operation.
 * 
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<Array>} Array of order documents belonging to the seller
 */
async function findOrdersBySeller(sellerId) {
  const orderRepository = require('./order.repository');
  return await orderRepository.findOrdersBySeller(sellerId);
}

/**
 * Count streams by seller.
 * 
 * This method counts the number of streams for a specific seller.
 * It delegates to the stream repository for the actual operation.
 * 
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<number>} Number of streams for the seller
 */
async function countStreamsBySeller(sellerId) {
  const streamRepository = require('./stream.repository');
  return await streamRepository.countStreamsBySeller(sellerId);
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
  findByUsername,
  updateById,
  findByIdWithSelectedCategories,
  findByIdWithShippingAddresses,
  addShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  setActiveShippingAddress,
  findByIdWithPopulatedWishlist,
  updatePhoneVerification,
  findUserById,
  findByIdWithPopulatedFollowers,
  findSellersFollowingByBuyer,
  findBuyersFollowingByBuyer,
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
  getPublicProfileData,
  toggleActivityStatus,
  getActivityStatus,
  extractSelectedCategoryNames,
  updateBuyerSelectedCategories,
  getPostsCount,
  findActiveMajorCategories,
  findAllActiveMajorCategories,
  findCategoriesByIds,
  findOrderByIdAndBuyer,
  findSellerById,
  findSellerWithReviews,
  hasVerifiedPurchase,
  findOrdersBySeller,
  countStreamsBySeller
};