const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const bankService = require('../services/bankService');


/**
 * @swagger
 * /api/admin/register:
 *   post:
 *     summary: Register a new admin
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
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *       400:
 *         description: Bad request
 */
router.post('/register', adminController.register);

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
 *     summary: Get all products with pagination and filtering
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of products per page
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter products by name (partial, case-insensitive)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter products by category
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *         description: Filter products by seller ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, offline_auction]
 *         description: Filter products by status
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 totalProducts:
 *                   type: integer
 *                   example: 100
 *                 productsPerPage:
 *                   type: integer
 *                   example: 20
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
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

/**
 * @swagger
 * /api/admin/products/bulk-upload:
 *   post:
 *     summary: Bulk upload products via CSV file
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
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with product data
 *               sellerId:
 *                 type: string
 *                 description: ID of the seller to assign products to
 *     responses:
 *       201:
 *         description: Products uploaded successfully
 *       400:
 *         description: Invalid input or CSV format
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.post(
  '/products/bulk-upload',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  upload.single('file'),
  adminController.bulkUploadProducts
);

/**
 * @swagger
 * /api/admin/products/csv-template:
 *   get:
 *     summary: Download a CSV template for bulk product upload
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV template downloaded successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Server error
 */
router.get(
  '/products/csv-template',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.downloadProductCsvTemplate
);

