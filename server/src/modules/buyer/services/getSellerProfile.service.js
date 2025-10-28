/**
 * Get Seller Profile Service
 *
 * This service handles the business logic for retrieving comprehensive seller profile information.
 * It provides functionality to:
 * - Fetch and aggregate seller data from multiple sources
 * - Calculate various statistics and metrics
 * - Build structured profile sections (personal, store, business, etc.)
 * - Handle review statistics and rating distributions
 * - Track store visits and engagement metrics
 * - Determine following status for the requesting buyer
 *
 * The service ensures that:
 * - All profile sections are properly structured and complete
 * - Statistics are accurately calculated from real data
 * - Store policies are properly formatted
 * - Review data is aggregated and normalized
 * - Performance is optimized through concurrent data fetching
 *
 * @module getSellerProfileService
 */

const buyerRepository = require('../repositories/buyer.repository');
const sellerRepository = require('../repositories/seller.repository');
const streamRepository = require('../repositories/stream.repository');
const orderRepository = require('../repositories/order.repository');
const getSellerProfileValidator = require('../validators/getSellerProfile.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Calculates delivered items count from orders.
 *
 * This function processes an array of orders to count the total number
 * of items that have been successfully delivered. It filters orders by
 * delivery status and sums up the quantities of all delivered items.
 *
 * Business Logic:
 * - Only counts items from orders with 'delivered' tracking status
 * - Sums up quantities for all items in delivered orders
 * - Handles cases where item quantity might be undefined (defaults to 1)
 *
 * @param {Array} orders - Array of order objects with shipping and items data
 * @returns {number} Total count of delivered items across all orders
 */
function calculateDeliveredItemsCount(orders) {
  return orders.reduce((count, order) => {
    // Check if order has been delivered
    if (order.shipping?.tracking?.status === 'delivered') {
      // Sum up quantities of all items in this delivered order
      const deliveredItemsQuantity = order.items.reduce((itemCount, item) => {
        return itemCount + (item.quantity || 1); // Default to 1 if quantity not specified
      }, 0);
      return count + deliveredItemsQuantity;
    }
    return count; // Skip non-delivered orders
  }, 0);
}

/**
 * Builds review statistics from seller data and review aggregation.
 *
 * This function combines seller's stored statistics with aggregated review data
 * to create comprehensive review statistics. It handles cases where data might
 * be missing and provides sensible defaults.
 *
 * Statistics Included:
 * - Average rating (from seller stats or aggregated reviews)
 * - Total review count
 * - Rating distribution (1-5 star breakdown)
 * - Verified purchase count
 *
 * @param {Object} seller - Seller object with stats and reviews
 * @param {Array} reviews - Review aggregation results from database
 * @returns {Object} Comprehensive review statistics object
 */
function buildReviewStats(seller, reviews) {
  const reviewStats = reviews[0] || { totalReviews: 0, averageRating: 0 };
  
  return {
    averageRating: seller.stats?.averageRating || reviewStats.averageRating || 0,
    totalReviews: seller.stats?.totalReviews || reviewStats.totalReviews || 0,
    ratingDistribution: seller.stats?.ratingDistribution || {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0 // Default distribution with zero counts
    },
    verifiedPurchaseCount: seller.reviews?.filter(r => r.isVerifiedPurchase)?.length || 0
  };
}

/**
 * Builds personal information section of seller profile.
 *
 * This function extracts and formats the seller's personal information
 * for display in the profile. It includes basic identifying information
 * that's appropriate for public display.
 *
 * @param {Object} seller - Seller object with personal information
 * @returns {Object} Personal information object
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
 * This function extracts and formats the seller's social media links.
 * It handles cases where social media data might be missing and provides
 * null values for missing platforms.
 *
 * Supported Platforms:
 * - Instagram
 * - Facebook
 * - TikTok
 *
 * @param {Object} socialMedia - Social media object with platform links
 * @returns {Object} Social media information object
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
 * This function creates the store information section which includes
 * store details, verification status, and following relationship with
 * the requesting buyer. It determines if the current buyer is following
 * this seller.
 *
 * Store Information Includes:
 * - Store name and description
 * - Store avatar and banner images
 * - Verification and featured status
 * - Account status (pending, etc.)
 * - Following relationship with current buyer (if authenticated)
 * - Social media links
 *
 * @param {Object} seller - Seller object with store information
 * @param {string|null} buyerId - Current buyer's ID to check following status (null if not authenticated)
 * @returns {Object} Store information object
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
    bio: seller.aboutStore, // Duplicate of aboutStore for compatibility
    isFollowing: buyerId ? (seller.followers?.some(
      follower => follower.buyerId?.toString() === buyerId
    ) || false) : false, // Only check following status if buyer is authenticated
    socialMedia: buildSocialMedia(seller.socialMedia)
  };
}

/**
 * Builds business information section of seller profile.
 *
 * This function extracts business-related information including business
 * name, type, categories, and various addresses associated with the business.
 *
 * Business Information Includes:
 * - Business name and type
 * - Business categories
 * - Business, warehouse, and seller addresses
 *
 * @param {Object} seller - Seller object with business information
 * @returns {Object} Business information object
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
 * This function extracts location information from the seller's addresses.
 * It prioritizes business address information but falls back to seller address
 * if business address is not available.
 *
 * Location Priority:
 * 1. Business address (primary)
 * 2. Seller address (fallback)
 *
 * @param {Object} seller - Seller object with address information
 * @returns {Object} Location information object
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
 * This function extracts and formats the seller's delivery policy information.
 * It provides sensible defaults for missing policy data to ensure the profile
 * is complete.
 *
 * Delivery Policy Includes:
 * - Processing time for orders
 * - Delivery time estimates
 * - Free shipping policy
 * - Cash on delivery availability
 *
 * @param {Object} storePolicy - Store policy object with delivery information
 * @returns {Object} Delivery policy object
 */
function buildDeliveryPolicy(storePolicy) {
  return {
    processingTime: storePolicy?.processingTime || null,
    deliveryTimes: storePolicy?.deliveryTimes || null,
    freeShippingPolicy: storePolicy?.freeShippingPolicy || null,
    allowsCod: storePolicy?.allowsCod || true, // Default to allowing COD
  };
}

/**
 * Builds returns policy information.
 *
 * This function extracts and formats the seller's returns policy information.
 * It provides standard defaults for common return policy elements.
 *
 * Returns Policy Includes:
 * - Return window (default: 14 days)
 * - Return conditions
 * - Return shipping policy
 * - Non-refundable items list
 *
 * @param {Object} storePolicy - Store policy object with returns information
 * @returns {Object} Returns policy object
 */
function buildReturnsPolicy(storePolicy) {
  return {
    returnWindow: storePolicy?.returnWindow || 14, // Default 14-day return window
    returnCondition: storePolicy?.returnCondition || null,
    returnShipping: storePolicy?.returnShipping || null,
    nonRefundableItems: storePolicy?.nonRefundableItems || [],
  };
}

/**
 * Builds refunds policy information.
 *
 * This function extracts and formats the seller's refund policy information.
 * It handles various aspects of the refund process.
 *
 * Refunds Policy Includes:
 * - General refund policy
 * - Refund method information
 * - Lost or damaged item policy
 *
 * @param {Object} storePolicy - Store policy object with refunds information
 * @returns {Object} Refunds policy object
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
 * This function extracts and formats the seller's exchange policy information.
 * It handles product exchange policies and conditions.
 *
 * @param {Object} storePolicy - Store policy object with exchange information
 * @returns {Object} Exchange policy object
 */
function buildExchangePolicy(storePolicy) {
  return {
    exchangePolicy: storePolicy?.exchangePolicy || null,
  };
}

/**
 * Builds store policies section of seller profile.
 *
 * This function aggregates all store policies into a comprehensive policies
 * section. It organizes policies by type for easy access and display.
 *
 * Policy Categories:
 * - Delivery policies
 * - Returns policies
 * - Refunds policies
 * - Exchange policies
 *
 * @param {Object} seller - Seller object with store policy information
 * @returns {Object} Complete store policies object
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
 * This function aggregates various statistics about the seller's activity
 * and performance. It combines data from multiple sources to create
 * comprehensive statistics.
 *
 * Statistics Included:
 * - Follower count (buyers following this seller)
 * - Following count (buyers that this seller is following)
 * - Total orders received
 * - Total streams conducted
 * - Total items sold
 *
 * @param {Object} seller - Seller object with followers data
 * @param {Array} orders - Array of seller's orders
 * @param {number} streamCount - Total number of streams
 * @param {number} followingCount - Number of buyers the seller is following
 * @param {number} soldItemsCount - Total items sold
 * @returns {Object} Statistics object
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
 * This function formats review statistics for display in the profile.
 * It ensures numerical values are properly formatted and handles
 * missing data gracefully.
 *
 * @param {Object} reviewStats - Review statistics object
 * @returns {Object} Formatted reviews information object
 */
function buildReviewsInfo(reviewStats) {
  return {
    averageRating: parseFloat(reviewStats.averageRating), // Ensure it's a number
    totalReviews: reviewStats.totalReviews,
    ratingDistribution: reviewStats.ratingDistribution,
  };
}

/**
 * Gets detailed seller profile information - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * seller profile retrieval process. It fetches data from multiple sources,
 * calculates statistics, and builds a comprehensive profile response.
 *
 * Business Logic Flow:
 * 1. Validates input data (seller ID)
 * 2. Fetches seller information with populated reviews
 * 3. Retrieves related data concurrently (orders, streams, followers, reviews)
 * 4. Calculates delivered items count from orders
 * 5. Builds review statistics from aggregated data
 * 6. Constructs all profile sections (personal, store, business, etc.)
 * 7. Increments store visits counter for analytics
 * 8. Returns comprehensive profile object
 *
 * Performance Optimizations:
 * - Uses Promise.all for concurrent data fetching
 * - Minimizes database queries through efficient aggregation
 * - Handles missing data gracefully with defaults
 *
 * Profile Sections:
 * - Personal Info: Basic seller information
 * - Store Info: Store details and following status
 * - Business Info: Business details and addresses
 * - Location: Geographic location information
 * - Store Policies: Delivery, returns, refunds, exchange policies
 * - Stats: Performance and engagement metrics
 * - Reviews: Rating statistics and distribution
 *
 * @param {string} sellerId - The seller's ID to retrieve profile for
 * @param {string|null} buyerId - The buyer's ID (for determining following status, null if not authenticated)
 * @returns {Promise<Object>} Complete seller profile object
 *   - personalInfo: {Object} - Seller's personal information
 *   - storeInfo: {Object} - Store details and following status
 *   - businessInfo: {Object} - Business information and addresses
 *   - location: {Object} - Geographic location
 *   - storePolicies: {Object} - All store policies
 *   - stats: {Object} - Performance statistics
 *   - reviews: {Object} - Review statistics
 * @throws {ValidationError} If seller ID validation fails
 * @throws {NotFoundException} If seller is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Get seller profile with authentication
 * const profile = await getSellerProfile('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');
 * // Returns comprehensive seller profile with following status
 * 
 * @example
 * // Get seller profile without authentication
 * const profile = await getSellerProfile('507f1f77bcf86cd799439011', null);
 * // Returns comprehensive seller profile without following status
 */
async function getSellerProfile(sellerId, buyerId) {
  // Step 1: Validate input data
  // This ensures sellerId is provided and has valid format
  await getSellerProfileValidator.validateGetSellerProfileData({ sellerId });

  // Step 2: Find seller with populated reviews
  // This fetches the seller document with all necessary fields
  const seller = await buyerRepository.findSellerById(sellerId);
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }

  // Step 3: Get counts and data using Promise.all for better performance
  // Fetch all related data concurrently to minimize response time
  const [orders, streamCount, followingCount, reviews] = await Promise.all([
    orderRepository.findOrdersBySeller(sellerId),
    streamRepository.countStreamsBySeller(sellerId),
    sellerRepository.countBuyersFollowedBySeller(sellerId),
    orderRepository.getReviewStats(sellerId)
  ]);

  // Step 4: Calculate delivered orders count
  // Process orders to count successfully delivered items
  const soldItemsCount = calculateDeliveredItemsCount(orders);

  // Step 5: Calculate review statistics
  // Combine seller stats with aggregated review data
  const reviewStats = buildReviewStats(seller, reviews);

  // Step 6: Build complete seller profile
  // Construct all profile sections with the gathered data
  const sellerProfile = {
    personalInfo: buildPersonalInfo(seller),
    storeInfo: buildStoreInfo(seller, buyerId),
    businessInfo: buildBusinessInfo(seller),
    location: buildLocationInfo(seller),
    storePolicies: buildStorePolicies(seller),
    stats: buildStats(seller, orders, streamCount, followingCount, soldItemsCount),
    reviews: buildReviewsInfo(reviewStats)
  };

  // Step 7: Increment store visits for analytics
  // Track profile views for engagement metrics
  await sellerRepository.incrementStoreVisits(sellerId);

  return sellerProfile;
}

module.exports = {
  getSellerProfile
}; 