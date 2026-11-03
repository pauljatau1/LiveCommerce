/**
 * Seller Repository
 *
 * This repository contains all database operations related to the Seller model.
 * It provides a clean interface for database interactions and ensures
 * consistent data handling across the application.
 *
 * @module sellerRepository
 */

const Seller = require('../../../models/Seller');

/**
 * Retrieve all sellers with sensitive fields excluded.
 * @returns {Promise<Array>} Array of sellers without sensitive data
 */
async function findAll() {
  return Seller.find({}).select('-password -__v').lean();
}

/**
 * Save a new seller instance.
 * @param {Object} seller - Seller instance to save
 * @returns {Promise<Object>} Saved seller data
 */
async function save(seller) {
  return seller.save();
}

/**
 * Find seller by email (case insensitive).
 * @param {string} email - Email to search for
 * @returns {Promise<Object|null>} Seller data or null if not found
 */
async function findByEmail(email) {
  return Seller.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
}

/**
 * Save a seller instance.
 * @param {Object} seller - Seller instance to save
 * @returns {Promise<Object>} Saved seller data
 */
async function saveSeller(seller) {
  return seller.save();
}

/**
 * Find seller by ID.
 * @param {string} id - Seller ID
 * @returns {Promise<Object|null>} Seller data or null if not found
 */
async function findById(id) {
  return Seller.findById(id);
}

/**
 * Find seller by ID with specific fields selected.
 * @param {string} id - Seller ID
 * @param {Object} fields - Fields to select (1 for include, 0 for exclude)
 * @returns {Promise<Object|null>} Seller data with selected fields or null if not found
 */
async function findByIdWithFields(id, fields) {
  return Seller.findById(id).select(fields).lean();
}

/**
 * Find seller by Google ID.
 * @param {string} googleId - Google user ID
 * @returns {Promise<Object|null>} Seller data or null if not found
 */
async function findByGoogleId(googleId) {
  return Seller.findOne({ googleId });
}

/**
 * Find seller by Agora UID.
 * @param {number} agoraUid - Agora user ID
 * @returns {Promise<Object|null>} Seller data or null if not found
 */
async function findByAgoraUid(agoraUid) {
  return Seller.findOne({ agoraUid });
}

/**
 * Update seller by ID.
 * @param {string} id - Seller ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>} Updated seller data or null if not found
 */
async function findByIdAndUpdate(id, updateData) {
  return Seller.findByIdAndUpdate(id, updateData, { new: true });
}

/**
 * Delete seller by ID.
 * @param {string} id - Seller ID
 * @returns {Promise<Object|null>} Deleted seller data or null if not found
 */
async function findByIdAndDelete(id) {
  return Seller.findByIdAndDelete(id);
}

/**
 * Get the count of categories for a seller.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<number>} Number of categories for the seller
 */
async function getCategoriesCount(sellerId) {
  const seller = await Seller.findById(sellerId).select('categories');
  return seller?.categories?.length || 0;
}

/**
 * Find seller by phone number.
 * @param {string} phoneNumber - Phone number to search for
 * @returns {Promise<Object|null>} Seller data or null if not found
 */
async function findByPhoneNumber(phoneNumber) {
  return Seller.findOne({ phoneNumber: phoneNumber });
}

/**
 * Update seller's phone verification OTP.
 * @param {string} sellerId - Seller ID
 * @param {string} otp - Phone verification OTP
 * @param {Date} expiresAt - OTP expiration date
 * @returns {Promise<Object|null>} Updated seller data or null if not found
 */
async function updatePhoneVerificationOTP(sellerId, otp, expiresAt) {
  return Seller.findByIdAndUpdate(
    sellerId,
    {
      phoneVerificationOTP: otp,
      phoneVerificationOTPExpires: expiresAt
    },
    { new: true }
  );
}

/**
 * Verify seller's phone number and clear OTP.
 * @param {string} sellerId - Seller ID
 * @returns {Promise<Object|null>} Updated seller data or null if not found
 */
async function verifyPhoneNumber(sellerId) {
  return Seller.findByIdAndUpdate(
    sellerId,
    {
      isPhoneVerified: true,
      phoneVerificationOTP: undefined,
      phoneVerificationOTPExpires: undefined
    },
    { new: true }
  );
}

module.exports = {
  findAll,
  save,
  findByEmail,
  findByGoogleId,
  saveSeller,
  findById,
  findByIdWithFields,
  findByAgoraUid,
  findByIdAndUpdate,
  findByIdAndDelete,
  getCategoriesCount,
  findByPhoneNumber,
  updatePhoneVerificationOTP,
  verifyPhoneNumber
};
