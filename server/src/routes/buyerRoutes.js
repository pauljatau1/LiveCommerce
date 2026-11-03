const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');
const buyerControllerV2 = require('../modules/buyer/controllers/buyer.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');


/**
 * @swagger
 * /api/buyer/register:
 *   post:
 *     summary: Register a new buyer
 *     tags: [Buyer]
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
 *       409:
 *         description: Email is already in use
 *       500:
 *         description: Internal server error
 */
router.post('/register', buyerController.register);

/**
 * @swagger
 * /api/buyer/login:
 *   post:
 *     summary: Login a buyer
 *     tags: [Buyer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - expoPushToken
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
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not yet verified
 *       500:
 *         description: Internal server error
 */
router.post('/login', buyerController.login);

/**
 * @swagger
 * /api/buyer/profile:
 *   get:
 *     summary: Get buyer profile
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buyer profile retrieved successfully
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.get('/profile', authMiddleware.verifyToken, buyerController.getProfile);

/**
 * @swagger
 * /api/buyer/check-token:
 *   get:
 *     summary: Check token validity
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid or expired token
 *       403:
 *         description: Token is required for authentication
 */
router.get('/check-token', buyerController.checkToken);

/**
 * @swagger
 * /api/buyer/profile:
 *   put:
 *     summary: Update buyer profile
 *     tags: [Buyer]
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
 *                 description: Must be unique
 *               country:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               bio:
 *                 type: string
 *                 description: User biography or about text
 *               preferredLanguage:
 *                 type: string
 *                 enum: [en, es, fr]
 *               preferredCurrency:
 *                 type: string
 *                 enum: [USD, EUR, GBP]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Username already taken or invalid input
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.put('/profile', authMiddleware.verifyToken, buyerController.updateProfile);

/**
 * @swagger
 * /api/buyer/profile/avatar:
 *   put:
 *     summary: Upload or update buyer profile image
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *       400:
 *         description: No avatar file uploaded
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.put('/profile/avatar', authMiddleware.verifyToken, upload.single('avatar'), buyerController.uploadProfileImage);


/**
 * @swagger
 * /api/buyer/verify-otp:
 *   post:
 *     summary: Verify OTP and update emailVerified status
 *     tags: [Buyer]
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
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.post('/verify-otp', buyerController.verifyOTP);

/**
 * @swagger
 * /api/buyer/resend-otp:
 *   post:
 *     summary: Resend OTP to buyer's email
 *     tags: [Buyer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.post('/resend-otp', buyerController.resendOTP);


/**
 * @swagger
 * /api/buyer/selected-categories:
 *   put:
 *     summary: Update selected categories for a buyer
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               selectedCategories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     subCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *     responses:
 *       200:
 *         description: Selected categories updated successfully
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.put('/selected-categories', authMiddleware.verifyToken, buyerController.updateSelectedCategories);

/**
 * @swagger
 * /api/buyer/selected-categories:
 *   get:
 *     summary: Get buyer's selected categories
 *     tags: [Buyer]
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
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Electronics"
 *                       subCategories:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "Smartphones"
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.get('/selected-categories', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  buyerController.getSelectedCategories
);


/**
 * @swagger
 * /api/buyer/orders:
 *   get:
 *     summary: Get buyer's orders
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: trackingStatus
 *         schema:
 *           type: string
 *           enum: [Pending, Picked-Up, Dispatched, Delivered, Cancelled,]
 *         description: Filter orders by shipping tracking status (completely case-insensitive, accepts various formats like "picked-up", "pickedUp", "PICKED_UP", etc.)
 *       - in: query
 *         name: hasReturn
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter orders by whether they have return requests
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search orders by order_id or product name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of orders per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "-createdAt"
 *         description: Sort orders by field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: List of buyer's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       description: Current page number
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *                     totalOrders:
 *                       type: integer
 *                       description: Total number of orders matching the filters
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more pages after the current page
 *                     hasPrevious:
 *                       type: boolean
 *                       description: Whether there are previous pages before the current page
 */
router.get('/orders', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  buyerController.getOrders
);

