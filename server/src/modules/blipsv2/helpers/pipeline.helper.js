class PipelineHelper {
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

  buildFallbackMatchStage() {
    return {
      'blips.0': { $exists: true },
      status: 'active'
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