/**
 * @swagger
 * /api/admin/buyers/{buyerId}:
 *   delete:
 *     summary: Delete a buyer's account
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
 *         description: Buyer account deleted successfully
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.delete('/buyers/:buyerId', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  adminController.deleteBuyerAccount
);

/**
 * @swagger
 * /api/admin/buyers/transactions:
 *   get:
 *     summary: Get all transactions of all buyers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [credit, debit, all]
 *         description: Filter by transaction type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records to return
 *     responses:
 *       200:
 *         description: List of all buyer transactions
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/buyers/transactions',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.getAllBuyerTransactions
);

/**
 * @swagger
 * /api/admin/sellers/transactions:
 *   get:
 *     summary: Get all transactions of all sellers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [credit, debit, all]
 *         description: Filter by transaction type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records to return
 *     responses:
 *       200:
 *         description: List of all seller transactions
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/sellers/transactions',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.getAllSellerTransactions
);

/**
 * @swagger
 * /api/admin/sellers/{sellerId}/details:
 *   get:
 *     summary: Get detailed information about a specific seller
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
 *         description: Detailed seller information retrieved successfully
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
 *                     seller:
 *                       type: object
 *                       description: All seller information from the Seller model
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         ordersCount:
 *                           type: number
 *                           example: 120
 *                         postsCount:
 *                           type: number
 *                           example: 35
 *                         streamsCount:
 *                           type: number
 *                           example: 15
 *                         productsCount:
 *                           type: number
 *                           example: 75
 *                         campaignsCount:
 *                           type: number
 *                           example: 8
 *                         conversationsCount:
 *                           type: number
 *                           example: 45
 *                         followersCount:
 *                           type: number
 *                           example: 150
 *                         totalRevenue:
 *                           type: number
 *                           example: 25000
 *                         walletBalance:
 *                           type: number
 *                           example: 12500
 *                         averageRating:
 *                           type: number
 *                           example: 4.7
 *                         totalReviews:
 *                           type: number
 *                           example: 95
 *                     recentActivity:
 *                       type: object
 *                       properties:
 *                         orders:
 *                           type: array
 *                           items:
 *                             type: object
 *                         streams:
 *                           type: array
 *                           items:
 *                             type: object
 *                         transactions:
 *                           type: array
 *                           items:
 *                             type: object
 *                         campaigns:
 *                           type: array
 *                           items:
 *                             type: object
 *                         withdrawals:
 *                           type: array
 *                           items:
 *                             type: object
 *                     analytics:
 *                       type: object
 *                       properties:
 *                         salesByMonth:
 *                           type: array
 *                           items:
 *                             type: object
 *                         storeVisits:
 *                           type: number
 *                           example: 1200
 *                         monthlyStats:
 *                           type: object
 *       400:
 *         description: Invalid seller ID format
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.get('/sellers/:sellerId/details', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin,
  adminController.getSellerDetails
);

/**
 * @swagger
 * /api/admin/sellers/{sellerId}/update:
 *   put:
 *     summary: Update seller information by admin
 *     description: Allows administrators to update various seller information including personal details, business info, addresses, bank details, and store settings
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
 *               # Personal Information
 *               firstName:
 *                 type: string
 *                 description: Seller's first name
 *               lastName:
 *                 type: string
 *                 description: Seller's last name
 *               email:
 *                 type: string
 *                 description: Seller's email address
 *               phoneNumber:
 *                 type: string
 *                 description: Seller's phone number
 *               
 *               # Business Information
 *               businessName:
 *                 type: string
 *                 description: Name of the seller's business
 *               businessType:
 *                 type: string
 *                 description: Type of business
 *               businessEmail:
 *                 type: string
 *                 description: Business email address
 *               businessNumber:
 *                 type: string
 *                 description: Business phone number
 *               taxInformation:
 *                 type: string
 *                 description: Tax information or ID
 *               accountType:
 *                 type: string
 *                 enum: [individual, business]
 *                 description: Seller account type
 *               
 *               # Business Address
 *               businessAddress:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: string
 *                   state:
 *                     type: string
 *                   city:
 *                     type: string
 *                   addressLine1:
 *                     type: string
 *                   addressLine2:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               
 *               # Seller Address
 *               sellerAddress:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: string
 *                   state:
 *                     type: string
 *                   city:
 *                     type: string
 *                   addressLine1:
 *                     type: string
 *                   addressLine2:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               
 *               # Warehouse Details
 *               warehouseDetails:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   contactNumber:
 *                     type: string
 *                   address:
 *                     type: object
 *                     properties:
 *                       country:
 *                         type: string
 *                       state:
 *                         type: string
 *                       city:
 *                         type: string
 *                       addressLine1:
 *                         type: string
 *                       addressLine2:
 *                         type: string
 *                       zipCode:
 *                         type: string
 *               
 *               # Bank Details
 *               bankDetails:
 *                 type: object
 *                 properties:
 *                   bankCountry:
 *                     type: string
 *                   bankName:
 *                     type: string
 *                   bankAccountType:
 *                     type: string
 *                   accountCurrency:
 *                     type: string
 *                   accountNumber:
 *                     type: string
 *                   accountName:
 *                     type: string
 *                   swiftCode:
 *                     type: string
 *                   bankIdentifierCode:
 *                     type: string
 *               
 *               # Store Details
 *               storeName:
 *                 type: string
 *                 description: Name of the store
 *               aboutStore:
 *                 type: string
 *                 description: Description about the store
 *               socialMedia:
 *                 type: object
 *                 properties:
 *                   instagram:
 *                     type: string
 *                   facebook:
 *                     type: string
 *                   tiktok:
 *                     type: string
 *               
 *               # Store Settings
 *               operatingHours:
 *                 type: object
 *                 properties:
 *                   monday:
 *                     type: object
 *                     properties:
 *                       isOpen:
 *                         type: boolean
 *                       openTime:
 *                         type: string
 *                       closeTime:
 *                         type: string
 *                   tuesday:
 *                     type: object
 *                     properties:
 *                       isOpen:
 *                         type: boolean
 *                       openTime:
 *                         type: string
 *                       closeTime:
 *                         type: string
 *                   wednesday:
 *                     type: object
 *                     properties:
 *                       isOpen:
 *                         type: boolean
 *                       openTime:
 *                         type: string
 *                       closeTime:
 *                         type: string
 *                   thursday:
 *                     type: object
 *                     properties:
 *                       isOpen:
 *                         type: boolean
 *                       openTime:
 *                         type: string
 *                       closeTime:
 *                         type: string
 *                   friday:
 *                     type: object
 *                     properties:
 *                       isOpen:
 *                         type: boolean
 *                       openTime:
 *                         type: string
 *                       closeTime:
 *                         type: string
 *                   saturday:
 *                     type: object
 *                     properties:
 *                       isOpen:
 *                         type: boolean
 *                       openTime:
 *                         type: string
 *                       closeTime:
 *                         type: string
 *                   sunday:
 *                     type: object
 *                     properties:
 *                       isOpen:
 *                         type: boolean
 *                       openTime:
 *                         type: string
 *                       closeTime:
 *                         type: string
 *               timezone:
 *                 type: string
 *                 description: Store timezone (e.g., "Africa/Lagos")
 *               storePolicy:
 *                 type: object
 *                 properties:
 *                   deliveryTimes:
 *                     type: string
 *                   freeShippingPolicy:
 *                     type: string
 *                   lostOrDamagedPolicy:
 *                     type: string
 *                   refundPolicy:
 *                     type: string
 *                   processingTime:
 *                     type: string
 *                   refundMethod:
 *                     type: string
 *                   nonRefundableItems:
 *                     type: array
 *                     items:
 *                       type: string
 *                   returnWindow:
 *                     type: number
 *                   returnCondition:
 *                     type: string
 *                   returnShipping:
 *                     type: string
 *                   exchangePolicy:
 *                     type: string
 *                   allowsCod:
 *                     type: boolean
 *               offersStorePickup:
 *                 type: boolean
 *                 description: Whether the store offers in-store pickup
 *               
 *               # Status Flags
 *               isVerified:
 *                 type: boolean
 *                 description: Verification status of the seller
 *               isFeatured:
 *                 type: boolean
 *                 description: Whether the seller is featured on the platform
 *               isDisabled:
 *                 type: boolean
 *                 description: Whether the seller account is disabled
 *               accountPending:
 *                 type: boolean
 *                 description: Whether the seller account is pending approval
 *     responses:
 *       200:
 *         description: Seller information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Seller information updated successfully"
 *                 seller:
 *                   type: object
 *                   description: Updated seller information
 *       400:
 *         description: Invalid seller ID format
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/sellers/:sellerId/update', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin,
  adminController.updateSellerInfo
);

/**
 * @swagger
 * /api/admin/sellers/{sellerId}/revoke-verification:
 *   put:
 *     summary: Revoke a seller's verification status
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
 *         description: Seller verification revoked successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/sellers/:sellerId/revoke-verification', authMiddleware.verifyToken, adminController.revokeSellerVerification);

/**
 * @swagger
 * /api/admin/fez-orders/{orderNo}:
 *   delete:
 *     summary: Delete/Cancel a Fez delivery order
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNo
 *         schema:
 *           type: string
 *         required: true
 *         description: Fez order number to cancel
 *     responses:
 *       200:
 *         description: Fez order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Fez order cancelled successfully
 *                 data:
 *                   type: object
 *                   description: Response data from Fez API
 *                 affectedOrders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       order_id:
 *                         type: string
 *                 affectedReturns:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *       400:
 *         description: Invalid order number or cancellation failed
 *       500:
 *         description: Server error
 */
