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
 *     tags:
 *       - Seller Verification
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
 *     tags:
 *       - Seller Verification
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

module.exports = router;
