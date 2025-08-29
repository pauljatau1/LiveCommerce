const Return = require('../../../models/Return');

/**
 * Find return requests for specific orders.
 * 
 * This function retrieves return requests associated with specific orders.
 * It's used for order management and return processing.
 *
 * @param {Array} orderIds - Array of order IDs
 * @returns {Promise<Array>} Array of return requests
 */
async function findReturnRequests(orderIds) {
  return Return.find({
    order: { $in: orderIds }
  }, '_id order status');
}

module.exports = {
  findReturnRequests
};
