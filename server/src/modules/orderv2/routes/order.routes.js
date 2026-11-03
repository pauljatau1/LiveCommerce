/**
 * @swagger
 * tags:
 *   name: OrderV2
 *   description: Order management version 2
 */
// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../../../middlewares/authMiddleware');

// Route for creating a new order
/**
 * @swagger
 * /api/v2/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [OrderV2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listingId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware.verifyToken, orderController.createOrder);

// Route for paying for an order
/**
 * @swagger
 * /api/v2/orders/{orderId}/pay:
 *   post:
 *     summary: Selects carrier, updates order total, and processes payment
 *     tags: [OrderV2]
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
 *               carrier: 
 *                 type: object
 *                 description: The full rate object for the selected carrier.
 *               paymentDetails:
 *                 type: object
 *                 description: The payment details (e.g., paymentMethod, reference).
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Invalid request data (e.g., missing carrier info)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post('/:orderId/pay', authMiddleware.verifyToken, orderController.payForOrder);

// Route for verifying payment by reference
/**
 * @swagger
 * /api/v2/orders/verify-payment:
 *   post:
 *     summary: Verify payment by reference
 *     tags: [OrderV2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified
 *       401:
 *         description: Unauthorized
 */
router.post('/verify-payment', authMiddleware.verifyToken, orderController.verifyPaymentByReference);

// Route for handling Paystack webhook
/**
 * @swagger
 * /api/v2/orders/paystack-webhook:
 *   post:
 *     summary: Handle Paystack webhook
 *     tags: [OrderV2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook handled
 */
router.post('/paystack-webhook', orderController.handlePaystackWebhook);

// Cancel order by seller
/**
 * @swagger
 * /api/v2/orders/{orderId}/cancel:
 *   put:
 *     summary: Cancel order by seller
 *     tags: [OrderV2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled by seller
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.put('/:orderId/cancel', authMiddleware.verifyToken, orderController.cancelOrderBySeller);

// Cancel order by buyer
/**
 * @swagger
 * /api/v2/orders/{orderId}/cancel-by-buyer:
 *   put:
 *     summary: Cancel order by buyer
 *     tags: [OrderV2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled by buyer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.put('/:orderId/cancel-by-buyer', authMiddleware.verifyToken, orderController.cancelOrderByBuyer);

// Terminal Africa webhook routes
/**
 * @swagger
 * /api/v2/orders/terminal-webhook:
 *   post:
 *     summary: Handle Terminal Africa webhook
 *     tags: [OrderV2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook handled
 */
router.post('/terminal-webhook', orderController.handleTerminalWebhook);
/**
 * @swagger
 * /api/v2/orders/webhooks:
 *   post:
 *     summary: Create Terminal Africa webhook
 *     tags: [OrderV2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Webhook created
 *       401:
 *         description: Unauthorized
 */
router.post('/webhooks', authMiddleware.verifyToken, orderController.createTerminalWebhook);
/**
 * @swagger
 * /api/v2/orders/webhooks:
 *   get:
 *     summary: Get Terminal Africa webhooks
 *     tags: [OrderV2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Webhooks retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/webhooks', authMiddleware.verifyToken, orderController.getTerminalWebhooks);
/**
 * @swagger
 * /api/v2/orders/webhooks/{webhook_id}:
 *   delete:
 *     summary: Delete Terminal Africa webhook
 *     tags: [OrderV2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: webhook_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook deleted
 *       401:
 *         description: Unauthorized
 */
router.delete('/webhooks/:webhook_id', authMiddleware.verifyToken, orderController.deleteTerminalWebhook);

// Terminal Africa address routes
/**
 * @swagger
 * /api/v2/orders/states:
 *   get:
 *     summary: Get states
 *     description: Retrieve a list of states for Nigeria from Terminal Africa.
 *     tags:
 *       - OrderV2
 *     responses:
 *       '200':
 *         description: A list of states.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "States in Nigeria retrieved successfully."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Lagos"
 *                       isoCode:
 *                         type: string
 *                         example: "LA"
 *                       countryCode:
 *                         type: string
 *                         example: "NG"
 *                       latitude:
 *                         type: string
 *                         example: "6.465422"
 *                       longitude:
 *                         type: string
 *                         example: "3.406448"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to get states"
 *                 error:
 *                   type: string
 */
router.get('/states', orderController.getStates);
/**
 * @swagger
 * /api/v2/orders/cities/{stateCode}:
 *   get:
 *     summary: Get cities
 *     description: Retrieve a list of cities for a given state in Nigeria from Terminal Africa.
 *     tags:
 *       - OrderV2
 *     parameters:
 *       - in: path
 *         name: stateCode
 *         schema:
 *           type: string
 *         required: true
 *         description: The state code to get cities for.
 *     responses:
 *       '200':
 *         description: A list of cities.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cities in Nigeria - LA"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Ikeja"
 *                       countryCode:
 *                         type: string
 *                         example: "NG"
 *                       stateCode:
 *                         type: string
 *                         example: "LA"
 *                       latitude:
 *                         type: string
 *                         example: "6.601838"
 *                       longitude:
 *                         type: string
 *                         example: "3.351486"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to get cities"
 *                 error:
 *                   type: string
 */
router.get('/cities/:stateCode', orderController.getCities);

// Route for marking an order as paid
// /**
//  * @swagger
//  * /api/v2/orders/{id}/mark-paid:
//  *   post:
//  *     summary: Mark an order as paid
//  *     tags: [OrderV2]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Order marked as paid
//  *       401:
//  *         description: Unauthorized
//  *       404:
//  *         description: Order not found
//  */
// router.post('/:id/mark-paid', authMiddleware.verifyToken, orderController.markOrderAsPaid);

module.exports = router;
