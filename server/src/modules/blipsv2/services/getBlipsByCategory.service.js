const productRepository = require('../repositories/product.repository');
const transformationHelper = require('../helpers/transformation.helper');

class GetBlipsByCategoryService {
  async execute(req) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 12);
    const categoryParam = (req.query.category || req.params?.category || '').trim();

    if (!categoryParam) {
      return {
        blips: [],
        currentPage: 1,
        totalPages: 0,
        totalBlips: 0,
        error: 'category is required'
      };
    }

    // Auth context for isLiked/isFollowing enrichments
    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

    // Case-insensitive match against category or subCategory strings
    const categoryRegex = new RegExp(`^${this.escapeRegex(categoryParam)}$`, 'i');

    const primaryMatch = {
      $and: [
        { 'blips.0': { $exists: true } },
        { status: { $ne: 'draft' } },
        {
          $or: [
            { status: { $ne: 'offline_auction' } },
            { $and: [ { status: 'offline_auction' }, { 'auction.status': { $ne: 'ended' } } ] }
          ]
        },
        {
          $or: [
            { category: categoryRegex },
            { subCategory: categoryRegex }
          ]
        }
      ]
    };

    const fallbackMatch = {
      'blips.0': { $exists: true },
      status: { $in: ['active', 'pending'] },
      $or: [
        { category: categoryRegex },
        { subCategory: categoryRegex }
      ]
    };

    const now = new Date();
    const poolLimit = Math.max(limit * 3, 24);

    const scoringStages = [
      {
        $addFields: {
          blip: '$blips',
          viewCount: { $ifNull: ['\u0024blips.viewCount', 0] },
          likesCount: { $ifNull: ['\u0024blips.likesCount', 0] },
          commentsCount: { $ifNull: ['\u0024blips.commentsCount', 0] },
          daysSinceCreation: {
            $divide: [ { $subtract: [now, { $ifNull: ['\u0024blips.createdAt', now] }] }, 1000 * 60 * 60 * 24 ]
          },
          randomScore: { $rand: {} },
          engagementScore: {
            $add: [
              { $multiply: ['\u0024viewCount', 1] },
              { $multiply: ['\u0024likesCount', 5] },
              { $multiply: ['\u0024commentsCount', 10] }
            ]
          }
        }
      }
    ];

    const primaryPipeline = [
      { $match: primaryMatch },
      { $unwind: '$blips' },
      { $match: { 'blips.processed': true } },
      ...scoringStages,
      { $sort: { engagementScore: -1, daysSinceCreation: 1, randomScore: -1 } },
      { $limit: poolLimit },
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
          images: { $arrayElemAt: ['$images.url', 0] },
          blip: '$blips',
          reviews: 1,
          createdAt: 1,
          daysSinceCreation: 1,
          engagementScore: 1
        }
      }
    ];

    let products;
    try {
      products = await productRepository.aggregateProducts(primaryPipeline);
    } catch (e) {
      console.error('[BLIPS BY CATEGORY] Primary pipeline error:', e.message);
      products = [];
    }

    if (!products || products.length === 0) {
      const fallbackPipeline = [
        { $match: fallbackMatch },
        { $unwind: '$blips' },
        ...scoringStages,
        { $sort: { engagementScore: -1, daysSinceCreation: 1, randomScore: -1 } },
        { $limit: poolLimit },
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
            images: { $arrayElemAt: ['$images.url', 0] },
            blip: '$blips',
            reviews: 1,
            createdAt: 1,
            daysSinceCreation: 1,
            engagementScore: 1
          }
        }
      ];

      try {
        products = await productRepository.aggregateProducts(fallbackPipeline);
      } catch (e) {
        console.error('[BLIPS BY CATEGORY] Fallback pipeline error:', e.message);
        products = [];
      }
    }

    if (products.length > 0) {
      await productRepository.populateSellerInfo(products);
    }

    if (!products || products.length === 0) {
      return {
        blips: [],
        currentPage: page,
        totalPages: 0,
        totalBlips: 0
      };
    }

    // Transform to response DTO
    const transformed = transformationHelper.transformProductsToBlips(
      products,
      buyerId,
      isAuthenticated,
      []
    );

    // Simple pagination from the pool
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageItems = transformed.slice(start, end);

    return {
      blips: pageItems,
      currentPage: page,
      totalPages: Math.ceil(transformed.length / limit),
      totalBlips: transformed.length
    };
  }

  escapeRegex(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = new GetBlipsByCategoryService();


