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

/**
 * @swagger
 * /api/v2/buyers/send-phone-otp:
 *   post:
 *     summary: Send phone OTP for verification
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
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number with country code
 *                 example: "+2348012345678"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               message:
 *                 type: string
 *                 example: "OTP sent successfully"
 *               data:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "OTP sent successfully"
 *                   validFor:
 *                     type: string
 *                     example: "10 minutes"
 *       400:
 *         description: Bad Request - Invalid phone number format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid phone number format
 *       500:
 *         description: Internal server error
 */
router.post('/send-phone-otp', verifyToken, isBuyer, buyerController.sendPhoneOTP);

/**
 * @swagger
 * /api/v2/buyers/verify-phone-otp:
 *   post:
 *     summary: Verify phone OTP for verification
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
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP received on phone
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Phone number verified successfully
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
 *                   example: "Phone number verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Phone number verified successfully"
 *                     phoneVerified:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Bad Request - Invalid OTP, expired OTP, or too many attempts
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid OTP format or no verification in progress
 *       500:
 *         description: Internal server error
 */
router.post('/verify-phone-otp', verifyToken, isBuyer, buyerController.verifyPhoneOTP);

/**
 * @swagger
 * /api/v2/buyers/seller/{sellerId}:
 *   get:
 *     summary: Get detailed seller profile and store information
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller to fetch
 *     responses:
 *       200:
 *         description: Seller profile retrieved successfully
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
 *                   example: "Seller profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     personalInfo:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                     storeInfo:
 *                       type: object
 *                       properties:
 *                         storeName:
 *                           type: string
 *                         aboutStore:
 *                           type: string
 *                         storeAvatar:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                         storeBanner:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                         isVerified:
 *                           type: boolean
 *                         isFeatured:
 *                           type: boolean
 *                         accountPending:
 *                           type: boolean
 *                         joinedDate:
 *                           type: string
 *                           format: date-time
 *                         bio:
 *                           type: string
 *                         isFollowing:
 *                           type: boolean
 *                         socialMedia:
 *                           type: object
 *                           properties:
 *                             instagram:
 *                               type: string
 *                             facebook:
 *                               type: string
 *                             tiktok:
 *                               type: string
 *                     businessInfo:
 *                       type: object
 *                       properties:
 *                         businessName:
 *                           type: string
 *                         businessType:
 *                           type: string
 *                         categories:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               subCategories:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                         addresses:
 *                           type: object
 *                           properties:
 *                             business:
 *                               type: object
 *                             warehouse:
 *                               type: object
 *                             seller:
 *                               type: object
 *                     location:
 *                       type: object
 *                       properties:
 *                         country:
 *                           type: string
 *                         state:
 *                           type: string
 *                         city:
 *                           type: string
 *                     storePolicies:
 *                       type: object
 *                       properties:
 *                         delivery:
 *                           type: object
 *                           properties:
 *                             processingTime:
 *                               type: string
 *                             deliveryTimes:
 *                               type: string
 *                             freeShippingPolicy:
 *                               type: string
 *                             allowsCod:
 *                               type: boolean
 *                         returns:
 *                           type: object
 *                           properties:
 *                             returnWindow:
 *                               type: number
 *                             returnCondition:
 *                               type: string
 *                             returnShipping:
 *                               type: string
 *                             nonRefundableItems:
 *                               type: array
 *                               items:
 *                                 type: string
 *                         refunds:
 *                           type: object
 *                           properties:
 *                             refundPolicy:
 *                               type: string
 *                             refundMethod:
 *                               type: string
 *                             lostOrDamagedPolicy:
 *                               type: string
 *                         exchange:
 *                           type: object
 *                           properties:
 *                             exchangePolicy:
 *                               type: string
 *                     stats:
 *                       type: object
 *                       properties:
 *                         followersCount:
 *                           type: number
 *                         followingCount:
 *                           type: number
 *                         totalOrders:
 *                           type: number
 *                         totalStreams:
 *                           type: number
 *                         soldItems:
 *                           type: number
 *                     reviews:
 *                       type: object
 *                       properties:
 *                         averageRating:
 *                           type: number
 *                         totalReviews:
 *                           type: number
 *                         ratingDistribution:
 *                           type: object
 *                           properties:
 *                             "1":
 *                               type: number
 *                             "2":
 *                               type: number
 *                             "3":
 *                               type: number
 *                             "4":
 *                               type: number
 *                             "5":
 *                               type: number
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Seller not found
 *       422:
 *         description: Validation error - Invalid seller ID format
 *       500:
 *         description: Internal server error
 */
