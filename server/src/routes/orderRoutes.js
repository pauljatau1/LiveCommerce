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
 *                     specifications:
 *                       type: object
 *                       properties:
 *                         color:
 *                           type: string
 *                         size:
 *                           type: string
 *                         material:
 *                           type: string
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
 *                 properties:
 *                   weight:
 *                     type: number
 *                     description: Weight of the parcel in kg
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
 * /api/order/shipping-rates/{shipmentId}:
 *   get:
 *     summary: Get shipping rates for a shipment
 *     description: Retrieves available shipping rates for a shipment based on the shipment ID
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shipmentId
 *         required: true
 *         schema:
 *           type: string
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Rates retrieved successfully'
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       amount:
 *                         type: number
 *                         example: 14000
 *                       carrier_id:
 *                         type: string
 *                         example: 'loYZh5J47D6gJUKOExXeO1RLcMARScLi'
 *                       carrier_logo:
 *                         type: string
 *                         example: 'https://ucarecdn.com/dcdd8109-af8c-4057-8104-192be821dd6e/download4.png'
 *                       carrier_name:
 *                         type: string
 *                         example: 'DHL Express'
 *                       carrier_rate_description:
 *                         type: string
 *                         example: 'EXPRESS 12:00 DOC'
 *                       currency:
 *                         type: string
 *                         example: 'NGN'
 *                       delivery_time:
 *                         type: string
 *                         example: 'Within 5 days.'
 *                       id:
 *                         type: string
 *                         example: 'bQVMwQZndHbIq6PQD5oiaGWxetLCXGkp'
 *                       includes_insurance:
 *                         type: boolean
 *                         example: false
 *                       insurance_coverage:
 *                         type: number
 *                         example: 0
 *                       insurance_fee:
 *                         type: number
 *                         example: 0
 *                       metadata:
 *                         type: object
 *                       pickup_time:
 *                         type: string
 *                         example: 'Tue Jul 13 2021 before 17:00 GMT'
 *                       rate_id:
 *                         type: string
 *                         example: 'RT-30798955894'
 *                       shipment:
 *                         type: string
 *                         example: 'RAl6LhWojcnJtlojLcw4XWgSpjBsjF38'
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: '2021-07-13T20:25:53.011Z'
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: '2021-07-13T20:25:53.011Z'
 *                 pageData:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       example: 3
 *                     perPage:
 *                       type: number
 *                       example: 100
 *                     page:
 *                       type: number
 *                       example: 1
 *                     pageCount:
 *                       type: number
 *                       example: 1
 *       400:
 *         description: Invalid shipment ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/shipping-rates/:shipmentId', authMiddleware.verifyToken, orderController.getShippingRates);


/**
 * @swagger
 * /api/order/mark-as-paid:
 *   post:
 *     summary: Mark multiple orders as paid
 *     description: Updates the payment status for multiple orders and processes related updates
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
 *               - orders
 *             properties:
 *               orders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - orderId
 *                     - amount
 *                     - carrier_reference
 *                     - shipping_fee
 *                     - carrier_name
 *                     - rate_id
 *                     - estimatedDeliveryDate
 *                     - estimatedPickupDate
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       description: ID of the order to mark as paid
 *                     amount:
 *                       type: number
 *                       description: Payment amount for this order
 *                     carrier_reference:
 *                       type: string
 *                       description: Reference ID from the shipping carrier
 *                     shipping_fee:
 *                       type: number
 *                       description: Shipping fee for this order
 *                     carrier_name:
 *                       type: string
 *                       description: Name of the shipping carrier
 *                     rate_id:
 *                       type: string
 *                     estimatedDeliveryDate:
 *                       type: string
 *                       format: date-time
 *                       description: Expected delivery date for the order
 *                     estimatedPickupDate:
 *                       type: string
 *                       format: date-time
 *                       description: Expected pickup date from seller
 *     responses:
 *       200:
 *         description: Orders marked as paid successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 totalAmount:
 *                   type: number
 *                 totalShippingFee:
 *                   type: number
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       paid:
 *                         type: boolean
 *                       paymentInfo:
 *                         type: object
 *                       shipping:
 *                         type: object
 *       400:
 *         description: Invalid request or order validation failed
 *       404:
 *         description: One or more orders not found
 *       500:
 *         description: Server error
 */
