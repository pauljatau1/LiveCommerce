const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

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
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Bad request
 */
router.post('/categories', authMiddleware.verifyToken, adminController.createCategory);

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
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
router.put('/categories/:id', authMiddleware.verifyToken, adminController.updateCategory);

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
 * /api/admin/banners:
 *   post:
 *     summary: Create a new banner
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               mainImage:
 *                 type: string
 *               category:
 *                 type: string
 *               callToActionLink:
 *                 type: string
 *     responses:
 *       201:
 *         description: Banner created successfully
 *       400:
 *         description: Bad request
 */
router.post('/banners', authMiddleware.verifyToken, adminController.createBanner);

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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               mainImage:
 *                 type: string
 *               category:
 *                 type: string
 *               callToActionLink:
 *                 type: string
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *       404:
 *         description: Banner not found
 *       500:
 *         description: Internal server error
 */
router.put('/banners/:bannerId', authMiddleware.verifyToken, adminController.updateBanner);

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
router.get('/orders', authMiddleware.verifyToken, adminController.getAllOrdersAdmin);

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

module.exports = router;
