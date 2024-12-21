const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');


/**
 * @swagger
 * /api/order:
 *   post:
 *     summary: Create a new order with Terminal Africa shipping
 *     description: Creates an order and shipping information through Terminal Africa
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
 *               - pickupAddress
 *               - parcel
 *               - paymentMethod
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - name
 *                     - description
 *                     - weight
 *                     - price
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     weight:
 *                       type: number
 *                     price:
 *                       type: number
 *               pickupAddress:
 *                 type: object
 *                 required:
 *                   - first_name
 *                   - last_name
 *                   - email
 *                   - phone
 *                   - line1
 *                   - city
 *                   - state
 *                   - country
 *                   - zip
 *                 properties:
 *                   first_name:
 *                     type: string
 *                   last_name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                     description: International phone number without + symbol
 *                   line1:
 *                     type: string
 *                     description: Street address
 *                   line2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                     description: ISO 2 country code (e.g., NG)
 *                   zip:
 *                     type: string
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - first_name
 *                   - last_name
 *                   - email
 *                   - phone
 *                   - line1
 *                   - city
 *                   - state
 *                   - country
 *                   - zip
 *                 properties:
 *                   first_name:
 *                     type: string
 *                   last_name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                     description: International phone number without + symbol
 *                   line1:
 *                     type: string
 *                     description: Street address
 *                   line2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                     description: ISO 2 country code (e.g., NG)
 *                   zip:
 *                     type: string
 *               parcel:
 *                 type: object
 *                 required:
 *                   - weight
 *                   - width
 *                   - height
 *                   - length
 *                 properties:
 *                   weight:
 *                     type: number
 *                     description: Weight of the parcel in kg
 *                   width:
 *                     type: number
 *                     description: Width of the parcel in cm
 *                   height:
 *                     type: number
 *                     description: Height of the parcel in cm
 *                   length:
 *                     type: number
 *                     description: Length of the parcel in cm
 *               paymentMethod:
 *                 type: string
 *                 enum: [paystack, card, bank_transfer]
 *                 description: Payment method for the order
 *     responses:
 *       201:
 *         description: Order created successfully with shipping details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Orders created successfully
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 shipping:
 *                   type: object
 *                   properties:
 *                     shipment_id:
 *                       type: string
 *                     tracking_number:
 *                       type: string
 *                     carrier:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                     amount:
 *                       type: number
 *       400:
 *         description: Invalid request body or address validation failed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error or shipping creation failed
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
 *     responses:
 *       200:
 *         description: Shipping carrier selected successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentDetails
 *             properties:
 *               paymentDetails:
 *                 type: object
 *                 properties:
 *                   transactionId:
 *                     type: string
 *                   paymentMethod:
 *                     type: string
 *     responses:
 *       200:
 *         description: Payment processed and shipment created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/process-payment', authMiddleware.verifyToken, orderController.processPaymentAndCreateShipment);

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
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/:orderId', authMiddleware.verifyToken, orderController.getOrder);

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
 *     responses:
 *       200:
 *         description: User's orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
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
 *     responses:
 *       200:
 *         description: Seller's orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
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
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.put('/:orderId/status', authMiddleware.verifyToken, orderController.updateOrderStatus);

/**
 * @swagger
 * /api/order/{orderId}/dispute:
 *   post:
 *     summary: Create a dispute for an order
 *     description: Creates a dispute for an order
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
 *               - reason
 *               - description
 *             properties:
 *               reason:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/dispute', authMiddleware.verifyToken, orderController.createDispute);

/**
 * @swagger
 * /api/order/{orderId}/dispute/{disputeId}:
 *   put:
 *     summary: Update a dispute for an order
 *     description: Updates a dispute for an order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: disputeId
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
 *               resolution:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute updated successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order or dispute not found
 *       500:
 *         description: Server error
 */
router.put('/:orderId/dispute/:disputeId', authMiddleware.verifyToken, orderController.updateDispute);

