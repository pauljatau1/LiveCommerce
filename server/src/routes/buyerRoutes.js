const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const passport = require('passport');

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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               country:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               shippingAddresses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     country:
 *                       type: string
 *                     city:
 *                       type: string
 *                     address1:
 *                       type: string
 *                     address2:
 *                       type: string
 *                     zipCode:
 *                       type: string
 *                     addressType:
 *                       type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
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
 * /api/buyer/follow-seller:
 *   post:
 *     summary: Follow a seller
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
 *               sellerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully followed the seller
 *       400:
 *         description: Already following this seller
 *       404:
 *         description: Buyer or Seller not found
 *       500:
 *         description: Internal server error
 */
router.post('/follow-seller', authMiddleware.verifyToken, buyerController.followSeller);

/**
 * @swagger
 * /api/buyer/unfollow-seller:
 *   post:
 *     summary: Unfollow a seller
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
 *               sellerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully unfollowed the seller
 *       400:
 *         description: Not following this seller
 *       404:
 *         description: Buyer or Seller not found
 *       500:
 *         description: Internal server error
 */
router.post('/unfollow-seller', authMiddleware.verifyToken, buyerController.unfollowSeller);

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
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.post('/send-phone-otp', authMiddleware.verifyToken, buyerController.sendPhoneOTP);

/**
 * @swagger
 * /api/buyer/verify-phone-otp:
 *   post:
 *     summary: Verify phone OTP
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
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone number verified successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.post('/verify-phone-otp', authMiddleware.verifyToken, buyerController.verifyPhoneOTP);

/**
 * @swagger
 * /api/buyer/google:
 *   get:
 *     summary: Redirect to Google OAuth
 *     tags: [Buyer]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /api/buyer/google-callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Buyer]
 *     responses:
 *       200:
 *         description: Successful authentication
 *       302:
 *         description: Redirect on failure
 */
router.get('/google-callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  const { user, token } = req.user;
  res.json({ user, token });
});

/**
 * @swagger
 * /api/buyer/forgot-password:
 *   post:
 *     summary: Request password reset email
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
 *         description: Password reset email sent
 *       400:
 *         description: Email is required
 *       404:
 *         description: No account with that email exists
 *       500:
 *         description: Internal server error
 */
router.post('/forgot-password', buyerController.forgotPassword);

/**
 * @swagger
 * /api/buyer/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Buyer]
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
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired reset token
 *       500:
 *         description: Internal server error
 */
router.post('/reset-password', buyerController.resetPassword);

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
 *         description: List of buyer's orders
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

module.exports = router;
