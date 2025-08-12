const buyerRepository = require('../repositories/buyer.repository');
const { validateGetSellersToFollowData } = require('../validators/getSellersToFollow.validator');
const queryParser = require('../../../utils/queryParser');

/**
 * Build the base query for finding sellers to follow.
 * 
 * @param {Object} filters - Filter parameters
 * @param {string} filters.search - Search term for store name or business name
 * @param {string} filters.category - Category filter
 * @param {Array} filters.excludeSellerIds - Array of seller IDs to exclude
 * @returns {Object} MongoDB query object
 */
function buildQuery(filters) {
  let query = { isDisabled: false };

  // Add search filter if provided
  if (filters.search) {
    query.$or = [
      { storeName: { $regex: filters.search, $options: 'i' } },
      { businessName: { $regex: filters.search, $options: 'i' } }
    ];
  }

  // Add category filter if provided
  if (filters.category) {
    query['categories.name'] = { $regex: filters.category, $options: 'i' };
  }

  // Exclude sellers that the buyer is already following
  if (filters.excludeSellerIds && filters.excludeSellerIds.length > 0) {
    query._id = { $nin: filters.excludeSellerIds };
  }

  return query;
}

/**
 * Build sort options based on the sort parameter.
 * 
 * @param {string} sort - Sort criteria
 * @returns {Object} MongoDB sort options
 */
function buildSortOptions(sort) {
  switch (sort) {
    case 'rating':
      return { 'stats.averageRating': -1 };
    case 'followers':
      return { 'followers': -1 };
    case 'newest':
      return { createdAt: -1 };
    default:
      return { 'stats.averageRating': -1 };
  }
}

/**
 * Transform seller data for API response.
 * 
 * @param {Object} seller - Raw seller data from database
 * @returns {Object} Transformed seller data
 */
function transformSeller(seller) {
  return {
    _id: seller._id,
    storeName: seller.storeName || seller.businessName || "Shop",
    businessName: seller.businessName,
    aboutStore: seller.aboutStore,
    storeAvatar: seller.storeAvatar,
    categories: seller.categories,
    stats: {
      averageRating: seller.stats?.averageRating || 0,
      totalReviews: seller.stats?.totalReviews || 0
    },
    followerCount: seller.followers?.length || 0,
    isVerified: seller.isVerified,
    isFeatured: seller.isFeatured,
    createdAt: seller.createdAt
  };
}

/**
 * Extracts pagination options from the request query parameters.
 * @param {Object} req - Express request object
 * @returns {Object} - Contains pagination config: enabled (boolean), page (number), limit (number)
 */
function getPaginationOptions(req) {
  return queryParser.getPaginationOptions(req);
}

/**
 * Extracts filter parameters from the request query for sellers listing.
 * @param {Object} req - Express request object
 * @returns {Object} - Filters object to be passed to DB queries
 */
function getFilters(req) {
  const filters = {};
  
  if (req.query.search !== undefined) {
    filters.search = req.query.search;
  }
  
  if (req.query.category !== undefined) {
    filters.category = req.query.category;
  }
  
  if (req.query.sort !== undefined) {
    filters.sort = req.query.sort;
  }
  
  return filters;
}

/**
 * Retrieves all sellers to follow without pagination.
 * Useful for cases like exporting all sellers or simple listings.
 *
 * @param {string} buyerId - The buyer's ID
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} Formatted sellers data without pagination
 */
async function getSellersToFollow(buyerId, filters = {}) {
  // Get seller IDs that the buyer is already following
  let excludeSellerIds = [];
  if (buyerId) {
    excludeSellerIds = await buyerRepository.findFollowedSellerIds(buyerId);
  }

  // Build query and sort options
  const query = buildQuery({
    search: filters.search || '',
    category: filters.category || '',
    excludeSellerIds
  });
  const sortOptions = buildSortOptions(filters.sort || 'rating');

  // Get sellers from repository
  const sellers = await buyerRepository.findSellersToFollow({
    query,
    sortOptions,
    skip: 0,
    limit: 0, // No limit for unpaginated results
    shouldRandomize: false
  });

  // Transform seller data
  const transformedSellers = sellers.map(transformSeller);

  return {
    data: {
      sellers: transformedSellers
    },
    pagination: {} // No pagination info returned for full list
  };
}

