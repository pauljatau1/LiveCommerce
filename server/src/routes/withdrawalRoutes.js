const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/authMiddleware');

// /**
//  * @swagger
//  * tags:
//  *   name: Withdrawals
//  *   description: API endpoints for managing withdrawals
//  */

/**
 * @swagger
 * /api/withdrawals:
 *   post:
 *     summary: Create a new withdrawal request
 *     tags: [Withdrawals]
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
 *                 description: Amount to withdraw
 *                 example: 1000
 *     responses:
 *       201:
 *         description: Withdrawal request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 status:
 *                   type: string
 *                   example: pending
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', 
  authMiddleware.verifyToken, 
  withdrawalController.createWithdrawalRequest
);

/**
 * @swagger
 * /api/withdrawals/seller:
 *   get:
 *     summary: Get seller's withdrawal requests
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of seller's withdrawals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   status:
 *                     type: string
 *                     example: pending
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Seller not found
 */
router.get('/seller', 
  authMiddleware.verifyToken, 
  withdrawalController.getSellerWithdrawals
);

/**
 * @swagger
 * /api/withdrawals:
 *   get:
 *     summary: Get all withdrawal requests (Admin only)
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all withdrawals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   status:
 *                     type: string
 *                     example: completed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.get('/', 
  authMiddleware.verifyToken, 
  adminMiddleware.isAdmin, 
  withdrawalController.getAllWithdrawals
);

/**
 * @swagger
 * /api/withdrawals/{id}:
 *   put:
 *     summary: Update withdrawal status (Admin only)
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Withdrawal request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed]
 *                 example: completed
 *     responses:
 *       200:
 *         description: Withdrawal status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: completed
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Withdrawal request not found
 */
router.put('/:id', 
  authMiddleware.verifyToken, 
  adminMiddleware.isAdmin, 
  withdrawalController.updateWithdrawalStatus
);

module.exports = router;
