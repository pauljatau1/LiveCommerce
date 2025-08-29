const express = require('express');
const router = express.Router();

const { verifyToken, isBuyer } = require('../../../middlewares/authMiddleware');
const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/report-user:
 *   post:
 *     summary: Report a user for violations or inappropriate behavior
 *     description: |
 *       Allows buyers to report other users (buyers or sellers) for policy violations,
 *       inappropriate behavior, or other concerns. The report is automatically sent
 *       to administrators for review and appropriate action.
 *       
 *       Features:
 *       - Comprehensive input validation
 *       - Prevention of self-reporting
 *       - Automatic admin notifications
 *       - Unique report ID generation
 *       - Audit trail and tracking
 *     tags:
 *       - Buyer V2
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userType
 *               - reason
 *               - description
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The MongoDB ObjectId of the user being reported
 *                 example: "60f5e8b3e1b2c3d4e5f6g7h8"
 *               userType:
 *                 type: string
 *                 enum: [buyer, seller]
 *                 description: The type of user being reported
 *                 example: "seller"
 *               reason:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Main reason for reporting the user
 *                 example: "Fraudulent behavior"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Detailed description of the issue or violation
 *                 example: "This seller is selling counterfeit products and refusing refunds to customers."
 *     responses:
 *       201:
 *         description: Report submitted successfully
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
 *                   example: "Report submitted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Report submitted successfully"
 *                     report:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Unique identifier for the report
 *                           example: "60f5e8b3e1b2c3d4e5f6g7h9"
 *                         reportedUser:
 *                           type: object
 *                           properties:
 *                             userId:
 *                               type: string
 *                               example: "60f5e8b3e1b2c3d4e5f6g7h8"
 *                             userType:
 *                               type: string
 *                               example: "seller"
 *                         reason:
 *                           type: string
 *                           example: "Fraudulent behavior"
 *                         description:
 *                           type: string
 *                           example: "This seller is selling counterfeit products and refusing refunds to customers."
 *                         status:
 *                           type: string
 *                           enum: [pending, reviewed, resolved]
 *                           example: "pending"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-07-20T10:30:00.000Z"
 *                 pagination:
 *                   type: "null"
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
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "reason"
 *                       message:
 *                         type: string
 *                         example: "Reason must be at least 3 characters long"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
 *                   example: "Access denied!"
 *       404:
 *         description: Not found - Reported user does not exist
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
 *                         example: "userId"
 *                       message:
 *                         type: string
 *                         example: "Reported user not found"
 *       422:
 *         description: Validation error - Self-reporting or other business rule violations
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
 *                         example: "userId"
 *                       message:
 *                         type: string
 *                         example: "You cannot report yourself"
 *       500:
 *         description: Internal server error
 */
router.post('/report-user', verifyToken, isBuyer, buyerController.reportUser);

module.exports = router;


