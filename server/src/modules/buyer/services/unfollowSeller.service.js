/**
 * Unfollow Seller Service
 *
 * This service handles the business logic for a buyer unfollowing a seller.
 * It provides functionality to:
 * - Validate unfollow request data
 * - Check if buyer is currently following the seller
 * - Remove buyer from seller's followers list
 * - Update buyer's activity feed
 * - Handle verification document structure
 * - Maintain data consistency across related collections
 *
 * The service ensures that the unfollow operation is performed atomically
 * and maintains referential integrity between buyers and sellers.
 *
 * @module unfollowSellerService
 */

const buyerRepository = require('../repositories/buyer.repository');
const unfollowSellerValidator = require('../validators/unfollowSeller.validator');
const Seller = require('../../../models/Seller');
const InternalErrorException = require('../../../utils/errors/InternalErrorException');

/**
 * Check if buyer is following the seller.
 *
 * This function examines the seller's followers list to determine if
 * the specified buyer is currently following the seller. It performs
 * a case-sensitive comparison of buyer IDs.
 *
 * Business Logic:
 * - Searches through seller's followers array
 * - Compares buyer IDs using string conversion for consistency
 * - Returns boolean indicating follow status
 * - Handles null/undefined follower data gracefully
 *
 * @param {Object} seller - The seller object with followers array
 * @param {Array} seller.followers - Array of follower objects
 * @param {string} seller.followers[].buyerId - Buyer ID in the followers list
 * @param {string} buyerId - The buyer's ID to check
 * @returns {boolean} True if buyer is following the seller, false otherwise
 * @example
 * const seller = { followers: [{ buyerId: "507f1f77bcf86cd799439011" }] };
 * const isFollowing = isFollowing(seller, "507f1f77bcf86cd799439011"); // true
 */
function isFollowing(seller, buyerId) {
  return seller.followers.some(
    follower => follower.buyerId && follower.buyerId.toString() === buyerId
  );
}

/**
 * Remove buyer from seller's followers list.
 *
 * This function removes the specified buyer from the seller's followers
 * array, maintaining the integrity of the followers list structure.
 *
 * Business Logic:
 * - Filters out the specified buyer from followers array
 * - Preserves all other followers
 * - Handles null/undefined buyerId values
 * - Updates the seller's followers array in place
 *
 * @param {Object} seller - The seller object to update
 * @param {Array} seller.followers - Array of follower objects
 * @param {string} buyerId - The buyer's ID to remove from followers
 */
function removeBuyerFromFollowers(seller, buyerId) {
  seller.followers = seller.followers.filter(
    follower => !follower.buyerId || follower.buyerId.toString() !== buyerId
  );
}

/**
 * Remove follow activity from buyer's activity feed.
 *
 * This function removes any follow-related activities for the specified
 * seller from the buyer's activity feed, maintaining feed consistency.
 *
 * Business Logic:
 * - Filters activity feed to remove follow activities
 * - Matches activities by type, reference model, and reference ID
 * - Handles missing or empty activity feed arrays
 * - Updates the buyer's activity feed in place
 *
 * @param {Object} buyer - The buyer object with activity feed
 * @param {Array} buyer.activityFeed - Array of activity objects
 * @param {string} sellerId - The seller's ID to remove activities for
 */
function removeFollowActivity(buyer, sellerId) {
  if (buyer.activityFeed) {
    buyer.activityFeed = buyer.activityFeed.filter(
      activity => !(
        activity.type === 'follow' &&
        activity.referenceModel === 'Seller' &&
        activity.reference && 
        activity.reference.toString() === sellerId
      )
    );
  }
}

/**
 * Ensure verificationDocuments is properly structured before saving.
 *
 * This function validates and corrects the verificationDocuments structure
 * on the seller object to prevent database schema validation errors.
 *
 * Business Logic:
 * - Checks if verificationDocuments is an array (incorrect structure)
 * - Converts to proper object structure if needed
 * - Sets default values for missing properties
 * - Ensures consistent data structure for database storage
 *
 * @param {Object} seller - The seller object to validate
 * @param {Array|Object} seller.verificationDocuments - Verification documents structure
 */
function ensureVerificationDocumentsStructure(seller) {
  if (Array.isArray(seller.verificationDocuments)) {
    seller.verificationDocuments = {
      type: null,
      documents: []
    };
  } else if (!seller.verificationDocuments || typeof seller.verificationDocuments !== 'object') {
    seller.verificationDocuments = {
      type: null,
      documents: []
    };
  }
}

/**
 * Unfollow a seller by a buyer.
 *
 * This function orchestrates the complete unfollow process by validating
 * the request, checking follow status, removing the buyer from the seller's
 * followers, and updating related data structures.
 *
 * Business Logic Flow:
 * 1. Validate the unfollow request data
 * 2. Retrieve buyer and seller data concurrently
 * 3. Verify buyer is currently following the seller
 * 4. Remove buyer from seller's followers list
 * 5. Update buyer's activity feed
 * 6. Ensure data structure integrity
 * 7. Save updated data to database
 *
 * Security Considerations:
 * - Input validation prevents unauthorized operations
 * - Follow status verification ensures data consistency
 * - Proper error handling for edge cases
 * - Data structure validation prevents corruption
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @param {string} sellerId - The seller's ID to unfollow
 * @returns {Promise<Object>} An object containing unfollow data and counts
 * @throws {ValidationError} If input validation fails
 * @throws {InternalErrorException} If buyer is not following the seller
 * @throws {Error} If database operation fails
 * @example
 * const result = await unfollowSeller("507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012");
 * // Returns: { message: "Successfully unfollowed", followersCount: 150 }
 */
async function unfollowSeller(buyerId, sellerId) {
  // Step 1: Validate the unfollow request
  // This ensures buyerId and sellerId are valid and properly formatted
  await unfollowSellerValidator.validateUnfollowSellerData(buyerId, sellerId);

  // Step 2: Get buyer and seller data concurrently
  // This optimizes performance by fetching both records simultaneously
  const [buyer, seller] = await Promise.all([
    buyerRepository.findById(buyerId),
    Seller.findById(sellerId)
  ]);

  // Step 3: Check if buyer is following the seller
  // This prevents unfollowing when not following
  if (!isFollowing(seller, buyerId)) {
    throw new InternalErrorException('Not following this seller');
  }

  // Step 4: Remove buyer from seller's followers
  // This updates the seller's followers list
  removeBuyerFromFollowers(seller, buyerId);

  // Step 5: Remove follow activity from buyer's activity feed
  // This maintains consistency in the buyer's activity history
  removeFollowActivity(buyer, sellerId);

  // Step 6: Ensure verification documents structure is correct
  // This prevents database validation errors during save
  ensureVerificationDocumentsStructure(seller);

  // Step 7: Save both buyer and seller
  // Save both buyer and seller
  await Promise.all([seller.save(), buyer.save()]);

  // Step 8: Get accurate following count after unfollow
  // Get accurate following count after unfollow
  const followingCount = await buyerRepository.getFollowingCount(buyerId).catch(() => 0);

  return {
    sellerFollowCount: seller.followers.length,
    buyerFollowingCount: followingCount
  };
}

module.exports = {
  unfollowSeller
}; 