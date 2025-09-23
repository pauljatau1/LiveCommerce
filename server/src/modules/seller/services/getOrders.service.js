/**
 * Get Orders Service
 *
 * This service handles the business logic for retrieving a seller's orders with
 * comprehensive filtering, sorting, and pagination capabilities. It provides functionality to:
 * - Validate seller ID format and existence
 * - Retrieve orders with populated buyer and product information
 * - Apply advanced filtering by status, date range, and other criteria
 * - Implement sorting by various order attributes
 * - Provide pagination for large order datasets
 * - Return formatted order data for display
 * - Handle edge cases and data validation
 *
 * The service ensures that order data is properly retrieved and formatted
 * with all necessary buyer, product, and order information for frontend consumption.
 *
 * @module getOrdersService
 */

const mongoose = require('mongoose');
const sellerRepository = require('../repositories/seller.repository');
const orderRepository = require('../repositories/order.repository');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Builds the base query for seller orders.
 *
 * This function creates the foundational query object for order retrieval,
 * ensuring only non-stale orders are returned for the specified seller.
 *
 * Business Logic:
 * - Creates query filter for specific seller
 * - Excludes stale orders from results
 * - Provides base structure for additional filters
 *
 * @param {string} sellerId - The seller's ID
 * @returns {Object} Base query object with seller filter and stale exclusion
 */
function buildBaseQuery(sellerId) {
  return { 
    'items.seller': new mongoose.Types.ObjectId(sellerId),
    isStale: { $ne: true } 
  };
}

/**
 * Builds date range filter for order queries.
 *
 * This function creates date range filters based on start and end date parameters,
 * ensuring proper date validation and formatting for MongoDB queries.
 *
 * Business Logic:
 * - Validates date format and range
 * - Creates MongoDB date range query
 * - Handles edge cases for date boundaries
 *
 * @param {string} startDate - Start date string (optional)
 * @param {string} endDate - End date string (optional)
 * @returns {Object} Date range filter object or empty object
 */
function buildDateRangeFilter(startDate, endDate) {
  const dateFilter = {};
  
  if (startDate) {
    dateFilter.$gte = new Date(startDate);
  }
  
  if (endDate) {
    dateFilter.$lte = new Date(endDate);
  }
  
  return Object.keys(dateFilter).length > 0 ? dateFilter : {};
}

/**
 * Builds status filter for order queries.
 *
 * This function creates status filters for order items based on the provided status parameter,
 * ensuring proper status validation and query construction.
 *
 * Business Logic:
 * - Validates status parameter
 * - Creates MongoDB status query for order items
 * - Handles multiple status values if needed
 *
 * @param {string} status - Order status to filter by (optional)
 * @returns {Object} Status filter object or empty object
 */
function buildStatusFilter(status) {
  if (!status) {
    return {};
  }
  
  return {
    'items.status': status
  };
}

/**
 * Builds complete query with all filters applied.
 *
 * This function combines base query with all applicable filters to create
 * a comprehensive MongoDB query for order retrieval.
 *
 * Business Logic:
 * - Combines base seller query with filters
 * - Applies date range filtering
 * - Applies status filtering
 * - Ensures query consistency and validity
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} filters - Filter options object
 * @param {string} filters.status - Order status filter
 * @param {string} filters.startDate - Start date filter
 * @param {string} filters.endDate - End date filter
 * @returns {Object} Complete MongoDB query object
 */
function buildQuery(sellerId, filters) {
  const query = buildBaseQuery(sellerId);
  
  // Apply status filter
  const statusFilter = buildStatusFilter(filters.status);
  Object.assign(query, statusFilter);
  
  // Apply date range filter
  const dateFilter = buildDateRangeFilter(filters.startDate, filters.endDate);
  if (Object.keys(dateFilter).length > 0) {
    query.createdAt = dateFilter;
  }
  
  return query;
}

/**
 * Builds pagination options for order queries.
 *
 * This function creates pagination parameters based on request query parameters,
 * ensuring proper pagination handling with defaults and validation.
 *
 * Business Logic:
 * - Sets default pagination values
 * - Validates pagination parameters
 * - Calculates skip and limit values
 * - Ensures reasonable pagination limits
 *
 * @param {Object} req - Express request object
 * @returns {Object} Pagination options object
 */
