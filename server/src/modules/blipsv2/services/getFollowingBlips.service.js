const productRepository = require('../repositories/product.repository');
const sessionHelper = require('../helpers/session.helper');
const pipelineHelper = require('../helpers/pipeline.helper');
const transformationHelper = require('../helpers/transformation.helper');

class GetFollowingBlipsService {
  async execute(req) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // Check if user is authenticated - this endpoint requires authentication
    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

    if (!isAuthenticated) {
      return {
        blips: [],
        currentPage: page,
        totalPages: 0,
        totalBlips: 0,
        sessionId: null,
        error: 'Authentication required'
      };
    }

    // Generate or get session ID
    const sessionId = sessionHelper.generateSessionId(req);
    console.log(`👥 [FOLLOWING BLIPS DEBUG] Session ID: ${sessionId}, Page: ${page}, Limit: ${limit}`);

    // Get or create session
    const { sessionData, seenBlipIds } = sessionHelper.getOrCreateSession(sessionId, page);
    
    console.log(`📝 [FOLLOWING BLIPS DEBUG] Current seen blips count: ${seenBlipIds.length}`);
    console.log(`📄 [FOLLOWING BLIPS DEBUG] Last page visited: ${sessionData.lastPage}, Current page: ${page}`);
    if (seenBlipIds.length > 0) {
      console.log(`📝 [FOLLOWING BLIPS DEBUG] First 5 seen blip IDs: ${seenBlipIds.slice(0, 5).join(', ')}`);
    }

    // Get buyer's followed sellers
    let followedSellers = [];
    try {
      const buyer = await productRepository.findBuyerById(buyerId);
      if (buyer?.followers?.length > 0) {
        followedSellers = buyer.followers.map(f => f.sellerId.toString());
        console.log(`👥 [FOLLOWING BLIPS DEBUG] Found ${followedSellers.length} followed sellers`);
      } else {
        console.log(`👥 [FOLLOWING BLIPS DEBUG] No followed sellers found for buyer ${buyerId}`);
        return {
          blips: [],
          currentPage: page,
          totalPages: 0,
          totalBlips: 0,
          sessionId,
          message: 'No followed sellers'
        };
      }
    } catch (error) {
      console.error(`❌ [FOLLOWING BLIPS DEBUG] Error fetching buyer data:`, error);
      return {
        blips: [],
        currentPage: page,
        totalPages: 0,
        totalBlips: 0,
        sessionId,
        error: 'Failed to fetch followed sellers'
      };
    }

    // Build match stages - same as personalized but we'll filter after transformation
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

    // Validate and clean ObjectIds
    const { seenBlipObjectIds, validIds } = sessionHelper.validateAndCleanObjectIds(seenBlipIds);
    
    // Update session with cleaned IDs if needed
    if (validIds !== seenBlipIds) {
      sessionData.seenBlipIds = validIds;
    }

    // Build pipeline similar to personalized blips
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const followingStages = [
      { $match: primaryMatchStage },
      { $unwind: "$blips" },
      // Calculate engagement metrics and scores
      {
        $addFields: {
          isProcessed: { $ifNull: ["$blips.processed", false] },
          blipCreatedAt: { $ifNull: ["$blips.createdAt", "$createdAt"] },
          viewCount: { $ifNull: ["$blips.viewCount", 0] },
          likesCount: { $ifNull: ["$blips.likesCount", 0] },
          commentsCount: { $ifNull: ["$blips.commentsCount", 0] },
          // Time-based factors
          isRecent: { $gte: ["$blips.createdAt", sevenDaysAgo] },
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
      // Calculate engagement score
      {
        $addFields: {
          engagementScore: {
            $add: [
              { $multiply: ["$viewCount", 1] },
              { $multiply: ["$likesCount", 5] },
              { $multiply: ["$commentsCount", 10] }
            ]
          },
          // Recency boost for followed sellers
          recencyBoost: {
            $cond: {
              if: "$isRecent",
              then: 100,  // Recent content from followed sellers gets boost
              else: 0
            }
          }
        }
      },
      // Sort by engagement and recency
      { $sort: { engagementScore: -1, recencyBoost: -1, blipCreatedAt: -1 } },
      // Add random factor for variety
      {
        $addFields: {
          randomScore: { $rand: {} }
        }
      },
      // Final sort with some randomization
      { $sort: { engagementScore: -1, randomScore: -1 } },
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
          engagementScore: 1,
          recencyBoost: 1,
          daysSinceCreation: 1,
          viewCount: 1,
          likesCount: 1,
          commentsCount: 1
        }
      }
    ];

