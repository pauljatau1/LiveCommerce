const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/order:
 *   post:
 *     summary: Create a new order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: string
 *                   city:
 *                     type: string
 *                   address1:
 *                     type: string
 *                   address2:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               paymentMethod:
 *                 type: string
 *               discountCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input or insufficient stock
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware.verifyToken, orderController.createOrder);

/**
 * @swagger
 * /api/order/{orderId}/status:
 *   put:
 *     summary: Update order status (Seller only)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               itemId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled, returned]
 *               note:
 *                 type: string
 *               trackingNumber:
 *                 type: string
 *               carrier:
 *                 type: string
 *               estimatedDelivery:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status or missing tracking info
 *       403:
 *         description: Unauthorized to update this order
 *       404:
 *         description: Order not found
 */
router.put('/:orderId/status', 
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  orderController.updateOrderStatus
);

/**
 * @swagger
 * /api/order/{id}/dispute:
 *   post:
 *     summary: Create a dispute for an order (Buyer only)
 *     tags: [Order]
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
 *               reason:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute created successfully
 *       400:
 *         description: Dispute already exists
 *       404:
 *         description: Order not found
 */
router.post('/:id/dispute', 
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  orderController.createDispute
);

/**
 * @swagger
 * /api/order/{id}/refund:
 *   post:
 *     summary: Request a refund (Buyer only)
 *     tags: [Order]
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
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund requested successfully
 *       400:
 *         description: Invalid refund amount
 *       404:
 *         description: Order not found
 */
router.post('/:id/refund', 
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  orderController.requestRefund
);

/**
 * @swagger
 * /api/order/{id}/refund/process:
 *   put:
 *     summary: Process a refund request (Seller/Admin only)
 *     tags: [Order]
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
 *                 enum: [approved, rejected]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Order not found
 */
router.put('/:id/refund/process', 
  authMiddleware.verifyToken,
  authMiddleware.isSellerOrAdmin,
  orderController.processRefund
);

module.exports = router;
