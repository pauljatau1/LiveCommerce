const Product = require('../models/Product');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const { s3 } = require('../config/awsConfig')
const { v4: uuidv4 } = require('uuid');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const NotificationController = require('../controllers/notificationController');
const agenda = require('../config/agenda').agenda;
const { ProductDeleteS3ObjectsByUrls } = require('../services/products/images');
const { ExtractAllImageUrlsFromVariants } = require('../services/products/variants/utils');
const { ProductVariantDeleteS3ObjectsByUrls } = require('../services/products/variants/images');
const productBlips = require('../services/products/blips');
const Fuse = require('fuse.js');
const baseUrl = process.env.STORE_URL;


// Get all product blips
exports.getAllBlips = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  // Check if user is authenticated
  const buyerId = req.user?.id;
  const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

  try {
    console.log('Starting getAllBlips aggregation...');
    
    const blips = await Product.aggregate([
      // Match products that have blips, are not draft, and exclude offline_auction products with ended status
      { 
        $match: { 
          blips: { $exists: true, $ne: [] },
          status: { $ne: 'draft' }, // Exclude draft products
          $nor: [
            { 
              status: 'offline_auction', 
              'auction.status': 'ended' 
            }
          ]
        }
      },
      // Unwind the blips array
      { $unwind: '$blips' },
      // Lookup seller information
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: '$sellerInfo' },
      // Lookup auction bidder information
      {
        $lookup: {
          from: 'buyers',
          localField: 'auction.currentHighestBid.buyer',
          foreignField: '_id',
          as: 'highestBidder'
        }
      },
      // Project needed fields
      {
        $project: {
          _id: '$_id', // This is the product ID
          blipId: '$blips._id', // Add this line to include the blip ID
          blipUrl: '$blips.url',
          thumbnail: { 
            $ifNull: [
              '$blips.thumbnail', 
              'https://res.cloudinary.com/dljgzevaj/image/upload/v1742758888/sans-affiche_zu6wj4.png'
            ] 
          },
          productId: '$_id',
          productName: '$name',
          price: '$price',
          stock: '$stock',
          status: '$status',
          auctionInfo: {
            $cond: {
              if: { $eq: ['$status', 'offline_auction'] },
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
          createdAt: '$blips.createdAt'
        }
      },
      // Sort by newest first
      { $sort: { createdAt: -1 } },
      // Skip and limit for pagination
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    console.log(`Found ${blips.length} blips`);

    // Process blips to add isFollowing property
    const processedBlips = blips.map(blip => {
      // Create a new object without the followers array
      const { seller, ...rest } = blip;
      
      // Return the processed blip
      return {
        ...rest,
        seller
      };
    });

    // Also exclude draft products from the count
    const total = await Product.countDocuments({
      blips: { $exists: true, $ne: [] },
      status: { $ne: 'draft' },
      $nor: [
        {
          status: 'offline_auction', 
          'auction.status': 'ended'
        }
      ]
    });

    console.log(`Total blips count: ${total}`);

    res.json({
      blips: processedBlips,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlips: total
    });
  } catch (error) {
    console.error('Detailed error in getAllBlips:', error);
    res.status(500).json({ message: 'Failed to retrieve blips', error: error.message });
  }
};

// Get seller's blips
exports.getSellerBlips = async (req, res) => {
  const { sellerId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  // Optional processed filter
  // accepted values: "true", "false" (any other value: ignore the filter)
  let processedFilter = {};
  if (typeof req.query.processed === 'string') {
    const flag = req.query.processed.toLowerCase();
    if (flag === 'true' || flag === 'false') {
      processedFilter = { 'blips.processed': flag === 'true' };
    }
  }

  // Check if user is authenticated
  const buyerId = req.user?.id;
  const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

  try {
    console.log(`Starting getSellerBlips for seller: ${sellerId}`);

    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: 'Invalid seller ID' });
    }

    // Get seller info first
    const seller = await Seller.findById(sellerId, {
      firstName: 1,
      lastName: 1,
      businessName: 1,
      storeName: 1,
      storeAvatar: 1,
      aboutStore: 1,
      stats: 1, // Include stats for store rating
      followers: 1 // Include followers to check if buyer is following
    });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    console.log('Found seller:', seller.storeName);

    // Check if buyer is following this seller
    let isFollowing = false;
    if (isAuthenticated && Array.isArray(seller.followers)) {
      isFollowing = seller.followers.some(
        follower => follower.buyerId && follower.buyerId.toString() === buyerId
      );
    }

    // Check if seller has any blips before aggregation
    const hasBlips = await Product.exists({
      seller: new mongoose.Types.ObjectId(sellerId),
      blips: { $exists: true, $ne: [] },
      ...processedFilter,
      $nor: [
        {
          status: 'offline_auction', 
          'auction.status': 'ended'
        }
      ]
    });

    if (!hasBlips) {
      console.log('No blips found for seller');
      
      // Create seller object with isFollowing property
      const sellerResponse = {
        _id: seller._id,
        firstName: seller.firstName,
        lastName: seller.lastName,
        storeName: seller.storeName,
        storeAvatar: seller.storeAvatar,
        aboutStore: seller.aboutStore,
        storeRating: seller.stats ? seller.stats.averageRating : 0,
        totalStoreReviews: seller.stats ? seller.stats.totalReviews : 0,
        isFollowing
      };
      
      return res.json({
        message: 'Seller has no blips',
        seller: sellerResponse,
        blips: [],
        currentPage: page,
        totalPages: 0,
        totalBlips: 0
      });
    }

    const blips = await Product.aggregate([
      // Match products from this seller that have blips and exclude offline_auction products with ended status
      { 
        $match: { 
          seller: new mongoose.Types.ObjectId(sellerId),
          blips: { $exists: true, $ne: [] },
          $nor: [
            {
              status: 'offline_auction', 
              'auction.status': 'ended'
            }
          ],
          ...processedFilter
        } 
      },
      // Unwind the blips array
      { $unwind: '$blips' },
      { $match: processedFilter }, // no-op if processedFilter is {}
      // Lookup auction bidder information
      {
        $lookup: {
          from: 'buyers',
          localField: 'auction.currentHighestBid.buyer',
          foreignField: '_id',
          as: 'highestBidder'
        }
      },
      // Lookup auction winner information
      {
        $lookup: {
          from: 'buyers',
          localField: 'auction.winner.buyer',
          foreignField: '_id',
          as: 'auctionWinner'
        }
      },
      // Project needed fields with safe handling of likes/comments
      {
        $project: {
          _id: '$_id',                    // Product ID
          blipId: '$blips._id',          // Actual blip ID
          blipUrl: '$blips.url',
          thumbnail: { 
            $ifNull: [
              '$blips.thumbnail', 
              'https://res.cloudinary.com/dljgzevaj/image/upload/v1742758888/sans-affiche_zu6wj4.png'
            ] 
          },
          productId: '$_id',
          productName: '$name',
          price: '$price',
          // Include stock information
          stock: '$stock',
          // Include product status
          status: '$status',
          // Include auction information if it's an offline auction
          auctionInfo: {
            $cond: {
              if: { $eq: ['$status', 'offline_auction'] },
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
                  bidAmount: '$auction.winner.bidAmount',
                  winningDate: '$auction.winner.winningDate',
                  buyer: {
                    _id: '$auction.winner.buyer',
                    firstName: { $arrayElemAt: ['$auctionWinner.firstName', 0] },
                    lastName: { $arrayElemAt: ['$auctionWinner.lastName', 0] },
                    profileImage: { $arrayElemAt: ['$auctionWinner.profileImage', 0] }
                  }
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
          // Include discount information
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
            _id: { $literal: seller._id },
            firstName: { $literal: seller.firstName },
            lastName: { $literal: seller.lastName },
            storeName: { $literal: seller.storeName },
            storeAvatar: { $literal: seller.storeAvatar },
            aboutStore: { $literal: seller.aboutStore },
            storeRating: { $literal: seller.stats ? seller.stats.averageRating : 0 },
            totalStoreReviews: { $literal: seller.stats ? seller.stats.totalReviews : 0 },
            isFollowing: { $literal: isFollowing },
            isFeatured: { $literal: seller.isFeatured || false }
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
            viewCount: '$blips.viewCount'
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
          createdAt: '$blips.createdAt'
        }
      },
      // Sort by newest first
      { $sort: { createdAt: -1 } },
      // Skip and limit for pagination
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    console.log(`Found ${blips.length} blips for seller`);

    const total = await Product.countDocuments({
      seller: sellerId,
      blips: { $exists: true, $ne: [] },
      $nor: [
        {
          status: 'offline_auction', 
          'auction.status': 'ended'
        }
      ],
      ...processedFilter
    });

    console.log(`Total blips count for seller: ${total}`);

    // Create seller object with isFollowing property
    const sellerResponse = {
      _id: seller._id,
      firstName: seller.firstName,
      lastName: seller.lastName,
      storeName: seller.storeName,
      storeAvatar: seller.storeAvatar,
      aboutStore: seller.aboutStore,
      storeRating: seller.stats ? seller.stats.averageRating : 0,
      totalStoreReviews: seller.stats ? seller.stats.totalReviews : 0,
      isFollowing
    };

    // Add product and blip links to each blip
    const blipsWithLinks = blips.map(blip => ({
      ...blip,
      productLink: `${baseUrl}/products/${blip.productId}`,
      blipLink: `${baseUrl}/products/${blip.productId}/blips/${blip.blipId}`
    }));

    res.json({
      seller: sellerResponse,
      processedFilterApplied: Object.keys(processedFilter).length > 0,
      blips: blipsWithLinks,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlips: total
    });
  } catch (error) {
    console.error('Detailed error in getSellerBlips:', error);
    res.status(500).json({ message: 'Failed to retrieve blips', error: error.message });
  }
};

// Get suggested blips based on user preferences or popular blips
exports.getSuggestedBlips = async (req, res) => {
  try {
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
      const buyer = await mongoose.model('Buyer').findById(buyerId).select('selectedCategories following');
      
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
      
      if (buyer && buyer.following) {
        followedSellers = buyer.following.map(follow => follow.sellerId.toString());
        console.log(`Found followed sellers: ${followedSellers.length}`);
      }
    }
    
    // Get total count for primary match stage
    let total = await mongoose.model('Product').countDocuments(primaryMatchStage);
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
    let allBlips = await mongoose.model('Product').aggregate(primaryPipeline);
    
    // Fallback if no blips are found
    if (allBlips.length === 0) {
      console.log('No processed blips found, falling back to all blips');
      total = await mongoose.model('Product').countDocuments(fallbackMatchStage);
      const fallbackPipeline = [
        { $match: fallbackMatchStage },
        { $unwind: '$blips' },
        ...commonPipeline
      ];
      allBlips = await mongoose.model('Product').aggregate(fallbackPipeline);
    }
    
    // Handle case when no blips are found (should be rare with fallback)
    if (allBlips.length === 0) {
      return res.json({
        blips: [],
        isPersonalized: buyerCategories.length > 0,
        currentPage: page,
        totalPages: 0,
        totalBlips: 0
      });
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
    
    res.json({
      blips: rearrangedBlips,
      isPersonalized: buyerCategories.length > 0,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlips: total
    });
  } catch (error) {
    console.error('Detailed error in getSuggestedBlips:', error);
    res.status(500).json({ 
      status: false,
      message: 'Failed to retrieve suggested blips', 
      error: error.message 
    });
  }
};



// Toggle like on a blip
exports.toggleBlipLike = async (req, res) => {
  try {
    const { id, blipId } = req.params;
    const buyerId = req.user.id;

    // Add debug logging
    console.log('Debug - Processing like toggle:', {
      productId: id,
      blipId: blipId,
      buyerId: buyerId
    });

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(blipId)) {
      return res.status(400).json({ message: 'Invalid product or blip ID format' });
    }

    const product = await Product.findOne(
      { _id: id, "blips._id": new mongoose.Types.ObjectId(blipId) },
      { "blips.$": 1 }
    );

    if (!product || !product.blips || product.blips.length === 0) {
      console.log('Debug - Product or blip not found:', { id, blipId });
      return res.status(404).json({ message: 'Product or blip not found' });
    }

    const blip = product.blips[0];
    console.log('Debug - Found blip:', {
      blipId: blip._id,
      hasLikes: Array.isArray(blip.likes),
      likesCount: blip.likesCount || 0
    });

    // Ensure likes array exists
    const likes = Array.isArray(blip.likes) ? blip.likes : [];
    const likeIndex = likes.findIndex(like => like?.toString() === buyerId?.toString());

    console.log('Debug - Current like status:', {
      likeExists: likeIndex !== -1,
      currentLikes: blip.likesCount || 0,
      likeIndex
    });

    let updateOperation;
    if (likeIndex === -1) {
      // Add like
      updateOperation = {
        $addToSet: { "blips.$.likes": new mongoose.Types.ObjectId(buyerId) },
        $inc: { "blips.$.likesCount": 1 }
      };
    } else {
      // Remove like
      updateOperation = {
        $pull: { "blips.$.likes": new mongoose.Types.ObjectId(buyerId) },
        $inc: { "blips.$.likesCount": -1 }
      };
    }

    const result = await Product.updateOne(
      { _id: id, "blips._id": new mongoose.Types.ObjectId(blipId) },
      updateOperation
    );

    console.log('Debug - Update result:', result);

    if (result.modifiedCount === 0) {
      console.log('Debug - No document was modified');
      return res.status(400).json({ message: 'Failed to update like status' });
    }

    // Create notification for the seller when a blip is liked
    try {
      const notificationController = require('./notificationController');
      const Buyer = require('../models/Buyer');

      // Get buyer information
      const buyer = await Buyer.findById(buyerId).select('firstName lastName');
      const buyerName = buyer ? `${buyer.firstName} ${buyer.lastName}` : 'A buyer';

      // Get complete product info for notification since our current product object only has blips field
      const completeProduct = await Product.findById(id).select('name seller');
      if (!completeProduct) {
        throw new Error('Could not find complete product information');
      }

      // Create notification for seller
      await notificationController.createNotification(
        completeProduct.seller,
        'blip_like',
        {
          productId: completeProduct._id,
          productName: completeProduct.name,
          blipId: blipId,
          buyerId: buyerId,
          buyerName: buyerName
        }
      );

      console.log('Seller notification created for blip like');
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue execution even if notification fails
    }

    res.json({
      message: likeIndex === -1 ? 'Blip liked successfully' : 'Blip unliked successfully',
      liked: likeIndex === -1,
      likesCount: (blip.likesCount || 0) + (likeIndex === -1 ? 1 : -1)
    });

  } catch (error) {
    console.error('Toggle blip like error:', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      user: req.user
    });
    res.status(500).json({
      message: 'Failed to toggle blip like',
      error: error.message
    });
  }
};

// Add comment to a blip
exports.addBlipComment = async (req, res) => {
  try {
    const { id, blipId } = req.params;
    const { comment } = req.body;
    const buyerId = req.user.id;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({ message: 'Blip not found' });
    }

    blip.comments.push({
      buyer: buyerId,
      comment
    });

    await product.save();

    // Create notification for the seller when a comment is added
    try {
      const notificationController = require('./notificationController');
      const Buyer = require('../models/Buyer');

      // Get buyer information
      const buyer = await Buyer.findById(buyerId).select('firstName lastName');
      const buyerName = buyer ? `${buyer.firstName} ${buyer.lastName}` : 'A buyer';

      // Create notification for seller
      await notificationController.createNotification(
        product.seller,
        'blip_comment',
        {
          productId: product._id,
          productName: product.name,
          blipId: blipId,
          buyerId: buyerId,
          buyerName: buyerName,
          comment: comment.length > 50 ? `${comment.substring(0, 47)}...` : comment
        }
      );

      console.log('Seller notification created for blip comment');

      // Send email notification to seller about the new comment
      try {
        const Seller = require('../models/Seller');
        const seller = await Seller.findById(product.seller);

        if (seller && seller.email) {
          await notificationController.sendBlipCommentEmail(
            seller,
            buyerName,
            product.name,
            comment
          );
          console.log('Blip comment email sent to seller:', seller.email);
        }
      } catch (emailError) {
        console.error('Failed to send blip comment email:', emailError);
      }

    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    // Calculate total comments count (comments + all replies) for the blip
    const totalReplies = blip.comments.reduce((total, comment) => {
      return total + (comment.replies ? comment.replies.length : 0);
    }, 0);
    blip.commentsCount = blip.comments.length + totalReplies;

    res.status(201).json({
      message: 'Comment added successfully',
      commentsCount: blip.commentsCount
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

// Get comments for a product blip
exports.getBlipComments = async (req, res) => {
  try {
    console.log('Fetching blip comments for product:', req.params.id, 'blip:', req.params.blipId);
    const { id: productId, blipId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if user is authenticated and get userId/userType from JWT token
    const userId = req.user?.id;  // Use req.user.id from verifyToken middleware
    const userType = req.user?.role; // Use req.user.role from verifyToken middleware

    console.log('DEBUG: User auth in getBlipComments:', {
      isAuthenticated: !!req.user,
      user: req.user,
      userId,
      userType
    });

    // DEBUG: Show exact Auth header and token
    const authHeader = req.headers.authorization;
    console.log('DEBUG: Auth header:', {
      header: authHeader,
      hasToken: authHeader?.startsWith('Bearer ')
    });

    const token = authHeader?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token);
        console.log('DEBUG: Decoded token:', decoded);
      } catch (err) {
        console.error('DEBUG: Error decoding token:', err.message);
      }
    }

    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found with ID:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }

    const blip = product.blips.id(blipId);
    if (!blip) {
      console.log('Blip not found with ID:', blipId, 'in product:', productId);
      return res.status(404).json({ message: 'Blip not found' });
    }

    console.log('Found blip with', blip.comments.length, 'comments');

    // Get total comments count
    const totalComments = blip.comments.length;
    const totalPages = Math.ceil(totalComments / limit);

    // Get paginated comments
    const comments = blip.comments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    console.log('Processing', comments.length, 'comments after pagination');

    // Populate buyer information for each comment and their replies
    const populatedComments = await Promise.all(
      comments.map(async (comment) => {
        console.log('Processing comment ID:', comment._id);
        let populatedComment = comment.toObject();
        
        // Ensure repliesCount is included
        populatedComment.repliesCount = comment.replies ? comment.replies.length : 0;

        console.log(`DEBUG: Raw comment structure for ${comment._id}:`, JSON.stringify(comment));
        console.log(`DEBUG: Comment replies count for ${comment._id}:`, populatedComment.repliesCount);
        
        // Add isLiked field for authenticated users
        if (userId && userType) {
          // Debug the likes structure in detail
          console.log(`DEBUG: Comment ${comment._id} Likes Structure:`, {
            userId: userId,
            userIdType: typeof userId,
            userType: userType,
            likesCount: comment.likes ? comment.likes.length : 0,
          });
          
          // Extra log for detailed view of comment likes
          console.log(`DEBUG: All comment likes for ${comment._id}:`, JSON.stringify(comment.likes));
          
          // Inspect each like object's structure
          if (comment.likes && comment.likes.length > 0) {
            comment.likes.forEach((like, idx) => {
              const likeUserId = like.user ? like.user.toString() : (like._id ? like._id.toString() : 'none');
              
              console.log(`DEBUG: Like #${idx} exact structure:`, JSON.stringify(like));
              console.log(`DEBUG: Like #${idx} comparison:`, {
                likeUserId,
                requestUserId: userId.toString(),
                matches: likeUserId === userId.toString(),
                likeUserType: like.userType,
                requestUserType: userType,
                typeMatches: like.userType === userType
              });
            });
          }
          
          // Check all possible like formats in a much more detailed way
          let isLiked = false;
          let matchReason = 'none';
          
          // Loop through each like to find a match with detailed logging
          if (comment.likes && comment.likes.length > 0) {
            for (const like of comment.likes) {
              if (!like) continue;
              
              // Check user/userType format
              if (like.user && like.user.toString && like.userType) {
                const userMatches = like.user.toString() === userId.toString();
                const typeMatches = like.userType === userType;
                if (userMatches && typeMatches) {
                  isLiked = true;
                  matchReason = 'user/userType match';
                  break;
                }
              }
              
              // Check _id format
              if (like._id && like._id.toString) {
                if (like._id.toString() === userId.toString()) {
                  isLiked = true; 
                  matchReason = '_id match';
                  break;
                }
              }
              
              // Check string format
              if (typeof like === 'string') {
                if (like === userId.toString()) {
                  isLiked = true;
                  matchReason = 'string match';
                  break;
                }
              }
              
              // Check toString format
              if (like.toString && typeof like.toString === 'function') {
                if (like.toString() === userId.toString()) {
                  isLiked = true;
                  matchReason = 'toString match';
                  break;
                }
              }
            }
          }
          
          populatedComment.isLiked = isLiked;
          
          // Detailed debug for isLiked final result
          console.log(`DEBUG: Final isLiked determination for comment ${comment._id}:`, {
            userId: userId.toString(),
            userType: userType,
            isLiked: populatedComment.isLiked,
            matchReason: matchReason,
            commentsLikesCount: comment.likes ? comment.likes.length : 0
          });
          
        } else {
          populatedComment.isLiked = false;
        }
        
        // Populate comment author
        if (comment.buyer) {
          console.log('Fetching buyer info for comment:', comment._id);
          try {
            const buyer = await mongoose.model('Buyer').findById(comment.buyer)
              .select('firstName lastName profileImage');
            
            if (buyer) {
              console.log('Found buyer for comment:', buyer.firstName, buyer.lastName);
              populatedComment.buyer = buyer;
            } else {
              console.log('Buyer not found for comment with buyer ID:', comment.buyer);
            }
          } catch (err) {
            console.error('Error fetching buyer for comment:', err);
          }
        } else {
          console.log('No buyer ID for comment:', comment._id);
        }
        
        // Populate reply authors
        if (comment.replies && comment.replies.length > 0) {
          console.log('Processing', comment.replies.length, 'replies for comment:', comment._id);
          
          populatedComment.replies = await Promise.all(
            comment.replies.map(async (reply) => {
              console.log('Processing reply ID:', reply._id);
              let populatedReply = reply.toObject ? reply.toObject() : {...reply};
              
              // Add isLiked field for replies for authenticated users
              if (userId && userType) {
                // Debug the likes structure in detail
                console.log(`DEBUG: Reply ${reply._id} Likes Structure:`, {
                  userId: userId,
                  userIdType: typeof userId,
                  userType: userType,
                  likesCount: reply.likes ? reply.likes.length : 0,
                });
                
                // Inspect each like object's structure
                if (reply.likes && reply.likes.length > 0) {
                  reply.likes.forEach((like, idx) => {
                    console.log(`DEBUG: Reply Like #${idx} structure:`, {
                      likeObj: like,
                      likeObjType: typeof like,
                      hasUser: like.user !== undefined,
                      hasUserType: like.userType !== undefined,
                      has_id: like._id !== undefined,
                      userValue: like.user ? like.user.toString() : 'N/A',
                      _idValue: like._id ? like._id.toString() : 'N/A'
                    });
                  });
                }
                
                // Check both formats: new format with user/userType and old format with just _id
                populatedReply.isLiked = reply.likes && reply.likes.some(like => {
                  // Handle both formats: new structured likes and old format with just _id
                  if (like.user && like.user.toString && like.userType) {
                    const matches = like.user.toString() === userId.toString() && like.userType === userType;
                    console.log(`DEBUG: Checking reply like with user/userType:`, { 
                      likeUserId: like.user.toString(), 
                      userId: userId.toString(), 
                      usersMatch: like.user.toString() === userId.toString(),
                      likeUserType: like.userType,
                      userType: userType,
                      typesMatch: like.userType === userType, 
                      matches 
                    });
                    return matches;
                  } else if (like._id && like._id.toString) {
                    // Check if buyer is stored directly in the _id field (legacy format)
                    const matches = like._id.toString() === userId.toString();
                    console.log(`DEBUG: Checking reply like with _id:`, { 
                      likeId: like._id.toString(), 
                      userId: userId.toString(), 
                      matches 
                    });
                    return matches;
                  } else if (typeof like === 'string') {
                    const matches = like === userId.toString();
                    console.log(`DEBUG: Checking reply like as string:`, { 
                      likeString: like, 
                      userId: userId.toString(), 
                      matches 
                    });
                    return matches;
                  } else if (like.toString && typeof like.toString === 'function') {
                    const matches = like.toString() === userId.toString();
                    console.log(`DEBUG: Checking reply like with toString():`, { 
                      likeString: like.toString(), 
                      userId: userId.toString(), 
                      matches 
                    });
                    return matches;
                  }
                  return false;
                });
                
                // Debug the like checking result
                console.log(`DEBUG: Reply ${reply._id} isLiked result:`, {
                  userId: userId,
                  isLiked: populatedReply.isLiked
                });
              } else {
                populatedReply.isLiked = false;
              }
              
              // Handle both new structure (with user field) and old structure
              const replyUserId = reply.user || reply.buyer; // Try both fields
              const replyUserType = reply.userType || 'Buyer'; // Default to Buyer for old data
              
              if (replyUserId) {
                console.log('Fetching user info for reply:', reply._id, 'user type:', replyUserType);
                try {
                  const UserModel = mongoose.model(replyUserType);
                  const user = await UserModel.findById(replyUserId)
                    .select('firstName lastName profileImage storeName');
                  
                  if (user) {
                    console.log('Found user for reply:', user.firstName, user.lastName);
                    populatedReply.user = {
                      _id: user._id,
                      firstName: user.firstName,
                      lastName: user.lastName,
                      profileImage: user.profileImage
                    };
                    
                    if (replyUserType === 'Seller' && user.storeName) {
                      populatedReply.user.storeName = user.storeName;
                    }
                  } else {
                    console.log('User not found for reply with user ID:', replyUserId);
                  }
                } catch (err) {
                  console.error('Error fetching user for reply:', err);
                }
              } else {
                console.log('No user ID for reply:', reply._id);
                
                // For existing data without user info, try to add a placeholder
                populatedReply.user = {
                  _id: null,
                  firstName: "Unknown",
                  lastName: "User"
                };
              }
              
              return populatedReply;
            })
          );
        } else {
          console.log('No replies for comment:', comment._id);
        }
        
        return populatedComment;
      })
    );

    console.log('Successfully processed all comments and replies');
    
    return res.status(200).json({
      productId,
      blipId,
      comments: populatedComments,
      pagination: {
        total: totalComments,
        pages: totalPages,
        currentPage: page,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error getting blip comments:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Record blip view
exports.recordBlipView = async (req, res) => {
  try {
    const { id, blipId } = req.params;
    const userId = req.user.id;
    const userType = req.user.role === 'seller' ? 'Seller' : 'Buyer';

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({ message: 'Blip not found' });
    }

    // Check if user has viewed this blip before
    const existingView = blip.viewedBy.find(
      view => view.user.toString() === userId && view.userType === userType
    );

    if (existingView) {
      // Update last viewed time if it's been more than 1 hour since last view
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (existingView.lastViewed < oneHourAgo) {
        existingView.lastViewed = new Date();
        blip.viewCount += 1;
      }
    } else {
      // Add new view
      blip.viewedBy.push({
        user: userId,
        userType: userType,
        lastViewed: new Date()
      });
      blip.viewCount += 1;
    }

    await product.save();

    res.json({
      message: 'View recorded successfully',
      viewCount: blip.viewCount
    });
  } catch (error) {
    console.error('Error recording blip view:', error);
    res.status(500).json({
      message: 'Failed to record view',
      error: error.message
    });
  }
};

// Add reply to a blip comment
exports.addReplyToBlipComment = async (req, res) => {
  try {
    console.log('Adding reply to blip comment, params:', req.params);
    const { productId, blipId, commentId } = req.params;
    const { comment } = req.body;
    
    // Check if user is authenticated
    if (!req.user) {
      console.log('User not authenticated');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Extract user information from the request
    const userId = req.user._id || req.user.id;
    
    // Get user type from role field
    const userType = req.user.role === 'Seller' ? 'Seller' : 'Buyer';
    
    console.log('User info:', { userId, userType, role: req.user.role });

    if (!userId) {
      console.log('Could not determine user ID');
      return res.status(400).json({ message: 'User information is missing' });
    }

    if (!comment) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }

    // if (userType === 'Seller' && product.seller.toString() !== userId.toString()) {
    //   console.log('Unauthorized: Seller does not own this product');
    //   return res.status(403).json({ message: 'As a seller, you can only reply to comments on your own products' });
    // }

    const blip = product.blips.id(blipId);
    if (!blip) {
      console.log('Blip not found:', blipId);
      return res.status(404).json({ message: 'Blip not found' });
    }

    const blipComment = blip.comments.id(commentId);
    if (!blipComment) {
      console.log('Comment not found:', commentId);
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Initialize replies array if it doesn't exist
    if (!blipComment.replies) {
      blipComment.replies = [];
    }

    // Get user details to include in response
    const UserModel = mongoose.model(userType);
    const userDetails = await UserModel.findById(userId)
      .select(userType === 'Seller' ? 'storeName storeAvatar' : 'firstName lastName profileImage');

    console.log('Found user details:', userDetails);

    if (!userDetails) {
      console.log('User details not found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Add the reply with proper user field
    const newReply = {
      user: userId,
      userType: userType,
      comment: comment,
      createdAt: new Date(),
      likes: [],
      likesCount: 0
    };
    
    blipComment.replies.push(newReply);
    
    // Update replies count immediately
    blipComment.repliesCount = blipComment.replies.length;
    
    // Update total comments count (comments + all replies) for the blip
    const totalReplies = blip.comments.reduce((total, comment) => {
      return total + (comment.replies ? comment.replies.length : 0);
    }, 0);
    blip.commentsCount = blip.comments.length + totalReplies;
    
    console.log('Added new reply:', newReply);
    console.log('Updated replies count to:', blipComment.repliesCount);
    console.log('Updated total comments count to:', blip.commentsCount);

    await product.save();
    console.log('Product saved with new reply');

    // Format the response with user details
    const replyResponse = {
      ...newReply,
      _id: blipComment.replies[blipComment.replies.length - 1]._id, // Get the generated ID
      user: {
        _id: userDetails._id,
        name: userType === 'Seller' ? userDetails.storeName : `${userDetails.firstName} ${userDetails.lastName}`,
        avatar: userType === 'Seller' ? userDetails.storeAvatar?.url : userDetails.profileImage?.url
      }
    };

    // Create notification for the comment owner if replier is not the comment owner
    try {
      if (blipComment.buyer.toString() !== userId.toString()) {
        const notificationController = require('./notificationController');
        const notificationType = userType === 'Seller' ? 'seller_reply_to_comment' : 'buyer_reply_to_comment';
        
        // Get replier name
        const replierName = userType === 'Seller' 
          ? userDetails.storeName 
          : `${userDetails.firstName} ${userDetails.lastName}`;
        
        // Create notification for comment owner
        await notificationController.createNotification(
          blipComment.buyer,
          notificationType,
          {
            productId: product._id,
            productName: product.name,
            blipId: blipId,
            commentId: commentId,
            replierId: userId,
            replierName: replierName,
            reply: comment.length > 50 ? `${comment.substring(0, 47)}...` : comment
          }
        );
        
        console.log('Comment owner notification created for reply');
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue execution even if notification fails
    }

    return res.status(201).json({
      message: 'Reply added successfully',
      reply: replyResponse
    });
  } catch (error) {
    console.error('Error adding reply to blip comment:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};





// Like a blip comment
exports.likeBlipComment = async (req, res) => {
  try {
    const { productId, blipId, commentId } = req.params;
    
    // Extract user ID from the JWT token - should always use req.user.id set by verifyToken
    const userId = req.user?.id;
    
    // Get userType from role field in the JWT token
    let userType = req.user?.role;
    
    // Print all user token data for debugging
    console.log('DEBUG: User token data in likeBlipComment:', {
      user: req.user,
      userId,
      userType
    });

    // Additional validation for required fields
    if (!userId) {
      console.error('DEBUG: Missing userId in likeBlipComment');
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!userType) {
      console.error('DEBUG: Missing userType in likeBlipComment');
      userType = 'Buyer'; // Default to Buyer if not specified
    }

    console.log('DEBUG: Like blip comment request:', {
      productId,
      blipId,
      commentId,
      userId: userId,
      userType
    });

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({ message: 'Blip not found' });
    }

    const comment = blip.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Initialize likes array if it doesn't exist
    if (!comment.likes) {
      comment.likes = [];
    }

    console.log('DEBUG: Current likes structure:', {
      likes: comment.likes,
      likesCount: comment.likes.length
    });

    // Check if user already liked the comment by inspecting all the possible formats
    let existingLikeIndex = -1;
    
    // Check both old and new formats
    for (let i = 0; i < comment.likes.length; i++) {
      const like = comment.likes[i];
      
      if (!like) {
        console.log(`DEBUG: Found null or undefined like at index ${i}`);
        continue;
      }
      
      // Debug each like's format
      console.log(`DEBUG: Checking existing like at index ${i}:`, like);
      
      if (like.user && like.user.toString && like.user.toString() === userId.toString() && like.userType === userType) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching like in user/userType format at index', i);
        break;
      } else if (like._id && like._id.toString && like._id.toString() === userId.toString()) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching like in _id format at index', i);
        break;
      } else if (typeof like === 'string' && like === userId.toString()) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching like in string format at index', i);
        break;
      } else if (like.toString && typeof like.toString === 'function' && like.toString() === userId.toString()) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching like in object.toString() format at index', i);
        break;
      }
    }

    console.log('DEBUG: Existing like index:', existingLikeIndex);

    if (existingLikeIndex !== -1) {
      // Unlike if already liked
      comment.likes.splice(existingLikeIndex, 1);
      comment.likesCount = comment.likes.length;
      await product.save();
      
      console.log('DEBUG: Like removed, new likes count:', comment.likesCount);
      return res.json({ 
        message: 'Comment unliked successfully', 
        liked: false, 
        likesCount: comment.likesCount 
      });
    } else {
      // Add like with complete information
      const newLike = {
        user: userId,
        userType: userType,
        createdAt: new Date()
      };
      
      console.log('DEBUG: Adding new like:', newLike);
      comment.likes.push(newLike);
      comment.likesCount = comment.likes.length;
      
      // Debug the updated likes array
      console.log('DEBUG: Updated likes array after adding:', JSON.stringify(comment.likes));
      
      await product.save();
      
      console.log('DEBUG: Like added, new likes count:', comment.likesCount);
      return res.json({ 
        message: 'Comment liked successfully', 
        liked: true, 
        likesCount: comment.likesCount 
      });
    }
  } catch (error) {
    console.error('Error liking blip comment:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Like a reply to a blip comment
exports.likeBlipCommentReply = async (req, res) => {
  try {
    const { productId, blipId, commentId, replyId } = req.params;
    
    // Extract user ID from the JWT token - should always use req.user.id set by verifyToken
    const userId = req.user?.id;
    
    // Get userType from role field in the JWT token
    let userType = req.user?.role;
    
    // Print all user token data for debugging
    console.log('DEBUG: User token data in likeBlipCommentReply:', {
      user: req.user,
      userId,
      userType
    });

    // Additional validation for required fields
    if (!userId) {
      console.error('DEBUG: Missing userId in likeBlipCommentReply');
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!userType) {
      console.error('DEBUG: Missing userType in likeBlipCommentReply');
      userType = 'Buyer'; // Default to Buyer if not specified
    }

    console.log('DEBUG: Like blip comment reply request:', {
      productId,
      blipId,
      commentId,
      replyId,
      userId: userId,
      userType
    });

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({ message: 'Blip not found' });
    }

    const comment = blip.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    // Initialize likes array if it doesn't exist
    if (!reply.likes) {
      reply.likes = [];
    }

    console.log('DEBUG: Current reply likes structure:', {
      likes: reply.likes,
      likesCount: reply.likes.length
    });

    // Check if user already liked the reply with detailed logging
    let existingLikeIndex = -1;
    
    // Check both old and new formats with detailed logging
    for (let i = 0; i < reply.likes.length; i++) {
      const like = reply.likes[i];
      
      if (!like) {
        console.log(`DEBUG: Found null or undefined like at index ${i}`);
        continue;
      }
      
      // Debug each like's format
      console.log(`DEBUG: Checking existing reply like at index ${i}:`, like);
      
      if (like.user && like.user.toString && like.user.toString() === userId.toString() && like.userType === userType) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching reply like in user/userType format at index', i);
        break;
      } else if (like._id && like._id.toString && like._id.toString() === userId.toString()) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching reply like in _id format at index', i);
        break;
      } else if (typeof like === 'string' && like === userId.toString()) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching reply like in string format at index', i);
        break;
      } else if (like.toString && typeof like.toString === 'function' && like.toString() === userId.toString()) {
        existingLikeIndex = i;
        console.log('DEBUG: Found matching reply like in object.toString() format at index', i);
        break;
      }
    }

    console.log('DEBUG: Existing reply like index:', existingLikeIndex);

    if (existingLikeIndex !== -1) {
      // Unlike if already liked
      reply.likes.splice(existingLikeIndex, 1);
      reply.likesCount = reply.likes.length;
      await product.save();
      
      console.log('DEBUG: Reply like removed, new likes count:', reply.likesCount);
      return res.json({ 
        message: 'Reply unliked successfully', 
        liked: false, 
        likesCount: reply.likesCount 
      });
    } else {
      // Add like with complete information
      const newLike = {
        user: userId,
        userType: userType,
        createdAt: new Date()
      };
      
      console.log('DEBUG: Adding new reply like:', newLike);
      reply.likes.push(newLike);
      reply.likesCount = reply.likes.length;
      
      // Debug the updated likes array
      console.log('DEBUG: Updated reply likes array after adding:', JSON.stringify(reply.likes));
      
      await product.save();
      
      console.log('DEBUG: Reply like added, new likes count:', reply.likesCount);
      return res.json({ 
        message: 'Reply liked successfully', 
        liked: true, 
        likesCount: reply.likesCount 
      });
    }
  } catch (error) {
    console.error('Error liking blip comment reply:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// Get replies for a specific blip comment
exports.getBlipCommentReplies = async (req, res) => {
  try {
    const { productId, blipId, commentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if user is authenticated and get userId/userType from JWT token
    const userId = req.user?.id;  // Use req.user.id from verifyToken middleware
    const userType = req.user?.role; // Use req.user.role from verifyToken middleware

    console.log('DEBUG: User auth in getBlipCommentReplies:', {
      isAuthenticated: !!req.user,
      user: req.user,
      userId,
      userType
    });

    // DEBUG: Show exact Auth header and token
    const authHeader = req.headers.authorization;
    console.log('DEBUG: Auth header in getBlipCommentReplies:', {
      header: authHeader,
      hasToken: authHeader?.startsWith('Bearer ')
    });

    const token = authHeader?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token);
        console.log('DEBUG: Decoded token in getBlipCommentReplies:', decoded);
      } catch (err) {
        console.error('DEBUG: Error decoding token in getBlipCommentReplies:', err.message);
      }
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({ message: 'Blip not found' });
    }

    const comment = blip.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Initialize replies array if it doesn't exist
    if (!comment.replies) {
      comment.replies = [];
    }

    // Get total replies count
    const totalReplies = comment.replies.length;
    const totalPages = Math.ceil(totalReplies / limit);

    console.log('DEBUG: Total replies found:', totalReplies);

    // If no replies, return empty response
    if (totalReplies === 0) {
      return res.json({
        replies: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalReplies: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    }

    // Get paginated replies
    const replies = comment.replies
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    console.log('DEBUG: Processing', replies.length, 'replies after pagination');

    // Populate user information for each reply
    const populatedReplies = await Promise.all(
      replies.map(async (reply) => {
        console.log('DEBUG: Processing reply ID:', reply._id);
        
        // Add isLiked field for authenticated users
        let isLiked = false;
        
        console.log(`DEBUG: Raw reply structure for ${reply._id}:`, JSON.stringify(reply));
        
        if (userId && userType) {
          // Debug the likes structure in detail
          console.log(`DEBUG: Reply ${reply._id} Likes Structure:`, {
            userId: userId,
            userIdType: typeof userId,
            userType: userType,
            likesCount: reply.likes ? reply.likes.length : 0
          });
          
          // Extra log for detailed view of reply likes
          console.log(`DEBUG: All reply likes for ${reply._id}:`, JSON.stringify(reply.likes));
          
          // Inspect each like object's structure
          if (reply.likes && reply.likes.length > 0) {
            reply.likes.forEach((like, idx) => {
              const likeUserId = like.user ? like.user.toString() : (like._id ? like._id.toString() : 'none');
              
              console.log(`DEBUG: Reply like #${idx} exact structure:`, JSON.stringify(like));
              console.log(`DEBUG: Reply like #${idx} comparison:`, {
                likeUserId,
                requestUserId: userId.toString(),
                matches: likeUserId === userId.toString(),
                likeUserType: like.userType,
                requestUserType: userType,
                typeMatches: like.userType === userType
              });
            });
          }
          
          // Check all possible like formats in a much more detailed way
          let matchReason = 'none';
          
          // Loop through each like to find a match with detailed logging
          if (reply.likes && reply.likes.length > 0) {
            for (const like of reply.likes) {
              if (!like) continue;
              
              // Check user/userType format
              if (like.user && like.user.toString && like.userType) {
                const userMatches = like.user.toString() === userId.toString();
                const typeMatches = like.userType === userType;
                if (userMatches && typeMatches) {
                  isLiked = true;
                  matchReason = 'user/userType match';
                  break;
                }
              }
              
              // Check _id format
              if (like._id && like._id.toString) {
                if (like._id.toString() === userId.toString()) {
                  isLiked = true; 
                  matchReason = '_id match';
                  break;
                }
              }
              
              // Check string format
              if (typeof like === 'string') {
                if (like === userId.toString()) {
                  isLiked = true;
                  matchReason = 'string match';
                  break;
                }
              }
              
              // Check toString format
              if (like.toString && typeof like.toString === 'function') {
                if (like.toString() === userId.toString()) {
                  isLiked = true;
                  matchReason = 'toString match';
                  break;
                }
              }
            }
          }
          
          // Detailed debug for isLiked final result
          console.log(`DEBUG: Final isLiked determination for reply ${reply._id}:`, {
            userId: userId.toString(),
            userType: userType,
            isLiked: isLiked,
            matchReason: matchReason,
            replyLikesCount: reply.likes ? reply.likes.length : 0
          });
        }
        
        let userInfo;
        
        // Determine which model to use for populating user info
        if (reply.userType === 'Buyer') {
          try {
            userInfo = await mongoose.model('Buyer').findById(reply.user).select('firstName lastName avatar profileImage');
            if (!userInfo) {
              console.log(`DEBUG: Buyer not found with ID: ${reply.user}`);
              userInfo = { firstName: 'Unknown', lastName: 'User' };
            }
            return {
              _id: reply._id,
              user: {
                _id: userInfo._id || null,
                name: `${userInfo.firstName} ${userInfo.lastName}`,
                avatar: userInfo.profileImage?.url || userInfo.avatar || null // Include profile image, fallback to avatar
              },
              userType: reply.userType,
              comment: reply.comment,
              createdAt: reply.createdAt,
              likes: reply.likes,
              likesCount: reply.likesCount || 0,
              isLiked: isLiked
            };
          } catch (err) {
            console.error(`DEBUG: Error fetching buyer for reply:`, err);
            return {
              _id: reply._id,
              user: { _id: null, name: 'Unknown User', avatar: null },
              userType: reply.userType,
              comment: reply.comment,
              createdAt: reply.createdAt,
              likes: reply.likes,
              likesCount: reply.likesCount || 0,
              isLiked: isLiked
            };
          }
        } else {
          try {
            userInfo = await mongoose.model('Seller').findById(reply.user).select('storeName storeAvatar');
            if (!userInfo) {
              console.log(`DEBUG: Seller not found with ID: ${reply.user}`);
              userInfo = { storeName: 'Unknown Store' };
            }
            return {
              _id: reply._id,
              user: {
                _id: userInfo._id || null,
                name: userInfo.storeName,
                avatar: userInfo.storeAvatar?.url || null // Include store avatar
              },
              userType: reply.userType,
              comment: reply.comment,
              createdAt: reply.createdAt,
              likes: reply.likes,
              likesCount: reply.likesCount || 0,
              isLiked: isLiked
            };
          } catch (err) {
            console.error(`DEBUG: Error fetching seller for reply:`, err);
            return {
              _id: reply._id,
                              user: { 
                  _id: null, 
                  name: 'Unknown Store',
                  avatar: null
                },
              userType: reply.userType,
              comment: reply.comment,
              createdAt: reply.createdAt,
              likes: reply.likes,
              likesCount: reply.likesCount || 0,
              isLiked: isLiked
            };
          }
        }
      })
    );

    return res.json({
      replies: populatedReplies,
      pagination: {
        currentPage: page,
        totalPages,
        totalReplies,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching blip comment replies:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get specific blip details
exports.getBlipDetails = async (req, res) => {
  try {
    const { id, blipId } = req.params;
    
    // Check if user is authenticated
    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

    // Debug logging
    console.log('Debug - Fetching blip details:', {
      productId: id,
      blipId
    });

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(blipId)) {
      return res.status(400).json({ message: 'Invalid product or blip ID format' });
    }

    // Get the specific blip with aggregation to match getAllBlips structure
    const blips = await Product.aggregate([
      // Match the specific product and blip
      { 
        $match: { 
          _id: new mongoose.Types.ObjectId(id),
          "blips._id": new mongoose.Types.ObjectId(blipId)
        }
      },
      // Unwind the blips array
      { $unwind: '$blips' },
      // Match the specific blip
      { 
        $match: { 
          "blips._id": new mongoose.Types.ObjectId(blipId)
        }
      },
      // Lookup seller information
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: '$sellerInfo' },
      // Lookup auction bidder information
      {
        $lookup: {
          from: 'buyers',
          localField: 'auction.currentHighestBid.buyer',
          foreignField: '_id',
          as: 'highestBidder'
        }
      },
      // Project needed fields
      {
        $project: {
          _id: '$_id', // This is the product ID
          blipId: '$blips._id', // Add this line to include the blip ID
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
          description: '$description',
          price: '$price',
          stock: '$stock',
          status: '$status',
          auctionInfo: {
            $cond: {
              if: { $eq: ['$status', 'offline_auction'] },
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
          createdAt: '$blips.createdAt'
        }
      }
    ]);

    // If no blip found
    if (!blips || blips.length === 0) {
      console.log('Debug - Product or blip not found:', { id, blipId });
      return res.status(404).json({ message: 'Product or blip not found' });
    }

    // Get the single blip
    const processedBlip = blips[0];

    // Add product and blip links
    const blipWithLinks = {
      ...processedBlip,
      productLink: `${baseUrl}/products/${processedBlip.productId}`,
      blipLink: `${baseUrl}/products/${processedBlip.productId}/blips/${processedBlip.blipId}`
    };

    res.json({
      blips: [blipWithLinks]
    });
  } catch (error) {
    console.error('Error in getBlipDetails:', error);
    res.status(500).json({ message: 'Failed to retrieve blip details', error: error.message });
  }
};


// In-memory store for seen blips per session (consider Redis for production)
const sessionBlipStore = new Map();

// Maximum number of sessions to prevent memory issues
const MAX_SESSIONS = 1000;
const MAX_SEEN_BLIPS_PER_SESSION = 100;

// Clean up old sessions (run periodically)
// Only start the interval if not in test environment
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [sessionId, data] of sessionBlipStore.entries()) {
      if (now - data.lastAccess > 1 * 60 * 1000) { // 1 minute
        sessionBlipStore.delete(sessionId);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      console.log(`🧹 [BLIPS DEBUG] Cleaned up ${cleanedCount} expired sessions. Active sessions: ${sessionBlipStore.size}`);
    }
  }, 30 * 1000); // Clean every 30 seconds
}

exports.getPersonalizedBlips = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // Generate or get session ID (use existing session or create new one)
    // For authenticated users, use a more stable session ID
    const sessionId = req.query.sessionId || 
                     (req.user?.id ? `user_${req.user.id}_blips` : `anon_${Math.random().toString(36).substr(2, 9)}`);

    console.log(`🔍 [BLIPS DEBUG] Session ID: ${sessionId}, Page: ${page}, Limit: ${limit}`);

    // Reset session if user goes back to page 1 (treat as fresh browsing session)
    if (page === 1 && sessionBlipStore.has(sessionId)) {
      console.log(`🔄 [BLIPS DEBUG] Page 1 requested - resetting session for fresh start`);
      sessionBlipStore.delete(sessionId);
    }

    // Get or initialize seen blips for this session
    if (!sessionBlipStore.has(sessionId)) {
      // Check if we're at session limit to prevent memory issues
      if (sessionBlipStore.size >= MAX_SESSIONS) {
        console.log(`⚠️ [BLIPS DEBUG] Session limit reached (${MAX_SESSIONS}), forcing cleanup`);
        // Remove oldest sessions
        const sortedSessions = Array.from(sessionBlipStore.entries())
          .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
        
        const sessionsToRemove = sortedSessions.slice(0, Math.floor(MAX_SESSIONS * 0.2));
        sessionsToRemove.forEach(([id]) => sessionBlipStore.delete(id));
        console.log(`🧹 [BLIPS DEBUG] Removed ${sessionsToRemove.length} oldest sessions`);
      }
      
      sessionBlipStore.set(sessionId, { seenBlipIds: [], lastAccess: Date.now(), lastPage: 0 });
      console.log(`🆕 [BLIPS DEBUG] Created new session for: ${sessionId}`);
    } else {
      console.log(`♻️ [BLIPS DEBUG] Using existing session: ${sessionId}`);
    }
    
    const sessionData = sessionBlipStore.get(sessionId);
    sessionData.lastAccess = Date.now();
    
    // Check if user is going backwards (lower page than before) - reset session for better UX
    if (sessionData.lastPage && page < sessionData.lastPage) {
      console.log(`⬅️ [BLIPS DEBUG] Backward navigation detected: Page ${sessionData.lastPage} → Page ${page}. Resetting session.`);
      sessionData.seenBlipIds = [];
      sessionData.lastPage = page;
    } else {
      // Update last page for forward navigation
      sessionData.lastPage = Math.max(sessionData.lastPage || 0, page);
    }
    let seenBlipIds = sessionData.seenBlipIds;
    
    // Limit seen blips per session to prevent performance issues
    if (seenBlipIds.length > MAX_SEEN_BLIPS_PER_SESSION) {
      seenBlipIds = seenBlipIds.slice(-MAX_SEEN_BLIPS_PER_SESSION);
      sessionData.seenBlipIds = seenBlipIds;
      console.log(`✂️ [BLIPS DEBUG] Trimmed session to last ${MAX_SEEN_BLIPS_PER_SESSION} seen blips`);
    }
    
    console.log(`📝 [BLIPS DEBUG] Current seen blips count: ${seenBlipIds.length}`);
    console.log(`📄 [BLIPS DEBUG] Last page visited: ${sessionData.lastPage}, Current page: ${page}`);
    if (seenBlipIds.length > 0) {
      console.log(`📝 [BLIPS DEBUG] First 5 seen blip IDs: ${seenBlipIds.slice(0, 5).join(', ')}`);
    }

    const primaryMatchStage = {
      $and: [
        { 'blips.0': { $exists: true } },
        { blips: { $elemMatch: { processed: true } } },
        { status: { $ne: 'draft' } },
        {
          $or: [
            { status: { $ne: 'offline_auction' } },
            {
              $and: [
                { status: 'offline_auction' },
                { 'auction.status': { $ne: 'ended' } },
                { 'auction.endDate': { $gt: new Date() } }
              ]
            }
          ]
        }
      ]
    };
    

    const fallbackMatchStage = {
      'blips.0': { $exists: true },
      status: 'active'
    };

    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

    let followedSellers = [];

    if (isAuthenticated) {
      const buyer = await Buyer.findById(buyerId).select('following');

      if (buyer?.following?.length > 0) {
        followedSellers = buyer.following.map(f => f.sellerId.toString());
      }
    }

    // Count all products that have at least one blip and are not draft
    let total = await Product.countDocuments({ 'blips.0': { $exists: true }, status: { $ne: 'draft' } });
    
    const poolSize = Math.max(10, Math.min(total, limit * 3));
    const now = new Date();

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
              { $multiply: [{ $ifNull: ["$blips.likesCount", 0] }, 5] },
              { $multiply: [{ $ifNull: ["$blips.commentsCount", 0] }, 10] }
            ]
          }
        }
      },
      { $sort: { randomScore: -1 } },
      { $limit: poolSize },
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
          engagementScore: 1
        }
      }
    ];

    // Convert seen blip IDs to ObjectIds for MongoDB comparison
    const mongoose = require('mongoose');
    const seenBlipObjectIds = seenBlipIds.length > 0 ? seenBlipIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        console.log(`⚠️ [BLIPS DEBUG] Invalid ObjectId: ${id} - removing from session`);
        return null;
      }
    }).filter(id => id !== null) : [];

    // If we had invalid ObjectIds, clean them from the session
    if (seenBlipObjectIds.length < seenBlipIds.length) {
      const validIds = seenBlipObjectIds.map(id => id.toString());
      sessionData.seenBlipIds = validIds;
      console.log(`🧹 [BLIPS DEBUG] Cleaned invalid ObjectIds from session`);
    }

    // Log exclusion match stage details
    const exclusionMatchStage = seenBlipObjectIds.length > 0 ? { $match: { 'blips._id': { $nin: seenBlipObjectIds } } } : null;
    if (exclusionMatchStage) {
      console.log(`🚫 [BLIPS DEBUG] Excluding ${seenBlipObjectIds.length} blip ObjectIds from query`);
      console.log(`🚫 [BLIPS DEBUG] String IDs: ${seenBlipIds.slice(0, 3).join(', ')}`);
      console.log(`🚫 [BLIPS DEBUG] ObjectIds: ${seenBlipObjectIds.slice(0, 3).map(id => id.toString()).join(', ')}`);
    }

    const primaryPipeline = [
      { $match: primaryMatchStage },
      { $unwind: "$blips" },
      { $match: { "blips.processed": true } },
      ...(exclusionMatchStage ? [exclusionMatchStage] : []),
      ...commonPipeline
    ];

    console.log(`🔎 [BLIPS DEBUG] Executing primary pipeline with ${seenBlipObjectIds.length} exclusions...`);
    let products;
    try {
      products = await Product.aggregate(primaryPipeline).exec();
    } catch (dbError) {
      console.error(`❌ [BLIPS DEBUG] Database error in primary pipeline:`, dbError.message);
      // Fallback to query without exclusions if there's a DB error
      const simplePipeline = [
        { $match: primaryMatchStage },
        { $unwind: "$blips" },
        { $match: { "blips.processed": true } },
        ...commonPipeline
      ];
      products = await Product.aggregate(simplePipeline).exec();
      console.log(`🔄 [BLIPS DEBUG] Used fallback pipeline without exclusions due to DB error`);
    }
    
    console.log(`📊 [BLIPS DEBUG] Primary pipeline returned: ${products.length} products`);
    if (products.length > 0) {
      const blipIds = products.slice(0, 3).map(p => p.blip._id.toString());
      console.log(`📊 [BLIPS DEBUG] First 3 blip IDs from primary: ${blipIds.join(', ')}`);
      
      // Check if any returned blips were in the exclusion list (this shouldn't happen)
      const duplicates = blipIds.filter(id => seenBlipIds.includes(id));
      if (duplicates.length > 0) {
        console.log(`🚨 [BLIPS DEBUG] ERROR: Found duplicate blips in primary results: ${duplicates.join(', ')}`);
      }
    }

    if (products.length === 0) {
      console.log('❌ [BLIPS DEBUG] No primary blips, falling back to general pool');

      const fallbackPipeline = [
        { $match: fallbackMatchStage },
        { $unwind: "$blips" },
        ...(exclusionMatchStage ? [exclusionMatchStage] : []),
        ...commonPipeline
      ];

      console.log(`🔎 [BLIPS DEBUG] Executing fallback pipeline with ${seenBlipObjectIds.length} exclusions...`);
      try {
        products = await Product.aggregate(fallbackPipeline).exec();
      } catch (dbError) {
        console.error(`❌ [BLIPS DEBUG] Database error in fallback pipeline:`, dbError.message);
        // Final fallback to simple query without exclusions
        const simpleFallbackPipeline = [
          { $match: fallbackMatchStage },
          { $unwind: "$blips" },
          ...commonPipeline
        ];
        products = await Product.aggregate(simpleFallbackPipeline).exec();
        console.log(`🔄 [BLIPS DEBUG] Used simple fallback without exclusions due to DB error`);
      }
      console.log(`📊 [BLIPS DEBUG] Fallback pipeline returned: ${products.length} products`);
      
      if (products.length > 0) {
        const blipIds = products.slice(0, 3).map(p => p.blip._id.toString());
        console.log(`📊 [BLIPS DEBUG] First 3 blip IDs from fallback: ${blipIds.join(', ')}`);
        
        // Check if any returned blips were in the exclusion list (this shouldn't happen)
        const duplicates = blipIds.filter(id => seenBlipIds.includes(id));
        if (duplicates.length > 0) {
          console.log(`🚨 [BLIPS DEBUG] ERROR: Found duplicate blips in fallback results: ${duplicates.join(', ')}`);
        }
      }
    }

    await Product.populate(products, {
      path: 'seller',
      select: 'firstName lastName storeName storeAvatar aboutStore stats isFeatured followers'
    });

    if (products.length === 0) {
      return res.json({
        blips: [],
        currentPage: page,
        totalPages: 0,
        totalBlips: 0
      });
    }

    const transformedBlips = products.map(product => {
      const isFollowing = product.seller.followers && buyerId
        ? product.seller.followers.some(follower =>
            follower.buyerId?.toString() === buyerId.toString())
        : false;

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
          isFollowingSeller: isFollowing || followedSellers.includes(product.seller._id.toString()),
          engagementScore: product.engagementScore,
          daysSinceCreation: product.daysSinceCreation,
          isNewBlip: product.daysSinceCreation < 25,
          isLowView: (product.blip.viewCount || 0) < 25,
          sellerId: product.seller._id.toString()
        }
      };
    });

    // Simple categorization without buyer categories
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

    // Shuffle each category
    Object.keys(categorizedBlips).forEach(category => {
      const array = categorizedBlips[category];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    });

    // Create a balanced distribution algorithm
    function createBalancedBlipDistribution(categorizedBlips, totalNeeded) {
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

    const finalBlips = createBalancedBlipDistribution(categorizedBlips, limit);

    // Extract the blip IDs from the final result to add to seen blips
    const newlySeenBlipIds = finalBlips.map(blip => blip.blipId.toString());
    console.log(`➕ [BLIPS DEBUG] Adding ${newlySeenBlipIds.length} new blip IDs to session`);
    console.log(`➕ [BLIPS DEBUG] New blip IDs: ${newlySeenBlipIds.slice(0, 3).join(', ')}${newlySeenBlipIds.length > 3 ? '...' : ''}`);

    // Final check: ensure no duplicates in the final result
    const duplicatesInResult = newlySeenBlipIds.filter(id => seenBlipIds.includes(id));
    if (duplicatesInResult.length > 0) {
      console.log(`🚨 [BLIPS DEBUG] CRITICAL ERROR: Found duplicates in final result: ${duplicatesInResult.join(', ')}`);
      console.log(`🚨 [BLIPS DEBUG] This indicates the MongoDB exclusion is not working properly`);
    } else {
      console.log(`✅ [BLIPS DEBUG] No duplicates found in final result - exclusion working correctly`);
    }

    // Add the newly seen blip IDs to the session
    sessionData.seenBlipIds = [...sessionData.seenBlipIds, ...newlySeenBlipIds];
    sessionData.lastPage = page; // Update the last page accessed
    console.log(`✅ [BLIPS DEBUG] Session now has ${sessionData.seenBlipIds.length} total seen blips`);

    // Log some final stats
    console.log(`📤 [BLIPS DEBUG] Returning ${finalBlips.length} blips for page ${page}`);
    if (finalBlips.length > 0) {
      console.log(`📤 [BLIPS DEBUG] First blip product: ${finalBlips[0].productName} (ID: ${finalBlips[0].blipId})`);
    }

    res.json({
      blips: finalBlips,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlips: total,
      sessionId: sessionId // Return session ID so frontend can use it for subsequent requests
    });

  } catch (error) {
    console.error('Error in getPersonalizedBlips:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch personalized blips',
      error: error.message
    });
  }
};