router.get('/seller/:sellerId', verifyToken, isBuyer, buyerController.getSellerProfile);

/**
 * @swagger
 * /api/v2/buyers/followers:
 *   get:
 *     summary: Get buyer's followers with pagination
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Followers retrieved successfully
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
 *                   example: "Followers retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     followers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Seller ID
 *                             example: "507f1f77bcf86cd799439011"
 *                           type:
 *                             type: string
 *                             enum: [seller]
 *                             example: "seller"
 *                           name:
 *                             type: string
 *                             description: Seller's full name
 *                             example: "John Doe"
 *                           storeName:
 *                             type: string
 *                             description: Store or business name
 *                             example: "John's Electronics"
 *                           profileImage:
 *                             type: string
 *                             description: URL to profile image
 *                             example: "https://cdn.example.com/profile.jpg"
 *                           followDate:
 *                             type: string
 *                             format: date-time
 *                             description: When the seller started following the buyer
 *                             example: "2024-01-15T10:30:00.000Z"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total number of followers
 *                           example: 25
 *                         pages:
 *                           type: integer
 *                           description: Total number of pages
 *                           example: 3
 *                         current:
 *                           type: integer
 *                           description: Current page number
 *                           example: 1
 *                         hasMore:
 *                           type: boolean
 *                           description: Whether there are more pages
 *                           example: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid pagination parameters
 *       500:
 *         description: Internal server error
 */
router.get('/followers', verifyToken, isBuyer, buyerController.getFollowers);

/**
 * @swagger
 * /api/v2/buyers/following:
 *   get:
 *     summary: Get list of users the buyer follows (both buyers and sellers)
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Following list retrieved successfully
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
 *                   example: "Following retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     following:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: User ID (seller or buyer)
 *                             example: "507f1f77bcf86cd799439011"
 *                           type:
 *                             type: string
 *                             enum: [buyer, seller]
 *                             example: "seller"
 *                           name:
 *                             type: string
 *                             description: User's full name
 *                             example: "John Doe"
 *                           storeName:
 *                             type: string
 *                             nullable: true
 *                             description: Store name (only for sellers)
 *                             example: "John's Electronics"
 *                           profileImage:
 *                             type: string
 *                             nullable: true
 *                             description: URL to profile image
 *                             example: "https://cdn.example.com/profile.jpg"
 *                           followDate:
 *                             type: string
 *                             format: date-time
 *                             description: When the buyer started following this user
 *                             example: "2024-01-15T10:30:00.000Z"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total number of following
 *                           example: 25
 *                         pages:
 *                           type: integer
 *                           description: Total number of pages
 *                           example: 3
 *                         current:
 *                           type: integer
 *                           description: Current page number
 *                           example: 1
 *                         hasMore:
 *                           type: boolean
 *                           description: Whether there are more pages
 *                           example: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid pagination parameters
 *       500:
 *         description: Internal server error
 */
router.get('/following', verifyToken, isBuyer, buyerController.getFollowing);

