const express = require('express');
const router = express.Router();

const { verifyToken } = require('../../../middlewares/authMiddleware');
const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/request-account-deletion:
 *   post:
 *     summary: Request account deletion
 *     description: Request account deletion by sending a verification code to the buyer's email
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deletion verification code sent successfully
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
 *                   example: "Account deletion request submitted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Account deletion verification code sent to your email"
 *                     validFor:
 *                       type: string
 *                       example: "10 minutes"
 *                 pagination:
 *                   type: "null"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Account deletion already in progress
 *       500:
 *         description: Internal server error
 */
router.post('/request-account-deletion', verifyToken, buyerController.requestAccountDeletion);

/**
 * @swagger
 * /api/v2/buyers/confirm-account-deletion:
 *   post:
 *     summary: Confirm and execute account deletion
 *     description: Verify the OTP and permanently delete the buyer's account. This action cannot be undone.
 *     tags:
 *       - Buyer Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otp:
 *                 type: string
 *                 pattern: '^[0-9]{4}$'
 *                 description: 4-digit verification code received via email
 *                 example: "1234"
 *             required:
 *               - otp
 *     responses:
 *       200:
 *         description: Account deleted successfully
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
 *                   example: "Account deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Account deleted successfully"
 *                 pagination:
 *                   type: "null"
 *       400:
 *         description: Bad request - Invalid OTP or deletion request
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
 *                   example: "Invalid verification code"
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
 *                         example: "Invalid verification code"
 *                       remainingAttempts:
 *                         type: number
 *                         example: 3
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/confirm-account-deletion', verifyToken, buyerController.confirmAccountDeletion);

module.exports = router;


