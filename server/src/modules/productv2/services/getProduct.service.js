const productRepository = require('../repositories/product.repository');

class GetProductService {
  async execute(req) {
    const { id } = req.params;

    // First find the product to check auction status
    const productCheck = await productRepository.findById(id);
    if (!productCheck) return { notFound: true };

    if (productCheck.status === 'offline_auction') {
      const product = await productRepository.findByIdPopulate(id, [
        {
          path: 'seller', select: `
            firstName lastName email phoneNumber businessName 
            businessType businessEmail businessNumber businessAddress 
            storeName aboutStore storeAvatar storeBanner 
            shippingOptions warehouseDetails categories followers
            isVerified accountType storeVisits products customers
            offersStorePickup
          ` },
        { path: 'auction.bids.buyer', select: 'firstName lastName profileImage' },
        { path: 'auction.currentHighestBid.buyer', select: 'firstName lastName profileImage' },
        { path: 'auction.winner.buyer', select: 'firstName lastName profileImage' }
      ]);

      if (!product) return { notFound: true };

      const formatted = product.toObject();

      if (formatted.seller) {
        formatted.seller = {
          _id: formatted.seller._id,
          personalInfo: {
            firstName: formatted.seller.firstName,
            lastName: formatted.seller.lastName,
            email: formatted.seller.email,
            phoneNumber: formatted.seller.phoneNumber
          },
          businessInfo: {
            businessName: formatted.seller.businessName,
            businessType: formatted.seller.businessType,
            businessEmail: formatted.seller.businessEmail,
            businessNumber: formatted.seller.businessNumber,
            businessAddress: formatted.seller.businessAddress,
            taxInformation: formatted.seller.taxInformation
          },
          storeInfo: {
            storeName: formatted.seller.storeName,
            aboutStore: formatted.seller.aboutStore,
            storeAvatar: formatted.seller.storeAvatar,
            storeBanner: formatted.seller.storeBanner,
            categories: formatted.seller.categories,
            followerCount: formatted.seller.followers ? formatted.seller.followers.length : 0
          },
          shippingInfo: {
            shippingOptions: formatted.seller.shippingOptions,
            warehouseDetails: formatted.seller.warehouseDetails,
            offersStorePickup: formatted.seller.offersStorePickup
          },
          addresses: {
            businessAddress: formatted.seller.businessAddress,
            warehouseAddress: formatted.seller.warehouseDetails?.address,
            sellerAddress: formatted.seller.sellerAddress
          },
          verification: {
            isVerified: formatted.seller.isVerified,
            accountType: formatted.seller.accountType
          },
          stats: {
            storeVisits: formatted.seller.storeVisits || 0,
            totalProducts: formatted.seller.products ? formatted.seller.products.length : 0,
            totalCustomers: formatted.seller.customers ? formatted.seller.customers.length : 0
          }
        };
      }

      if (formatted.auction) {
        if (formatted.auction.bids) {
          formatted.auction.bids = formatted.auction.bids.map(bid => ({
            _id: bid._id,
            buyer: bid.buyer ? {
              _id: bid.buyer._id,
              firstName: bid.buyer.firstName,
              lastName: bid.buyer.lastName,
              profileImage: bid.buyer.profileImage
            } : bid.buyer,
            amount: bid.amount,
            status: bid.status,
            createdAt: bid.createdAt
          }));
        }

        if (formatted.auction.currentHighestBid && formatted.auction.currentHighestBid.buyer) {
          formatted.auction.currentHighestBid = {
            amount: formatted.auction.currentHighestBid.amount,
            buyer: {
              _id: formatted.auction.currentHighestBid.buyer._id,
              firstName: formatted.auction.currentHighestBid.buyer.firstName,
              lastName: formatted.auction.currentHighestBid.buyer.lastName,
              profileImage: formatted.auction.currentHighestBid.buyer.profileImage
            }
          };
        }

        if (formatted.auction.winner && formatted.auction.winner.buyer) {
          formatted.auction.winner = {
            bidAmount: formatted.auction.winner.bidAmount,
            winningDate: formatted.auction.winner.winningDate,
            buyer: {
              _id: formatted.auction.winner.buyer._id,
              firstName: formatted.auction.winner.buyer.firstName,
              lastName: formatted.auction.winner.buyer.lastName,
              profileImage: formatted.auction.winner.buyer.profileImage
            }
          };
        }
      }

      return { product: formatted, isAuction: true };
    }

    // Non-auction: aggregation pipeline mirroring v1
    const pipeline = [
      { $match: { _id: productRepository.toObjectId(id) } },
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
        $addFields: {
          seller: {
            _id: '$sellerInfo._id',
            personalInfo: {
              firstName: '$sellerInfo.firstName',
              lastName: '$sellerInfo.lastName',
              email: '$sellerInfo.email',
              phoneNumber: '$sellerInfo.phoneNumber'
            },
            businessInfo: {
              businessName: '$sellerInfo.businessName',
              businessType: '$sellerInfo.businessType',
              businessEmail: '$sellerInfo.businessEmail',
              businessNumber: '$sellerInfo.businessNumber',
              businessAddress: '$sellerInfo.businessAddress',
              taxInformation: '$sellerInfo.taxInformation'
            },
            storeInfo: {
              storeName: '$sellerInfo.storeName',
              aboutStore: '$sellerInfo.aboutStore',
              storeAvatar: '$sellerInfo.storeAvatar',
              storeBanner: '$sellerInfo.storeBanner',
              categories: '$sellerInfo.categories',
              followerCount: { $size: { $ifNull: ['$sellerInfo.followers', []] } }
            },
            shippingInfo: {
              shippingOptions: '$sellerInfo.shippingOptions',
              warehouseDetails: '$sellerInfo.warehouseDetails',
              offersStorePickup: '$sellerInfo.offersStorePickup'
            },
            addresses: {
              businessAddress: '$sellerInfo.businessAddress',
              warehouseAddress: '$sellerInfo.warehouseDetails.address',
              sellerAddress: '$sellerInfo.sellerAddress'
            },
            verification: {
              isVerified: '$sellerInfo.isVerified',
              accountType: '$sellerInfo.accountType'
            },
            stats: {
              storeVisits: '$sellerInfo.storeVisits',
              totalProducts: { $size: { $ifNull: ['$sellerInfo.products', []] } },
              totalCustomers: { $size: { $ifNull: ['$sellerInfo.customers', []] } }
            }
          },
          stats: {
            averageRating: {
              $cond: {
                if: { $isArray: '$reviews' },
                then: {
                  $cond: {
                    if: { $gt: [{ $size: '$reviews' }, 0] },
                    then: { $avg: '$reviews.rating' },
                    else: null
                  }
                },
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
            viewCount: '$stats.views',
            soldCount: { $max: [0, { $ifNull: ['$stats.soldCount', 0] }] },
            lastViewed: '$stats.lastViewed',
            lastRestocked: '$stats.lastRestocked'
          },
          inventory: {
            currentStock: '$stock',
            lowStockAlert: '$lowStockAlert',
            sku: '$sku'
          },
          pricing: {
            originalPrice: '$price',
            discountInfo: '$discount',
            compareAtPrice: '$pricing.compareAtPrice',
            costPerItem: '$pricing.costPerItem'
          },
          shippingDetails: {
            weight: '$shippingInfo.weight',
            dimensions: '$shippingInfo.dimensions',
            methods: '$shippingInfo.shippingMethods'
          }
        }
      },
      {
        $project: {
          sellerInfo: 0,
          'seller.password': 0,
          'seller.otp': 0,
          'seller.passwordResetToken': 0,
          'seller.passwordResetExpires': 0,
          'seller.bankDetails.accountNumber': 0,
          'seller.bankDetails.swiftCode': 0,
          'seller.bankDetails.bankIdentifierCode': 0,
          'pricing.costPerItem': 0
        }
      }
    ];

    const result = await productRepository.aggregate(pipeline);
    if (!result || result.length === 0) return { notFound: true };
    return { product: result[0], isAuction: false };
  }
}

module.exports = new GetProductService();


