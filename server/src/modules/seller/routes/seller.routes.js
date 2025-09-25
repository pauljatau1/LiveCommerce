const express = require('express');
const sellerController = require('../controllers/seller.controller');
const { verifyToken } = require('../../../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

/**
 * @swagger
 * /api/v2/sellers/register:
 *   post:
 *     summary: Register a new seller
 *     tags: [Seller V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - phoneNumber
 *               - storeName
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Seller's first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: Seller's last name
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Seller's email address
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 description: Seller's password (minimum 6 characters)
 *                 example: "password123"
 *               phoneNumber:
 *                 type: string
 *                 description: Seller's phone number
 *                 example: "+2348012345678"
 *               storeName:
 *                 type: string
 *                 description: Seller's store name
 *                 example: "John's Store"
 *     responses:
 *       201:
 *         description: Seller registered successfully
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
 *                   example: "Seller registered successfully"
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
 *                         phoneNumber:
 *                           type: string
 *                           example: "+2348012345678"
 *                         storeName:
 *                           type: string
 *                           example: "John's Store"
 *                         agoraUid:
 *                           type: number
 *                           example: 123456789
 *                         emailVerified:
 *                           type: boolean
 *                           example: true
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-01T00:00:00.000Z"
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 pagination:
 *                   type: null
 *                   example: null
 *       422:
 *         description: Validation error - Invalid input data
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
 *                         example: "email"
 *                       message:
 *                         type: string
 *                         example: "Please provide a valid email address"
 *       409:
 *         description: Email is already in use
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
 *                   example: "Email is already in use."
 *                 errors:
 *                   type: null
 *                   example: null
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
 *                 errors:
 *                   type: null
 *                   example: null
 */
router.post('/register', sellerController.register);

/**
 * @swagger
 * /api/v2/sellers/login:
 *   post:
 *     summary: Login a seller
 *     description: Authenticate a seller with email and password
 *     tags: [Seller V2]
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
 *                 description: Seller's email address
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 description: Seller's password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                         storeName:
 *                           type: string
 *                           example: "John's Store"
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 pagination:
 *                   type: null
 *                   example: null
 *       422:
 *         description: Validation error - Invalid input data
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
 *                         example: "email"
 *                       message:
 *                         type: string
 *                         example: "Email is required"
 *       404:
 *         description: Seller not found or invalid credentials
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
 *                   example: "Invalid credentials"
 *                 errors:
 *                   type: null
 *                   example: null
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
 *                 errors:
 *                   type: null
 *                   example: null
 */
router.post('/login', sellerController.login);

/**
 * @swagger
 * /api/v2/sellers/check-token:
 *   get:
 *     summary: Check and validate JWT token for seller authentication
 *     description: Validates the provided JWT token and returns a new token if valid
 *     tags: [Seller V2]
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
 *                 pagination:
 *                   type: null
 *                   example: null
 *       401:
 *         description: Unauthorized - Invalid or expired token
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
 *                   example: "Token has expired. Please sign in again."
 *                 errors:
 *                   type: null
 *                   example: null
 *       403:
 *         description: Forbidden - No token provided
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
 *                   example: "A token is required for authentication"
 *                 errors:
 *                   type: null
 *                   example: null
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
 *                 errors:
 *                   type: null
 *                   example: null
 */
router.get('/check-token', sellerController.checkToken);

/**
 * @swagger
 * /api/v2/sellers/resend-otp:
 *   post:
 *     summary: Resend OTP to seller's email for verification
 *     description: Sends a new OTP code to the seller's email address for email verification
 *     tags: [Seller V2]
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
 *                 description: Seller's email address
 *                 example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               message:
 *                 type: string
 *                 example: "OTP resent successfully"
 *               data:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "OTP resent successfully"
 *               pagination:
 *                 type: null
 *                 example: null
 *       400:
 *         description: Bad request - Invalid email format or email already verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Email is already verified"
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                       example: "email"
 *                     message:
 *                       type: string
 *                       example: "Email must be a valid email address"
 *       404:
 *         description: Seller not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Seller not found"
 *               errors:
 *                 type: null
 *                 example: null
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Something went wrong!"
 *               errors:
 *                 type: null
 *                 example: null
 */
router.post('/resend-otp', sellerController.resendOTP);

/**
 * @swagger
 * /api/v2/sellers/verify-otp:
 *   post:
 *     summary: Verify OTP for seller email verification
 *     tags: [Seller V2]
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
 *                 format: email
 *                 description: Seller's email address
 *                 example: "seller@example.com"
 *               otp:
 *                 type: string
 *                 description: One-time password (4 digits)
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
 *                   example: "Email verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Email verified successfully."
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
 *                           example: "seller@example.com"
 *                         emailVerified:
 *                           type: boolean
 *                           example: true
 *                         storeName:
 *                           type: string
 *                           example: "John's Store"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-01-01T00:00:00.000Z"
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 pagination:
 *                   type: null
 *                   example: null
 *       422:
 *         description: Validation error - Invalid input data or OTP
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
 *                         example: "otp"
 *                       message:
 *                         type: string
 *                         example: "Invalid OTP"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
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
 *                   example: "Unauthorized access"
 *       404:
 *         description: Seller not found
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
 *                   example: "Seller not found"
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
 *                   example: "Internal server error"
 */
router.post('/verify-otp', sellerController.verifyOTP);

/**
 * @swagger
 * /api/v2/sellers/profile/account-type:
 *   put:
 *     summary: Select account type for seller
 *     tags: [Seller V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountType
 *             properties:
 *               accountType:
 *                 type: string
 *                 enum: [individual, business]
 *                 description: The account type to select
 *                 example: "business"
 *     responses:
 *       200:
 *         description: Account type selected successfully
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
 *                   example: "Account type selected successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     accountType:
 *                       type: string
 *                       example: "business"
 *                     isProfileComplete:
 *                       type: boolean
 *                       example: false
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     storeName:
 *                       type: string
 *                       example: "John's Store"
 *       400:
 *         description: Bad request - Invalid account type
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */

// Select account type route
router.put('/profile/account-type', verifyToken, sellerController.selectAccountType);

/**
 * @swagger
 * /api/v2/sellers/select-categories:
 *   post:
 *     summary: Select categories for seller
 *     tags: [Seller V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categories
 *             properties:
 *               categories:
 *                 type: array
 *                 description: Array of categories to select
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - name
 *                     - subCategories
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Category ID
 *                       example: "507f1f77bcf86cd799439011"
 *                     name:
 *                       type: string
 *                       description: Category name
 *                       example: "Electronics"
 *                     subCategories:
 *                       type: array
 *                       description: Array of sub-categories
 *                       items:
 *                         type: object
 *                         required:
 *                           - name
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Sub-category name
 *                             example: "Smartphones"
 *     responses:
 *       200:
 *         description: Categories selected successfully
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
 *                   example: "Categories selected successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Categories selected successfully"
 *                     seller:
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
 *                           example: "seller@example.com"
 *                         storeName:
 *                           type: string
 *                           example: "John's Store"
 *                         categories:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: "Electronics"
 *                               subCategories:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     name:
 *                                       type: string
 *                                       example: "Smartphones"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-01-01T00:00:00.000Z"
 *                 pagination:
 *                   type: null
 *                   example: null
 *       422:
 *         description: Validation error - Invalid input data
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
 *                         example: "categories"
 *                       message:
 *                         type: string
 *                         example: "Categories are required"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
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
 *                   example: "Unauthorized access"
 *       404:
 *         description: Seller not found
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
 *                   example: "Seller not found"
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
 *                   example: "Internal server error"
 */
router.post('/select-categories', verifyToken, sellerController.selectCategories);

/**
 * @swagger
 * /api/v2/sellers/update-categories:
 *   put:
 *     summary: Update categories for seller
 *     tags: [Seller V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categories
 *             properties:
 *               categories:
 *                 type: array
 *                 description: Array of categories to update
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - name
 *                     - subCategories
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Category ID
 *                       example: "507f1f77bcf86cd799439011"
 *                     name:
 *                       type: string
 *                       description: Category name
 *                       example: "Electronics"
 *                     subCategories:
 *                       type: array
 *                       description: Array of sub-categories
 *                       items:
 *                         type: object
 *                         required:
 *                           - name
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Sub-category name
 *                             example: "Smartphones"
 *     responses:
 *       200:
 *         description: Categories updated successfully
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
 *                   example: "Categories updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Categories updated successfully"
 *                     seller:
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
 *                           example: "seller@example.com"
 *                         storeName:
 *                           type: string
 *                           example: "John's Store"
 *                         categories:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: "Electronics"
 *                               subCategories:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     name:
 *                                       type: string
 *                                       example: "Smartphones"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-01-01T00:00:00.000Z"
 *                 pagination:
 *                   type: null
 *                   example: null
 *       422:
 *         description: Validation error - Invalid input data
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
 *                         example: "categories"
 *                       message:
 *                         type: string
 *                         example: "Categories are required"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
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
 *                   example: "Unauthorized access"
 *       404:
 *         description: Seller not found
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
 *                   example: "Seller not found"
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
 *                   example: "Internal server error"
 */
router.put('/update-categories', verifyToken, sellerController.updateCategories);

/**
 * @swagger
 * /api/v2/sellers/profile:
 *   get:
 *     summary: Get seller profile information
 *     tags: [Seller V2]
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
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+2348012345678"
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     emailVerified:
 *                       type: boolean
 *                       example: true
 *                     walletBalance:
 *                       type: number
 *                       example: 5000
 *                     storeVisits:
 *                       type: number
 *                       example: 150
 *                     followersCount:
 *                       type: number
 *                       example: 250
 *                     followingCount:
 *                       type: number
 *                       example: 45
 *                     totalOrders:
 *                       type: number
 *                       example: 89
 *                     streamCount:
 *                       type: number
 *                       example: 15
 *                     categoriesCount:
 *                       type: number
 *                       example: 8
 *                     hasProducts:
 *                       type: boolean
 *                       example: true
 *                     hasMoreThan10Blips:
 *                       type: boolean
 *                       example: true
 *                     storeStatus:
 *                       type: object
 *                       properties:
 *                         currentSchedule:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               example: "regular"
 *                             day:
 *                               type: string
 *                               example: "monday"
 *                             isOpen:
 *                               type: boolean
 *                               example: true
 *                             openTime:
 *                               type: string
 *                               example: "09:00"
 *                             closeTime:
 *                               type: string
 *                               example: "17:00"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */

// Get profile route
router.get('/profile', verifyToken, sellerController.getProfile);

/**
 * @swagger
 * /api/v2/sellers/profile/bank-details:
 *   put:
 *     summary: Add bank details to seller profile
 *     tags: [Seller V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bankDetails
 *             properties:
 *               bankDetails:
 *                 type: object
 *                 required:
 *                   - bankCountry
 *                   - bankName
 *                   - bankAccountType
 *                   - accountCurrency
 *                   - accountNumber
 *                   - accountName
 *                 properties:
 *                   bankCountry:
 *                     type: string
 *                     description: Country where the bank is located
 *                     example: "Nigeria"
 *                   bankName:
 *                     type: string
 *                     description: Name of the bank
 *                     example: "First Bank of Nigeria"
 *                   bankAccountType:
 *                     type: string
 *                     description: Type of bank account
 *                     example: "Savings"
 *                   accountCurrency:
 *                     type: string
 *                     description: Currency of the account (3-letter code)
 *                     example: "NGN"
 *                   accountNumber:
 *                     type: string
 *                     description: Bank account number
 *                     example: "1234567890"
 *                   accountName:
 *                     type: string
 *                     description: Name on the bank account
 *                     example: "John Doe"
 *                   swiftCode:
 *                     type: string
 *                     description: SWIFT/BIC code (optional)
 *                     example: "FBNINGL"
 *                   bankIdentifierCode:
 *                     type: string
 *                     description: Bank identifier code (optional)
 *                     example: "FBNINGL"
 *     responses:
 *       200:
 *         description: Bank details added successfully
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
 *                   example: "Bank details added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Bank details added successfully"
 *                     seller:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         bankDetails:
 *                           type: object
 *                           properties:
 *                             bankCountry:
 *                               type: string
 *                               example: "Nigeria"
 *                             bankName:
 *                               type: string
 *                               example: "First Bank of Nigeria"
 *                             bankAccountType:
 *                               type: string
 *                               example: "Savings"
 *                             accountCurrency:
 *                               type: string
 *                               example: "NGN"
 *                             accountNumber:
 *                               type: string
 *                               example: "1234567890"
 *                             accountName:
 *                               type: string
 *                               example: "John Doe"
 *                             swiftCode:
 *                               type: string
 *                               example: "FBNINGL"
 *                             bankIdentifierCode:
 *                               type: string
 *                               example: "FBNINGL"
 *                         hasFilledBankDetails:
 *                           type: boolean
 *                           example: true
 *       422:
 *         description: Validation error - invalid bank details format
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
 *                         description: The field that failed validation
 *                         example: "bankCountry"
 *                       message:
 *                         type: string
 *                         description: The validation error message
 *                         example: "Bank country is required"
 *                   example:
 *                     - field: "bankCountry"
 *                       message: "Bank country is required"
 *                     - field: "bankName"
 *                       message: "Bank name is required"
 *                     - field: "bankAccountType"
 *                       message: "Bank account type is required"
 *                     - field: "accountCurrency"
 *                       message: "Account currency is required"
 *                     - field: "accountNumber"
 *                       message: "Account number is required"
 *                     - field: "accountName"
 *                       message: "Account name is required"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */

// Add bank details route
router.put('/profile/bank-details', verifyToken, sellerController.addBankDetails);

/**
 * @swagger
 * /api/v2/sellers/verification/company:
 *   post:
 *     summary: Upload company verification documents
 *     tags: [Seller V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - certificateOfIncorporation
 *             properties:
 *               certificateOfIncorporation:
 *                 type: string
 *                 format: binary
 *                 description: Certificate of Incorporation document (required)
 *                 example: "certificate.pdf"
 *               businessTaxId:
 *                 type: string
 *                 format: binary
 *                 description: Business Tax ID document (optional)
 *                 example: "tax-id.pdf"
 *     responses:
 *       200:
 *         description: Company verification documents uploaded successfully
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
 *                   example: "Company verification documents uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Company verification documents uploaded successfully"
 *                     documents:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: "company"
 *                         documents:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               documentType:
 *                                 type: string
 *                                 description: Type of verification document
 *                                 example: "certificateOfIncorporation"
 *                               fileUrl:
 *                                 type: string
 *                                 description: URL of the uploaded document
 *                                 example: "https://cdn.example.com/verification/507f1f77bcf86cd799439011/company/uuid-certificate.pdf"
 *                               public_id:
 *                                 type: string
 *                                 description: S3 key of the uploaded document
 *                                 example: "verification/507f1f77bcf86cd799439011/company/uuid-certificate.pdf"
 *       400:
 *         description: Bad request - Missing required documents or invalid file format
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
 *                   example: "Certificate of Incorporation is required"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Seller not found
 *       422:
 *         description: Validation error - Invalid file type, size, or format
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
 *                         description: The field that failed validation
 *                         example: "certificateOfIncorporation"
 *                       message:
 *                         type: string
 *                         description: The validation error message
 *                         example: "Certificate of Incorporation file size must not exceed 10MB"
 *                   example:
 *                     - field: "certificateOfIncorporation"
 *                       message: "Certificate of Incorporation file size must not exceed 10MB"
 *                     - field: "businessTaxId"
 *                       message: "Business Tax ID must be a PDF, image, or Word document"
 *       500:
 *         description: Internal server error
 */

// Upload company verification documents route
router.post('/verification/company', verifyToken, upload.fields([
  { name: 'certificateOfIncorporation', maxCount: 1 },
  { name: 'businessTaxId', maxCount: 1 }
]), sellerController.uploadCompanyVerification);

/**
 * @swagger
 * /api/v2/sellers/verification/individual:
 *   post:
 *     summary: Upload individual verification documents
 *     tags: [Seller V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - governmentId
 *               - proofOfAddress
 *             properties:
 *               individualTaxId:
 *                 type: string
 *                 format: binary
 *                 description: Individual Tax ID document (optional)
 *                 example: "tax-id.pdf"
 *               governmentId:
 *                 type: string
 *                 format: binary
 *                 description: Government ID document (required)
 *                 example: "government-id.pdf"
 *               proofOfAddress:
 *                 type: string
 *                 format: binary
 *                 description: Proof of Address document (required)
 *                 example: "address-proof.pdf"
 *     responses:
 *       200:
 *         description: Individual verification documents uploaded successfully
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
 *                   example: "Individual verification documents uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Individual verification documents uploaded successfully"
 *                     documents:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: "individual"
 *                         documents:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               documentType:
 *                                 type: string
 *                                 description: Type of verification document
 *                                 example: "governmentId"
 *                               fileUrl:
 *                                 type: string
 *                                 description: URL of the uploaded document
 *                                 example: "https://cdn.example.com/verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf"
 *                               public_id:
 *                                 type: string
 *                                 description: S3 key of the uploaded document
 *                                 example: "verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf"
 *       400:
 *         description: Bad request - Missing required documents or invalid file format
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
 *                   example: "Government ID and Proof of Address are required"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Seller not found
 *       422:
 *         description: Validation error - Invalid file type, size, or format
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
 *                         description: The field that failed validation
 *                         example: "governmentId"
 *                       message:
 *                         type: string
 *                         description: The validation error message
 *                         example: "Government ID file size must not exceed 10MB"
 *                   example:
 *                     - field: "governmentId"
 *                       message: "Government ID file size must not exceed 10MB"
 *                     - field: "proofOfAddress"
 *                       message: "Proof of Address must be a PDF, image, or Word document"
 *       500:
 *         description: Internal server error
 */

// Upload individual verification documents route
router.post('/verification/individual', verifyToken, upload.fields([
  { name: 'individualTaxId', maxCount: 1 },
  { name: 'governmentId', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 }
]), sellerController.uploadIndividualVerification);

/**
 * @swagger
 * /api/v2/sellers/verification/smileid/token:
 *   post:
 *     summary: Generate SmileID token for seller verification
 *     description: Generates a SmileID token for seller identity verification using SmileID services
 *     tags: [Seller V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountType
 *               - idType
 *             properties:
 *               accountType:
 *                 type: string
 *                 enum: [individual, business]
 *                 description: The type of account for verification
 *                 example: "individual"
 *               idType:
 *                 type: string
 *                 description: The type of ID document for verification (varies by account type)
 *                 example: "NIN_SLIP"
 *               userId:
 *                 type: string
 *                 description: Optional user ID for tracking (if not provided, will be auto-generated)
 *                 example: "user123"
 *     responses:
 *       200:
 *         description: SmileID token generated successfully
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
 *                   example: "SmileID token generated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: The generated SmileID token
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: Token expiration timestamp
 *                       example: "2024-01-01T01:00:00.000Z"
 *                     userId:
 *                       type: string
 *                       description: Unique user ID for tracking
 *                       example: "seller-507f1f77bcf86cd799439011-1704067200000"
 *                     jobId:
 *                       type: string
 *                       description: Unique job ID for tracking
 *                       example: "job-507f1f77bcf86cd799439011-1704067200000"
 *                     product:
 *                       type: string
 *                       description: SmileID product used for verification
 *                       example: "enhanced_kyc"
 *                     accountType:
 *                       type: string
 *                       description: Account type used
 *                       example: "individual"
 *                     idType:
 *                       type: string
 *                       description: ID type used
 *                       example: "NIN_SLIP"
 *                     success:
 *                       type: boolean
 *                       description: Success status
 *                       example: true
 *                 pagination:
 *                   type: null
 *                   example: null
 *       422:
 *         description: Unprocessable Entity - Validation failed
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
 *                         example: "accountType"
 *                       message:
 *                         type: string
 *                         example: "Account type must be either \"individual\" or \"business\""
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error - SmileID API failure
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
 *                   example: "Failed to generate SmileID token"
 *                 errors:
 *                   type: null
 *                   example: null
 */

// Generate SmileID token route
router.post('/verification/smileid/token', verifyToken, sellerController.generateSmileIdToken);

/**
 * @swagger
 * /api/v2/sellers/verification/smileid/job:
 *   post:
 *     tags: [Seller V2]
 *     summary: Process SmileID verification job
 *     description: |
 *       Processes a SmileID verification job for seller identity verification.
 *       
 *       **Individual Account Verification (Enhanced KYC):**
 *       - Uses SmileID IDApi for Enhanced KYC verification
 *       - Requires ID information (first_name, last_name, id_number)
 *       - Supports NIN_SLIP and other ID types
 *       - Returns job ID for tracking verification status
 *       
 *       **Business Account Verification:**
 *       - Uses SmileID SIDWebAPI for business verification
 *       - Requires images array for document verification
 *       - Supports business document verification
 *       - Returns job ID for tracking verification status
 *       
 *       **Security Features:**
 *       - Requires valid authentication token
 *       - Validates seller account type
 *       - Generates unique tracking IDs
 *       - Stores verification results securely
 *       
 *       **Response Structure:**
 *       - Returns job processing result with tracking information
 *       - Includes SmileID API response data
 *       - Provides success status and job ID
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idInfo:
 *                 type: object
 *                 description: ID information for individual account verification (required for individual accounts)
 *                 properties:
 *                   first_name:
 *                     type: string
 *                     description: First name as it appears on the ID
 *                     example: "John"
 *                   last_name:
 *                     type: string
 *                     description: Last name as it appears on the ID
 *                     example: "Doe"
 *                   id_number:
 *                     type: string
 *                     description: ID number from the document
 *                     example: "12345678901"
 *                   country:
 *                     type: string
 *                     description: Country code (defaults to NG)
 *                     example: "NG"
 *                   id_type:
 *                     type: string
 *                     description: Type of ID document (defaults to NIN_SLIP)
 *                     example: "NIN_SLIP"
 *                   phone_number:
 *                     type: string
 *                     description: Phone number (optional)
 *                     example: "+2348012345678"
 *                   dob:
 *                     type: string
 *                     description: Date of birth (optional)
 *                     example: "1990-01-01"
 *               images:
 *                 type: array
 *                 description: Images array for business account verification (required for business accounts)
 *                 items:
 *                   type: string
 *                   description: Base64 encoded image or image URL
 *                 example: ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...", "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."]
 *               partner_params:
 *                 type: object
 *                 description: Additional partner parameters (optional)
 *                 additionalProperties: true
 *                 example: {}
 *           examples:
 *             individual_verification:
 *               summary: Individual account verification
 *               value:
 *                 idInfo:
 *                   first_name: "John"
 *                   last_name: "Doe"
 *                   id_number: "12345678901"
 *                   country: "NG"
 *                   id_type: "NIN_SLIP"
 *                   phone_number: "+2348012345678"
 *                 partner_params: {}
 *             business_verification:
 *               summary: Business account verification
 *               value:
 *                 images: ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...", "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."]
 *                 partner_params: {}
 *     responses:
 *       200:
 *         description: SmileID job processed successfully
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
 *                   example: "SmileID job processed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       description: Success status
 *                       example: true
 *                     jobId:
 *                       type: string
 *                       description: Unique job ID for tracking
 *                       example: "job-507f1f77bcf86cd799439011-1704067200000"
 *                     result:
 *                       type: object
 *                       description: SmileID API response
 *                       properties:
 *                         success:
 *                           type: boolean
 *                           description: API success status
 *                           example: true
 *                         job_id:
 *                           type: string
 *                           description: SmileID job ID
 *                           example: "job-507f1f77bcf86cd799439011-1704067200000"
 *                         images:
 *                           type: array
 *                           description: Processed images
 *                           items:
 *                             type: string
 *                         ResultCode:
 *                           type: string
 *                           description: SmileID result code
 *                           example: "1012"
 *                 pagination:
 *                   type: null
 *                   example: null
 *       422:
 *         description: Unprocessable Entity - Validation failed
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
 *                         example: "idInfo.first_name"
 *                       message:
 *                         type: string
 *                         example: "First name is required for Enhanced KYC verification"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error - SmileID API failure
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
 *                   example: "Failed to process SmileID job"
 *                 errors:
 *                   type: null
 *                   example: null
 */

// Process SmileID job route
router.post('/verification/smileid/job', verifyToken, sellerController.processSmileIdJob);

/**
 * @swagger
 * /api/v2/sellers/verification/smileid/individual:
 *   post:
 *     tags: [Seller V2]
 *     summary: Save individual SmileID verification result
 *     description: |
 *       Saves the result of individual SmileID verification to the seller's record.
 *       
 *       **Individual Verification Processing:**
 *       - Validates SmileID verification result data
 *       - Analyzes verification success based on images and result codes
 *       - Updates seller verification status and documents
 *       - Tracks verification completion with analytics
 *       - Sends confirmation email to seller
 *       
 *       **Success Criteria:**
 *       - Must have images in the result
 *       - Must have successful result codes (1012, 1020, 1021) or success flag
 *       - Only marks as verified if both criteria are met
 *       
 *       **Security Features:**
 *       - Requires valid authentication token
 *       - Validates all required fields
 *       - Ensures data integrity and consistency
 *       - Provider validation for security
 *       
 *       **Response Structure:**
 *       - Returns verification result with success status
 *       - Includes verification details and actual success indicator
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - smileIdResult
 *               - accountType
 *               - verifiedAt
 *               - verificationProvider
 *             properties:
 *               smileIdResult:
 *                 type: object
 *                 description: SmileID verification result object
 *                 properties:
 *                   ResultCode:
 *                     type: string
 *                     description: SmileID result code
 *                     example: "1012"
 *                   success:
 *                     type: boolean
 *                     description: API success status
 *                     example: true
 *                   images:
 *                     type: array
 *                     description: Processed images
 *                     items:
 *                       type: string
 *               accountType:
 *                 type: string
 *                 enum: [individual]
 *                 description: Account type for verification
 *                 example: "individual"
 *               verifiedAt:
 *                 type: string
 *                 format: date-time
 *                 description: Verification completion timestamp
 *                 example: "2024-01-15T10:30:00.000Z"
 *               verificationProvider:
 *                 type: string
 *                 enum: [SmileID]
 *                 description: Verification provider
 *                 example: "SmileID"
 *     responses:
 *       200:
 *         description: Individual verification result saved successfully
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
 *                   example: "Individual SmileID verification result saved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Individual SmileID verification result saved successfully"
 *                     verification:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: "individual"
 *                         provider:
 *                           type: string
 *                           example: "SmileID"
 *                         result:
 *                           type: object
 *                           description: SmileID verification result
 *                         verifiedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00.000Z"
 *                         status:
 *                           type: string
 *                           enum: [verified, failed]
 *                           example: "verified"
 *                     actuallySuccessful:
 *                       type: boolean
 *                       description: Whether verification was actually successful
 *                       example: true
 *                 pagination:
 *                   type: null
 *                   example: null
 *       422:
 *         description: Unprocessable Entity - Validation failed
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
 *                         example: "smileIdResult"
 *                       message:
 *                         type: string
 *                         example: "SmileID result is required"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Seller not found
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
 *                   example: "Failed to save individual SmileID verification result"
 *                 errors:
 *                   type: null
 *                   example: null
 */

// Save individual SmileID verification result route
router.post('/verification/smileid/individual', verifyToken, sellerController.saveIndividualSmileIdVerification);

/**
 * @swagger
 * /api/v2/sellers/verification/smileid/business:
 *   post:
 *     tags: [Seller V2]
 *     summary: Save business SmileID verification result
 *     description: |
 *       Saves the result of business SmileID verification to the seller's record.
 *       
 *       **Business Verification Processing:**
 *       - Validates SmileID verification result data
 *       - Analyzes verification success based on images and result codes
 *       - Updates seller verification status and documents
 *       - Tracks verification completion with analytics
 *       - Sends confirmation email to seller
 *       
 *       **Success Criteria:**
 *       - Must have images in the result
 *       - Must have successful result codes (1012, 1020, 1021) or success flag
 *       - Only marks as verified if both criteria are met
 *       
 *       **Security Features:**
 *       - Requires valid authentication token
 *       - Validates all required fields
 *       - Ensures data integrity and consistency
 *       - Provider validation for security
 *       
 *       **Response Structure:**
 *       - Returns verification result with success status
 *       - Includes verification details and actual success indicator
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - smileIdResult
 *               - accountType
 *               - verifiedAt
 *               - verificationProvider
 *             properties:
 *               smileIdResult:
 *                 type: object
 *                 description: SmileID verification result object
 *                 properties:
 *                   ResultCode:
 *                     type: string
 *                     description: SmileID result code
 *                     example: "1012"
 *                   success:
 *                     type: boolean
 *                     description: API success status
 *                     example: true
 *                   images:
 *                     type: array
 *                     description: Processed images
 *                     items:
 *                       type: string
 *               accountType:
 *                 type: string
 *                 enum: [business]
 *                 description: Account type for verification
 *                 example: "business"
 *               verifiedAt:
 *                 type: string
 *                 format: date-time
 *                 description: Verification completion timestamp
 *                 example: "2024-01-15T10:30:00.000Z"
 *               verificationProvider:
 *                 type: string
 *                 enum: [SmileID]
 *                 description: Verification provider
 *                 example: "SmileID"
 *     responses:
 *       200:
 *         description: Business verification result saved successfully
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
 *                   example: "Business SmileID verification result saved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Business SmileID verification result saved successfully"
 *                     verification:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: "business"
 *                         provider:
 *                           type: string
 *                           example: "SmileID"
 *                         result:
 *                           type: object
 *                           description: SmileID verification result
 *                         verifiedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00.000Z"
 *                         status:
 *                           type: string
 *                           enum: [verified, failed]
 *                           example: "verified"
 *                     actuallySuccessful:
 *                       type: boolean
 *                       description: Whether verification was actually successful
 *                       example: true
 *                 pagination:
 *                   type: null
 *                   example: null
 *       422:
 *         description: Unprocessable Entity - Validation failed
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
 *                         example: "smileIdResult"
 *                       message:
 *                         type: string
 *                         example: "SmileID result is required"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Seller not found
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
 *                   example: "Failed to save business SmileID verification result"
 *                 errors:
 *                   type: null
 *                   example: null
 */

// Save business SmileID verification result route
router.post('/verification/smileid/business', verifyToken, sellerController.saveBusinessSmileIdVerification);

/**
 * @swagger
 * /api/v2/sellers/verification/smileid/callback:
 *   post:
 *     tags: [Seller V2]
 *     summary: Handle SmileID verification callback
 *     description: |
 *       Processes webhook callbacks from SmileID verification service.
 *       
 *       **Callback Processing:**
 *       - Validates callback data structure
 *       - Extracts verification result information
 *       - Determines verification success based on images and result codes
 *       - Updates seller verification status and documents
 *       - Tracks verification completion with analytics
 *       - Sends confirmation email to seller
 *       
 *       **Success Criteria:**
 *       - Must have images in the result
 *       - Must have successful result codes (1012, 1020, 1021) or success flag
 *       - Only marks as verified if both criteria are met
 *       
 *       **Security Features:**
 *       - Validates all required fields
 *       - Ensures data integrity and consistency
 *       - Validates partner parameters for security
 *       - Ensures proper verification result structure
 *       
 *       **Response Structure:**
 *       - Returns callback processing result with assessment details
 *       - Includes job ID and processing status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - job_id
 *               - partner_params
 *             properties:
 *               job_id:
 *                 type: string
 *                 description: SmileID job identifier
 *                 example: "job_123456789"
 *               user_id:
 *                 type: string
 *                 description: User identifier
 *                 example: "user_123456789"
 *               partner_params:
 *                 type: object
 *                 description: Partner-specific parameters
 *                 properties:
 *                   seller_id:
 *                     type: string
 *                     description: Seller ID
 *                     example: "507f1f77bcf86cd799439011"
 *                   account_type:
 *                     type: string
 *                     enum: [business, individual]
 *                     description: Account type for verification
 *                     example: "business"
 *               ResultCode:
 *                 type: string
 *                 description: SmileID result code
 *                 example: "1012"
 *               result_code:
 *                 type: string
 *                 description: Alternative result code field
 *                 example: "1012"
 *               ResultText:
 *                 type: string
 *                 description: SmileID result text
 *                 example: "Success"
 *               result_text:
 *                 type: string
 *                 description: Alternative result text field
 *                 example: "Success"
 *               job_complete:
 *                 type: boolean
 *                 description: Job completion status
 *                 example: true
 *               success:
 *                 type: boolean
 *                 description: API success status
 *                 example: true
 *               Images:
 *                 type: array
 *                 description: Processed images
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 description: Alternative images field
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Callback processed successfully
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
 *                   example: "Callback received successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Callback received successfully"
 *                     job_id:
 *                       type: string
 *                       example: "job_123456789"
 *                     processed:
 *                       type: boolean
 *                       example: true
 *                     assessment:
 *                       type: object
 *                       properties:
 *                         hasImages:
 *                           type: boolean
 *                           example: true
 *                         resultCode:
 *                           type: string
 *                           example: "1012"
 *                         isSuccessful:
 *                           type: boolean
 *                           example: true
 *                 pagination:
 *                   type: null
 *                   example: null
 *       422:
 *         description: Unprocessable Entity - Validation failed
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
 *                         example: "job_id"
 *                       message:
 *                         type: string
 *                         example: "Verification result must include either: (1) Images array with at least one image, OR (2) job_complete: true/false, OR (3) success: true/false. Currently missing all three."
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
 *                   example: "Error processing callback"
 *                 errors:
 *                   type: null
 *                   example: null
 */

// Handle SmileID verification callback route
router.post('/verification/smileid/callback', sellerController.smileIdCallback);

/**
 * @swagger
 * /api/v2/sellers/business-details:
 *   put:
 *     summary: Add business details to seller profile
 *     description: |
 *       This endpoint allows sellers to add or update their business details including
 *       business name, business type, and tax information. The endpoint validates
 *       all required fields and updates the seller's profile with the provided information.
 *       
 *       **Business Logic:**
 *       - Validates all required fields (businessName, businessType, taxInformation)
 *       - Updates seller business profile information
 *       - Maintains completion status flags for business address and verification documents
 *       - Ensures data integrity and consistency
 *       
 *       **Security:**
 *       - Requires valid authentication token
 *       - Validates seller ownership of the account
 *       - Ensures data sanitization and validation
 *     tags: [Seller V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - businessType
 *               - taxInformation
 *             properties:
 *               businessName:
 *                 type: string
 *                 description: The name of the business
 *                 example: "Tech Solutions Ltd"
 *                 maxLength: 200
 *               businessType:
 *                 type: string
 *                 description: The type of business (e.g., "LLC", "Corporation", "Sole Proprietorship")
 *                 example: "LLC"
 *                 maxLength: 100
 *               taxInformation:
 *                 type: string
 *                 description: Tax identification information for the business
 *                 example: "Tax ID: 123456789"
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Business details added successfully
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
 *                   example: "Business details added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Business details added successfully"
 *                     seller:
 *                       type: object
 *                       description: Updated seller object with business details
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         businessName:
 *                           type: string
 *                           example: "Tech Solutions Ltd"
 *                         businessType:
 *                           type: string
 *                           example: "LLC"
 *                         taxInformation:
 *                           type: string
 *                           example: "Tax ID: 123456789"
 *                         hasFilledBusinessAddress:
 *                           type: boolean
 *                           example: true
 *                         hasFilledVerificationDocuments:
 *                           type: boolean
 *                           example: false
 *                 pagination:
 *                   type: null
 *                   example: null
 *       422:
 *         description: Validation failed - Invalid or missing required fields
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
 *                         example: "businessName"
 *                       message:
 *                         type: string
 *                         example: "Business name is required"
 *                 data:
 *                   type: null
 *                   example: null
 *                 pagination:
 *                   type: null
 *                   example: null
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
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
 *                   example: "Unauthorized"
 *       404:
 *         description: Seller not found
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
 *                   example: "Seller not found"
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
 *                   example: "Internal server error"
 */

// Add business details route - using same middleware as original route
router.put('/business-details', verifyToken, sellerController.addBusinessDetails);

/**
 * @swagger
 * /api/v2/sellers/business-information:
 *   put:
 *     summary: Add business information to seller profile
 *     description: |
 *       This endpoint allows sellers to add or update their business contact and address information
 *       including business email, business phone number, and business address details. The endpoint
 *       validates all required fields and updates the seller's profile with the provided information.
 *       
 *       **Business Logic:**
 *       - Validates all required fields (businessEmail, businessNumber, businessAddress)
 *       - Updates seller business contact and address information
 *       - Maintains completion status flags for business address
 *       - Ensures data integrity and consistency
 *       
 *       **Security:**
 *       - Requires valid authentication token
 *       - Validates seller ownership of the account
 *       - Ensures data sanitization and validation
 *     tags: [Seller V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessEmail
 *               - businessNumber
 *               - businessAddress
 *             properties:
 *               businessEmail:
 *                 type: string
 *                 format: email
 *                 description: The business email address
 *                 example: "business@techsolutions.com"
 *                 maxLength: 255
 *               businessNumber:
 *                 type: string
 *                 description: The business phone number
 *                 example: "+2348012345678"
 *                 maxLength: 20
 *               businessAddress:
 *                 type: object
 *                 description: The business address details
 *                 required:
 *                   - country
 *                   - state
 *                   - city
 *                   - addressLine1
 *                   - zipCode
 *                 properties:
 *                   country:
 *                     type: string
 *                     description: The country
 *                     example: "Nigeria"
 *                     maxLength: 100
 *                   state:
 *                     type: string
 *                     description: The state or province
 *                     example: "Lagos"
 *                     maxLength: 100
 *                   city:
 *                     type: string
 *                     description: The city
 *                     example: "Lagos"
 *                     maxLength: 100
 *                   addressLine1:
 *                     type: string
 *                     description: The primary address line
 *                     example: "123 Business Street"
 *                     maxLength: 200
 *                   addressLine2:
 *                     type: string
 *                     description: The secondary address line (optional)
 *                     example: "Suite 100"
 *                     maxLength: 200
 *                   zipCode:
 *                     type: string
 *                     description: The postal or zip code
 *                     example: "100001"
 *                     maxLength: 20
 *     responses:
 *       200:
 *         description: Business information added successfully
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
 *                   example: "Business information added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Business information added successfully"
 *                     seller:
 *                       type: object
 *                       description: Updated seller object with business information
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         businessEmail:
 *                           type: string
 *                           example: "business@techsolutions.com"
 *                         businessNumber:
 *                           type: string
 *                           example: "+2348012345678"
 *                         businessAddress:
 *                           type: object
 *                           properties:
 *                             country:
 *                               type: string
 *                               example: "Nigeria"
 *                             state:
 *                               type: string
 *                               example: "Lagos"
 *                             city:
 *                               type: string
 *                               example: "Lagos"
 *                             addressLine1:
 *                               type: string
 *                               example: "123 Business Street"
 *                             addressLine2:
 *                               type: string
 *                               example: "Suite 100"
 *                             zipCode:
 *                               type: string
 *                               example: "100001"
 *                         hasFilledBusinessAddress:
 *                           type: boolean
 *                           example: true
 *                 pagination:
 *                   type: null
 *                   example: null
 *       422:
 *         description: Validation failed - Invalid or missing required fields
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
 *                         example: "businessEmail"
 *                       message:
 *                         type: string
 *                         example: "Business email is required"
 *                 data:
 *                   type: null
 *                   example: null
 *                 pagination:
 *                   type: null
 *                   example: null
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
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
 *                   example: "Unauthorized"
 *       404:
 *         description: Seller not found
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
 *                   example: "Seller not found"
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
 *                   example: "Internal server error"
 */

// Add business information route - using same middleware as original route
router.put('/business-information', verifyToken, sellerController.addBusinessInformation);

/**
 * @swagger
 * /api/v2/sellers/shipping-warehouse:
 *   put:
 *     summary: Add shipping and warehouse information to seller profile
 *     description: |
 *       This endpoint allows sellers to add or update their shipping options and warehouse details
 *       including shipping methods, return policies, and warehouse address information. The endpoint
 *       validates all provided fields and updates the seller's profile with the provided information.
 *       
 *       **Business Logic:**
 *       - Validates all provided fields (shippingOptions, warehouseDetails)
 *       - Updates seller shipping options and warehouse details information
 *       - Maintains completion status flags for warehouse address
 *       - Ensures data integrity and consistency
 *       
 *       **Security:**
 *       - Requires valid authentication token
 *       - Validates seller ownership of the account
 *       - Ensures data sanitization and validation
 *     tags: [Seller V2]
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
 *                 description: The shipping options details
 *                 properties:
 *                   shippingMethod:
 *                     type: string
 *                     description: The shipping method
 *                     example: "Standard Shipping"
 *                     maxLength: 200
 *                   returnsAndExchangePolicy:
 *                     type: string
 *                     description: The returns and exchange policy
 *                     example: "30-day return policy"
 *                     maxLength: 500
 *               warehouseDetails:
 *                 type: object
 *                 description: The warehouse details
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: The warehouse name
 *                     example: "Main Warehouse"
 *                     maxLength: 200
 *                   contactNumber:
 *                     type: string
 *                     description: The warehouse contact number
 *                     example: "+2348012345678"
 *                     maxLength: 20
 *                   address:
 *                     type: object
 *                     description: The warehouse address details
 *                     properties:
 *                       country:
 *                         type: string
 *                         description: The country
 *                         example: "Nigeria"
 *                         maxLength: 100
 *                       state:
 *                         type: string
 *                         description: The state or province
 *                         example: "Lagos"
 *                         maxLength: 100
 *                       city:
 *                         type: string
 *                         description: The city
 *                         example: "Lagos"
 *                         maxLength: 100
 *                       addressLine1:
 *                         type: string
 *                         description: The primary address line
 *                         example: "123 Warehouse Street"
 *                         maxLength: 200
 *                       addressLine2:
 *                         type: string
 *                         description: The secondary address line (optional)
 *                         example: "Building A"
 *                         maxLength: 200
 *                       zipCode:
 *                         type: string
 *                         description: The postal or zip code
 *                         example: "100001"
 *                         maxLength: 20
 *     responses:
 *       200:
 *         description: Shipping and warehouse information added successfully
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
 *                   example: "Shipping and warehouse information added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Shipping and warehouse information added successfully"
 *                     seller:
 *                       type: object
 *                       description: Updated seller object with shipping and warehouse information
 *                       properties:
 *                         shippingOptions:
 *                           type: object
 *                           properties:
 *                             shippingMethod:
 *                               type: string
 *                               example: "Standard Shipping"
 *                             returnsAndExchangePolicy:
 *                               type: string
 *                               example: "30-day return policy"
 *                         warehouseDetails:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "Main Warehouse"
 *                             contactNumber:
 *                               type: string
 *                               example: "+2348012345678"
 *                             address:
 *                               type: object
 *                               properties:
 *                                 country:
 *                                   type: string
 *                                   example: "Nigeria"
 *                                 state:
 *                                   type: string
 *                                   example: "Lagos"
 *                                 city:
 *                                   type: string
 *                                   example: "Lagos"
 *                                 addressLine1:
 *                                   type: string
 *                                   example: "123 Warehouse Street"
 *                                 addressLine2:
 *                                   type: string
 *                                   example: "Building A"
 *                                 zipCode:
 *                                   type: string
 *                                   example: "100001"
 *                 pagination:
 *                   type: null
 *                   example: null
 *       422:
 *         description: Validation failed - Invalid or missing required fields
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
 *                         example: "shippingOptions.shippingMethod"
 *                       message:
 *                         type: string
 *                         example: "Shipping method must be a string"
 *                 data:
 *                   type: null
 *                   example: null
 *                 pagination:
 *                   type: null
 *                   example: null
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
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
 *                   example: "Unauthorized"
 *       404:
 *         description: Seller not found
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
 *                   example: "Seller not found"
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
 *                   example: "Internal server error"
 */

// Add shipping and warehouse information route - using same middleware as original route
router.put('/shipping-warehouse', verifyToken, sellerController.addShippingWarehouse);

/**
 * @swagger
 * /api/v2/sellers/profile/avatar:
 *   post:
 *     summary: Upload store avatar to seller profile
 *     description: |
 *       This endpoint allows sellers to upload a new store avatar image. The endpoint
 *       validates the uploaded file, uploads it to AWS S3 cloud storage, and updates
 *       the seller's profile with the new avatar information.
 *       
 *       **Business Logic:**
 *       - Validates uploaded file for security and format requirements
 *       - Uploads file to AWS S3 cloud storage with unique filename
 *       - Updates seller profile with new avatar URL and metadata
 *       - Deletes previous avatar from S3 storage to prevent bloat
 *       - Ensures data integrity and security standards
 *       
 *       **Security:**
 *       - Requires valid authentication token
 *       - Validates file type (JPEG, PNG, GIF, WebP only)
 *       - Validates file size (max 10MB)
 *       - Generates unique filenames to prevent conflicts
 *       - Validates seller ownership of the account
 *     tags: [Seller V2]
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
 *                 description: The store avatar image file
 *                 maxLength: 10485760
 *             required:
 *               - avatar
 *     responses:
 *       200:
 *         description: Store avatar uploaded successfully
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
 *                   example: "Store avatar uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Store avatar uploaded successfully"
 *                     seller:
 *                       type: object
 *                       description: Updated seller object with new avatar information
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         storeAvatar:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                               example: "https://cdn.example.com/uuid-avatar.jpg"
 *                             public_id:
 *                               type: string
 *                               example: "uuid-avatar.jpg"
 *                 pagination:
 *                   type: null
 *                   example: null
 *       400:
 *         description: Bad request - No avatar file uploaded or invalid file
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
 *                   example: "Avatar file is required"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "avatar"
 *                       message:
 *                         type: string
 *                         example: "Avatar file is required"
 *                 data:
 *                   type: null
 *                   example: null
 *                 pagination:
 *                   type: null
 *                   example: null
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
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
 *                   example: "Unauthorized"
 *       404:
 *         description: Seller not found
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
 *                   example: "Seller not found"
 *       413:
 *         description: Payload too large - File size exceeds 10MB limit
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
 *                   example: "File size cannot exceed 10MB"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "file.size"
 *                       message:
 *                         type: string
 *                         example: "File size cannot exceed 10MB"
 *                 data:
 *                   type: null
 *                   example: null
 *                 pagination:
 *                   type: null
 *                   example: null
 *       415:
 *         description: Unsupported media type - Invalid file format
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
 *                   example: "File must be a valid image format (JPEG, PNG, GIF, WebP)"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "file.mimetype"
 *                       message:
 *                         type: string
 *                         example: "File must be a valid image format (JPEG, PNG, GIF, WebP)"
 *                 data:
 *                   type: null
 *                   example: null
 *                 pagination:
 *                   type: null
 *                   example: null
 *       422:
 *         description: Validation failed - Invalid file data or format
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
 *                         example: "file.buffer"
 *                       message:
 *                         type: string
 *                         example: "File buffer must be a valid Buffer object"
 *                 data:
 *                   type: null
 *                   example: null
 *                 pagination:
 *                   type: null
 *                   example: null
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
 *                   example: "Internal server error"
 */

// Upload store avatar route - using same middleware as original route
router.post('/profile/avatar', verifyToken, upload.single('avatar'), sellerController.uploadStoreAvatar);

/**
 * @swagger
 * /api/v2/sellers/profile/banner:
 *   post:
 *     summary: Upload store banner to seller profile
 *     description: |
 *       This endpoint allows sellers to upload a new store banner image. The endpoint
 *       validates the uploaded file, uploads it to AWS S3 cloud storage, and updates
 *       the seller's profile with the new banner information.
 *       
 *       **Business Logic:**
 *       - Validates uploaded file for security and format requirements
 *       - Uploads file to AWS S3 cloud storage with unique filename
 *       - Updates seller profile with new banner URL and metadata
 *       - Deletes previous banner from S3 storage to prevent bloat
 *       - Ensures data integrity and security standards
 *       
 *       **Security:**
 *       - Requires valid authentication token
 *       - Validates file type (JPEG, PNG, GIF, WebP only)
 *       - Validates file size (max 10MB)
 *       - Generates unique filenames to prevent conflicts
 *       - Validates seller ownership of the account
 *     tags: [Seller V2]
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
 *                 description: The store banner image file
 *                 maxLength: 10485760
 *             required:
 *               - banner
 *     responses:
 *       200:
 *         description: Store banner uploaded successfully
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
 *                   example: "Store banner uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Store banner uploaded successfully"
 *                     seller:
 *                       type: object
 *                       description: Updated seller object with new banner information
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         storeBanner:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                               example: "https://cdn.example.com/uuid-banner.jpg"
 *                             public_id:
 *                               type: string
 *                               example: "uuid-banner.jpg"
 *                 pagination:
 *                   type: null
 *                   example: null
 *       400:
 *         description: Bad request - No banner file uploaded or invalid file
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
 *                   example: "Banner file is required"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "banner"
 *                       message:
 *                         type: string
 *                         example: "Banner file is required"
 *                 data:
 *                   type: null
 *                   example: null
 *                 pagination:
 *                   type: null
 *                   example: null
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
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
 *                   example: "Unauthorized"
 *       404:
 *         description: Seller not found
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
 *                   example: "Seller not found"
 *       413:
 *         description: Payload too large - File size exceeds 10MB limit
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
 *                   example: "File size cannot exceed 10MB"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "file.size"
 *                       message:
 *                         type: string
 *                         example: "File size cannot exceed 10MB"
 *                 data:
 *                   type: null
 *                   example: null
 *                 pagination:
 *                   type: null
 *                   example: null
 *       415:
 *         description: Unsupported media type - Invalid file format
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
 *                   example: "File must be a valid image format (JPEG, PNG, GIF, WebP)"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "file.mimetype"
 *                       message:
 *                         type: string
 *                         example: "File must be a valid image format (JPEG, PNG, GIF, WebP)"
 *                 data:
 *                   type: null
 *                   example: null
 *                 pagination:
 *                   type: null
 *                   example: null
 *       422:
 *         description: Validation failed - Invalid file data or format
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
 *                         example: "file.buffer"
 *                       message:
 *                         type: string
 *                         example: "File buffer must be a valid Buffer object"
 *                 data:
 *                   type: null
 *                   example: null
 *                 pagination:
 *                   type: null
 *                   example: null
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
 *                   example: "Internal server error"
 */
// Upload store banner route - using same middleware as original route
router.post('/profile/banner', verifyToken, upload.single('banner'), sellerController.uploadStoreBanner);

/**
 * @swagger
 * /api/v2/sellers/top-products:
 *   get:
 *     summary: Get seller's top performing products by sales volume
 *     description: |
 *       Retrieves the top 4 best-selling products for the authenticated seller, ranked by total quantity sold.
 *       This endpoint provides valuable insights into which products are performing best in terms of sales volume and revenue.
 *       
 *       **Key Features:**
 *       - Returns top 4 products sorted by quantity sold (descending)
 *       - Includes total quantity sold and total revenue for each product
 *       - Provides complete product details including images, category, and brand
 *       - Uses MongoDB aggregation for efficient data processing
 *       - Only includes products that have been sold (have order history)
 *       
 *       **Use Cases:**
 *       - Dashboard analytics for sellers
 *       - Product performance analysis
 *       - Inventory management insights
 *       - Marketing campaign planning
 *       
 *       **Data Source:**
 *       - Analyzes completed orders from the Order collection
 *       - Aggregates sales data across all time periods
 *       - Excludes cancelled or pending orders
 *     tags: [Seller V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         description: Bearer token for seller authentication
 *         schema:
 *           type: string
 *           example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: |
 *           Successfully retrieved the seller's top performing products. Returns an array of up to 4 products
 *           sorted by total quantity sold, with comprehensive sales analytics and product details.
 *           
 *           **Response Structure:**
 *           - `success`: Boolean indicating request success
 *           - `message`: Human-readable success message
 *           - `data.data`: Array of top products with sales metrics
 *           - `pagination`: Always null for this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - message
 *                 - data
 *                 - pagination
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the request was successful
 *                   example: true
 *                 message:
 *                   type: string
 *                   description: Success message describing the operation
 *                   example: "Top products retrieved successfully"
 *                 data:
 *                   type: object
 *                   description: Container object for the response data
 *                   required:
 *                     - data
 *                   properties:
 *                     data:
 *                       type: array
 *                       description: |
 *                         Array of top performing products, sorted by total quantity sold (descending).
 *                         Maximum of 4 products will be returned. Empty array if no products have been sold.
 *                       maxItems: 4
 *                       items:
 *                         type: object
 *                         required:
 *                           - _id
 *                           - totalQuantity
 *                           - totalRevenue
 *                           - productDetails
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Unique identifier of the product
 *                             example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                             pattern: "^[0-9a-fA-F]{24}$"
 *                           totalQuantity:
 *                             type: number
 *                             description: |
 *                               Total quantity of this product sold across all orders.
 *                               This is the sum of all quantities from completed orders.
 *                             minimum: 0
 *                             example: 25
 *                           totalRevenue:
 *                             type: number
 *                             description: |
 *                               Total revenue generated from sales of this product.
 *                               Calculated as sum of (price × quantity) for all sold units.
 *                             minimum: 0
 *                             example: 1250.00
 *                           productDetails:
 *                             type: object
 *                             description: Complete product information from the Product collection
 *                             required:
 *                               - _id
 *                               - name
 *                               - price
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: Product's unique identifier
 *                                 example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                                 pattern: "^[0-9a-fA-F]{24}$"
 *                               name:
 *                                 type: string
 *                                 description: Product name as displayed to customers
 *                                 example: "Premium Wireless Headphones"
 *                                 minLength: 1
 *                                 maxLength: 200
 *                               description:
 *                                 type: string
 *                                 description: Detailed product description
 *                                 example: "High-quality wireless headphones with noise cancellation"
 *                               price:
 *                                 type: number
 *                                 description: Current selling price of the product
 *                                 minimum: 0
 *                                 example: 50.00
 *                               images:
 *                                 type: array
 *                                 description: Array of product images
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     url:
 *                                       type: string
 *                                       description: URL of the product image
 *                                       example: "https://cdn.example.com/products/headphones-main.jpg"
 *                                       format: uri
 *                                     alt:
 *                                       type: string
 *                                       description: Alternative text for the image
 *                                       example: "Premium Wireless Headphones - Front View"
 *                               category:
 *                                 type: string
 *                                 description: Product category for organization and filtering
 *                                 example: "Electronics"
 *                               subCategory:
 *                                 type: string
 *                                 description: More specific product subcategory
 *                                 example: "Audio & Headphones"
 *                               brand:
 *                                 type: string
 *                                 description: Product brand or manufacturer
 *                                 example: "TechBrand"
 *                               stock:
 *                                 type: number
 *                                 description: Current available stock quantity
 *                                 minimum: 0
 *                                 example: 150
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                                 description: When the product was first created
 *                                 example: "2023-01-15T10:30:00.000Z"
 *                               updatedAt:
 *                                 type: string
 *                                 format: date-time
 *                                 description: When the product was last updated
 *                                 example: "2023-12-01T14:22:00.000Z"
 *                 pagination:
 *                   type: null
 *                   description: Pagination information (always null for this endpoint)
 *                   example: null
 *         examples:
 *           success_with_products:
 *             summary: Successful response with top products
 *             value:
 *               success: true
 *               message: "Top products retrieved successfully"
 *               data:
 *                 data:
 *                   - _id: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     totalQuantity: 25
 *                     totalRevenue: 1250.00
 *                     productDetails:
 *                       _id: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                       name: "Premium Wireless Headphones"
 *                       description: "High-quality wireless headphones with noise cancellation"
 *                       price: 50.00
 *                       images:
 *                         - url: "https://cdn.example.com/products/headphones-main.jpg"
 *                           alt: "Premium Wireless Headphones - Front View"
 *                       category: "Electronics"
 *                       subCategory: "Audio & Headphones"
 *                       brand: "TechBrand"
 *                       stock: 150
 *                       createdAt: "2023-01-15T10:30:00.000Z"
 *                       updatedAt: "2023-12-01T14:22:00.000Z"
 *                   - _id: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                     totalQuantity: 18
 *                     totalRevenue: 900.00
 *                     productDetails:
 *                       _id: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                       name: "Wireless Gaming Mouse"
 *                       description: "Ergonomic wireless mouse designed for gaming"
 *                       price: 25.00
 *                       images:
 *                         - url: "https://cdn.example.com/products/mouse-main.jpg"
 *                           alt: "Wireless Gaming Mouse"
 *                       category: "Electronics"
 *                       subCategory: "Computer Accessories"
 *                       brand: "GameTech"
 *                       stock: 75
 *                       createdAt: "2023-02-20T09:15:00.000Z"
 *                       updatedAt: "2023-11-28T16:45:00.000Z"
 *               pagination: null
 *           success_empty:
 *             summary: Successful response with no products
 *             value:
 *               success: true
 *               message: "Top products retrieved successfully"
 *               data:
 *                 data: []
 *               pagination: null
 *       422:
 *         description: |
 *           Unprocessable Entity - The request was well-formed but contains validation errors.
 *           This occurs when the seller ID validation fails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - message
 *                 - errors
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   description: Array of validation error objects
 *                   items:
 *                     type: object
 *                     required:
 *                       - field
 *                       - message
 *                     properties:
 *                       field:
 *                         type: string
 *                         description: The field that failed validation
 *                         example: "sellerId"
 *                       message:
 *                         type: string
 *                         description: Specific validation error message
 *                         example: "Valid seller ID is required"
 *         examples:
 *           invalid_seller_id:
 *             summary: Invalid seller ID format
 *             value:
 *               success: false
 *               message: "Validation failed"
 *               errors:
 *                 - field: "sellerId"
 *                   message: "Seller ID must be a valid ObjectId format"
 *           missing_seller_id:
 *             summary: Missing or empty seller ID
 *             value:
 *               success: false
 *               message: "Validation failed"
 *               errors:
 *                 - field: "sellerId"
 *                   message: "Valid seller ID is required"
 *       401:
 *         description: |
 *           Unauthorized - Authentication failed. This occurs when:
 *           - No authorization token is provided
 *           - The token is invalid or expired
 *           - The token format is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - message
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Unauthorized - Invalid or missing token"
 *         examples:
 *           no_token:
 *             summary: No authorization token provided
 *             value:
 *               success: false
 *               message: "Unauthorized - No token provided"
 *           invalid_token:
 *             summary: Invalid or expired token
 *             value:
 *               success: false
 *               message: "Unauthorized - Invalid or expired token"
 *       500:
 *         description: |
 *           Internal Server Error - An unexpected error occurred on the server.
 *           This could be due to:
 *           - Database connection issues
 *           - Aggregation pipeline failures
 *           - Server configuration problems
 *           
 *           **Note:** In case of server errors, please retry the request or contact support.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - message
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error - Unable to retrieve top products"
 *         examples:
 *           database_error:
 *             summary: Database connection error
 *             value:
 *               success: false
 *               message: "Internal server error - Database connection failed"
 *           aggregation_error:
 *             summary: Aggregation pipeline error
 *             value:
 *               success: false
 *               message: "Internal server error - Unable to process product data"
 */
// Get top products route - using same middleware as original route
router.get('/top-products', verifyToken, sellerController.getTopProducts);

/**
 * @swagger
 * /api/v2/sellers/statistics:
 *   get:
 *     summary: Get comprehensive seller statistics and analytics
 *     description: |
 *       Retrieves detailed seller performance metrics including wallet balance, store visits, 
 *       order counts, conversion rates, and customer acquisition data with week-over-week comparisons.
 *       
 *       This endpoint provides comprehensive analytics to help sellers understand their business performance:
 *       - **Wallet Balance**: Current balance with week-over-week change
 *       - **Store Visits**: Total visits with trend analysis
 *       - **Total Orders**: Order count with growth metrics
 *       - **Conversion Rate**: Visit-to-order conversion percentage
 *       - **New Customers**: Customer acquisition with growth tracking
 *       
 *       All metrics include percentage changes compared to the previous week, providing
 *       actionable insights for business optimization and growth tracking.
 *       
 *       **Data Sources:**
 *       - Seller profile data (wallet, visits, followers)
 *       - Order aggregation (excluding stale orders)
 *       - Customer relationship analysis
 *       - Week-over-week comparison calculations
 *       
 *       **Use Cases:**
 *       - Dashboard analytics display
 *       - Performance monitoring
 *       - Business growth tracking
 *       - Customer acquisition analysis
 *       - Revenue trend monitoring
 *     tags: [Seller V2]
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
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     walletBalance:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                           description: Current wallet balance in NGN
 *                           example: 15000.50
 *                         currency:
 *                           type: string
 *                           description: Currency code
 *                           example: "NGN"
 *                         change:
 *                           type: object
 *                           properties:
 *                             value:
 *                               type: string
 *                               description: Change value (percentage or number)
 *                               example: "12.50"
 *                             type:
 *                               type: string
 *                               enum: [percentage, number]
 *                               description: Type of change metric
 *                               example: "percentage"
 *                     storeVisits:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: number
 *                           description: Total store visits
 *                           example: 1250
 *                         change:
 *                           type: object
 *                           properties:
 *                             value:
 *                               type: string
 *                               example: "8.75"
 *                             type:
 *                               type: string
 *                               example: "percentage"
 *                     totalOrders:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: number
 *                           description: Total orders placed
 *                           example: 89
 *                         change:
 *                           type: object
 *                           properties:
 *                             value:
 *                               type: string
 *                               example: "15.25"
 *                             type:
 *                               type: string
 *                               example: "percentage"
 *                     conversionRate:
 *                       type: object
 *                       properties:
 *                         percentage:
 *                           type: string
 *                           description: Conversion rate as percentage
 *                           example: "7.12"
 *                         change:
 *                           type: object
 *                           properties:
 *                             value:
 *                               type: string
 *                               example: "2.30"
 *                             type:
 *                               type: string
 *                               example: "percentage"
 *                     newCustomers:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: number
 *                           description: Total customers (followers with orders)
 *                           example: 45
 *                         change:
 *                           type: object
 *                           properties:
 *                             value:
 *                               type: string
 *                               example: "5.80"
 *                             type:
 *                               type: string
 *                               example: "percentage"
 *             examples:
 *               success_with_data:
 *                 summary: Successful statistics retrieval
 *                 value:
 *                   success: true
 *                   message: "Statistics retrieved successfully"
 *                   data:
 *                     walletBalance:
 *                       amount: 15000.50
 *                       currency: "NGN"
 *                       change:
 *                         value: "12.50"
 *                         type: "percentage"
 *                     storeVisits:
 *                       count: 1250
 *                       change:
 *                         value: "8.75"
 *                         type: "percentage"
 *                     totalOrders:
 *                       count: 89
 *                       change:
 *                         value: "15.25"
 *                         type: "percentage"
 *                     conversionRate:
 *                       percentage: "7.12"
 *                       change:
 *                         value: "2.30"
 *                         type: "percentage"
 *                     newCustomers:
 *                       count: 45
 *                       change:
 *                         value: "5.80"
 *                         type: "percentage"
 *               success_zero_values:
 *                 summary: Statistics with zero values
 *                 value:
 *                   success: true
 *                   message: "Statistics retrieved successfully"
 *                   data:
 *                     walletBalance:
 *                       amount: 0
 *                       currency: "NGN"
 *                       change:
 *                         value: "0.00"
 *                         type: "number"
 *                     storeVisits:
 *                       count: 0
 *                       change:
 *                         value: "0.00"
 *                         type: "number"
 *                     totalOrders:
 *                       count: 0
 *                       change:
 *                         value: "0.00"
 *                         type: "number"
 *                     conversionRate:
 *                       percentage: "0.00"
 *                       change:
 *                         value: "0.00"
 *                         type: "number"
 *                     newCustomers:
 *                       count: 0
 *                       change:
 *                         value: "0.00"
 *                         type: "number"
 *       422:
 *         description: Validation error - Invalid seller ID
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
 *                         example: "sellerId"
 *                       message:
 *                         type: string
 *                         example: "Valid seller ID is required"
 *             examples:
 *               invalid_seller_id:
 *                 summary: Invalid seller ID format
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   errors:
 *                     - field: "sellerId"
 *                       message: "Valid seller ID is required"
 *               invalid_objectid:
 *                 summary: Invalid ObjectId format
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   errors:
 *                     - field: "sellerId"
 *                       message: "Seller ID must be a valid ObjectId format"
 *       404:
 *         description: Seller not found
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
 *                   example: "Seller not found"
 *             examples:
 *               seller_not_found:
 *                 summary: Seller does not exist
 *                 value:
 *                   success: false
 *                   message: "Seller not found"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
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
 *                   example: "Access denied. No token provided."
 *             examples:
 *               no_token:
 *                 summary: No authentication token provided
 *                 value:
 *                   success: false
 *                   message: "Access denied. No token provided."
 *               invalid_token:
 *                 summary: Invalid authentication token
 *                 value:
 *                   success: false
 *                   message: "Access denied. Invalid token."
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
 *                   example: "Internal server error"
 *             examples:
 *               database_error:
 *                 summary: Database connection error
 *                 value:
 *                   success: false
 *                   message: "Internal server error"
 *               aggregation_error:
 *                 summary: Statistics calculation error
 *                 value:
 *                   success: false
 *                   message: "Internal server error"
 */
// Get statistics route - using same middleware as original route
router.get('/statistics', verifyToken, sellerController.getStatistics);

/**
 * @swagger
 * /api/v2/sellers/orders:
 *   get:
 *     summary: Get seller's orders with filtering and pagination
 *     description: |
 *       Retrieves a comprehensive list of orders for the authenticated seller with advanced
 *       filtering, sorting, and pagination capabilities. This endpoint provides detailed
 *       order information including buyer details, product information, and order status.
 *       
 *       **Key Features:**
 *       - **Advanced Filtering**: Filter orders by status, date range, and other criteria
 *       - **Pagination Support**: Efficient handling of large order datasets
 *       - **Rich Data**: Populated buyer and product information for each order
 *       - **Flexible Sorting**: Orders sorted by creation date (newest first)
 *       - **Performance Optimized**: Efficient database queries with proper indexing
 *       
 *       **Filter Options:**
 *       - **Status Filter**: Filter by order item status (pending, confirmed, shipped, delivered, cancelled)
 *       - **Date Range**: Filter orders by creation date range
 *       - **Pagination**: Control page size and navigation
 *       
 *       **Use Cases:**
 *       - Order management dashboard
 *       - Order history tracking
 *       - Status-based order filtering
 *       - Date range order analysis
 *       - Bulk order operations
 *       
 *       **Data Sources:**
 *       - Order collection with seller-specific filtering
 *       - Buyer information population
 *       - Product details population
 *       - Order status and metadata
 *       
 *       **Security:**
 *       - Requires valid authentication token
 *       - Validates seller ownership of orders
 *       - Ensures data privacy and access control
 *     tags: [Seller V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *           example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         description: JWT authentication token
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, cancelled]
 *           example: "confirmed"
 *         description: Filter orders by item status
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         description: Start date for order filtering (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *         description: End date for order filtering (ISO 8601 format)
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           example: 10
 *         description: Number of orders per page (max 100)
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
 *                             description: Order ID
 *                             example: "507f1f77bcf86cd799439011"
 *                           buyer:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "507f1f77bcf86cd799439012"
 *                               firstName:
 *                                 type: string
 *                                 example: "John"
 *                               lastName:
 *                                 type: string
 *                                 example: "Doe"
 *                               email:
 *                                 type: string
 *                                 example: "john.doe@example.com"
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 product:
 *                                   type: object
 *                                   properties:
 *                                     _id:
 *                                       type: string
 *                                       example: "507f1f77bcf86cd799439013"
 *                                     name:
 *                                       type: string
 *                                       example: "Premium Headphones"
 *                                     images:
 *                                       type: array
 *                                       items:
 *                                         type: string
 *                                       example: ["https://example.com/image1.jpg"]
 *                                     price:
 *                                       type: number
 *                                       example: 299.99
 *                                 quantity:
 *                                   type: integer
 *                                   example: 2
 *                                 price:
 *                                   type: number
 *                                   example: 299.99
 *                                 status:
 *                                   type: string
 *                                   example: "confirmed"
 *                           totalAmount:
 *                             type: number
 *                             example: 599.98
 *                           status:
 *                             type: string
 *                             example: "confirmed"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00.000Z"
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalOrders:
 *                           type: integer
 *                           example: 47
 *                         hasMore:
 *                           type: boolean
 *                           example: true
 *                         hasPrevious:
 *                           type: boolean
 *                           example: false
 *             examples:
 *               success_with_orders:
 *                 summary: Orders retrieved successfully with data
 *                 value:
 *                   success: true
 *                   message: "Orders retrieved successfully"
 *                   data:
 *                     orders:
 *                       - _id: "507f1f77bcf86cd799439011"
 *                         buyer:
 *                           _id: "507f1f77bcf86cd799439012"
 *                           firstName: "John"
 *                           lastName: "Doe"
 *                           email: "john.doe@example.com"
 *                         items:
 *                           - product:
 *                               _id: "507f1f77bcf86cd799439013"
 *                               name: "Premium Headphones"
 *                               images: ["https://example.com/image1.jpg"]
 *                               price: 299.99
 *                             quantity: 2
 *                             price: 299.99
 *                             status: "confirmed"
 *                         totalAmount: 599.98
 *                         status: "confirmed"
 *                         createdAt: "2024-01-15T10:30:00.000Z"
 *                         updatedAt: "2024-01-15T10:30:00.000Z"
 *                     currentPage: 1
 *                     totalPages: 5
 *                     pagination:
 *                       currentPage: 1
 *                       totalPages: 5
 *                       totalOrders: 47
 *                       hasMore: true
 *                       hasPrevious: false
 *               success_empty_orders:
 *                 summary: No orders found
 *                 value:
 *                   success: true
 *                   message: "Orders retrieved successfully"
 *                   data:
 *                     orders: []
 *                     currentPage: 1
 *                     totalPages: 0
 *                     pagination:
 *                       currentPage: 1
 *                       totalPages: 0
 *                       totalOrders: 0
 *                       hasMore: false
 *                       hasPrevious: false
 *       422:
 *         description: Validation error - Invalid parameters
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
 *                         example: "sellerId"
 *                       message:
 *                         type: string
 *                         example: "Valid seller ID is required"
 *             examples:
 *               invalid_seller_id:
 *                 summary: Invalid seller ID format
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   errors:
 *                     - field: "sellerId"
 *                       message: "Valid seller ID is required"
 *               invalid_date_format:
 *                 summary: Invalid date format
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   errors:
 *                     - field: "startDate"
 *                       message: "Invalid date format"
 *       404:
 *         description: Seller not found
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
 *                   example: "Seller not found"
 *             examples:
 *               seller_not_found:
 *                 summary: Seller does not exist
 *                 value:
 *                   success: false
 *                   message: "Seller not found"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
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
 *                   example: "Access denied. No token provided."
 *             examples:
 *               no_token:
 *                 summary: No authentication token provided
 *                 value:
 *                   success: false
 *                   message: "Access denied. No token provided."
 *               invalid_token:
 *                 summary: Invalid authentication token
 *                 value:
 *                   success: false
 *                   message: "Access denied. Invalid token."
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
 *                   example: "Internal server error"
 *             examples:
 *               database_error:
 *                 summary: Database connection error
 *                 value:
 *                   success: false
 *                   message: "Internal server error"
 *               query_error:
 *                 summary: Order query execution error
 *                 value:
 *                   success: false
 *                   message: "Internal server error"
 */
// Get orders route - using same middleware as original route
router.get('/orders', verifyToken, sellerController.getOrders);

/**
 * @swagger
 * /api/v2/sellers/orders/{orderId}/shipping-label:
 *   get:
 *     summary: Generate shipping label for order item
 *     description: Generates a shipping label for a specific order item. This endpoint allows sellers to create shipping labels for their order items with tracking information.
 *     tags: [Seller V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order item
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Shipping label generated successfully
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
 *                   example: "Shipping label generated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       description: The order ID
 *                       example: "507f1f77bcf86cd799439011"
 *                     trackingNumber:
 *                       type: string
 *                       description: Generated tracking number
 *                       example: "TN1234567890"
 *                     labelUrl:
 *                       type: string
 *                       description: URL to access the shipping label
 *                       example: "https://shipping-label-url.com"
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
 *                   example: "Invalid shipping label request data"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Order ID is required", "Item ID is required"]
 *       422:
 *         description: Unprocessable Entity - Validation failed
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
 *                     type: string
 *                   example: ["Order ID must be a valid ObjectId", "Item ID is required"]
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
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
 *                   example: "Unauthorized access"
 *       403:
 *         description: Forbidden - Seller not authorized to access this order item
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
 *                   example: "Unauthorized to access this order item"
 *       404:
 *         description: Not found - Order or order item not found
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
 *                   example: "Order not found"
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
 *                   example: "Error generating shipping label"
 */
// Get shipping label route - using same middleware as original route
router.get('/orders/:orderId/shipping-label', verifyToken, sellerController.getShippingLabel);

module.exports = router;