router.delete('/fez-orders/:orderNo', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  adminController.deleteFezOrder
);

/**
 * @swagger
 * /api/admin/products/search:
 *   get:
 *     summary: Advanced search for products with multiple filters and sorting
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term to match against product name, description or SKU
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: subCategory
 *         schema:
 *           type: string
 *         description: Filter by product subcategory
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *         description: Filter by seller ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, offline_auction]
 *         description: Filter by product status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, popularity, sold, created]
 *         description: Field to sort results by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of products per page
 *     responses:
 *       200:
 *         description: Paginated and filtered list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 totalProducts:
 *                   type: integer
 *                   example: 100
 *                 productsPerPage:
 *                   type: integer
 *                   example: 20
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 */
router.get('/products/search', authMiddleware.verifyToken, adminController.searchProducts);

/**
 * @swagger
 * /api/admin/platform-metrics:
 *   get:
 *     summary: Get comprehensive platform metrics and statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform metrics retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/platform-metrics', authMiddleware.verifyToken, adminController.getPlatformMetrics);

/**
 * @swagger
 * /api/admin/products/{productId}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to delete
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for product deletion
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/products/:productId',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.deleteProduct
);

/**
 * @swagger
 * /api/admin/products/{productId}/disable:
 *   put:
 *     summary: Disable a product
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for product disabling
 *     responses:
 *       200:
 *         description: Product disabled successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.put(
  '/products/:productId/disable',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.disableProduct
);

/**
 * @swagger
 * /api/admin/sellers/{sellerId}/products:
 *   get:
 *     summary: Get all products for a specific seller
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, draft, all]
 *           default: all
 *         description: Filter by product status
 *     responses:
 *       200:
 *         description: List of seller's products
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get(
  '/sellers/:sellerId/products',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.getSellerProducts
);

/**
 * @swagger
 * /api/admin/sellers/{sellerId}/wallet/deduct:
 *   post:
 *     summary: Deduct money from a seller's wallet
 *     tags: [Admin, Finance]
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
 *               amount:
 *                 type: number
 *                 description: Amount to deduct from the wallet
 *                 required: true
 *               reason:
 *                 type: string
 *                 description: Reason for the deduction
 *     responses:
 *       200:
 *         description: Amount deducted successfully
 *       400:
 *         description: Invalid amount or insufficient balance
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.post(
  '/sellers/:sellerId/wallet/deduct',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.deductFromSellerWallet
);

/**
 * @swagger
 * /api/admin/sellers/{sellerId}/wallet/add:
 *   post:
 *     summary: Add money to a seller's wallet
 *     tags: [Admin, Finance]
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
 *               amount:
 *                 type: number
 *                 description: Amount to add to the wallet
 *                 required: true
 *               reason:
 *                 type: string
 *                 description: Reason for adding the funds
 *     responses:
 *       200:
 *         description: Amount added successfully
 *       400:
 *         description: Invalid amount
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.post(
  '/sellers/:sellerId/wallet/add',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.addToSellerWallet
);

/**
 * @swagger
 * /api/admin/sellers/{sellerId}/products:
 *   delete:
 *     summary: Delete all products of a seller
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller whose products to delete
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for deleting all products
 *     responses:
 *       200:
 *         description: All seller products deleted successfully
 *       404:
 *         description: Seller not found or no products found
 *       500:
 *         description: Server error
 */
