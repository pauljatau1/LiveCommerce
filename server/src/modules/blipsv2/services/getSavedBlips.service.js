const savedBlipRepository = require('../repositories/savedBlip.repository');
const productRepository = require('../repositories/product.repository');
const transformationHelper = require('../helpers/transformation.helper');
const Seller = require('../../../models/Seller');

/**
 * Service: Retrieve paginated saved blips for a buyer.
 * Returns the same blip shape used by other blips endpoints for consistency.
 */
class GetSavedBlipsService {
  /**
   * @param {import('express').Request} req
   */
  async execute(req) {
    const buyerId = req.user?.id;
    if (!buyerId) {
      const err = new Error('Unauthorized');
      err.statusCode = 401;
      throw err;
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);

    const { items, total } = await savedBlipRepository.getByBuyerPaginated(buyerId, page, limit);

    // Fetch buyer to compute followed seller IDs as a fallback for follow state
    let followedSellers = [];
    try {
      const buyerDoc = await productRepository.findBuyerById(buyerId);
      if (buyerDoc && Array.isArray(buyerDoc.followers)) {
        followedSellers = buyerDoc.followers
          .map(f => f.sellerId?.toString())
          .filter(Boolean);
      }
    } catch (_) {
      // ignore errors fetching buyer; follow state will rely on seller.followers if available
    }

    // Also gather followed sellers directly from Seller model as a source of truth
    // This ensures accuracy even if buyer.followers is stale
    let followedSellersFromSellerSide = [];
    try {
      const sellerDocs = await Seller.find({ 'followers.buyerId': buyerId })
        .select('_id')
        .lean();
      followedSellersFromSellerSide = sellerDocs.map(d => d._id.toString());
    } catch (_) {
      // ignore errors; we'll fall back to buyer-followers-only computation
    }

    const followedSellerIdSet = new Set([
      ...followedSellers,
      ...followedSellersFromSellerSide
    ]);

    // For each saved item, fetch the product (any status/processed) and pick the specific blip subdocument
    const productsWithSingleBlip = [];
    for (const saved of items) {
      const product = await productRepository.findProductWithBlipAnyStatus(saved.blipId);
      if (!product) {
        // Blip or product might have become inactive; skip silently
        continue;
      }
      const blip = product.blips.id(saved.blipId);
      if (!blip) continue;

      // Attach a single blip field for transformation helper
      productsWithSingleBlip.push({
        ...product.toObject(),
        blip
      });
    }

    // Transform to standardized response
    const isAuthenticated = true;
    const blips = transformationHelper.transformProductsToBlips(
      productsWithSingleBlip,
      buyerId,
      isAuthenticated,
      Array.from(followedSellerIdSet)
    );

    // Align structure with other endpoints by removing internal metadata
    blips.forEach(b => { if (b && b._metadata) delete b._metadata; });

    // Ensure isFollowing is correct using buyer's followed sellers list as source of truth
    if (Array.isArray(blips) && followedSellerIdSet.size > 0) {
      for (const b of blips) {
        if (b?.seller?._id) {
          const sellerIdStr = b.seller._id.toString();
          if (followedSellerIdSet.has(sellerIdStr)) {
            b.seller.isFollowing = true;
          }
        }
      }
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { blips, currentPage: page, totalPages, totalBlips: total };
  }
}

module.exports = new GetSavedBlipsService();


