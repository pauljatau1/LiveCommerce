const express = require('express');
const router = express.Router();

const { verifyToken, isBuyer } = require('../../../middlewares/authMiddleware');
const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/analytics:
 *   get:
 *     summary: Get purchase analytics for a buyer
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchase analytics retrieved successfully
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
 *                   example: "Purchase analytics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: integer
 *                       example: 25
 *                     totalSpent:
 *                       type: number
 *                       example: 15000.50
 *                     averageOrderValue:
 *                       type: number
 *                       example: 600.02
 *                     completionRate:
 *                       type: number
 *                       example: 85.5
 *                     ordersByStatus:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                           example: 5
 *                         processing:
 *                           type: integer
 *                           example: 3
 *                         shipped:
 *                           type: integer
 *                           example: 2
 *                         delivered:
 *                           type: integer
 *                           example: 12
 *                         cancelled:
 *                           type: integer
 *                           example: 2
 *                         returned:
 *                           type: integer
 *                           example: 1
 *                     recentOrders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           orderId:
 *                             type: string
 *                           orderNumber:
 *                             type: string
 *                           totalAmount:
 *                             type: number
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 product:
 *                                   type: object
 *                                   properties:
 *                                     id:
 *                                       type: string
 *                                     name:
 *                                       type: string
 *                                     image:
 *                                       type: string
 *                                     price:
 *                                       type: number
 *                                 quantity:
 *                                   type: integer
 *                                 status:
 *                                   type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/analytics', verifyToken, isBuyer, buyerController.getPurchaseAnalytics);

module.exports = router;