// Add a new blip video to an existing product
exports.addBlipToProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user.id;

    // Validate product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // Find product and verify seller ownership
    const product = await Product.findOne({ _id: productId, seller: sellerId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or you do not have permission to modify it' });
    }

    // Validate if blip videos are provided
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No blip video files uploaded' });
    }

    // Check if adding these blips would exceed the limit (max 5 total)
    const currentBlipsCount = product.blips ? product.blips.length : 0;
    const newBlipsCount = req.files.length;
    
    if (currentBlipsCount + newBlipsCount > 5) {
      return res.status(400).json({ 
        message: `Cannot add ${newBlipsCount} blips. Maximum allowed is 5 and product already has ${currentBlipsCount} blips.` 
      });
    }

    // Process each uploaded blip
    const newBlips = []
    
    for (const file of req.files) {
      // Generate unique file names
      const videoKey = productBlips.GenerateUniqueFileName(sellerId, product._id)
      
      // Extract fileName from filename without extension
      const fileName = productBlips.ExtractFilenameFromS3Path(videoKey);
      
      // Upload the video to S3
      const uploadParameters = {
        Bucket: process.env.RAW_BLIPS_S3_BUCKET,
        Key: videoKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      await s3.upload(uploadParameters).promise();
      
      try {
        // Create the new blip object
        const newBlip = {
          url: '', // set this to empty string for now because model doesn't allow null values
          contentType: file.mimetype,
          thumbnail: '', // set this to empty string for now because model doesn't allow null values
          key: fileName,
          processed: false, // initially set to false beecause processing will be done later by Lambda and Amazon MediaConvert
          createdAt: new Date()
        };
        
        // Add the new blip to the product's blips array and our response array
        product.blips.push(newBlip);
        newBlips.push(newBlip);
        
      } catch (err) {
        console.error('Error creating new blip object:', err);
      }
    }
    
    // Save the product with all new blips
    await product.save();
    
    // Return the updated product with the new blips
    return res.status(201).json({
      success: true,
      message: `${newBlips.length} blip videos added successfully`,
      blips: newBlips
    });
    
  } catch (error) {
    console.error('Error adding blips to product:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to add blips to product', 
      error: error.message 
    });
  }
};


