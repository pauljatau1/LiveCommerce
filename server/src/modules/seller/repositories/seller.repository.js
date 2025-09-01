/**
 * Seller Repository
 *
 * This repository contains all database operations related to the Seller model.
 * It provides methods for finding, updating, and managing seller data.
 *
 * @module sellerRepository
 */

const Seller = require('../../../models/Seller');

/**
 * Retrieves all sellers that match the given filters.
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - MongoDB query filters
 * @returns {Promise<Array>} List of sellers excluding sensitive fields
 */
async function findAll(filters = {}) {
  return await Seller.find(filters).select('-__v -password'); // Exclude sensitive or unneeded fields
}

/**
 * Create a new seller.
 *
 * @param {Object} seller - new seller object
 * @returns {Promise<Seller>} The saved seller
 */
async function save(newSeller) {
  return await newSeller.save();
}

/**
 * Find a Seller by email.
 * @param {string} email 
 * @returns {Promise<Seller|null>}
 */
async function findByEmail(email) {
  return Seller.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
}

/**
 * Save a new Seller.
 * @param {Seller} sellerInstance
 * @returns {Promise<Seller>}
 */
async function saveSeller(sellerInstance) {
  return sellerInstance.save();
}

/**
 * Find a seller by ID.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<Seller|null>}
 */
async function findById(sellerId) {
  return Seller.findById(sellerId);
}

/**
 * Find a seller by ID with specific fields selected.
 * @param {string} sellerId - The seller's ID
 * @param {Object} fields - Object specifying which fields to include/exclude
 * @returns {Promise<Seller|null>}
 */
async function findByIdWithFields(sellerId, fields) {
  return Seller.findById(sellerId).select(fields).lean();
}

/**
 * Find a seller by Agora UID.
 * @param {number} agoraUid - The Agora UID to search for
 * @returns {Promise<Seller|null>}
 */
async function findByAgoraUid(agoraUid) {
  return Seller.findOne({ agoraUid });
}

/**
 * Update a seller by ID.
 * @param {string} sellerId - The seller's ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Seller|null>}
 */
async function findByIdAndUpdate(sellerId, updateData) {
  return Seller.findByIdAndUpdate(sellerId, updateData, { new: true });
}

/**
 * Delete a seller by ID.
 * @param {string} sellerId - The seller's ID
 * @returns {Promise<Seller|null>}
 */
async function findByIdAndDelete(sellerId) {
  return Seller.findByIdAndDelete(sellerId);
}

module.exports = {
  findAll,
  save,
  findByEmail,
  saveSeller,
  findById,
  findByIdWithFields,
  findByAgoraUid,
  findByIdAndUpdate,
  findByIdAndDelete
};
