const productRepository = require('../repositories/product.repository');

class GetProductByIdService {
  async execute(req) {
    const { id } = req.params;

    const product = await productRepository.findByIdPopulate(id, {
      path: 'seller',
      select: `
          firstName lastName email phoneNumber businessName 
          businessType businessEmail businessNumber businessAddress 
          storeName aboutStore storeAvatar storeBanner 
          shippingOptions warehouseDetails categories followers
          bankDetails.accountName bankDetails.bankName
          stats.totalProducts stats.totalOrders stats.totalRevenue
          stats.averageRating stats.reviewCount
        `
    });

    if (!product) {
      return { notFound: true };
    }

    if (!product.seller || typeof product.seller === 'string') {
      return { error: 'Failed to load seller details', sellerId: product.seller };
    }

    const formatted = {
      ...product.toObject(),
      seller: {
        id: product.seller._id,
        personalInfo: {
          firstName: product.seller.firstName,
          lastName: product.seller.lastName,
          email: product.seller.email,
          phoneNumber: product.seller.phoneNumber
        },
        businessInfo: {
          businessName: product.seller.businessName,
          businessType: product.seller.businessType,
          businessEmail: product.seller.businessEmail,
          businessNumber: product.seller.businessNumber,
          businessAddress: product.seller.businessAddress
        },
        storeInfo: {
          storeName: product.seller.storeName,
          aboutStore: product.seller.aboutStore,
          storeAvatar: product.seller.storeAvatar,
          storeBanner: product.seller.storeBanner,
          categories: product.seller.categories,
          followerCount: product.seller.followers?.length || 0
        },
        shippingInfo: {
          shippingOptions: product.seller.shippingOptions,
          warehouseDetails: product.seller.warehouseDetails
        },
        stats: {
          totalProducts: product.seller.stats?.totalProducts || 0,
          totalOrders: product.seller.stats?.totalOrders || 0,
          totalRevenue: product.seller.stats?.totalRevenue || 0,
          averageRating: product.seller.stats?.averageRating || 0,
          reviewCount: product.seller.stats?.reviewCount || 0
        },
        bankInfo: {
          bankName: product.seller.bankDetails?.bankName,
          accountName: product.seller.bankDetails?.accountName
        }
      }
    };

    return { product: formatted };
  }
}

module.exports = new GetProductByIdService();


