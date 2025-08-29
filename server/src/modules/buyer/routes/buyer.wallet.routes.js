const express = require('express');
const router = express.Router();

const { verifyToken, isBuyer } = require('../../../middlewares/authMiddleware');
const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/wallet/balance:
 *   get:
 *     summary: Get buyer's wallet balance with on-hold items
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
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
 *                   example: "Wallet balance retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                       description: Total wallet balance
 *                       example: 5000.00
 *                     onHoldAmount:
 *                       type: number
 *                       description: Amount currently on hold for active bids
 *                       example: 1500.00
 *                     availableBalance:
 *                       type: number
 *                       description: Available balance (total - on hold)
 *                       example: 3500.00
 *                     onHoldItems:
 *                       type: array
 *                       description: List of items currently on hold
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                             description: Product ID
 *                             example: "507f1f77bcf86cd799439011"
 *                           productName:
 *                             type: string
 *                             description: Product name
 *                             example: "iPhone 13 Pro"
 *                           productImage:
 *                             type: string
 *                             description: Product image URL
 *                             example: "https://example.com/image.jpg"
 *                           amount:
 *                             type: number
 *                             description: Amount on hold for this item
 *                             example: 750.00
 *                           bidDate:
 *                             type: string
 *                             format: date-time
 *                             description: Date when the bid was placed
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           auctionStatus:
 *                             type: string
 *                             description: Current auction status
 *                             example: "active"
 *                           auctionEndDate:
 *                             type: string
 *                             format: date-time
 *                             description: Auction end date
 *                             example: "2024-01-20T18:00:00.000Z"
 *                     currency:
 *                       type: string
 *                       description: Currency code
 *                       example: "NGN"
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
 *         description: Not found - Buyer not found
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
 *                   example: "Buyer not found"
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
 */
router.get('/wallet/balance', verifyToken, isBuyer, buyerController.getWalletBalance);

/**
 * @swagger
 * /api/v2/buyers/wallet/topup/verify:
 *   get:
 *     summary: Verify a wallet top-up payment
 *     description: Verify a Paystack payment and complete wallet top-up. This endpoint verifies the payment with Paystack, validates the transaction data, and updates the buyer's wallet with the top-up amount. It handles both new transactions and updates to existing pending transactions.
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Paystack payment reference
 *         example: "TXN_1234567890"
 *     responses:
 *       200:
 *         description: Wallet topped up successfully
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
 *                   example: "Wallet topped up successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       description: Success message
 *                       example: "Wallet topped up successfully"
 *                     transaction:
 *                       type: object
 *                       description: Transaction details
 *                       properties:
 *                         paymentReference:
 *                           type: string
 *                           description: Payment reference from Paystack
 *                           example: "TXN_1234567890"
 *                         amount:
 *                           type: number
 *                           description: Transaction amount in NGN
 *                           example: 5000.00
 *                         type:
 *                           type: string
 *                           description: Transaction type
 *                           example: "credit"
 *                         status:
 *                           type: string
 *                           description: Transaction status
 *                           example: "completed"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: Transaction creation date
 *                           example: "2024-01-15T10:30:00.000Z"
 *                     newBalance:
 *                       type: number
 *                       description: Updated wallet balance
 *                       example: 15000.00
 *       400:
 *         description: Bad request - Invalid payment reference or verification failed
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
 *                   example: "Payment reference is required"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "reference"
 *                       message:
 *                         type: string
 *                         example: "Payment reference is required"
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
 *         description: Not found - Buyer not found
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
 *                   example: "Buyer not found"
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
 */
router.get('/wallet/topup/verify', verifyToken, isBuyer, buyerController.verifyWalletTopUp);

