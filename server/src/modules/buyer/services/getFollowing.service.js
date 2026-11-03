/**
 * Get Following Service
 *
 * This service handles the business logic for retrieving a buyer's following list
 * with optional pagination and filtering capabilities. It provides functionality to:
 * - Retrieve sellers and buyers that the buyer follows
 * - Format following data for API responses
 * - Handle pagination for large following lists
 * - Apply filters to following data
 * - Validate buyer existence and data integrity
 *
 * The service supports both paginated and non-paginated responses,
 * allowing clients to efficiently retrieve following information based on their needs.
 *
 * @module getFollowingService
 */

const buyerRepository = require('../repositories/buyer.repository');
const queryParser = require('../../../utils/queryParser');

/**
 * Format a seller that the buyer follows for API response.
 *
 * This function transforms a seller object from the database format into
 * a clean, consistent format suitable for API responses. It extracts and
 * formats essential seller information for display.
 *
 * Business Logic:
 * - Validates seller object structure
 * - Finds the specific follow relationship for the buyer
 * - Extracts seller information for display
 * - Provides fallback values for missing data
 * - Maintains consistent response structure
 * - Handles null/undefined seller data gracefully
 *
 * @param {Object} seller - The seller object from database
 * @param {string} seller._id - Seller unique identifier
 * @param {string} seller.firstName - Seller first name
 * @param {string} seller.lastName - Seller last name
 * @param {string} seller.storeName - Seller store name
 * @param {string} seller.businessName - Seller business name
 * @param {Object} seller.storeAvatar - Seller store avatar object
 * @param {string} seller.storeAvatar.url - Store avatar URL
 * @param {Object} seller.profileImage - Seller profile image object
 * @param {string} seller.profileImage.url - Profile image URL
 * @param {Array} seller.followers - Array of follower objects
 * @param {Object} seller.followers[].buyerId - Buyer ID in followers list
 * @param {Date} seller.followers[].followDate - When the follow relationship was created
 * @param {string} buyerId - The buyer ID to find follow relationship for
 * @returns {Object|null} Formatted seller object or null if invalid
 * @example
 * // Input: Database seller object with followers
 * // Output: { id: "123", type: "seller", name: "John Doe", storeName: "Tech Store", ... }
 */
function formatFollowingSeller(seller, buyerId) {
  // Validate seller object structure
  if (!seller) {
    return null;
  }

  // Find the specific follow relationship for this buyer
  const followerData = seller.followers.find(f => f.buyerId?.toString() === buyerId);
  if (!followerData) {
    return null;
  }

  // Return formatted seller object with fallback values
  return {
    id: seller._id.toString(),
    type: 'seller',
    name: `${seller.firstName} ${seller.lastName}`,
    storeName: seller.storeName || seller.businessName,
    profileImage: seller.storeAvatar?.url || seller.profileImage?.url,
    followDate: followerData.followDate,
    followerCount: seller.followers?.length || 0,
    isLive: false, // Will be updated by the calling function
    itemsCount: 0  // Will be updated by the calling function
  };
}

/**
 * Format a buyer that the buyer follows for API response.
 *
 * This function is kept for future extensibility in case buyers
 * can follow other buyers in the future.
 *
 * Business Logic:
 * - Currently returns null as buyers don't follow other buyers
 * - Maintains function structure for future implementation
 * - Provides consistent interface for following data formatting
 *
 * @param {Object} buyer - The buyer object from database
 * @param {string} buyerId - The buyer ID
 * @returns {Object|null} Currently returns null for future extensibility
 */
function formatFollowingBuyer(buyer, buyerId) {
  // Note: Buyers don't follow other buyers in the current schema
  // This function is kept for future extensibility
  return null;
}

/**
 * Get pagination options from request parameters.
 *
 * This function extracts and validates pagination parameters from the request,
 * providing default values and ensuring proper formatting for data processing.
 *
 * Business Logic:
 * - Extracts page and limit parameters
 * - Applies default values for missing parameters
 * - Validates parameter ranges and types
 * - Returns standardized pagination object
 *
 * @param {Object} params - Request parameters containing pagination info
 * @param {number} params.page - Page number (optional, defaults to 1)
 * @param {number} params.limit - Items per page (optional, defaults to 10)
 * @returns {Object} Pagination options object
 * @example
 * const pagination = getPaginationOptions({ page: 2, limit: 20 });
 * // Returns: { page: 2, limit: 20 }
 */
function getPaginationOptions(params) {
  return queryParser.getPaginationOptions(params);
}

/**
 * Get filters from request parameters.
 *
 * This function extracts filter parameters from the request and formats
 * them for use in data filtering operations.
 *
 * Business Logic:
 * - Extracts filter parameters from request
 * - Formats filters for consistent processing
 * - Returns standardized filter object
 *
 * @param {Object} params - Request parameters containing filter info
 * @returns {Object} Filters object for data filtering
 */
function getFilters(params) {
  const base = queryParser.getFilters(params);
  // Extract free-text search query for filtering following results
  const q = (params?.query?.query || '').trim();
  if (q) {
    base.query = q;
  }
  return base;
}