/**
 * @swagger
 * /api/v2/buyers/seller/{sellerId}/review:
 *   post:
 *     summary: Write a review for a seller's store
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller to review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 minLength: 10
 *                 description: Review comment
 *                 example: "Great seller! Fast delivery and excellent products."
 *     responses:
 *       201:
 *         description: Review created successfully
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
 *                   example: "Review submitted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       type: object
 *                       properties:
 *                         buyer:
 *                           type: string
 *                           description: Buyer ID
 *                           example: "507f1f77bcf86cd799439011"
 *                         rating:
 *                           type: number
 *                           example: 5
 *                         comment:
 *                           type: string
 *                           example: "Great seller! Fast delivery and excellent products."
 *                         buyerName:
 *                           type: string
 *                           example: "John Doe"
 *                         buyerImage:
 *                           type: string
 *                           nullable: true
 *                           example: "https://cdn.example.com/profile.jpg"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00.000Z"
 *                         isVerifiedPurchase:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Invalid input or already reviewed
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
 *                   example: "You have already reviewed this seller"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Buyer must be a follower or have made a purchase
 *       404:
 *         description: Seller not found
 *       422:
 *         description: Validation error - Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/seller/:sellerId/review', verifyToken, isBuyer, buyerController.reviewSeller);

/**
 * @swagger
 * /api/v2/buyers/seller/{sellerId}/reviews:
 *   get:
 *     summary: Get all reviews for a seller's store
 *     tags: [Buyer V2]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller
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
 *         description: Number of reviews per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, rating-high, rating-low]
 *           default: recent
 *         description: Sort order for reviews
 *     responses:
 *       200:
 *         description: List of seller reviews
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
 *                   example: "Seller reviews retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           rating:
 *                             type: number
 *                             example: 5
 *                           comment:
 *                             type: string
 *                             example: "Great seller! Fast delivery and excellent products."
 *                           buyer:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "507f1f77bcf86cd799439012"
 *                               name:
 *                                 type: string
 *                                 example: "John Doe"
 *                               image:
 *                                 type: string
 *                                 nullable: true
 *                                 example: "https://cdn.example.com/profile.jpg"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           isVerifiedPurchase:
 *                             type: boolean
 *                             example: true
 *                     stats:
 *                       type: object
 *                       properties:
 *                         averageRating:
 *                           type: number
 *                           example: 4.5
 *                         totalReviews:
 *                           type: number
 *                           example: 25
 *                         ratingDistribution:
 *                           type: object
 *                           properties:
 *                             "1":
 *                               type: number
 *                               example: 1
 *                             "2":
 *                               type: number
 *                               example: 2
 *                             "3":
 *                               type: number
 *                               example: 3
 *                             "4":
 *                               type: number
 *                               example: 8
 *                             "5":
 *                               type: number
 *                               example: 11
 *                         verifiedPurchaseCount:
 *                           type: number
 *                           example: 20
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                           example: 1
 *                         totalPages:
 *                           type: number
 *                           example: 3
 *                         totalReviews:
 *                           type: number
 *                           example: 25
 *       404:
 *         description: Seller not found
 *       422:
 *         description: Validation error - Invalid input data
 *       500:
 *         description: Internal server error
 */
router.get('/seller/:sellerId/reviews', buyerController.getSellerReviews);

/**
 * @swagger
 * /api/v2/buyers/notification-preferences:
 *   get:
 *     summary: Get buyer's notification preferences
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences retrieved successfully
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
 *                   example: "Notification preferences retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     preferences:
 *                       type: object
 *                       properties:
 *                         orderUpdates:
 *                           type: object
 *                           properties:
 *                             orderConfirmation:
 *                               type: boolean
 *                               example: true
 *                             shippingAndDelivery:
 *                               type: boolean
 *                               example: true
 *                             orderCancellation:
 *                               type: boolean
 *                               example: false
 *                             refundUpdates:
 *                               type: boolean
 *                               example: true
 *                         liveShows:
 *                           type: object
 *                           properties:
 *                             allShows:
 *                               type: boolean
 *                               example: true
 *                             followedSellers:
 *                               type: boolean
 *                               example: true
 *                             recommendedShows:
 *                               type: boolean
 *                               example: false
 *                         messages:
 *                           type: object
 *                           properties:
 *                             fromSellers:
 *                               type: boolean
 *                               example: true
 *                             fromBuyers:
 *                               type: boolean
 *                               example: false
 *                             chatReplies:
 *                               type: boolean
 *                               example: true
 *                             mentions:
 *                               type: boolean
 *                               example: true
 *                         communityActivity:
 *                           type: object
 *                           properties:
 *                             postComments:
 *                               type: boolean
 *                               example: true
 *                             postLikes:
 *                               type: boolean
 *                               example: false
 *                             repliesAndMentions:
 *                               type: boolean
 *                               example: true
 *                         promotionsAndSales:
 *                           type: object
 *                           properties:
 *                             flashSales:
 *                               type: boolean
 *                               example: true
 *                             couponsAndDeals:
 *                               type: boolean
 *                               example: true
 *                             trendingProducts:
 *                               type: boolean
 *                               example: false
 *                             recommendations:
 *                               type: boolean
 *                               example: true
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid input data
 *       500:
 *         description: Internal server error
 */
