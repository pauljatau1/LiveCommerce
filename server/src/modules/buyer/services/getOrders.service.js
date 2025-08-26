/**
 * Get Orders Service
 *
 * This service handles the business logic for retrieving a buyer's orders with
 * comprehensive filtering, sorting, and pagination capabilities. It provides functionality to:
 * - Validate buyer ID format and existence
 * - Retrieve orders with populated product and seller information
 * - Apply advanced filtering by status, date range, and other criteria
 * - Implement sorting by various order attributes
 * - Provide pagination for large order datasets
 * - Return formatted order data for display
 * - Handle edge cases and data validation
 *
 * The service ensures that order data is properly retrieved and formatted
 * with all necessary product, seller, and order information for frontend consumption.
 *
 * @module getOrdersService
 */

const buyerRepository = require('../repositories/buyer.repository');
const queryParser = require('../../../utils/queryParser');

/**
 * Builds the base query for orders.
 *
 * This function creates the foundational query object for order retrieval,
 * ensuring only non-stale orders are returned for the specified buyer.
 *
 * Business Logic:
 * - Creates query filter for specific buyer
 * - Excludes stale orders from results
 * - Provides base structure for additional filters
 *
 * @param {string} buyerId - The buyer's ID
 * @returns {Object} Base query object with buyer filter and stale exclusion
 */
function buildBaseQuery(buyerId) {
  return { 
    buyer: buyerId,
    isStale: { $ne: true } 
  };
}

/**
 * Maps tracking status to internal status values.
 *
 * This function normalizes various tracking status formats to internal
 * standardized values for consistent database queries and filtering.
 *
 * Business Logic:
 * - Normalizes status strings by removing special characters
 * - Maps external status formats to internal representations
 * - Handles multiple variations of the same status
 * - Returns null for unrecognized status values
 *
 * Status Mapping:
 * - 'picked-up', 'pickedup', 'picked_up' → 'picked_up'
 * - 'dispatched' → 'in_transit'
 * - 'delivered' → 'delivered'
 * - 'cancelled' → 'cancelled'
 * - 'pending' → 'pending'
 * - 'refunded' → 'refunded'
 *
 * @param {string} trackingStatus - The tracking status to map
 * @returns {string|null} Mapped internal status or null if unrecognized
 */
function mapTrackingStatus(trackingStatus) {
  const statusMap = {
    'picked-up': 'picked_up',
    'pickedup': 'picked_up',
    'picked_up': 'picked_up',
    'dispatched': 'in_transit',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'pending': 'pending',
    'refunded': 'refunded'
  };
  
  const normalizedStatus = trackingStatus.toLowerCase().replace(/[-_\s]/g, '');
  
  for (const [key, value] of Object.entries(statusMap)) {
    const normalizedKey = key.toLowerCase().replace(/[-_\s]/g, '');
    if (normalizedKey === normalizedStatus) {
      return value;
    }
  }
  
  return null;
}

/**
 * Adds tracking status filter to query if provided.
 * @param {Object} query - The query object to modify
 * @param {string} trackingStatus - The tracking status filter
 */
function addTrackingStatusFilter(query, trackingStatus) {
  if (!trackingStatus) return;
  
  const internalStatus = mapTrackingStatus(trackingStatus);
  
  // For refunded status, we don't filter by shipping tracking status
  // Instead, we'll filter by return request status in processOrdersWithReturns
  if (internalStatus && internalStatus !== 'refunded') {
    query['shipping.tracking.status'] = internalStatus;
  }
}

/**
 * Adds search filter to query if provided.
 * @param {Object} query - The query object to modify
 * @param {string} search - The search term
 */
function addSearchFilter(query, search) {
  if (!search) return;
  
  query.$or = [
    { order_id: { $regex: search, $options: 'i' } },
    { 'items.productName': { $regex: search, $options: 'i' } }
  ];
}

/**
 * Builds the complete query with all filters.
 * @param {string} buyerId - The buyer's ID
 * @param {Object} filters - Query filters
 * @returns {Object} Complete query object
 */
function buildQuery(buyerId, filters = {}) {
  const query = buildBaseQuery(buyerId);
  addTrackingStatusFilter(query, filters.trackingStatus);
  addSearchFilter(query, filters.search);
  return query;
}

/**
 * Creates a map of order IDs to return request information.
 * @param {Array} returnRequests - Array of return requests
 * @returns {Map} Map of order ID to return info
 */
function createReturnMap(returnRequests) {
  return new Map(
    returnRequests.map(r => [r.order.toString(), { returnId: r._id, status: r.status }])
  );
}

/**
 * Checks if order should be filtered out for refunded status.
 * @param {Object} filters - Query filters
 * @param {Object} returnInfo - Return request info
 * @returns {boolean} True if order should be filtered out
 */
