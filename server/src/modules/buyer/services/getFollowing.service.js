const buyerRepository = require('../repositories/buyer.repository');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const queryParser = require('../../../utils/queryParser');

/**
 * Format a seller that the buyer follows for API response
 * @param {Object} seller - The seller object from database
 * @param {string} buyerId - The buyer ID
 * @returns {Object} - Formatted seller object
 */
function formatFollowingSeller(seller, buyerId) {
  if (!seller) {
    return null;
  }

  const followerData = seller.followers.find(f => f.buyerId?.toString() === buyerId);
  if (!followerData) {
    return null;
  }

  return {
    id: seller._id.toString(),
    type: 'seller',
    name: `${seller.firstName} ${seller.lastName}`,
    storeName: seller.storeName || seller.businessName,
    profileImage: seller.storeAvatar?.url || seller.profileImage?.url,
    followDate: followerData.followDate
  };
}

/**
 * Format a buyer that the buyer follows for API response
 * @param {Object} buyer - The buyer object from database
 * @param {string} buyerId - The buyer ID
 * @returns {Object} - Formatted buyer object
 */
function formatFollowingBuyer(buyer, buyerId) {
  // Note: Buyers don't follow other buyers in the current schema
  // This function is kept for future extensibility
  return null;
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
 * Get paginated following data
 * @param {string} buyerId - The buyer ID
 * @param {Object} params - Request parameters including pagination and filters
 * @returns {Object} - Paginated following data
 */
async function listPaginatedFollowing(buyerId, params) {
  const { page, limit, filters } = params;
  
  // Find sellers that this buyer follows
  const sellers = await buyerRepository.findSellersFollowingByBuyer(buyerId);
  
  // Find buyers that this buyer follows
  const buyers = await buyerRepository.findBuyersFollowingByBuyer(buyerId);

  // Combine and format following data
  let following = [
    ...sellers.map(seller => formatFollowingSeller(seller, buyerId)).filter(f => f !== null),
    ...buyers.map(buyer => formatFollowingBuyer(buyer, buyerId)).filter(f => f !== null)
  ];

  // Sort by follow date (newest first)
  following.sort((a, b) => new Date(b.followDate) - new Date(a.followDate));

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const total = following.length;
  const paginatedFollowing = following.slice(startIndex, endIndex);

  const pages = Math.ceil(total / limit);

  return {
    data: {
      following: paginatedFollowing,
    },
    pagination: {
      page,
      limit,
      total,
      pages
    }
  };
}

/**
 * Get following data without pagination
 * @param {string} buyerId - The buyer ID
 * @param {Object} filters - Filter parameters
 * @returns {Object} - Following data without pagination
 */
async function listFollowing(buyerId, filters) {
  // Find sellers that this buyer follows
  const sellers = await buyerRepository.findSellersFollowingByBuyer(buyerId);
  
  // Find buyers that this buyer follows
  const buyers = await buyerRepository.findBuyersFollowingByBuyer(buyerId);

  // Combine and format following data
  let following = [
    ...sellers.map(seller => formatFollowingSeller(seller, buyerId)).filter(f => f !== null),
    ...buyers.map(buyer => formatFollowingBuyer(buyer, buyerId)).filter(f => f !== null)
  ];

  // Sort by follow date (newest first)
  following.sort((a, b) => new Date(b.followDate) - new Date(a.followDate));

  return {
    data: {
      following: following,
    },
    pagination: {}
  };
}

module.exports = {
  formatFollowingSeller,
  formatFollowingBuyer,
  getPaginationOptions,
  getFilters,
  listPaginatedFollowing,
  listFollowing
}; 