const productRepository = require('../repositories/product.repository');
const sessionHelper = require('../helpers/session.helper');
const pipelineHelper = require('../helpers/pipeline.helper');
const transformationHelper = require('../helpers/transformation.helper');

class GetNewBlipsService {
  async execute(req) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // Generate or get session ID
    const sessionId = sessionHelper.generateSessionId(req);
    console.log(`🔍 [NEW BLIPS DEBUG] Session ID: ${sessionId}, Page: ${page}, Limit: ${limit}`);

    // Get or create session
    const { sessionData, seenBlipIds } = sessionHelper.getOrCreateSession(sessionId, page);
    
    console.log(`📝 [NEW BLIPS DEBUG] Current seen blips count: ${seenBlipIds.length}`);
    console.log(`📄 [NEW BLIPS DEBUG] Last page visited: ${sessionData.lastPage}, Current page: ${page}`);
    if (seenBlipIds.length > 0) {
      console.log(`📝 [NEW BLIPS DEBUG] First 5 seen blip IDs: ${seenBlipIds.slice(0, 5).join(', ')}`);
    }

    // Build match stages - more relaxed to ensure we get results
    const primaryMatchStage = {
      $and: [
        { 'blips.0': { $exists: true } },
        { status: { $ne: 'draft' } },
        {
          $or: [
            { status: { $ne: 'offline_auction' } },
            {
              $and: [
                { status: 'offline_auction' },
                { 'auction.status': { $ne: 'ended' } }
              ]
            }
          ]
        }
      ]
    };
    
    const fallbackMatchStage = {
      'blips.0': { $exists: true },
      status: { $in: ['active', 'pending'] }
    };

    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

    let followedSellers = [];

    if (isAuthenticated) {
      const buyer = await productRepository.findBuyerById(buyerId);

      if (buyer?.followers?.length > 0) {
        followedSellers = buyer.followers.map(f => f.sellerId.toString());
      }
    }

    // Validate and clean ObjectIds
    const { seenBlipObjectIds, validIds } = sessionHelper.validateAndCleanObjectIds(seenBlipIds);
    
    // Update session with cleaned IDs if needed
    if (validIds !== seenBlipIds) {
      sessionData.seenBlipIds = validIds;
    }

    // Hard cap: only most recent N blips
    const LATEST_CAP = 35;

    // Build a "newest-first" pipeline with focus on low-view blips
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    const newestFirstStages = [
      { $match: primaryMatchStage },
      { $unwind: "$blips" },
      // Prioritize processed blips but don't exclude unprocessed ones
      {
        $addFields: {
          isProcessed: { $ifNull: ["$blips.processed", false] },
          blipCreatedAt: { $ifNull: ["$blips.createdAt", "$createdAt"] },
          viewCount: { $ifNull: ["$blips.viewCount", 0] },
          isRecent: { $gte: ["$blips.createdAt", threeDaysAgo] },
          isLowView: { $lt: [{ $ifNull: ["$blips.viewCount", 0] }, 100] }
        }
      },
      // Exclude seen blips
      ...(seenBlipObjectIds.length > 0 ? [{ $match: { 'blips._id': { $nin: seenBlipObjectIds } } }] : []),
      // Sort by: recent first, then low-view, then processed, then by creation date
      {
        $sort: {
          isRecent: -1,
          isLowView: -1,
          isProcessed: -1,
          blipCreatedAt: -1
        }
      },
      { $limit: LATEST_CAP },
    ];