/**
 * @swagger
 * /api/buyer/orders/{id}:
 *   get:
 *     summary: Get specific order details
 *     tags: [Buyer]
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
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/orders/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  buyerController.getOrderDetails
);

/**
 * @swagger
 * /api/buyer/analytics:
 *   get:
 *     summary: Get buyer's purchase analytics
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buyer's purchase analytics
 */
router.get('/analytics', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  buyerController.getPurchaseAnalytics
);

/**
 * @swagger
 * /api/buyer/addresses:
 *   get:
 *     summary: Get all addresses for the buyer
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of addresses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Address'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 * 
 *   post:
 *     summary: Add a new address
 *     tags: [Buyer]
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
 *               - city
 *               - addressLine1
 *               - zipCode
 *               - state
 *               - addressLine2
 *             properties:
 *               addressType:
 *                 type: string
 *                 enum: [home, work, other]
 *                 example: "home"
 *               country:
 *                 type: string
 *                 example: "United States"
 *               city:
 *                 type: string
 *                 example: "New York"
 *               addressLine1:
 *                 type: string
 *                 example: "123 Main St"
 *               addressLine2:
 *                 type: string
 *                 example: "Apt 4B"
 *               zipCode:
 *                 type: string
 *                 example: "10001"
 *               state:
 *                 type: string
 *                 example: "California"
 * 
 *     responses:
 *       201:
 *         description: Address added successfully
 * 
 * /api/buyer/addresses/{addressId}:
 *   put:
 *     summary: Update an address
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Address updated successfully
 * 
 *   delete:
 *     summary: Delete an address
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address deleted successfully
 */

// Address routes
/**
 * @swagger
 * /api/buyer/addresses:
 *   get:
 *     summary: Get all addresses for the buyer
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of addresses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Address'
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.get('/addresses', authMiddleware.verifyToken, buyerController.getAddresses);

/**
 * @swagger
 * /api/buyer/addresses:
 *   post:
 *     summary: Add a new address
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       201:
 *         description: Address added successfully
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.post('/addresses', authMiddleware.verifyToken, buyerController.addAddress);

/**
 * @swagger
 * /api/buyer/addresses/{addressId}:
 *   put:
 *     summary: Update an existing address
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       404:
 *         description: Buyer or address not found
 *       500:
 *         description: Server error
 */
router.put('/addresses/:addressId', authMiddleware.verifyToken, buyerController.updateAddress);

/**
 * @swagger
 * /api/buyer/addresses/{addressId}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       404:
 *         description: Buyer or address not found
 *       500:
 *         description: Server error
 */
router.delete('/addresses/:addressId', authMiddleware.verifyToken, buyerController.deleteAddress);

// Follow a seller
/**
 * @swagger
 * /api/buyer/follow/{sellerId}:
 *   post:
 *     summary: Follow a seller
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller to follow
 *     responses:
 *       200:
 *         description: Successfully followed seller
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully followed seller
 *       400:
 *         description: Already following this seller
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.post('/follow/:sellerId', authMiddleware.verifyToken, authMiddleware.isBuyer, buyerController.followSeller);

/**
 * @swagger
 * /api/buyer/follow/{sellerId}:
 *   delete:
 *     summary: Unfollow a seller
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller to unfollow
 *     responses:
 *       200:
 *         description: Successfully unfollowed seller
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully unfollowed seller
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.delete('/follow/:sellerId', authMiddleware.verifyToken, authMiddleware.isBuyer, buyerController.unfollowSeller);



// Wishlist routes
/**
 * @swagger
 * /api/buyer/wishlist:
 *   post:
 *     summary: Add a product to wishlist
 *     tags: [Buyer]
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
 *     responses:
 *       200:
 *         description: Product added to wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 wishlist:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         type: string
 *                       addedAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Product already in wishlist
 *       404:
 *         description: Buyer or product not found
 *       500:
 *         description: Server error
 * 
 *   get:
 *     summary: Get buyer's wishlist
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products in wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   product:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       images:
 *                         type: array
 *                       category:
 *                         type: string
 *                       brand:
 *                         type: string
 *                       stock:
 *                         type: number
 *                       seller:
 *                         type: object
 *                         properties:
 *                           storeName:
 *                             type: string
 *                           businessName:
 *                             type: string
 *                   addedAt:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.post('/wishlist', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  buyerController.addToWishlist
);

/**
 * @swagger
 * /api/buyer/wishlist:
 *   get:
 *     summary: Get buyer's wishlist
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products in wishlist
 */