router.post('/mark-as-paid', authMiddleware.verifyToken, orderController.markAsPaid);






/**
 * @swagger
 * /api/order/buyer/{buyerId}:
 *   get:
 *     summary: Get all orders for a buyer
 *     description: Retrieves all orders associated with a specific buyer
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/buyer/:buyerId', authMiddleware.verifyToken, orderController.getOrdersForBuyer);

/**
 * @swagger
 * /api/order/seller/{sellerId}:
 *   get:
 *     summary: Get all orders for a seller
 *     description: Retrieves all orders associated with a specific seller
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
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/seller/:sellerId', authMiddleware.verifyToken, orderController.getOrdersForSeller);






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

// /**
//  * @swagger
//  * /api/order/bulk-update:
//  *   put:
//  *     summary: Bulk update orders
//  *     description: Updates multiple orders in bulk
//  *     tags: [Order]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - orderIds
//  *               - update
//  *             properties:
//  *               orderIds:
//  *                 type: array
//  *                 items:
//  *                   type: string
//  *               update:
//  *                 type: object
//  *     responses:
//  *       200:
//  *         description: Orders updated successfully
//  *       400:
//  *         description: Invalid request body
//  *       401:
//  *         description: Unauthorized
//  *       403:
//  *         description: Forbidden
//  *       500:
//  *         description: Server error
//  */
// router.put('/bulk-update', authMiddleware.verifyToken, orderController.bulkUpdateOrders);

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
router.post('/:orderId/note', authMiddleware.verifyToken, orderController.addNote);

/**
 * @swagger
 * /api/order/{orderId}:
 *   get:
 *     summary: Get detailed information about a specific order
 *     description: Retrieves comprehensive information about an order including items, shipping, payment, and tracking details
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to retrieve
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         $ref: '#/components/schemas/Product'
 *                       seller:
 *                         $ref: '#/components/schemas/Seller'
 *                       quantity:
 *                         type: number
 *                       price:
 *                         type: number
 *                       status:
 *                         type: string
 *                 shipping:
 *                   type: object
 *                   properties:
 *                     tracking:
 *                       type: object
 *                     carrier:
 *                       type: object
 *                     status:
 *                       type: string
 *                 timeline:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User doesn't have access to this order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/:orderId', authMiddleware.verifyToken, orderController.getOrderDetails);

/**
 * @swagger
 * /api/order/{orderId}/arrange-pickup:
 *   post:
 *     summary: Arrange pickup for an order's shipment
 *     description: Allows sellers to arrange pickup for a paid order using Terminal Africa's shipping service
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
 *               - rate_id
 *               - shipment_id
 *             properties:
 *               rate_id:
 *                 type: string
 *                 description: Unique reference of selected rate
 *               shipment_id:
 *                 type: string
 *                 description: Unique ID of existing draft shipment
 *               purchase_insurance:
 *                 type: boolean
 *                 description: Optional - Indicate if insurance coverage should be provided
 *                 default: false
 *     responses:
 *       200:
 *         description: Pickup arranged successfully
 *       400:
 *         description: Invalid request or order not in correct state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the seller of this order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/arrange-pickup', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  orderController.arrangePickup
);

/**
 * @swagger
 * /api/order/test-webhook:
 *   post:
 *     summary: Test webhook for shipment events
 *     description: Triggers test webhook events for shipment status updates. This endpoint is public and can be used for testing purposes.
 *     tags: [Order]
 *     responses:
 *       200:
 *         description: Test webhook events triggered successfully
 *       500:
 *         description: Server error
 */
router.post('/test-webhook', orderController.testShipmentWebhook);

module.exports = router;