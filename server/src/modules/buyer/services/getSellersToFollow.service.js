/**
 * Get Sellers To Follow Service
 *
 * This service handles the business logic for retrieving sellers that buyers can follow.
 * It provides functionality to:
 * - Build complex database queries with multiple filters
 * - Handle search functionality across store and business names
 * - Implement category-based filtering
 * - Exclude sellers that buyers are already following
 * - Support multiple sorting options (rating, followers, newest)
 * - Implement pagination with randomization for better user experience
 * - Transform seller data for consistent API responses
 *
 * The service ensures that:
 * - Only active (non-disabled) sellers are returned
 * - Buyers don't see sellers they're already following
 * - Search results are case-insensitive and flexible
 * - Pagination is accurate and efficient
 * - Randomization provides variety in results
 * - Data transformation is consistent across all responses
 *
 * @module getSellersToFollowService
 */

const buyerRepository = require('../repositories/buyer.repository');
const sellerRepository = require('../repositories/seller.repository');
const { validateGetSellersToFollowData } = require('../validators/getSellersToFollow.validator');
const queryParser = require('../../../utils/queryParser');

/**
 * Build the base query for finding sellers to follow.
 * 
 * This function constructs a comprehensive MongoDB query that filters sellers
 * based on multiple criteria. It ensures only relevant and available sellers
 * are returned to buyers.
 *
 * Query Components:
 * - Base filter: Only non-disabled sellers
 * - Search filter: Case-insensitive search in store/business names
 * - Category filter: Filter by seller categories
 * - Exclusion filter: Exclude sellers buyer already follows
 *
 * @param {Object} filters - Filter parameters object
 * @param {string} filters.search - Search term for store name or business name
 * @param {string} filters.category - Category filter for seller categorization
 * @param {Array} filters.excludeSellerIds - Array of seller IDs to exclude (already followed)
 * @returns {Object} MongoDB query object ready for database execution
 */
function buildQuery(filters) {
  // Start with base query - only active sellers
  let query = { isDisabled: false };

  // Add search filter if provided
  // Search across both storeName and businessName fields
  if (filters.search) {
    query.$or = [
      { storeName: { $regex: filters.search, $options: 'i' } }, // Case-insensitive search in store name
      { businessName: { $regex: filters.search, $options: 'i' } } // Case-insensitive search in business name
    ];
  }

  // Add category filter if provided
  // Search within seller's categories array
  if (filters.category) {
    query['categories.name'] = { $regex: filters.category, $options: 'i' };
  }

  // Exclude sellers that the buyer is already following
  // This prevents showing already-followed sellers in recommendations
  if (filters.excludeSellerIds && filters.excludeSellerIds.length > 0) {
    query._id = { $nin: filters.excludeSellerIds };
  }

  return query;
}

/**
 * Build sort options based on the sort parameter.
 * 
 * This function determines the appropriate MongoDB sort criteria based on
 * the requested sort option. It provides multiple sorting strategies for
 * different use cases.
 *
 * Sort Options:
 * - 'rating': Sort by average rating (highest first)
 * - 'followers': Sort by follower count (most popular first)
 * - 'newest': Sort by creation date (newest first)
 * - Default: Sort by average rating
 *
 * @param {string} sort - Sort criteria ('rating', 'followers', 'newest')
 * @returns {Object} MongoDB sort options object
 */
function buildSortOptions(sort) {
  switch (sort) {
    case 'rating':
      return { 'stats.averageRating': -1 }; // Highest rating first
    case 'followers':
      return { 'followers': -1 }; // Most followers first
    case 'newest':
      return { createdAt: -1 }; // Newest sellers first
    default:
      return { 'stats.averageRating': -1 }; // Default to rating sort
  }
}

/**
 * Transform seller data for API response.
 * 
 * This function converts raw seller data from the database into a
 * consistent, API-friendly format. It handles missing data gracefully
 * and ensures all required fields are present.
 *
 * Data Transformation:
 * - Normalizes store names (fallback to business name or "Shop")
 * - Ensures stats object exists with defaults
 * - Calculates follower count from followers array
 * - Maintains consistent data structure across responses
 *
 * @param {Object} seller - Raw seller data from database
 * @returns {Object} Transformed seller data ready for API response
 */
