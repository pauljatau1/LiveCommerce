const productRepository = require('../repositories/product.repository');
const transformationHelper = require('../helpers/transformation.helper');

class GetBlipsByRandomCategoryService {
  async execute(req) {
    // Parse pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 12);

    // Auth context (optional)
    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

    // Load buyer preferences if available
    let buyerCategories = [];
    if (isAuthenticated) {
      try {
        const buyer = await productRepository.findBuyerByIdWithCategories(buyerId);
        if (buyer?.selectedCategories?.length) {
          buyerCategories = buyer.selectedCategories.reduce((acc, cat) => {
            acc.push(cat.name);
            if (Array.isArray(cat.subCategories)) acc.push(...cat.subCategories.map(s => s.name));
            return acc;
          }, []);
        }
      } catch (e) {
        console.log('[RANDOM CATEGORY] Failed to load buyer categories:', e.message);
      }
    }

    // Base matches shared by queries
    const basePrimaryMatch = {
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

    const baseFallbackMatch = {
      'blips.0': { $exists: true },
      status: { $in: ['active', 'pending'] }
    };

    // Find a random category with at least 6 processed blips
    const categoryAgg = async (preferBuyerCategories) => {
      const extraMatch = preferBuyerCategories && buyerCategories.length > 0
        ? { category: { $in: buyerCategories } }
        : {};

      const pipeline = [
        { $match: Object.keys(extraMatch).length ? { $and: [basePrimaryMatch, extraMatch] } : basePrimaryMatch },
        { $unwind: '$blips' },
        { $match: { 'blips.processed': true } },
        { $group: { _id: '$category', blipCount: { $sum: 1 } } },
        { $match: { _id: { $ne: null }, blipCount: { $gte: 6 } } },
        { $addFields: { randomScore: { $rand: {} } } },
        { $sort: { randomScore: -1 } },
        { $limit: 1 }
      ];
      try {
        return await productRepository.aggregateProducts(pipeline);
      } catch (e) {
        console.error('[RANDOM CATEGORY] Category aggregation error:', e.message);
        return [];
      }
    };

    // Try buyer-preferred categories first (if any), otherwise global
    let selectedCategoryDoc = null;
    if (buyerCategories.length > 0) {
      const pref = await categoryAgg(true);
      if (pref && pref.length > 0) selectedCategoryDoc = pref[0];
    }
    if (!selectedCategoryDoc) {
      const any = await categoryAgg(false);
      if (any && any.length > 0) selectedCategoryDoc = any[0];
    }

    // If still none, fallback to a looser active/pending pool
    if (!selectedCategoryDoc) {
      const fallbackPipeline = [
        { $match: baseFallbackMatch },
        { $unwind: '$blips' },
        { $group: { _id: '$category', blipCount: { $sum: 1 } } },
        { $match: { _id: { $ne: null }, blipCount: { $gte: 6 } } },
        { $addFields: { randomScore: { $rand: {} } } },
        { $sort: { randomScore: -1 } },
        { $limit: 1 }
      ];
      const anyFallback = await productRepository.aggregateProducts(fallbackPipeline);
      if (anyFallback && anyFallback.length > 0) selectedCategoryDoc = anyFallback[0];
    }

    // If we still don't have a category, return empty
    if (!selectedCategoryDoc || !selectedCategoryDoc._id) {
      return {
        blips: [],
        selectedCategory: null,
        currentPage: page,
        totalPages: 0,
        totalBlips: 0
      };
    }

    const selectedCategory = selectedCategoryDoc._id;

    // With the category chosen, fetch a pool of blips under it
    const now = new Date();
    const poolLimit = Math.max(limit * 3, 24);
    const categoryMatch = {
      $and: [ basePrimaryMatch, { category: selectedCategory } ]
    };

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
      { $match: categoryMatch },
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

    let products = await productRepository.aggregateProducts(primaryPipeline);

    if (products.length === 0) {
      // Fallback to more relaxed product state
      const fallbackPipeline = [
        { $match: { $and: [ baseFallbackMatch, { category: selectedCategory } ] } },
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
      products = await productRepository.aggregateProducts(fallbackPipeline);
    }

    if (products.length > 0) {
      await productRepository.populateSellerInfo(products);
    }

    if (products.length === 0) {
      return {
        blips: [],
        selectedCategory,
        currentPage: page,
        totalPages: 0,
        totalBlips: 0
      };
    }

    const transformed = transformationHelper.transformProductsToBlips(
      products,
      buyerId,
      isAuthenticated,
      []
    );

    // Simple pagination of the pool
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageItems = transformed.slice(start, end);

    return {
      blips: pageItems,
      selectedCategory,
      currentPage: page,
      totalPages: Math.ceil(transformed.length / limit),
      totalBlips: transformed.length
    };
  }
}

module.exports = new GetBlipsByRandomCategoryService();


