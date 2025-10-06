class PipelineHelper {
  /**
   * Builds the primary match stage for blip queries
   * This filters products to only those with valid, processed blips
   * and excludes draft products and ended offline auctions
   * 
   * @param {Array<String>} categoryNames - Optional array of category names to filter by
   * @param {Array<String>} subCategoryNames - Optional array of subcategory names to filter by
   * @returns {Object} MongoDB match stage object
   */
  buildPrimaryMatchStage(categoryNames = null, subCategoryNames = null) {
    // Base match conditions that always apply
    const baseConditions = [
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
    ];

    // Add category filtering if categories are provided (for personalized blips)
    if (categoryNames && categoryNames.length > 0) {
      // Create an array to hold category/subcategory conditions
      const categoryConditions = [];
      
      // If we have both categories and subcategories, create flexible matching
      if (subCategoryNames && subCategoryNames.length > 0) {
        // Match products that are either:
        // 1. In one of the selected categories (regardless of subcategory)
        // 2. In one of the selected subcategories (regardless of category)
        categoryConditions.push(
          { category: { $in: categoryNames } }
        );
        categoryConditions.push(
          { subCategory: { $in: subCategoryNames } }
        );
      } else {
        // Only categories provided, match by category only
        categoryConditions.push(
          { category: { $in: categoryNames } }
        );
      }

      // Add the category conditions as an OR to the base conditions
      if (categoryConditions.length > 0) {
        baseConditions.push({
          $or: categoryConditions
        });
      }
    }

    return { $and: baseConditions };
  }

  /**
   * Builds a fallback match stage for when the primary pipeline returns no results
   * This uses simpler criteria to ensure we always have blips to show
   * 
   * @param {Array<String>} categoryNames - Optional array of category names to filter by
   * @param {Array<String>} subCategoryNames - Optional array of subcategory names to filter by
   * @returns {Object} MongoDB match stage object
   */
  buildFallbackMatchStage(categoryNames = null, subCategoryNames = null) {
    const matchConditions = {
      'blips.0': { $exists: true },
      status: 'active'
    };

    // Add category filtering for fallback as well if categories are provided
    // This ensures personalization is maintained even in fallback scenarios
    if (categoryNames && categoryNames.length > 0) {
      const categoryConditions = [];
      
      if (subCategoryNames && subCategoryNames.length > 0) {
        categoryConditions.push(
          { category: { $in: categoryNames } },
          { subCategory: { $in: subCategoryNames } }
        );
      } else {
        categoryConditions.push(
          { category: { $in: categoryNames } }
        );
      }

      // Add category filter as $or condition
      if (categoryConditions.length > 0) {
        matchConditions.$or = categoryConditions;
      }
    }

    return matchConditions;
  }

  /**
   * Builds a supplementary match stage that EXCLUDES buyer's selected categories
   * This is used when personalized content is insufficient - we supplement with
   * diverse content from OTHER categories to ensure a full, varied feed
   * 
   * Why exclude? If a buyer selects "Fashion" but there are only 2 Fashion blips,
   * we don't want to keep showing those 2. Instead, we show them different content
   * from Electronics, Home, Beauty, etc. to keep the feed interesting.
   * 
   * @param {Array<String>} categoryNames - Categories to EXCLUDE
   * @param {Array<String>} subCategoryNames - Subcategories to EXCLUDE
   * @returns {Object} MongoDB match stage object that excludes these categories
   */
  buildSupplementaryMatchStage(categoryNames = null, subCategoryNames = null) {
    // Base conditions for valid blips
    const baseConditions = [
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
    ];

    // EXCLUDE the buyer's selected categories to provide diverse content
    // This prevents showing the same limited content repeatedly
    if (categoryNames && categoryNames.length > 0) {
      const exclusionConditions = {
        $and: [
          { category: { $nin: categoryNames } }
        ]
      };

      // Also exclude the specific subcategories if provided
      if (subCategoryNames && subCategoryNames.length > 0) {
        exclusionConditions.$and.push(
          { subCategory: { $nin: subCategoryNames } }
        );
      }

      baseConditions.push(exclusionConditions);
    }

    return { $and: baseConditions };
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
