const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../middlewares/authMiddleware');
const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/auth/register
 *   post:
 *     summary: Register a new buyer
 *     tags: [Buyer V2]
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
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               country:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               password:
 *                 type: string
 *               expoPushToken:
 *                 type: string
 *                 description: Expo push token for mobile notifications
 *     responses:
 *       201:
 *         description: Buyer registered successfully
 *       400:
 *         description: Bad request
 *       422:
 *         description: Validation fails
 *       500:
 *         description: Internal server error
 */
router.post('/auth/register', buyerController.register);

/**
 * @swagger
 * /api/v2/buyers/auth/login:
 *   post:
 *     summary: Login a buyer
 *     tags: [Buyer V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               expoPushToken:
 *                 type: string
 *                 description: Expo push token for mobile notifications
 *     responses:
 *       200:
 *         description: Successful login
 *       422:
 *         description: Validation error - Invalid input data
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not yet verified
 *       500:
 *         description: Internal server error
 */
router.post('/auth/login', buyerController.login);

/**
 * @swagger
 * /api/v2/buyers/profile:
 *   get:
 *     summary: Get buyer profile information
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     country:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     profileImage:
 *                       type: object
 *                     profilePictureUrl:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     emailVerified:
 *                       type: boolean
 *                     phoneVerified:
 *                       type: boolean
 *                     isIdentityVerified:
 *                       type: boolean
 *                     followersCount:
 *                       type: number
 *                     followingCount:
 *                       type: number
 *                     postsCount:
 *                       type: number
 *                     wallet:
 *                       type: object
 *                     notificationPreferences:
 *                       type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.get('/profile', verifyToken, buyerController.getProfile);

/**
 * @swagger
 * /api/v2/buyers/profile:
 *   put:
 *     summary: Update buyer profile information
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
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
 *               username:
 *                 type: string
 *               country:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               bio:
 *                 type: string
 *               notificationPreferences:
 *                 type: object
 *               preferredLanguage:
 *                 type: string
 *               preferredCurrency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     country:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     notificationPreferences:
 *                       type: object
 *                     preferredLanguage:
 *                       type: string
 *                     preferredCurrency:
 *                       type: string
 *       422:
 *         description: Validation error - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       409:
 *         description: Username already taken
 *       500:
 *         description: Internal server error
 */
router.put('/profile', verifyToken, buyerController.updateProfile);

/**
 * @swagger
 * /api/v2/buyers/auth/check-token:
 *   get:
 *     summary: Check and validate JWT token
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     token:
 *                       type: string
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *       403:
 *         description: Forbidden - No token provided
 *       500:
 *         description: Internal server error
 */
router.get('/auth/check-token', buyerController.checkToken);

module.exports = router;