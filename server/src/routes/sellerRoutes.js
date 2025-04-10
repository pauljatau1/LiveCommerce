const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
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
 *               storeName:
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
 *                 walletBalance:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     changePercentage:
 *                       type: number
 *                 storeVisits:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                     changePercentage:
 *                       type: number
 *                 totalOrders:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                     changePercentage:
 *                       type: number
 *                 conversionRate:
 *                   type: object
 *                   properties:
 *                     percentage:
 *                       type: number
 *                     changePercentage:
 *                       type: number
 *                 newCustomers:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                     changePercentage:
 *                       type: number
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
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
 *     summary: Request a password reset code
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
 *         description: Password reset code sent successfully
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
 *     summary: Reset the seller's password using reset code
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
 *               code:
 *                 type: string
 *                 description: 4-digit reset code
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Invalid or expired reset code
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
 *         description: Buyer not found.
 *       500:
 *         description: Server error
 */
router.get('/buyer/:buyerId', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  sellerController.getBuyerDetails
);

/**
 * @swagger
 * /api/seller/request-password-reset:
 *   post:
 *     summary: Request a password reset link
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
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset link sent successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.post('/request-password-reset', sellerController.requestPasswordReset);

/**
 * @swagger
 * /api/seller/verify-reset-token:
 *   post:
 *     summary: Verify password reset token
 *     tags: [Seller]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *       400:
 *         description: Invalid or expired token
 */
router.post('/verify-reset-token', sellerController.verifyResetToken);

/**
 * @swagger
 * /api/seller/reset-password-with-token:
 *   post:
 *     summary: Reset password using token
 *     tags: [Seller]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Invalid or expired token
 */
router.post('/reset-password-with-token', sellerController.resetPasswordWithToken);

/**
 * @swagger
 * /api/seller/top-sold-products:
 *   get:
 *     summary: Get seller's top 3 most sold products
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top sold products retrieved successfully
 *       500:
 *         description: Internal server error.
 */
router.get('/top-sold-products', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  sellerController.getTopSoldProducts
);

/**
 * @swagger
 * /api/seller/analytics:
 *   get:
 *     summary: Get seller analytics data
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *         description: Time period for analytics (week, month, year)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom date range (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom date range (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: integer
 *                     totalRevenue:
 *                       type: number
 *                     averageOrderValue:
 *                       type: number
 *                     uniqueBuyers:
 *                       type: integer
 *                     totalProducts:
 *                       type: integer
 *                     totalStreams:
 *                       type: integer
 *                     storeVisits:
 *                       type: integer
 *                     walletBalance:
 *                       type: number
 *                     followersCount:
 *                       type: integer
 *                 ordersData:
 *                   type: object
 *                 productsData:
 *                   type: object
 *                 streamsData:
 *                   type: object
 *                 followersData:
 *                   type: object
 *                 chartData:
 *                   type: array
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.get('/analytics', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  sellerController.getSellerAnalytics
);

/**
 * @swagger
 * /api/seller/withdrawals:
 *   post:
 *     summary: Create a withdrawal request
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
 *               amount:
 *                 type: number
 *               bankDetails:
 *                 type: object
 *                 required: true
 *                 properties:
 *                   bankName:
 *                     type: string
 *                   accountNumber:
 *                     type: string
 *                   accountName:
 *                     type: string
 *                   bankIdentifierCode:
 *                     type: string
 *     responses:
 *       200:
 *         description: Withdrawal request created successfully
 *       400:
 *         description: Invalid bank details or insufficient balance
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error while processing request
 */
router.post('/withdrawals', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  sellerController.createWithdrawalRequest
);

/**
 * @swagger
 * /api/seller/withdrawals:
 *   get:
 *     summary: Get seller's withdrawal requests
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of withdrawal requests
 */
router.get('/withdrawals', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  sellerController.getWithdrawalRequests
);



