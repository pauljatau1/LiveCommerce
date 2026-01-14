/**
 * Get Profile Service
 *
 * This service handles the business logic for seller profile retrieval and enhancement.
 * It provides comprehensive profile data including basic information, business details,
 * store statistics, and operational status for display.
 *
 * The service ensures that:
 * - Profile data is retrieved efficiently with field selection
 * - Business statistics are calculated accurately
 * - Profile data is enhanced with counts and formatted fields
 * - Performance is optimized with parallel data fetching
 * - Error handling maintains data integrity
 *
 * Profile Retrieval Flow:
 * - Seller existence validation
 * - Field-specific data retrieval
 * - Parallel statistics calculation
 * - Data enhancement and formatting
 * - Comprehensive profile response
 *
 * Performance Optimizations:
 * - Field selection for efficient queries
 * - Parallel data fetching for statistics
 * - Error handling for optional statistics
 * - Optimized database operations
 *
 * Data Enhancement:
 * - Business statistics (orders, streams, categories)
 * - Store status and operating hours
 * - Profile completion indicators
 * - Comprehensive profile structure
 *
 * @module getProfileService
 */

const sellerRepository = require('../repositories/seller.repository');
const orderRepository = require('../repositories/order.repository');
const streamRepository = require('../repositories/stream.repository');
const productRepository = require('../repositories/product.repository');
const buyerRepository = require('../repositories/buyer.repository');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Helper function to get current schedule for a seller.
 *
 * This function determines the current operating schedule for a seller
 * by checking special dates first, then falling back to regular hours.
 * It handles both special date overrides and standard weekly schedules.
 *
 * Business Logic:
 * - Prioritizes special date schedules over regular hours
 * - Handles cases where special dates may override regular schedules
 * - Provides structured schedule information for frontend display
 * - Gracefully handles missing schedule data
 *
 * @param {Object} seller - Seller object with operating hours and special dates
 * @returns {Object} Current schedule information
 *   - type: {string} - Schedule type ('special' or 'regular')
 *   - isOpen: {boolean} - Whether the store is currently open
 *   - openTime: {string} - Store opening time
 *   - closeTime: {string} - Store closing time
 *   - day: {string} - Current day of week (for regular schedules)
 *   - note: {string} - Special note for special dates
 */
function getCurrentSchedule(seller) {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];

  // Check for special dates first (these override regular hours)
  const specialDate = seller.specialDates?.find(d =>
    new Date(d.date).toDateString() === now.toDateString()
  );

  if (specialDate) {
    return {
      type: 'special',
      isOpen: specialDate.isOpen,
      openTime: specialDate.openTime,
      closeTime: specialDate.closeTime,
      note: specialDate.note
    };
  }

  // Return regular hours for the current day
  const regularHours = seller.operatingHours?.[today];
  return {
    type: 'regular',
    day: today,
    isOpen: regularHours?.isOpen || false,
    openTime: regularHours?.openTime,
    closeTime: regularHours?.closeTime
  };
}

/**
 * Get seller field selection for profile retrieval.
 * This defines the specific fields needed for the profile to optimize performance.
 * @returns {Object} Field selection object for Mongoose projection
 */
function getProfileFieldSelection() {
  return {
    firstName: 1,
    lastName: 1,
    email: 1,
    phoneNumber: 1,
    isVerified: 1,
    emailVerified: 1,
    isPhoneVerified: 1,
    isFeatured: 1,
    isDisabled: 1,
    walletBalance: 1,
    storeVisits: 1,
    createdAt: 1,
    accountType: 1,
    businessName: 1,
    businessType: 1,
    isProfileComplete: 1,
    businessEmail: 1,
    businessNumber: 1,
    businessAddress: 1,
    sellerAddress: 1,
    warehouseDetails: 1,
    bankDetails: 1,
    isBankVerified: 1,
    shippingOptions: 1,
    storeAvatar: 1,
    storeBanner: 1,
    hasFilledAddress: 1,
    hasFilledBankDetails: 1,
    hasFilledBusinessAddress: 1,
    hasFilledCategoryDetails: 1,
    hasFilledVerificationDocuments: 1,
    hasFilledWarehouseAddress: 1,
    isNewSeller: 1,
    onboardingProcess: 1,
    notificationPreferences: 1,
    aboutStore: 1,
    storeName: 1,
    stats: 1,
    campaignStats: 1,
    cancelledStreamCount: 1,
    lastStreamCancellation: 1,
    agoraUid: 1,
    followers: 1,
    following: 1,
    operatingHours: 1,
    specialDates: 1,
    timezone: 1,
    storePolicy: 1,
    accountPending: 1,
    offersStorePickup: 1,
    smileIdVerification: 1,
    socialMedia: 1,
    isInternational: 1
  };
}

