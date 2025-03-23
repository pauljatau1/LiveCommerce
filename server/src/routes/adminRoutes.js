const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const bankService = require('../services/bankService');


// /**
//  * @swagger
//  * /api/admin/register:
//  *   post:
//  *     summary: Register a new admin
//  *     tags: [Admin]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               username:
//  *                 type: string
//  *               email:
//  *                 type: string
//  *               password:
//  *                 type: string
//  *     responses:
//  *       201:
//  *         description: Admin registered successfully
//  *       400:
//  *         description: Bad request
//  */
// router.post('/register', adminController.register);

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Login an admin
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/login', adminController.login);

/**
 * @swagger
 * /api/admin/profile:
 *   get:
 *     summary: Get admin profile
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/profile', authMiddleware.verifyToken, adminController.getProfile);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/users', authMiddleware.verifyToken, adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/sellers:
 *   get:
 *     summary: Get all sellers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sellers retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/sellers', authMiddleware.verifyToken, adminController.getAllSellers);

/**
 * @swagger
 * /api/admin/sellers/{sellerId}/disable:
 *   put:
 *     summary: Disable a seller
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Seller ID
 *     responses:
 *       200:
 *         description: Seller disabled successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/sellers/:sellerId/disable', authMiddleware.verifyToken, adminController.disableSeller);

/**
 * @swagger
 * /api/admin/sellers/{sellerId}/enable:
 *   put:
 *     summary: Enable a seller
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Seller ID
 *     responses:
 *       200:
 *         description: Seller enabled successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/sellers/:sellerId/enable', authMiddleware.verifyToken, adminController.enableSeller);

/**
 * @swagger
 * /api/admin/sellers/{sellerId}/feature:
 *   put:
 *     summary: Mark a seller as featured
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Seller ID
 *     responses:
 *       200:
 *         description: Seller marked as featured successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/sellers/:sellerId/feature', authMiddleware.verifyToken, adminController.markSellerAsFeatured);

/**
 * @swagger
 * /api/admin/buyers/{buyerId}/disable:
 *   put:
 *     summary: Disable a buyer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Buyer ID
 *     responses:
 *       200:
 *         description: Buyer disabled successfully
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.put('/buyers/:buyerId/disable', authMiddleware.verifyToken, adminController.disableBuyer);

/**
 * @swagger
 * /api/admin/buyers/{buyerId}/enable:
 *   put:
 *     summary: Enable a buyer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Buyer ID
 *     responses:
 *       200:
 *         description: Buyer enabled successfully
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.put('/buyers/:buyerId/enable', authMiddleware.verifyToken, adminController.enableBuyer);

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: Get all products
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/products', authMiddleware.verifyToken, adminController.getAllProducts);

/**
 * @swagger
 * /api/admin/sellers/{sellerId}/verify:
 *   put:
 *     summary: Verify a seller's business account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Seller ID
 *     responses:
 *       200:
 *         description: Business account verified successfully
 *       400:
 *         description: Seller is not a business account
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/sellers/:sellerId/verify', authMiddleware.verifyToken, adminController.verifyBusinessAccount);


/**
 * @swagger
 * /api/admin/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *               subCategories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Bad request
 */
router.post('/categories', 
  authMiddleware.verifyToken, 
  upload.single('image'), 
  adminController.createCategory
);


/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   image:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       public_id:
 *                         type: string
 *                   subCategories:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *       500:
 *         description: Internal server error
 */
router.get('/categories', authMiddleware.verifyToken, adminController.getCategories);


/**
 * @swagger
 * /api/admin/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *               subCategories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
router.put('/categories/:id', 
  authMiddleware.verifyToken, 
  upload.single('image'), 
  adminController.updateCategory
);


/**
 * @swagger
 * /api/admin/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
router.delete('/categories/:id', authMiddleware.verifyToken, adminController.deleteCategory);

/**
 * @swagger
 * /api/admin/categories/{categoryId}/subcategories:
 *   get:
 *     summary: Get all subcategories of a particular category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: List of subcategories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
router.get('/categories/:categoryId/subcategories', authMiddleware.verifyToken, adminController.getSubCategories);


/**
 * @swagger
 * /api/admin/banners:
 *   post:
 *     summary: Create a new banner
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - callToActionLink
 *               - mainImage
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               callToActionLink:
 *                 type: string
 *               mainImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Banner created successfully
 *       400:
 *         description: Bad request
 */
router.post('/banners', 
  authMiddleware.verifyToken,
  upload.single('mainImage'),
  adminController.createBanner
);

