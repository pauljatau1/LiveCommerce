const savedBlipRepository = require('../repositories/savedBlip.repository');

/**
 * Service: Unsave a blip for a buyer.
 * Idempotent: if not saved, succeeds with no effect.
 */
class UnsaveBlipService {
  /**
   * Execute the unsave action using request context.
   * @param {import('express').Request} req
   */
  async execute(req) {
    const buyerId = req.user?.id;
    const { blipId } = req.params;

    if (!buyerId) {
      const err = new Error('Unauthorized');
      err.statusCode = 401;
      throw err;
    }

    const result = await savedBlipRepository.delete(buyerId, blipId);
    const removed = (result?.deletedCount || 0) > 0;
    return { removed, message: removed ? 'Blip unsaved successfully' : 'Blip was not saved' };
  }
}

module.exports = new UnsaveBlipService();