router.get('/notification-preferences', verifyToken, buyerController.getNotificationPreferences);

/**
 * @swagger
 * /api/v2/buyers/notification-preferences:
 *   put:
 *     summary: Update buyer's notification preferences
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
 *               - preferences
 *             properties:
 *               preferences:
 *                 type: object
 *                 properties:
 *                   orderUpdates:
 *                     type: object
 *                     properties:
 *                       orderConfirmation:
 *                         type: boolean
 *                         example: true
 *                       shippingAndDelivery:
 *                         type: boolean
 *                         example: true
 *                       orderCancellation:
 *                         type: boolean
 *                         example: false
 *                       refundUpdates:
 *                         type: boolean
 *                         example: true
 *                   liveShows:
 *                     type: object
 *                     properties:
 *                       allShows:
 *                         type: boolean
 *                         example: true
 *                       followedSellers:
 *                         type: boolean
 *                         example: true
 *                       recommendedShows:
 *                         type: boolean
 *                         example: false
 *                   messages:
 *                     type: object
 *                     properties:
 *                       fromSellers:
 *                         type: boolean
 *                         example: true
 *                       fromBuyers:
 *                         type: boolean
 *                         example: false
 *                       chatReplies:
 *                         type: boolean
 *                         example: true
 *                       mentions:
 *                         type: boolean
 *                         example: true
 *                   communityActivity:
 *                     type: object
 *                     properties:
 *                       postComments:
 *                         type: boolean
 *                         example: true
 *                       postLikes:
 *                         type: boolean
 *                         example: false
 *                       repliesAndMentions:
 *                         type: boolean
 *                         example: true
 *                   promotionsAndSales:
 *                     type: object
 *                     properties:
 *                       flashSales:
 *                         type: boolean
 *                         example: true
 *                       couponsAndDeals:
 *                         type: boolean
 *                         example: true
 *                       trendingProducts:
 *                         type: boolean
 *                         example: false
 *                       recommendations:
 *                         type: boolean
 *                         example: true
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
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
 *                   example: "Notification preferences updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     preferences:
 *                       type: object
 *                       properties:
 *                         orderUpdates:
 *                           type: object
 *                           properties:
 *                             orderConfirmation:
 *                               type: boolean
 *                               example: true
 *                             shippingAndDelivery:
 *                               type: boolean
 *                               example: true
 *                             orderCancellation:
 *                               type: boolean
 *                               example: false
 *                             refundUpdates:
 *                               type: boolean
 *                               example: true
 *                         liveShows:
 *                           type: object
 *                           properties:
 *                             allShows:
 *                               type: boolean
 *                               example: true
 *                             followedSellers:
 *                               type: boolean
 *                               example: true
 *                             recommendedShows:
 *                               type: boolean
 *                               example: false
 *                         messages:
 *                           type: object
 *                           properties:
 *                             fromSellers:
 *                               type: boolean
 *                               example: true
 *                             fromBuyers:
 *                               type: boolean
 *                               example: false
 *                             chatReplies:
 *                               type: boolean
 *                               example: true
 *                             mentions:
 *                               type: boolean
 *                               example: true
 *                         communityActivity:
 *                           type: object
 *                           properties:
 *                             postComments:
 *                               type: boolean
 *                               example: true
 *                             postLikes:
 *                               type: boolean
 *                               example: false
 *                             repliesAndMentions:
 *                               type: boolean
 *                               example: true
 *                         promotionsAndSales:
 *                           type: object
 *                           properties:
 *                             flashSales:
 *                               type: boolean
 *                               example: true
 *                             couponsAndDeals:
 *                               type: boolean
 *                               example: true
 *                             trendingProducts:
 *                               type: boolean
 *                               example: false
 *                             recommendations:
 *                               type: boolean
 *                               example: true
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid input data
 *       500:
 *         description: Internal server error
 */
router.put('/notification-preferences', verifyToken, buyerController.updateNotificationPreferences);

/**
 * @swagger
 * /api/v2/buyers/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     description: Send a password reset OTP to the buyer's email address
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
 *                 example: "john.doe@example.com"
 *                 description: The buyer's email address
 *     responses:
 *       200:
 *         description: Password reset code sent successfully
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
 *                   example: "Password reset code sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Password reset code sent successfully"
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid email format
 *       500:
 *         description: Internal server error
 */
