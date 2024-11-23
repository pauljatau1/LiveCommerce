const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/seller/register:
 *   post:
 *     summary: Register a new seller
 *     tags: [Seller]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Seller registered successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Email is already in use
 *       500:
 *         description: Internal server error
 */
router.post('/register', sellerController.register);

/**
 * @swagger
 * /api/seller/login:
 *   post:
 *     summary: Login a seller
 *     tags: [Seller]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       400:
 *         description: Bad request
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/login', sellerController.login);

/**
 * @swagger
 * /api/seller/profile:
 *   get:
 *     summary: Get seller profile
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller profile retrieved successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.get('/profile', authMiddleware.verifyToken, sellerController.getProfile);

/**
 * @swagger
 * /api/seller/profile:
 *   put:
 *     summary: Update seller profile
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *               businessAddress:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: string
 *                   state:
 *                     type: string
 *                   city:
 *                     type: string
 *                   streetAddressLine1:
 *                     type: string
 *                   streetAddressLine2:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               accountType:
 *                 type: string
 *               verificationDocuments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     fileUrl:
 *                       type: string
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
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     id:
 *                       type: string
 *               shippingOptions:
 *                 type: object
 *                 properties:
 *                   shippingMethod:
 *                     type: string
 *                   returnPolicy:
 *                     type: string
 *               warehouseAddress:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: string
 *                   state:
 *                     type: string
 *                   city:
 *                     type: string
 *                   address:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               storeName:
 *                 type: string
 *               aboutStore:
 *                 type: string
 *               storeAvatar:
 *                 type: string
 *               storeBanner:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/profile', authMiddleware.verifyToken, sellerController.updateProfile);

/**
 * @swagger
 * /api/seller/verify-otp:
 *   post:
 *     summary: Verify OTP and update emailVerified status
 *     tags: [Seller]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.post('/verify-otp', sellerController.verifyOTP);

/**
 * @swagger
 * /api/seller/select-categories:
 *   post:
 *     summary: Select categories for a seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     id:
 *                       type: string
 *     responses:
 *       200:
 *         description: Categories selected successfully
 *       400:
 *         description: Invalid category IDs provided
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.post('/select-categories', authMiddleware.verifyToken, sellerController.selectCategories);

/**
 * @swagger
 * /api/seller/update-categories:
 *   put:
 *     summary: Update selected categories for a seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     id:
 *                       type: string
 *     responses:
 *       200:
 *         description: Categories updated successfully
 *       400:
 *         description: Invalid category IDs provided
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/update-categories', authMiddleware.verifyToken, sellerController.updateCategories);

/**
 * @swagger
 * /api/seller/followers:
 *   get:
 *     summary: Get followers of a seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of followers retrieved successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.get('/followers', authMiddleware.verifyToken, sellerController.getFollowers);

module.exports = router;
