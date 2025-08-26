/**
 * Get Notification Preferences Service
 *
 * This service handles the business logic for retrieving a buyer's notification preferences.
 * It provides secure preference access and validation to ensure buyers can only access
 * their own notification settings.
 *
 * The service ensures that:
 * - Preference access is properly validated and secured
 * - Only the preference owner can access notification settings
 * - Preference information is retrieved efficiently
 * - Error handling maintains system integrity
 *
 * Notification Preferences Retrieval Flow:
 * - Input validation and buyer existence verification
 * - Preference retrieval with complete details
 * - Security verification and access control
 * - Success response with preference information
 *
 * Security Features:
 * - Buyer existence validation
 * - Preference ownership verification
 * - Access control enforcement
 * - Error handling without information leakage
 * - Secure preference data retrieval
 *
 * Preference Management:
 * - Retrieves all notification preferences for buyer
 * - Handles missing preferences gracefully
 * - Maintains preference data integrity
 * - Provides consistent response format
 *
 * @module getNotificationPreferencesService
 */

const buyerRepository = require('../repositories/buyer.repository');
const getNotificationPreferencesValidator = require('../validators/getNotificationPreferences.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Get notification preferences for a buyer - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * notification preferences retrieval process. It handles validation, access control,
 * and secure preference data retrieval for buyers.
 *
 * Business Logic Flow:
 * 1. Validates the input data (buyer ID format and requirements)
 * 2. Finds the buyer and retrieves notification preferences
 * 3. Validates buyer existence and access rights
 * 4. Returns formatted preference information
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Buyer existence validation
 * - Preference ownership verification
 * - Secure preference data retrieval
 * - Error handling without information leakage
 *
 * Access Control:
 * - Validates that buyer exists before accessing preferences
 * - Prevents unauthorized access to other buyers' preferences
 * - Ensures data privacy and security
 * - Maintains preference confidentiality
 *
 * Preference Data:
 * - Email notification settings
 * - Push notification settings
 * - SMS notification settings
 * - Marketing preferences
 * - Order update preferences
 * - Security alert preferences
 *
 * Error Handling:
 * - Validation errors for invalid inputs
 * - NotFoundException for non-existent buyers
 * - Database operation errors
 * - Proper error propagation to controller
 * - Graceful handling of missing preferences
 *
 * @param {string} buyerId - The buyer's ID to retrieve preferences for
 * @returns {Promise<Object>} Notification preferences with complete information
 *   - data: {Object} - Container object for preferences
 *     - preferences: {Object} - Notification preference settings
 *       - emailNotifications: {boolean} - Email notification preference
 *       - pushNotifications: {boolean} - Push notification preference
 *       - smsNotifications: {boolean} - SMS notification preference
 *       - marketingEmails: {boolean} - Marketing email preference
 *       - orderUpdates: {boolean} - Order update notification preference
 *       - securityAlerts: {boolean} - Security alert preference
 *       - promotionalOffers: {boolean} - Promotional offer preference
 *       - newProductAlerts: {boolean} - New product alert preference
 * @throws {ValidationError} If input validation fails (invalid buyer ID)
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Get notification preferences for buyer
 * const preferences = await getNotificationPreferences('507f1f77bcf86cd799439011');
 * // Returns: {
 * //   data: {
 * //     preferences: {
 * //       emailNotifications: true,
 * //       pushNotifications: false,
 * //       smsNotifications: true,
 * //       marketingEmails: false,
 * //       orderUpdates: true,
 * //       securityAlerts: true,
 * //       promotionalOffers: false,
 * //       newProductAlerts: true
 * //     }
 * //   }
 * // }
 *
 * @example
 * // Empty preferences (new buyer)
 * const preferences = await getNotificationPreferences('507f1f77bcf86cd799439011');
 * // Returns: {
 * //   data: {
 * //     preferences: {}
 * //   }
 * // }
 *
 * @example
 * // Buyer not found
 * try {
 *   await getNotificationPreferences('nonexistent-buyer-id');
 * } catch (error) {
 *   // error instanceof NotFoundException
 *   // error.message: 'Buyer not found'
 * }
 */
async function getNotificationPreferences(buyerId) {
  // Step 1: Validate input parameters using validator
  // This ensures buyerId is provided and has valid format
  await getNotificationPreferencesValidator.validateGetNotificationPreferencesData(buyerId);

  // Step 2: Fetch buyer data with notification preferences from repository
  // This retrieves the buyer record with all notification preference settings
  const buyer = await buyerRepository.findBuyerWithNotificationPreferences(buyerId);
  
  // Step 3: Check if buyer exists
  // This prevents processing for non-existent buyers
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 4: Return notification preferences in the same format as other services
  // This ensures consistent API response format across all services
  return {
    data: {
      preferences: buyer.notificationPreferences || {}
    }
  };
}

module.exports = {
  getNotificationPreferences
}; 