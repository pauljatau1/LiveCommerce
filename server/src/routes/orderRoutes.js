const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');


/**
 * @swagger
 * /api/order:
 *   post:
 *     summary: Create a new order with shipping rates
 *     description: Step 1 - Creates an order and returns available shipping rates for carrier selection
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shippingAddress
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
 *                     seller:
 *                       type: string
 *               shippingAddress:
 *                 $ref: '#/components/schemas/ShippingAddress'
 *     responses:
 *       201:
 *         description: Order created successfully with shipping rates
 */
router.post('/', authMiddleware.verifyToken, orderController.createOrder);

/**
 * @swagger
 * /api/order/{orderId}/select-carrier:
 *   post:
 *     summary: Select shipping carrier and calculate final total
 *     description: Step 2 - Enables carrier, updates order with shipping fee and calculates final total
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
 *             required:
 *               - carrierReference
 *               - rateId
 *             properties:
 *               carrierReference:
 *                 type: string
 *               rateId:
 *                 type: string
 */
router.post('/:orderId/select-carrier', authMiddleware.verifyToken, orderController.selectShippingCarrier);

/**
 * @swagger
 * /api/order/{orderId}/process-payment:
 *   post:
 *     summary: Process payment and create shipment
 *     description: Step 3 - Processes payment, creates shipment, and updates order status
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/:orderId/process-payment', 
  authMiddleware.verifyToken, 
  orderController.processPaymentAndCreateShipment
);

/**
 * @swagger
 * /api/order/{orderId}:
 *   get:
 *     summary: Get order details
 *     description: Retrieves detailed information about an order including shipping status
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:orderId', authMiddleware.verifyToken, orderController.getOrder);

// /**
//  * @swagger
//  * /api/order/track/{trackingNumber}:
//  *   get:
//  *     summary: Track shipment
//  *     description: Get tracking information for a shipment
//  *     tags: [Order]
//  *     parameters:
//  *       - in: path
//  *         name: trackingNumber
//  *         required: true
//  *         schema:
//  *           type: string
//  */
// router.get('/track/:trackingNumber', orderController.trackShipment);

/**
 * @swagger
 * /api/order/user/{userId}:
 *   get:
 *     summary: Get user's orders
 *     description: Retrieves all orders for a specific user
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/user/:userId', authMiddleware.verifyToken, orderController.getUserOrders);

/**
 * @swagger
 * /api/order/{orderId}/cancel:
 *   post:
 *     summary: Cancel an order
 *     description: Cancels an order if it hasn't been shipped
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/:orderId/cancel', authMiddleware.verifyToken, orderController.cancelOrder);

/**
 * @swagger
 * /api/order/seller/{sellerId}:
 *   get:
 *     summary: Get seller's orders
 *     description: Retrieves all orders for a specific seller
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/seller/:sellerId', authMiddleware.verifyToken, orderController.getSellerOrders);

/**
 * @swagger
 * /api/order/{orderId}/status:
 *   put:
 *     summary: Update order status
 *     description: Updates the status of an order (for admin/seller use)
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 */
router.put('/:orderId/status', authMiddleware.verifyToken, orderController.updateOrderStatus);

module.exports = router;
