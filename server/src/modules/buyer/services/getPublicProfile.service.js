/**
 * Get Public Profile Service
 *
 * This service handles the business logic for retrieving buyer public profile information.
 * It provides functionality to:
 * - Calculate statistics from activity feed and follower data
 * - Format profile data for public display
 * - Transform complex data structures into API-friendly formats
 * - Handle missing or invalid data gracefully
 * - Provide comprehensive public profile information
 *
 * The service ensures that:
 * - Profile data is properly formatted for public consumption
 * - Statistics are accurately calculated from activity data
 * - Sensitive information is filtered out for public display
 * - Data transformation is consistent and reliable
 * - Error handling is graceful for missing data
 *
 * Profile Components:
 * - Basic information (name, username, profile image, etc.)
 * - Statistics (posts, reviews, followers, following)
 * - Recent activity feed (limited to 10 items)
 * - Selected categories with subcategories
 *
 * @module getPublicProfileService
 */

const buyerRepository = require('../repositories/buyer.repository');
const { validateGetPublicProfileData } = require('../validators/getPublicProfile.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Calculate total reviews from activity feed.
 * 
 * This function analyzes the buyer's activity feed to count the total number
 * of product reviews they have made. It filters activities by type to identify
 * review activities specifically.
 *
 * Activity Type Filtering:
 * - Looks for activities with type 'product_review'
 * - Handles missing or invalid activity feed gracefully
 * - Returns 0 for empty or invalid activity feeds
 *
 * @param {Array} activityFeed - Array of activity feed items
 * @returns {number} Total number of product reviews
 */
function calculateTotalReviews(activityFeed) {
  // Handle missing or invalid activity feed
  if (!activityFeed || !Array.isArray(activityFeed)) {
    return 0;
  }
  
  // Filter activities by type and count reviews
  return activityFeed.filter(activity => activity.type === 'product_review').length;
}

/**
 * Calculate total following count from activity feed.
 * 
 * This function analyzes the buyer's activity feed to count the total number
 * of follow activities they have performed. It filters activities by type to
 * identify follow activities specifically.
 *
 * Activity Type Filtering:
 * - Looks for activities with type 'follow'
 * - Handles missing or invalid activity feed gracefully
 * - Returns 0 for empty or invalid activity feeds
 *
 * @param {Array} activityFeed - Array of activity feed items
 * @returns {number} Total number of follow activities
 */
function calculateTotalFollowing(activityFeed) {
  // Handle missing or invalid activity feed
  if (!activityFeed || !Array.isArray(activityFeed)) {
    return 0;
  }
  
  // Filter activities by type and count follows
  return activityFeed.filter(activity => activity.type === 'follow').length;
}

/**
 * Calculate total followers count.
 * 
 * This function calculates the total number of followers for the buyer
 * by counting the length of the followers array.
 *
 * Follower Calculation:
 * - Counts the length of the followers array
 * - Handles missing or invalid followers array gracefully
 * - Returns 0 for empty or invalid followers arrays
 *
 * @param {Array} followers - Array of follower objects
 * @returns {number} Total number of followers
 */
function calculateTotalFollowers(followers) {
  // Handle missing or invalid followers array
  if (!followers || !Array.isArray(followers)) {
    return 0;
  }
  
  // Return the length of the followers array
  return followers.length;
}

/**
 * Format recent activity for response.
 * 
 * This function processes the buyer's activity feed to create a formatted
 * list of recent activities for public display. It sorts activities by date
 * and limits the output to the 10 most recent items.
 *
 * Activity Processing:
 * - Sorts activities by creation date (newest first)
 * - Limits output to 10 most recent activities
 * - Extracts relevant fields for public display
 * - Handles missing or invalid activity feed gracefully
 *
 * @param {Array} activityFeed - Array of activity feed items
 * @returns {Array} Formatted recent activity array (max 10 items)
 */
function formatRecentActivity(activityFeed) {
  // Handle missing or invalid activity feed
  if (!activityFeed || !Array.isArray(activityFeed)) {
    return [];
  }
  
  // Sort by createdAt in descending order and limit to 10 items
  const sortedActivityFeed = activityFeed
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);
  
  // Format activities for public display
  return sortedActivityFeed.map(activity => ({
    type: activity.type,
    content: activity.content,
    createdAt: activity.createdAt
  }));
}

/**
 * Format selected categories for response.
 * 
 * This function processes the buyer's selected categories to create a
 * formatted structure for public display. It handles the hierarchical
 * category structure with main categories and subcategories.
 *
 * Category Structure:
 * - Main categories with names
 * - Subcategories under each main category
 * - Handles missing or invalid category data gracefully
 * - Returns empty array for missing data
 *
 * @param {Array} selectedCategories - Array of selected categories
 * @returns {Array} Formatted categories array with hierarchical structure
 */
