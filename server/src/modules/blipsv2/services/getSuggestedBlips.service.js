const productRepository = require('../repositories/product.repository');
const pipelineHelper = require('../helpers/pipeline.helper');
const transformationHelper = require('../helpers/transformation.helper');

class GetSuggestedBlipsService {
  async execute(req) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    
    // Check if user is authenticated
    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';
    
    console.log('Starting getSuggestedBlips aggregation...');
    
    // Define match stages
    const primaryMatchStage = {
      blips: { $exists: true, $ne: [] },
      blips: { $elemMatch: { processed: true } },
      status: { $ne: 'draft' }, // Exclude draft products
      $nor: [
        {
          status: 'offline_auction',
          'auction.status': 'ended'
        }
      ]
    };
    
    const fallbackMatchStage = {
      blips: { $exists: true, $ne: [] },
      status: { $ne: 'draft' } // Exclude draft products in fallback as well
    };
    
    // Get buyer's preferred categories and followed sellers if authenticated
    let buyerCategories = [];
    let followedSellers = [];
    if (isAuthenticated) {
      console.log(`Getting preferences for buyer: ${buyerId}`);
      const buyer = await productRepository.findBuyerByIdWithCategories(buyerId);
      
      if (buyer && buyer.selectedCategories && buyer.selectedCategories.length > 0) {
        buyerCategories = buyer.selectedCategories.reduce((acc, cat) => {
          acc.push(cat.name);
          if (cat.subCategories) {
            acc.push(...cat.subCategories.map(sub => sub.name));
          }
          return acc;
        }, []);
        console.log(`Found preferred categories: ${buyerCategories.join(', ')}`);
      } else {
        console.log('No preferred categories found for buyer');
      }
      
      if (buyer && buyer.followers) {
        followedSellers = buyer.followers.map(follow => follow.sellerId.toString());
        console.log(`Found followed sellers: ${followedSellers.length}`);
      }
    }
    
    // Get total count for primary match stage
    let total = await productRepository.countProductsWithBlips(primaryMatchStage);
    const poolSize = Math.max(10, Math.min(total, limit * 3));
    
    const now = new Date();
    
