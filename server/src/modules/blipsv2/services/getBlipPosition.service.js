const mongoose = require('mongoose');
const productRepository = require('../repositories/product.repository');

/**
 * Service: GetBlipPositionService
 * Determines the position of a blip within the default "new blips" feed ordering.
 *
 * Why: Consumers sometimes need to know where a specific blip would appear in the main feed
 * to enable deep-linking and navigation. We reproduce the exact match and sort logic used by
 * the New Blips feed (minus session-based exclusions) and compute the global index.
 */
class GetBlipPositionService {
  /**
   * Executes the position computation.
   *
   * Input validation:
   * - Validates `blipId` is a valid Mongo ObjectId.
   * - Parses `limit` (page size) from query with safe defaults.
   *
   * Algorithm rationale (updated per spec):
   * - Sort strictly by `blips.createdAt` descending (newest first). For deterministic order,
   *   use `blips._id` as a secondary descending sort when createdAt ties.
   * - Unwind blips to treat each blip as a separate feed item.
   * - Keep basic product visibility constraints (exclude drafts and ended offline auctions),
   *   but do not apply session-based or engagement-based ordering.
   * - Project only blip ids for minimal memory usage during index lookup.
   * - Compute total blips count with a lightweight aggregation.
   *
   * Returns page as 1-based and index (1-based) within that page.
   */
  async execute(req) {
    const { blipId } = req.params;
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);

    if (!mongoose.Types.ObjectId.isValid(blipId)) {
      return { error: 'Invalid blipId', statusCode: 400 };
    }

    // Match stage mirrors the primary match in the New Blips feed service.
    const primaryMatchStage = {
      $and: [
        { 'blips.0': { $exists: true } },
        { status: { $ne: 'draft' } },
        {
          $or: [
            { status: { $ne: 'offline_auction' } },
            { $and: [ { status: 'offline_auction' }, { 'auction.status': { $ne: 'ended' } } ] }
          ]
        }
      ]
    };

    // Build the aggregation that yields ordered blip ids only
    // Include both processed and unprocessed blips, handle null createdAt values
    const idOnlyPipeline = [
      { $match: primaryMatchStage },
      { $unwind: '$blips' },
      {
        $addFields: {
          // Fallback to product createdAt if blip createdAt is null/undefined
          blipCreatedAt: { $ifNull: ['$blips.createdAt', '$createdAt'] }
        }
      },
      {
        $sort: {
          blipCreatedAt: -1,
          'blips._id': -1
        }
      },
      { $project: { _id: 0, blipId: '$blips._id' } }
    ];

    // Compute the total number of blips in this feed (both processed and unprocessed)
    const countPipeline = [
      { $match: primaryMatchStage },
      { $unwind: '$blips' },
      { $count: 'total' }
    ];

    const [orderedIds, totalResult] = await Promise.all([
      productRepository.aggregateProducts(idOnlyPipeline),
      productRepository.aggregateProducts(countPipeline)
    ]);

    const totalBlips = (totalResult && totalResult[0] && totalResult[0].total) || 0;
    if (totalBlips === 0) {
      return { error: 'Feed is empty', statusCode: 404 };
    }

    // Find the index of the target blip
    const targetIdStr = String(blipId);
    let globalIndex = -1;
    for (let i = 0; i < orderedIds.length; i += 1) {
      if (String(orderedIds[i].blipId) === targetIdStr) {
        globalIndex = i;
        break;
      }
    }

    if (globalIndex === -1) {
      // Blip not present in feed (could be unprocessed, filtered, or non-existent)
      return { error: 'Blip not found in feed', statusCode: 404 };
    }

    const page = Math.floor(globalIndex / limit) + 1; // 1-based page
    const index = (globalIndex % limit) + 1; // 1-based index within page

    return { page, index, totalBlips };
  }
}

module.exports = new GetBlipPositionService();


