const buyerRepository = require('../repositories/buyer.repository');
const getSellerReviewsValidator = require('../validators/getSellerReviews.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const queryParser = require('../../../utils/queryParser');

/**
 * Sort reviews based on the provided sort parameter
 * @param {Array} reviews - Array of reviews to sort
 * @param {string} sort - Sort parameter (recent, rating-high, rating-low)
 * @returns {Array} - Sorted reviews
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
 * Populate buyer details for reviews
 * @param {Array} reviews - Array of reviews
 * @returns {Array} - Reviews with populated buyer details
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
 * Build review statistics
 * @param {Array} reviews - Array of all reviews
 * @returns {Object} - Review statistics
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
 * Get pagination options from request parameters
 * @param {Object} req - Request object
 * @returns {Object} - Pagination options
 */
function getPaginationOptions(req) {
  // Delegate to queryParser utility for consistent pagination handling
  return queryParser.getPaginationOptions(req);
}

/**
 * Get filters from request parameters
 * @param {Object} req - Request object
 * @returns {Object} - Filters object
 */
function getFilters(req) {
  // Delegate to queryParser utility for consistent filter handling
  return queryParser.getFilters(req);
}

/**
 * Get paginated seller reviews
 * @param {string} sellerId - The seller ID
 * @param {Object} params - Request parameters including pagination and filters
 * @returns {Object} - Paginated seller reviews data
 */
async function listPaginatedSellerReviews(sellerId, params) {
  // Extract pagination and filter parameters
  const { page, limit, filters } = params;
  
  // Fetch seller data with reviews from repository
  const seller = await buyerRepository.findSellerWithReviews(sellerId);
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }

  // Get reviews array or empty array if no reviews exist
  const reviews = seller.reviews || [];
  
  // Sort reviews based on filter criteria
  const sortedReviews = sortReviews(reviews, filters.sort);
  
  // Calculate pagination indices
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const total = sortedReviews.length;
  
  // Extract paginated subset of reviews
  const paginatedReviews = sortedReviews.slice(startIndex, endIndex);
  
  // Populate buyer details for paginated reviews only
  const reviewsWithBuyers = await populateBuyerDetails(paginatedReviews);
  
  // Build stats from all reviews (not just paginated ones) for accurate statistics
  const stats = buildReviewStats(sortedReviews);
  
  // Calculate total number of pages
  const pages = Math.ceil(total / limit);

  // Return structured response with reviews, stats, and pagination info
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
 * Get seller reviews without pagination
 * @param {string} sellerId - The seller ID
 * @param {Object} filters - Filter parameters
 * @returns {Object} - Seller reviews data without pagination
 */
async function listSellerReviews(sellerId, filters) {
  // Fetch seller data with reviews from repository
  const seller = await buyerRepository.findSellerWithReviews(sellerId);
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }

  // Get reviews array or empty array if no reviews exist
  const reviews = seller.reviews || [];
  
  // Sort reviews based on filter criteria
  const sortedReviews = sortReviews(reviews, filters.sort);
  
  // Populate buyer details for all reviews
  const reviewsWithBuyers = await populateBuyerDetails(sortedReviews);
  
  // Build stats for all reviews
  const stats = buildReviewStats(sortedReviews);

  // Return structured response without pagination info
  return {
    data: {
      reviews: reviewsWithBuyers,
      stats
    },
    pagination: {}
  };
}

/**
 * Get seller reviews with pagination support
 * @param {string} sellerId - The seller ID
 * @param {Object} params - Request parameters
 * @returns {Object} - Seller reviews data
 */
async function getSellerReviews(sellerId, params) {
  // Validate input parameters using validator
  await getSellerReviewsValidator.validateGetSellerReviewsData(sellerId, params);

  // Extract pagination and filter options from request
  const pagination = getPaginationOptions(params);
  const filters = getFilters(params);

  // Add sort parameter to filters with default value
  filters.sort = params.sort || 'recent';

  let result;
  // Choose between paginated and non-paginated retrieval based on pagination settings
  if (pagination.enabled) {
    // Use paginated retrieval
    const paginationParams = { ...pagination, filters: filters };
    result = await listPaginatedSellerReviews(sellerId, paginationParams);
  } else {
    // Use non-paginated retrieval
    result = await listSellerReviews(sellerId, filters);
  }

  // Return only the data portion for consistency
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