    console.log(`👥 [FOLLOWING BLIPS DEBUG] Executing following pipeline with ${seenBlipObjectIds.length} exclusions...`);
    let products;
    try {
      products = await productRepository.aggregateProducts(followingStages);
    } catch (dbError) {
      console.error(`❌ [FOLLOWING BLIPS DEBUG] Database error in following pipeline:`, dbError.message);
      // Fallback to simpler following calculation
      const fallbackFollowingPipeline = [
        { $match: fallbackMatchStage },
        { $unwind: "$blips" },
        {
          $addFields: {
            viewCount: { $ifNull: ["$blips.viewCount", 0] },
            likesCount: { $ifNull: ["$blips.likesCount", 0] },
            commentsCount: { $ifNull: ["$blips.commentsCount", 0] }
          }
        },
        ...(seenBlipObjectIds.length > 0 ? [{ $match: { 'blips._id': { $nin: seenBlipObjectIds } } }] : []),
        {
          $addFields: {
            engagementScore: {
              $add: [
                { $multiply: ["$viewCount", 1] },
                { $multiply: ["$likesCount", 5] },
                { $multiply: ["$commentsCount", 10] }
              ]
            }
          }
        },
        { $sort: { engagementScore: -1 } },
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
            engagementScore: 1,
            viewCount: 1,
            likesCount: 1,
            commentsCount: 1
          }
        }
      ];
      products = await productRepository.aggregateProducts(fallbackFollowingPipeline);
      console.log(`🔄 [FOLLOWING BLIPS DEBUG] Used fallback following pipeline due to DB error`);
    }
    
    console.log(`📊 [FOLLOWING BLIPS DEBUG] Following pipeline returned: ${products.length} products`);

    // If no products found, return empty array
    if (products.length === 0) {
      console.log('👥 [FOLLOWING BLIPS DEBUG] No products found');
      return {
        blips: [],
        currentPage: page,
        totalPages: 0,
        totalBlips: 0,
        sessionId,
        message: 'No blips found'
      };
    }

    // Populate seller information
    await productRepository.populateSellerInfo(products);

    // Transform products to blips
    const transformedBlips = transformationHelper.transformProductsToBlips(
      products, 
      buyerId, 
      isAuthenticated, 
      followedSellers
    );

    // Filter to only include blips from followed sellers
    const followingBlips = transformedBlips.filter(blip => {
      const meta = blip._metadata;
      return meta && meta.isFollowingSeller;
    });

    console.log(`👥 [FOLLOWING BLIPS DEBUG] Filtered to ${followingBlips.length} blips from followed sellers out of ${transformedBlips.length} total`);

    if (followingBlips.length === 0) {
      console.log('👥 [FOLLOWING BLIPS DEBUG] No blips found from followed sellers after filtering');
      return {
        blips: [],
        currentPage: page,
        totalPages: 0,
        totalBlips: 0,
        sessionId,
        message: 'No blips from followed sellers'
      };
    }

    // Categorize blips from followed sellers
    const categorizedBlips = {
      recentHighEngagement: [], // Recent and high engagement
      highEngagement: [],       // High engagement regardless of age
      recent: [],               // Recent content
      followedSellers: [],      // All followed seller content (should be all)
      random: []                // Everything else
    };

    followingBlips.forEach(blip => {
      const meta = blip._metadata;
      delete blip._metadata;

      const daysSinceCreation = meta.daysSinceCreation || 0;
      const engagementScore = meta.engagementScore || 0;
      const isFollowingSeller = meta.isFollowingSeller;

      if (daysSinceCreation < 7 && engagementScore > 100) {
        categorizedBlips.recentHighEngagement.push(blip);
      } else if (engagementScore > 100) {
        categorizedBlips.highEngagement.push(blip);
      } else if (daysSinceCreation < 7) {
        categorizedBlips.recent.push(blip);
      } else if (isFollowingSeller) {
        categorizedBlips.followedSellers.push(blip);
      } else {
        categorizedBlips.random.push(blip);
      }
    });

    // Shuffle each category
    transformationHelper.shuffleCategories(categorizedBlips);

    // Create balanced distribution for followed sellers
    const finalBlips = this.createFollowingBlipsDistribution(categorizedBlips, limit);

    // Extract the blip IDs from the final result to add to seen blips
    const newlySeenBlipIds = finalBlips.map(blip => blip.blipId.toString());
    console.log(`➕ [FOLLOWING BLIPS DEBUG] Adding ${newlySeenBlipIds.length} new blip IDs to session`);

    // Update session with new blips
    sessionHelper.updateSessionWithNewBlips(sessionData, newlySeenBlipIds, page);

    console.log(`📤 [FOLLOWING BLIPS DEBUG] Returning ${finalBlips.length} following blips for page ${page}`);
    if (finalBlips.length > 0) {
      console.log(`📤 [FOLLOWING BLIPS DEBUG] First blip product: ${finalBlips[0].productName} (ID: ${finalBlips[0].blipId})`);
    }

    return {
      blips: finalBlips,
      currentPage: page,
      totalPages: Math.ceil(followingBlips.length / limit),
      totalBlips: followingBlips.length,
      sessionId,
      followedSellersCount: followedSellers.length
    };
  }

  createFollowingBlipsDistribution(categorizedBlips, totalNeeded) {
    const allBlips = [
      ...categorizedBlips.recentHighEngagement,
      ...categorizedBlips.highEngagement,
      ...categorizedBlips.recent,
      ...categorizedBlips.followedSellers,
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
    
    // Algorithm: Round-robin through followed sellers to avoid clustering
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
        console.log(`🔄 [FOLLOWING BLIPS DEBUG] Skipped duplicate product in distribution: ${blip.productName} (${blip.productId})`);
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

module.exports = new GetFollowingBlipsService();
