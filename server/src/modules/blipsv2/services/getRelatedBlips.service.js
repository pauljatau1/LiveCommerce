const productRepository = require('../repositories/product.repository');

class GetRelatedBlipsService {
  async execute(req) {
    const { blipId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    // Get buyerId and check authentication status
    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

    // Find the product that contains the reference blip
    const product = await productRepository.findProductWithBlip(blipId);
    
    if (!product) {
      throw new Error('Blip not found');
    }
    
    // Get the source blip
    const sourceBlip = product.blips.id(blipId);
    
    if (!sourceBlip) {
      throw new Error('Blip not found');
    }
    
    // Find products with blips in the same category
    // Excluding the current product to ensure we don't get the same blips
    const relatedProducts = await productRepository.findRelatedProducts(product._id, product.category);
    
    // Extract all blips from related products
    let relatedBlips = [];
    
    relatedProducts.forEach(prod => {
      if (prod.blips && prod.blips.length > 0) {
        prod.blips.forEach(blip => {
          // Check if the current user has liked this blip
          const isLiked = buyerId && blip.likes ? blip.likes.includes(buyerId) : false;
          
          // Check if the buyer is following the seller
          const isFollowing = isAuthenticated && prod.seller.followers ? 
            prod.seller.followers.some(follower => 
              follower.buyerId && follower.buyerId.toString() === buyerId
            ) : false;
          
          // Get product image URL
          const productImage = prod.images && prod.images.length > 0 ? prod.images[0].url : '';
          
          // Calculate discounted price
          let discountedPrice = prod.price;
          if (prod.discount && prod.discount.isActive) {
            if (prod.discount.type === 'percentage') {
              discountedPrice = Math.ceil((prod.price * (100 - prod.discount.value)) / 100);
            } else {
              discountedPrice = Math.max(0, prod.price - prod.discount.value);
            }
          }
          
          relatedBlips.push({
            discount: {
              isActive: prod.discount ? prod.discount.isActive : false,
              type: prod.discount ? prod.discount.type : 'percentage',
              value: prod.discount ? prod.discount.value : 0,
              discountedPrice: discountedPrice
            },
            _id: prod._id,
            blipId: blip._id,
            blipUrl: blip.url,
            processed: blip.processed,
            thumbnail: blip.thumbnail || null,
            productId: prod._id,
            productName: prod.name,
            price: prod.price,
            stock: prod.stock || 0,
            status: prod.status || 'active',
            auctionInfo: null, // Not handling auction info for now
            images: productImage,
            blipEngagement: {
              likesCount: blip.likesCount || blip.likes.length || 0,
              commentsCount: blip.commentsCount || (blip.comments ? 
                blip.comments.length + blip.comments.reduce((total, comment) => total + (comment.replies ? comment.replies.length : 0), 0) 
                : 0),
              viewCount: blip.viewCount || 0,
              isLiked: isLiked
            },
            averageRating: prod.stats && prod.stats.averageRating ? prod.stats.averageRating : null,
            reviewCount: prod.stats && prod.stats.totalReviews ? prod.stats.totalReviews : 0,
            createdAt: blip.createdAt,
            seller: {
              _id: prod.seller._id,
              firstName: prod.seller.firstName,
              lastName: prod.seller.lastName,
              storeName: prod.seller.storeName,
              storeAvatar: prod.seller.storeAvatar,
              aboutStore: prod.seller.aboutStore || '',
              storeRating: prod.seller.stats && prod.seller.stats.rating ? prod.seller.stats.rating : 0,
              totalStoreReviews: prod.seller.stats && prod.seller.stats.totalReviews ? prod.seller.stats.totalReviews : 0,
              isFollowing: isFollowing,
              isFeatured: prod.seller.isVerified || false
            }
          });
        });
      }
    });
    
    // If we don't have enough related blips, fetch random blips
    if (relatedBlips.length < parseInt(limit)) {
      const randomProducts = await productRepository.findRandomProducts(product._id);
      
      randomProducts.forEach(prod => {
        if (prod.blips && prod.blips.length > 0) {
          prod.blips.forEach(blip => {
            // Avoid duplicates
            const exists = relatedBlips.some(
              item => item.blipId.toString() === blip._id.toString()
            );
            
            if (!exists) {
              const isLiked = buyerId && blip.likes ? blip.likes.includes(buyerId) : false;
              
              // Check if the buyer is following the seller
              const isFollowing = isAuthenticated && prod.seller.followers ? 
                prod.seller.followers.some(follower => 
                  follower.buyerId && follower.buyerId.toString() === buyerId
                ) : false;
              
              // Get product image URL
              const productImage = prod.images && prod.images.length > 0 ? prod.images[0].url : '';
              
              // Calculate discounted price
              let discountedPrice = prod.price;
              if (prod.discount && prod.discount.isActive) {
                if (prod.discount.type === 'percentage') {
                  discountedPrice = Math.ceil((prod.price * (100 - prod.discount.value)) / 100);
                } else {
                  discountedPrice = Math.max(0, prod.price - prod.discount.value);
                }
              }
              
              relatedBlips.push({
                discount: {
                  isActive: prod.discount ? prod.discount.isActive : false,
                  type: prod.discount ? prod.discount.type : 'percentage',
                  value: prod.discount ? prod.discount.value : 0,
                  discountedPrice: discountedPrice
                },
                _id: prod._id,
                blipId: blip._id,
                blipUrl: blip.url,
                processed: blip.processed,
                thumbnail: blip.thumbnail || null,
                productId: prod._id,
                productName: prod.name,
                price: prod.price,
                stock: prod.stock || 0,
                status: prod.status || 'active',
                auctionInfo: null, // Not handling auction info for now
                images: productImage,
                blipEngagement: {
                  likesCount: blip.likesCount || blip.likes.length || 0,
                  commentsCount: blip.commentsCount || (blip.comments ? 
                    blip.comments.length + blip.comments.reduce((total, comment) => total + (comment.replies ? comment.replies.length : 0), 0) 
                    : 0),
                  viewCount: blip.viewCount || 0,
                  isLiked: isLiked
                },
                averageRating: prod.stats && prod.stats.averageRating ? prod.stats.averageRating : null,
                reviewCount: prod.stats && prod.stats.totalReviews ? prod.stats.totalReviews : 0,
                createdAt: blip.createdAt,
                seller: {
                  _id: prod.seller._id,
                  firstName: prod.seller.firstName,
                  lastName: prod.seller.lastName,
                  storeName: prod.seller.storeName,
                  storeAvatar: prod.seller.storeAvatar,
                  aboutStore: prod.seller.aboutStore || '',
                  storeRating: prod.seller.stats && prod.seller.stats.rating ? prod.seller.stats.rating : 0,
                  totalStoreReviews: prod.seller.stats && prod.seller.stats.totalReviews ? prod.seller.stats.totalReviews : 0,
                  isFollowing: isFollowing,
                  isFeatured: prod.seller.isVerified || false
                }
              });
            }
          });
        }
      });
    }
    
    // Shuffle the array for better variety
    relatedBlips = relatedBlips.sort(() => 0.5 - Math.random());
    
    // Calculate total number of blips
    const total = relatedBlips.length;
    
    // Calculate pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    
    // Get paginated blips
    const paginatedBlips = relatedBlips.slice(startIndex, endIndex);
    
    return {
      success: true,
      blips: paginatedBlips,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalBlips: total,
      hasMore: endIndex < total
    };
  }
}

module.exports = new GetRelatedBlipsService();