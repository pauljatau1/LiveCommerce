const express = require('express');
const sellerController = require('../controllers/seller.controller');

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
 *                           example: false
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

module.exports = router;