/**
 * Fetch seller statistics and related data in parallel.
 * This optimizes performance by running all database queries concurrently.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<Array>} Array containing [orderCount, streamCount, categoriesCount, followingCount, products]
 */
async function fetchSellerStatistics(sellerId) {
  return Promise.all([
    orderRepository.countOrdersBySeller(sellerId).catch(() => 0),
    streamRepository.countStreamsBySeller(sellerId).catch(() => 0),
    sellerRepository.getCategoriesCount(sellerId).catch(() => 0),
    buyerRepository.countBuyersFollowedBySeller(sellerId).catch(() => 0),
    productRepository.findProductsBySeller(sellerId).catch(() => [])
  ]);
}

/**
 * Calculate product-related metrics from products data.
 * This provides insights into seller's product catalog and engagement.
 * @param {Array} products - Array of products with blips
 * @returns {Object} Object containing hasProducts and hasMoreThan10Blips
 */
function calculateProductMetrics(products) {
  const hasProducts = products.length > 0;
  const totalBlips = products.reduce((total, product) => {
    return total + (product.blips ? product.blips.length : 0);
  }, 0);
  const hasMoreThan10Blips = totalBlips > 10;

  return { hasProducts, hasMoreThan10Blips };
}

/**
 * Build enhanced seller profile with statistics and formatting.
 * This creates a comprehensive profile by combining seller data with calculated metrics.
 * @param {Object} seller - Seller data from database
 * @param {number} orderCount - Total order count
 * @param {number} streamCount - Total stream count
 * @param {number} categoriesCount - Total categories count
 * @param {number} followingCount - Number of buyers the seller is following
 * @param {Object} productMetrics - Product-related metrics
 * @returns {Object} Enhanced seller profile
 */
function buildSellerProfile(seller, orderCount, streamCount, categoriesCount, followingCount, productMetrics) {
  const sellerProfile = {
    ...seller,
    followersCount: seller.followers?.length || 0,
    followingCount: followingCount,
    totalOrders: orderCount,
    streamCount: streamCount,
    categoriesCount: categoriesCount,
    hasProducts: productMetrics.hasProducts,
    hasMoreThan10Blips: productMetrics.hasMoreThan10Blips,
    storeStatus: {
      currentSchedule: getCurrentSchedule(seller)
    }
  };

  // Remove the full arrays from the response for cleaner data
  delete sellerProfile.followers;
  delete sellerProfile.following;

  return sellerProfile;
}

