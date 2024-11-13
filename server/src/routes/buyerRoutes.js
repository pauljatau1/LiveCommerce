const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');
const authMiddleware = require('../middlewares/authMiddleware');
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
 *               profileImage:
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
 *               country:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               profileImage:
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
 *                   type: string
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

module.exports = router;
