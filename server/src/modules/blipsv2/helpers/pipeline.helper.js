class PipelineHelper {
  /**
   * Builds the primary match stage for filtering products with blips
   * This is the base filter that ensures products have blips and are not drafts
   * @returns {Object} MongoDB match stage object
   */
  buildPrimaryMatchStage() {
    return {
      $and: [
        { 'blips.0': { $exists: true } },
        { blips: { $elemMatch: { processed: true } } },
        { status: { $ne: 'draft' } },
        {
          $or: [
            { status: { $ne: 'offline_auction' } },
            {
              $and: [
                { status: 'offline_auction' },
                { 'auction.status': { $ne: 'ended' } },
                { 'auction.endDate': { $gt: new Date() } }
              ]
            }
          ]
        }
      ]
    };
  }

  /**
   * Builds a category-enhanced match stage that prioritizes buyer's selected categories
   * This allows us to filter products based on buyer's category preferences
   * @param {Array<string>} categoryNames - Array of category names from buyer's selected categories
   * @returns {Object} MongoDB match stage object with category filter
   */
  buildCategoryEnhancedMatchStage(categoryNames = []) {
    const baseMatch = this.buildPrimaryMatchStage();
    
    // If no categories provided, return the base match
    if (!categoryNames || categoryNames.length === 0) {
      return baseMatch;
    }

    // Add category filter to the base match
    // Products with matching categories will be prioritized
    return {
      $and: [
        ...baseMatch.$and,
        { category: { $in: categoryNames } }
      ]
    };
  }

  /**
   * Builds a fallback match stage when primary stage returns no results
   * This is a more lenient filter
   * @returns {Object} MongoDB match stage object
   */
  buildFallbackMatchStage() {
    return {
      'blips.0': { $exists: true },
      status: 'active'
    };
  }

  /**
   * Builds a category-enhanced fallback match stage
   * Used when the primary category-enhanced query returns no results
   * @param {Array<string>} categoryNames - Array of category names from buyer's selected categories
   * @returns {Object} MongoDB match stage object with category filter
   */
  buildCategoryEnhancedFallbackMatchStage(categoryNames = []) {
    const baseMatch = this.buildFallbackMatchStage();
    
    // If no categories provided, return the base match
    if (!categoryNames || categoryNames.length === 0) {
      return baseMatch;
    }

    // Add category filter to the fallback match
    return {
      ...baseMatch,
      category: { $in: categoryNames }
    };
  }

  buildCommonPipeline(poolSize) {
    const now = new Date();
    return [
      {
        $addFields: {
          randomScore: { $rand: {} },
          daysSinceCreation: {
            $divide: [
              { $subtract: [now, { $ifNull: ["$blips.createdAt", now] }] },
              1000 * 60 * 60 * 24
            ]
          },
          engagementScore: {
            $add: [
              { $ifNull: ["$blips.viewCount", 0] },
              { $multiply: [{ $ifNull: ["$blips.likesCount", 0] }, 5] },
              { $multiply: [{ $ifNull: ["$blips.commentsCount", 0] }, 10] }
            ]
          }
        }
      },
      { $sort: { randomScore: -1 } },
      { $limit: poolSize },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          stock: 1,
          status: 1,
          category: 1,
          subCategory: 1,
          seller: 1,
          discount: 1,
          auction: 1,
          images: { $arrayElemAt: ["$images.url", 0] },
          blip: "$blips",
          reviews: 1,
          createdAt: 1,
          daysSinceCreation: 1,
          engagementScore: 1
        }
      }
    ];
  }

  buildPrimaryPipeline(primaryMatchStage, seenBlipObjectIds, commonPipeline) {
    const exclusionMatchStage = seenBlipObjectIds.length > 0 ? { $match: { 'blips._id': { $nin: seenBlipObjectIds } } } : null;
    
    const pipeline = [
      { $match: primaryMatchStage },
      { $unwind: "$blips" },
      { $match: { "blips.processed": true } },
      ...(exclusionMatchStage ? [exclusionMatchStage] : []),
      ...commonPipeline
    ];

    return { pipeline, exclusionMatchStage };
  }

  buildFallbackPipeline(fallbackMatchStage, seenBlipObjectIds, commonPipeline) {
    const exclusionMatchStage = seenBlipObjectIds.length > 0 ? { $match: { 'blips._id': { $nin: seenBlipObjectIds } } } : null;
    
    const pipeline = [
      { $match: fallbackMatchStage },
      { $unwind: "$blips" },
      ...(exclusionMatchStage ? [exclusionMatchStage] : []),
      ...commonPipeline
    ];

    return { pipeline, exclusionMatchStage };
  }

  buildSimpleFallbackPipeline(fallbackMatchStage, commonPipeline) {
    return [
      { $match: fallbackMatchStage },
      { $unwind: "$blips" },
      ...commonPipeline
    ];
  }
}

module.exports = new PipelineHelper();
