const buyerRepository = require('../repositories/buyer.repository');
const followSellerValidator = require('../validators/followSeller.validator');
const Seller = require('../../../models/Seller');
const notificationController = require('../../../controllers/notificationController');
const InternalErrorException = require('../../../utils/errors/InternalErrorException');

/**
 * Check if buyer is already following the seller.
 *
 * @param {Object} seller - The seller object
 * @param {string} buyerId - The buyer's ID
 * @returns {boolean} True if already following
 */
function isAlreadyFollowing(seller, buyerId) {
  return seller.followers.some(
    follower => follower.buyerId && follower.buyerId.toString() === buyerId
  );
}

/**
 * Check if buyer has existing follow activity for this seller.
 *
 * @param {Object} buyer - The buyer object
 * @param {string} sellerId - The seller's ID
 * @returns {boolean} True if follow activity exists
 */
function hasExistingFollowActivity(buyer, sellerId) {
  return buyer.activityFeed?.some(
    activity => 
      activity.type === 'follow' &&
      activity.referenceModel === 'Seller' &&
      activity.reference.toString() === sellerId
  );
}

/**
 * Remove existing follow activity from buyer's activity feed.
 *
 * @param {Object} buyer - The buyer object
 * @param {string} sellerId - The seller's ID
 */
function removeExistingFollowActivity(buyer, sellerId) {
  buyer.activityFeed = buyer.activityFeed.filter(
    activity => !(
      activity.type === 'follow' &&
      activity.referenceModel === 'Seller' &&
      activity.reference.toString() === sellerId
    )
  );
}

/**
 * Map buyer's shipping address to seller's expected format.
 *
 * @param {Object} buyer - The buyer object
 * @returns {Object|null} Mapped address or null
 */
function mapBuyerAddress(buyer) {
  if (!buyer.shippingAddresses || buyer.shippingAddresses.length === 0) {
    return null;
  }

  const address = buyer.shippingAddresses[0];
  return {
    country: address.country,
    city: address.city,
    address1: address.addressLine1,
    address2: address.addressLine2,
    zipCode: address.zipCode
  };
}

/**
 * Add buyer to seller's followers list.
 *
 * @param {Object} seller - The seller object
 * @param {Object} buyer - The buyer object
 * @param {Object} mainAddress - The buyer's main address
 */
function addBuyerToFollowers(seller, buyer, mainAddress) {
  seller.followers.push({
    buyerId: buyer._id,
    firstName: buyer.firstName,
    lastName: buyer.lastName,
    email: buyer.email,
    followDate: new Date(),
    totalOrders: 0,
    mainAddress: mainAddress
  });
}

/**
 * Add follow activity to buyer's activity feed.
 *
 * @param {Object} buyer - The buyer object
 * @param {Object} seller - The seller object
 */
function addFollowActivity(buyer, seller) {
  if (!buyer.activityFeed) {
    buyer.activityFeed = [];
  }

  buyer.activityFeed.push({
    type: 'follow',
    content: `Started following ${seller.storeName || seller.businessName}`,
    reference: seller._id,
    referenceModel: 'Seller',
    createdAt: new Date()
  });
}



/**
 * Create notification for the seller about new follower.
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} buyer - The buyer object
 */
async function createSellerNotification(sellerId, buyer) {
  await notificationController.createNotification(sellerId, 'new_follower', {
    buyerId: buyer._id.toString(),
    buyerName: `${buyer.firstName} ${buyer.lastName}`,
    followDate: new Date()
  });
}

/**
 * Send email notification to seller about new follower.
 *
 * @param {Object} seller - The seller object
 * @param {Object} buyer - The buyer object
 */
async function sendFollowerEmail(seller, buyer) {
  try {
    await notificationController.sendNewFollowerEmail(seller, `${buyer.firstName} ${buyer.lastName}`);
  } catch (emailError) {
    console.error('Failed to send new follower email:', emailError);
    // Continue execution even if email fails
  }
}

/**
 * Follow a seller by a buyer.
 *
 * This function orchestrates the follow process by:
 * - Validating the follow request
 * - Checking for existing follows
 * - Adding the buyer to seller's followers
 * - Updating activity feeds
 * - Creating notifications
 *
 * @param {string} buyerId - The buyer's ID
 * @param {string} sellerId - The seller's ID to follow
 * @returns {Promise<Object>} An object containing follow data and counts
 */
async function followSeller(buyerId, sellerId) {
  // Validate the follow request
  await followSellerValidator.validateFollowSellerData(buyerId, sellerId);

  // Get buyer and seller data
  const [buyer, seller] = await Promise.all([
    buyerRepository.findById(buyerId),
    Seller.findById(sellerId)
  ]);

  // Check if already following
  if (isAlreadyFollowing(seller, buyerId)) {
    throw new InternalErrorException('Already following this seller');
  }

  // Remove existing follow activity if present
  if (hasExistingFollowActivity(buyer, sellerId)) {
    removeExistingFollowActivity(buyer, sellerId);
  }

  // Map buyer's address
  const mainAddress = mapBuyerAddress(buyer);

  // Add buyer to seller's followers
  addBuyerToFollowers(seller, buyer, mainAddress);
  
  // Ensure verificationDocuments is properly structured before saving
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
  
  await seller.save();

  // Add follow activity to buyer
  addFollowActivity(buyer, seller);
  await buyer.save();

  // Get following count
  const followingCount = await buyerRepository.getFollowingCount(buyerId).catch(() => 0);

  // Create notifications
  await createSellerNotification(sellerId, buyer);
  await sendFollowerEmail(seller, buyer);

  return {
    followData: seller.followers[seller.followers.length - 1],
    sellerFollowCount: seller.followers.length,
    buyerFollowingCount: followingCount
  };
}

module.exports = {
  followSeller
}; 