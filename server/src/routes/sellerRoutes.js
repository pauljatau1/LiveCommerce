const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const storeVisitMiddleware = require('../middlewares/storeVisitMiddleware');

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
 * /api/seller/check-token:
 *   get:
 *     summary: Check if the token is still valid
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is still valid
 *       401:
 *         description: Token has expired or is invalid
 *       403:
 *         description: Token is required for authentication
 */
router.get('/check-token', sellerController.checkToken);

/**
 * @swagger
 * /api/seller/resend-otp:
 *   post:
 *     summary: Resend OTP
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
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.post('/resend-otp', sellerController.resendOTP);


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
 * /api/seller/profile/account-type:
 *   put:
 *     summary: Select account type
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
 *               accountType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account type selected successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/profile/account-type', authMiddleware.verifyToken, sellerController.selectAccountType);

/**
 * @swagger
 * /api/seller/profile/business-details:
 *   put:
 *     summary: Add business details and information
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
 *     responses:
 *       200:
 *         description: Business details added successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/profile/business-details', authMiddleware.verifyToken, sellerController.addBusinessDetails);

/**
 * @swagger
 * /api/seller/profile/bank-details:
 *   put:
 *     summary: Add bank details
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
 *     responses:
 *       200:
 *         description: Bank details added successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/profile/bank-details', authMiddleware.verifyToken, sellerController.addBankDetails);

// /**
//  * @swagger
//  * /api/seller/profile/categories:
//  *   put:
//  *     summary: Add categories
//  *     tags: [Seller]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               categories:
//  *                 type: array
//  *                 items:
//  *                   type: object
//  *                   properties:
//  *                     name:
//  *                       type: string
//  *                     id:
//  *                       type: string
//  *     responses:
//  *       200:
//  *         description: Categories added successfully
//  *       404:
//  *         description: Seller not found
//  *       500:
//  *         description: Internal server error
//  */
// router.put('/profile/categories', authMiddleware.verifyToken, sellerController.addCategories);

/**
 * @swagger
 * /api/seller/profile/address-shipping:
 *   put:
 *     summary: Add address and shipping information
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
 *     responses:
 *       200:
 *         description: Address and shipping information added successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/profile/address-shipping', authMiddleware.verifyToken, sellerController.addAddressShipping);

/**
 * @swagger
 * /api/seller/profile/documents:
 *   post:
 *     summary: Upload verification documents
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               verificationDocuments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Verification documents uploaded successfully
 *       400:
 *         description: No verification documents uploaded
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/profile/documents',
  authMiddleware.verifyToken,
  upload.array('verificationDocuments', 5),
  sellerController.uploadVerificationDocuments
);

/**
 * @swagger
 * /api/seller/profile/avatar:
 *   post:
 *     summary: Upload store avatar
 *     tags: [Seller]
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
 *         description: Store avatar uploaded successfully
 *       400:
 *         description: No avatar file uploaded
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/profile/avatar',
  authMiddleware.verifyToken,
  upload.single('avatar'),
  sellerController.uploadStoreAvatar
);

/**
 * @swagger
 * /api/seller/profile/banner:
 *   post:
 *     summary: Upload store banner
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               banner:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Store banner uploaded successfully
 *       400:
 *         description: No banner file uploaded
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/profile/banner',
  authMiddleware.verifyToken,
  upload.single('banner'),
  sellerController.uploadStoreBanner
);


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
 *                     subCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
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
 *                     subCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
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

/**
 * @swagger
 * /api/seller/top-products:
 *   get:
 *     summary: Get seller's top 5 selling products
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top products retrieved successfully
 */
router.get('/top-products', authMiddleware.verifyToken, sellerController.getTopProducts);

/**
 * @swagger
 * /api/seller/statistics:
 *   get:
 *     summary: Get seller's store statistics
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/statistics', authMiddleware.verifyToken, sellerController.getStatistics);

/**
 * @swagger
 * /api/seller/orders:
 *   get:
 *     summary: Get seller's orders
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
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
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of seller's orders
 */
router.get('/orders', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  sellerController.getOrders
);

/**
 * @swagger
 * /api/seller/analytics:
 *   get:
 *     summary: Get seller's sales analytics
 *     tags: [Seller]
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
 *         description: Seller's analytics data
 */
router.get('/analytics', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  sellerController.getSalesAnalytics
);

/**
 * @swagger
 * /api/seller/orders/{orderId}/shipping-label:
 *   get:
 *     summary: Generate shipping label for order
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shipping label generated successfully
 */
router.get('/orders/:orderId/shipping-label', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  sellerController.getShippingLabel
);

// /**
//  * @swagger
//  * /api/seller/profile/{sellerId}:
//  *   get:
//  *     summary: Get a seller's public profile
//  *     tags: [Seller]
//  *     parameters:
//  *       - in: path
//  *         name: sellerId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: ID of the seller
//  *     responses:
//  *       200:
//  *         description: Seller profile retrieved successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 storeName:
//  *                   type: string
//  *                 aboutStore:
//  *                   type: string
//  *                 storeAvatar:
//  *                   type: object
//  *                 storeBanner:
//  *                   type: object
//  *                 categories:
//  *                   type: array
//  *       404:
//  *         description: Seller not found
//  *       500:
//  *         description: Internal server error
//  */
// router.get('/profile/:sellerId', storeVisitMiddleware.trackStoreVisit, sellerController.getSellerProfile);

module.exports = router;
