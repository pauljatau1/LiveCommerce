const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/auth/register:
 *   post:
 *     summary: Register a new buyer
 *     tags: [Buyer V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - username
 *               - email
 *               - phoneNumber
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               username:
 *                 type: string
 *                 example: "johndoe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               country:
 *                 type: string
 *                 example: "Nigeria"
 *               phoneNumber:
 *                 type: string
 *                 example: "+2348012345678"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *               expoPushToken:
 *                 type: string
 *                 description: Expo push token for mobile notifications
 *                 example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
 *     responses:
 *       201:
 *         description: Buyer registered successfully
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
 *                   example: "Buyer registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         username:
 *                           type: string
 *                     token:
 *                       type: string
 *       422:
 *         description: Validation error - Invalid input data
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
 *                 format: email
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *               expoPushToken:
 *                 type: string
 *                 description: Expo push token for mobile notifications
 *                 example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
 *     responses:
 *       200:
 *         description: Successful login
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
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         firstName:
 *                           type: string
 *                           example: "John"
 *                         lastName:
 *                           type: string
 *                           example: "Doe"
 *                         email:
 *                           type: string
 *                           example: "john.doe@example.com"
 *                         username:
 *                           type: string
 *                           example: "johndoe"
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     username:
 *                       type: string
 *                       example: "johndoe"
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     country:
 *                       type: string
 *                       example: "Nigeria"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+2348012345678"
 *                     profileImage:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                           example: "https://example.com/profile.jpg"
 *                         public_id:
 *                           type: string
 *                           example: "profile_123"
 *                     profilePictureUrl:
 *                       type: string
 *                       example: "https://example.com/profile.jpg"
 *                     bio:
 *                       type: string
 *                       example: "Software developer from Nigeria"
 *                     emailVerified:
 *                       type: boolean
 *                       example: true
 *                     phoneVerified:
 *                       type: boolean
 *                       example: false
 *                     isIdentityVerified:
 *                       type: boolean
 *                       example: true
 *                     followersCount:
 *                       type: number
 *                       example: 42
 *                     followingCount:
 *                       type: number
 *                       example: 15
 *                     postsCount:
 *                       type: number
 *                       example: 8
 *                     wallet:
 *                       type: object
 *                       properties:
 *                         balance:
 *                           type: number
 *                           example: 5000
 *                         currency:
 *                           type: string
 *                           example: "NGN"
 *                     notificationPreferences:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: boolean
 *                           example: true
 *                         push:
 *                           type: boolean
 *                           example: true
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
 *                 example: "Jane"
 *               lastName:
 *                 type: string
 *                 example: "Smith"
 *               username:
 *                 type: string
 *                 example: "janesmith"
 *               country:
 *                 type: string
 *                 example: "USA"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               bio:
 *                 type: string
 *                 example: "Passionate about technology and innovation"
 *               notificationPreferences:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                     example: true
 *                   push:
 *                     type: boolean
 *                     example: false
 *                   sms:
 *                     type: boolean
 *                     example: true
 *               preferredLanguage:
 *                 type: string
 *                 example: "en"
 *               preferredCurrency:
 *                 type: string
 *                 example: "USD"
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
 *                       example: "Jane"
 *                     lastName:
 *                       type: string
 *                       example: "Smith"
 *                     username:
 *                       type: string
 *                       example: "janesmith"
 *                     email:
 *                       type: string
 *                       example: "jane.smith@example.com"
 *                     country:
 *                       type: string
 *                       example: "USA"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+1234567890"
 *                     bio:
 *                       type: string
 *                       example: "Passionate about technology and innovation"
 *                     notificationPreferences:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: boolean
 *                           example: true
 *                         push:
 *                           type: boolean
 *                           example: false
 *                         sms:
 *                           type: boolean
 *                           example: true
 *                     preferredLanguage:
 *                       type: string
 *                       example: "en"
 *                     preferredCurrency:
 *                       type: string
 *                       example: "USD"
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
 * /api/v2/buyers/profile/avatar:
 *   put:
 *     summary: Upload buyer profile image
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (JPEG, PNG, GIF, WebP - max 5MB)
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
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
 *                   example: "Profile image uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     username:
 *                       type: string
 *                       example: "johndoe"
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     profileImage:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                           example: "https://cdn.example.com/profile-123.jpg"
 *                         public_id:
 *                           type: string
 *                           example: "profile-123"
 *       400:
 *         description: Bad request - Invalid file format or size
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid file format or size
 *       500:
 *         description: Internal server error
 */
router.put('/profile/avatar', verifyToken, upload.single('avatar'), buyerController.uploadProfileImage);

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
 *                       example: "Token is valid"
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *       403:
 *         description: Forbidden - No token provided
 *       500:
 *         description: Internal server error
 */
router.get('/auth/check-token', buyerController.checkToken);

module.exports = router;