/**
 * @swagger
 * /api/seller/store-profile:
 *   put:
 *     summary: Update store profile information
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
 *               storeName:
 *                 type: string
 *               aboutStore:
 *                 type: string
 *               categories:
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
 *         description: Store profile updated successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/store-profile', authMiddleware.verifyToken, sellerController.updateStoreProfile);

/**
 * @swagger
 * /api/seller/warehouse-details:
 *   put:
 *     summary: Update warehouse information
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
 *         description: Warehouse details updated successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/warehouse-details', authMiddleware.verifyToken, sellerController.updateWarehouseDetails);

/**
 * @swagger
 * /api/seller/business-address:
 *   put:
 *     summary: Update business address
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
 *         description: Business address updated successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/business-address', authMiddleware.verifyToken, sellerController.updateBusinessAddress);

/**
 * @swagger
 * /api/seller/notification-preferences:
 *   put:
 *     summary: Update notification preferences
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
 *               emailNotifications:
 *                 type: boolean
 *               pushNotifications:
 *                 type: boolean
 *               notificationTypes:
 *                 type: object
 *                 properties:
 *                   orderUpdates:
 *                     type: boolean
 *                   lowStock:
 *                     type: boolean
 *                   newReviews:
 *                     type: boolean
 *                   promotions:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/notification-preferences', authMiddleware.verifyToken, sellerController.updateNotificationPreferences);

/**
 * @swagger
 * /api/seller/reviews:
 *   get:
 *     summary: Get seller's reviews with optional filtering and pagination
 *     tags: [Seller]
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
 *         description: List of reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       buyer:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           profileImage:
 *                             type: object
 *                             properties:
 *                               url:
 *                                 type: string
 *                       rating:
 *                         type: number
 *                       comment:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       isVerifiedPurchase:
 *                         type: boolean
 *                       reply:
 *                         type: object
 *                         properties:
 *                           content:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalReviews:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     averageRating:
 *                       type: number
 *                     totalReviews:
 *                       type: number
 *                     ratingDistribution:
 *                       type: object
 *                       properties:
 *                         1:
 *                           type: number
 *                         2:
 *                           type: number
 *                         3:
 *                           type: number
 *                         4:
 *                           type: number
 *                         5:
 *                           type: number
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get('/reviews', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  sellerController.getSellerReviews
);

/**
 * @swagger
 * /api/seller/reviews/{reviewId}/reply:
 *   post:
 *     summary: Reply to a review
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review to reply to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: The reply content
 *     responses:
 *       200:
 *         description: Reply added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 review:
 *                   type: object
 *                   properties:
 *                     buyer:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                     rating:
 *                       type: number
 *                     comment:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     reply:
 *                       type: object
 *                       properties:
 *                         content:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Seller or review not found
 *       500:
 *         description: Server error
 */
router.post('/reviews/:reviewId/reply', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  sellerController.replyToReview
);