router.post('/forgot-password', buyerController.forgotPassword);

/**
 * @swagger
 * /api/v2/buyers/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     description: Reset a buyer's password using the OTP received from forgot password request
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
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *                 description: The buyer's email address
 *               otp:
 *                 type: string
 *                 example: "1234"
 *                 description: The 4-digit OTP received from forgot password request
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "newSecurePassword123"
 *                 description: The new password (minimum 6 characters, must contain letters and numbers)
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: "Password reset successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Password reset successfully"
 *                 pagination:
 *                   type: "null"
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/reset-password', buyerController.resetPassword);

/**
 * @swagger
 * /api/v2/buyers/request-account-deletion:
 *   post:
 *     summary: Request account deletion
 *     description: Request account deletion by sending a verification code to the buyer's email
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deletion verification code sent successfully
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
 *                   example: "Account deletion request submitted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Account deletion verification code sent to your email"
 *                     validFor:
 *                       type: string
 *                       example: "10 minutes"
 *                 pagination:
 *                   type: "null"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Account deletion already in progress
 *       500:
 *         description: Internal server error
 */
router.post('/request-account-deletion', verifyToken, buyerController.requestAccountDeletion);

/**
 * @swagger
 * /api/v2/buyers/confirm-account-deletion:
 *   post:
 *     summary: Confirm and execute account deletion
 *     description: Verify the OTP and permanently delete the buyer's account. This action cannot be undone.
 *     tags:
 *       - Buyer Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otp:
 *                 type: string
 *                 pattern: '^[0-9]{4}$'
 *                 description: 4-digit verification code received via email
 *                 example: "1234"
 *             required:
 *               - otp
 *     responses:
 *       200:
 *         description: Account deleted successfully
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
 *                   example: "Account deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Account deleted successfully"
 *                 pagination:
 *                   type: "null"
 *       400:
 *         description: Bad request - Invalid OTP or deletion request
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
 *                   example: "Invalid verification code"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "otp"
 *                       message:
 *                         type: string
 *                         example: "Invalid verification code"
 *                       remainingAttempts:
 *                         type: number
 *                         example: 3
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid input data
 *       500:
 *         description: Internal server error
 */
// Route: POST /api/v2/buyers/confirm-account-deletion
// Purpose: Confirms and executes account deletion after OTP verification
// Security: Requires JWT authentication via verifyToken middleware
// Flow: verifyToken -> buyerController.confirmAccountDeletion -> service layer
router.post('/confirm-account-deletion', verifyToken, buyerController.confirmAccountDeletion);

/**
 * @swagger
 * /api/v2/buyers/report-user:
 *   post:
 *     summary: Report a user for violations or inappropriate behavior
 *     description: |
 *       Allows buyers to report other users (buyers or sellers) for policy violations,
 *       inappropriate behavior, or other concerns. The report is automatically sent
 *       to administrators for review and appropriate action.
 *       
 *       Features:
 *       - Comprehensive input validation
 *       - Prevention of self-reporting
 *       - Automatic admin notifications
 *       - Unique report ID generation
 *       - Audit trail and tracking
 *     tags:
 *       - Buyer V2
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userType
 *               - reason
 *               - description
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The MongoDB ObjectId of the user being reported
 *                 example: "60f5e8b3e1b2c3d4e5f6g7h8"
 *               userType:
 *                 type: string
 *                 enum: [buyer, seller]
 *                 description: The type of user being reported
 *                 example: "seller"
 *               reason:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Main reason for reporting the user
 *                 example: "Fraudulent behavior"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Detailed description of the issue or violation
 *                 example: "This seller is selling counterfeit products and refusing refunds to customers."
 *     responses:
 *       201:
 *         description: Report submitted successfully
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
 *                   example: "Report submitted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Report submitted successfully"
 *                     report:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Unique identifier for the report
 *                           example: "60f5e8b3e1b2c3d4e5f6g7h9"
 *                         reportedUser:
 *                           type: object
 *                           properties:
 *                             userId:
 *                               type: string
 *                               example: "60f5e8b3e1b2c3d4e5f6g7h8"
 *                             userType:
 *                               type: string
 *                               example: "seller"
 *                         reason:
 *                           type: string
 *                           example: "Fraudulent behavior"
 *                         description:
 *                           type: string
 *                           example: "This seller is selling counterfeit products and refusing refunds to customers."
 *                         status:
 *                           type: string
 *                           enum: [pending, reviewed, resolved]
 *                           example: "pending"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-07-20T10:30:00.000Z"
 *                 pagination:
 *                   type: "null"
 *       400:
 *         description: Bad request - Invalid input data
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
 *                         example: "reason"
 *                       message:
 *                         type: string
 *                         example: "Reason must be at least 3 characters long"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
 *                   example: "Access denied!"
 *       404:
 *         description: Not found - Reported user does not exist
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
 *                         example: "userId"
 *                       message:
 *                         type: string
 *                         example: "Reported user not found"
 *       422:
 *         description: Validation error - Self-reporting or other business rule violations
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
 *                         example: "userId"
 *                       message:
 *                         type: string
 *                         example: "You cannot report yourself"
 *       500:
 *         description: Internal server error
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
 *                   example: "Something went wrong!"
 */
