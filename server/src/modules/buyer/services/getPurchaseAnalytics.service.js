/**
 * Get Purchase Analytics Service
 *
 * This service handles the business logic for retrieving comprehensive purchase
 * analytics for a buyer. It provides detailed insights into buying patterns,
 * order statistics, and purchase history.
 *
 * The service ensures that:
 * - Purchase analytics are calculated accurately
 * - Order data is processed efficiently
 * - Statistics are computed correctly
 * - Recent orders are retrieved with details
 * - Error handling maintains system integrity
 *
 * Purchase Analytics Flow:
 * - Order retrieval and data processing
 * - Basic statistics calculation
 * - Order status breakdown analysis
 * - Recent orders retrieval
 * - Analytics data compilation
 *
 * Analytics Features:
 * - Total orders and spending analysis
 * - Order status distribution
 * - Recent purchase history
 * - Performance metrics calculation
 * - Data aggregation and formatting
 *
 * Statistical Analysis:
 * - Order count calculations
 * - Total spending analysis
 * - Status-based order breakdown
 * - Recent order tracking
 * - Performance insights
 *
 * @module getPurchaseAnalyticsService
 */

const buyerRepository = require('../repositories/buyer.repository');
const orderRepository = require('../repositories/order.repository');

/**
 * Calculate basic order statistics for purchase analytics.
 *
 * This function processes an array of orders to calculate fundamental
 * statistics including total order count and total amount spent.
 *
 * Statistical Calculations:
 * - Total number of orders
 * - Total amount spent across all orders
 * - Basic performance metrics
 * - Financial analysis data
 *
 * Data Processing:
 * - Iterates through all orders
 * - Sums up total amounts
 * - Counts order quantities
 * - Provides aggregated statistics
 *
 * @param {Array} orders - Array of order objects with purchase data
 * @param {number} orders[].totalAmount - Total amount for each order
 * @returns {Object} Basic statistics including total orders and total spent
 *   - totalOrders: {number} - Total number of orders
 *   - totalSpent: {number} - Total amount spent across all orders
 */
function calculateBasicStats(orders) {
  // Step 1: Calculate total number of orders
  // This provides the count of all orders for the buyer
  const totalOrders = orders.length;
  
  // Step 2: Calculate total amount spent
  // This sums up the totalAmount from all orders
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  return {
    totalOrders,
    totalSpent
  };
}

/**
 * Count orders by status for purchase analytics.
 *
 * This function analyzes orders to provide a breakdown of order statuses,
 * helping to understand the buyer's order patterns and current order states.
 *
 * Status Analysis:
 * - Counts orders by each possible status
 * - Provides status distribution insights
 * - Tracks order lifecycle patterns
 * - Identifies order processing trends
 *
 * Status Categories:
 * - pending: Orders awaiting processing
 * - processing: Orders being prepared
 * - shipped: Orders in transit
 * - delivered: Completed orders
 * - cancelled: Cancelled orders
 * - returned: Returned orders
 *
 * Data Processing:
 * - Iterates through all orders and their items
 * - Counts occurrences of each status
 * - Provides comprehensive status breakdown
 * - Maintains accurate status tracking
 *
 * @param {Array} orders - Array of order objects with status information
 * @param {Array} orders[].items - Array of order items
 * @param {string} orders[].items[].status - Status of each order item
 * @returns {Object} Status breakdown with counts for each status
 *   - pending: {number} - Count of pending orders
 *   - processing: {number} - Count of processing orders
 *   - shipped: {number} - Count of shipped orders
 *   - delivered: {number} - Count of delivered orders
 *   - cancelled: {number} - Count of cancelled orders
 *   - returned: {number} - Count of returned orders
 */
function countOrdersByStatus(orders) {
  // Step 1: Initialize status counter object
  // This creates a structure to track counts for each possible order status
  const ordersByStatus = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0
  };
  
  // Step 2: Count orders by status
  // This iterates through all orders and their items to count status occurrences
  orders.forEach(order => {
    order.items.forEach(item => {
      if (ordersByStatus.hasOwnProperty(item.status)) {
        ordersByStatus[item.status]++;
      }
    });
  });
  
  return ordersByStatus;
}

