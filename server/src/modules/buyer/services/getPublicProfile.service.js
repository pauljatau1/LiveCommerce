const buyerRepository = require('../repositories/buyer.repository');
const { validateGetPublicProfileData } = require('../validators/getPublicProfile.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Calculate total reviews from activity feed.
 * 
 * @param {Array} activityFeed - Array of activity feed items
 * @returns {number} Total number of product reviews
 */
function calculateTotalReviews(activityFeed) {
  if (!activityFeed || !Array.isArray(activityFeed)) {
    return 0;
  }
  
  return activityFeed.filter(activity => activity.type === 'product_review').length;
}

/**
 * Calculate total following count from activity feed.
 * 
 * @param {Array} activityFeed - Array of activity feed items
 * @returns {number} Total number of follow activities
 */
function calculateTotalFollowing(activityFeed) {
  if (!activityFeed || !Array.isArray(activityFeed)) {
    return 0;
  }
  
  return activityFeed.filter(activity => activity.type === 'follow').length;
}

/**
 * Calculate total followers count.
 * 
 * @param {Array} followers - Array of follower objects
 * @returns {number} Total number of followers
 */
function calculateTotalFollowers(followers) {
  if (!followers || !Array.isArray(followers)) {
    return 0;
  }
  
  return followers.length;
}

/**
 * Format recent activity for response.
 * 
 * @param {Array} activityFeed - Array of activity feed items
 * @returns {Array} Formatted recent activity array
 */
function formatRecentActivity(activityFeed) {
  if (!activityFeed || !Array.isArray(activityFeed)) {
    return [];
  }
  
  // Sort by createdAt in descending order and limit to 10 items
  const sortedActivityFeed = activityFeed
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);
  
  return sortedActivityFeed.map(activity => ({
    type: activity.type,
    content: activity.content,
    createdAt: activity.createdAt
  }));
}

/**
 * Format selected categories for response.
 * 
 * @param {Array} selectedCategories - Array of selected categories
 * @returns {Array} Formatted categories array
 */
function formatSelectedCategories(selectedCategories) {
  if (!selectedCategories || !Array.isArray(selectedCategories)) {
    return [];
  }
  
  return selectedCategories.map(category => ({
    name: category.name,
    subCategories: category.subCategories?.map(sub => ({
      name: sub.name
    })) || []
  }));
}

/**
 * Format basic info for response.
 * 
 * @param {Object} buyer - Buyer object with profile data
 * @returns {Object} Formatted basic info object
 */
function formatBasicInfo(buyer) {
  return {
    firstName: buyer.firstName,
    lastName: buyer.lastName,
    username: buyer.username,
    profileImage: buyer.profileImage,
    bio: buyer.bio,
    country: buyer.country,
    joinedDate: buyer.createdAt,
    isIdentityVerified: buyer.isIdentityVerified
  };
}

/**
 * Format stats for response.
 * 
 * @param {number} totalPosts - Total number of posts
 * @param {number} totalReviews - Total number of reviews
 * @param {number} totalFollowers - Total number of followers
 * @param {number} totalFollowing - Total number of following
 * @returns {Object} Formatted stats object
 */
function formatStats(totalPosts, totalReviews, totalFollowers, totalFollowing) {
  return {
    totalPosts,
    totalReviews,
    totalFollowers,
    totalFollowing
  };
}

/**
 * Retrieves the public profile information for a buyer.
 *
 * This function:
 * - Validates the buyer ID
 * - Fetches the buyer's public profile data from repository
 * - Calculates various statistics (posts, reviews, followers, following)
 * - Formats the response data structure
 * - Returns comprehensive public profile information
 *
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object>} Formatted public profile data
 */
async function getPublicProfile(buyerId) {
  // Validate input parameters
  await validateGetPublicProfileData({ buyerId });

  // Get public profile data from repository
  const profileData = await buyerRepository.getPublicProfileData(buyerId);

  if (!profileData) {
    throw new NotFoundException('Buyer not found');
  }

  const { buyer, postCount } = profileData;

  // Calculate statistics
  const totalReviews = calculateTotalReviews(buyer.activityFeed);
  const totalFollowing = calculateTotalFollowing(buyer.activityFeed);
  const totalFollowers = calculateTotalFollowers(buyer.followers);

  // Format response data
  const publicProfile = {
    basicInfo: formatBasicInfo(buyer),
    stats: formatStats(postCount, totalReviews, totalFollowers, totalFollowing),
    recentActivity: formatRecentActivity(buyer.activityFeed),
    selectedCategories: formatSelectedCategories(buyer.selectedCategories)
  };

  return publicProfile;
}

module.exports = {
  getPublicProfile
};