router.get('/wishlist', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  buyerController.getWishlist
);

/**
 * @swagger
 * /api/buyer/wishlist/{productId}:
 *   delete:
 *     summary: Remove a product from wishlist
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to remove from wishlist
 *     responses:
 *       200:
 *         description: Product removed from wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 wishlist:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         type: string
 *                       addedAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.delete('/wishlist/:productId', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  buyerController.removeFromWishlist
);

/**
 * @swagger
 * /api/buyer/identity-verification:
 *   post:
 *     summary: Upload identity verification document
 *     tags: [Buyer]
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
 *     responses:
 *       200:
 *         description: Identity document uploaded successfully
 *       400:
 *         description: No document uploaded
 *       500:
 *         description: Internal server error
 */
router.post('/identity-verification', 
  authMiddleware.verifyToken,
  upload.single('identityDocument'),
  buyerController.uploadIdentityDocument
);

/**
 * @swagger
 * /api/buyer/send-phone-otp:
 *   post:
 *     summary: Send OTP to buyer's phone number
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number with country code (e.g., +1234567890)
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid phone number format
 *       500:
 *         description: Internal server error
 */
router.post('/send-phone-otp', authMiddleware.verifyToken, buyerController.sendPhoneOTP);

/**
 * @swagger
 * /api/buyer/verify-phone:
 *   post:
 *     summary: Verify phone number with OTP
 *     tags: [Buyer]
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
 *                 description: OTP received on phone
 *     responses:
 *       200:
 *         description: Phone number verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Internal server error
 */
router.post('/verify-phone', authMiddleware.verifyToken, buyerController.verifyPhoneOTP);

