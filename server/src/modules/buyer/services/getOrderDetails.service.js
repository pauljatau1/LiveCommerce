const buyerRepository = require('../repositories/buyer.repository');
const { validateGetOrderDetailsInput } = require('../validators/getOrderDetails.validator');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Retrieves detailed information about a specific order for a buyer.
 * 
 * This service handles the business logic for fetching order details.
 * It validates input parameters and ensures the order belongs to the buyer.
 *
 * @param {string} buyerId - The buyer's ID
 * @param {string} orderId - The order's ID
 * @returns {Promise<Object>} Detailed order information
 */
async function getOrderDetails(buyerId, orderId) {
  // Validate input parameters
  const validationErrors = validateGetOrderDetailsInput({ id: orderId });
  if (validationErrors.length > 0) {
    throw new ValidationError(validationErrors);
  }

  // Find the order that belongs to the buyer
  const order = await buyerRepository.findOrderByIdAndBuyer(orderId, buyerId);
  
  if (!order) {
    throw new NotFoundException('Order not found');
  }

  return order;
}

module.exports = {
  getOrderDetails
}; 