const buyerRepository = require('../repositories/buyer.repository');
const { validateGetActivityStatusData } = require('../validators/getActivityStatus.validator');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Get the current activity status of a buyer
 * @param {string} buyerId - The ID of the buyer
 * @returns {Promise<boolean>} The current activity status (true for active, false for inactive)
 * @throws {ValidationError} If buyerId is invalid
 * @throws {NotFoundException} If buyer is not found
 */
async function getActivityStatus(buyerId) {
  // Validate input data
  const validationResult = validateGetActivityStatusData({ buyerId });
  if (validationResult.errors.length > 0) {
    throw new ValidationError(validationResult.errors);
  }

  // Get activity status from repository
  const isActive = await buyerRepository.getActivityStatus(buyerId);
  
  return isActive;
}

module.exports = {
  getActivityStatus
};
