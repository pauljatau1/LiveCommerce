class TransformationHelper {
  transformProductsToBlips(products, buyerId, isAuthenticated, followedSellers) {
    return products.map(product => {
      // Determine follow status either from seller.followers array
      // or from provided followedSellers list (fallback for scenarios
      // where followers aren't populated on the seller document)
      const directFollow = product.seller.followers && buyerId
        ? product.seller.followers.some(follower =>
            follower.buyerId?.toString() === buyerId.toString())
        : false;
      const listFollow = Array.isArray(followedSellers)
        ? followedSellers.includes(product.seller._id.toString())
        : false;
      const isFollowing = directFollow || listFollow;

      const isLiked = isAuthenticated && product.blip.likes
        ? product.blip.likes.some(like => like.toString() === buyerId)
        : false;

      return {
        discount: {
          isActive: product.discount?.isActive || false,
          type: product.discount?.type || "percentage",
          value: product.discount?.value || 0,
          discountedPrice: product.discount?.discountedPrice || product.price
        },
        _id: product._id,
        blipId: product.blip._id,
        blipUrl: product.blip.url,
        thumbnail: product.blip.thumbnail || 'https://res.cloudinary.com/dljgzevaj/image/upload/v1742758888/sans-affiche_zu6wj4.png',
        processed: product.blip.processed,
        productId: product._id,
        productName: product.name,
        price: product.price,
        stock: product.stock,
        status: product.status,
        auctionInfo: product.status === 'offline_auction' ? {
          minBid: product.auction?.minBid,
          maxBid: product.auction?.maxBid,
          endOnMaxBid: product.auction?.endOnMaxBid,
          startDate: product.auction?.startDate,
          endDate: product.auction?.endDate,
          status: product.auction?.status,
          daysLeft: product.auction?.daysLeft,
          currentHighestBid: product.auction?.currentHighestBid,
          winner: product.auction?.winner,
          bidsCount: product.auction?.bids?.length || 0
        } : null,
        images: product.images,
        blipEngagement: {
          likesCount: product.blip.likesCount || 0,
          commentsCount: product.blip.commentsCount || 0,
          viewCount: product.blip.viewCount || 0,
          isLiked
        },
        averageRating: product.reviews?.length > 0
          ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
          : null,
        reviewCount: product.reviews?.length || 0,
        createdAt: product.blip.createdAt,
        seller: {
          _id: product.seller._id,
          firstName: product.seller.firstName,
          lastName: product.seller.lastName,
          storeName: product.seller.storeName,
          storeAvatar: product.seller.storeAvatar,
          aboutStore: product.seller.aboutStore,
          storeRating: product.seller.stats?.averageRating || 0,
          totalStoreReviews: product.seller.stats?.totalReviews || 0,
          isFollowing,
          isFeatured: product.seller.isFeatured
        },
        _metadata: {
          isFollowingSeller: isFollowing,
          engagementScore: product.engagementScore,
          daysSinceCreation: product.daysSinceCreation,
          isNewBlip: product.daysSinceCreation < 25,
          isLowView: (product.blip.viewCount || 0) < 25,
          sellerId: product.seller._id.toString(),
          // Trending metrics (if available from aggregation)
          trendingScore: product.trendingScore,
          baseEngagementScore: product.baseEngagementScore,
          salesBoost: product.salesBoost,
          recencyBoost: product.recencyBoost,
          velocityScore: product.velocityScore,
          viralCoefficient: product.viralCoefficient,
          soldCount: product.soldCount,
          totalSales: product.totalSales
        }
      };
    });
  }

  categorizeBlips(transformedBlips, isAuthenticated) {
    const categorizedBlips = {
      followedSellers: [],
      highEngagement: [],
      undiscovered: [],
      random: []
    };

    transformedBlips.forEach(blip => {
      const meta = blip._metadata;
      delete blip._metadata;

      if (isAuthenticated && meta.isFollowingSeller) {
        categorizedBlips.followedSellers.push(blip);
      } else if (meta.engagementScore > 80) {
        categorizedBlips.highEngagement.push(blip);
      } else if (meta.isLowView) {
        categorizedBlips.undiscovered.push(blip);
      } else {
        categorizedBlips.random.push(blip);
      }
    });

    return categorizedBlips;
  }

  shuffleCategories(categorizedBlips) {
    Object.keys(categorizedBlips).forEach(category => {
      const array = categorizedBlips[category];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    });
  }

  createBalancedBlipDistribution(categorizedBlips, totalNeeded) {
    const allBlips = [
      ...categorizedBlips.followedSellers,
      ...categorizedBlips.highEngagement,
      ...categorizedBlips.undiscovered,
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
    
    // Algorithm: Round-robin through sellers to avoid clustering
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
        console.log(`🔄 [BLIPS DEBUG] Skipped duplicate product in distribution: ${blip.productName} (${blip.productId})`);
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

module.exports = new TransformationHelper();
