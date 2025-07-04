const buyerRepository = require('../repositories/buyer.repository');
const Post = require('../../../models/Post');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Retrieves the profile information for a buyer.
 *
 * This function:
 * - Fetches the buyer's basic profile information
 * - Calculates followers, following, and posts counts
 * - Returns enhanced profile data with counts and formatted fields
 *
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object>} Enhanced buyer profile data
 */
async function getProfile(buyerId) {
  // Get buyer with selected fields
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

  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Get counts in parallel for better performance
  const [followersCount, followingCount, postsCount] = await Promise.all([
    buyerRepository.getFollowersCount(buyerId),
    buyerRepository.getFollowingCount(buyerId),
    buyerRepository.getPostsCount(buyerId)
  ]);

  // Enhance buyer data with counts and formatted fields
  const enhancedBuyer = {
    ...buyer,
    followersCount,
    followingCount,
    postsCount,
    profilePictureUrl: buyer.profileImage?.url || null,
    bio: buyer.bio || null
  };

  return enhancedBuyer;
}

module.exports = {
  getProfile,
}; 