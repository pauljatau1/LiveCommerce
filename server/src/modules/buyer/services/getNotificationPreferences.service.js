const buyerRepository = require('../repositories/buyer.repository');
const getNotificationPreferencesValidator = require('../validators/getNotificationPreferences.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Get notification preferences for a buyer
 * @param {string} buyerId - The buyer's ID
 * @returns {Object} - Notification preferences data
 */
async function getNotificationPreferences(buyerId) {
  // Validate input parameters using validator
  await getNotificationPreferencesValidator.validateGetNotificationPreferencesData(buyerId);

  // Fetch buyer data with notification preferences from repository
  const buyer = await buyerRepository.findBuyerWithNotificationPreferences(buyerId);
  
  // Check if buyer exists
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Return notification preferences in the same format as other services
  return {
    data: {
      preferences: buyer.notificationPreferences || {}
    }
  };
}

module.exports = {
  getNotificationPreferences
}; 