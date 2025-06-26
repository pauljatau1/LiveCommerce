const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const publicController = require('../controllers/publicController');
const Announcement = require('../models/Annoucement')
const Resource = require('../models/Resource')
const Seller = require('../models/Seller');
const Buyer = require('../models/Buyer');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { Parser } = require('json2csv');

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
        secretKey: process.env.PAYSTACK_SECRET_KEY,
        publicKey: process.env.PAYSTACK_PUBLIC_KEY
      
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
 * /api/public/major-categories:
 *   get:
 *     summary: Get all active major categories
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of active major categories retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/major-categories', publicController.getMajorCategories);

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
    // Get all categories first
    const categories = await Category.find({});
    
    // Get all necessary data for statistics calculation
    // Get all orders and their items
    const orders = await Order.find({})
      .populate({
        path: 'items.product',
        select: 'category'
      });

    // Get product counts per category
    const productCounts = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 }
        }
      }
    ]);

    // Get stream counts per category
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

    // Update all categories with their statistics
    // Process updates in batches to avoid overwhelming the database
    const batchSize = 5;
    const updatePromises = [];

    for (let i = 0; i < categories.length; i += batchSize) {
      const batch = categories.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (category) => {
        const categoryName = category.name;
        const stats = categoryStats[categoryName] || { 
          pending: { orders: 0, items: 0 },
          completed: { orders: 0, items: 0 }
        };
        
        try {
          // Update the category with its statistics
          await Category.findByIdAndUpdate(
            category._id,
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
            }
          );
        } catch (error) {
          console.error(`Failed to update category ${categoryName}:`, error);
          // Continue with other updates even if one fails
        }
      });

      updatePromises.push(...batchPromises);
    }

    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
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
 * /api/public/categories/search:
 *   get:
 *     summary: Search categories by name and subcategories
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for category or subcategory names
 *     responses:
 *       200:
 *         description: List of matching categories
 *       500:
 *         description: Internal server error
 */