// Route: POST /api/v2/buyers/report-user
// Purpose: Allows buyers to report other users for violations or inappropriate behavior
// Security: Requires JWT authentication and buyer role verification
// Flow: verifyToken -> isBuyer -> buyerController.reportUser -> service layer
router.post('/report-user', verifyToken, isBuyer, buyerController.reportUser);

/**
 * @swagger
 * /api/v2/buyers/wallet/balance:
 *   get:
 *     summary: Get buyer's wallet balance with on-hold items
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
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
 *                   example: "Wallet balance retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                       description: Total wallet balance
 *                       example: 5000.00
 *                     onHoldAmount:
 *                       type: number
 *                       description: Amount currently on hold for active bids
 *                       example: 1500.00
 *                     availableBalance:
 *                       type: number
 *                       description: Available balance (total - on hold)
 *                       example: 3500.00
 *                     onHoldItems:
 *                       type: array
 *                       description: List of items currently on hold
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                             description: Product ID
 *                             example: "507f1f77bcf86cd799439011"
 *                           productName:
 *                             type: string
 *                             description: Product name
 *                             example: "iPhone 13 Pro"
 *                           productImage:
 *                             type: string
 *                             description: Product image URL
 *                             example: "https://example.com/image.jpg"
 *                           amount:
 *                             type: number
 *                             description: Amount on hold for this item
 *                             example: 750.00
 *                           bidDate:
 *                             type: string
 *                             format: date-time
 *                             description: Date when the bid was placed
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           auctionStatus:
 *                             type: string
 *                             description: Current auction status
 *                             example: "active"
 *                           auctionEndDate:
 *                             type: string
 *                             format: date-time
 *                             description: Auction end date
 *                             example: "2024-01-20T18:00:00.000Z"
 *                     currency:
 *                       type: string
 *                       description: Currency code
 *                       example: "NGN"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
 *                   example: "Access denied!"
 *       404:
 *         description: Not found - Buyer not found
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
 *                   example: "Buyer not found"
 *       500:
 *         description: Internal server error
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
 *                   example: "Something went wrong!"
 */
// Route: GET /api/v2/buyers/wallet/balance
// Purpose: Retrieve buyer's wallet balance with on-hold items and formatted data
// Security: Requires JWT authentication and buyer role verification
// Flow: verifyToken -> isBuyer -> buyerController.getWalletBalance -> service layer
router.get('/wallet/balance', verifyToken, isBuyer, buyerController.getWalletBalance);