function shouldFilterForRefunded(filters, returnInfo) {
  if (!filters.trackingStatus) return false;
  
  const normalizedStatus = filters.trackingStatus.toLowerCase().replace(/[-_\s]/g, '');
  if (normalizedStatus !== 'refunded') return false;
  
  if (returnInfo) {
    const shouldFilter = returnInfo.status.toLowerCase() !== 'refunded';
    return shouldFilter;
  }
  
  return true; // No return info but filtering for refunded
}

/**
 * Adds return request information to an order.
 * @param {Object} orderObj - Order object
 * @param {Object} returnInfo - Return request info
 */
function addReturnInfoToOrder(orderObj, returnInfo) {
  if (returnInfo) {
    orderObj.returnRequestId = returnInfo.returnId;
    orderObj.returnStatus = returnInfo.status;
  }
}

/**
 * Processes a single order with return request information.
 * @param {Object} order - Order object
 * @param {Map} returnMap - Map of order IDs to return info
 * @param {Object} filters - Query filters
 * @returns {Object|null} Processed order or null if filtered out
 */
function processSingleOrder(order, returnMap, filters) {
  const orderObj = order.toObject();
  const returnInfo = returnMap.get(order._id.toString());
  
  addReturnInfoToOrder(orderObj, returnInfo);
  
  if (shouldFilterForRefunded(filters, returnInfo)) {
    return null;
  }
  
  return orderObj;
}

/**
 * Processes orders with return request information.
 * @param {Array} orders - Array of orders
 * @param {Array} returnRequests - Array of return requests
 * @param {Object} filters - Query filters
 * @returns {Array} Processed orders with return info
 */
function processOrdersWithReturns(orders, returnRequests, filters) {
  const returnMap = createReturnMap(returnRequests);
  
  return orders
    .map(order => processSingleOrder(order, returnMap, filters))
    .filter(Boolean);
}

/**
 * Filters orders by return status.
 * @param {Array} orders - Array of orders
 * @param {string} hasReturn - Return filter value
 * @returns {Array} Filtered orders
 */
function filterByReturnStatus(orders, hasReturn) {
  if (hasReturn === 'true') {
    return orders.filter(order => order.returnRequestId);
  } else if (hasReturn === 'false') {
    return orders.filter(order => !order.returnRequestId);
  }
  return orders;
}

/**
 * Extracts pagination options from the request query parameters.
 * 
 * This function uses the queryParser utility to extract and validate
 * pagination parameters from the HTTP request query string.
 *
 * @param {Object} req - Express request object containing query parameters
 * @returns {Object} - Contains pagination config: enabled (boolean), page (number), limit (number)
 */
function getPaginationOptions(req) {
  return queryParser.getPaginationOptions(req);
}

/**
 * Extracts filter parameters from the request query for orders listing.
 * 
 * This function processes the HTTP request query parameters and extracts
 * relevant filter values for order retrieval. It handles multiple filter types
 * including tracking status, return status, and search terms.
 *
 * @param {Object} req - Express request object containing query parameters
 * @returns {Object} - Filters object to be passed to DB queries
 *   - trackingStatus: {string} - Order tracking status filter
 *   - hasReturn: {string} - Filter for orders with/without returns ('true'/'false')
 *   - search: {string} - Search term for order ID or product names
 */
function getFilters(req) {
  const filters = {};
  
  // Extract tracking status filter if provided
  if (req.query.trackingStatus !== undefined) {
    filters.trackingStatus = req.query.trackingStatus;
  }
  
  // Extract return status filter if provided
  if (req.query.hasReturn !== undefined) {
    filters.hasReturn = req.query.hasReturn;
  }
  
  // Extract search term filter if provided
  if (req.query.search !== undefined) {
    filters.search = req.query.search;
  }
  
  return filters;
}

/**
 * Retrieves all orders for a buyer without pagination.
 * 
 * This function is useful for cases like exporting all orders or simple listings
 * where pagination is not required. It processes orders with return information
 * and applies all relevant filters.
 *
 * Business Logic Flow:
 * 1. Build comprehensive query with all filters
 * 2. Retrieve orders sorted by creation date (newest first)
 * 3. Fetch return request information for all orders
 * 4. Process orders with return details and apply filtering
 * 5. Return complete order list without pagination metadata
 *
 * Data Processing:
 * - Orders are sorted by creation date (newest first)
 * - Return request information is merged with order data
 * - Filters are applied to the processed results
 * - No pagination limits are applied
 *
 * Security Considerations:
 * - Buyer ID validation ensures data access control
 * - Query building prevents injection attacks
 * - Return request processing maintains data integrity
 *
 * @param {string} buyerId - The buyer's ID to retrieve orders for
 * @param {Object} filters - Query filters object
 * @param {string} filters.trackingStatus - Optional tracking status filter
 * @param {string} filters.hasReturn - Optional return status filter
 * @param {string} filters.search - Optional search term filter
 * @returns {Promise<Object>} Formatted orders data without pagination
 *   - data: {Array} - Array of processed order objects
 *   - pagination: {Object} - Empty pagination object
 */
