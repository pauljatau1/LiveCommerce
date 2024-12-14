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

/**
 * @swagger
 * /api/order/calculate-shipping:
 *   post:
 *     summary: Calculate shipping fees for items
 *     tags: [Order]
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
 *                   state:
 *                     type: string
 *                   city:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               shippingMethod:
 *                 type: string
 *                 enum: [standard, express, economy]
 *     responses:
 *       200:
 *         description: Shipping fees calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalShippingFee:
 *                   type: number
 *                 shippingDetails:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: string
 *                       shippingFee:
 *                         type: number
 *                       estimatedDeliveryDate:
 *                         type: string
 *                         format: date-time
 */
router.post('/calculate-shipping', orderController.calculateShipping);

/**
 * @swagger
 * /api/order/shipping-rates:
 *   post:
 *     summary: Search for available shipping rates
 *     tags: [Order]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupAddressId
 *               - deliveryAddressId
 *               - parcelId
 *             properties:
 *               pickupAddressId:
 *                 type: string
 *                 description: Terminal Africa pickup address ID
 *               deliveryAddressId:
 *                 type: string
 *                 description: Terminal Africa delivery address ID
 *               parcelId:
 *                 type: string
 *                 description: Terminal Africa parcel ID
 *     responses:
 *       200:
 *         description: Shipping rates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       amount:
 *                         type: number
 *                       carrier_name:
 *                         type: string
 *                       carrier_logo:
 *                         type: string
 *                       delivery_eta:
 *                         type: number
 *                       delivery_time:
 *                         type: string
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
router.post('/shipping-rates', orderController.searchShippingRates);

/**
 * @swagger
 * /api/order/{orderId}/select-carrier:
 *   post:
 *     summary: Select a shipping carrier for an order
 *     tags: [Order]
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
 *                 description: Terminal Africa carrier reference
 *               rateId:
 *                 type: string
 *                 description: Terminal Africa rate ID
 *     responses:
 *       200:
 *         description: Shipping carrier selected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 order:
 *                   type: object
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/select-carrier', orderController.selectShippingCarrier);

/**
 * @swagger
 * /api/order/carriers/enable/{carrierReference}:
 *   post:
 *     summary: Enable a shipping carrier
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: carrierReference
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
 *               domestic:
 *                 type: boolean
 *                 default: true
 *               international:
 *                 type: boolean
 *                 default: false
 *               regional:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Carrier enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: boolean
 *                     name:
 *                       type: string
 *                     logo:
 *                       type: string
 *       400:
 *         description: Missing carrier reference
 *       500:
 *         description: Server error
 */
router.post('/carriers/enable/:carrierReference', orderController.enableCarrier);

/**
 * @swagger
 * /api/order/shipments:
 *   post:
 *     summary: Create a new shipment
 *     tags: [Order]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addressFromId
 *               - addressToId
 *               - parcelId
 *             properties:
 *               addressFromId:
 *                 type: string
 *                 description: Terminal Africa pickup address ID
 *               addressToId:
 *                 type: string
 *                 description: Terminal Africa delivery address ID
 *               parcelId:
 *                 type: string
 *                 description: Terminal Africa parcel ID
 *               addressReturnId:
 *                 type: string
 *                 description: Terminal Africa return address ID
 *               orderId:
 *                 type: string
 *                 description: Associated order ID (optional)
 *               metadata:
 *                 type: object
 *                 description: Additional shipment information
 *     responses:
 *       200:
 *         description: Shipment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     shipment_id:
 *                       type: string
 *                     tracking_number:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/shipments', orderController.createShipment);

module.exports = router;
