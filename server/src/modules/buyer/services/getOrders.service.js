const buyerRepository = require('../repositories/buyer.repository');
const queryParser = require('../../../utils/queryParser');

/**
 * Builds the base query for orders.
 * @param {string} buyerId - The buyer's ID
 * @returns {Object} Base query object
 */
function buildBaseQuery(buyerId) {
  return { 
    buyer: buyerId,
    isStale: { $ne: true } 
  };
}

/**
 * Maps tracking status to internal status values.
 * @param {string} trackingStatus - The tracking status to map
 * @returns {string|null} Mapped internal status or null
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
 * @param {Object} req - Express request object
 * @returns {Object} - Contains pagination config: enabled (boolean), page (number), limit (number)
 */
function getPaginationOptions(req) {
  return queryParser.getPaginationOptions(req);
}

/**
 * Extracts filter parameters from the request query for orders listing.
 * @param {Object} req - Express request object
 * @returns {Object} - Filters object to be passed to DB queries
 */
function getFilters(req) {
  const filters = {};
  
  if (req.query.trackingStatus !== undefined) {
    filters.trackingStatus = req.query.trackingStatus;
  }
  
  if (req.query.hasReturn !== undefined) {
    filters.hasReturn = req.query.hasReturn;
  }
  
  if (req.query.search !== undefined) {
    filters.search = req.query.search;
  }
  
  return filters;
}

/**
 * Retrieves all orders for a buyer without pagination.
 * Useful for cases like exporting all orders or simple listings.
 *
 * @param {string} buyerId - The buyer's ID
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} Formatted orders data without pagination
 */
async function getOrders(buyerId, filters = {}) {
  const query = buildQuery(buyerId, filters);
  const sort = '-createdAt';
  
  const orders = await buyerRepository.findOrders(query, {
    sort,
    skip: 0,
    limit: 0 // No limit for unpaginated results
  });

  const returnRequests = await buyerRepository.findReturnRequests(
    orders.map(order => order._id)
  );
  
  const ordersWithReturns = processOrdersWithReturns(orders, returnRequests, filters);
  const filteredOrders = filterByReturnStatus(ordersWithReturns, filters.hasReturn);
  
  return {
    data: filteredOrders,
    pagination: {} // No pagination info returned for full list
  };
}

/**
 * Retrieves orders for a buyer with pagination.
 * Returns order data along with pagination metadata.
 *
 * @param {string} buyerId - The buyer's ID
 * @param {Object} params - Parameters for pagination and filtering
 * @param {number} params.page - Page number
 * @param {number} params.limit - Number of orders per page
 * @param {Object} params.filters - Query filters
 * @returns {Promise<Object>} Formatted orders data with pagination
 */
async function getPaginatedOrders(buyerId, { page, limit, filters }) {
  const query = buildQuery(buyerId, filters);
  const total = await buyerRepository.countOrders(query);
  
  const skip = (page - 1) * limit;
  const sort = '-createdAt';

  const orders = await buyerRepository.findOrders(query, {
    sort,
    skip,
    limit
  });

  const returnRequests = await buyerRepository.findReturnRequests(
    orders.map(order => order._id)
  );

  const ordersWithReturns = processOrdersWithReturns(orders, returnRequests, filters);
  const filteredOrders = filterByReturnStatus(ordersWithReturns, filters.hasReturn);

  const totalOrders = filters.hasReturn || filters.trackingStatus ? filteredOrders.length : total;
  const totalPages = Math.ceil(totalOrders / limit);
  
  return {
    data: filteredOrders,
    pagination: {
      currentPage: page,
      totalPages,
      totalOrders,
      hasMore: page < totalPages,
      hasPrevious: page > 1
    }
  };
}

module.exports = {
  getOrders,
  getPaginatedOrders,
  getPaginationOptions,
  getFilters
}; 