async function getOrders(buyerId, filters = {}) {
  // Step 1: Build comprehensive query with all filters
  const query = buildQuery(buyerId, filters);
  const sort = '-createdAt'; // Sort by creation date, newest first
  
  // Step 2: Retrieve orders from database (no pagination limits)
  const orders = await buyerRepository.findOrders(query, {
    sort,
    skip: 0,
    limit: 0 // No limit for unpaginated results
  });

  // Step 3: Fetch return request information for all orders
  const returnRequests = await buyerRepository.findReturnRequests(
    orders.map(order => order._id)
  );
  
  // Step 4: Process orders with return information and apply filters
  const ordersWithReturns = processOrdersWithReturns(orders, returnRequests, filters);
  const filteredOrders = filterByReturnStatus(ordersWithReturns, filters.hasReturn);
  
  // Step 5: Return formatted response without pagination
  return {
    data: filteredOrders,
    pagination: {} // No pagination info returned for full list
  };
}

/**
 * Retrieves orders for a buyer with pagination.
 * 
 * This function provides paginated order retrieval with comprehensive filtering
 * and return request processing. It calculates pagination metadata and handles
 * complex filtering scenarios.
 *
 * Business Logic Flow:
 * 1. Build comprehensive query with all filters
 * 2. Calculate pagination parameters (skip, limit)
 * 3. Retrieve orders with pagination limits
 * 4. Fetch return request information for retrieved orders
 * 5. Process orders with return details and apply filtering
 * 6. Calculate accurate pagination metadata
 * 7. Handle special cases for filtered results
 *
 * Pagination Calculation:
 * - For unfiltered results: Uses database count for accurate pagination
 * - For filtered results: Uses filtered array length for accurate pagination
 * - Ensures hasMore/hasPrevious flags are calculated correctly
 *
 * Data Processing:
 * - Orders are sorted by creation date (newest first)
 * - Return request information is merged with order data
 * - Filters are applied to the processed results
 * - Pagination limits are enforced for performance
 *
 * Security Considerations:
 * - Buyer ID validation ensures data access control
 * - Query building prevents injection attacks
 * - Return request processing maintains data integrity
 * - Pagination prevents excessive data exposure
 *
 * @param {string} buyerId - The buyer's ID to retrieve orders for
 * @param {Object} params - Parameters for pagination and filtering
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.limit - Number of orders per page
 * @param {Object} params.filters - Query filters object
 * @returns {Promise<Object>} Formatted orders data with pagination
 *   - data: {Array} - Array of processed order objects
 *   - pagination: {Object} - Pagination metadata
 *     - currentPage: {number} - Current page number
 *     - totalPages: {number} - Total number of pages
 *     - totalOrders: {number} - Total number of orders (after filtering)
 *     - hasMore: {boolean} - Whether there are more pages
 *     - hasPrevious: {boolean} - Whether there are previous pages
 */
async function getPaginatedOrders(buyerId, { page, limit, filters }) {
  // Step 1: Build comprehensive query with all filters
  const query = buildQuery(buyerId, filters);
  
  // Step 2: Get total count for pagination calculation
  const total = await buyerRepository.countOrders(query);
  
  // Step 3: Calculate pagination parameters
  const skip = (page - 1) * limit; // Calculate how many documents to skip
  const sort = '-createdAt'; // Sort by creation date, newest first

  // Step 4: Retrieve orders with pagination limits
  const orders = await buyerRepository.findOrders(query, {
    sort,
    skip,
    limit
  });

  // Step 5: Fetch return request information for retrieved orders
  const returnRequests = await buyerRepository.findReturnRequests(
    orders.map(order => order._id)
  );

  // Step 6: Process orders with return information and apply filters
  const ordersWithReturns = processOrdersWithReturns(orders, returnRequests, filters);
  const filteredOrders = filterByReturnStatus(ordersWithReturns, filters.hasReturn);

  // Step 7: Calculate pagination metadata
  // Use filtered count if filters are applied, otherwise use database count
  const totalOrders = filters.hasReturn || filters.trackingStatus ? filteredOrders.length : total;
  const totalPages = Math.ceil(totalOrders / limit);
  
  // Step 8: Return formatted response with pagination
  return {
    data: filteredOrders,
    pagination: {
      currentPage: page,
      totalPages,
      totalOrders,
      hasMore: page < totalPages, // True if current page is less than total pages
      hasPrevious: page > 1 // True if current page is greater than 1
    }
  };
}

module.exports = {
  getOrders,
  getPaginatedOrders,
  getPaginationOptions,
  getFilters
}; 