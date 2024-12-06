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
 *               cart:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     sellerId:
 *                       type: string
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
 *                   addressType:
 *                     type: string
 *               user:
 *                 type: string
 *               paymentInfo:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   status:
 *                     type: string
 *                   type:
 *                     type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.post('/', authMiddleware.verifyToken, orderController.createOrder);

/**
 * @swagger
 * /api/order:
 *   get:
 *     summary: Get all orders
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', authMiddleware.verifyToken, orderController.getAllOrders);

/**
 * @swagger
 * /api/order/buyer/{buyerId}:
 *   get:
 *     summary: Get all orders for a buyer
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Buyer ID
 *     responses:
 *       200:
 *         description: List of orders for buyer retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/buyer/:buyerId', authMiddleware.verifyToken, orderController.getOrdersForBuyer);

/**
 * @swagger
 * /api/order/seller/{sellerId}:
 *   get:
 *     summary: Get all orders for a seller
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Seller ID
 *     responses:
 *       200:
 *         description: List of orders for seller retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/seller/:sellerId', authMiddleware.verifyToken, orderController.getOrdersForSeller);

/**
 * @swagger
 * /api/order/{id}:
 *   get:
 *     summary: Get a single order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authMiddleware.verifyToken, orderController.getOrder);

/**
 * @swagger
 * /api/order/{id}:
 *   put:
 *     summary: Update an order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ['Pending', 'Paid', 'Confirmed', 'On its way', 'Delivered']
 *                 description: |
 *                   Valid status transitions:
 *                   - 'Pending': ['Paid']
 *                   - 'Paid': ['Confirmed', 'On its way']
 *                   - 'Confirmed': ['On its way']
 *                   - 'On its way': ['Delivered']
 *               deliveredAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         description: Invalid status transition
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authMiddleware.verifyToken, orderController.updateOrder);

/**
 * @swagger
 * /api/order/{id}/mark-as-paid:
 *   put:
 *     summary: Mark order as paid
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order marked as paid successfully
 *       400:
 *         description: Order can only be marked as paid if it is in Pending status
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/mark-as-paid', authMiddleware.verifyToken, orderController.markOrderAsPaid);

/**
 * @swagger
 * /api/order/{id}:
 *   delete:
 *     summary: Delete an order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authMiddleware.verifyToken, orderController.deleteOrder);

// Order management
router.put('/orders/:id/status', authMiddleware.verifyToken, orderController.updateOrderStatus);
router.post('/orders/:id/refund', authMiddleware.verifyToken, orderController.initiateRefund);
router.put('/orders/:id/tracking', authMiddleware.verifyToken, orderController.updateTracking);
router.post('/orders/:id/notes', authMiddleware.verifyToken, orderController.addOrderNote);

// Bulk operations
router.post('/orders/bulk-update', authMiddleware.verifyToken, orderController.bulkUpdateOrders);
router.get('/orders/export', authMiddleware.verifyToken, orderController.exportOrders);

// Analytics and reporting
router.get('/orders/analytics', authMiddleware.verifyToken, orderController.getOrderAnalytics);
router.get('/orders/revenue', authMiddleware.verifyToken, orderController.getRevenueAnalytics);

// Customer service
router.post('/orders/:id/dispute', authMiddleware.verifyToken, orderController.createDispute);
router.put('/orders/:id/dispute/:disputeId', authMiddleware.verifyToken, orderController.updateDispute);

/**
 * @swagger
 * /api/order/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, payment_processing, paid, preparing, shipped, delivered, cancelled]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       403:
 *         description: Not authorized to update this order
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/order/orders/{id}/refund:
 *   post:
 *     summary: Initiate order refund
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
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
 *         description: Refund initiated successfully
 *       400:
 *         description: Invalid refund amount or insufficient wallet balance
 *       403:
 *         description: Not authorized to refund this order
 */

/**
 * @swagger
 * /api/order/orders/analytics:
 *   get:
 *     summary: Get order analytics
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalOrders:
 *                   type: number
 *                 totalRevenue:
 *                   type: number
 *                 averageOrderValue:
 *                   type: number
 *                 statusBreakdown:
 *                   type: object
 */

/**
 * @swagger
 * /api/order/orders/bulk-update:
 *   post:
 *     summary: Bulk update orders
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
 *               orderIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               update:
 *                 type: object
 *     responses:
 *       200:
 *         description: Orders updated successfully
 *       403:
 *         description: Not authorized to update some orders
 */

/**
 * @swagger
 * /api/order/orders/{id}/tracking:
 *   put:
 *     summary: Update order tracking information
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackingNumber:
 *                 type: string
 *               carrier:
 *                 type: string
 *               estimatedDelivery:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Tracking information updated successfully
 *       403:
 *         description: Not authorized to update this order
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/order/orders/{id}/notes:
 *   post:
 *     summary: Add note to order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *                 description: Whether the note is private (visible only to seller)
 *     responses:
 *       200:
 *         description: Note added successfully
 *       403:
 *         description: Not authorized to update this order
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/order/orders/export:
 *   get:
 *     summary: Export orders
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for export
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for export
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: Orders exported successfully
 */

/**
 * @swagger
 * /api/order/orders/revenue:
 *   get:
 *     summary: Get revenue analytics
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *         default: day
 *         description: Group results by time period
 *     responses:
 *       200:
 *         description: Revenue analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   revenue:
 *                     type: number
 *                   orders:
 *                     type: number
 *                   averageOrderValue:
 *                     type: number
 */

/**
 * @swagger
 * /api/order/orders/{id}/dispute:
 *   post:
 *     summary: Create a dispute for an order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
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

/**
 * @swagger
 * /api/order/orders/{id}/dispute/{disputeId}:
 *   put:
 *     summary: Update a dispute
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Dispute ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *               resolution:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute updated successfully
 *       404:
 *         description: Order or dispute not found
 */

module.exports = router;