/**
 * @swagger
 * /api/buyer/seller/{sellerId}:
 *   get:
 *     summary: Get detailed seller profile and store information (Public endpoint)
 *     description: |
 *       Retrieves comprehensive seller profile information including store details, 
 *       business information, statistics, and reviews. This endpoint works with or 
 *       without authentication. When authenticated, it provides additional context 
 *       like following status.
 *     tags: [Buyer]
 *     security: []  # No authentication required
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller to fetch
 *       - in: header
 *         name: Authorization
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional Bearer token for authenticated requests (provides following status)
 *     responses:
 *       200:
 *         description: Seller profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 personalInfo:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                 storeInfo:
 *                   type: object
 *                   properties:
 *                     storeName:
 *                       type: string
 *                     aboutStore:
 *                       type: string
 *                     storeAvatar:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                     storeBanner:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                     isVerified:
 *                       type: boolean
 *                     isFeatured:
 *                       type: boolean
 *                     isFollowing:
 *                       type: boolean
 *                       description: Only present when authenticated
 *                     joinedDate:
 *                       type: string
 *                       format: date-time
 *                     socialMedia:
 *                       type: object
 *                       properties:
 *                         instagram:
 *                           type: string
 *                         facebook:
 *                           type: string
 *                         tiktok:
 *                           type: string
 *                 businessInfo:
 *                   type: object
 *                   properties:
 *                     businessName:
 *                       type: string
 *                     businessType:
 *                       type: string
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           subCategories:
 *                             type: array
 *                             items:
 *                               type: string
 *                 location:
 *                   type: object
 *                   properties:
 *                     country:
 *                       type: string
 *                       example: "Nigeria"
 *                     state:
 *                       type: string
 *                       example: "Lagos"
 *                     city:
 *                       type: string
 *                       example: "Amuwo-Odofin"
 *                 storePolicies:
 *                   type: object
 *                   properties:
 *                     delivery:
 *                       type: object
 *                       properties:
 *                         processingTime:
 *                           type: string
 *                         deliveryTimes:
 *                           type: string
 *                         freeShippingPolicy:
 *                           type: string
 *                         allowsCod:
 *                           type: boolean
 *                     returns:
 *                       type: object
 *                       properties:
 *                         returnWindow:
 *                           type: number
 *                         returnCondition:
 *                           type: string
 *                         returnShipping:
 *                           type: string
 *                         nonRefundableItems:
 *                           type: array
 *                           items:
 *                             type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     followersCount:
 *                       type: number
 *                     followingCount:
 *                       type: number
 *                     totalOrders:
 *                       type: number
 *                     totalStreams:
 *                       type: number
 *                     soldItems:
 *                       type: number
 *                 reviews:
 *                   type: object
 *                   properties:
 *                     averageRating:
 *                       type: number
 *                     totalReviews:
 *                       type: number
 *                     ratingDistribution:
 *                       type: object
 *                       properties:
 *                         "1":
 *                           type: number
 *                         "2":
 *                           type: number
 *                         "3":
 *                           type: number
 *                         "4":
 *                           type: number
 *                         "5":
 *                           type: number
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get('/seller/:sellerId', 
  optionalAuthMiddleware, 
  buyerControllerV2.getSellerProfile
);



/**
 * @swagger
 * /api/buyer/verify-identity/{buyerId}:
 *   post:
 *     summary: Verify buyer's identity document (Admin only)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the buyer to verify
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 description: Optional note about the verification
 *     responses:
 *       200:
 *         description: Identity verified successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not an admin
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.post('/verify-identity/:buyerId', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  buyerController.verifyIdentity
);

/**
 * @swagger
 * /api/buyer/profile/update:
 *   put:
 *     summary: Update buyer profile details
 *     description: Update various profile details including personal info, preferences, and settings
 *     tags: [Buyer]
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
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               username:
 *                 type: string
 *                 example: "johndoe123"
 *               country:
 *                 type: string
 *                 example: "United States"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               bio:
 *                 type: string
 *                 example: "Tech enthusiast and avid shopper"
 *               notificationPreferences:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                   sms:
 *                     type: boolean
 *                   push:
 *                     type: boolean
 *               preferredLanguage:
 *                 type: string
 *                 enum: [en, es, fr]
 *               preferredCurrency:
 *                 type: string
 *                 enum: [USD, EUR, GBP]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 * 
 */

// Route definitions
router.put('/profile/update', authMiddleware.verifyToken, buyerController.updateProfile);


