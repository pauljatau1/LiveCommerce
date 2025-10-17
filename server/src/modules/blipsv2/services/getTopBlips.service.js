const productRepository = require('../repositories/product.repository');
const transformationHelper = require('../helpers/transformation.helper');

class GetTopBlipsService {
  async execute(req) {
    // Parse pagination safely
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 12);

    // Auth and preference context
    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

    // Pull user categories and followed sellers for category-weighted results
    let buyerCategories = [];
    let followedSellers = [];
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
        if (Array.isArray(buyer?.followers) && buyer.followers.length > 0) {
          followedSellers = buyer.followers.map(f => f.sellerId.toString());
        }
      } catch (e) {
        // Non-fatal: proceed without preferences
        console.log('[TOP BLIPS] Failed to load buyer preferences:', e.message);
      }
    }

    // Build the aggregation focused on recent + high engagement
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

    // Primary: active products with processed blips, exclude ended offline auctions
    const primaryMatch = {
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

    // Fallback: any active/pending with any blip
    const fallbackMatch = {
      'blips.0': { $exists: true },
      status: { $in: ['active', 'pending'] }
    };

    // Engagement-weighted, with a strong recency component
    const computeScoringStages = [
      {
        $addFields: {
          blip: '$blips',
          viewCount: { $ifNull: ['\u0024blips.viewCount', 0] },
          likesCount: { $ifNull: ['\u0024blips.likesCount', 0] },
          commentsCount: { $ifNull: ['\u0024blips.commentsCount', 0] },
          blipCreatedAt: { $ifNull: ['\u0024blips.createdAt', '$createdAt'] },
          daysSinceCreation: {
            $divide: [ { $subtract: [now, { $ifNull: ['\u0024blips.createdAt', now] }] }, 1000 * 60 * 60 * 24 ]
          }
        }
      },
      {
        $addFields: {
          // Base engagement score (heavier on likes/comments)
          baseEngagementScore: {
            $add: [
              { $multiply: ['\u0024viewCount', 1] },
              { $multiply: ['\u0024likesCount', 6] },
              { $multiply: ['\u0024commentsCount', 12] }
            ]
          },
          // Recency boost (decays after 14 days)
          recencyBoost: {
            $cond: {
              if: { $gte: ['\u0024blips.createdAt', fourteenDaysAgo] },
              then: {
                $subtract: [
                  300,
                  { $multiply: [ { $min: ['\u0024daysSinceCreation', 14] }, 15 ] } // 300 -> 90 over 14d
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $addFields: {
          topScore: { $add: ['\u0024baseEngagementScore', '\u0024recencyBoost'] }
        }
      }
    ];

    // Category preference filter/boost for authenticated users
    const categoryPreferenceStage = isAuthenticated && buyerCategories.length > 0
      ? [{
          $addFields: {
            inPreferredCategory: {
              $or: [
                { $in: ['$category', buyerCategories] },
                { $in: ['$subCategory', buyerCategories] }
              ]
            },
            followedSellerBoost: {
              $cond: [ { $in: ['$seller', followedSellers.map(id => ({ $toObjectId: id }))] }, 200, 0 ]
            }
          }
        },
        {
          $addFields: {
            topScore: {
              $add: [
                '$topScore',
                { $cond: ['\u0024inPreferredCategory', 150, 0] },
                '$followedSellerBoost'
              ]
            }
          }
        }]
      : [];

    // Cap the pool before projection, then shuffle for variety within the score ordering
    const POOL_LIMIT = Math.max(limit * 3, 30);

    const primaryPipeline = [
      { $match: primaryMatch },
      { $unwind: '$blips' },
      { $match: { 'blips.processed': true } },
      ...computeScoringStages,
      ...categoryPreferenceStage,
      { $sort: { topScore: -1 } },
      { $limit: POOL_LIMIT },
      { $addFields: { randomScore: { $rand: {} } } },
      { $sort: { topScore: -1, randomScore: -1 } },
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
          baseEngagementScore: 1,
          recencyBoost: 1,
          topScore: 1
        }
      }
    ];

    let products;
    try {
      products = await productRepository.aggregateProducts(primaryPipeline);
    } catch (e) {
      console.error('[TOP BLIPS] Primary pipeline error:', e.message);
      products = [];
    }

    // Fallback: relax constraints, still rank by engagement + recency
    if (!products || products.length === 0) {
      const fallbackPipeline = [
        { $match: fallbackMatch },
        { $unwind: '$blips' },
        ...computeScoringStages,
        { $sort: { topScore: -1 } },
        { $limit: POOL_LIMIT },
        { $addFields: { randomScore: { $rand: {} } } },
        { $sort: { topScore: -1, randomScore: -1 } },
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
            baseEngagementScore: 1,
            recencyBoost: 1,
            topScore: 1
          }
        }
      ];
      try {
        products = await productRepository.aggregateProducts(fallbackPipeline);
      } catch (e) {
        console.error('[TOP BLIPS] Fallback pipeline error:', e.message);
        products = [];
      }
    }

    // Last-chance fallback: simple sort by likes/views if all else fails
    if (!products || products.length === 0) {
      const basicFallback = [
        { $match: { 'blips.0': { $exists: true } } },
        { $unwind: '$blips' },
        { $sort: { 'blips.likesCount': -1, 'blips.viewCount': -1, 'blips.createdAt': -1 } },
        { $limit: POOL_LIMIT },
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
            createdAt: 1
          }
        }
      ];
      try {
        products = await productRepository.aggregateProducts(basicFallback);
      } catch (e) {
        console.error('[TOP BLIPS] Basic fallback error:', e.message);
        products = [];
      }
    }

    // Populate seller info for output shape
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

    // Map to response DTO using shared transformer
    const transformedBlips = transformationHelper.transformProductsToBlips(
      products,
      buyerId,
      isAuthenticated,
      followedSellers
    );

    // Categorize for distribution: prioritize high engagement and preferred categories if logged in
    const categorized = {
      preferredHigh: [],    // in preferred category + high engagement
      followedSellers: [],
      highEngagement: [],
      recent: [],
      random: []
    };

    transformedBlips.forEach(b => {
      const meta = b._metadata || {};
      const inPreferred = isAuthenticated && buyerCategories.length > 0 && (
        buyerCategories.includes(b.category) || buyerCategories.includes(b.subCategory)
      );
      const isFollowingSeller = meta.isFollowingSeller;
      const engagementScore = meta.engagementScore || 0;
      const isRecent = (meta.daysSinceCreation || 999) <= 14;
      delete b._metadata;

      if (inPreferred && engagementScore > 100) {
        categorized.preferredHigh.push(b);
      } else if (isAuthenticated && isFollowingSeller) {
        categorized.followedSellers.push(b);
      } else if (engagementScore > 120) {
        categorized.highEngagement.push(b);
      } else if (isRecent) {
        categorized.recent.push(b);
      } else {
        categorized.random.push(b);
      }
    });

    // Shuffle each bucket
    transformationHelper.shuffleCategories(categorized);

    // Distribute with seller diversity and product dedupe
    const finalBlips = this.createTopDistribution(categorized, limit);

    return {
      blips: finalBlips,
      currentPage: page,
      totalPages: Math.ceil(products.length / limit),
      totalBlips: products.length
    };
  }

  createTopDistribution(categorizedBlips, totalNeeded) {
    const bucketsOrder = [
      'preferredHigh',
      'highEngagement',
      'followedSellers',
      'recent',
      'random'
    ];

    const pool = bucketsOrder.reduce((acc, key) => acc.concat(categorizedBlips[key] || []), []);

    // Group by seller for diversity
    const bySeller = {};
    for (const blip of pool) {
      const sellerId = blip.seller._id.toString();
      if (!bySeller[sellerId]) bySeller[sellerId] = [];
      bySeller[sellerId].push(blip);
    }

    const sellerIds = Object.keys(bySeller);
    const result = [];
    const seenProducts = new Set();
    let recentSellers = [];

    while (result.length < totalNeeded && sellerIds.length > 0) {
      let available = sellerIds.filter(id => !recentSellers.includes(id) && bySeller[id].length > 0);
      if (available.length === 0) {
        available = sellerIds.filter(id => bySeller[id].length > 0);
        recentSellers = [];
      }
      if (available.length === 0) break;

      const pickIndex = Math.floor(Math.random() * available.length);
      const sellerId = available[pickIndex];
      const blip = bySeller[sellerId].shift();

      if (!seenProducts.has(blip.productId.toString())) {
        result.push(blip);
        seenProducts.add(blip.productId.toString());
      }

      recentSellers.push(sellerId);
      if (recentSellers.length > Math.min(5, Math.ceil(sellerIds.length / 2))) {
        recentSellers.shift();
      }

      if (bySeller[sellerId].length === 0) {
        const idx = sellerIds.indexOf(sellerId);
        if (idx > -1) sellerIds.splice(idx, 1);
      }
    }

    return result;
  }
}

module.exports = new GetTopBlipsService();


