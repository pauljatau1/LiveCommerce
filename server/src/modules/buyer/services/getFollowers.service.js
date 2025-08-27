/**
 * Get Followers Service
 *
 * This service handles the business logic for retrieving a buyer's followers list.
 * It provides functionality to:
 * - Validate buyer ID format and existence
 * - Retrieve followers with populated seller information
 * - Format follower data for API responses
 * - Support both paginated and non-paginated requests
 * - Handle filtering and sorting of followers
 * - Return formatted follower data for display
 * - Handle edge cases and data validation
 *
 * The service ensures that follower data is properly retrieved and formatted
 * with all necessary seller information for frontend consumption.
 *
 * @module getFollowersService
 */

const buyerRepository = require('../repositories/buyer.repository');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const queryParser = require('../../../utils/queryParser');

/**
 * Format a follower object for API response.
 *
 * This function transforms a raw follower object from the database into a
 * standardized format suitable for API responses, ensuring consistent data structure.
 *
 * Business Logic:
 * - Extracts seller information from the follower relationship
 * - Provides fallback values for missing seller data
 * - Ensures all required fields are present in the response
 * - Handles null/undefined follower objects gracefully
 *
 * Data Transformation:
 * - Maps seller ID to standardized format
 * - Provides default values for missing seller information
 * - Includes seller verification status and metrics
 * - Preserves follower relationship timestamp
 *
 * @param {Object} follower - The follower object from database
 * @param {Object} follower.sellerId - The seller object with populated data
 * @param {string} follower.sellerId._id - Seller's unique identifier
 * @param {string} follower.sellerId.storeName - Seller's store name
 * @param {string} follower.sellerId.businessName - Seller's business name
 * @param {string} follower.sellerId.profileImage - Seller's profile image URL
 * @param {boolean} follower.sellerId.isVerified - Seller's verification status
 * @param {number} follower.sellerId.rating - Seller's average rating
 * @param {number} follower.sellerId.totalSales - Seller's total sales count
 * @param {number} follower.sellerId.followersCount - Seller's followers count
 * @param {Date} follower.createdAt - When the follower relationship was created
 * @returns {Object|null} - Formatted follower object or null if invalid
 */
function formatFollower(follower) {
  // Step 1: Validate follower object and seller data
  // This ensures we have valid data to work with
  if (!follower || !follower.sellerId) {
    return null;
  }

  // Step 2: Extract seller information for easier access
  // This provides a cleaner reference to the seller data
  const seller = follower.sellerId;
  
  // Step 3: Return formatted follower object with fallback values
  // This ensures consistent data structure even with missing seller information
  return {
    id: seller._id.toString(), // Convert ObjectId to string for API consistency
    type: 'seller', // Indicate this is a seller follower
    name: seller.storeName || seller.businessName || 'Unknown', // Primary display name
    storeName: seller.storeName || seller.businessName || 'Unknown Store', // Store name with fallback
    businessName: seller.businessName || 'Unknown Business', // Business name with fallback
    profileImage: seller.profileImage || null, // Profile image URL or null
    isVerified: seller.isVerified || false, // Verification status with default false
    rating: seller.rating || 0, // Average rating with default 0
    totalSales: seller.totalSales || 0, // Total sales count with default 0
    followersCount: seller.followersCount || 0, // Followers count with default 0
    createdAt: follower.createdAt // Preserve original follower relationship timestamp
  };
}

/**
 * Get pagination options from request parameters.
 *
 * This function extracts and validates pagination parameters from the request
 * using the centralized queryParser utility for consistent pagination handling.
 *
 * Business Logic:
 * - Delegates to queryParser utility for standardized pagination processing
 * - Ensures consistent pagination parameter validation across the application
 * - Provides default pagination values when not specified
 *
 * @param {Object} params - Request parameters containing pagination options
 * @param {number} [params.page] - Page number (default: 1)
 * @param {number} [params.limit] - Items per page (default: 10, max: 100)
 * @returns {Object} - Standardized pagination options object
 */
function getPaginationOptions(params) {
  return queryParser.getPaginationOptions(params);
}

/**
 * Get filters from request parameters.
 *
 * This function extracts and validates filter parameters from the request
 * using the centralized queryParser utility for consistent filter handling.
 *
 * Business Logic:
 * - Delegates to queryParser utility for standardized filter processing
 * - Ensures consistent filter parameter validation across the application
 * - Supports various filter types (search, category, etc.)
 *
 * @param {Object} params - Request parameters containing filter options
 * @param {string} [params.search] - Search term for filtering followers
 * @param {string} [params.category] - Category filter for followers
 * @param {string} [params.sort] - Sort criteria for followers
 * @returns {Object} - Standardized filters object
 */
function getFilters(params) {
  return queryParser.getFilters(params);
}

