/**
 * Profile Service
 *
 * This service handles the business logic for buyer profile retrieval and enhancement.
 * It provides comprehensive profile data including basic information, social statistics,
 * and formatted profile fields for display.
 *
 * The service ensures that:
 * - Profile data is retrieved efficiently with field selection
 * - Social statistics are calculated accurately
 * - Profile data is enhanced with counts and formatted fields
 * - Performance is optimized with parallel data fetching
 * - Error handling maintains data integrity
 *
 * Profile Retrieval Flow:
 * - Buyer existence validation
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
 * - Social media statistics (followers, following, posts)
 * - Profile image URL formatting
 * - Bio field normalization
 * - Comprehensive profile structure
 *
 * @module profileService
 */

const buyerRepository = require('../repositories/buyer.repository');
const postRepository = require('../repositories/post.repository');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const mongoose = require('mongoose');
const Seller = require('../../../models/Seller');
const Buyer = require('../../../models/Buyer');

/**
 * Retrieves the profile information for a buyer - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * profile retrieval process. It handles data fetching, statistics calculation,
 * and profile enhancement in an efficient and comprehensive manner.
 *
 * Business Logic Flow:
 * 1. Retrieves buyer data with specific field selection
 * 2. Validates buyer existence
 * 3. Calculates social statistics in parallel
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
 * - Social media statistics calculation
 * - Profile image URL formatting
 * - Bio field normalization
 * - Comprehensive profile structure
 *
 * Error Handling:
 * - Buyer not found errors
 * - Statistics calculation errors (graceful fallback)
 * - Database operation errors
 * - Data formatting errors
 *
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object>} Enhanced buyer profile data with statistics
 *   - firstName: {string} - Buyer's first name
 *   - lastName: {string} - Buyer's last name
 *   - username: {string} - Buyer's username
 *   - email: {string} - Buyer's email address
 *   - country: {string} - Buyer's country
 *   - phoneNumber: {string} - Buyer's phone number
 *   - profileImage: {Object} - Profile image data
 *   - shippingAddresses: {Array} - Shipping addresses
 *   - emailVerified: {boolean} - Email verification status
 *   - phoneVerified: {boolean} - Phone verification status
 *   - isDisabled: {boolean} - Account disabled status
 *   - isNewBuyer: {boolean} - New buyer flag
 *   - createdAt: {Date} - Account creation date
 *   - isIdentityVerified: {boolean} - Identity verification status
 *   - preferredCurrency: {string} - Preferred currency
 *   - preferredLanguage: {string} - Preferred language
 *   - role: {string} - User role
 *   - wallet: {Object} - Wallet information
 *   - bio: {string} - User bio
 *   - notificationPreferences: {Object} - Notification settings
 *   - isActive: {boolean} - Account active status
 *   - followersCount: {number} - Number of followers
 *   - followingCount: {number} - Number of following
 *   - postsCount: {number} - Number of posts
 *   - profilePictureUrl: {string|null} - Formatted profile image URL
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Get buyer profile
 * const profile = await getProfile('507f1f77bcf86cd799439011');
 * // Returns: {
 * //   firstName: 'John',
 * //   lastName: 'Doe',
 * //   username: 'johndoe',
 * //   email: 'john@example.com',
 * //   followersCount: 150,
 * //   followingCount: 75,
 * //   postsCount: 25,
 * //   profilePictureUrl: 'https://example.com/image.jpg',
 * //   ...
 * // }
 */
