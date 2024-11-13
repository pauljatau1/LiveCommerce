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

module.exports = router;
