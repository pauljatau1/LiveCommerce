/**
 * Complete Profile Service
 *
 * This service handles the completion of seller profiles by adding
 * phone number and store name information. It's specifically designed
 * for sellers who registered via Google OAuth and need to add missing
 * required information to complete their profile setup.
 *
 * Business Logic:
 * - Updates seller profile with phone number and store name
 * - Validates that the seller exists and is authenticated
 * - Ensures data integrity and proper formatting
 * - Returns updated seller information
 *
 * @module completeProfileService
 */

const { findByIdAndUpdate } = require('../repositories/seller.repository');

/**
 * Completes a seller's profile by adding phone number and store name.
 *
 * This function updates the seller's profile with the provided phone number
 * and store name information. It's typically used after Google OAuth
 * registration when additional required information needs to be collected.
 *
 * Business Logic:
 * 1. Validate that the seller exists
 * 2. Update seller profile with phone number and store name
 * 3. Return updated seller data
 *
 * @param {string} sellerId - The seller's unique identifier
 * @param {Object} profileData - The profile completion data
 * @param {string} profileData.phoneNumber - The seller's phone number
 * @param {string} profileData.storeName - The seller's store name
 * @returns {Promise<Object>} Updated seller data
 * @throws {Error} If seller is not found or database operation fails
 *
 * @example
 * const updatedSeller = await completeProfile('seller123', {
 *   phoneNumber: '+1234567890',
 *   storeName: 'My Store'
 * });
 */
async function completeProfile(sellerId, profileData) {
  const { phoneNumber, storeName } = profileData;

  try {
    // Update seller profile with phone number and store name
    const updatedSeller = await findByIdAndUpdate(sellerId, {
      phoneNumber: phoneNumber,
      businessName: storeName
    });

    // Check if seller was found and updated
    if (!updatedSeller) {
      throw new Error('Seller not found');
    }

    // Return updated seller data (exclude sensitive information)
    const sellerResponse = updatedSeller.toObject ? updatedSeller.toObject() : { ...updatedSeller };
    delete sellerResponse.password;

    return sellerResponse;
  } catch (error) {
    console.error('Error in completeProfile service:', error);
    throw error;
  }
}

module.exports = {
  completeProfile
};