/**
 * @swagger
 * /api/seller/campaign-metrics:
 *   get:
 *     summary: Get seller's campaign metrics and performance
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Campaign metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCampaigns:
 *                   type: number
 *                 totalRecipients:
 *                   type: number
 *                 totalOpens:
 *                   type: number
 *                 totalClicks:
 *                   type: number
 *                 engagementRate:
 *                   type: string
 *                 clickThroughRate:
 *                   type: string
 *                 recentCampaigns:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       metrics:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get('/campaign-metrics',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  sellerController.getCampaignMetrics
);

/**
 * @swagger
 * /api/seller/campaign-followers:
 *   get:
 *     summary: Get seller's followers for campaign targeting
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: audienceType
 *         schema:
 *           type: string
 *           enum: [all, active, inactive]
 *         description: Type of audience to retrieve
 *     responses:
 *       200:
 *         description: Followers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalFollowers:
 *                   type: number
 *                 followers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       followDate:
 *                         type: string
 *                         format: date-time
 *                       lastInteraction:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get('/campaign-followers',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  sellerController.getActiveFollowers
);

/**
 * @swagger
 * /api/seller/campaign-preferences:
 *   put:
 *     summary: Update seller's campaign notification preferences
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
 *               campaignMetrics:
 *                 type: boolean
 *                 description: Whether to receive campaign metrics notifications
 *     responses:
 *       200:
 *         description: Campaign preferences updated successfully
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
 *                     emailNotifications:
 *                       type: boolean
 *                     pushNotifications:
 *                       type: boolean
 *                     notificationTypes:
 *                       type: object
 *                       properties:
 *                         orderUpdates:
 *                           type: boolean
 *                         lowStock:
 *                           type: boolean
 *                         newReviews:
 *                           type: boolean
 *                         promotions:
 *                           type: boolean
 *                         campaignMetrics:
 *                           type: boolean
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.put('/campaign-preferences',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  sellerController.updateCampaignPreferences
);

/**
 * @swagger
 * /api/seller/{sellerId}/all-reviews:
 *   get:
 *     summary: Get all reviews and comments associated with a seller
 *     description: Retrieves product reviews, blip comments, post comments, and store reviews for a seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
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
 *           default: 20
 *         description: Number of reviews per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, product, blip, post, store]
 *         description: Filter reviews by type
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest, rating]
 *         description: Sort reviews by date or rating
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [product, blip, post, store]
 *                       author:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           profileImage:
 *                             type: string
 *                       content:
 *                         type: string
 *                       rating:
 *                         type: number
 *                       title:
 *                         type: string
 *                       media:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                             type:
 *                               type: string
 *                               enum: [image, video]
 *                       source:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [product, blip, post, store]
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           image:
 *                             type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalReviews:
 *                       type: integer
 *                 stats:
 *                   type: object
 *                   properties:
 *                     averageRating:
 *                       type: number
 *                     totalReviews:
 *                       type: number
 *                     reviewsByType:
 *                       type: object
 *                       properties:
 *                         product:
 *                           type: number
 *                         blip:
 *                           type: number
 *                         post:
 *                           type: number
 *                         store:
 *                           type: number
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get('/:sellerId/all-reviews', sellerController.getAllReviews);

/**
 * @swagger
 * /api/seller/transactions:
 *   get:
 *     summary: Get seller's wallet transactions history
 *     description: Retrieves detailed transaction history including order payments, platform fees, and withdrawals
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [order_payment, withdrawal, platform_fee]
 *         description: Filter by transaction type
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
 *         description: Number of transactions per page
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
 *                       _id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [order_payment, withdrawal, platform_fee]
 *                       amount:
 *                         type: number
 *                       platformFee:
 *                         type: number
 *                       netAmount:
 *                         type: number
 *                       orderId:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalEarnings:
 *                       type: number
 *                     totalPlatformFees:
 *                       type: number
 *                     totalWithdrawals:
 *                       type: number
 *                     currentBalance:
 *                       type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalTransactions:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/transactions', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  sellerController.getTransactions
);

/**
 * @swagger
 * /api/seller/follow/{buyerId}:
 *   post:
 *     summary: Follow a buyer
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the buyer to follow
 *     responses:
 *       200:
 *         description: Successfully followed buyer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully followed buyer
 *       400:
 *         description: Already following this buyer
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.post('/follow/:buyerId', authMiddleware.verifyToken, authMiddleware.isSeller, sellerController.followBuyer);

/**
 * @swagger
 * /api/seller/unfollow/{buyerId}:
 *   delete:
 *     summary: Unfollow a buyer
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the buyer to unfollow
 *     responses:
 *       200:
 *         description: Successfully unfollowed buyer
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.delete('/unfollow/:buyerId', authMiddleware.verifyToken, authMiddleware.isSeller, sellerController.unfollowBuyer);

/**
 * @swagger
 * /api/seller/following/buyers:
 *   get:
 *     summary: Get list of buyers that the seller follows
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of followed buyers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   buyerId:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   followDate:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */
router.get('/following/buyers', authMiddleware.verifyToken, authMiddleware.isSeller, sellerController.getFollowedBuyers);



/**
 * @swagger
 * /api/seller/operating-hours:
 *   put:
 *     summary: Update store operating hours
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
 *                         format: HH:mm
 *                       closeTime:
 *                         type: string
 *                         format: HH:mm
 *                   tuesday:
 *                     $ref: '#/components/schemas/DaySchedule'
 *                   wednesday:
 *                     $ref: '#/components/schemas/DaySchedule'
 *                   thursday:
 *                     $ref: '#/components/schemas/DaySchedule'
 *                   friday:
 *                     $ref: '#/components/schemas/DaySchedule'
 *                   saturday:
 *                     $ref: '#/components/schemas/DaySchedule'
 *                   sunday:
 *                     $ref: '#/components/schemas/DaySchedule'
 *               timezone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Operating hours updated successfully
 *       400:
 *         description: Invalid time format
 *       401:
 *         description: Unauthorized
 */
router.put('/operating-hours', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  sellerController.updateOperatingHours
);