/**
 * @swagger
 * /api/order/{orderId}/refund:
 *   post:
 *     summary: Request a refund for an order
 *     description: Requests a refund for an order
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
 *               - reason
 *               - amount
 *             properties:
 *               reason:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Refund requested successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/refund', authMiddleware.verifyToken, orderController.requestRefund);

/**
 * @swagger
 * /api/order/{orderId}/refund/{refundId}:
 *   put:
 *     summary: Process a refund for an order
 *     description: Processes a refund for an order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: refundId
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
 *                 enum: [approved, rejected]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order or refund not found
 *       500:
 *         description: Server error
 */
router.put('/:orderId/refund/:refundId', authMiddleware.verifyToken, orderController.processRefund);

/**
 * @swagger
 * /api/order/calculate-shipping:
 *   post:
 *     summary: Calculate shipping fees
 *     description: Calculates shipping fees for a list of items
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
 *               - pickupAddress
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - address1
 *                   - city
 *                   - state
 *                   - country
 *                   - zipCode
 *                 properties:
 *                   address1:
 *                     type: string
 *                   address2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               pickupAddress:
 *                 type: object
 *                 required:
 *                   - address1
 *                   - city
 *                   - state
 *                   - country
 *                   - zipCode
 *                 properties:
 *                   address1:
 *                     type: string
 *                   address2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *     responses:
 *       200:
 *         description: Shipping fees calculated successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/calculate-shipping', authMiddleware.verifyToken, orderController.calculateShipping);

/**
 * @swagger
 * /api/order/search-shipping-rates:
 *   post:
 *     summary: Search shipping rates
 *     description: Searches for shipping rates based on pickup and delivery addresses
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
 *               - pickupAddressId
 *               - deliveryAddressId
 *               - parcelId
 *             properties:
 *               pickupAddressId:
 *                 type: string
 *               deliveryAddressId:
 *                 type: string
 *               parcelId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shipping rates retrieved successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/search-shipping-rates', authMiddleware.verifyToken, orderController.searchShippingRates);

/**
 * @swagger
 * /api/order/enable-carrier:
 *   post:
 *     summary: Enable a carrier
 *     description: Enables a carrier for shipping
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
 *               - carrierReference
 *             properties:
 *               carrierReference:
 *                 type: string
 *               domestic:
 *                 type: boolean
 *               international:
 *                 type: boolean
 *               regional:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Carrier enabled successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/enable-carrier', authMiddleware.verifyToken, orderController.enableCarrier);

/**
 * @swagger
 * /api/order/create-shipment:
 *   post:
 *     summary: Create a shipment
 *     description: Creates a shipment for an order
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
 *               - addressFromId
 *               - addressToId
 *               - parcelId
 *             properties:
 *               addressFromId:
 *                 type: string
 *               addressToId:
 *                 type: string
 *               parcelId:
 *                 type: string
 *               addressReturnId:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Shipment created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/create-shipment', authMiddleware.verifyToken, orderController.createShipment);

/**
 * @swagger
 * /api/order/export:
 *   get:
 *     summary: Export orders
 *     description: Exports orders based on filters
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orders exported successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/export', authMiddleware.verifyToken, orderController.exportOrders);

/**
 * @swagger
 * /api/order/revenue-analytics:
 *   get:
 *     summary: Get revenue analytics
 *     description: Retrieves revenue analytics for a seller
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *     responses:
 *       200:
 *         description: Revenue analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/revenue-analytics', authMiddleware.verifyToken, orderController.getRevenueAnalytics);

/**
 * @swagger
 * /api/order/bulk-update:
 *   put:
 *     summary: Bulk update orders
 *     description: Updates multiple orders in bulk
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
 *               - orderIds
 *               - update
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
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.put('/bulk-update', authMiddleware.verifyToken, orderController.bulkUpdateOrders);

/**
 * @swagger
 * /api/order/{orderId}/tracking:
 *   put:
 *     summary: Update tracking information for an order
 *     description: Updates the tracking information for an order
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
 *               - trackingNumber
 *               - carrier
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
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.put('/:orderId/tracking', authMiddleware.verifyToken, orderController.updateTracking);

/**
 * @swagger
 * /api/order/{orderId}/note:
 *   post:
 *     summary: Add a note to an order
 *     description: Adds a note to an order
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
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Note added successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/note', authMiddleware.verifyToken, orderController.addOrderNote);

module.exports = router;
