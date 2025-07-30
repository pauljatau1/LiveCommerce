const buyerRepository = require('../repositories/buyer.repository');
const getSellerProfileValidator = require('../validators/getSellerProfile.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Calculates delivered items count from orders.
 *
 * @param {Array} orders - Array of orders
 * @returns {number} Count of delivered items
 */
function calculateDeliveredItemsCount(orders) {
  return orders.reduce((count, order) => {
    if (order.shipping?.tracking?.status === 'delivered') {
      const deliveredItemsQuantity = order.items.reduce((itemCount, item) => {
        return itemCount + (item.quantity || 1);
      }, 0);
      return count + deliveredItemsQuantity;
    }
    return count;
  }, 0);
}

/**
 * Builds review statistics from seller data and review aggregation.
 *
 * @param {Object} seller - Seller object
 * @param {Array} reviews - Review aggregation results
 * @returns {Object} Review statistics
 */
function buildReviewStats(seller, reviews) {
  const reviewStats = reviews[0] || { totalReviews: 0, averageRating: 0 };
  
  return {
    averageRating: seller.stats?.averageRating || reviewStats.averageRating || 0,
    totalReviews: seller.stats?.totalReviews || reviewStats.totalReviews || 0,
    ratingDistribution: seller.stats?.ratingDistribution || {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    },
    verifiedPurchaseCount: seller.reviews?.filter(r => r.isVerifiedPurchase)?.length || 0
  };
}

/**
 * Builds personal information section of seller profile.
 *
 * @param {Object} seller - Seller object
 * @returns {Object} Personal information
 */
function buildPersonalInfo(seller) {
  return {
    firstName: seller.firstName,
    lastName: seller.lastName,
  };
}

/**
 * Builds social media information.
 *
 * @param {Object} socialMedia - Social media object
 * @returns {Object} Social media information
 */
function buildSocialMedia(socialMedia) {
  return {
    instagram: socialMedia?.instagram || null,
    facebook: socialMedia?.facebook || null,
    tiktok: socialMedia?.tiktok || null
  };
}

/**
 * Builds store information section of seller profile.
 *
 * @param {Object} seller - Seller object
 * @param {string} buyerId - Current buyer's ID
 * @returns {Object} Store information
 */
function buildStoreInfo(seller, buyerId) {
  return {
    storeName: seller.storeName,
    aboutStore: seller.aboutStore,
    storeAvatar: seller.storeAvatar,
    storeBanner: seller.storeBanner,
    isVerified: seller.isVerified,
    isFeatured: seller.isFeatured,
    accountPending: seller.accountPending || false,
    joinedDate: seller.createdAt,
    bio: seller.aboutStore,
    isFollowing: seller.followers?.some(
      follower => follower.buyerId?.toString() === buyerId
    ) || false,
    socialMedia: buildSocialMedia(seller.socialMedia)
  };
}

/**
 * Builds business information section of seller profile.
 *
 * @param {Object} seller - Seller object
 * @returns {Object} Business information
 */
function buildBusinessInfo(seller) {
  return {
    businessName: seller.businessName,
    businessType: seller.businessType,
    categories: seller.categories,
    addresses: {
      business: seller.businessAddress,
      warehouse: seller.warehouseDetails,
      seller: seller.sellerAddress
    }
  };
}

/**
 * Builds location information section of seller profile.
 *
 * @param {Object} seller - Seller object
 * @returns {Object} Location information
 */
function buildLocationInfo(seller) {
  return {
    country: seller.businessAddress?.country || seller.sellerAddress?.country,
    state: seller.businessAddress?.state || seller.sellerAddress?.state,
    city: seller.businessAddress?.city || seller.sellerAddress?.city
  };
}

/**
 * Builds delivery policy information.
 *
 * @param {Object} storePolicy - Store policy object
 * @returns {Object} Delivery policy
 */
function buildDeliveryPolicy(storePolicy) {
  return {
    processingTime: storePolicy?.processingTime || null,
    deliveryTimes: storePolicy?.deliveryTimes || null,
    freeShippingPolicy: storePolicy?.freeShippingPolicy || null,
    allowsCod: storePolicy?.allowsCod || true,
  };
}

/**
 * Builds returns policy information.
 *
 * @param {Object} storePolicy - Store policy object
 * @returns {Object} Returns policy
 */
function buildReturnsPolicy(storePolicy) {
  return {
    returnWindow: storePolicy?.returnWindow || 14,
    returnCondition: storePolicy?.returnCondition || null,
    returnShipping: storePolicy?.returnShipping || null,
    nonRefundableItems: storePolicy?.nonRefundableItems || [],
  };
}

/**
 * Builds refunds policy information.
 *
 * @param {Object} storePolicy - Store policy object
 * @returns {Object} Refunds policy
 */
function buildRefundsPolicy(storePolicy) {
  return {
    refundPolicy: storePolicy?.refundPolicy || null,
    refundMethod: storePolicy?.refundMethod || null,
    lostOrDamagedPolicy: storePolicy?.lostOrDamagedPolicy || null,
  };
}

/**
 * Builds exchange policy information.
 *
 * @param {Object} storePolicy - Store policy object
 * @returns {Object} Exchange policy
 */
function buildExchangePolicy(storePolicy) {
  return {
    exchangePolicy: storePolicy?.exchangePolicy || null,
  };
}

/**
 * Builds store policies section of seller profile.
 *
 * @param {Object} seller - Seller object
 * @returns {Object} Store policies
 */
function buildStorePolicies(seller) {
  const storePolicy = seller.storePolicy || {};
  
  return {
    delivery: buildDeliveryPolicy(storePolicy),
    returns: buildReturnsPolicy(storePolicy),
    refunds: buildRefundsPolicy(storePolicy),
    exchange: buildExchangePolicy(storePolicy)
  };
}

/**
 * Builds statistics section of seller profile.
 *
 * @param {Object} seller - Seller object
 * @param {Array} orders - Orders array
 * @param {number} streamCount - Stream count
 * @param {number} followingCount - Following count
 * @param {number} soldItemsCount - Sold items count
 * @returns {Object} Statistics
 */
function buildStats(seller, orders, streamCount, followingCount, soldItemsCount) {
  return {
    followersCount: seller.followers?.length || 0,
    followingCount: followingCount,
    totalOrders: orders.length,
    totalStreams: streamCount,
    soldItems: soldItemsCount,
  };
}

/**
 * Builds reviews section of seller profile.
 *
 * @param {Object} reviewStats - Review statistics
 * @returns {Object} Reviews information
 */
function buildReviewsInfo(reviewStats) {
  return {
    averageRating: parseFloat(reviewStats.averageRating),
    totalReviews: reviewStats.totalReviews,
    ratingDistribution: reviewStats.ratingDistribution,
  };
}

/**
 * Gets detailed seller profile information.
 *
 * This function:
 * - Validates input data
 * - Fetches seller information with reviews
 * - Calculates various statistics and counts
 * - Builds comprehensive seller profile response
 * - Increments store visits counter
 *
 * @param {string} sellerId - The seller's ID
 * @param {string} buyerId - The buyer's ID (for following status)
 * @returns {Promise<Object>} Complete seller profile
 */
async function getSellerProfile(sellerId, buyerId) {
  // Validate input data
  await getSellerProfileValidator.validateGetSellerProfileData({ sellerId });

  // Find seller with reviews
  const seller = await buyerRepository.findSellerById(sellerId);
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }

  // Get counts and data using Promise.all for better performance
  const [orders, streamCount, followingCount, reviews] = await Promise.all([
    buyerRepository.findOrdersBySeller(sellerId),
    buyerRepository.countStreamsBySeller(sellerId),
    buyerRepository.countBuyersFollowingSeller(sellerId),
    buyerRepository.getSellerReviewStats(sellerId)
  ]);

  // Calculate delivered orders count
  const soldItemsCount = calculateDeliveredItemsCount(orders);

  // Calculate review statistics
  const reviewStats = buildReviewStats(seller, reviews);

  // Build complete seller profile
  const sellerProfile = {
    personalInfo: buildPersonalInfo(seller),
    storeInfo: buildStoreInfo(seller, buyerId),
    businessInfo: buildBusinessInfo(seller),
    location: buildLocationInfo(seller),
    storePolicies: buildStorePolicies(seller),
    stats: buildStats(seller, orders, streamCount, followingCount, soldItemsCount),
    reviews: buildReviewsInfo(reviewStats)
  };

  // Increment store visits
  await buyerRepository.incrementSellerStoreVisits(sellerId);

  return sellerProfile;
}

module.exports = {
  getSellerProfile
}; 