/**
 * @swagger
 * /api/seller/special-dates:
 *   post:
 *     summary: Add special operating dates (holidays, special hours, etc.)
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - specialDates
 *             properties:
 *               specialDates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - date
 *                     - isOpen
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     isOpen:
 *                       type: boolean
 *                     openTime:
 *                       type: string
 *                       format: HH:mm
 *                     closeTime:
 *                       type: string
 *                       format: HH:mm
 *                     note:
 *                       type: string
 *     responses:
 *       200:
 *         description: Special dates added successfully
 *       400:
 *         description: Invalid date format
 *       401:
 *         description: Unauthorized
 */
router.post('/special-dates', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  sellerController.addSpecialDates
);

/**
 * @swagger
 * /api/seller/store-policy:
 *   put:
 *     summary: Update store policy
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
 *               deliveryTimes:
 *                 type: string
 *               freeShippingPolicy:
 *                 type: string
 *               lostOrDamagedPolicy:
 *                 type: string
 *               refundPolicy:
 *                 type: string
 *               processingTime:
 *                 type: string
 *               refundMethod:
 *                 type: string
 *                 enum: [store_credit, original_payment, bank_transfer, both]
 *               nonRefundableItems:
 *                 type: array
 *                 items:
 *                   type: string
 *               returnWindow:
 *                 type: number
 *               returnCondition:
 *                 type: string
 *               returnShipping:
 *                 type: string
 *                 enum: [buyer_paid, seller_paid, case_by_case]
 *               exchangePolicy:
 *                 type: string
 *               allowsCod:
 *                 type: boolean
 *                 description: Whether the seller accepts Cash on Delivery
 *     responses:
 *       200:
 *         description: Store policy updated successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/store-policy', authMiddleware.verifyToken, sellerController.updateStorePolicy);

/**
 * @swagger
 * /api/seller/social-media:
 *   put:
 *     summary: Update seller's social media information
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
 *               instagram:
 *                 type: string
 *                 description: Instagram profile URL or username
 *                 example: "https://instagram.com/mystore"
 *               facebook:
 *                 type: string
 *                 description: Facebook profile URL or username
 *                 example: "https://facebook.com/mystore"
 *               tiktok:
 *                 type: string
 *                 description: TikTok profile URL or username
 *                 example: "https://tiktok.com/@mystore"
 *     responses:
 *       200:
 *         description: Social media information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Social media information updated successfully
 *                 socialMedia:
 *                   type: object
 *                   properties:
 *                     instagram:
 *                       type: string
 *                     facebook:
 *                       type: string
 *                     tiktok:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.put('/social-media', authMiddleware.verifyToken, sellerController.updateSocialMedia);

/**
 * @swagger
 * /api/seller/bank-change-request:
 *   post:
 *     summary: Submit a bank account change request
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
 *               newBankDetails:
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
 *               proofDocument:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Bank change request submitted successfully
 *       400:
 *         description: Invalid request or missing proof document
 *       500:
 *         description: Server error
 */
router.post('/bank-change-request', 
  authMiddleware.verifyToken,
  upload.single('proofDocument'),
  sellerController.requestBankAccountChange
);

/**
 * @swagger
 * /api/seller/bank-change-request/status:
 *   get:
 *     summary: Get bank change request status
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bank change request status retrieved successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get('/bank-change-request/status',
  authMiddleware.verifyToken,
  sellerController.getBankChangeRequestStatus
);

/**
 * @swagger
 * /api/seller/products/{productId}/reviews/{reviewId}/reply:
 *   post:
 *     summary: Add or update a reply to a product review
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review to reply to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: The reply content
 *     responses:
 *       200:
 *         description: Reply added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 review:
 *                   type: object
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Product or review not found
 *       500:
 *         description: Server error
 */
router.post('/products/:productId/reviews/:reviewId/reply',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  (req, res) => {
    // Forward the request to the product controller
    const productController = require('../controllers/productController');
    return productController.replyToProductReview(req, res);
  }
);