function formatSelectedCategories(selectedCategories) {
  // Handle missing or invalid selected categories
  if (!selectedCategories || !Array.isArray(selectedCategories)) {
    return [];
  }
  
  // Format categories with hierarchical structure
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
 * This function extracts and formats the buyer's basic profile information
 * for public display. It includes essential profile fields while ensuring
 * sensitive information is not exposed.
 *
 * Basic Info Fields:
 * - First and last name
 * - Username for identification
 * - Profile image for visual representation
 * - Bio for personal description
 * - Country for location information
 * - Joined date for account age
 * - Identity verification status for trust
 *
 * @param {Object} buyer - Buyer object with profile data
 * @returns {Object} Formatted basic info object for public display
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
 * This function creates a formatted statistics object for the buyer's
 * public profile. It combines various metrics into a single stats object.
 *
 * Statistics Included:
 * - totalPosts: Number of posts created
 * - totalReviews: Number of product reviews written
 * - totalFollowers: Number of followers
 * - totalFollowing: Number of accounts being followed
 *
 * @param {number} totalPosts - Total number of posts
 * @param {number} totalReviews - Total number of reviews
 * @param {number} totalFollowers - Total number of followers
 * @param {number} totalFollowing - Total number of following
 * @returns {Object} Formatted stats object with all metrics
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
 * Retrieves the public profile information for a buyer - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * public profile retrieval process. It validates input, fetches data,
 * calculates statistics, and formats the response for public consumption.
 *
 * Business Logic Flow:
 * 1. Validates the buyer ID using the validator
 * 2. Fetches the buyer's public profile data from repository
 * 3. Calculates various statistics from activity feed and follower data
 * 4. Formats all profile components for public display
 * 5. Returns comprehensive public profile information
 *
 * Data Processing:
 * - Extracts basic profile information
 * - Calculates statistics from activity feed
 * - Processes recent activity for display
 * - Formats selected categories with hierarchy
 * - Handles missing data gracefully
 *
 * Security Considerations:
 * - Only exposes public information
 * - Filters out sensitive data
 * - Validates buyer existence before processing
 * - Handles missing data without exposing internal structure
 *
 * @param {string} buyerId - The buyer's ID to retrieve public profile for
 * @returns {Promise<Object>} Formatted public profile data
 *   - basicInfo: {Object} - Basic profile information
 *     - firstName: {string} - Buyer's first name
 *     - lastName: {string} - Buyer's last name
 *     - username: {string} - Buyer's username
 *     - profileImage: {Object} - Profile image data
 *     - bio: {string} - Buyer's bio
 *     - country: {string} - Buyer's country
 *     - joinedDate: {Date} - Account creation date
 *     - isIdentityVerified: {boolean} - Identity verification status
 *   - stats: {Object} - Profile statistics
 *     - totalPosts: {number} - Total number of posts
 *     - totalReviews: {number} - Total number of reviews
 *     - totalFollowers: {number} - Total number of followers
 *     - totalFollowing: {number} - Total number of following
 *   - recentActivity: {Array} - Recent activity feed (max 10 items)
 *     - type: {string} - Activity type
 *     - content: {string} - Activity content
 *     - createdAt: {Date} - Activity timestamp
 *   - selectedCategories: {Array} - Selected categories with subcategories
 *     - name: {string} - Category name
 *     - subCategories: {Array} - Array of subcategory objects
 * @throws {ValidationError} If buyer ID validation fails
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Get public profile for a buyer
 * const profile = await getPublicProfile('507f1f77bcf86cd799439011');
 * // Returns: {
 * //   basicInfo: { firstName: 'John', lastName: 'Doe', ... },
 * //   stats: { totalPosts: 15, totalReviews: 8, ... },
 * //   recentActivity: [...],
 * //   selectedCategories: [...]
 * // }
 */
async function getPublicProfile(buyerId) {
  // Step 1: Validate input parameters
  // This ensures buyerId is provided and has valid format
  await validateGetPublicProfileData({ buyerId });

  // Step 2: Get public profile data from repository
  // This fetches buyer data with post count from the database
  const profileData = await buyerRepository.getPublicProfileData(buyerId);

  // Step 3: Check if buyer exists
  if (!profileData) {
    throw new NotFoundException('Buyer not found');
  }

  const { buyer, postCount } = profileData;

  // Step 4: Calculate statistics from various data sources
  const totalReviews = calculateTotalReviews(buyer.activityFeed);
  const totalFollowing = calculateTotalFollowing(buyer.activityFeed);
  const totalFollowers = calculateTotalFollowers(buyer.followers);

  // Step 5: Format response data for public consumption
  const publicProfile = {
    basicInfo: formatBasicInfo(buyer),
    stats: formatStats(postCount, totalReviews, totalFollowers, totalFollowing),
    recentActivity: formatRecentActivity(buyer.activityFeed),
    selectedCategories: formatSelectedCategories(buyer.selectedCategories)
  };

  // Step 6: Return formatted public profile
  return publicProfile;
}

module.exports = {
  getPublicProfile
};
