const express = require('express');
const router = express.Router();

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
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username (required)
 *                 example: "johndoe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address (required, auto-verified)
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password (required)
 *                 example: "password123"
 *               firstName:
 *                 type: string
 *                 description: First name (optional, auto-generated from username if not provided)
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: Last name (optional, auto-generated from username if not provided)
 *                 example: "Doe"
 *               country:
 *                 type: string
 *                 description: Country code (optional)
 *                 example: "Nigeria"
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number (optional, not unique)
 *                 example: "+2348012345678"
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
 * /api/v2/buyers/forgot-password-sms:
 *   post:
 *     summary: Request password reset OTP via SMS
 *     description: Send a password reset OTP to the buyer's phone number via SMS using Termii API
 *     tags: [Buyer V2]
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
 *                 example: "+23490126727"
 *                 description: The buyer's phone number in international format (must include country code)
 *     responses:
 *       200:
 *         description: Password reset code sent successfully via SMS
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
 *         description: Validation error - Invalid phone number format
 *       500:
 *         description: Internal server error
 */
router.post('/forgot-password-sms', buyerController.forgotPasswordSMS);

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

module.exports = router;


