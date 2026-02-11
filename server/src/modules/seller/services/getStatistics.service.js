/**
 * Get Statistics Service
 *
 * This service handles the business logic for retrieving comprehensive seller statistics.
 * It provides detailed analytics including wallet balance, store visits, orders, conversion rates,
 * and customer metrics with week-over-week comparisons.
 *
 * @module getStatisticsService
 */

const mongoose = require('mongoose');
const sellerRepository = require('../repositories/seller.repository');
const orderRepository = require('../repositories/order.repository');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');

function calculatePositiveChange(current, previous) {
  // Handle edge cases where previous value is zero
  if (!previous || previous === 0) {
    return { value: current > 0 ? "100.00" : "0.00", type: 'percentage' };
  }

  // Calculate percentage change
  const change = ((current - previous) / previous) * 100;
  return { value: change.toFixed(2), type: 'percentage' };
}

/**
 * Get date range for current and previous weeks.
 *
 * This function calculates the start and end dates for the current week
 * and the previous week based on Sunday as the week start day.
 *
 * @returns {Object} Date range object
 * @returns {Date} returns.currentDate - Current date
 * @returns {Date} returns.currentWeekStart - Start of current week (Sunday)
 * @returns {Date} returns.lastWeekStart - Start of last week (Sunday)
 */
function getWeekDateRanges() {
  const currentDate = new Date();
  const currentWeekStart = new Date(currentDate);

  // Set to start of current week (Sunday)
  currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay());

  // Calculate start of last week
  const lastWeekStart = new Date(currentWeekStart);
  lastWeekStart.setDate(currentWeekStart.getDate() - 7);

  return {
    currentDate,
    currentWeekStart,
    lastWeekStart
  };
}

/**
 * Check if a follower has valid data (buyerId and followDate).
 *
 * @param {Object} follower - Follower object to validate
 * @returns {boolean} True if follower has valid data
 */
function hasValidFollowerData(follower) {
  return !!(follower.buyerId && follower.followDate);
}

/**
 * Check if a follower has placed orders with the seller.
 *
 * @param {Object} follower - Follower object
 * @param {Array} buyersWithOrders - Array of buyer IDs who have orders
 * @returns {boolean} True if follower has placed orders
 */
function hasOrdersWithSeller(follower, buyersWithOrders) {
  return buyersWithOrders.some(buyerId =>
    buyerId && buyerId.toString() === follower.buyerId.toString()
  );
}

/**
 * Check if a follower's follow date is within the specified range.
 *
 * @param {Object} follower - Follower object
 * @param {Date} startDate - Start date for filtering
 * @param {Date} endDate - End date for filtering
 * @returns {boolean} True if follower's date is within range
 */
function isFollowerDateInRange(follower, startDate, endDate) {
  if (!startDate || !endDate) {
    return true;
  }
  const followDate = new Date(follower.followDate);
  return followDate >= startDate && followDate <= endDate;
}

/**
 * Count customers who are followers and have placed orders.
 *
 * This function filters the seller's followers to count only those
 * who have actually placed orders with the seller.
 *
 * @param {Array} followers - Array of follower objects
 * @param {Array} buyersWithOrders - Array of buyer IDs who have orders
 * @param {Date} startDate - Start date for filtering (optional)
 * @param {Date} endDate - End date for filtering (optional)
 * @returns {number} Count of customers who are followers with orders
 */
function countCustomersWithOrders(followers, buyersWithOrders, startDate = null, endDate = null) {
  return followers.filter(follower => {
    return hasValidFollowerData(follower) &&
      hasOrdersWithSeller(follower, buyersWithOrders) &&
      isFollowerDateInRange(follower, startDate, endDate);
  }).length;
}

/**
 * Validate seller ID parameter.
 *
 * @param {string} sellerId - The seller ID to validate
 * @throws {ValidationError} When seller ID validation fails
 */
function validateSellerId(sellerId) {
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
}

/**
 * Fetch and validate seller data.
 *
 * @param {string} sellerId - The seller ID
 * @returns {Promise<Object>} Seller data
 * @throws {NotFoundException} When seller is not found
 */
async function fetchSellerData(sellerId) {
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }
  return seller;
}

/**
 * Get order statistics for the seller.
 *
 * @param {string} sellerId - The seller ID
 * @param {Object} dateRanges - Date range objects
 * @returns {Promise<Array>} Array of order statistics
 */
async function getOrderStatistics(sellerId, dateRanges) {
  const { currentDate, currentWeekStart, lastWeekStart } = dateRanges;

  return Promise.all([
    orderRepository.countOrdersBySellerWithDateRange(sellerId),
    orderRepository.countOrdersBySellerWithDateRange(sellerId, {
      $gte: currentWeekStart,
      $lt: currentDate
    }),
    orderRepository.countOrdersBySellerWithDateRange(sellerId, {
      $gte: lastWeekStart,
      $lt: currentWeekStart
    }),
    orderRepository.getDistinctBuyersBySeller(sellerId)
  ]);
}

/**
 * Calculate customer metrics for the seller.
 *
 * @param {Array} followers - Seller's followers
 * @param {Array} buyersWithOrders - Buyers who have placed orders
 * @param {Object} dateRanges - Date range objects
 * @returns {Object} Customer metrics
 */