async function getProfile(buyerId) {
  // Step 1: Get buyer with selected fields for efficiency
  // This retrieves only the necessary fields to optimize performance
  const buyer = await buyerRepository.findByIdWithFields(buyerId, {
    firstName: 1,
    lastName: 1,
    username: 1,
    email: 1,
    country: 1,
    phoneNumber: 1,
    profileImage: 1,
    shippingAddresses: 1,
    emailVerified: 1,
    phoneVerified: 1,
    isDisabled: 1,
    isNewBuyer: 1,
    createdAt: 1,
    isIdentityVerified: 1,
    preferredCurrency: 1,
    preferredLanguage: 1,
    role: 1,
    wallet: 1,
    bio: 1,
    notificationPreferences: 1,
    isActive: 1
  });

  // Step 2: Validate buyer existence
  // This ensures the buyer exists before proceeding with statistics
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: Get counts in parallel for better performance
  // This calculates social statistics concurrently for optimal performance
  const [followersCount, followingCount, postsCount] = await Promise.all([
    buyerRepository.getFollowersCount(buyerId).catch(() => 0),
    buyerRepository.getFollowingCount(buyerId).catch(() => 0),
    postRepository.getPostsCount(buyerId)
  ]);

  // Step 4: Enhance buyer data with counts and formatted fields
  // This creates a comprehensive profile with statistics and formatting
  const enhancedBuyer = {
    ...buyer,
    followersCount,
    followingCount,
    postsCount,
    profilePictureUrl: buyer.profileImage?.url || null,
    bio: buyer.bio || null,
    followingPreview: [],
    followersPreview: []
  };

  // Step 5: Build lightweight previews of followed sellers and followers (max 4 each)
  // These previews only include image URLs to avoid bloating the response
  try {
    const buyerObjectId = new mongoose.Types.ObjectId(buyerId);

    // Following preview: Sellers that this buyer follows (stored in Seller.followers array)
    // Get sellers where this buyer appears in their followers array
    const followingWithImages = await Seller.aggregate([
      { $match: { 'followers.buyerId': buyerObjectId } },
      { $unwind: '$followers' },
      { $match: { 'followers.buyerId': buyerObjectId } },
      { $addFields: { imageUrl: { $ifNull: ['$storeAvatar.url', '$profileImage.url'] } } },
      { $match: { imageUrl: { $ne: null } } },
      { $sort: { 'followers.followDate': -1 } },
      { $project: { _id: 0, imageUrl: 1 } },
      { $limit: 4 }
    ]);

    enhancedBuyer.followingPreview = (Array.isArray(followingWithImages)
      ? followingWithImages.map(item => ({ imageUrl: item.imageUrl }))
      : []);

    // Followers preview: Sellers that follow this buyer (stored in Buyer.followers array)
    // Get buyer's followers array and fetch seller images
    const buyerWithFollowers = await Buyer.findById(buyerId)
      .select('followers')
      .lean();

    if (buyerWithFollowers && buyerWithFollowers.followers && buyerWithFollowers.followers.length > 0) {
      // Get seller IDs from followers array
      const followerSellerIds = buyerWithFollowers.followers
        .filter(f => f.sellerId)
        .map(f => {
          // Handle both ObjectId and string formats
          return typeof f.sellerId === 'string' 
            ? new mongoose.Types.ObjectId(f.sellerId) 
            : f.sellerId;
        })
        .slice(0, 20); // Limit to avoid too many queries

      if (followerSellerIds.length > 0) {
        // Fetch sellers with images
        const followersWithImages = await Seller.aggregate([
          { $match: { _id: { $in: followerSellerIds } } },
          { $addFields: { imageUrl: { $ifNull: ['$storeAvatar.url', '$profileImage.url'] } } },
          { $match: { imageUrl: { $ne: null } } },
          { $project: { _id: 0, imageUrl: 1 } },
          { $limit: 4 }
        ]);

        enhancedBuyer.followersPreview = (Array.isArray(followersWithImages)
          ? followersWithImages.map(item => ({ imageUrl: item.imageUrl }))
          : []);
      }
    }
  } catch (aggErr) {
    // Silently ignore preview errors to avoid impacting main profile response
    // Log error for observability but don't fail the request
    // eslint-disable-next-line no-console
    console.error('Profile preview aggregation error:', aggErr?.message || aggErr);
  }

  // Step 6: Return enhanced profile data
  return enhancedBuyer;
}

module.exports = {
  getProfile,
}; 