const express = require('express');
const router = express.Router();

const { verifyToken, isBuyer } = require('../../../middlewares/authMiddleware');
const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/orders:
 *   get:
 *     summary: Get orders for a buyer with filtering and pagination
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: trackingStatus
 *         schema:
 *           type: string
 *         description: Filter by tracking status (pending, picked_up, in_transit, delivered, cancelled, refunded)
 *         example: "delivered"
 *       - in: query
 *         name: hasReturn
 *         schema:
 *           type: string
 *         description: Filter by return status (true, false)
 *         example: "false"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in order ID or product name
 *         example: "OR12345"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of orders per page
 *         example: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field and direction
 *         example: "-createdAt"
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
 *                           order_id:
 *                             type: string
 *                           totalAmount:
 *                             type: number
 *                           status:
 *                             type: string
 *                           returnRequestId:
 *                             type: string
 *                           returnStatus:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalOrders:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *                         hasPrevious:
 *                           type: boolean
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/orders', verifyToken, isBuyer, buyerController.getOrders);

/**
 * @swagger
 * /api/v2/buyers/orders/{id}:
 *   get:
 *     summary: Get detailed information about a specific order
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
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
 *                   example: "Order details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     order_id:
 *                       type: string
 *                       example: "OR12345"
 *                     totalAmount:
 *                       type: number
 *                       example: 1500
 *                     status:
 *                       type: string
 *                       example: "delivered"
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               images:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                           seller:
 *                             type: object
 *                             properties:
 *                               storeName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               phoneNumber:
 *                                 type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.get('/orders/:id', verifyToken, isBuyer, buyerController.getOrderDetails);

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


