const buyerRepository = require('../repositories/buyer.repository');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Retrieves all shipping addresses for a buyer.
 *
 * This function:
 * - Fetches the buyer's shipping addresses using the repository
 * - Returns the complete address objects
 * - Throws NotFoundException if buyer doesn't exist
 *
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Array>} Array of shipping addresses
 */
async function getAddresses(buyerId) {
  // Get buyer with shipping addresses using repository
  const buyer = await buyerRepository.findByIdWithShippingAddresses(buyerId);

  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Return complete address objects or empty array if null
  return buyer.shippingAddresses || [];
}

module.exports = {
  getAddresses,
}; 