/**
 * @swagger
 * /api/admin/banners/{bannerId}:
 *   put:
 *     summary: Update a banner
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bannerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Banner ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               callToActionLink:
 *                 type: string
 *               mainImage:
 *                 type: string
 *                 format: binary
 *                 description: Optional. Only include if updating the image
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *       404:
 *         description: Banner not found
 *       500:
 *         description: Internal server error
 */
router.put('/banners/:bannerId', 
  authMiddleware.verifyToken,
  upload.single('mainImage'),
  adminController.updateBanner
);

/**
 * @swagger
 * /api/admin/banners/{bannerId}:
 *   delete:
 *     summary: Delete a banner
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bannerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *       404:
 *         description: Banner not found
 *       500:
 *         description: Internal server error
 */
router.delete('/banners/:bannerId', authMiddleware.verifyToken, adminController.deleteBanner);

/**
 * @swagger
 * /api/admin/banners:
 *   get:
 *     summary: Get all banners
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of banners retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/banners', authMiddleware.verifyToken, adminController.getAllBanners);

/**
 * @swagger
 * /api/admin/banners/category/{categoryId}:
 *   get:
 *     summary: Get banners by category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: List of banners by category retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/banners/category/:categoryId', authMiddleware.verifyToken, adminController.getBannersByCategory);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/orders', authMiddleware.verifyToken, adminController.getAllOrders);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   put:
 *     summary: Update order status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               deliveredAt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.put('/orders/:id', authMiddleware.verifyToken, adminController.updateOrderStatusAdmin);

/**
 * @swagger
 * /api/admin/announcements:
 *   post:
 *     summary: Create a new announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *       400:
 *         description: Bad request
 */
router.post('/announcements', authMiddleware.verifyToken, adminController.createAnnouncement);

/**
 * @swagger
 * /api/admin/announcements:
 *   get:
 *     summary: Get all announcements
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of announcements retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/announcements', authMiddleware.verifyToken, adminController.getAnnouncements);

/**
 * @swagger
 * /api/admin/announcements/{announcementId}:
 *   get:
 *     summary: Get a single announcement by ID
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         schema:
 *           type: string
 *         required: true
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement retrieved successfully
 *       404:
 *         description: Announcement not found
 *       500:
 *         description: Internal server error
 */
router.get('/announcements/:announcementId', authMiddleware.verifyToken, adminController.getAnnouncement);

/**
 * @swagger
 * /api/admin/announcements/{announcementId}:
 *   put:
 *     summary: Update an announcement by ID
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         schema:
 *           type: string
 *         required: true
 *         description: Announcement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Announcement updated successfully
 *       404:
 *         description: Announcement not found
 *       500:
 *         description: Internal server error
 */
router.put('/announcements/:announcementId', authMiddleware.verifyToken, adminController.updateAnnouncement);

/**
 * @swagger
 * /api/admin/announcements/{announcementId}:
 *   delete:
 *     summary: Delete an announcement by ID
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         schema:
 *           type: string
 *         required: true
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement deleted successfully
 *       404:
 *         description: Announcement not found
 *       500:
 *         description: Internal server error
 */
router.delete('/announcements/:announcementId', authMiddleware.verifyToken, adminController.deleteAnnouncement);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders with advanced filtering
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of orders
 *       401:
 *         description: Unauthorized
 */
router.get('/orders', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  adminController.getAllOrders
);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get platform-wide analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Platform analytics data
 */
router.get('/analytics', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  adminController.getPlatformAnalytics
);

/**
 * @swagger
 * /api/admin/orders/flagged:
 *   get:
 *     summary: Get flagged orders for review
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of flagged orders
 */
router.get('/orders/flagged', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  adminController.getFlaggedOrders
);

/**
 * @swagger
 * /api/admin/orders/{orderId}:
 *   put:
 *     summary: Manually update order status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               note:
 *                 type: string
 *               refundAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Order updated successfully
 */
router.put('/orders/:orderId', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  adminController.updateOrderManually
);

/**
 * @swagger
 * /api/admin/withdrawals:
 *   get:
 *     summary: Get all withdrawal requests
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all withdrawal requests
 */
router.get('/withdrawals', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  adminController.getAllWithdrawals
);

/**
 * @swagger
 * /api/admin/withdrawals/{withdrawalId}/status:
 *   put:
 *     summary: Update withdrawal status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: withdrawalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal status updated successfully
 */
router.put('/withdrawals/:withdrawalId/status',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.updateWithdrawalStatus
);