    // Common pipeline stages
    const commonPipeline = [
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
              { $multiply: [{ $size: { $ifNull: ["$blips.likes", []] } }, 5] },
              { $multiply: [{ $size: { $ifNull: ["$blips.comments", []] } }, 10] }
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: '$sellerInfo' },
      {
        $lookup: {
          from: 'buyers',
          localField: 'auction.currentHighestBid.buyer',
          foreignField: '_id',
          as: 'highestBidder'
        }
      },
      { $sort: { randomScore: -1 } },
      { $limit: poolSize },
      {
        $project: {
          _id: '$_id',
          blipId: '$blips._id',
          blipUrl: '$blips.url',
          processed: '$blips.processed',
          thumbnail: { 
            $ifNull: [
              '$blips.thumbnail', 
              'https://res.cloudinary.com/dljgzevaj/image/upload/v1742758888/sans-affiche_zu6wj4.png'
            ] 
          },
          productId: '$_id',
          productName: '$name',
          price: '$price',
          category: '$category',
          subCategory: '$subCategory',
          stock: '$stock',
          status: '$status',
          auctionInfo: {
            $cond: {
              if: { $eq: ['$status', 'offline_auction',] },
              then: {
                minBid: '$auction.minBid',
                maxBid: '$auction.maxBid',
                endOnMaxBid: '$auction.endOnMaxBid',
                startDate: '$auction.startDate',
                endDate: '$auction.endDate',
                status: '$auction.status',
                daysLeft: '$auction.daysLeft',
                currentHighestBid: {
                  amount: '$auction.currentHighestBid.amount',
                  buyer: {
                    _id: '$auction.currentHighestBid.buyer',
                    firstName: { $arrayElemAt: ['$highestBidder.firstName', 0] },
                    lastName: { $arrayElemAt: ['$highestBidder.lastName', 0] },
                    profileImage: { $arrayElemAt: ['$highestBidder.profileImage', 0] }
                  }
                },
                winner: {
                  buyer: '$auction.winner.buyer',
                  bidAmount: '$auction.winner.bidAmount',
                  winningDate: '$auction.winner.winningDate'
                },
                bidsCount: {
                  $cond: {
                    if: { $isArray: '$auction.bids' },
                    then: { $size: '$auction.bids' },
                    else: 0
                  }
                }
              },
              else: null
            }
          },
          discount: {
            isActive: '$discount.isActive',
            type: '$discount.type',
            value: '$discount.value',
            startDate: '$discount.startDate',
            endDate: '$discount.endDate',
            couponName: '$discount.couponName',
            discountedPrice: {
              $cond: {
                if: '$discount.isActive',
                then: {
                  $cond: {
                    if: { $eq: ['$discount.type', 'percentage'] },
                    then: { $round: [{ $multiply: ['$price', { $subtract: [1, { $divide: ['$discount.value', 100] }] }] }, 0] },
                    else: { $subtract: ['$price', '$discount.value'] }
                  }
                },
                else: '$price'
              }
            }
          },
          seller: {
            _id: '$sellerInfo._id',
            firstName: '$sellerInfo.firstName',
            lastName: '$sellerInfo.lastName',
            storeName: '$sellerInfo.storeName',
            storeAvatar: '$sellerInfo.storeAvatar',
            aboutStore: '$sellerInfo.aboutStore',
            storeRating: { $ifNull: ['$sellerInfo.stats.averageRating', 0] },
            totalStoreReviews: { $ifNull: ['$sellerInfo.stats.totalReviews', 0] },
            isFollowing: {
              $cond: {
                if: { $isArray: '$sellerInfo.followers' },
                then: {
                  $in: [
                    { $toObjectId: { $ifNull: [buyerId, null] } },
                    { $ifNull: ['$sellerInfo.followers.buyerId', []] }
                  ]
                },
                else: false
              }
            },
            isFeatured: { $ifNull: ['$sellerInfo.isFeatured', false] }
          },
          images: { $first: '$images.url' },
          blipEngagement: {
            likesCount: {
              $size: {
                $cond: {
                  if: { $isArray: '$blips.likes' },
                  then: '$blips.likes',
                  else: []
                }
              }
            },
            commentsCount: {
              $size: {
                $cond: {
                  if: { $isArray: '$blips.comments' },
                  then: '$blips.comments',
                  else: []
                }
              }
            },
            viewCount: '$blips.viewCount',
            isLiked: {
              $cond: {
                if: { $and: [isAuthenticated, { $isArray: '$blips.likes' }] },
                then: {
                  $in: [
                    { $toObjectId: { $ifNull: [buyerId, null] } },
                    '$blips.likes'
                  ]
                },
                else: false
              }
            }
          },
          averageRating: {
            $cond: {
              if: { $isArray: '$reviews' },
              then: { $avg: '$reviews.rating' },
              else: null
            }
          },
          reviewCount: {
            $cond: {
              if: { $isArray: '$reviews' },
              then: { $size: '$reviews' },
              else: 0
            }
          },
          createdAt: '$blips.createdAt',
          daysSinceCreation: 1,
          engagementScore: 1
        }
      }
    ];
    
    // Primary pipeline
    const primaryPipeline = [
      { $match: primaryMatchStage },
      { $unwind: '$blips' },
      { $match: { 'blips.processed': true } },
      ...commonPipeline
    ];
    
    // Fetch blips with primary criteria
    let allBlips = await productRepository.aggregateProducts(primaryPipeline);
    
    // Fallback if no blips are found
    if (allBlips.length === 0) {
      console.log('No processed blips found, falling back to all blips');
      total = await productRepository.countProductsWithBlips(fallbackMatchStage);
      const fallbackPipeline = [
        { $match: fallbackMatchStage },
        { $unwind: '$blips' },
        ...commonPipeline
      ];
      allBlips = await productRepository.aggregateProducts(fallbackPipeline);
    }
    
    // Handle case when no blips are found (should be rare with fallback)
    if (allBlips.length === 0) {
      return {
        blips: [],
        isPersonalized: buyerCategories.length > 0,
        currentPage: page,
        totalPages: 0,
        totalBlips: 0
      };
    }
    
    // Process blips with additional metadata for categorization
    const transformedBlips = allBlips.map(blip => {
      const isInBuyerCategory = buyerCategories.length > 0 && 
        (buyerCategories.includes(blip.category) || buyerCategories.includes(blip.subCategory));
      const isFollowingSeller = followedSellers.includes(blip.seller._id.toString());
      
      blip._metadata = {
        isInBuyerCategory,
        isFollowingSeller: isFollowingSeller || blip.seller.isFollowing,
        engagementScore: blip.engagementScore,
        daysSinceCreation: blip.daysSinceCreation,
        isNewBlip: blip.daysSinceCreation < 7,
        isLowView: (blip.blipEngagement.viewCount || 0) < 50,
        sellerId: blip.seller._id.toString()
      };
      
      delete blip.daysSinceCreation;
      delete blip.engagementScore;
      
      return blip;
    });
    
    // Categorize blips
    const categorizedBlips = {
      newInBuyerCategory: [],
      followedSellers: [],
      highEngagement: [],
      undiscovered: [],
      random: []
    };
    
    transformedBlips.forEach(blip => {
      const meta = blip._metadata;
      delete blip._metadata;
      
      if (isAuthenticated && meta.isInBuyerCategory && meta.isNewBlip) {
        categorizedBlips.newInBuyerCategory.push(blip);
      } else if (isAuthenticated && meta.isFollowingSeller) {
        categorizedBlips.followedSellers.push(blip);
      } else if (meta.engagementScore > 100) {
        categorizedBlips.highEngagement.push(blip);
      } else if (meta.isLowView) {
        categorizedBlips.undiscovered.push(blip);
      } else {
        categorizedBlips.random.push(blip);
      }
    });
    
    // Shuffle each category
    Object.keys(categorizedBlips).forEach(category => {
      const array = categorizedBlips[category];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    });
    
    // Distribute blips
    const rearrangedBlips = [];
    const sellerTracker = new Map();
    const productTracker = new Map();
    const minSellerDistance = 3;
    
    const addBlipsFromCategory = (category, count) => {
      let added = 0;
      let index = 0;
      
      while (added < count && index < categorizedBlips[category].length) {
        const blip = categorizedBlips[category][index];
        const sellerId = blip.seller._id.toString();
        const productId = blip.productId.toString();
        
        if (productTracker.has(productId)) {
          index++;
          continue;
        }
        
        const lastPosition = sellerTracker.get(sellerId) || -minSellerDistance;
        if (rearrangedBlips.length - lastPosition >= minSellerDistance) {
          rearrangedBlips.push(blip);
          sellerTracker.set(sellerId, rearrangedBlips.length - 1);
          productTracker.set(productId, true);
          categorizedBlips[category].splice(index, 1);
          added++;
        } else {
          index++;
        }
        
        if (index >= categorizedBlips[category].length && added < count && categorizedBlips[category].length > 0) {
          index = 0;
          const blip = categorizedBlips[category][0];
          rearrangedBlips.push(blip);
          sellerTracker.set(blip.seller._id.toString(), rearrangedBlips.length - 1);
          productTracker.set(blip.productId.toString(), true);
          categorizedBlips[category].splice(0, 1);
          added++;
        }
      }
      
      return added;
    };
    
    const totalNeeded = limit;
    let remaining = totalNeeded;
    
    const categoryOrder = [
      'newInBuyerCategory',
      'highEngagement',
      'followedSellers',
      'undiscovered',
      'random'
    ];
    
    for (const category of categoryOrder) {
      if (remaining > 0 && categorizedBlips[category].length > 0) {
        const toAdd = Math.min(1, remaining, categorizedBlips[category].length);
        const added = addBlipsFromCategory(category, toAdd);
        remaining -= added;
      }
    }
    
    while (remaining > 0) {
      let addedAny = false;
      
      for (const category of categoryOrder) {
        if (remaining > 0 && categorizedBlips[category].length > 0) {
          const toAdd = Math.min(5, remaining, categorizedBlips[category].length);
          const added = addBlipsFromCategory(category, toAdd);
          remaining -= added;
          if (added > 0) addedAny = true;
        }
      }
      
      if (!addedAny) break;
    }
    
    if (remaining > 0) {
      const allRemaining = [].concat(...Object.values(categorizedBlips));
      for (let i = allRemaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allRemaining[i], allRemaining[j]] = [allRemaining[j], allRemaining[i]];
      }
      
      let index = 0;
      while (remaining > 0 && index < allRemaining.length) {
        const blip = allRemaining[index];
        const sellerId = blip.seller._id.toString();
        const productId = blip.productId.toString();
        
        if (productTracker.has(productId)) {
          index++;
          continue;
        }
        
        const lastPosition = sellerTracker.get(sellerId) || -minSellerDistance;
        if (rearrangedBlips.length - lastPosition >= minSellerDistance) {
          rearrangedBlips.push(blip);
          sellerTracker.set(sellerId, rearrangedBlips.length - 1);
          productTracker.set(productId, true);
          remaining--;
        }
        
        index++;
        
        if (index >= allRemaining.length && remaining > 0 && allRemaining.length > 0) {
          for (let i = 0; i < allRemaining.length; i++) {
            const blip = allRemaining[i];
            if (!productTracker.has(blip.productId.toString())) {
              rearrangedBlips.push(blip);
              productTracker.set(blip.productId.toString(), true);
              remaining--;
              break;
            }
          }
        }
      }
    }
    
    console.log(`Found ${rearrangedBlips.length} suggested blips with distribution algorithm`);
    
    return {
      blips: rearrangedBlips,
      isPersonalized: buyerCategories.length > 0,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlips: total
    };
  }
}

module.exports = new GetSuggestedBlipsService();