router.get('/categories/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Create case-insensitive search regex
    const searchRegex = new RegExp(query, 'i');

    // Search categories where:
    // 1. Main category name matches
    // 2. Any subcategory name matches
    // 3. Any sub-subcategory name matches
    const categories = await Category.find({
      $or: [
        { name: searchRegex },
        { 'subCategories.name': searchRegex },
        { 'subCategories.subSubCategories.name': searchRegex }
      ]
    });

    // Format the response to highlight matching items
    const formattedResults = categories.map(category => {
      const result = {
        _id: category._id,
        name: category.name,
        image: category.image,
        platformFee: category.platformFee,
        statistics: category.statistics,
        matchType: [],
        matchingSubCategories: []
      };

      // Check if main category matches
      if (searchRegex.test(category.name)) {
        result.matchType.push('main');
      }

      // Check and format matching subcategories
      if (category.subCategories) {
        category.subCategories.forEach(subCat => {
          const subMatches = {
            name: subCat.name,
            matches: false,
            matchingSubSubs: []
          };

          // Check if subcategory matches
          if (searchRegex.test(subCat.name)) {
            subMatches.matches = true;
            result.matchType.push('sub');
          }

          // Check if any sub-subcategories match
          if (subCat.subSubCategories) {
            subCat.subSubCategories.forEach(subSubCat => {
              if (searchRegex.test(subSubCat.name)) {
                subMatches.matchingSubSubs.push(subSubCat.name);
                result.matchType.push('subsub');
              }
            });
          }

          // Only include subcategory if it or its sub-subcategories match
          if (subMatches.matches || subMatches.matchingSubSubs.length > 0) {
            result.matchingSubCategories.push(subMatches);
          }
        });
      }

      return result;
    });

    // Filter out categories with no matches
    const finalResults = formattedResults.filter(
      result => result.matchType.length > 0 || result.matchingSubCategories.length > 0
    );

    res.json({
      success: true,
      count: finalResults.length,
      results: finalResults
    });
  } catch (error) {
    console.error('Error searching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search categories',
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
 *     summary: Get all resources with filtering options
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *           enum: [youtube, file]
 *         description: Filter by resource type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [auqli_university, other]
 *         description: Filter by category
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
 *                   resourceType:
 *                     type: string
 *                     enum: [youtube, file]
 *                   category:
 *                     type: string
 *                     enum: [auqli_university, other]
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
    // Extract query parameters for filtering
    const { resourceType, category } = req.query;
    
    // Build filter object
    const filter = {};
    if (resourceType && ['youtube', 'file'].includes(resourceType)) {
      filter.resourceType = resourceType;
    }
    if (category && ['auqli_university', 'other'].includes(category)) {
      filter.category = category;
    }
    
    const resources = await Resource.find(filter).sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/public/resources/category/{category}:
 *   get:
 *     summary: Get resources by category
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: category
 *         schema:
 *           type: string
 *           enum: [auqli_university, other]
 *         required: true
 *         description: Category name
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *           enum: [youtube, file]
 *         description: Filter by resource type
 *     responses:
 *       200:
 *         description: List of resources for the specified category
 *       404:
 *         description: No resources found for this category
 *       500:
 *         description: Internal server error
 */
router.get('/resources/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { resourceType } = req.query;
    
    if (!['auqli_university', 'other'].includes(category)) {
      return res.status(400).json({ 
        message: 'Invalid category. Must be either "auqli_university" or "other"' 
      });
    }
    
    // Build filter object
    const filter = { category };
    if (resourceType && ['youtube', 'file'].includes(resourceType)) {
      filter.resourceType = resourceType;
    }
    
    const resources = await Resource.find(filter).sort({ createdAt: -1 });
    
    if (resources.length === 0) {
      return res.status(404).json({ message: 'No resources found for this category' });
    }
    
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/public/resources/type/{resourceType}:
 *   get:
 *     summary: Get resources by type
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: resourceType
 *         schema:
 *           type: string
 *           enum: [youtube, file]
 *         required: true
 *         description: Resource type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [auqli_university, other]
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of resources for the specified type
 *       404:
 *         description: No resources found for this type
 *       500:
 *         description: Internal server error
 */
router.get('/resources/type/:resourceType', async (req, res) => {
  try {
    const { resourceType } = req.params;
    const { category } = req.query;
    
    if (!['youtube', 'file'].includes(resourceType)) {
      return res.status(400).json({ 
        message: 'Invalid resource type. Must be either "youtube" or "file"' 
      });
    }
    
    // Build filter object
    const filter = { resourceType };
    if (category && ['auqli_university', 'other'].includes(category)) {
      filter.category = category;
    }
    
    const resources = await Resource.find(filter).sort({ createdAt: -1 });
    
    if (resources.length === 0) {
      return res.status(404).json({ message: 'No resources found for this type' });
    }
    
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
        accountType verificationDocuments emailVerified isNewSeller
        activityFeed customers sellerAddress email reviews stats isInternational
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
        isNew: seller.isNewSeller,
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

/**
 * @swagger
 * /api/public/platform-notifications:
 *   get:
 *     summary: Get all active platform notifications
 *     tags: [Public, Notifications]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of notifications per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [info, warning, announcement, update, promotional, maintenance]
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: List of active platform notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           content:
 *                             type: string
 *                           type:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           startDate:
 *                             type: string
 *                             format: date-time
 *                           endDate:
 *                             type: string
 *                             format: date-time
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalNotifications:
 *                       type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/platform-notifications', publicController.getActivePlatformNotifications);

// Helper function to strip HTML tags
const stripHtmlTags = (str) => {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
};

// Generate Meta product feed CSV
router.get('/meta-product-feed', async (req, res) => {
  try {
    // Get all active products
    const products = await Product.find({ status: 'active' })
      .populate('seller', 'storeName');

    // Transform products into Meta format
    const metaProducts = products.map(product => ({
      id: product._id.toString(),
      title: product.name,
      description: stripHtmlTags(product.description),
      availability: product.stock > 0 ? 'in stock' : 'out of stock',
      condition: product.condition || 'new',
      price: `${product.price} NGN`,
      link: `https://app.auqli.live/s/${product._id}A`,
      image_link: product.images[0]?.url || 'https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png',
      brand: product.brand || product.seller.storeName || 'Auqli'
    }));

    // Define fields for CSV
    const fields = [
      'id',
      'title',
      'description',
      'availability',
      'condition',
      'price',
      'link',
      'image_link',
      'brand'
    ];

    // Create CSV parser
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(metaProducts);

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=meta-product-feed.csv');

    // Send CSV
    res.send(csv);

  } catch (error) {
    console.error('Error generating Meta product feed:', error);
    res.status(500).json({
      message: 'Failed to generate Meta product feed',
      error: error.message
    });
  }
});

module.exports = router;


