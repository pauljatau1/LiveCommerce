const buyerRepository = require('../repositories/buyer.repository');

/**
 * Calculate basic order statistics.
 *
 * @param {Array} orders - Array of order objects
 * @returns {Object} Basic statistics including total orders and total spent
 */
function calculateBasicStats(orders) {
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  return {
    totalOrders,
    totalSpent
  };
}

/**
 * Count orders by status.
 *
 * @param {Array} orders - Array of order objects
 * @returns {Object} Status breakdown with counts for each status
 */
function countOrdersByStatus(orders) {
  const ordersByStatus = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0
  };
  
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
 * Get purchase analytics for a buyer.
 *
 * This service retrieves comprehensive purchase analytics for a buyer including:
 * - Total orders and total amount spent
 * - Orders breakdown by status
 * - Recent orders with product details
 *
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object>} Analytics data with purchase insights
 */
async function getPurchaseAnalytics(buyerId) {
  // Get all orders for the buyer
  const orders = await buyerRepository.findBuyerOrders(buyerId);
  
  // Calculate basic statistics
  const { totalOrders, totalSpent } = calculateBasicStats(orders);
  
  // Count orders by status
  const ordersByStatus = countOrdersByStatus(orders);
  
  // Get recent orders with populated data
  const recentOrders = await buyerRepository.findRecentOrders(buyerId, 5);
  
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