/**
 * @swagger
 * /api/admin/financial/transactions:
 *   get:
 *     summary: Get financial transactions with filtering
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [inflow, outflow, all]
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, pending, failed]
 *         description: Filter by transaction status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for transaction search
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for transaction search
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *         description: Filter by seller ID
 *       - in: query
 *         name: reference
 *         schema:
 *           type: string
 *         description: Search by order or withdrawal reference
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: List of financial transactions
 *       500:
 *         description: Server error
 */
router.get('/financial/transactions',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.getFinancialTransactions
);

/**
 * @swagger
 * /api/admin/financial/summary:
 *   get:
 *     summary: Get financial summary statistics
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for summary calculation
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for summary calculation
 *     responses:
 *       200:
 *         description: Financial summary statistics
 *       500:
 *         description: Server error
 */
router.get('/financial/summary',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.getFinancialSummary
);

/**
 * @swagger
 * /api/admin/financial/transactions/{transactionId}:
 *   get:
 *     summary: Get detailed information about a specific transaction
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Detailed transaction information
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */
router.get('/financial/transactions/:transactionId',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.getTransactionDetails
);

/**
 * @swagger
 * /api/admin/financial/trends:
 *   get:
 *     summary: Get financial trends data
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year for which to get trends data (defaults to current year)
 *     responses:
 *       200:
 *         description: Monthly financial trends data
 *       500:
 *         description: Server error
 */
router.get('/financial/trends',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.getFinancialTrends
);

/**
 * @swagger
 * /api/admin/financial/sellers/{sellerId}:
 *   get:
 *     summary: Get detailed financial information for a specific seller
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller ID
 *     responses:
 *       200:
 *         description: Seller financial summary
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get('/financial/sellers/:sellerId',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.getSellerFinancialSummary
);

/**
 * @swagger
 * /api/admin/buyers/{buyerId}/verify-identity:
 *   put:
 *     summary: Verify buyer's identity document
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [verified, rejected]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Identity verification status updated successfully
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.put('/buyers/:buyerId/verify-identity',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.verifyBuyerIdentity
);

/**
 * @swagger
 * /api/admin/categories/{categoryId}/subcategories/{subCategoryId}/subsubcategories:
 *   get:
 *     summary: Get all sub-subcategories of a particular subcategory
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *       - in: path
 *         name: subCategoryId
 *         schema:
 *           type: string
 *         required: true
 *         description: Subcategory ID
 *     responses:
 *       200:
 *         description: List of sub-subcategories retrieved successfully
 *       404:
 *         description: Category or subcategory not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/categories/:categoryId/subcategories/:subCategoryId/subsubcategories',
  authMiddleware.verifyToken,
  adminController.getSubSubCategories
);

/**
 * @swagger
 * /api/admin/resources:
 *   post:
 *     summary: Create a new resource
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               link:
 *                 type: string
 *               media:
 *                 type: string
 *                 format: binary
 *               banner:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Resource created successfully
 */
