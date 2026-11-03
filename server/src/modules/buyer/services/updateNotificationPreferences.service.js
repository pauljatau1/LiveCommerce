/**
 * Update Notification Preferences Service
 *
 * This service handles the business logic for updating a buyer's notification preferences.
 * It provides functionality to:
 * - Validate notification preferences update requests
 * - Perform deep merge of new preferences with existing ones
 * - Maintain existing preference settings during updates
 * - Update buyer's database record with merged preferences
 * - Handle nested preference structures
 * - Ensure data consistency and integrity
 *
 * The service ensures that notification preferences are updated without losing
 * existing settings, providing a seamless user experience for preference management.
 *
 * @module updateNotificationPreferencesService
 */

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
 * Business Logic:
 * - Starts with existing preferences as the base
 * - Merges top-level preference properties
 * - Performs deep merge for nested preference sections
 * - Preserves existing settings not included in update
 * - Maintains consistent preference structure
 *
 * @param {Object} existingPreferences - The current notification preferences
 * @param {Object} newPreferences - The new preferences to merge
 * @returns {Object} The merged notification preferences
 * @example
 * const existing = { orderUpdates: { email: true }, liveShows: { push: false } };
 * const newPrefs = { orderUpdates: { sms: true } };
 * const merged = deepMergeNotificationPreferences(existing, newPrefs);
 * // Returns: { orderUpdates: { email: true, sms: true }, liveShows: { push: false } }
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
 * This function orchestrates the complete process of updating notification preferences,
 * including validation, deep merging with existing preferences, and database updates.
 *
 * Business Logic Flow:
 * 1. Validate the input data using the validator
 * 2. Retrieve current buyer with notification preferences
 * 3. Verify buyer exists in database
 * 4. Deep merge new preferences with existing ones
 * 5. Update buyer record with merged preferences
 * 6. Return updated notification preferences
 *
 * Security Considerations:
 * - Input validation prevents malicious data injection
 * - Buyer existence verification ensures data integrity
 * - Deep merge prevents data loss during updates
 * - Proper error handling for edge cases
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @param {Object} preferences - The notification preferences to update
 * @param {Object} preferences.orderUpdates - Order update notification settings
 * @param {Object} preferences.liveShows - Live show notification settings
 * @param {Object} preferences.messages - Message notification settings
 * @param {Object} preferences.communityActivity - Community activity notification settings
 * @param {Object} preferences.promotionsAndSales - Promotions and sales notification settings
 * @returns {Promise<Object>} The updated notification preferences
 * @throws {ValidationError} If validation fails
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operation fails
 * @example
 * const updatedPrefs = await updateNotificationPreferences(
 *   "507f1f77bcf86cd799439011",
 *   { orderUpdates: { email: true, sms: false } }
 * );
 */
async function updateNotificationPreferences(buyerId, preferences) {
  // Step 1: Validate the input data using the validator
  // This ensures buyerId and preferences meet all requirements
  await updateNotificationPreferencesValidator.validateUpdateNotificationPreferencesData(buyerId, preferences);
  
  // Step 2: Get the current buyer with notification preferences from the database
  // This retrieves the existing preferences that we'll merge with
  const buyer = await buyerRepository.findBuyerWithNotificationPreferences(buyerId);
  
  // Step 3: Check if buyer exists in the database
  // This prevents updates to non-existent buyers
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }
  
  // Step 4: Deep merge the new preferences with existing ones
  // This ensures we don't lose any existing settings while updating with new ones
  const mergedPreferences = deepMergeNotificationPreferences(
    buyer.notificationPreferences,
    preferences
  );

  // Step 5: Update the buyer's notification preferences in the database
  // This persists the merged preferences to the database
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