/**
 * Get related blips based on a specific blip ID
 * If no related blips are found, it returns random blips
 * @param {Object} req - request object with blipId
 * @param {Object} res - response object
 * @returns {Object} related or random blips
 */
exports.getRelatedBlips = async (req, res) => {
  try {
    const { blipId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    // Get buyerId and check authentication status
    const buyerId = req.user?.id;
    const isAuthenticated = !!buyerId && req.user?.role === 'Buyer';

    // Find the product that contains the reference blip
    const product = await Product.findOne({ 
      'blips._id': blipId,
      blips: { $elemMatch: { _id: blipId, processed: true } },
      status: 'active'
    })
    .populate({
      path: 'seller',
      select: '_id firstName lastName businessName email phoneNumber storeName storeAvatar storeBanner aboutStore stats isVerified createdAt warehouseDetails shippingOptions followers'
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Blip not found' });
    }
    
    // Get the source blip
    const sourceBlip = product.blips.id(blipId);
    
    if (!sourceBlip) {
      return res.status(404).json({ success: false, message: 'Blip not found' });
    }
    
    // Find products with blips in the same category
    // Excluding the current product to ensure we don't get the same blips
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      status: 'active',
      'blips.processed': true 
    })
    .populate({
      path: 'seller',
      select: '_id firstName lastName businessName storeName storeAvatar aboutStore stats isVerified followers'
    })
    .select('_id name blips category subCategory seo.slug price discount stats images variants stock status');
    
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
      const randomProducts = await Product.find({
        _id: { $ne: product._id },
        'blips.0': { $exists: true }, // ensure the product has at least one blip
        'blips.processed': true, // ensure blips are processed
        status: 'active'
      })
      .populate({
        path: 'seller',
        select: '_id firstName lastName businessName storeName storeAvatar aboutStore stats isVerified followers'
      })
      .select('_id name blips category subCategory seo.slug price discount stats images variants stock status');
      
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
    
    return res.status(200).json({
      success: true,
      blips: paginatedBlips,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalBlips: total,
      hasMore: endIndex < total
    });
  } catch (error) {
    console.error('Error fetching related blips:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get a pre-signed download URL for the original blip file (MP4)
exports.getOriginalBlipDownloadUrl = async (req, res) => {
  try {
    const { productId, blipId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(blipId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid product or blip ID format' 
      });
    }

    // Fetch product with minimal fields
    const product = await Product.findById(productId).select('seller blips name');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({ success: false, message: 'Blip not found' });
    }

    // Ensure we have the raw bucket
    const bucket = process.env.RAW_BLIPS_S3_BUCKET;
    if (!bucket) {
      return res.status(500).json({ success: false, message: 'RAW blips bucket not configured' });
    }

    // Resolve seller id safely (works whether populated or not)
    const sellerId = (product.seller && product.seller._id)
      ? product.seller._id.toString()
      : product.seller.toString();

    // Build the original raw MP4 object key
    // Folder structure: sellers/{sellerId}/products/{productId}/blips/{uuid}.mp4
    const folderPath = productBlips.GetFolderPath(sellerId, productId);
    const keyHasExt = typeof blip.key === 'string' && /\.mp4$/i.test(blip.key);
    let objectKey = `${folderPath}${keyHasExt ? blip.key : blip.key + '.mp4'}`;

    // Optional: verify object exists
    try {
      await s3.headObject({ Bucket: bucket, Key: objectKey }).promise();
    } catch (err) {
      // Fallback: some historical layouts may have nested UUID folder
      const nestedKey = `${folderPath}${blip.key}/${blip.key}.mp4`;
      try {
        await s3.headObject({ Bucket: bucket, Key: nestedKey }).promise();
        objectKey = nestedKey;
      } catch (err2) {
        return res.status(404).json({ success: false, message: 'Original blip file not found' });
      }
    }

    // Generate a filename for download
    const safeProductName = (product.name || 'blip')
      .toString()
      .replace(/[^\w\d\-_. ]+/g, '')
      .trim()
      .substring(0, 80) || 'blip';
    const downloadFileName = `${safeProductName}_${blip.key}.mp4`;

    const expiresIn = parseInt(process.env.BLIP_DOWNLOAD_URL_TTL || '300');
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: bucket,
      Key: objectKey,
      Expires: expiresIn,
      ResponseContentDisposition: `attachment; filename="${downloadFileName}"`,
      ResponseContentType: blip.contentType || 'video/mp4'
    });

    return res.status(200).json({
      success: true,
      downloadUrl: signedUrl,
      expiresInSeconds: expiresIn,
      file: {
        bucket,
        key: objectKey,
        contentType: blip.contentType || 'video/mp4'
      }
    });
  } catch (error) {
    console.error('Error generating original blip download URL:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate download URL', error: error.message });
  }
};