function transformSeller(seller) {
  return {
    _id: seller._id,
    storeName: seller.storeName || seller.businessName || "Shop", // Fallback chain for store name
    businessName: seller.businessName,
    aboutStore: seller.aboutStore,
    storeAvatar: seller.storeAvatar,
    categories: seller.categories,
    stats: {
      averageRating: seller.stats?.averageRating || 0, // Default to 0 if no stats
      totalReviews: seller.stats?.totalReviews || 0
    },
    followerCount: seller.followers?.length || 0, // Calculate follower count
    isVerified: seller.isVerified,
    isFeatured: seller.isFeatured,
    createdAt: seller.createdAt
  };
}

/**
 * Extracts pagination options from the request query parameters.
 * 
 * This function uses the queryParser utility to extract and validate
 * pagination parameters from the HTTP request query string.
 *
 * @param {Object} req - Express request object containing query parameters
 * @returns {Object} Pagination configuration object
 *   - enabled: {boolean} - Whether pagination is enabled
 *   - page: {number} - Current page number
 *   - limit: {number} - Number of items per page
 */
function getPaginationOptions(req) {
  return queryParser.getPaginationOptions(req);
}

/**
 * Extracts filter parameters from the request query for sellers listing.
 * 
 * This function processes the HTTP request query parameters and extracts
 * relevant filter values for seller retrieval. It handles multiple filter types
 * and provides sensible defaults.
 *
 * Filter Types:
 * - search: Text search in store/business names
 * - category: Category-based filtering
 * - sort: Sorting criteria
 *
 * @param {Object} req - Express request object containing query parameters
 * @returns {Object} Filters object to be passed to database queries
 *   - search: {string} - Search term for store/business names
 *   - category: {string} - Category filter
 *   - sort: {string} - Sort criteria
 */
function getFilters(req) {
  const filters = {};
  
  // Extract search filter if provided
  if (req.query.search !== undefined) {
    filters.search = req.query.search;
  }
  
  // Extract category filter if provided
  if (req.query.category !== undefined) {
    filters.category = req.query.category;
  }
  
  // Extract sort filter if provided
  if (req.query.sort !== undefined) {
    filters.sort = req.query.sort;
  }
  
  return filters;
}

/**
 * Retrieves all sellers to follow without pagination.
 * 
 * This function is useful for cases like exporting all sellers or simple listings
 * where pagination is not required. It processes sellers with exclusion logic
 * and applies all relevant filters.
 *
 * Business Logic:
 * - Gets seller IDs that buyer is already following
 * - Builds comprehensive query with all filters
 * - Retrieves all matching sellers (no pagination limits)
 * - Transforms seller data for consistent response format
 * - Returns complete seller list without pagination metadata
 *
 * @param {string} buyerId - The buyer's ID to get sellers for
 * @param {Object} filters - Query filters object
 * @param {string} filters.search - Optional search term
 * @param {string} filters.category - Optional category filter
 * @param {string} filters.sort - Optional sort criteria
 * @returns {Promise<Object>} Formatted sellers data without pagination
 *   - data: {Object} - Contains sellers array
 *   - pagination: {Object} - Empty pagination object
 */
