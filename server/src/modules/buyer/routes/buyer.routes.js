const express = require('express');
const router = express.Router();
const { verifyToken, isBuyer } = require('../../../middlewares/authMiddleware');
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
 * /api/v2/buyers/auth/resend-otp:
 *   post:
 *     summary: Resend OTP to buyer's email
 *     tags: [Buyer V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Buyer's email address
 *                 example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: OTP resent successfully
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
 *                       example: "OTP resent successfully"
 *       422:
 *         description: Validation error - Invalid email
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.post('/auth/resend-otp', buyerController.resendOTP);

/**
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile retrieved successfully"
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token validated successfully"
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

/**
 * @swagger
 * /api/v2/buyers/auth/verify-otp:
 *   post:
 *     summary: Verify OTP for email verification
 *     tags: [Buyer V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 description: Buyer's email address
 *                 example: "john.doe@example.com"
 *               otp:
 *                 type: string
 *                 description: 4-digit OTP code
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: OTP verified successfully
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
 *                   example: "OTP verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Email verified successfully"
 *                     bonus:
 *                       type: object
 *                       properties:
 *                         coming:
 *                           type: boolean
 *                           example: true
 *                         amount:
 *                           type: number
 *                           example: 2000
 *                         currency:
 *                           type: string
 *                           example: "NGN"
 *                         timeToCredit:
 *                           type: string
 *                           example: "10 seconds"
 *       422:
 *         description: Validation error - Invalid input data
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.post('/auth/verify-otp', buyerController.verifyOTP);

/**
 * @swagger
 * /api/v2/buyers/selected-categories:
 *   get:
 *     summary: Get selected categories for a buyer
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Selected categories retrieved successfully
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
 *                   example: "Selected categories retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Electronics"
 *                           subCategories:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "Smartphones"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.get('/selected-categories', verifyToken, isBuyer, buyerController.getSelectedCategories);

/**
 * @swagger
 * /api/v2/buyers/orders:
 *   get:
 *     summary: Get orders for a buyer with filtering and pagination
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: trackingStatus
 *         schema:
 *           type: string
 *         description: Filter by tracking status (pending, picked_up, in_transit, delivered, cancelled, refunded)
 *         example: "delivered"
 *       - in: query
 *         name: hasReturn
 *         schema:
 *           type: string
 *         description: Filter by return status (true, false)
 *         example: "false"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in order ID or product name
 *         example: "OR12345"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of orders per page
 *         example: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field and direction
 *         example: "-createdAt"
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                   example: "Orders retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           order_id:
 *                             type: string
 *                           totalAmount:
 *                             type: number
 *                           status:
 *                             type: string
 *                           returnRequestId:
 *                             type: string
 *                           returnStatus:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalOrders:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *                         hasPrevious:
 *                           type: boolean
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/orders', verifyToken, isBuyer, buyerController.getOrders);

/**
 * @swagger
 * /api/v2/buyers/orders/{id}:
 *   get:
 *     summary: Get detailed information about a specific order
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
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
 *                   example: "Order details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     order_id:
 *                       type: string
 *                       example: "OR12345"
 *                     totalAmount:
 *                       type: number
 *                       example: 1500
 *                     status:
 *                       type: string
 *                       example: "delivered"
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               images:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                           seller:
 *                             type: object
 *                             properties:
 *                               storeName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               phoneNumber:
 *                                 type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.get('/orders/:id', verifyToken, isBuyer, buyerController.getOrderDetails);

/**
 * @swagger
 * /api/v2/buyers/selected-categories:
 *   put:
 *     summary: Update selected categories for a buyer
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selectedCategories
 *             properties:
 *               selectedCategories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - subCategories
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Category name
 *                       example: "Electronics"
 *                     subCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required:
 *                           - name
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Subcategory name
 *                             example: "Smartphones"
 *     responses:
 *       200:
 *         description: Selected categories updated successfully
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
 *                   example: "Selected categories updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     selectedCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Electronics"
 *                           subCategories:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "Smartphones"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid input data
 *       500:
 *         description: Internal server error
 */
router.put('/selected-categories', verifyToken, buyerController.updateSelectedCategories);

/**
 * @swagger
 * /api/v2/buyers/analytics:
 *   get:
 *     summary: Get purchase analytics for a buyer
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchase analytics retrieved successfully
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
 *                   example: "Purchase analytics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: integer
 *                       example: 25
 *                     totalSpent:
 *                       type: number
 *                       example: 15000.50
 *                     averageOrderValue:
 *                       type: number
 *                       example: 600.02
 *                     completionRate:
 *                       type: number
 *                       example: 85.5
 *                     ordersByStatus:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                           example: 5
 *                         processing:
 *                           type: integer
 *                           example: 3
 *                         shipped:
 *                           type: integer
 *                           example: 2
 *                         delivered:
 *                           type: integer
 *                           example: 12
 *                         cancelled:
 *                           type: integer
 *                           example: 2
 *                         returned:
 *                           type: integer
 *                           example: 1
 *                     recentOrders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           orderId:
 *                             type: string
 *                           orderNumber:
 *                             type: string
 *                           totalAmount:
 *                             type: number
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 product:
 *                                   type: object
 *                                   properties:
 *                                     id:
 *                                       type: string
 *                                     name:
 *                                       type: string
 *                                     image:
 *                                       type: string
 *                                     price:
 *                                       type: number
 *                                 quantity:
 *                                   type: integer
 *                                 status:
 *                                   type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/analytics', verifyToken, isBuyer, buyerController.getPurchaseAnalytics);

/**
 * @swagger
 * /api/v2/buyers/addresses:
 *   get:
 *     summary: Get all shipping addresses for a buyer
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
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
 *                   example: "Addresses retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       addressType:
 *                         type: string
 *                         enum: [home, work, other]
 *                         example: "home"
 *                       country:
 *                         type: string
 *                         example: "Nigeria"
 *                       state:
 *                         type: string
 *                         example: "Lagos"
 *                       city:
 *                         type: string
 *                         example: "Lagos"
 *                       addressLine1:
 *                         type: string
 *                         example: "123 Main Street"
 *                       addressLine2:
 *                         type: string
 *                         example: "Apt 4B"
 *                       zipCode:
 *                         type: string
 *                         example: "100001"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.get('/addresses', verifyToken, isBuyer, buyerController.getAddresses);

/**
 * @swagger
 * /api/v2/buyers/addresses:
 *   post:
 *     summary: Add a new shipping address for a buyer
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addressType
 *               - country
 *               - state
 *               - city
 *               - addressLine1
 *               - zipCode
 *             properties:
 *               addressType:
 *                 type: string
 *                 enum: [home, work, other]
 *                 description: Type of address
 *                 example: "home"
 *               country:
 *                 type: string
 *                 description: Country name
 *                 example: "Nigeria"
 *               state:
 *                 type: string
 *                 description: State or province
 *                 example: "Lagos"
 *               city:
 *                 type: string
 *                 description: City name
 *                 example: "Lagos"
 *               addressLine1:
 *                 type: string
 *                 description: Primary address line
 *                 example: "123 Main Street"
 *               addressLine2:
 *                 type: string
 *                 description: Secondary address line (optional)
 *                 example: "Apt 4B"
 *               zipCode:
 *                 type: string
 *                 description: Postal or zip code
 *                 example: "100001"
 *     responses:
 *       201:
 *         description: Address added successfully
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
 *                   example: "Address added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Address added successfully"
 *                     address:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         addressType:
 *                           type: string
 *                           example: "home"
 *                         country:
 *                           type: string
 *                           example: "Nigeria"
 *                         state:
 *                           type: string
 *                           example: "Lagos"
 *                         city:
 *                           type: string
 *                           example: "Lagos"
 *                         addressLine1:
 *                           type: string
 *                           example: "123 Main Street"
 *                         addressLine2:
 *                           type: string
 *                           example: "Apt 4B"
 *                         zipCode:
 *                           type: string
 *                           example: "100001"
 *       422:
 *         description: Unprocessable Entity - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "addressType"
 *                       message:
 *                         type: string
 *                         example: "Address type is required"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.post('/addresses', verifyToken, isBuyer, buyerController.addAddress);

/**
 * @swagger
 * /api/v2/buyers/addresses/{addressId}:
 *   put:
 *     summary: Update an existing shipping address
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the address to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addressType:
 *                 type: string
 *                 enum: [home, work, other]
 *                 description: Type of address
 *                 example: "home"
 *               country:
 *                 type: string
 *                 description: Country name
 *                 example: "Nigeria"
 *               state:
 *                 type: string
 *                 description: State or province
 *                 example: "Lagos"
 *               city:
 *                 type: string
 *                 description: City name
 *                 example: "Lagos"
 *               addressLine1:
 *                 type: string
 *                 description: Primary address line
 *                 example: "123 Main Street"
 *               addressLine2:
 *                 type: string
 *                 description: Secondary address line (optional)
 *                 example: "Apt 4B"
 *               zipCode:
 *                 type: string
 *                 description: Postal or zip code
 *                 example: "100001"
 *     responses:
 *       200:
 *         description: Address updated successfully
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
 *                   example: "Address updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Address updated successfully"
 *                     address:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         addressType:
 *                           type: string
 *                           example: "home"
 *                         country:
 *                           type: string
 *                           example: "Nigeria"
 *                         state:
 *                           type: string
 *                           example: "Lagos"
 *                         city:
 *                           type: string
 *                           example: "Lagos"
 *                         addressLine1:
 *                           type: string
 *                           example: "123 Main Street"
 *                         addressLine2:
 *                           type: string
 *                           example: "Apt 4B"
 *                         zipCode:
 *                           type: string
 *                           example: "100001"
 *       422:
 *         description: Unprocessable Entity - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "addressType"
 *                       message:
 *                         type: string
 *                         example: "Address type is required"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer or address not found
 *       500:
 *         description: Internal server error
 */
router.put('/addresses/:addressId', verifyToken, isBuyer, buyerController.updateAddress);

/**
 * @swagger
 * /api/v2/buyers/addresses/{addressId}:
 *   delete:
 *     summary: Delete a shipping address for a buyer
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the address to delete
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Address deleted successfully
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
 *                   example: "Address deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Address deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer or address not found
 *       422:
 *         description: Validation error - Invalid address ID format
 *       500:
 *         description: Internal server error
 */
router.delete('/addresses/:addressId', verifyToken, isBuyer, buyerController.deleteAddress);

/**
 * @swagger
 * /api/v2/buyers/follow/{sellerId}:
 *   post:
 *     summary: Follow a seller
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller to follow
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Successfully followed seller
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
 *                   example: "Successfully followed seller"
 *                 data:
 *                   type: object
 *                   properties:
 *                     followData:
 *                       type: object
 *                       properties:
 *                         buyerId:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         followDate:
 *                           type: string
 *                           format: date-time
 *                         totalOrders:
 *                           type: number
 *                         mainAddress:
 *                           type: object
 *                           nullable: true
 *                     sellerFollowCount:
 *                       type: number
 *                       description: Total number of followers for the seller
 *                     buyerFollowingCount:
 *                       type: number
 *                       description: Total number of sellers the buyer is following
 *       400:
 *         description: Bad Request - Already following this seller
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer or seller not found
 *       422:
 *         description: Validation error - Invalid seller ID format
 *       500:
 *         description: Internal server error
 */
router.post('/follow/:sellerId', verifyToken, isBuyer, buyerController.followSeller);

/**
 * @swagger
 * /api/v2/buyers/follow/{sellerId}:
 *   delete:
 *     summary: Unfollow a seller
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller to unfollow
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Successfully unfollowed seller
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
 *                   example: "Successfully unfollowed seller"
 *                 data:
 *                   type: object
 *                   properties:
 *                     sellerFollowCount:
 *                       type: number
 *                       description: Total number of followers for the seller after unfollow
 *                     buyerFollowingCount:
 *                       type: number
 *                       description: Total number of sellers the buyer is following after unfollow
 *       400:
 *         description: Bad Request - Not following this seller
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer or seller not found
 *       422:
 *         description: Validation error - Invalid seller ID format
 *       500:
 *         description: Internal server error
 */
router.delete('/follow/:sellerId', verifyToken, isBuyer, buyerController.unfollowSeller);

/**
 * @swagger
 * /api/v2/buyers/wishlist:
 *   post:
 *     summary: Add a product to wishlist
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID of the product to add to wishlist
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Product added to wishlist successfully
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
 *                   example: "Product added to wishlist successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     wishlist:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             type: string
 *                             description: Product ID
 *                           addedAt:
 *                             type: string
 *                             format: date-time
 *                             description: Date when product was added to wishlist
 *       400:
 *         description: Bad Request - Product already in wishlist
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer or product not found
 *       422:
 *         description: Validation error - Invalid product ID format
 *       500:
 *         description: Internal server error
 */
router.post('/wishlist', verifyToken, isBuyer, buyerController.addToWishlist);

/**
 * @swagger
 * /api/v2/buyers/wishlist:
 *   get:
 *     summary: Get buyer's wishlist
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
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
 *                   example: "Wishlist retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Product ID
 *                           name:
 *                             type: string
 *                             description: Product name
 *                           description:
 *                             type: string
 *                             description: Product description
 *                           price:
 *                             type: number
 *                             description: Product price
 *                           images:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Product images
 *                           category:
 *                             type: string
 *                             description: Product category
 *                           brand:
 *                             type: string
 *                             description: Product brand
 *                           stock:
 *                             type: number
 *                             description: Product stock
 *                           seller:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: Seller ID
 *                               storeName:
 *                                 type: string
 *                                 description: Seller store name
 *                               businessName:
 *                                 type: string
 *                                 description: Seller business name
 *                       addedAt:
 *                         type: string
 *                         format: date-time
 *                         description: Date when product was added to wishlist
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid buyer ID format
 *       500:
 *         description: Internal server error
 */
router.get('/wishlist', verifyToken, isBuyer, buyerController.getWishlist);

/**
 * @swagger
 * /api/v2/buyers/wishlist/{productId}:
 *   delete:
 *     summary: Remove a product from wishlist
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to remove from wishlist
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Product removed from wishlist successfully
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
 *                   example: "Product removed from wishlist successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     wishlist:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             type: string
 *                             description: Product ID
 *                           addedAt:
 *                             type: string
 *                             format: date-time
 *                             description: Date when product was added to wishlist
 *       400:
 *         description: Bad Request - Product not found in wishlist
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid product ID format
 *       500:
 *         description: Internal server error
 */
router.delete('/wishlist/:productId', verifyToken, isBuyer, buyerController.removeFromWishlist);

/**
 * @swagger
 * /api/v2/buyers/identity-verification:
 *   post:
 *     summary: Upload identity verification document
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               identityDocument:
 *                 type: string
 *                 format: binary
 *                 description: Identity document file (PDF, JPEG, PNG, GIF, DOC, DOCX)
 *                 example: "document.pdf"
 *     responses:
 *       200:
 *         description: Identity document uploaded successfully
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
 *                   example: "Identity document uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     document:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                           description: URL of the uploaded document
 *                           example: "https://cdn.example.com/verification/buyers/507f1f77bcf86cd799439011/identity-1640995200000-document.pdf"
 *                         public_id:
 *                           type: string
 *                           description: S3 key of the uploaded document
 *                           example: "verification/buyers/507f1f77bcf86cd799439011/identity-1640995200000-document.pdf"
 *                         uploadedAt:
 *                           type: string
 *                           format: date-time
 *                           description: Date when document was uploaded
 *                           example: "2025-01-27T10:30:00.000Z"
 *                         status:
 *                           type: string
 *                           description: Verification status
 *                           example: "pending"
 *       400:
 *         description: Bad Request - No file uploaded, invalid file type, or file too large
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid buyer ID format
 *       500:
 *         description: Internal server error
 */
router.post('/identity-verification', verifyToken, upload.single('identityDocument'), buyerController.uploadIdentityDocument);



module.exports = router;