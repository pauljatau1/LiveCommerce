const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { verifyToken } = require('../../../middlewares/authMiddleware');
const buyerController = require('../controllers/buyer.controller');

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
 * /api/v2/buyers/profile/avatar:
 *   delete:
 *     summary: Delete buyer profile image
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile image deleted successfully
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
 *                   example: "Profile image deleted successfully"
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
 *                     profileImage:
 *                       type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.delete('/profile/avatar', verifyToken, buyerController.deleteProfileImage);

module.exports = router;


