const productRepository = require('../repositories/product.repository');
const sessionHelper = require('../helpers/session.helper');
const pipelineHelper = require('../helpers/pipeline.helper');
const transformationHelper = require('../helpers/transformation.helper');

class GetTrendingBlipsService {
  async execute(req) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // Generate or get session ID
    const sessionId = sessionHelper.generateSessionId(req);
    console.log(`🔥 [TRENDING BLIPS DEBUG] Session ID: ${sessionId}, Page: ${page}, Limit: ${limit}`);

    // Get or create session
    const { sessionData, seenBlipIds } = sessionHelper.getOrCreateSession(sessionId, page);
    
    console.log(`📝 [TRENDING BLIPS DEBUG] Current seen blips count: ${seenBlipIds.length}`);
    console.log(`📄 [TRENDING BLIPS DEBUG] Last page visited: ${sessionData.lastPage}, Current page: ${page}`);
    if (seenBlipIds.length > 0) {
      console.log(`📝 [TRENDING BLIPS DEBUG] First 5 seen blip IDs: ${seenBlipIds.slice(0, 5).join(', ')}`);
    }

    // Build match stages - focus on active products with blips
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

    // Build trending pipeline with focus on high engagement metrics
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const trendingStages = [
      { $match: primaryMatchStage },
      { $unwind: "$blips" },
      // Calculate engagement metrics and trending scores
      {
        $addFields: {
          isProcessed: { $ifNull: ["$blips.processed", false] },
          blipCreatedAt: { $ifNull: ["$blips.createdAt", "$createdAt"] },
          viewCount: { $ifNull: ["$blips.viewCount", 0] },
          likesCount: { $ifNull: ["$blips.likesCount", 0] },
          commentsCount: { $ifNull: ["$blips.commentsCount", 0] },
          // Product sales metrics
          soldCount: { $ifNull: ["$stats.soldCount", 0] },
          totalSales: { $ifNull: ["$stats.totalSales", 0] },
          // Time-based factors
          isRecent: { $gte: ["$blips.createdAt", sevenDaysAgo] },
          isVeryRecent: { $gte: ["$blips.createdAt", new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000))] },
          daysSinceCreation: {
            $divide: [
              { $subtract: [now, { $ifNull: ["$blips.createdAt", now] }] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      // Exclude seen blips
      ...(seenBlipObjectIds.length > 0 ? [{ $match: { 'blips._id': { $nin: seenBlipObjectIds } } }] : []),
      // Calculate trending score based on multiple factors
      {
        $addFields: {
          // Base engagement score
          baseEngagementScore: {
            $add: [
              { $multiply: ["$viewCount", 1] },      // Views: 1 point each
              { $multiply: ["$likesCount", 5] },     // Likes: 5 points each
              { $multiply: ["$commentsCount", 10] }  // Comments: 10 points each
            ]
          },
          // Sales boost
          salesBoost: {
            $multiply: [
              { $add: ["$soldCount", 1] },  // Add 1 to avoid division by zero
              50  // Each sale adds 50 points
            ]
          },
          // Recency boost (recent content gets more weight)
          recencyBoost: {
            $cond: {
              if: "$isVeryRecent",
              then: 200,  // Very recent (3 days): 200 points
              else: {
                $cond: {
                  if: "$isRecent",
                  then: 100,  // Recent (7 days): 100 points
                  else: {
                    $cond: {
                      if: { $lt: ["$daysSinceCreation", 30] },
                      then: 50,  // Within 30 days: 50 points
                      else: 0
                    }
                  }
                }
              }
            }
          },
          // Velocity score (engagement per day)
          velocityScore: {
            $cond: {
              if: { $gt: ["$daysSinceCreation", 0] },
              then: {
                $divide: [
                  {
                    $add: [
                      { $multiply: ["$viewCount", 1] },
                      { $multiply: ["$likesCount", 5] },
                      { $multiply: ["$commentsCount", 10] }
                    ]
                  },
                  "$daysSinceCreation"
                ]
              },
              else: 0
            }
          },
          // Viral coefficient (likes + comments / views ratio)
          viralCoefficient: {
            $cond: {
              if: { $gt: ["$viewCount", 0] },
              then: {
                $divide: [
                  { $add: ["$likesCount", "$commentsCount"] },
                  "$viewCount"
                ]
              },
              else: 0
            }
          }
        }
      },
      // Calculate final trending score
      {
        $addFields: {
          trendingScore: {
            $add: [
              "$baseEngagementScore",
              "$salesBoost",
              "$recencyBoost",
              { $multiply: ["$velocityScore", 10] },  // Velocity gets 10x multiplier
              { $multiply: ["$viralCoefficient", 1000] }  // Viral coefficient gets high weight
            ]
          }
        }
      },
      // Sort by trending score (highest first)
      { $sort: { trendingScore: -1 } },
      // Limit to top trending blips
      { $limit: 100 },
      // Add random factor for variety
      {
        $addFields: {
          randomScore: { $rand: {} }
        }
      },
      // Final sort: trending score with some randomization
      { $sort: { trendingScore: -1, randomScore: -1 } },
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
          stats: 1,
          images: { $arrayElemAt: ["$images.url", 0] },
          blip: "$blips",
          reviews: 1,
          createdAt: 1,
          trendingScore: 1,
          baseEngagementScore: 1,
          salesBoost: 1,
          recencyBoost: 1,
          velocityScore: 1,
          viralCoefficient: 1,
          viewCount: 1,
          likesCount: 1,
          commentsCount: 1,
          soldCount: 1,
          daysSinceCreation: 1
        }
      }
    ];

    console.log(`🔥 [TRENDING BLIPS DEBUG] Executing trending pipeline with ${seenBlipObjectIds.length} exclusions...`);
    let products;
    try {
      products = await productRepository.aggregateProducts(trendingStages);
    } catch (dbError) {
      console.error(`❌ [TRENDING BLIPS DEBUG] Database error in trending pipeline:`, dbError.message);
      // Fallback to simpler trending calculation
      const fallbackTrendingPipeline = [
        { $match: fallbackMatchStage },
        { $unwind: "$blips" },
        {
          $addFields: {
            viewCount: { $ifNull: ["$blips.viewCount", 0] },
            likesCount: { $ifNull: ["$blips.likesCount", 0] },
            commentsCount: { $ifNull: ["$blips.commentsCount", 0] },
            soldCount: { $ifNull: ["$stats.soldCount", 0] }
          }
        },
        ...(seenBlipObjectIds.length > 0 ? [{ $match: { 'blips._id': { $nin: seenBlipObjectIds } } }] : []),
        {
          $addFields: {
            trendingScore: {
              $add: [
                { $multiply: ["$viewCount", 1] },
                { $multiply: ["$likesCount", 5] },
                { $multiply: ["$commentsCount", 10] },
                { $multiply: ["$soldCount", 50] }
              ]
            }
          }
        },
        { $sort: { trendingScore: -1 } },
        { $limit: 100 },
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
            stats: 1,
            images: { $arrayElemAt: ["$images.url", 0] },
            blip: "$blips",
            reviews: 1,
            createdAt: 1,
            trendingScore: 1,
            viewCount: 1,
            likesCount: 1,
            commentsCount: 1,
            soldCount: 1
          }
        }
      ];
      products = await productRepository.aggregateProducts(fallbackTrendingPipeline);
      console.log(`🔄 [TRENDING BLIPS DEBUG] Used fallback trending pipeline due to DB error`);
    }
    
    console.log(`📊 [TRENDING BLIPS DEBUG] Trending pipeline returned: ${products.length} products`);

    // If still no products, try basic fallback
    if (products.length === 0) {
      console.log('❌ [TRENDING BLIPS DEBUG] No trending products found, trying basic fallback...');
      const basicFallbackPipeline = [
        { $match: { 'blips.0': { $exists: true } } },
        { $unwind: "$blips" },
        ...(seenBlipObjectIds.length > 0 ? [{ $match: { 'blips._id': { $nin: seenBlipObjectIds } } }] : []),
        { $sort: { 'blips.viewCount': -1, 'blips.likesCount': -1 } },
        { $limit: 50 },
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
            stats: 1,
            images: { $arrayElemAt: ["$images.url", 0] },
            blip: "$blips",
            reviews: 1,
            createdAt: 1
          }
        }
      ];
      products = await productRepository.aggregateProducts(basicFallbackPipeline);
      console.log(`📊 [TRENDING BLIPS DEBUG] Basic fallback returned: ${products.length} products`);
    }

    // Populate seller information
    await productRepository.populateSellerInfo(products);

    if (products.length === 0) {
      console.log('❌ [TRENDING BLIPS DEBUG] Still no products found after all fallbacks');
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

    // Enhanced categorization for trending blips
    const categorizedBlips = {
      viral: [],           // High viral coefficient (likes+comments/views > 0.1)
      highEngagement: [],  // High total engagement score
      highVelocity: [],    // High engagement per day
      highSales: [],       // High sales count
      trending: [],        // Good trending score
      popular: [],         // High view count
      random: []           // Everything else
    };

    transformedBlips.forEach(blip => {
      const meta = blip._metadata;
      delete blip._metadata;

      const trendingScore = meta.trendingScore || 0;
      const viralCoefficient = meta.viralCoefficient || 0;
      const velocityScore = meta.velocityScore || 0;
      const soldCount = meta.soldCount || 0;
      const viewCount = blip.blipEngagement.viewCount || 0;
      const engagementScore = meta.engagementScore || 0;

      if (viralCoefficient > 0.1) {
        categorizedBlips.viral.push(blip);
      } else if (engagementScore > 200) {
        categorizedBlips.highEngagement.push(blip);
      } else if (velocityScore > 50) {
        categorizedBlips.highVelocity.push(blip);
      } else if (soldCount > 5) {
        categorizedBlips.highSales.push(blip);
      } else if (trendingScore > 500) {
        categorizedBlips.trending.push(blip);
      } else if (viewCount > 1000) {
        categorizedBlips.popular.push(blip);
      } else {
        categorizedBlips.random.push(blip);
      }
    });

    // Shuffle each category
    transformationHelper.shuffleCategories(categorizedBlips);

    // Create balanced distribution with focus on trending metrics
    const finalBlips = this.createTrendingBlipsDistribution(categorizedBlips, limit);

    // Extract the blip IDs from the final result to add to seen blips
    const newlySeenBlipIds = finalBlips.map(blip => blip.blipId.toString());
    console.log(`➕ [TRENDING BLIPS DEBUG] Adding ${newlySeenBlipIds.length} new blip IDs to session`);

    // Update session with new blips
    sessionHelper.updateSessionWithNewBlips(sessionData, newlySeenBlipIds, page);

    console.log(`📤 [TRENDING BLIPS DEBUG] Returning ${finalBlips.length} trending blips for page ${page}`);
    if (finalBlips.length > 0) {
      console.log(`📤 [TRENDING BLIPS DEBUG] First blip product: ${finalBlips[0].productName} (ID: ${finalBlips[0].blipId})`);
    }

    return {
      blips: finalBlips,
      currentPage: page,
      totalPages: Math.ceil(products.length / limit),
      totalBlips: products.length,
      sessionId
    };
  }

  createTrendingBlipsDistribution(categorizedBlips, totalNeeded) {
    const allBlips = [
      ...categorizedBlips.viral,
      ...categorizedBlips.highEngagement,
      ...categorizedBlips.highVelocity,
      ...categorizedBlips.highSales,
      ...categorizedBlips.trending,
      ...categorizedBlips.popular,
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
    
    // Algorithm: Round-robin through sellers to avoid clustering, but prioritize trending content
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
        console.log(`🔄 [TRENDING BLIPS DEBUG] Skipped duplicate product in distribution: ${blip.productName} (${blip.productId})`);
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

module.exports = new GetTrendingBlipsService();