/**
 * Prepare and validate parameters for paginated sellers retrieval.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {Object} params - Parameters for pagination and filtering
 * @param {number} params.page - Page number
 * @param {number} params.limit - Number of sellers per page
 * @param {Object} params.filters - Query filters
 * @returns {Object} Validated and prepared parameters
 */
async function preparePaginatedParams(buyerId, { page, limit, filters }) {
  const params = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    search: filters.search || '',
    category: filters.category || '',
    sort: filters.sort || 'rating',
    buyerId
  };

  await validateGetSellersToFollowData(params);
  return params;
}

/**
 * Get seller IDs that the buyer is already following.
 * 
 * @param {string} buyerId - The buyer's ID
 * @returns {Array} Array of seller IDs to exclude
 */
async function getExcludeSellerIds(buyerId) {
  if (!buyerId) {
    return [];
  }
  return await buyerRepository.findFollowedSellerIds(buyerId);
}

/**
 * Retrieve sellers from repository with pagination and randomization.
 * 
 * @param {Object} query - MongoDB query object
 * @param {Object} sortOptions - MongoDB sort options
 * @param {number} skip - Number of documents to skip
 * @param {number} limit - Number of documents to return
 * @param {boolean} shouldRandomize - Whether to apply randomization
 * @returns {Array} Array of seller documents
 */
async function retrieveSellersWithPagination({ query, sortOptions, skip, limit, shouldRandomize }) {
  const sellers = await buyerRepository.findSellersToFollow({
    query,
    sortOptions,
    skip,
    limit,
    shouldRandomize
  });

  // Shuffle sellers for additional randomization
  return [...sellers].sort(() => 0.5 - Math.random());
}

/**
 * Calculate pagination metadata.
 * 
 * @param {number} total - Total number of sellers
 * @param {number} limit - Number of sellers per page
 * @param {number} page - Current page number
 * @param {number} sellersCount - Number of sellers in current page
 * @param {boolean} shouldRandomize - Whether randomization was applied
 * @param {number} skip - Number of documents skipped
 * @returns {Object} Pagination metadata
 */
function calculatePaginationMetadata(total, limit, page, sellersCount, shouldRandomize, skip) {
  const totalPages = Math.ceil(total / limit);
  const hasMore = shouldRandomize 
    ? sellersCount < total 
    : skip + sellersCount < total;

  return {
    currentPage: page,
    totalPages,
    totalSellers: total,
    hasMore,
    hasPrevious: page > 1
  };
}

/**
 * Retrieves sellers to follow with pagination.
 * Returns seller data along with pagination metadata.
 *
 * @param {string} buyerId - The buyer's ID
 * @param {Object} params - Parameters for pagination and filtering
 * @param {number} params.page - Page number
 * @param {number} params.limit - Number of sellers per page
 * @param {Object} params.filters - Query filters
 * @returns {Promise<Object>} Formatted sellers data with pagination
 */
async function getPaginatedSellersToFollow(buyerId, { page, limit, filters }) {
  // Prepare and validate parameters
  const params = await preparePaginatedParams(buyerId, { page, limit, filters });

  // Get seller IDs to exclude
  const excludeSellerIds = await getExcludeSellerIds(buyerId);

  // Build query and sort options
  const query = buildQuery({
    search: filters.search || '',
    category: filters.category || '',
    excludeSellerIds
  });
  const sortOptions = buildSortOptions(filters.sort || 'rating');

  // Get total count and determine randomization
  const total = await buyerRepository.countSellersToFollow(query);
  const shouldRandomize = total > limit;
  const skip = (page - 1) * limit;

  // Retrieve and process sellers
  const shuffledSellers = await retrieveSellersWithPagination({
    query,
    sortOptions,
    skip,
    limit,
    shouldRandomize
  });

  // Transform seller data
  const transformedSellers = shuffledSellers.map(transformSeller);

  // Calculate pagination metadata
  const pagination = calculatePaginationMetadata(
    total, 
    limit, 
    page, 
    transformedSellers.length, 
    shouldRandomize, 
    skip
  );

  return {
    data: {
      sellers: transformedSellers
    },
    pagination
  };
}

module.exports = {
  getSellersToFollow,
  getPaginatedSellersToFollow,
  getPaginationOptions,
  getFilters
};
