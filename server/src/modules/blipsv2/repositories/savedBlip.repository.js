const mongoose = require('mongoose');
const SavedBlip = require('../models/savedBlip.model');

/**
 * Repository for SavedBlip operations. Encapsulates all DB interactions
 * for creating, reading, and deleting buyer-saved blips.
 */
class SavedBlipRepository {
  /**
   * Create a saved blip record for a buyer.
   * Ensures id values are stored as ObjectId.
   * @param {string|mongoose.Types.ObjectId} buyerId
   * @param {string|mongoose.Types.ObjectId} productId
   * @param {string|mongoose.Types.ObjectId} blipId
   * @returns {Promise<object>} SavedBlip document
   */
  async create(buyerId, productId, blipId) {
    const doc = new SavedBlip({
      buyerId: new mongoose.Types.ObjectId(buyerId),
      productId: new mongoose.Types.ObjectId(productId),
      blipId: new mongoose.Types.ObjectId(blipId)
    });
    return await doc.save();
  }

  /**
   * Check if a blip is saved by a buyer.
   * @param {string} buyerId
   * @param {string} blipId
   * @returns {Promise<boolean>}
   */
  async exists(buyerId, blipId) {
    const count = await SavedBlip.countDocuments({ buyerId, blipId });
    return count > 0;
  }

  /**
   * Delete a saved blip for a buyer.
   * @param {string} buyerId
   * @param {string} blipId
   * @returns {Promise<{deletedCount:number}>}
   */
  async delete(buyerId, blipId) {
    return await SavedBlip.deleteOne({ buyerId, blipId });
  }

  /**
   * Get paginated saved blips for a buyer, newest first.
   * @param {string} buyerId
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<{items:Array, total:number, page:number, limit:number}>}
   */
  async getByBuyerPaginated(buyerId, page, limit) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      SavedBlip.find({ buyerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SavedBlip.countDocuments({ buyerId })
    ]);

    return { items, total, page, limit };
  }
}

module.exports = new SavedBlipRepository();


