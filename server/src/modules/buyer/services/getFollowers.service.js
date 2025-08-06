const buyerRepository = require('../repositories/buyer.repository');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const validateGetFollowersData = require('../validators/getFollowers.validator');
const queryParser = require('../../../utils/queryParser');

/**
 * Format a follower object for API response
 * @param {Object} follower - The follower object from database
 * @returns {Object} - Formatted follower object
 */
function formatFollower(follower) {
  if (!follower || !follower.sellerId) {
    return null;
  }

  const seller = follower.sellerId;
  
  return {
    id: seller._id.toString(),
    type: 'seller',
    name: seller.storeName || seller.businessName || 'Unknown',
    storeName: seller.storeName || seller.businessName || 'Unknown Store',
    businessName: seller.businessName || 'Unknown Business',
    profileImage: seller.profileImage || null,
    isVerified: seller.isVerified || false,
    rating: seller.rating || 0,
    totalSales: seller.totalSales || 0,
    followersCount: seller.followersCount || 0,
    createdAt: follower.createdAt
  };
}

/**
 * Get pagination options from request parameters
 * @param {Object} params - Request parameters
 * @returns {Object} - Pagination options
 */
function getPaginationOptions(params) {
  return queryParser.getPaginationOptions(params);
}

/**
 * Get filters from request parameters
 * @param {Object} params - Request parameters
 * @returns {Object} - Filters object
 */
function getFilters(params) {
  return queryParser.getFilters(params);
}

/**
 * Get followers without pagination
 * @param {string} buyerId - The buyer ID
 * @returns {Object} - Followers data without pagination
 */

/**
 * Get paginated followers
 * @param {string} buyerId - The buyer ID
 * @param {Object} pagination - Pagination parameters
 * @param {Object} filters - Filter parameters
 * @returns {Object} - Paginated followers data
 */
async function listPaginatedFollowers(buyerId, pagination, filters) {
  const buyer = await buyerRepository.findByIdWithPopulatedFollowers(buyerId);
  
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  const allFollowers = buyer.followers
    .map(formatFollower)
    .filter(follower => follower !== null);

  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;
  const paginatedFollowers = allFollowers.slice(startIndex, endIndex);

  const total = allFollowers.length;
  const pages = Math.ceil(total / pagination.limit);

  return {
    data: {
      followers: paginatedFollowers,
    },
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      pages
    }
  };
}

/**
 * Main function to get followers with optional pagination
 * @param {string} buyerId - The buyer ID
 * @param {Object} params - Request parameters including pagination and filters
 * @returns {Object} - Followers data with pagination info
 */
async function listFollowers(buyerId, params) {
  const buyer = await buyerRepository.findByIdWithPopulatedFollowers(buyerId);
  
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  const followers = buyer.followers
    .map(formatFollower)
    .filter(follower => follower !== null);

  return {
    data: {
      followers: followers,
    },
    pagination: {}
  };
}

module.exports = {
  formatFollower,
  getPaginationOptions,
  getFilters,
  listPaginatedFollowers,
  listFollowers
}; 