/**
 * @swagger
 * /api/buyer/followers:
 *   get:
 *     summary: Get list of followers (buyers and sellers who follow this buyer)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
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
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of followers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 followers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [buyer, seller]
 *                       name:
 *                         type: string
 *                       storeName:
 *                         type: string
 *                       followDate:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     current:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.get('/followers', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  buyerController.getFollowers
);

/**
 * @swagger
 * /api/buyer/following:
 *   get:
 *     summary: Get list of users the buyer follows (both buyers and sellers)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
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
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of following retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 following:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [buyer, seller]
 *                       name:
 *                         type: string
 *                       storeName:
 *                         type: string
 *                       followDate:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     current:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.get('/following', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  buyerController.getFollowing
);

/**
 * @swagger
 * /api/buyer/seller/{sellerId}/review:
 *   post:
 *     summary: Write a review for a seller's store
 *     tags: [Buyer]
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
 *               comment:
 *                 type: string
 *                 minLength: 10
 *                 description: Review comment
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input or already reviewed
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.post('/seller/:sellerId/review',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  buyerController.reviewSeller
);

/**
 * @swagger
 * /api/buyer/seller/{sellerId}/reviews:
 *   get:
 *     summary: Get all reviews for a seller's store
 *     tags: [Buyer]
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
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get('/seller/:sellerId/reviews',
  buyerController.getSellerReviews
);

/**
 * @swagger
 * /api/buyer/notification-preferences:
 *   get:
 *     summary: Get buyer's notification preferences
 *     tags: [Buyer]
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
 *                 message:
 *                   type: string
 *                 preferences:
 *                   type: object
 *                   properties:
 *                     orderUpdates:
 *                       type: object
 *                       properties:
 *                         orderConfirmation:
 *                           type: boolean
 *                         shippingAndDelivery:
 *                           type: boolean
 *                         orderCancellation:
 *                           type: boolean
 *                         refundUpdates:
 *                           type: boolean
 *                     liveShows:
 *                       type: object
 *                       properties:
 *                         allShows:
 *                           type: boolean
 *                         followedSellers:
 *                           type: boolean
 *                         recommendedShows:
 *                           type: boolean
 *                     messages:
 *                       type: object
 *                       properties:
 *                         fromSellers:
 *                           type: boolean
 *                         fromBuyers:
 *                           type: boolean
 *                         chatReplies:
 *                           type: boolean
 *                         mentions:
 *                           type: boolean
 *                     communityActivity:
 *                       type: object
 *                       properties:
 *                         postComments:
 *                           type: boolean
 *                         postLikes:
 *                           type: boolean
 *                         repliesAndMentions:
 *                           type: boolean
 *                     promotionsAndSales:
 *                       type: object
 *                       properties:
 *                         flashSales:
 *                           type: boolean
 *                         couponsAndDeals:
 *                           type: boolean
 *                         trendingProducts:
 *                           type: boolean
 *                         recommendations:
 *                           type: boolean
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.get('/notification-preferences', 
  authMiddleware.verifyToken, 
  buyerController.getNotificationPreferences
);

/**
 * @swagger
 * /api/buyer/notification-preferences:
 *   put:
 *     summary: Update buyer's notification preferences
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferences:
 *                 type: object
 *                 properties:
 *                   orderUpdates:
 *                     type: object
 *                     properties:
 *                       orderConfirmation:
 *                         type: boolean
 *                       shippingAndDelivery:
 *                         type: boolean
 *                       orderCancellation:
 *                         type: boolean
 *                       refundUpdates:
 *                         type: boolean
 *                   liveShows:
 *                     type: object
 *                     properties:
 *                       allShows:
 *                         type: boolean
 *                       followedSellers:
 *                         type: boolean
 *                       recommendedShows:
 *                         type: boolean
 *                   messages:
 *                     type: object
 *                     properties:
 *                       fromSellers:
 *                         type: boolean
 *                       fromBuyers:
 *                         type: boolean
 *                       chatReplies:
 *                         type: boolean
 *                       mentions:
 *                         type: boolean
 *                   communityActivity:
 *                     type: object
 *                     properties:
 *                       postComments:
 *                         type: boolean
 *                       postLikes:
 *                         type: boolean
 *                       repliesAndMentions:
 *                         type: boolean
 *                   promotionsAndSales:
 *                     type: object
 *                     properties:
 *                       flashSales:
 *                         type: boolean
 *                       couponsAndDeals:
 *                         type: boolean
 *                       trendingProducts:
 *                         type: boolean
 *                       recommendations:
 *                         type: boolean
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.put('/notification-preferences', 
  authMiddleware.verifyToken, 
  buyerController.updateNotificationPreferences
);

/**
 * @swagger
 * /api/buyer/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Buyer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.post('/forgot-password', buyerController.forgotPassword);

/**
 * @swagger
 * /api/buyer/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Buyer]
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
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.post('/reset-password', buyerController.resetPassword);

/**
 * @swagger
 * /api/buyer/delete-account/request:
 *   post:
 *     summary: Request account deletion and receive verification code
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account deletion verification code sent to your email
 *                 validFor:
 *                   type: string
 *                   example: 10 minutes
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.post('/delete-account/request',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  buyerController.requestAccountDeletion
);

/**
 * @swagger
 * /api/buyer/delete-account/confirm:
 *   post:
 *     summary: Confirm and execute account deletion with verification code
 *     tags: [Buyer]
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
 *                 description: Verification code received via email
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account deleted successfully
 *       400:
 *         description: Invalid or expired verification code
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.post('/delete-account/confirm',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  buyerController.confirmAccountDeletion
);

/**
 * @swagger
 * /api/buyer/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Buyer]
 *     parameters:
 *       - in: query
 *         name: expoPushToken
 *         schema:
 *           type: string
 *         description: Optional Expo push token for mobile notifications
 *     responses:
 *       302:
 *         description: Redirects to Google login page
 */
