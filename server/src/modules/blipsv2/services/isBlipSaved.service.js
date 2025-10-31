const savedBlipRepository = require('../repositories/savedBlip.repository');

/**
 * Service: Check if a blip is saved by the authenticated buyer.
 */
class IsBlipSavedService {
  /**
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

    const isSaved = await savedBlipRepository.exists(buyerId, blipId);
    return { isSaved };
  }
}

module.exports = new IsBlipSavedService();