router.delete(
  '/sellers/:sellerId/products',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.deleteAllSellerProducts
);

/**
 * @swagger
 * /api/admin/sellers/{sellerId}/send-onboarding-reminder:
 *   post:
 *     summary: Send an onboarding reminder email to a seller
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
 *         description: Onboarding reminder email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Onboarding reminder email sent successfully
 *                 incompleteSteps:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Personal Address", "Bank Details"]
 *       400:
 *         description: Invalid seller ID or seller has already completed onboarding
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.post('/sellers/:sellerId/send-onboarding-reminder',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.sendOnboardingReminderEmail
);

/**
 * @swagger
 * /api/admin/sellers/bulk/send-onboarding-reminders:
 *   post:
 *     summary: Send onboarding reminder emails to all sellers with incomplete onboarding
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bulk onboarding reminder emails sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Onboarding reminder emails sent to 15 sellers
 *                 count:
 *                   type: integer
 *                   example: 15
 *                 processedSellers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sellerId:
 *                         type: string
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 *                       businessName:
 *                         type: string
 *                       incompleteSteps:
 *                         type: array
 *                         items:
 *                           type: string
 *       500:
 *         description: Internal server error
 */
router.post('/sellers/bulk/send-onboarding-reminders',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  adminController.sendBulkOnboardingReminders
);

/**
 * @swagger
 * /api/admin/buyers/{buyerId}/details:
 *   get:
 *     summary: Get detailed information about a specific buyer
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
 *         description: Detailed buyer information retrieved successfully
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
 *                     buyer:
 *                       type: object
 *                       description: All buyer information from the Buyer model
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         ordersCount:
 *                           type: number
 *                           example: 24
 *                         totalSpent:
 *                           type: number
 *                           example: 75000
 *                         pendingOrders:
 *                           type: number
 *                           example: 2
 *                         completedOrders:
 *                           type: number
 *                           example: 20
 *                         cancelledOrders:
 *                           type: number
 *                           example: 2
 *                         postsCount:
 *                           type: number
 *                           example: 15
 *                         wishlistCount:
 *                           type: number
 *                           example: 8
 *                         conversationsCount:
 *                           type: number
 *                           example: 6
 *                         walletBalance:
 *                           type: number
 *                           example: 15000
 *                         walletTransactions:
 *                           type: object
 *                           properties:
 *                             totalTransactions:
 *                               type: number
 *                               example: 30
 *                             creditTransactions:
 *                               type: number
 *                               example: 20
 *                             debitTransactions:
 *                               type: number
 *                               example: 10
 *                             totalCredit:
 *                               type: number
 *                               example: 30000
 *                             totalDebit:
 *                               type: number
 *                               example: 15000
 *                     recentActivity:
 *                       type: object
 *                       properties:
 *                         orders:
 *                           type: array
 *                           items:
 *                             type: object
 *                         wishlist:
 *                           type: array
 *                           items:
 *                             type: object
 *                         conversations:
 *                           type: array
 *                           items:
 *                             type: object
 *       400:
 *         description: Invalid buyer ID format
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.get('/buyers/:buyerId/details', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin,
  adminController.getBuyerDetails
);

module.exports = router;
