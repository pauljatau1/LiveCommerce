const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const Announcement = require('../models/Annoucement')
const Resource = require('../models/Resource')
const Seller = require('../models/Seller');
const Buyer = require('../models/Buyer');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Add middleware for secure code validation
const validateSecurityCode = (req, res, next) => {
  const { code } = req.params;
  
  // Check if the provided code matches the expected code (1122)
  if (code !== '1122') {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized access - Invalid security code' 
    });
  }
  
  next();
};


router.get('/paystack-keys/:code', validateSecurityCode, (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        // secretKey: process.env.PAYSTACK_SECRET_KEY,
        // publicKey: process.env.PAYSTACK_PUBLIC_KEY
        secretKey: 'sk_test_REDACTED',
        publicKey: 'pk_test_4362c6ccfe78d91e6216122d1b36c848fa051362'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve Paystack keys', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/public/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/categories', async (req, res) => {
  try {
    // Get all categories first (outside of any transaction)
    const categories = await Category.find({});
    
    // Get all necessary data for statistics calculation (outside of any transaction)
    // Get all orders and their items
    const orders = await Order.find({})
      .populate({
        path: 'items.product',
        select: 'category'
      });

    // Get product counts per category (this doesn't need a session)
    const productCounts = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 }
        }
      }
    ]);

    // Get stream counts per category (this doesn't need a session)
    const Stream = mongoose.model('Stream');
    const streamCounts = await Stream.aggregate([
      {
        $group: {
          _id: '$category',
          active: { 
            $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] } 
          },
          scheduled: { 
            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } 
          },
          ended: { 
            $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] } 
          }
        }
      }
    ]);

    // Create maps to store statistics
    const categoryStats = {};
    const productCountMap = productCounts.reduce((acc, item) => {
      acc[item._id] = item.totalProducts;
      return acc;
    }, {});
    
    // Create map for stream statistics
    const streamCountMap = streamCounts.reduce((acc, item) => {
      acc[item._id] = {
        active: item.active,
        scheduled: item.scheduled,
        ended: item.ended
      };
      return acc;
    }, {});

    // Process each order
    for (const order of orders) {
      for (const item of order.items) {
        if (!item.product || !item.product.category) continue;

        const category = item.product.category;
        
        if (!categoryStats[category]) {
          categoryStats[category] = {
            pending: { orders: 0, items: 0 },
            completed: { orders: 0, items: 0 }
          };
        }

        if (order.paid) {
          categoryStats[category].completed.orders++;
          categoryStats[category].completed.items += item.quantity;
        } else {
          categoryStats[category].pending.orders++;
          categoryStats[category].pending.items += item.quantity;
        }
      }
    }

    // Now update each category individually with its own transaction
    // This is more reliable than trying to update all categories in a single transaction
    const MAX_RETRIES = 3;
    
    // Process updates in batches to avoid overwhelming the database
    const updateBatch = async (category) => {
      let retryCount = 0;
      let success = false;
      
      while (retryCount < MAX_RETRIES && !success) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
          const categoryName = category.name;
          const stats = categoryStats[categoryName] || { 
            pending: { orders: 0, items: 0 },
            completed: { orders: 0, items: 0 }
          };
          
          // Update the category with its statistics
          await Category.findOneAndUpdate(
            { _id: category._id },
            {
              $set: {
                'statistics.orders.pending': stats.pending.orders,
                'statistics.orders.completed': stats.completed.orders,
                'statistics.items.pending': stats.pending.items,
                'statistics.items.sold': stats.completed.items,
                'statistics.totalProducts': productCountMap[categoryName] || 0,
                'statistics.streams.active': streamCountMap[categoryName]?.active || 0,
                'statistics.streams.scheduled': streamCountMap[categoryName]?.scheduled || 0,
                'statistics.streams.ended': streamCountMap[categoryName]?.ended || 0
              }
            },
            { session }
          );
          
          await session.commitTransaction();
          success = true;
        } catch (error) {
          await session.abortTransaction();
          
          const isTransientError = 
            (error.name === 'MongoError' || error.name === 'MongoServerError') &&
            (error.code === 112 || 
             (error.hasOwnProperty('errorLabels') && 
              error.errorLabels.includes('TransientTransactionError')));
          
          if (isTransientError && retryCount < MAX_RETRIES - 1) {
            console.log(`Retrying update for category ${category.name}. Attempt: ${retryCount + 1}`);
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
          } else {
            console.error(`Failed to update category ${category.name}:`, error);
            throw error;
          }
        } finally {
          session.endSession();
        }
      }
    };
    
    // Process categories in batches of 5 to limit concurrency
    const batchSize = 5;
    for (let i = 0; i < categories.length; i += batchSize) {
      const batch = categories.slice(i, i + batchSize);
      await Promise.all(batch.map(updateBatch));
    }
    
    // Get updated categories and sort them
    const updatedCategories = await Category.find().sort({
      'statistics.orders.completed': -1,
      'statistics.orders.pending': -1
    });

    res.json(updatedCategories);

  } catch (error) {
    console.error('Error retrieving categories:', error);
    res.status(500).json({
      message: 'Failed to retrieve categories',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/public/banners:
 *   get:
 *     summary: Get all banners
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of banners retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/banners', adminController.getAllBanners);

/**
 * @swagger
 * /api/public/announcements:
 *   get:
 *     summary: Get all announcements
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of announcements retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find();
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/public/resources:
 *   get:
 *     summary: Get all resources
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of resources retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   media:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [file, image, video]
 *                       url:
 *                         type: string
 *                   banner:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                   link:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/resources', async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/public/sellers:
 *   get:
 *     summary: Get all sellers (public)
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of all sellers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   storeName:
 *                     type: string
 *                   businessName:
 *                     type: string
 *                   aboutStore:
 *                     type: string
 *                   storeAvatar:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                   categories:
 *                     type: array
 *       500:
 *         description: Server error
 */
router.get('/sellers', async (req, res) => {
  try {
    const sellers = await Seller.find({ isDisabled: false })
      .select(`
        storeName businessName aboutStore storeAvatar storeBanner 
        categories businessAddress businessType businessEmail 
        isVerified createdAt isFeatured followers storeVisits
        firstName lastName phoneNumber businessNumber taxInformation
        accountType verificationDocuments shippingOptions warehouseDetails
      `);

    // Transform each seller to include formatted data
    const formattedSellers = sellers.map(seller => ({
      _id: seller._id,
      storeName: seller.storeName,
      businessName: seller.businessName,
      personalInfo: {
        firstName: seller.firstName,
        lastName: seller.lastName,
        email: seller.email,
        phoneNumber: seller.phoneNumber
      },
      businessInfo: {
        businessType: seller.businessType,
        businessNumber: seller.businessNumber,
        taxInformation: seller.taxInformation,
        accountType: seller.accountType
      },
      aboutStore: seller.aboutStore,
      storePresence: {
        storeAvatar: seller.storeAvatar,
        storeBanner: seller.storeBanner
      },
      categories: seller.categories,
      contactInformation: {
        businessEmail: seller.businessEmail,
        businessAddress: seller.businessAddress
      },
      shipping: seller.shippingOptions,
      warehouse: seller.warehouseDetails,
      verification: {
        isVerified: seller.isVerified,
        isFeatured: seller.isFeatured,
        documents: seller.verificationDocuments
      },
      metrics: {
        followers: seller.followers?.length || 0,
        storeVisits: seller.storeVisits || 0
      },
      createdAt: seller.createdAt
    }));

    res.json(formattedSellers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sellers', error: error.message });
  }
});

/**
 * @swagger
 * /api/public/buyers:
 *   get:
 *     summary: Get all buyers (public)
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of all buyers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   selectedCategories:
 *                     type: array
 *       500:
 *         description: Server error
 */
router.get('/buyers', async (req, res) => {
  try {
    const buyers = await Buyer.find({ isDisabled: false })
      .select(`
        username firstName lastName email country city
        profileImage bio selectedCategories createdAt
        isIdentityVerified phoneVerified
      `);

    // Transform each buyer to include formatted data
    const formattedBuyers = buyers.map(buyer => ({
      _id: buyer._id,
      username: buyer.username,
      firstName: buyer.firstName,
      lastName: buyer.lastName,
      location: {
        country: buyer.country,
        city: buyer.city
      },
      profileImage: buyer.profileImage,
      bio: buyer.bio,
      selectedCategories: buyer.selectedCategories,
      verification: {
        isIdentityVerified: buyer.isIdentityVerified,
        phoneVerified: buyer.phoneVerified
      },
      createdAt: buyer.createdAt
    }));

    res.json(formattedBuyers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching buyers', error: error.message });
  }
});

/**
 * @swagger
 * /api/public/sellers/{id}:
 *   get:
 *     summary: Get detailed seller information by ID
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller ID
 *     responses:
 *       200:
 *         description: Detailed seller information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 storeName:
 *                   type: string
 *                 businessName:
 *                   type: string
 *                 aboutStore:
 *                   type: string
 *                 storeAvatar:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                 storeBanner:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       subCategories:
 *                         type: array
 *                 businessAddress:
 *                   type: object
 *                   properties:
 *                     country:
 *                       type: string
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                 followers:
 *                   type: number
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get('/sellers/:id', async (req, res) => {
  try {
    const seller = await Seller.findOne({ _id: req.params.id, isDisabled: false })
      .select(`
        storeName businessName businessType aboutStore 
        storeAvatar storeBanner categories businessAddress 
        businessEmail isVerified createdAt isFeatured 
        followers storeVisits shippingOptions warehouseDetails
        firstName lastName phoneNumber businessNumber taxInformation
        accountType verificationDocuments emailVerified isNew
        activityFeed customers sellerAddress email reviews stats
      `);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Get total sold items from orders
    const Order = mongoose.model('Order');
    const soldItemsAggregation = await Order.aggregate([
      {
        $match: {
          seller: seller._id,
          paid: true
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: null,
          totalSoldItems: { $sum: '$items.quantity' }
        }
      }
    ]);

    // Get stream statistics
    const Stream = mongoose.model('Stream');
    const streamStats = await Stream.aggregate([
      {
        $match: {
          seller: seller._id
        }
      },
      {
        $group: {
          _id: null,
          totalStreams: { $sum: 1 },
          liveStreams: {
            $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] }
          },
          scheduledStreams: {
            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
          },
          endedStreams: {
            $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get product ratings statistics
    const Product = mongoose.model('Product');
    console.log(`Finding products for seller ID: ${seller._id}`);
    
    const productRatingsStats = await Product.aggregate([
      {
        $match: {
          seller: seller._id
        }
      },
      {
        $group: {
          _id: null,
          totalProductReviews: { $sum: { $size: { $ifNull: ["$reviews", []] } } },
          averageProductRating: { 
            $avg: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$reviews", []] } }, 0] },
                "$averageRating",
                null
              ]
            }
          }
        }
      }
    ]);
    
    console.log('Initial aggregation result:', JSON.stringify(productRatingsStats, null, 2));

    // Fallback query if the first approach returns 0 for average rating
    if (!productRatingsStats.length || productRatingsStats[0].averageProductRating === 0) {
      console.log('Using fallback method for product ratings calculation');
      
      // Check if the products have the expected structure
      const sampleProducts = await Product.find({ seller: seller._id }).limit(2);
      console.log('Sample product structure:', JSON.stringify(sampleProducts.map(p => ({
        id: p._id,
        hasReviews: !!p.reviews,
        reviewsLength: p.reviews ? p.reviews.length : 0,
        averageRating: p.averageRating,
        // Include a sample review if available
        sampleReview: p.reviews && p.reviews.length > 0 ? p.reviews[0] : null
      })), null, 2));
      
      const products = await Product.find({ seller: seller._id }).select('reviews averageRating');
      console.log(`Found ${products.length} products for manual calculation`);
      
      let totalReviews = 0;
      let sumRatings = 0;
      
      products.forEach(product => {
        console.log(`Product ${product._id}: averageRating=${product.averageRating}, reviews=${product.reviews ? product.reviews.length : 0}`);
        
        if (product.reviews && product.reviews.length > 0) {
          product.reviews.forEach(review => {
            if (review.rating) {
              sumRatings += review.rating;
              totalReviews++;
              console.log(`  - Review rating: ${review.rating}`);
            } else {
              console.log(`  - Review without rating:`, review);
            }
          });
        }
      });
      
      console.log(`Total ratings sum: ${sumRatings}, Total reviews: ${totalReviews}`);
      const avgRating = totalReviews > 0 ? (sumRatings / totalReviews) : 0;
      // Round to one decimal place
      const roundedAvgRating = Math.round(avgRating * 10) / 10;
      console.log(`Calculated average rating: ${avgRating}, rounded to: ${roundedAvgRating}`);
      
      if (!productRatingsStats.length) {
        productRatingsStats.push({
          totalProductReviews: totalReviews,
          averageProductRating: roundedAvgRating
        });
      } else {
        productRatingsStats[0].totalProductReviews = totalReviews || productRatingsStats[0].totalProductReviews;
        productRatingsStats[0].averageProductRating = roundedAvgRating || 0;
      }
      
      console.log('Updated productRatingsStats:', JSON.stringify(productRatingsStats, null, 2));
    }

    // Alternative calculation - try a direct aggregate on review ratings
    console.log('Attempting direct review rating aggregation');
    try {
      const directRatingAgg = await Product.aggregate([
        { $match: { seller: seller._id } },
        { $unwind: { path: "$reviews", preserveNullAndEmptyArrays: false } },
        { $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            avgRating: { $avg: "$reviews.rating" }
          }
        }
      ]);
      
      console.log('Direct rating aggregation result:', JSON.stringify(directRatingAgg, null, 2));
      
      if (directRatingAgg.length > 0 && directRatingAgg[0].avgRating > 0) {
        console.log(`Using direct aggregation result: ${directRatingAgg[0].avgRating}`);
        // Round to one decimal place
        const roundedRating = Math.round(directRatingAgg[0].avgRating * 10) / 10;
        console.log(`Rounded rating: ${roundedRating}`);
        productRatingsStats[0].averageProductRating = roundedRating;
        productRatingsStats[0].totalProductReviews = directRatingAgg[0].totalReviews;
      }
    } catch (err) {
      console.error('Error in direct rating aggregation:', err);
    }

    // Transform the response with detailed formatting
    const sellerResponse = {
      _id: seller._id,
      storeName: seller.storeName,
      businessName: seller.businessName,
      personalInfo: {
        firstName: seller.firstName,
        lastName: seller.lastName,
        phoneNumber: seller.phoneNumber,
        email: seller.email,
        emailVerified: seller.emailVerified
      },
      businessInfo: {
        businessType: seller.businessType,
        businessNumber: seller.businessNumber,
        taxInformation: seller.taxInformation,
        accountType: seller.accountType
      },
      aboutStore: seller.aboutStore,
      storePresence: {
        storeAvatar: seller.storeAvatar,
        storeBanner: seller.storeBanner
      },
      categories: seller.categories,
      location: {
        country: seller.businessAddress?.country || seller.sellerAddress?.country,
        state: seller.businessAddress?.state || seller.sellerAddress?.state,
        city: seller.businessAddress?.city || seller.sellerAddress?.city
      },
      contactInformation: {
        businessEmail: seller.businessEmail,
        businessAddress: seller.businessAddress,
        sellerAddress: seller.sellerAddress
      },
      shipping: seller.shippingOptions,
      warehouse: seller.warehouseDetails,
      verification: {
        isVerified: seller.isVerified,
        isFeatured: seller.isFeatured,
        documents: seller.verificationDocuments
      },
      metrics: {
        followers: seller.followers?.length || 0,
        storeVisits: seller.storeVisits || 0,
        customerCount: seller.customers?.length || 0,
        totalSoldItems: soldItemsAggregation[0]?.totalSoldItems || 0,
        streams: {
          total: streamStats[0]?.totalStreams || 0,
          live: streamStats[0]?.liveStreams || 0,
          scheduled: streamStats[0]?.scheduledStreams || 0,
          ended: streamStats[0]?.endedStreams || 0
        }
      },
      ratings: {
        average: seller.stats?.averageRating || 0,
        total: seller.stats?.totalReviews || 0,
        distribution: seller.stats?.ratingDistribution || {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        },
        products: {
          averageRating: productRatingsStats[0]?.averageProductRating || Math.round((seller.stats?.averageRating || 0.0) * 10) / 10,
          totalReviews: productRatingsStats[0]?.totalProductReviews || 0
        }
      },
      activity: {
        isNew: seller.isNew,
        recentActivity: seller.activityFeed?.slice(0, 5) || []
      },
      createdAt: seller.createdAt
    };

    res.json(sellerResponse);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching seller details', error: error.message });
  }
});

/**
 * @swagger
 * /api/public/buyers/{id}:
 *   get:
 *     summary: Get detailed buyer information by ID
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Buyer ID
 *     responses:
 *       200:
 *         description: Detailed buyer information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 selectedCategories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       subCategories:
 *                         type: array
 *                 isIdentityVerified:
 *                   type: boolean
 *                 country:
 *                   type: string
 *                 city:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.get('/buyers/:id', async (req, res) => {
  try {
    const buyer = await Buyer.findOne({ _id: req.params.id, isDisabled: false })
      .select(`
        username firstName lastName email country city
        profileImage bio selectedCategories createdAt
        isIdentityVerified phoneVerified wishlist
      `);
    
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Transform the response with detailed formatting
    const buyerResponse = {
      _id: buyer._id,
      username: buyer.username,
      personalInfo: {
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        profileImage: buyer.profileImage,
        bio: buyer.bio
      },
      location: {
        country: buyer.country,
        city: buyer.city
      },
      preferences: {
        selectedCategories: buyer.selectedCategories,
        wishlistCount: buyer.wishlist?.length || 0
      },
      verification: {
        isIdentityVerified: buyer.isIdentityVerified,
        phoneVerified: buyer.phoneVerified
      },
      createdAt: buyer.createdAt
    };

    res.json(buyerResponse);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching buyer details', error: error.message });
  }
});

module.exports = router;