router.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

/**
 * @swagger
 * /api/buyer/google/callback:
 *   get:
 *     summary: Google OAuth callback URL
 *     tags: [Buyer]
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Authentication failed
 */
router.get('/google-callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: process.env.FRONTEND_URL
  }),
  (req, res) => {
    try {
      // Generate token
      const token = jwt.sign(
        { id: req.user._id, role: 'Buyer' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Prepare user data
      const user = {
        _id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        profileImage: req.user.profileImage
      };

      console.log('Redirecting with:', { token, user }); // Debug log

      // Construct redirect URL
      const redirectUrl = new URL(process.env.FRONTEND_URL);
      redirectUrl.searchParams.append('token', token);
      redirectUrl.searchParams.append('user', JSON.stringify(user));

      console.log('Redirect URL:', redirectUrl.toString()); // Debug log

      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('Callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}?error=callback_failed`);
    }
  }
);

/**
 * @swagger
 * /api/buyer/report:
 *   post:
 *     summary: Report a seller or buyer
 *     tags: [Buyer]
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
 *                 description: ID of the user being reported
 *               userType:
 *                 type: string
 *                 enum: [buyer, seller]
 *                 description: Type of user being reported
 *               reason:
 *                 type: string
 *                 description: Main reason for reporting
 *               description:
 *                 type: string
 *                 description: Detailed description of the issue
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/report', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  buyerController.reportUser
);

/**
 * @swagger
 * /api/buyer/wallet/balance:
 *   get:
 *     summary: Get buyer's wallet balance
 *     tags: [Buyer]
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
 *                 balance:
 *                   type: number
 *                   example: 5000.00
 *                 currency:
 *                   type: string
 *                   example: NGN
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.get('/wallet/balance',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  buyerController.getWalletBalance
);

/**
 * @swagger
 * /api/buyer/wallet/topup/verify:
 *   get:
 *     summary: Verify a wallet top-up payment
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Paystack payment reference
 *     responses:
 *       200:
 *         description: Wallet topped up successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Wallet topped up successfully
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     paymentReference:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 newBalance:
 *                   type: number
 *       400:
 *         description: Invalid payment reference or verification failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.get('/wallet/topup/verify',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  buyerController.verifyWalletTopUp
);

/**
 * @swagger
 * /api/buyer/wallet/topup:
 *   post:
 *     summary: Direct wallet top-up (admin only)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 example: 5000
 *               description:
 *                 type: string
 *                 example: Wallet top up
 *               bypassPaystack:
 *                 type: boolean
 *                 description: Whether to bypass Paystack (admin only)
 *                 default: false
 *     responses:
 *       200:
 *         description: Wallet topped up successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Wallet topped up successfully
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     paymentReference:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 newBalance:
 *                   type: number
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - direct top-up not allowed
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.post('/wallet/topup',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  buyerController.topUpWallet
);

/**
 * @swagger
 * /api/buyer/wallet/transactions:
 *   get:
 *     summary: Get buyer's wallet transactions
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
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
 *         description: Number of transactions per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [credit, debit]
 *         description: Filter by transaction type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions until this date
 *     responses:
 *       200:
 *         description: List of transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [credit, debit]
 *                       amount:
 *                         type: number
 *                       paymentReference:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, completed, failed]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     current:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.get('/wallet/transactions',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  buyerController.getWalletTransactions
);

/**
 * @swagger
 * /api/buyer/sellers:
 *   get:
 *     summary: Get list of sellers that can be followed
 *     description: Returns a list of sellers. If authenticated, excludes already followed sellers.
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
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
 *         description: Number of sellers per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for store name or business name
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category name
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [rating, followers, newest]
 *           default: rating
 *         description: Sort criteria
 *     responses:
 *       200:
 *         description: List of sellers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sellers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       storeName:
 *                         type: string
 *                       businessName:
 *                         type: string
 *                       aboutStore:
 *                         type: string
 *                       storeAvatar:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                       categories:
 *                         type: array
 *                       stats:
 *                         type: object
 *                         properties:
 *                           averageRating:
 *                             type: number
 *                           totalReviews:
 *                             type: number
 *                       followerCount:
 *                         type: number
 *                       isVerified:
 *                         type: boolean
 *                       isFeatured:
 *                         type: boolean
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     current:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       500:
 *         description: Server error
 */
router.get('/sellers', 
  optionalAuthMiddleware, // This middleware will make authentication optional
  buyerController.getSellersToFollow
);

/**
 * @swagger
 * /api/buyer/public-profile/{buyerId}:
 *   get:
 *     summary: Get public profile information of a buyer
 *     description: Retrieves publicly available information about a buyer including their basic info, activity stats, and recent public activities
 *     tags: [Buyer]
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the buyer to fetch profile for
 *     responses:
 *       200:
 *         description: Buyer public profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 basicInfo:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     username:
 *                       type: string
 *                     profileImage:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                     bio:
 *                       type: string
 *                     country:
 *                       type: string
 *                     joinedDate:
 *                       type: string
 *                       format: date-time
 *                     isIdentityVerified:
 *                       type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalPosts:
 *                       type: integer
 *                     totalReviews:
 *                       type: integer
 *                     totalFollowers:
 *                       type: integer
 *                     totalFollowing:
 *                       type: integer
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [post, product_review, product_purchase, follow]
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 selectedCategories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       subCategories:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.get('/public-profile/:buyerId', buyerController.getPublicProfile);

/**
 * @swagger
 * /api/buyer/toggle-activity:
 *   post:
 *     summary: Toggle buyer's activity status
 *     description: Toggles the buyer's account between active and inactive states
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account successfully deactivated
 *                 isActive:
 *                   type: boolean
 *                   example: false
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.post('/toggle-activity', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  buyerController.toggleActivityStatus
);

/**
 * @swagger
 * /api/buyer/activity-status:
 *   get:
 *     summary: Get buyer's activity status
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved activity status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isActive:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.get('/activity-status', authMiddleware.verifyToken, buyerController.getActivityStatus);

/**
 * @swagger
 * /api/buyer/select-major-categories:
 *   post:
 *     summary: Select major categories and add their child categories to buyer's selected categories
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - majorCategoryIds
 *             properties:
 *               majorCategoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of major category IDs
 *     responses:
 *       200:
 *         description: Major categories selected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
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
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                 addedCategories:
 *                   type: array
 *                   description: Categories that were newly added
 *       400:
 *         description: Invalid request - majorCategoryIds array is required
 *       404:
 *         description: Buyer or major categories not found
 *       500:
 *         description: Server error
 */
router.post('/select-major-categories', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  buyerController.selectMajorCategories
);

/**
 * @swagger
 * /api/buyer/update-major-categories:
 *   put:
 *     summary: Update major categories selection (replaces categories from selected major categories)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - majorCategoryIds
 *             properties:
 *               majorCategoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of major category IDs to select
 *     responses:
 *       200:
 *         description: Major categories selection updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 selectedCategories:
 *                   type: array
 *                   description: All selected categories (from major categories and manual selections)
 *                 majorCategorySelections:
 *                   type: array
 *                   description: Categories from selected major categories
 *                 manualSelections:
 *                   type: array
 *                   description: Categories that were manually selected (not from major categories)
 *       400:
 *         description: Invalid request - majorCategoryIds array is required
 *       404:
 *         description: Buyer or major categories not found
 *       500:
 *         description: Server error
 */
router.put('/update-major-categories', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  buyerController.updateMajorCategoriesSelection
);

/**
 * @swagger
 * /api/buyer/selected-major-categories:
 *   get:
 *     summary: Get buyer's selected major categories
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Selected major categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 selectedMajorCategories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       image:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           public_id:
 *                             type: string
 *                       categoryCount:
 *                         type: integer
 *                       categories:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.get('/selected-major-categories', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  buyerController.getSelectedMajorCategories
);

router.post('/throw/403', (req, res, next) => {
  const err = new Error('403 Forbidden');
  err.status = 403;
  next(err);
});

router.post('/throw/401', (req, res, next) => {
  const err = new Error('401 Unauthorized');
  err.status = 401;
  next(err);
});

module.exports = router;
