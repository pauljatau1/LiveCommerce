const buyerRepository = require('../repositories/buyer.repository');
const updateNotificationPreferencesValidator = require('../validators/updateNotificationPreferences.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Deep merges notification preferences with existing preferences.
 * 
 * This function performs a deep merge of the new preferences with the existing ones,
 * ensuring that all nested objects are properly merged while maintaining the
 * existing structure and default values.
 * 
 * @param {Object} existingPreferences - The current notification preferences
 * @param {Object} newPreferences - The new preferences to merge
 * @returns {Object} The merged notification preferences
 */
function deepMergeNotificationPreferences(existingPreferences, newPreferences) {
  // Start with the existing preferences as the base to preserve all current settings
  const mergedPreferences = { ...existingPreferences };
  
  // Merge the top-level preferences to update any direct properties
  Object.assign(mergedPreferences, newPreferences);
  
  // Deep merge each section if it exists in new preferences
  // This ensures nested objects are properly merged without losing existing settings
  if (newPreferences.orderUpdates) {
    // Merge order updates section while preserving existing settings
    mergedPreferences.orderUpdates = {
      ...existingPreferences.orderUpdates,
      ...newPreferences.orderUpdates
    };
  }
  
  if (newPreferences.liveShows) {
    // Merge live shows section while preserving existing settings
    mergedPreferences.liveShows = {
      ...existingPreferences.liveShows,
      ...newPreferences.liveShows
    };
  }
  
  if (newPreferences.messages) {
    // Merge messages section while preserving existing settings
    mergedPreferences.messages = {
      ...existingPreferences.messages,
      ...newPreferences.messages
    };
  }
  
  if (newPreferences.communityActivity) {
    // Merge community activity section while preserving existing settings
    mergedPreferences.communityActivity = {
      ...existingPreferences.communityActivity,
      ...newPreferences.communityActivity
    };
  }
  
  if (newPreferences.promotionsAndSales) {
    // Merge promotions and sales section while preserving existing settings
    mergedPreferences.promotionsAndSales = {
      ...existingPreferences.promotionsAndSales,
      ...newPreferences.promotionsAndSales
    };
  }
  
  // Return the merged preferences object
  return mergedPreferences;
}

/**
 * Updates the notification preferences for a buyer.
 * 
 * This service handles the business logic for updating notification preferences.
 * It validates the input data, performs a deep merge with existing preferences,
 * and updates the buyer's record in the database.
 * 
 * @param {string} buyerId - The buyer's ID
 * @param {Object} preferences - The notification preferences to update
 * @returns {Promise<Object>} The updated notification preferences
 * @throws {ValidationError} If validation fails
 * @throws {NotFoundException} If buyer is not found
 */
async function updateNotificationPreferences(buyerId, preferences) {
  // Validate the input data using the validator
  // This ensures buyerId and preferences meet all requirements
  await updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, preferences);
  
  // Get the current buyer with notification preferences from the database
  // This retrieves the existing preferences that we'll merge with
  const buyer = await buyerRepository.findBuyerWithNotificationPreferences(buyerId);
  
  // Check if buyer exists in the database
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }
  
  // Deep merge the new preferences with existing ones
  // This ensures we don't lose any existing settings while updating with new ones
  const mergedPreferences = deepMergeNotificationPreferences(
    buyer.notificationPreferences,
    preferences
  );
  
  // Update the buyer's notification preferences in the database
  // This saves the merged preferences back to the database
  const updatedBuyer = await buyerRepository.updateNotificationPreferences(buyerId, mergedPreferences);
  
  // Check if update was successful by verifying the buyer still exists
  if (!updatedBuyer) {
    throw new NotFoundException('Buyer not found');
  }
  
  // Return the updated preferences in the expected format
  // This includes the data wrapper for consistent API responses
  return {
    data: {
      preferences: updatedBuyer.notificationPreferences
    }
  };
}

module.exports = {
  updateNotificationPreferences,
  deepMergeNotificationPreferences
}; 