    // After limiting to the newest 35, compute fields and project for downstream transformation
    const finalizeStages = [
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
          },
          // Enhanced scoring for low-view and recent blips
          lowViewBonus: {
            $cond: {
              if: { $lt: [{ $ifNull: ["$blips.viewCount", 0] }, 50] },
              then: 100,
              else: {
                $cond: {
                  if: { $lt: [{ $ifNull: ["$blips.viewCount", 0] }, 100] },
                  then: 50,
                  else: 0
                }
              }
            }
          },
          recencyBonus: {
            $cond: {
              if: { $gte: ["$blips.createdAt", threeDaysAgo] },
              then: 200,
              else: {
                $cond: {
                  if: { $gte: ["$blips.createdAt", new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))] },
                  then: 100,
                  else: 0
                }
              }
            }
          }
        }
      },
      // Shuffle at DB-level for variety
      { $sort: { randomScore: -1 } },
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
          engagementScore: 1,
          lowViewBonus: 1,
          recencyBonus: 1
        }
      }
    ];

    console.log(`🔎 [NEW BLIPS DEBUG] Executing newest-first pipeline with ${seenBlipObjectIds.length} exclusions...`);
    let products;
    try {
      products = await productRepository.aggregateProducts([...newestFirstStages, ...finalizeStages]);
    } catch (dbError) {
      console.error(`❌ [NEW BLIPS DEBUG] Database error in newest-first pipeline:`, dbError.message);
      // Fallback to general active pool, still applying newest-first semantics
      const fallbackPipeline = [
        { $match: fallbackMatchStage },
        { $unwind: "$blips" },
        {
          $addFields: {
            isProcessed: { $ifNull: ["$blips.processed", false] },
            blipCreatedAt: { $ifNull: ["$blips.createdAt", "$createdAt"] },
            viewCount: { $ifNull: ["$blips.viewCount", 0] },
            isRecent: { $gte: ["$blips.createdAt", threeDaysAgo] },
            isLowView: { $lt: [{ $ifNull: ["$blips.viewCount", 0] }, 100] }
          }
        },
        ...(seenBlipObjectIds.length > 0 ? [{ $match: { 'blips._id': { $nin: seenBlipObjectIds } } }] : []),
        {
          $sort: {
            isRecent: -1,
            isLowView: -1,
            isProcessed: -1,
            blipCreatedAt: -1
          }
        },
        { $limit: LATEST_CAP },
        ...finalizeStages
      ];
      products = await productRepository.aggregateProducts(fallbackPipeline);
      console.log(`🔄 [NEW BLIPS DEBUG] Used fallback newest-first pipeline due to DB error`);
    }
    
    console.log(`📊 [NEW BLIPS DEBUG] Newest-first pipeline returned: ${products.length} products`);

    // If still no products, try the most basic query possible
    if (products.length === 0) {
      console.log('❌ [NEW BLIPS DEBUG] No products found, trying basic fallback...');
      const basicFallbackPipeline = [
        { $match: { 'blips.0': { $exists: true } } },
        { $unwind: "$blips" },
        ...(seenBlipObjectIds.length > 0 ? [{ $match: { 'blips._id': { $nin: seenBlipObjectIds } } }] : []),
        { $sort: { 'blips.createdAt': -1 } },
        { $limit: LATEST_CAP },
        ...finalizeStages
      ];
      products = await productRepository.aggregateProducts(basicFallbackPipeline);
      console.log(`📊 [NEW BLIPS DEBUG] Basic fallback returned: ${products.length} products`);
    }

    // Populate seller information
    await productRepository.populateSellerInfo(products);

    if (products.length === 0) {
      console.log('❌ [NEW BLIPS DEBUG] Still no products found after all fallbacks');
      return {
        blips: [],
        currentPage: page,
        totalPages: 0,
        totalBlips: 0,
        sessionId
      };
    }

    // Transform products to blips
    const transformedBlips = transformationHelper.transformProductsToBlips(
      products, 
      buyerId, 
      isAuthenticated, 
      followedSellers
    );

    // Enhanced categorization with focus on low-view and recent blips
    const categorizedBlips = {
      veryRecentLowView: [], // Less than 3 days old AND low view (< 50)
      recentLowView: [],     // Less than 7 days old AND low view (< 100)
      veryRecent: [],        // Less than 3 days old
      recent: [],            // 1-7 days old
      lowView: [],           // Low view regardless of age
      followedSellers: [],   // From followed sellers
      highEngagement: [],    // High engagement regardless of age
      random: []             // Everything else
    };

    transformedBlips.forEach(blip => {
      const meta = blip._metadata;
      delete blip._metadata;

      const daysSinceCreation = meta.daysSinceCreation || 0;
      const isFollowingSeller = meta.isFollowingSeller;
      const hasHighEngagement = meta.engagementScore > 50;
      const isLowView = (blip.blipEngagement.viewCount || 0) < 100;
      const isVeryLowView = (blip.blipEngagement.viewCount || 0) < 50;

      if (daysSinceCreation < 3 && isVeryLowView) {
        categorizedBlips.veryRecentLowView.push(blip);
      } else if (daysSinceCreation < 7 && isLowView) {
        categorizedBlips.recentLowView.push(blip);
      } else if (daysSinceCreation < 3) {
        categorizedBlips.veryRecent.push(blip);
      } else if (daysSinceCreation < 7) {
        categorizedBlips.recent.push(blip);
      } else if (isLowView) {
        categorizedBlips.lowView.push(blip);
      } else if (isAuthenticated && isFollowingSeller) {
        categorizedBlips.followedSellers.push(blip);
      } else if (hasHighEngagement) {
        categorizedBlips.highEngagement.push(blip);
      } else {
        categorizedBlips.random.push(blip);
      }
    });

    // Shuffle each category
    transformationHelper.shuffleCategories(categorizedBlips);

    // Create balanced distribution with focus on low-view and recent blips
    const finalBlips = this.createNewBlipsDistribution(categorizedBlips, limit);

    // Extract the blip IDs from the final result to add to seen blips
    const newlySeenBlipIds = finalBlips.map(blip => blip.blipId.toString());
    console.log(`➕ [NEW BLIPS DEBUG] Adding ${newlySeenBlipIds.length} new blip IDs to session`);

    // Update session with new blips
    sessionHelper.updateSessionWithNewBlips(sessionData, newlySeenBlipIds, page);

    // The "total" for this endpoint should reflect the capped set size
    const cappedTotal = Math.min(products.length, LATEST_CAP);

    console.log(`📤 [NEW BLIPS DEBUG] Returning ${finalBlips.length} new blips for page ${page}`);
    if (finalBlips.length > 0) {
      console.log(`📤 [NEW BLIPS DEBUG] First blip product: ${finalBlips[0].productName} (ID: ${finalBlips[0].blipId})`);
    }

    return {
      blips: finalBlips,
      currentPage: page,
      totalPages: Math.ceil(cappedTotal / limit),
      totalBlips: cappedTotal,
      sessionId
    };
  }

  createNewBlipsDistribution(categorizedBlips, totalNeeded) {
    const allBlips = [
      ...categorizedBlips.veryRecentLowView,
      ...categorizedBlips.recentLowView,
      ...categorizedBlips.veryRecent,
      ...categorizedBlips.recent,
      ...categorizedBlips.lowView,
      ...categorizedBlips.followedSellers,
      ...categorizedBlips.highEngagement,
      ...categorizedBlips.random
    ];

    // Group blips by seller
    const blipsBySeller = {};
    allBlips.forEach(blip => {
      const sellerId = blip.seller._id.toString();
      if (!blipsBySeller[sellerId]) {
        blipsBySeller[sellerId] = [];
      }
      blipsBySeller[sellerId].push(blip);
    });

    const sellerIds = Object.keys(blipsBySeller);
    const result = [];
    const seenProducts = new Set();
    let lastUsedSellers = [];
    const maxConsecutiveFromSameSeller = 1;
    
    // Algorithm: Round-robin through sellers to avoid clustering, but prioritize recency and low-view
    while (result.length < totalNeeded && sellerIds.length > 0) {
      // Find sellers that haven't been used recently and still have blips
      let availableSellers = sellerIds.filter(sellerId => 
        !lastUsedSellers.includes(sellerId) && 
        blipsBySeller[sellerId].length > 0
      );

      // If no sellers available (all recently used), reset the restriction
      if (availableSellers.length === 0) {
        availableSellers = sellerIds.filter(sellerId => blipsBySeller[sellerId].length > 0);
        lastUsedSellers = [];
      }

      // If still no sellers available, we've exhausted all blips
      if (availableSellers.length === 0) break;

      // Pick a random seller from available ones
      const randomIndex = Math.floor(Math.random() * availableSellers.length);
      const selectedSellerId = availableSellers[randomIndex];
      
      // Get the next blip from this seller
      const blip = blipsBySeller[selectedSellerId].shift();
      
      // Only add if we haven't seen this product before
      if (!seenProducts.has(blip.productId.toString())) {
        result.push(blip);
        seenProducts.add(blip.productId.toString());
      } else {
        console.log(`🔄 [NEW BLIPS DEBUG] Skipped duplicate product in distribution: ${blip.productName} (${blip.productId})`);
      }

      // Track recently used sellers (keep last 3-5 sellers to avoid immediate repetition)
      lastUsedSellers.push(selectedSellerId);
      if (lastUsedSellers.length > Math.min(5, Math.ceil(sellerIds.length / 2))) {
        lastUsedSellers.shift();
      }

      // Remove seller if they have no more blips
      if (blipsBySeller[selectedSellerId].length === 0) {
        const index = sellerIds.indexOf(selectedSellerId);
        if (index > -1) {
          sellerIds.splice(index, 1);
        }
      }
    }

    return result;
  }
}

module.exports = new GetNewBlipsService();
