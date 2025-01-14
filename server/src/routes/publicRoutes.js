const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const Announcement = require('../models/Annoucement')
const Resource = require('../models/Resource')
const Seller = require('../models/Seller');
const Buyer = require('../models/Buyer');

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
router.get('/categories', adminController.getCategories);

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
        activityFeed customers sellerAddress
      `);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
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
        customerCount: seller.customers?.length || 0
      },
      activity: {
        isNew: seller.isNew,
        recentActivity: seller.activityFeed?.slice(0, 5) || [], // Get 5 most recent activities
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