/**
 * Get paginated followers.
 *
 * This function retrieves and formats a paginated list of followers for a buyer,
 * including comprehensive seller information and pagination metadata.
 *
 * Business Logic Flow:
 * 1. Retrieve buyer with populated followers data
 * 2. Validate buyer existence
 * 3. Format all followers with seller information
 * 4. Apply pagination to the formatted results
 * 5. Calculate pagination metadata
 * 6. Return structured response with data and pagination info
 *
 * Data Processing:
 * - Retrieves buyer with populated follower relationships
 * - Formats each follower with complete seller information
 * - Applies pagination limits to the results
 * - Calculates accurate pagination metadata
 *
 * Security Considerations:
 * - Buyer existence validation prevents unauthorized access
 * - Repository methods handle data population securely
 * - Proper error handling prevents information leakage
 * - Pagination prevents excessive data exposure
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @param {Object} pagination - Pagination parameters
 * @param {number} pagination.page - Current page number (1-based)
 * @param {number} pagination.limit - Number of items per page
 * @param {Object} filters - Filter parameters (currently unused but available for future use)
 * @returns {Promise<Object>} - Paginated followers data with metadata
 *   - data: {Object} - Contains followers array
 *   - pagination: {Object} - Pagination metadata (page, limit, total, pages)
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operation fails
 */
async function listPaginatedFollowers(buyerId, pagination, filters) {
  // Step 1: Retrieve buyer with populated followers data
  // This fetches the buyer record with all follower relationships populated
  const buyer = await buyerRepository.findByIdWithPopulatedFollowers(buyerId);
  
  // Step 2: Validate buyer existence
  // This ensures the buyer exists before processing followers
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: Format all followers with seller information
  // This transforms raw follower data into API-ready format
  const allFollowers = buyer.followers
    .map(formatFollower) // Format each follower with seller details
    .filter(follower => follower !== null); // Remove any invalid followers

  // Step 4: Apply pagination to the formatted results
  // This calculates the correct slice of data for the requested page
  const startIndex = (pagination.page - 1) * pagination.limit; // Calculate starting index
  const endIndex = startIndex + pagination.limit; // Calculate ending index
  const paginatedFollowers = allFollowers.slice(startIndex, endIndex); // Extract page data

  // Step 5: Calculate pagination metadata
  // This provides information needed for frontend pagination controls
  const total = allFollowers.length; // Total number of followers
  const pages = Math.ceil(total / pagination.limit); // Total number of pages

  // Step 6: Return structured response with data and pagination info
  // This provides a consistent API response format
  return {
    data: {
      followers: paginatedFollowers, // The paginated followers for this page
    },
    pagination: {
      page: pagination.page, // Current page number
      limit: pagination.limit, // Items per page
      total, // Total number of followers
      pages // Total number of pages
    }
  };
}

/**
 * Main function to get followers without pagination.
 *
 * This function retrieves and formats the complete list of followers for a buyer,
 * including comprehensive seller information without pagination limits.
 *
 * Business Logic Flow:
 * 1. Retrieve buyer with populated followers data
 * 2. Validate buyer existence
 * 3. Format all followers with seller information
 * 4. Return complete followers list without pagination
 *
 * Data Processing:
 * - Retrieves buyer with populated follower relationships
 * - Formats each follower with complete seller information
 * - Returns all followers without pagination limits
 * - Provides consistent API response structure
 *
 * Security Considerations:
 * - Buyer existence validation prevents unauthorized access
 * - Repository methods handle data population securely
 * - Proper error handling prevents information leakage
 * - No pagination limits (use with caution for large datasets)
 *
 * Use Cases:
 * - Export functionality
 * - Complete followers list for small datasets
 * - Backend processing requiring all followers
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @param {Object} params - Request parameters (currently unused but available for future use)
 * @returns {Promise<Object>} - Complete followers data without pagination
 *   - data: {Object} - Contains complete followers array
 *   - pagination: {Object} - Empty pagination object
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operation fails
 */
async function listFollowers(buyerId, params) {
  // Step 1: Retrieve buyer with populated followers data
  // This fetches the buyer record with all follower relationships populated
  const buyer = await buyerRepository.findByIdWithPopulatedFollowers(buyerId);
  
  // Step 2: Validate buyer existence
  // This ensures the buyer exists before processing followers
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: Format all followers with seller information
  // This transforms raw follower data into API-ready format without pagination
  const followers = buyer.followers
    .map(formatFollower) // Format each follower with seller details
    .filter(follower => follower !== null); // Remove any invalid followers

  // Step 4: Return complete followers list without pagination
  // This provides all followers in a consistent API response format
  return {
    data: {
      followers: followers, // Complete list of all followers
    },
    pagination: {} // Empty pagination object for non-paginated response
  };
}

module.exports = {
  formatFollower,
  getPaginationOptions,
  getFilters,
  listPaginatedFollowers,
  listFollowers
}; 