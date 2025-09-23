const Buyer = require('../../../models/Buyer');

/**
 * Repository for Buyer data access used by Admin v2 module.
 */

/**
 * Find a buyer by id.
 * @param {string} buyerId
 * @returns {Promise<import('../../../models/Buyer')|null>}
 */
async function findBuyerById(buyerId) {
  return Buyer.findById(buyerId);
}

/**
 * Apply anonymized soft-delete updates to a buyer.
 * @param {string} buyerId
 * @param {object} updates
 * @returns {Promise<any>}
 */
async function applyAnonymizedDeletion(buyerId, updates) {
  return Buyer.updateOne({ _id: buyerId }, { $set: updates });
}

/**
 * Permanently delete a buyer document.
 * @param {string} buyerId
 * @returns {Promise<{ acknowledged: boolean, deletedCount: number }>} 
 */
async function deleteBuyerById(buyerId) {
  return Buyer.deleteOne({ _id: buyerId });
}

module.exports = {
  findBuyerById,
  applyAnonymizedDeletion,
  deleteBuyerById,
};


