const savedBlipRepository = require('../repositories/savedBlip.repository');
const productRepository = require('../repositories/product.repository');

/**
 * Service: Save a blip for a buyer.
 * Validates blip existence and creates a SavedBlip record (idempotent).
 */
class SaveBlipService {
  /**
   * Execute the save action using request context.
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

    // First validate the blip existence regardless of processed/status
    const productAny = await productRepository.findProductContainingBlipAnyStatus(blipId);
    if (!productAny) {
      const err = new Error('Blip not found');
      err.statusCode = 404;
      throw err;
    }

    // Validate the specific blip exists (can be saved whether processed or not)
    const candidateBlip = productAny.blips.id(blipId);
    if (!candidateBlip) {
      const err = new Error('Blip not found');
      err.statusCode = 404;
      throw err;
    }

    // Validate product active status
    if (productAny.status !== 'active') {
      const err = new Error('Product not active');
      err.statusCode = 400;
      throw err;
    }

    // Idempotent create: if exists, do nothing
    const alreadySaved = await savedBlipRepository.exists(buyerId, blipId);
    if (alreadySaved) {
      return { created: false, message: 'Blip already saved' };
    }

    await savedBlipRepository.create(buyerId, productAny._id, blipId);
    return { created: true, message: 'Blip saved successfully' };
  }
}

module.exports = new SaveBlipService();