function calculateCustomerMetrics(followers, buyersWithOrders, dateRanges) {
  const { currentDate, currentWeekStart, lastWeekStart } = dateRanges;

  return {
    totalCustomers: countCustomersWithOrders(followers, buyersWithOrders),
    currentWeekCustomers: countCustomersWithOrders(
      followers,
      buyersWithOrders,
      currentWeekStart,
      currentDate
    ),
    lastWeekCustomers: countCustomersWithOrders(
      followers,
      buyersWithOrders,
      lastWeekStart,
      currentWeekStart
    )
  };
}

/**
 * Calculate conversion rates.
 *
 * @param {number} storeVisits - Total store visits
 * @param {number} totalOrders - Total orders
 * @param {number} lastWeekVisits - Last week visits
 * @param {number} lastWeekOrders - Last week orders
 * @returns {Object} Conversion rates
 */
function calculateConversionRates(storeVisits, totalOrders, lastWeekVisits, lastWeekOrders) {
  const currentConversionRate = storeVisits > 0 ?
    (totalOrders / storeVisits) * 100 : 0;

  const lastWeekConversionRate = lastWeekVisits > 0 ?
    (lastWeekOrders / lastWeekVisits) * 100 : 0;

  return { currentConversionRate, lastWeekConversionRate };
}

/**
 * Build the statistics response object.
 *
 * @param {Object} seller - Seller data
 * @param {Array} orderStats - Order statistics array
 * @param {Object} customerMetrics - Customer metrics
 * @param {Object} conversionRates - Conversion rates
 * @param {Object} dateRanges - Date range objects
 * @returns {Object} Statistics object
 */
function buildStatisticsObject(seller, orderStats, customerMetrics, conversionRates, dateRanges) {
  const [totalOrders, currentWeekOrders, lastWeekOrders] = orderStats;
  const { currentConversionRate, lastWeekConversionRate } = conversionRates;
  const { currentWeekCustomers, lastWeekCustomers } = customerMetrics;
  const { currentWeekVisits, lastWeekVisits } = dateRanges;

  // Calculate percentage changes for all metrics
  const visitsChange = calculatePositiveChange(currentWeekVisits, lastWeekVisits);
  const ordersChange = calculatePositiveChange(currentWeekOrders, lastWeekOrders);
  const customersChange = calculatePositiveChange(currentWeekCustomers, lastWeekCustomers);
  const walletChange = calculatePositiveChange(seller.walletBalance, 0);
  const conversionChange = calculatePositiveChange(currentConversionRate, lastWeekConversionRate);

  return {
    walletBalance: {
      amount: seller.walletBalance,
      currency: "NGN",
      change: walletChange
    },
    storeVisits: {
      count: seller.storeVisits || 0,
      change: visitsChange
    },
    totalOrders: {
      count: totalOrders,
      change: ordersChange
    },
    conversionRate: {
      percentage: currentConversionRate.toFixed(2),
      change: conversionChange
    },
    newCustomers: {
      count: customerMetrics.totalCustomers,
      change: customersChange
    }
  };
}

/**
 * Get comprehensive seller statistics with week-over-week comparisons.
 *
 * This service method retrieves detailed analytics for a seller including:
 * - Wallet balance and changes
 * - Store visits and trends
 * - Order counts and growth
 * - Conversion rates and performance
 * - Customer acquisition metrics
 *
 * The method performs complex calculations to provide meaningful insights
 * into the seller's business performance with proper week-over-week comparisons.
 *
 * @param {string} sellerId - The ID of the seller whose statistics to retrieve
 * @returns {Promise<Object>} Object containing comprehensive statistics data
 * @throws {ValidationError} When seller ID validation fails
 * @throws {NotFoundException} When seller is not found
 * @throws {Error} When database operations fail
 */
async function getStatistics(sellerId) {
  // Validate seller ID parameter
  validateSellerId(sellerId);

  // Fetch and validate seller data
  const seller = await fetchSellerData(sellerId);

  // Get date ranges for current and previous weeks
  const dateRanges = getWeekDateRanges();
  dateRanges.currentWeekVisits = seller.storeVisits || 0;
  dateRanges.lastWeekVisits = 0; // This would need to be calculated from historical data

  // Get order statistics using repository methods
  const orderStats = await getOrderStatistics(sellerId, dateRanges);
  const buyersWithOrders = orderStats[3];

  // Calculate customer metrics
  const customerMetrics = calculateCustomerMetrics(seller.followers, buyersWithOrders, dateRanges);

  // Calculate conversion rates
  const conversionRates = calculateConversionRates(
    dateRanges.currentWeekVisits,
    orderStats[0], // totalOrders
    dateRanges.lastWeekVisits,
    orderStats[2]  // lastWeekOrders
  );

  // Build comprehensive statistics object
  const statistics = buildStatisticsObject(seller, orderStats, customerMetrics, conversionRates, dateRanges);

  // Return statistics in the same format as the original API
  return {
    data: statistics
  };
}

module.exports = {
  getStatistics
};