/**
 * @swagger
 * /api/v2/buyers/wallet/topup/verify:
 *   get:
 *     summary: Verify a wallet top-up payment
 *     description: Verify a Paystack payment and complete wallet top-up. This endpoint verifies the payment with Paystack, validates the transaction data, and updates the buyer's wallet with the top-up amount. It handles both new transactions and updates to existing pending transactions.
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Paystack payment reference
 *         example: "TXN_1234567890"
 *     responses:
 *       200:
 *         description: Wallet topped up successfully
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
 *                   example: "Wallet topped up successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       description: Success message
 *                       example: "Wallet topped up successfully"
 *                     transaction:
 *                       type: object
 *                       description: Transaction details
 *                       properties:
 *                         paymentReference:
 *                           type: string
 *                           description: Payment reference from Paystack
 *                           example: "TXN_1234567890"
 *                         amount:
 *                           type: number
 *                           description: Transaction amount in NGN
 *                           example: 5000.00
 *                         type:
 *                           type: string
 *                           description: Transaction type
 *                           example: "credit"
 *                         status:
 *                           type: string
 *                           description: Transaction status
 *                           example: "completed"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: Transaction creation date
 *                           example: "2024-01-15T10:30:00.000Z"
 *                     newBalance:
 *                       type: number
 *                       description: Updated wallet balance
 *                       example: 15000.00
 *       400:
 *         description: Bad request - Invalid payment reference or verification failed
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
 *                   example: "Payment reference is required"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "reference"
 *                       message:
 *                         type: string
 *                         example: "Payment reference is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
 *                   example: "Access denied!"
 *       404:
 *         description: Not found - Buyer not found
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
 *                   example: "Buyer not found"
 *       500:
 *         description: Internal server error
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
 *                   example: "Something went wrong!"
 */
// Route: GET /api/v2/buyers/wallet/topup/verify
// Purpose: Verify a Paystack payment and complete wallet top-up
// Security: Requires JWT authentication and buyer role verification
// Flow: verifyToken -> isBuyer -> buyerController.verifyWalletTopUp -> service layer
router.get('/wallet/topup/verify', verifyToken, isBuyer, buyerController.verifyWalletTopUp);

/**
 * @swagger
 * /api/v2/buyers/wallet/topup:
 *   post:
 *     summary: Top up buyer's wallet
 *     description: Top up the buyer's wallet with a specified amount. This endpoint handles both new transactions and updates to existing pending transactions. It supports direct top-ups for admin users or in development environment.
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
 *               amount:
 *                 type: number
 *                 description: Amount to top up (must be greater than 0)
 *                 example: 5000.00
 *               description:
 *                 type: string
 *                 description: Optional description for the transaction
 *                 example: "Wallet top up"
 *               bypassPaystack:
 *                 type: boolean
 *                 description: Whether to bypass Paystack (admin only)
 *                 example: false
 *               paymentReference:
 *                 type: string
 *                 description: Optional payment reference for existing transactions
 *                 example: "PAY-1234567890-ABC123"
 *             required:
 *               - amount
 *     responses:
 *       200:
 *         description: Wallet topped up successfully
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
 *                   example: "Wallet topped up successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       description: Success message
 *                       example: "Wallet topped up successfully"
 *                     transaction:
 *                       type: object
 *                       description: Transaction details
 *                       properties:
 *                         type:
 *                           type: string
 *                           description: Transaction type
 *                           example: "credit"
 *                         amount:
 *                           type: number
 *                           description: Transaction amount in NGN
 *                           example: 5000.00
 *                         paymentReference:
 *                           type: string
 *                           description: Payment reference
 *                           example: "PAY-1234567890-ABC123"
 *                         description:
 *                           type: string
 *                           description: Transaction description
 *                           example: "Wallet top up"
 *                         status:
 *                           type: string
 *                           description: Transaction status
 *                           example: "completed"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: Transaction creation date
 *                           example: "2024-01-15T10:30:00.000Z"
 *                     newBalance:
 *                       type: number
 *                       description: Updated wallet balance
 *                       example: 15000.00
 *       400:
 *         description: Bad request - Invalid amount or validation failed
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
 *                   example: "Invalid amount. Amount must be greater than 0."
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "amount"
 *                       message:
 *                         type: string
 *                         example: "Invalid amount. Amount must be greater than 0."
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
 *                   example: "Access denied!"
 *       403:
 *         description: Forbidden - Direct wallet top-up not allowed
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
 *                   example: "Direct wallet top-up is not allowed"
 *       404:
 *         description: Not found - Buyer not found
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
 *                   example: "Buyer not found"
 *       422:
 *         description: Validation error
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
 *                         example: "amount"
 *                       message:
 *                         type: string
 *                         example: "Invalid amount. Amount must be greater than 0."
 *       500:
 *         description: Internal server error
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
 *                   example: "Something went wrong!"
 */
router.post('/wallet/topup', verifyToken, isBuyer, buyerController.topUpWallet);



module.exports = router;