/**
 * @swagger
 * /api/v2/buyers/wallet/topup:
 *   post:
 *     summary: Top up buyer's wallet
 *     description: Top up the buyer's wallet with a specified amount. This endpoint handles both new transactions and updates to existing pending transactions. It supports direct top-ups for admin users or in development environment.
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
 *               amount:
 *                 type: number
 *                 description: Amount to top up (must be greater than 0)
 *                 example: 5000.00
 *               description:
 *                 type: string
 *                 description: Optional description for the transaction
 *                 example: "Wallet top up"
 *               bypassPaystack:
 *                 type: boolean
 *                 description: Whether to bypass Paystack (admin only)
 *                 example: false
 *               paymentReference:
 *                 type: string
 *                 description: Optional payment reference for existing transactions
 *                 example: "PAY-1234567890-ABC123"
 *             required:
 *               - amount
 *     responses:
 *       200:
 *         description: Wallet topped up successfully
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
 *                   example: "Wallet topped up successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       description: Success message
 *                       example: "Wallet topped up successfully"
 *                     transaction:
 *                       type: object
 *                       description: Transaction details
 *                       properties:
 *                         type:
 *                           type: string
 *                           description: Transaction type
 *                           example: "credit"
 *                         amount:
 *                           type: number
 *                           description: Transaction amount in NGN
 *                           example: 5000.00
 *                         paymentReference:
 *                           type: string
 *                           description: Payment reference
 *                           example: "PAY-1234567890-ABC123"
 *                         description:
 *                           type: string
 *                           description: Transaction description
 *                           example: "Wallet top up"
 *                         status:
 *                           type: string
 *                           description: Transaction status
 *                           example: "completed"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: Transaction creation date
 *                           example: "2024-01-15T10:30:00.000Z"
 *                     newBalance:
 *                       type: number
 *                       description: Updated wallet balance
 *                       example: 15000.00
 *       400:
 *         description: Bad request - Invalid amount or validation failed
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
 *                   example: "Invalid amount. Amount must be greater than 0."
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "amount"
 *                       message:
 *                         type: string
 *                         example: "Invalid amount. Amount must be greater than 0."
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
 *       403:
 *         description: Forbidden - Direct wallet top-up not allowed
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
 *                   example: "Direct wallet top-up is not allowed"
 *       404:
 *         description: Not found - Buyer not found
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
 *                   example: "Buyer not found"
 *       422:
 *         description: Validation error
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
 *                         example: "amount"
 *                       message:
 *                         type: string
 *                         example: "Invalid amount. Amount must be greater than 0."
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
 */
router.post('/wallet/topup', verifyToken, isBuyer, buyerController.topUpWallet);

/**
 * @swagger
 * /api/v2/buyers/wallet/transactions:
 *   get:
 *     summary: Get buyer's wallet transactions
 *     description: Retrieve a paginated list of wallet transactions for the authenticated buyer. Supports filtering by transaction type and date range.
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of transactions per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [credit, debit]
 *         description: Filter by transaction type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions until this date (ISO format)
 *     responses:
 *       200:
 *         description: Wallet transactions retrieved successfully
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
 *                   example: "Wallet transactions retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [credit, debit]
 *                             example: "credit"
 *                           amount:
 *                             type: number
 *                             example: 1000
 *                           paymentReference:
 *                             type: string
 *                             example: "TXN_123456789"
 *                           description:
 *                             type: string
 *                             example: "Wallet top up"
 *                           status:
 *                             type: string
 *                             enum: [pending, completed, failed]
 *                             example: "completed"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00.000Z"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total number of transactions
 *                           example: 25
 *                         pages:
 *                           type: integer
 *                           description: Total number of pages
 *                           example: 3
 *                         current:
 *                           type: integer
 *                           description: Current page number
 *                           example: 1
 *                         hasMore:
 *                           type: boolean
 *                           description: Whether there are more pages
 *                           example: true
 *                 pagination:
 *                   type: "null"
 *                   nullable: true
 *                   example: null
 *               required:
 *                 - success
 *                 - message
 *                 - data
 *                 - pagination
 *       400:
 *         description: Bad request - Invalid query parameters
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
 *                         example: "page"
 *                       message:
 *                         type: string
 *                         example: "Page must be a positive integer"
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
 *         description: Not found - Buyer not found
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
 *                   example: "Buyer not found"
 *       422:
 *         description: Validation error
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
 *                         example: "type"
 *                       message:
 *                         type: string
 *                         example: "Type must be either \"credit\" or \"debit\""
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
 */
router.get('/wallet/transactions', verifyToken, isBuyer, buyerController.getWalletTransactions);

module.exports = router;


