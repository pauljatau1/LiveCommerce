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


/**
 * @swagger
 * /api/seller/verification/company:
 *   post:
 *     summary: Upload company verification documents
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
 *               certificateOfIncorporation:
 *                 type: string
 *                 format: binary
 *               businessTaxId:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company verification documents uploaded successfully
 *                 documents:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: company
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           documentType:
 *                             type: string
 *                           fileUrl:
 *                             type: string
 *                           public_id:
 *                             type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Seller not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.post(
  '/verification/company',
  authMiddleware.verifyToken,
  upload.fields([
    { name: 'certificateOfIncorporation', maxCount: 1 },
    { name: 'businessTaxId', maxCount: 1 }
  ]),
  sellerController.uploadCompanyVerification
);

/**
 * @swagger
 * /api/seller/verification/individual:
 *   post:
 *     summary: Upload individual verification documents
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
 *               individualTaxId:
 *                 type: string
 *                 format: binary
 *               governmentId:
 *                 type: string
 *                 format: binary
 *               proofOfAddress:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Individual verification documents uploaded successfully
 *                 documents:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: individual
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           documentType:
 *                             type: string
 *                           fileUrl:
 *                             type: string
 *                           public_id:
 *                             type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Seller not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.post(
  '/verification/individual',
  authMiddleware.verifyToken,
  upload.fields([
    { name: 'individualTaxId', maxCount: 1 },
    { name: 'governmentId', maxCount: 1 },
    { name: 'proofOfAddress', maxCount: 1 }
  ]),
  sellerController.uploadIndividualVerification
);

/**
 * @swagger
 * /api/seller/business-details:
 *   put:
 *     summary: Add basic business details
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
 *               businessType:
 *                 type: string
 *               taxInformation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Business details added successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/business-details', authMiddleware.verifyToken, sellerController.addBusinessDetails);

/**
 * @swagger
 * /api/seller/business-information:
 *   put:
 *     summary: Add business contact and address information
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
 *               businessEmail:
 *                 type: string
 *               businessNumber:
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
 *                   addressLine1:
 *                     type: string
 *                   addressLine2:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *     responses:
 *       200:
 *         description: Business information added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Business information added successfully
 *                 seller:
 *                   type: object
 *                   properties:
 *                     businessEmail:
 *                       type: string
 *                     businessNumber:
 *                       type: string
 *                     businessAddress:
 *                       type: object
 *                       properties:
 *                         country:
 *                           type: string
 *                         state:
 *                           type: string
 *                         city:
 *                           type: string
 *                         addressLine1:
 *                           type: string
 *                         addressLine2:
 *                           type: string
 *                         zipCode:
 *                           type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Seller not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.put('/business-information', authMiddleware.verifyToken, sellerController.addBusinessInformation);

/**
 * @swagger
 * /api/seller/shipping-warehouse:
 *   put:
 *     summary: Add shipping and warehouse information
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
 *                   returnsAndExchangePolicy:
 *                     type: string
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
 *     responses:
 *       200:
 *         description: Shipping and warehouse information added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Shipping and warehouse information added successfully
 *                 seller:
 *                   type: object
 *                   properties:
 *                     shippingOptions:
 *                       type: object
 *                       properties:
 *                         shippingMethod:
 *                           type: string
 *                         returnsAndExchangePolicy:
 *                           type: string
 *                     warehouseDetails:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         contactNumber:
 *                           type: string
 *                         address:
 *                           type: object
 *                           properties:
 *                             country:
 *                               type: string
 *                             state:
 *                               type: string
 *                             city:
 *                               type: string
 *                             addressLine1:
 *                               type: string
 *                             addressLine2:
 *                               type: string
 *                             zipCode:
 *                               type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Seller not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.put('/shipping-warehouse', authMiddleware.verifyToken, sellerController.addShippingWarehouse);




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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Categories selected successfully
 *                 seller:
 *                   type: object
 *                   properties:
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
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *       400:
 *         description: Invalid category IDs provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Seller not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
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
 * /api/seller/top-products:
 *   get:
 *     summary: Get seller's top 5 selling products
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                   totalQuantity:
 *                     type: number
 *                   totalRevenue:
 *                     type: number
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalStoreVisits:
 *                   type: number
 *                 totalSales:
 *                   type: number
 *                 totalOrders:
 *                   type: number
 *                 uniqueCustomers:
 *                   type: number
 *                 conversionRate:
 *                   type: string
 *                 walletBalance:
 *                   type: number
 *                 currentMonth:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: number
 *                     sales:
 *                       type: number
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
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
 *         description: Filter orders by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders until this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: List of seller's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       buyer:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             product:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                 images:
 *                                   type: array
 *                                   items:
 *                                     type: string
 *                                 price:
 *                                   type: number
 *                             quantity:
 *                               type: number
 *                             status:
 *                               type: string
 *                 totalPages:
 *                   type: number
 *                 currentPage:
 *                   type: number
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
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

/**
 * @swagger
 * /api/seller/individual-information:
 *   put:
 *     summary: Update individual seller information
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
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
 *     responses:
 *       200:
 *         description: Individual information updated successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/individual-information', authMiddleware.verifyToken, sellerController.updateIndividualInformation);

/**
 * @swagger
 * /api/seller/forgot-password:
 *   post:
 *     summary: Request a password reset
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
 *         description: Password reset email sent successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.post('/forgot-password', sellerController.forgotPassword);

/**
 * @swagger
 * /api/seller/reset-password:
 *   post:
 *     summary: Reset the seller's password
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
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.post('/reset-password', sellerController.resetPassword);

/**
 * @swagger
 * /api/seller/onboarding-process:
 *   put:
 *     summary: Update seller's onboarding process status
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
 *               onboardingProcess:
 *                 type: string
 *                 description: Current onboarding process state
 *                 example: "step1_completed"
 *     responses:
 *       200:
 *         description: Onboarding process updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Onboarding process updated successfully
 *                 onboardingProcess:
 *                   type: string
 *                   example: step1_completed
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/onboarding-process', authMiddleware.verifyToken, sellerController.updateOnboardingProcess);

/**
 * @swagger
 * /api/seller/onboarding-process:
 *   get:
 *     summary: Get seller's current onboarding process status
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding process retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 onboardingProcess:
 *                   type: string
 *                   example: step1_completed
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.get('/onboarding-process', authMiddleware.verifyToken, sellerController.getOnboardingProcess);

/**
 * @swagger
 * /api/seller/followers:
 *   get:
 *     summary: Get seller's followers list
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Number of followers per page
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
 *                       buyerId:
 *                         type: string
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       followDate:
 *                         type: string
 *                         format: date-time
 *                       totalOrders:
 *                         type: number
 *                       mainAddress:
 *                         type: object
 *                         properties:
 *                           country:
 *                             type: string
 *                           city:
 *                             type: string
 *                           address1:
 *                             type: string
 *                           address2:
 *                             type: string
 *                           zipCode:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 *                     current:
 *                       type: number
 *                     hasMore:
 *                       type: boolean
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get('/followers', authMiddleware.verifyToken, authMiddleware.isSeller, sellerController.getFollowers);

/**
 * @swagger
 * /api/seller/buyer/{buyerId}:
 *   get:
 *     summary: Get detailed buyer information
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the buyer
 *     responses:
 *       200:
 *         description: Buyer details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 buyerInfo:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     joinDate:
 *                       type: string
 *                       format: date-time
 *                 orderStats:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: number
 *                     totalSpent:
 *                       type: number
 *                     averageOrderValue:
 *                       type: number
 *                 shippingAddresses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *                 activityFeed:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 topPurchases:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       quantity:
 *                         type: number
 *                       totalSpent:
 *                         type: number
 *       403:
 *         description: Unauthorized - Buyer has not ordered from this seller
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.get('/buyer/:buyerId', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  sellerController.getBuyerDetails
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