// Delete a blip from a product
exports.deleteBlipFromProduct = async (req, res) => {
  try {
    const { productId, blipId } = req.params;
    const sellerId = req.user.id;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(blipId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid product or blip ID format' 
      });
    }

    // Find product and verify seller ownership
    const product = await Product.findOne({ 
      _id: productId, 
      seller: sellerId 
    });

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found or you do not have permission to modify it' 
      });
    }

    // Find the blip in the product
    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blip not found in the product' 
      });
    }

    // Get the blip URL to delete from storage if needed
    const blipUrl = blip.url;
    const blipKey = blip.key;
    const thumbnailUrl = blip.thumbnail;

    // Remove the blip from the product
    product.blips.pull(blipId);
    await product.save();

    // delete product from S3
    productBlips.DeleteBlipFromS3(sellerId, productId, blipKey, process.env.RAW_BLIPS_S3_BUCKET)

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Blip deleted successfully',
      deletedBlip: {
        _id: blipId,
        url: blipUrl,
        thumbnail: thumbnailUrl
      }
    });
  } catch (error) {
    console.error('Error in deleteBlipFromProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blip',
      error: error.message
    });
  }
};




function reorderToAvoidSellerClusters(products, maxConsecutive = 1) {
  if (!products.length) return [];
  
  // Group products by seller
  const productsBySeller = {};
  products.forEach(product => {
    const sellerId = product.seller._id.toString();
    if (!productsBySeller[sellerId]) {
      productsBySeller[sellerId] = [];
    }
    productsBySeller[sellerId].push(product);
  });
  
  const sellerIds = Object.keys(productsBySeller);
  if (sellerIds.length <= 1) return products;
  
  const result = [];
  let lastUsedSellerIndices = [];
  
  // Keep selecting products until we've used them all or reached the limit
  while (result.length < products.length && sellerIds.some(id => productsBySeller[id].length > 0)) {
    // Find sellers that still have products and weren't recently used
    const availableSellers = sellerIds.filter((id, index) => 
      productsBySeller[id].length > 0 && !lastUsedSellerIndices.includes(index)
    );
    
    // If no available sellers that weren't recently used, reset the tracking
    if (availableSellers.length === 0) {
      lastUsedSellerIndices = [];
      continue;
    }
    
    // Pick a random available seller
    const randomIndex = Math.floor(Math.random() * availableSellers.length);
    const selectedSellerId = availableSellers[randomIndex];
    const sellerIndex = sellerIds.indexOf(selectedSellerId);
    
    // Add the seller to recently used (keep track of last N sellers)
    lastUsedSellerIndices.push(sellerIndex);
    if (lastUsedSellerIndices.length > sellerIds.length / 2) {
      lastUsedSellerIndices.shift();
    }
    
    // Take a product from this seller
    const product = productsBySeller[selectedSellerId].shift();
    result.push(product);
  }
  
  return result;
}

// Ensure we have a good mix of preferred and non-preferred products
// by interspersing them if possible
function mixPreferredAndGeneral(products) {
  if (products.length <= 1) return products;
  
  const preferred = products.filter(p => p.isPreferred);
  const general = products.filter(p => !p.isPreferred);
  
  // If we don't have both types, just return the original array
  if (preferred.length === 0 || general.length === 0) return products;
  
  const result = [];
  let preferredIndex = 0;
  let generalIndex = 0;
  
  // Start with preferred if available
  let usePreferred = true;
  
  while (preferredIndex < preferred.length || generalIndex < general.length) {
    if (usePreferred && preferredIndex < preferred.length) {
      result.push(preferred[preferredIndex++]);
    } else if (generalIndex < general.length) {
      result.push(general[generalIndex++]);
    } else if (preferredIndex < preferred.length) {
      // If we've exhausted general products, add remaining preferred
      result.push(preferred[preferredIndex++]);
    }
    
    // Toggle between preferred and general
    usePreferred = !usePreferred;
  }

  return result;
}

/**
 * Fisher-Yates shuffle algorithm to randomize array elements
 * @param {Array} array The array to shuffle
 * @returns {Array} The shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