/**
 * @swagger
 * /api/seller/{sellerId}/product-reviews:
 *   get:
 *     summary: Get all product reviews for a seller
 *     description: Publicly accessible endpoint that retrieves all reviews across all of a seller's products with product details
 *     tags: [Seller]
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
 *           enum: [recent, rating-high, rating-low, replied, unreplied]
 *           default: recent
 *         description: Sort order for reviews
 *     responses:
 *       200:
 *         description: List of product reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sellerId:
 *                   type: string
 *                 sellerInfo:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                       description: Store name, business name, or full name of the seller
 *                     avatar:
 *                       type: string
 *                       description: URL to the seller's store avatar
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       reviewId:
 *                         type: string
 *                       product:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *                           description:
 *                             type: string
 *                           image:
 *                             type: string
 *                       buyer:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                       rating:
 *                         type: number
 *                       title:
 *                         type: string
 *                       comment:
 *                         type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                             contentType:
 *                               type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       reply:
 *                         type: object
 *                         properties:
 *                           content:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           seller:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                                 description: Store name or business name of the seller
 *                               avatar:
 *                                 type: string
 *                                 description: URL to the seller's store avatar
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalReviews:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     averageRating:
 *                       type: number
 *                     ratingDistribution:
 *                       type: object
 *                       properties:
 *                         1:
 *                           type: number
 *                         2:
 *                           type: number
 *                         3:
 *                           type: number
 *                         4:
 *                           type: number
 *                         5:
 *                           type: number
 *                     totalReviews:
 *                       type: number
 *                     repliedCount:
 *                       type: number
 *                     unrepliedCount:
 *                       type: number
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get('/:sellerId/product-reviews', sellerController.getAllProductReviews);

/**
 * @swagger
 * /api/seller/product/{productId}/review/{reviewId}:
 *   get:
 *     summary: Get detailed information about a specific review (public access)
 *     description: Publicly accessible endpoint that retrieves detailed information about a specific product review including product info, buyer details, and seller's reply if available.
 *     tags: [Seller]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review
 *     responses:
 *       200:
 *         description: Review details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviewId:
 *                   type: string
 *                 product:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     description:
 *                       type: string
 *                     image:
 *                       type: string
 *                 buyer:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     profileImage:
 *                       type: string
 *                 rating:
 *                   type: number
 *                 title:
 *                   type: string
 *                 comment:
 *                   type: string
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       contentType:
 *                         type: string
 *                 purchasedVariant:
 *                   type: object
 *                   properties:
 *                     color:
 *                       type: string
 *                     size:
 *                       type: string
 *                     material:
 *                       type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 reply:
 *                   type: object
 *                   properties:
 *                     content:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     seller:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         avatar:
 *                           type: string
 *       404:
 *         description: Product or review not found
 *       500:
 *         description: Server error
 */
router.get('/product/:productId/review/:reviewId', sellerController.getPublicProductReviewDetails);

/**
 * @swagger
 * /api/seller/search:
 *   get:
 *     summary: Search for sellers
 *     description: Search sellers by name, store name, business name, location and category with optional authentication to see follow status
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term for seller name, store name, or business name
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter sellers by country location
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter sellers by product category
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
 *         description: Number of sellers per page
 *     responses:
 *       200:
 *         description: List of sellers matching search criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sellers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       businessName:
 *                         type: string
 *                       storeName:
 *                         type: string
 *                       storeAvatar:
 *                         type: string
 *                         nullable: true
 *                       aboutStore:
 *                         type: string
 *                         nullable: true
 *                       socialMedia:
 *                         type: object
 *                         properties:
 *                           instagram:
 *                             type: string
 *                             nullable: true
 *                           facebook:
 *                             type: string
 *                             nullable: true
 *                           tiktok:
 *                             type: string
 *                             nullable: true
 *                       location:
 *                         type: object
 *                         properties:
 *                           country:
 *                             type: string
 *                             nullable: true
 *                           state:
 *                             type: string
 *                             nullable: true
 *                           city:
 *                             type: string
 *                             nullable: true
 *                       categories:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             subCategories:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                       followerCount:
 *                         type: integer
 *                       isFollowing:
 *                         type: boolean
 *                         description: Only present for authenticated buyers
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/search', optionalAuthMiddleware, sellerController.searchSellers);

/**
 * @swagger
 * /api/seller/account-pending:
 *   put:
 *     summary: Toggle seller account pending status
 *     description: Update the account pending status of the seller's account
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: boolean
 *                 description: The pending status to set (true or false)
 *     responses:
 *       200:
 *         description: Account pending status updated successfully
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
 *                   example: Account pending status updated to true
 *                 accountPending:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.put('/account-pending', authMiddleware.verifyToken, authMiddleware.isSeller, sellerController.toggleAccountPending);

module.exports = router;
