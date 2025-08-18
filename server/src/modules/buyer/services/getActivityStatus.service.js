const buyerRepository = require('../repositories/buyer.repository');
const { validateGetActivityStatusData } = require('../validators/getActivityStatus.validator');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Get the current activity status of a buyer
 * @param {string} buyerId - The ID of the buyer
 * @returns {Promise<Object>} Object containing isActive status
 * @throws {ValidationError} If buyerId is invalid
 * @throws {NotFoundException} If buyer is not found
 */
async function getActivityStatus(buyerId) {
  // Validate input data
  await validateGetActivityStatusData({ buyerId });

  // Get activity status from repository
  const buyer = await buyerRepository.getActivityStatus(buyerId);
  
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  return {
    isActive: buyer.isActive
  };
}

module.exports = {
  getActivityStatus
};