async function getSellersToFollow(buyerId, filters = {}) {
  // Step 1: Get seller IDs that the buyer is already following
  // This prevents showing already-followed sellers
  let excludeSellerIds = [];
  if (buyerId) {
    excludeSellerIds = await sellerRepository.findFollowedSellerIds(buyerId);
  }

  // Step 2: Build query and sort options
  // Combine all filters into a comprehensive database query
  const query = buildQuery({
    search: filters.search || '',
    category: filters.category || '',
    excludeSellerIds
  });
  const sortOptions = buildSortOptions(filters.sort || 'rating');

  // Step 3: Get sellers from repository
  // Retrieve all matching sellers without pagination limits
      const sellers = await sellerRepository.findSellersToFollow({
    query,
    sortOptions,
    skip: 0,
    limit: 0 // No limit for unpaginated results
  });

  // Step 4: Transform seller data
  // Convert raw database data to API-friendly format
  const transformedSellers = sellers.map(transformSeller);

  // Step 5: Return formatted response
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
 * This function validates and prepares all parameters needed for paginated
 * seller retrieval. It ensures data integrity and provides sensible defaults.
 *
 * Parameter Processing:
 * - Converts string parameters to numbers where needed
 * - Provides default values for missing parameters
 * - Validates parameters using the validator
 * - Ensures all required fields are present
 *
 * @param {string} buyerId - The buyer's ID
 * @param {Object} params - Parameters for pagination and filtering
 * @param {number} params.page - Page number
 * @param {number} params.limit - Number of sellers per page
 * @param {Object} params.filters - Query filters object
 * @returns {Object} Validated and prepared parameters ready for processing
 */
async function preparePaginatedParams(buyerId, { page, limit, filters }) {
  const params = {
    page: parseInt(page) || 1, // Default to page 1
    limit: parseInt(limit) || 10, // Default to 10 items per page
    search: filters.search || '',
    category: filters.category || '',
    sort: filters.sort || 'rating', // Default to rating sort
    buyerId
  };

  // Validate parameters using the validator
  await validateGetSellersToFollowData(params);
  return params;
}

/**
 * Get seller IDs that the buyer is already following.
 * 
 * This function retrieves the list of seller IDs that the buyer is already
 * following. These IDs are used to exclude already-followed sellers from
 * the recommendations.
 *
 * @param {string} buyerId - The buyer's ID to get followed sellers for
 * @returns {Array} Array of seller IDs to exclude from recommendations
 */
async function getExcludeSellerIds(buyerId) {
      return await sellerRepository.findFollowedSellerIds(buyerId);
}

/**
 * Retrieve sellers from repository with pagination and randomization.
 * 
 * This function handles the complex logic of retrieving sellers with
 * pagination and optional randomization. It provides variety in results
 * while maintaining performance.
 *
 * Randomization Strategy:
 * - Applies randomization when total sellers exceed the limit
 * - Uses random skip values for database-level randomization
 * - Applies additional client-side shuffling for variety
 * - Ensures consistent results within the same request
 *
 * @param {Object} query - MongoDB query object
 * @param {Object} sortOptions - MongoDB sort options
 * @param {number} skip - Number of documents to skip
 * @param {number} limit - Number of documents to return
 * @param {boolean} shouldRandomize - Whether to apply randomization
 * @returns {Array} Array of seller documents with optional randomization
 */
async function retrieveSellersWithPagination({ query, sortOptions, skip, limit, shouldRandomize }) {
  let sellers;
  
  if (shouldRandomize) {
    // Step 1: Calculate randomization values
    // Get total count to determine randomization range
    const total = await sellerRepository.countSellersToFollow(query);
    const maxSkip = total - limit; // Maximum skip value for randomization
    const randomSkip = Math.floor(Math.random() * (maxSkip + 1)); // Random skip value
    
    // Step 2: Retrieve sellers with randomization
          sellers = await sellerRepository.findSellersToFollowRandomized(query, limit, randomSkip);
  } else {
    // Step 3: Retrieve sellers with standard pagination
          sellers = await sellerRepository.findSellersToFollow({
      query,
      sortOptions,
      skip,
      limit
    });
  }

  // Step 4: Ensure sellers is an array
  // Handle edge cases where repository might return null/undefined
  if (!sellers || !Array.isArray(sellers)) {
    sellers = [];
  }

  // Step 5: Apply additional client-side shuffling for variety
  // This provides extra randomization for better user experience
  return [...sellers].sort(() => 0.5 - Math.random());
}

/**
 * Calculate pagination metadata.
 * 
 * This function computes pagination metadata including total pages,
 * hasMore flag, and other pagination-related information. It handles
 * both standard pagination and randomized pagination scenarios.
 *
 * Pagination Logic:
 * - Calculates total pages based on total items and limit
 * - Determines hasMore flag based on pagination type
 * - Handles edge cases for first/last pages
 * - Provides accurate pagination information
 *
 * @param {number} total - Total number of sellers
 * @param {number} limit - Number of sellers per page
 * @param {number} page - Current page number
 * @param {number} sellersCount - Number of sellers in current page
 * @param {boolean} shouldRandomize - Whether randomization was applied
 * @param {number} skip - Number of documents skipped
 * @returns {Object} Pagination metadata object
 *   - currentPage: {number} - Current page number
 *   - totalPages: {number} - Total number of pages
 *   - totalSellers: {number} - Total number of sellers
 *   - hasMore: {boolean} - Whether there are more pages
 *   - hasPrevious: {boolean} - Whether there are previous pages
 */
function calculatePaginationMetadata(total, limit, page, sellersCount, shouldRandomize, skip) {
  const totalPages = Math.ceil(total / limit);
  
  // Determine hasMore based on pagination type
  const hasMore = shouldRandomize 
    ? sellersCount < total // For randomized: check if we got fewer items than total
    : skip + sellersCount < total; // For standard: check if we haven't reached the end

  return {
    currentPage: page,
    totalPages,
    totalSellers: total,
    hasMore,
    hasPrevious: page > 1 // True if not on first page
  };
}

/**
 * Retrieves sellers to follow with pagination - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * paginated seller retrieval process. It handles parameter validation,
 * query building, pagination, and randomization for optimal user experience.
 *
 * Business Logic Flow:
 * 1. Prepares and validates pagination parameters
 * 2. Gets seller IDs to exclude (already followed)
 * 3. Builds comprehensive database query with filters
 * 4. Determines whether to apply randomization
 * 5. Retrieves sellers with pagination and optional randomization
 * 6. Transforms seller data for consistent API responses
 * 7. Calculates accurate pagination metadata
 * 8. Returns formatted response with sellers and pagination info
 *
 * Randomization Strategy:
 * - Applies randomization when total sellers exceed the page limit
 * - Provides variety in results while maintaining performance
 * - Ensures users see different sellers on each page load
 * - Maintains pagination accuracy for navigation
 *
 * @param {string} buyerId - The buyer's ID to get sellers for
 * @param {Object} params - Parameters for pagination and filtering
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.limit - Number of sellers per page
 * @param {Object} params.filters - Query filters object
 * @param {string} params.filters.search - Optional search term
 * @param {string} params.filters.category - Optional category filter
 * @param {string} params.filters.sort - Optional sort criteria
 * @returns {Promise<Object>} Formatted sellers data with pagination
 *   - data: {Object} - Contains sellers array
 *   - pagination: {Object} - Pagination metadata
 *     - currentPage: {number} - Current page number
 *     - totalPages: {number} - Total number of pages
 *     - totalSellers: {number} - Total number of sellers
 *     - hasMore: {boolean} - Whether there are more pages
 *     - hasPrevious: {boolean} - Whether there are previous pages
 * @throws {ValidationError} If pagination parameters are invalid
 * @throws {Error} If database operations fail
 *
 * @example
 * // Get paginated sellers with search
 * const result = await getPaginatedSellersToFollow('507f1f77bcf86cd799439011', {
 *   page: 1,
 *   limit: 10,
 *   filters: {
 *     search: 'electronics',
 *     category: 'tech',
 *     sort: 'rating'
 *   }
 * });
 * // Returns: { data: { sellers: [...] }, pagination: { currentPage: 1, ... } }
 */
async function getPaginatedSellersToFollow(buyerId, { page, limit, filters }) {
  // Step 1: Prepare and validate parameters
  // Ensure all parameters are valid and have sensible defaults
  const params = await preparePaginatedParams(buyerId, { page, limit, filters });

  // Step 2: Get seller IDs to exclude
  // Retrieve list of sellers the buyer is already following
  const excludeSellerIds = await getExcludeSellerIds(buyerId);

  // Step 3: Build query and sort options
  // Construct comprehensive database query with all filters
  const query = buildQuery({
    search: filters.search || '',
    category: filters.category || '',
    excludeSellerIds
  });
  const sortOptions = buildSortOptions(filters.sort || 'rating');

  // Step 4: Get total count and determine randomization
  // Calculate total sellers and decide whether to apply randomization
      const total = await sellerRepository.countSellersToFollow(query);
  const shouldRandomize = total > limit; // Randomize if we have more sellers than the limit
  const skip = (page - 1) * limit; // Calculate skip value for pagination

  // Step 5: Retrieve and process sellers
  // Get sellers with pagination and optional randomization
  const shuffledSellers = await retrieveSellersWithPagination({
    query,
    sortOptions,
    skip,
    limit,
    shouldRandomize
  });

  // Step 6: Transform seller data
  // Convert raw database data to API-friendly format
  const transformedSellers = shuffledSellers.map(transformSeller);

  // Step 7: Calculate pagination metadata
  // Compute accurate pagination information
  const pagination = calculatePaginationMetadata(
    total, 
    limit, 
    page, 
    transformedSellers.length, 
    shouldRandomize, 
    skip
  );

  // Step 8: Return formatted response
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