router.post('/resources',
  authMiddleware.verifyToken,
  upload.fields([
    { name: 'media', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  adminController.createResource
);

/**
 * @swagger
 * /api/admin/resources:
 *   get:
 *     summary: Get all resources
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of resources retrieved successfully
 */
router.get('/resources',
  authMiddleware.verifyToken,
  adminController.getAllResources
);

/**
 * @swagger
 * /api/admin/resources/{id}:
 *   put:
 *     summary: Update a resource
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               link:
 *                 type: string
 *               media:
 *                 type: string
 *                 format: binary
 *               banner:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resource updated successfully
 */
router.put('/resources/:id',
  authMiddleware.verifyToken,
  upload.fields([
    { name: 'media', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  adminController.updateResource
);

/**
 * @swagger
 * /api/admin/resources/{id}:
 *   delete:
 *     summary: Delete a resource
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resource deleted successfully
 */
router.delete('/resources/:id',
  authMiddleware.verifyToken,
  adminController.deleteResource
);

/**
 * @swagger
 * /api/admin/sellers/{sellerId}/reject:
 *   put:
 *     summary: Reject a seller's business account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Seller ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 required: true
 *               details:
 *                 type: string
 *                 description: Additional details about rejection
 *     responses:
 *       200:
 *         description: Business account rejected successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/sellers/:sellerId/reject', authMiddleware.verifyToken, adminController.rejectBusinessAccount);

/**
 * @swagger
 * /api/admin/categories/{id}/platform-fee:
 *   put:
 *     summary: Update platform fee for a category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platformFee:
 *                 type: number
 *                 description: Platform fee percentage (0-100)
 *     responses:
 *       200:
 *         description: Platform fee updated successfully
 *       400:
 *         description: Invalid platform fee value
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.put('/categories/:id/platform-fee', 
  authMiddleware.verifyToken, 
  adminController.updateCategoryPlatformFee
);

/**
 * @swagger
 * /api/admin/bank-account/verify:
 *   post:
 *     summary: Verify bank account details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *               - bankCode
 *             properties:
 *               accountNumber:
 *                 type: string
 *               bankCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account details verified successfully
 *       400:
 *         description: Invalid account details
 *       500:
 *         description: Server error
 */
router.post('/bank-account/verify',
  authMiddleware.verifyToken,
  adminController.verifyBankAccount
);

/**
 * @swagger
 * /api/admin/withdrawals/{withdrawalId}/transfer:
 *   post:
 *     summary: Initiate transfer for withdrawal
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: withdrawalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transfer initiated successfully
 *       400:
 *         description: Invalid withdrawal request
 *       500:
 *         description: Server error
 */
router.post('/withdrawals/:withdrawalId/transfer',
  authMiddleware.verifyToken,
  adminController.initiateWithdrawalTransfer
);

/**
 * @swagger
 * /api/admin/transfers/{reference}/verify:
 *   get:
 *     summary: Verify transfer status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transfer status verified successfully
 *       404:
 *         description: Transfer not found
 *       500:
 *         description: Server error
 */
router.get('/transfers/:reference/verify',
  authMiddleware.verifyToken,
  adminController.verifyTransferStatus
);

// Add this new route

/**
 * @swagger
 * /api/admin/categories/recalculate-stats:
 *   post:
 *     summary: Recalculate category statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category statistics recalculated successfully
 *       500:
 *         description: Server error
 */
router.post('/categories/recalculate-stats', 
 
  adminController.recalculateCategoryStats
);

/**
 * @swagger
 * /api/admin/banks:
 *   get:
 *     summary: Get list of supported banks
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of banks retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/banks', authMiddleware.verifyToken, async (req, res) => {
  try {
    const banks = await bankService.getBankList();
    res.json({ success: true, data: banks });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank list',
      error: error.message
    });
  }
});

// Add the new finalize transfer route
router.post('/transfers/:reference/finalize', authMiddleware.verifyToken, adminController.finalizeTransfer);

/**
 * @swagger
 * /api/admin/bank-requests:
 *   get:
 *     summary: Get all bank change requests
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bank change requests
 *       500:
 *         description: Server error
 */
router.get('/bank-requests',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.getAllBankChangeRequests
);

/**
 * @swagger
 * /api/admin/bank-requests/stats:
 *   get:
 *     summary: Get bank change request statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bank change request statistics
 *       500:
 *         description: Server error
 */
router.get('/bank-requests/stats',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.getBankChangeRequestStats
);

/**
 * @swagger
 * /api/admin/bank-requests/{id}/approve:
 *   post:
 *     summary: Approve a bank change request
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bank change request approved
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */
router.post('/bank-requests/:id/approve',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.processBankChangeRequest
);

/**
 * @swagger
 * /api/admin/bank-requests/{id}/reject:
 *   post:
 *     summary: Reject a bank change request
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 required: true
 *     responses:
 *       200:
 *         description: Bank change request rejected
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */
router.post('/bank-requests/:id/reject',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.processBankChangeRequest
);

/**
 * @swagger
 * /api/admin/streams:
 *   get:
 *     summary: Get all streams with filtering options
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, live, ended, expired]
 *         description: Filter by stream status
 *       - in: query
 *         name: sellerName
 *         schema:
 *           type: string
 *         description: Filter by seller name or store name
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *         description: Filter by date range (format yyyy-mm-dd,yyyy-mm-dd)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, scheduledStartTime, viewersCount]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order (ascending or descending)
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
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of streams
 *       500:
 *         description: Server error
 */
router.get('/streams',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.getAllStreams
);

/**
 * @swagger
 * /api/admin/streams/analytics:
 *   get:
 *     summary: Get analytics data for all streams
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stream analytics data
 *       500:
 *         description: Server error
 */
router.get('/streams/analytics',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.getStreamAnalytics
);

/**
 * @swagger
 * /api/admin/streams/{streamId}:
 *   get:
 *     summary: Get detailed information about a specific stream
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Stream ID
 *     responses:
 *       200:
 *         description: Detailed stream information
 *       404:
 *         description: Stream not found
 *       500:
 *         description: Server error
 */
router.get('/streams/:streamId',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.getStreamDetails
);

module.exports = router;
