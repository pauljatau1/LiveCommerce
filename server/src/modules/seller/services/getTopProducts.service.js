/**
 * Get Top Products Service
 *
 * This service handles the business logic for retrieving a seller's top selling products.
 * It uses aggregation to calculate product sales statistics and returns the top performers.
 *
 * @module getTopProductsService
 */

const orderRepository = require('../repositories/order.repository');
const ValidationError = require('../../../utils/errors/ValidationError');
const mongoose = require('mongoose');

/**
 * Get top selling products for a seller.
 *
 * This service method retrieves the seller's top selling products by analyzing order data.
 * It uses MongoDB aggregation to calculate total quantities sold and revenue for each product,
 * then returns the top performers sorted by quantity sold.
 *
 * @param {string} sellerId - The ID of the seller whose top products to retrieve
 * @returns {Promise<Object>} Object containing the top products data
 * @throws {ValidationError} When seller ID validation fails
 * @throws {Error} When database operation fails
 */
async function getTopProducts(sellerId) {
  // Validate seller ID parameter
  if (!sellerId || typeof sellerId !== 'string' || sellerId.trim() === '') {
    throw new ValidationError([{ 
      field: 'sellerId', 
      message: 'Valid seller ID is required' 
    }]);
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    throw new ValidationError([{ 
      field: 'sellerId', 
      message: 'Seller ID must be a valid ObjectId format' 
    }]);
  }

  // Get top products from repository using aggregation
  const topProducts = await orderRepository.getTopProductsBySeller(sellerId, 4);

  // Return the top products data in the same format as the original API
  return {
    data: topProducts
  };
}

module.exports = {
  getTopProducts
};