/**
 * Get paginated following data.
 *
 * This function retrieves and formats a paginated list of following relationships
 * for a buyer, applying pagination logic and formatting the response data.
 *
 * Business Logic:
 * - Retrieves sellers and buyers that the buyer follows
 * - Formats all following objects
 * - Applies pagination logic to results
 * - Calculates pagination metadata
 * - Returns structured response with data and pagination info
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @param {Object} params - Request parameters including pagination and filters
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Items per page
 * @param {Object} params.filters - Filter parameters
 * @returns {Object} Paginated following data with metadata
 * @throws {NotFoundException} If buyer is not found
 */
async function listPaginatedFollowing(buyerId, params) {
  const { page, limit, filters } = params;
  
  // Step 1: Find sellers that this buyer follows
  // This retrieves all sellers with follow relationships for the buyer
  const sellers = await buyerRepository.findSellersFollowingByBuyer(buyerId);
  
  // Step 2: Find buyers that this buyer follows
  // This retrieves all buyers with follow relationships for the buyer
  const buyers = await buyerRepository.findBuyersFollowingByBuyer(buyerId);

  // Step 3: Get additional data for sellers (isLive and itemsCount)
  const sellerIds = sellers.map(seller => seller._id);
  
  // Check for active streams (isLive)
  const Stream = require('../../../models/Stream');
  const activeStreams = await Stream.find({
    seller: { $in: sellerIds },
    status: 'live'
  }).select('seller').lean();
  
  const sellerLiveStatus = {};
  activeStreams.forEach(stream => {
    sellerLiveStatus[stream.seller.toString()] = true;
  });

  // Count active products (itemsCount)
  const Product = require('../../../models/Product');
  const productCounts = await Product.aggregate([
    {
      $match: {
        seller: { $in: sellerIds },
        status: 'active',
        visibility: 'visible'
      }
    },
    {
      $group: {
        _id: '$seller',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const sellerItemCounts = {};
  productCounts.forEach(item => {
    sellerItemCounts[item._id.toString()] = item.count;
  });

  // Step 4: Combine and format following data
  // This merges seller and buyer following data into a single array
  let following = [
    ...sellers.map(seller => {
      const formattedSeller = formatFollowingSeller(seller, buyerId);
      if (formattedSeller) {
        const sellerIdStr = seller._id.toString();
        formattedSeller.isLive = sellerLiveStatus[sellerIdStr] || false;
        formattedSeller.itemsCount = sellerItemCounts[sellerIdStr] || 0;
      }
      return formattedSeller;
    }).filter(f => f !== null),
    ...buyers.map(buyer => formatFollowingBuyer(buyer, buyerId)).filter(f => f !== null)
  ];

  // Step 5: Apply optional search query filter before sorting/pagination
  if (filters?.query) {
    const ql = filters.query.toLowerCase();
    following = following.filter(item => {
      const name = (item?.name || '').toLowerCase();
      const storeName = (item?.storeName || '').toLowerCase();
      return name.includes(ql) || storeName.includes(ql);
    });
  }

  // Step 6: Sort by follow date (newest first)
  // This provides chronological ordering of following relationships
  following.sort((a, b) => new Date(b.followDate) - new Date(a.followDate));

  // Step 7: Apply pagination
  // This extracts the appropriate subset of data for the requested page
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

  // Get additional data for sellers (isLive and itemsCount)
  const sellerIds = sellers.map(seller => seller._id);
  
  // Check for active streams (isLive)
  const Stream = require('../../../models/Stream');
  const activeStreams = await Stream.find({
    seller: { $in: sellerIds },
    status: 'live'
  }).select('seller').lean();
  
  const sellerLiveStatus = {};
  activeStreams.forEach(stream => {
    sellerLiveStatus[stream.seller.toString()] = true;
  });

  // Count active products (itemsCount)
  const Product = require('../../../models/Product');
  const productCounts = await Product.aggregate([
    {
      $match: {
        seller: { $in: sellerIds },
        status: 'active',
        visibility: 'visible'
      }
    },
    {
      $group: {
        _id: '$seller',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const sellerItemCounts = {};
  productCounts.forEach(item => {
    sellerItemCounts[item._id.toString()] = item.count;
  });

  // Combine and format following data
  let following = [
    ...sellers.map(seller => {
      const formattedSeller = formatFollowingSeller(seller, buyerId);
      if (formattedSeller) {
        const sellerIdStr = seller._id.toString();
        formattedSeller.isLive = sellerLiveStatus[sellerIdStr] || false;
        formattedSeller.itemsCount = sellerItemCounts[sellerIdStr] || 0;
      }
      return formattedSeller;
    }).filter(f => f !== null),
    ...buyers.map(buyer => formatFollowingBuyer(buyer, buyerId)).filter(f => f !== null)
  ];

  // Apply optional search query filter
  if (filters?.query) {
    const ql = filters.query.toLowerCase();
    following = following.filter(item => {
      const name = (item?.name || '').toLowerCase();
      const storeName = (item?.storeName || '').toLowerCase();
      return name.includes(ql) || storeName.includes(ql);
    });
  }

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