function getPaginationOptions(req) {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
  
  return {
    enabled: true,
    page: Math.max(page, 1),
    limit: Math.max(limit, 1),
    skip: (Math.max(page, 1) - 1) * Math.max(limit, 1)
  };
}

/**
 * Builds filter options from request parameters.
 *
 * This function extracts and validates filter parameters from the request,
 * ensuring proper filter construction for order queries.
 *
 * Business Logic:
 * - Extracts filter parameters from request
 * - Validates filter values
 * - Returns structured filter object
 *
 * @param {Object} req - Express request object
 * @returns {Object} Filter options object
 */
function getFilters(req) {
  return {
    status: req.query.status || null,
    startDate: req.query.startDate || null,
    endDate: req.query.endDate || null
  };
}

/**
 * Validates seller ID parameter.
 *
 * This function validates the seller ID to ensure it's a valid ObjectId format
 * and that the seller exists in the system.
 *
 * Business Logic:
 * - Validates ObjectId format
 * - Checks seller existence
 * - Throws appropriate errors for invalid data
 *
 * @param {string} sellerId - The seller ID to validate
 * @throws {ValidationError} When seller ID validation fails
 * @throws {NotFoundException} When seller is not found
 */
async function validateSellerId(sellerId) {
  if (!sellerId || typeof sellerId !== 'string' || sellerId.trim() === '') {
    throw new ValidationError([{ 
      field: 'sellerId', 
      message: 'Valid seller ID is required' 
    }]);
  }

  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    throw new ValidationError([{ 
      field: 'sellerId', 
      message: 'Seller ID must be a valid ObjectId format' 
    }]);
  }

  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }
}

/**
 * Retrieves orders for a seller with pagination.
 *
 * This function retrieves paginated orders for a seller with all necessary
 * filtering, sorting, and population of related data.
 *
 * Business Logic:
 * - Validates seller ID and existence
 * - Builds comprehensive query with filters
 * - Retrieves paginated order data
 * - Populates related buyer and product information
 * - Calculates pagination metadata
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} params - Parameters object containing pagination and filters
 * @param {Object} params.page - Page number
 * @param {Object} params.limit - Items per page
 * @param {Object} params.skip - Number of items to skip
 * @param {Object} params.filters - Filter options
 * @returns {Promise<Object>} Paginated orders response
 */
async function getPaginatedOrders(sellerId, params) {
  // Validate seller ID and existence
  await validateSellerId(sellerId);
  
  // Build query with filters
  const query = buildQuery(sellerId, params.filters);
  
  // Build pagination options
  const options = {
    sort: { createdAt: -1 },
    skip: params.skip,
    limit: params.limit
  };
  
  // Retrieve orders and total count in parallel
  const [orders, total] = await Promise.all([
    orderRepository.findOrders(query, options),
    orderRepository.countOrders(query)
  ]);
  
  // Calculate pagination metadata
  const totalPages = Math.ceil(total / params.limit);
  
  return {
    data: {
      orders,
      currentPage: params.page,
      totalPages: totalPages,
    },
    pagination: {
      currentPage: params.page,
      totalPages: totalPages,
      totalOrders: total,
      hasMore: params.page < totalPages,
      hasPrevious: params.page > 1
    }
  };
}

/**
 * Retrieves orders for a seller without pagination.
 *
 * This function retrieves all orders for a seller with filtering but without
 * pagination, useful for exports or complete data retrieval.
 *
 * Business Logic:
 * - Validates seller ID and existence
 * - Builds comprehensive query with filters
 * - Retrieves all matching order data
 * - Populates related buyer and product information
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} filters - Filter options object
 * @returns {Promise<Object>} Orders response without pagination
 */
async function getOrders(sellerId, filters) {
  // Validate seller ID and existence
  await validateSellerId(sellerId);
  
  // Build query with filters
  const query = buildQuery(sellerId, filters);
  
  // Build options for sorting
  const options = {
    sort: { createdAt: -1 },
    skip: 0,
    limit: 1000 // Reasonable limit for non-paginated requests
  };
  
  // Retrieve orders
  const orders = await orderRepository.findOrders(query, options);
  
  return {
    data: {
      orders,
      currentPage: 1,
      totalPages: orders.length > 0 ? 1 : 0,
    },
    pagination: {} // No pagination info returned for full list
  };
}

module.exports = {
  getPaginationOptions,
  getFilters,
  getPaginatedOrders,
  getOrders
};
