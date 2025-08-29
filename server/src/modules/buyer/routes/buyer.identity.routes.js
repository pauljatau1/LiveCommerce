const express = require('express');
const router = express.Router();

const { verifyToken, isBuyer } = require('../../../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/identity-verification:
 *   post:
 *     summary: Upload identity verification document
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               identityDocument:
 *                 type: string
 *                 format: binary
 *                 description: Identity document file (PDF, JPEG, PNG, GIF, DOC, DOCX)
 *                 example: "document.pdf"
 *     responses:
 *       200:
 *         description: Identity document uploaded successfully
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
 *                   example: "Identity document uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     document:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                           description: URL of the uploaded document
 *                           example: "https://cdn.example.com/verification/buyers/507f1f77bcf86cd799439011/identity-1640995200000-document.pdf"
 *                         public_id:
 *                           type: string
 *                           description: S3 key of the uploaded document
 *                           example: "verification/buyers/507f1f77bcf86cd799439011/identity-1640995200000-document.pdf"
 *                         uploadedAt:
 *                           type: string
 *                           format: date-time
 *                           description: Date when document was uploaded
 *                           example: "2025-01-27T10:30:00.000Z"
 *                         status:
 *                           type: string
 *                           description: Verification status
 *                           example: "pending"
 *       400:
 *         description: Bad Request - No file uploaded, invalid file type, or file too large
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid buyer ID format
 *       500:
 *         description: Internal server error
 */
router.post('/identity-verification', verifyToken, upload.single('identityDocument'), buyerController.uploadIdentityDocument);

/**
 * @swagger
 * /api/v2/buyers/send-phone-otp:
 *   post:
 *     summary: Send phone OTP for verification
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Phone number with country code
 *                 example: "+2348012345678"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               message:
 *                 type: string
 *                 example: "OTP sent successfully"
 *               data:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "OTP sent successfully"
 *                   validFor:
 *                     type: string
 *                     example: "10 minutes"
 *       400:
 *         description: Bad Request - Invalid phone number format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid phone number format
 *       500:
 *         description: Internal server error
 */
router.post('/send-phone-otp', verifyToken, isBuyer, buyerController.sendPhoneOTP);

/**
 * @swagger
 * /api/v2/buyers/verify-phone-otp:
 *   post:
 *     summary: Verify phone OTP for verification
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP received on phone
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Phone number verified successfully
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
 *                   example: "Phone number verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Phone number verified successfully"
 *                     phoneVerified:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Bad Request - Invalid OTP, expired OTP, or too many attempts
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid OTP format or no verification in progress
 *       500:
 *         description: Internal server error
 */
router.post('/verify-phone-otp', verifyToken, isBuyer, buyerController.verifyPhoneOTP);

module.exports = router;


