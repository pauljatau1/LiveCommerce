const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const authMiddleware = require('../middlewares/authMiddleware');

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
 *               paymentMethod:
 *                 type: string
 *               paymentDetails:
 *                 type: object
 *     responses:
 *       201:
 *         description: Withdrawal request created successfully
 */
router.post('/', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  withdrawalController.requestWithdrawal
);

/**
 * @swagger
 * /api/withdrawals/history:
 *   get:
 *     summary: Get withdrawal history
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Withdrawal history retrieved successfully
 */
router.get('/history', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  withdrawalController.getWithdrawalHistory
);

/**
 * @swagger
 * /api/withdrawals/{id}/process:
 *   put:
 *     summary: Process a withdrawal request (Admin only)
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               note:
 *                 type: string
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal processed successfully
 */
router.put('/:id/process', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  withdrawalController.processWithdrawal
);

module.exports = router;
