const buyerRepository = require('../repositories/buyer.repository');
const unfollowSellerValidator = require('../validators/unfollowSeller.validator');
const Seller = require('../../../models/Seller');
const InternalErrorException = require('../../../utils/errors/InternalErrorException');

/**
 * Check if buyer is following the seller.
 *
 * @param {Object} seller - The seller object
 * @param {string} buyerId - The buyer's ID
 * @returns {boolean} True if following
 */
function isFollowing(seller, buyerId) {
  return seller.followers.some(
    follower => follower.buyerId && follower.buyerId.toString() === buyerId
  );
}

/**
 * Remove buyer from seller's followers list.
 *
 * @param {Object} seller - The seller object
 * @param {string} buyerId - The buyer's ID
 */
function removeBuyerFromFollowers(seller, buyerId) {
  seller.followers = seller.followers.filter(
    follower => !follower.buyerId || follower.buyerId.toString() !== buyerId
  );
}

/**
 * Remove follow activity from buyer's activity feed.
 *
 * @param {Object} buyer - The buyer object
 * @param {string} sellerId - The seller's ID
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
 * @param {Object} seller - The seller object
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
 * This function orchestrates the unfollow process by:
 * - Validating the unfollow request
 * - Checking if the buyer is following the seller
 * - Removing the buyer from seller's followers
 * - Updating activity feeds
 *
 * @param {string} buyerId - The buyer's ID
 * @param {string} sellerId - The seller's ID to unfollow
 * @returns {Promise<Object>} An object containing unfollow data and counts
 */
async function unfollowSeller(buyerId, sellerId) {
  // Validate the unfollow request
  await unfollowSellerValidator.validateUnfollowSellerData(buyerId, sellerId);

  // Get buyer and seller data
  const [buyer, seller] = await Promise.all([
    buyerRepository.findById(buyerId),
    Seller.findById(sellerId)
  ]);

  // Check if buyer is following the seller
  if (!isFollowing(seller, buyerId)) {
    throw new InternalErrorException('Not following this seller');
  }

  // Remove buyer from seller's followers
  removeBuyerFromFollowers(seller, buyerId);

  // Remove follow activity from buyer's activity feed
  removeFollowActivity(buyer, sellerId);

  // Ensure verificationDocuments is properly structured before saving
  ensureVerificationDocumentsStructure(seller);

  // Save both buyer and seller
  await Promise.all([seller.save(), buyer.save()]);

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