/**
 * Get purchase analytics for a buyer - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * purchase analytics process. It handles data retrieval, statistical analysis,
 * and comprehensive analytics compilation.
 *
 * Business Logic Flow:
 * 1. Retrieves all orders for the buyer from the database
 * 2. Calculates basic statistics (total orders and spending)
 * 3. Analyzes order status distribution
 * 4. Retrieves recent orders with detailed information
 * 5. Compiles comprehensive analytics report
 *
 * Analytics Features:
 * - Comprehensive purchase insights
 * - Financial analysis and spending patterns
 * - Order status distribution analysis
 * - Recent purchase history tracking
 * - Performance metrics calculation
 *
 * Data Processing:
 * - Efficient order data retrieval
 * - Statistical calculations and analysis
 * - Status breakdown processing
 * - Recent order tracking
 * - Analytics data compilation
 *
 * Performance Optimization:
 * - Single database query for all orders
 * - Efficient data processing algorithms
 * - Optimized statistical calculations
 * - Minimal memory usage
 * - Fast response times
 *
 * @param {string} buyerId - The buyer's ID to retrieve analytics for
 * @returns {Promise<Object>} Comprehensive analytics data with purchase insights
 *   - totalOrders: {number} - Total number of orders placed
 *   - totalSpent: {number} - Total amount spent across all orders
 *   - ordersByStatus: {Object} - Breakdown of orders by status
 *     - pending: {number} - Count of pending orders
 *     - processing: {number} - Count of processing orders
 *     - shipped: {number} - Count of shipped orders
 *     - delivered: {number} - Count of delivered orders
 *     - cancelled: {number} - Count of cancelled orders
 *     - returned: {number} - Count of returned orders
 *   - recentOrders: {Array} - Array of recent orders with detailed information
 *     - _id: {string} - Order ID
 *     - totalAmount: {number} - Order total amount
 *     - status: {string} - Order status
 *     - createdAt: {Date} - Order creation date
 *     - items: {Array} - Array of order items
 *       - product: {Object} - Product information
 *       - quantity: {number} - Item quantity
 *       - price: {number} - Item price
 * @throws {Error} If database operations fail
 *
 * @example
 * // Get purchase analytics for buyer
 * const analytics = await getPurchaseAnalytics('507f1f77bcf86cd799439011');
 * // Returns: {
 * //   totalOrders: 15,
 * //   totalSpent: 1250.75,
 * //   ordersByStatus: {
 * //     pending: 2,
 * //     processing: 1,
 * //     shipped: 3,
 * //     delivered: 8,
 * //     cancelled: 1,
 * //     returned: 0
 * //   },
 * //   recentOrders: [
 * //     {
 * //       _id: '507f1f77bcf86cd799439012',
 * //       totalAmount: 99.99,
 * //       status: 'delivered',
 * //       createdAt: '2023-01-01T00:00:00.000Z',
 * //       items: [...]
 * //     }
 * //   ]
 * // }
 */
async function getPurchaseAnalytics(buyerId) {
  // Step 1: Get all orders for the buyer
  // This retrieves the complete order history for analytics processing
      const orders = await orderRepository.findBuyerOrders(buyerId);
  
  // Step 2: Calculate basic statistics
  // This provides fundamental metrics like total orders and spending
  const { totalOrders, totalSpent } = calculateBasicStats(orders);
  
  // Step 3: Count orders by status
  // This provides insights into order distribution and patterns
  const ordersByStatus = countOrdersByStatus(orders);
  
  // Step 4: Get recent orders with populated data
  // This retrieves the 5 most recent orders with complete details
      const recentOrders = await orderRepository.findRecentOrders(buyerId, 5);
  
  // Step 5: Return comprehensive analytics data
  // This compiles all analytics information into a single response
  return {
    totalOrders,
    totalSpent,
    ordersByStatus,
    recentOrders
  };
}

module.exports = {
  getPurchaseAnalytics
}; 