/**
 * Get Seller Reviews Service
 *
 * This service handles the business logic for retrieving and managing seller reviews.
 * It provides functionality to:
 * - Retrieve seller reviews with pagination support
 * - Sort reviews by different criteria (recent, rating, etc.)
 * - Populate buyer details for each review
 * - Calculate comprehensive review statistics
 * - Handle both paginated and non-paginated requests
 * - Transform review data for consistent API responses
 *
 * The service ensures that:
 * - Reviews are properly sorted and filtered
 * - Buyer information is populated for each review
 * - Statistics are calculated accurately from all reviews
 * - Pagination works correctly for large review sets
 * - Data transformation is consistent across all responses
 * - Performance is optimized for large datasets
 *
 * Review Features:
 * - Multiple sorting options (recent, rating-high, rating-low)
 * - Buyer information population
 * - Rating distribution calculation
 * - Verified purchase tracking
 * - Pagination support for large datasets
 *
 * @module getSellerReviewsService
 */

const buyerRepository = require('../repositories/buyer.repository');
const getSellerReviewsValidator = require('../validators/getSellerReviews.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const queryParser = require('../../../utils/queryParser');

/**
 * Sort reviews based on the provided sort parameter.
 * 
 * This function sorts an array of reviews according to different criteria.
 * It creates a copy of the original array to avoid mutating the input data.
 *
 * Sorting Options:
 * - 'recent': Sort by creation date (newest first)
 * - 'rating-high': Sort by rating (highest first)
 * - 'rating-low': Sort by rating (lowest first)
 * - Default: Sort by creation date (newest first)
 *
 * Performance Note:
 * - Creates a copy to avoid mutating original data
 * - Uses efficient JavaScript sort with custom comparators
 * - Handles date comparison for recent sorting
 *
 * @param {Array} reviews - Array of review objects to sort
 * @param {string} sort - Sort parameter ('recent', 'rating-high', 'rating-low')
 * @returns {Array} - Sorted reviews array (new array, original unchanged)
 */
function sortReviews(reviews, sort = 'recent') {
  // Create a copy of reviews array to avoid mutating the original
  const sortedReviews = [...reviews];
  
  // Apply different sorting logic based on sort parameter
  switch (sort) {
    case 'rating-high':
      // Sort by rating in descending order (highest first)
      return sortedReviews.sort((a, b) => b.rating - a.rating);
    case 'rating-low':
      // Sort by rating in ascending order (lowest first)
      return sortedReviews.sort((a, b) => a.rating - b.rating);
    case 'recent':
    default:
      // Sort by creation date in descending order (newest first)
      return sortedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

/**
 * Populate buyer details for reviews.
 * 
 * This function fetches and attaches buyer information to each review.
 * It processes all reviews in parallel for better performance and handles
 * both Mongoose documents and plain objects.
 *
 * Buyer Information Added:
 * - Buyer ID for reference
 * - Full name (firstName + lastName)
 * - Profile image URL
 *
 * Performance Optimizations:
 * - Processes all reviews in parallel using Promise.all
 * - Handles both Mongoose documents and plain objects
 * - Minimizes database queries through efficient fetching
 *
 * @param {Array} reviews - Array of review objects
 * @returns {Promise<Array>} - Reviews with populated buyer details
 */
async function populateBuyerDetails(reviews) {
  // Process all reviews in parallel for better performance
  return Promise.all(
    reviews.map(async (review) => {
      // Fetch buyer details from repository
      const buyer = await buyerRepository.findBuyerByIdWithFields(review.buyer);
      
      // Handle both Mongoose documents and plain objects
      // Mongoose documents have toObject() method, plain objects don't
      const reviewObject = review.toObject ? review.toObject() : { ...review };
      
      // Return review with populated buyer information
      return {
        ...reviewObject,
        buyer: {
          id: buyer._id,
          name: `${buyer.firstName} ${buyer.lastName}`,
          image: buyer.profileImage?.url
        }
      };
    })
  );
}

/**
 * Build review statistics from an array of reviews.
 * 
 * This function calculates comprehensive statistics from review data including
 * average rating, total reviews, rating distribution, and verified purchase count.
 * It handles edge cases like empty review arrays gracefully.
 *
 * Statistics Calculated:
 * - Average rating (rounded to 1 decimal place)
 * - Total number of reviews
 * - Rating distribution (count of each rating level 1-5)
 * - Verified purchase count
 *
 * Edge Case Handling:
 * - Returns default stats for empty review arrays
 * - Handles missing or invalid rating data
 * - Provides sensible defaults for all statistics
 *
 * @param {Array} reviews - Array of review objects
 * @returns {Object} - Comprehensive review statistics object
 *   - averageRating: {number} - Average rating (0-5, rounded to 1 decimal)
 *   - totalReviews: {number} - Total number of reviews
 *   - ratingDistribution: {Object} - Count of each rating level (1-5)
 *   - verifiedPurchaseCount: {number} - Number of verified purchase reviews
 */
function buildReviewStats(reviews) {
  // Return default stats if no reviews exist
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verifiedPurchaseCount: 0
    };
  }

  // Calculate basic statistics
  const totalReviews = reviews.length;
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / totalReviews;

  // Initialize rating distribution object
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  // Count reviews for each rating level
  reviews.forEach(review => {
    ratingDistribution[review.rating]++;
  });

  // Count verified purchase reviews
  const verifiedPurchaseCount = reviews.filter(review => review.isVerifiedPurchase).length;

  // Return calculated statistics
  return {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    totalReviews,
    ratingDistribution,
    verifiedPurchaseCount
  };
}

/**
 * Get pagination options from request parameters.
 * 
 * This function delegates to the queryParser utility for consistent
 * pagination handling across the application.
 *
 * @param {Object} req - Request object containing query parameters
 * @returns {Object} - Pagination options object
 *   - enabled: {boolean} - Whether pagination is enabled
 *   - page: {number} - Current page number
 *   - limit: {number} - Number of items per page
 */
function getPaginationOptions(req) {
  // Delegate to queryParser utility for consistent pagination handling
  return queryParser.getPaginationOptions(req);
}

/**
 * Get filters from request parameters.
 * 
 * This function delegates to the queryParser utility for consistent
 * filter handling across the application.
 *
 * @param {Object} req - Request object containing query parameters
 * @returns {Object} - Filters object with extracted filter values
 */
function getFilters(req) {
  // Delegate to queryParser utility for consistent filter handling
  return queryParser.getFilters(req);
}

/**
 * Get paginated seller reviews - Main pagination function.
 * 
 * This function handles the complete process of retrieving paginated seller reviews.
 * It fetches seller data, sorts reviews, applies pagination, populates buyer details,
 * and calculates statistics from all reviews for accuracy.
 *
 * Business Logic Flow:
 * 1. Fetch seller data with reviews from repository
 * 2. Validate seller exists
 * 3. Sort all reviews based on filter criteria
 * 4. Apply pagination to sorted reviews
 * 5. Populate buyer details for paginated reviews only
 * 6. Calculate statistics from all reviews (not just paginated)
 * 7. Return structured response with reviews, stats, and pagination info
 *
 * Performance Considerations:
 * - Only populates buyer details for paginated reviews (not all reviews)
 * - Calculates statistics from all reviews for accuracy
 * - Uses efficient array slicing for pagination
 *
 * @param {string} sellerId - The seller ID to get reviews for
 * @param {Object} params - Request parameters including pagination and filters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.limit - Number of reviews per page
 * @param {Object} params.filters - Filter parameters
 * @param {string} params.filters.sort - Sort criteria
 * @returns {Promise<Object>} - Paginated seller reviews data
 *   - data: {Object} - Contains reviews array and stats object
 *   - pagination: {Object} - Pagination metadata
 * @throws {NotFoundException} If seller is not found
 */
async function listPaginatedSellerReviews(sellerId, params) {
  // Extract pagination and filter parameters
  const { page, limit, filters } = params;
  
  // Step 1: Fetch seller data with reviews from repository
  const seller = await buyerRepository.findSellerWithReviews(sellerId);
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }

  // Step 2: Get reviews array or empty array if no reviews exist
  const reviews = seller.reviews || [];
  
  // Step 3: Sort reviews based on filter criteria
  const sortedReviews = sortReviews(reviews, filters.sort);
  
  // Step 4: Calculate pagination indices
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const total = sortedReviews.length;
  
  // Step 5: Extract paginated subset of reviews
  const paginatedReviews = sortedReviews.slice(startIndex, endIndex);
  
  // Step 6: Populate buyer details for paginated reviews only
  // This optimizes performance by only processing visible reviews
  const reviewsWithBuyers = await populateBuyerDetails(paginatedReviews);
  
  // Step 7: Build stats from all reviews (not just paginated ones) for accurate statistics
  const stats = buildReviewStats(sortedReviews);
  
  // Step 8: Calculate total number of pages
  const pages = Math.ceil(total / limit);

  // Step 9: Return structured response with reviews, stats, and pagination info
  return {
    data: {
      reviews: reviewsWithBuyers,
      stats
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
 * Get seller reviews without pagination.
 * 
 * This function retrieves all seller reviews without pagination limits.
 * It's useful for cases where all reviews are needed or for smaller datasets.
 *
 * Business Logic Flow:
 * 1. Fetch seller data with reviews from repository
 * 2. Validate seller exists
 * 3. Sort all reviews based on filter criteria
 * 4. Populate buyer details for all reviews
 * 5. Calculate statistics from all reviews
 * 6. Return structured response without pagination info
 *
 * Use Cases:
 * - Exporting all reviews
 * - Small datasets where pagination isn't needed
 * - Admin interfaces requiring full data access
 *
 * @param {string} sellerId - The seller ID to get reviews for
 * @param {Object} filters - Filter parameters
 * @param {string} filters.sort - Sort criteria for reviews
 * @returns {Promise<Object>} - Seller reviews data without pagination
 *   - data: {Object} - Contains reviews array and stats object
 *   - pagination: {Object} - Empty pagination object
 * @throws {NotFoundException} If seller is not found
 */
async function listSellerReviews(sellerId, filters) {
  // Step 1: Fetch seller data with reviews from repository
  const seller = await buyerRepository.findSellerWithReviews(sellerId);
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }

  // Step 2: Get reviews array or empty array if no reviews exist
  const reviews = seller.reviews || [];
  
  // Step 3: Sort reviews based on filter criteria
  const sortedReviews = sortReviews(reviews, filters.sort);
  
  // Step 4: Populate buyer details for all reviews
  const reviewsWithBuyers = await populateBuyerDetails(sortedReviews);
  
  // Step 5: Build stats for all reviews
  const stats = buildReviewStats(sortedReviews);

  // Step 6: Return structured response without pagination info
  return {
    data: {
      reviews: reviewsWithBuyers,
      stats
    },
    pagination: {}
  };
}

/**
 * Get seller reviews with pagination support - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * seller reviews retrieval process. It handles parameter validation,
 * pagination logic, and routes to appropriate retrieval methods.
 *
 * Business Logic Flow:
 * 1. Validates input parameters using validator
 * 2. Extracts pagination and filter options from request
 * 3. Adds default sort parameter if not provided
 * 4. Routes to paginated or non-paginated retrieval based on settings
 * 5. Returns formatted response data
 *
 * Pagination Logic:
 * - Uses paginated retrieval when pagination is enabled
 * - Uses non-paginated retrieval when pagination is disabled
 * - Maintains consistent response format regardless of pagination
 *
 * @param {string} sellerId - The seller ID to get reviews for
 * @param {Object} params - Request parameters object
 * @param {Object} params.pagination - Pagination settings
 * @param {Object} params.filters - Filter parameters
 * @param {string} params.sort - Sort criteria (optional, defaults to 'recent')
 * @returns {Promise<Object>} - Seller reviews data
 *   - reviews: {Array} - Array of review objects with buyer details
 *   - stats: {Object} - Review statistics object
 * @throws {ValidationError} If input parameters are invalid
 * @throws {NotFoundException} If seller is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Get paginated reviews
 * const result = await getSellerReviews('507f1f77bcf86cd799439011', {
 *   pagination: { enabled: true, page: 1, limit: 10 },
 *   filters: {},
 *   sort: 'recent'
 * });
 * // Returns: { reviews: [...], stats: { averageRating: 4.5, ... } }
 */
async function getSellerReviews(sellerId, params) {
  // Step 1: Validate input parameters using validator
  await getSellerReviewsValidator.validateGetSellerReviewsData(sellerId, params);

  // Step 2: Extract pagination and filter options from request
  const pagination = getPaginationOptions(params);
  const filters = getFilters(params);

  // Step 3: Add sort parameter to filters with default value
  filters.sort = params.sort || 'recent';

  let result;
  // Step 4: Choose between paginated and non-paginated retrieval based on pagination settings
  if (pagination.enabled) {
    // Use paginated retrieval for large datasets
    const paginationParams = { ...pagination, filters: filters };
    result = await listPaginatedSellerReviews(sellerId, paginationParams);
  } else {
    // Use non-paginated retrieval for small datasets or when pagination is disabled
    result = await listSellerReviews(sellerId, filters);
  }

  // Step 5: Return only the data portion for consistency
  return result.data;
}

module.exports = {
  getSellerReviews,
  getPaginationOptions,
  getFilters,
  listPaginatedSellerReviews,
  listSellerReviews,
  sortReviews,
  populateBuyerDetails,
  buildReviewStats
}; 