/**
 * Retrieves the profile information for a seller - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * profile retrieval process. It handles data fetching, statistics calculation,
 * and profile enhancement in an efficient and comprehensive manner.
 *
 * Business Logic Flow:
 * 1. Retrieves seller data with specific field selection
 * 2. Validates seller existence
 * 3. Calculates business statistics in parallel
 * 4. Enhances profile data with counts and formatting
 * 5. Returns comprehensive profile information
 *
 * Performance Features:
 * - Field selection for efficient database queries
 * - Parallel statistics calculation for better performance
 * - Error handling for optional statistics
 * - Optimized data retrieval strategy
 *
 * Data Enhancement:
 * - Business statistics calculation
 * - Store status and operating hours
 * - Profile completion indicators
 * - Comprehensive profile structure
 *
 * Error Handling:
 * - Seller not found errors
 * - Statistics calculation errors (graceful fallback)
 * - Database operation errors
 * - Data formatting errors
 *
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<Object>} Enhanced seller profile data with statistics
 *   - firstName: {string} - Seller's first name
 *   - lastName: {string} - Seller's last name
 *   - email: {string} - Seller's email address
 *   - phoneNumber: {string} - Seller's phone number
 *   - isVerified: {boolean} - Verification status
 *   - emailVerified: {boolean} - Email verification status
 *   - isFeatured: {boolean} - Featured seller status
 *   - isDisabled: {boolean} - Account disabled status
 *   - walletBalance: {number} - Current wallet balance
 *   - storeVisits: {number} - Total store visits
 *   - createdAt: {Date} - Account creation date
 *   - accountType: {string} - Account type (individual/business)
 *   - businessName: {string} - Business name
 *   - businessType: {string} - Type of business
 *   - isProfileComplete: {boolean} - Profile completion status
 *   - businessEmail: {string} - Business email address
 *   - businessNumber: {string} - Business registration number
 *   - businessAddress: {Object} - Business address details
 *   - sellerAddress: {Object} - Personal address details
 *   - warehouseDetails: {Object} - Warehouse information
 *   - bankDetails: {Object} - Banking information
 *   - shippingOptions: {Object} - Shipping configuration
 *   - storeAvatar: {Object} - Store avatar image
 *   - storeBanner: {Object} - Store banner image
 *   - hasFilledAddress: {boolean} - Address completion status
 *   - hasFilledBankDetails: {boolean} - Bank details completion status
 *   - hasFilledBusinessAddress: {boolean} - Business address completion status
 *   - hasFilledCategoryDetails: {boolean} - Category completion status
 *   - hasFilledVerificationDocuments: {boolean} - Document completion status
 *   - hasFilledWarehouseAddress: {boolean} - Warehouse address completion status
 *   - isNewSeller: {boolean} - New seller flag
 *   - onboardingProcess: {string} - Onboarding progress
 *   - notificationPreferences: {Object} - Notification settings
 *   - aboutStore: {string} - Store description
 *   - storeName: {string} - Store name
 *   - stats: {Object} - Performance statistics
 *   - campaignStats: {Object} - Campaign performance data
 *   - cancelledStreamCount: {number} - Count of cancelled streams
 *   - lastStreamCancellation: {Date} - Last stream cancellation date
 *   - agoraUid: {number} - Agora user ID
 *   - followers: {Array} - Follower information
 *   - following: {Array} - Following information
 *   - operatingHours: {Object} - Store operating hours
 *   - specialDates: {Array} - Special operating dates
 *   - timezone: {string} - Store timezone
 *   - storePolicy: {Object} - Store policies
 *   - accountPending: {boolean} - Account approval status
 *   - offersStorePickup: {boolean} - Store pickup availability
 *   - smileIdVerification: {Object} - Identity verification status
 *   - socialMedia: {Object} - Social media links
 *   - isInternational: {boolean} - International shipping status
 *   - followersCount: {number} - Number of followers
 *   - followingCount: {number} - Number of following
 *   - totalOrders: {number} - Total order count
 *   - streamCount: {number} - Total stream count
 *   - categoriesCount: {number} - Number of categories
 *   - hasProducts: {boolean} - Whether seller has products
 *   - hasMoreThan10Blips: {boolean} - Blip count indicator
 *   - storeStatus: {Object} - Current store status
 * @throws {NotFoundException} If seller is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Get seller profile
 * const profile = await getProfile('507f1f77bcf86cd799439011');
 * // Returns comprehensive seller profile with all sections
 */
async function getProfile(sellerId) {
  // Step 1: Get seller with selected fields for efficiency
  const seller = await sellerRepository.findByIdWithFields(sellerId, getProfileFieldSelection());

  // Step 2: Validate seller existence
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }

  // Step 2.5: Validate phone number format and reset profile if needed
  // Check if phone number uses old format (starting with "0")
  if (seller.phoneNumber && seller.phoneNumber.startsWith('0')) {
    // Reset profile fields to trigger re-completion with correct phone format
    seller.hasFilledAddress = false;
    seller.hasFilledBusinessAddress = false;
    seller.storeName = null;
    seller.phoneNumber = null;

    // Save the updated seller record
    await sellerRepository.save(seller);
  }

  // Step 3: Get counts and product-related data in parallel
  const [orderCount, streamCount, categoriesCount, followingCount, products] = await fetchSellerStatistics(sellerId);

  // Step 4: Calculate product metrics
  const productMetrics = calculateProductMetrics(products);

  // Step 5: Build and return enhanced profile
  return buildSellerProfile(seller, orderCount, streamCount, categoriesCount, followingCount, productMetrics);
}

module.exports = {
  getProfile
};
