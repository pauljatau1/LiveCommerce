const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderControllerv2');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/v2/order:
 *   post:
 *     summary: Create new order(s) with Terminal Africa shipping
 *     description: Creates orders for multiple items, potentially from different sellers, with shipping through Terminal Africa
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
 *               - paymentMethod
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - price
 *                   properties:
 *                     productId:
 *                       type: string
 *                       description: ID of the product
 *                     quantity:
 *                       type: number
 *                       description: Quantity of the product
 *                     price:
 *                       type: number
 *                       description: Price of the product
 *                     weight:
 *                       type: number
 *                       description: Weight of the item in kg
 *                     specifications:
 *                       type: object
 *                       properties:
 *                         color:
 *                           type: string
 *                         size:
 *                           type: string
 *                         material:
 *                           type: string
 *                     seller:
 *                       type: object
 *                       description: Seller-specific information for this item
 *                       properties:
 *                         sellerId:
 *                           type: string
 *                           description: ID of the seller (if different from product's seller)
 *                         senderInfo:
 *                           type: object
 *                           description: Sender information specific to this seller
 *                           properties:
 *                             senderName:
 *                               type: string
 *                               description: Name of the sender/seller
 *                             senderAddress:
 *                               type: string
 *                               description: Address of the sender/seller
 *                             senderPhone:
 *                               type: string
 *                               description: Phone number of the sender/seller
 *                             senderEmail:
 *                               type: string
 *                               description: Email of the sender/seller
 *                             pickUpState:
 *                               type: string
 *                               description: State for pickup (must be one of the 36 states or FCT)
 *                         shippingFee:
 *                           type: number
 *                           description: Specific shipping fee for this seller's items
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - recipientName
 *                   - recipientPhone
 *                   - recipientAddress
 *                   - recipientState
 *                 properties:
 *                   recipientName:
 *                     type: string
 *                     description: Full name of the recipient
 *                   recipientPhone:
 *                     type: string
 *                     description: Phone number of the recipient
 *                   recipientEmail:
 *                     type: string
 *                     description: Email of the recipient
 *                   recipientAddress:
 *                     type: string
 *                     description: Delivery address
 *                   recipientState:
 *                     type: string
 *                     description: State of delivery (must be one of the 36 states or FCT)
 *                   recipientCity:
 *                     type: string
 *                     description: City of delivery
 *                   recipientZip:
 *                     type: string
 *                     description: ZIP/Postal code of delivery address
 *               senderInfo:
 *                 type: object
 *                 description: Default sender information (used if not specified at item level)
 *                 properties:
 *                   senderName:
 *                     type: string
 *                     description: Name of the sender/seller
 *                   senderAddress:
 *                     type: string
 *                     description: Address of the sender/seller
 *                   senderPhone:
 *                     type: string
 *                     description: Phone number of the sender/seller
 *                   senderEmail:
 *                     type: string
 *                     description: Email of the sender/seller
 *                   pickUpState:
 *                     type: string
 *                     description: State for pickup (must be one of the 36 states or FCT)
 *               paymentMethod:
 *                 type: string
 *                 enum: [paystack, card, bank_transfer, wallet]
 *                 description: Payment method for the order
 *               isItemCod:
 *                 type: boolean
 *                 description: Whether the item is to be paid for on delivery (Cash on Delivery)
 *                 default: false
 *               shippingFee:
 *                 type: number
 *                 description: Global shipping fee to be distributed among sellers
 *               additionalDetails:
 *                 type: string
 *                 description: Additional details like landmarks or extra contact information
 *               pickUpDate:
 *                 type: string
 *                 format: date
 *                 description: Requested date for pickup from seller
 *               paidFromWallet:
 *                 type: boolean
 *                 description: Whether to pay for the order using the buyer's wallet balance
 *                 default: false
 *               isWalletCredit:
 *                 type: boolean
 *                 description: Whether to use available wallet balance before charging payment method
 *                 default: false
 *               isStorePickup:
 *                 type: boolean
 *                 description: Whether the order is for store pickup instead of delivery
 *                 default: false
 *               shipmentPurpose:
 *                 type: string
 *                 enum: [commercial, personal, gift, return, repair]
 *                 description: Purpose of the shipment for Terminal Africa
 *                 default: commercial
 *     responses:
 *       201:
 *         description: Orders created successfully with shipping details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Orders created successfully with Terminal Africa shipping
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       orderId:
 *                         type: string
 *                         description: MongoDB ID of the order
 *                       order_id:
 *                         type: string
 *                         description: Human-readable order ID
 *                       seller:
 *                         type: string
 *                         description: ID of the seller
 *                       items:
 *                         type: number
 *                         description: Number of items in the order
 *                       itemsTotal:
 *                         type: number
 *                         description: Total cost of items (excluding shipping)
 *                       shippingFee:
 *                         type: number
 *                         description: Shipping fee for this order
 *                       orderTotal:
 *                         type: number
 *                         description: Total cost including shipping
 *                       terminalShipmentId:
 *                         type: string
 *                         description: Terminal Africa shipment ID
 *                 totals:
 *                   type: object
 *                   properties:
 *                     itemsTotal:
 *                       type: number
 *                       description: Total cost of all items
 *                     shippingTotal:
 *                       type: number
 *                       description: Total shipping fees
 *                     grandTotal:
 *                       type: number
 *                       description: Grand total (items + shipping)
 *                     orderCount:
 *                       type: number
 *                       description: Number of orders created
 *                     sellerEarnings:
 *                       type: number
 *                       description: Total earnings for sellers (excluding shipping)
 *                     shippingCost:
 *                       type: number
 *                       description: Total shipping cost
 *                     walletAmountUsed:
 *                       type: number
 *                       description: Amount deducted from wallet (if applicable)
 *                     paystackAmount:
 *                       type: number
 *                       description: Amount to be paid via Paystack (if applicable)
 *                 terminalShipments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       orderId:
 *                         type: string
 *                         description: Order ID associated with this shipment
 *                       shipmentId:
 *                         type: string
 *                         description: Terminal Africa shipment ID
 *                       status:
 *                         type: boolean
 *                         description: Whether the shipment was created successfully
 *       400:
 *         description: Invalid request body or validation failed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error or order creation failed
 */
router.post('/', authMiddleware.verifyToken, orderController.createOrder);

/**
 * @swagger
 * /api/v2/order/{orderId}/rates:
 *   get:
 *     summary: Get shipping rates for an order
 *     description: Retrieves available shipping rates from Terminal Africa for a specific order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the order
 *     responses:
 *       200:
 *         description: Shipping rates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Shipping rates retrieved successfully
 *                 order_id:
 *                   type: string
 *                   description: Human-readable order ID
 *                 shipment_id:
 *                   type: string
 *                   description: Terminal Africa shipment ID
 *                 rates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       amount:
 *                         type: number
 *                         description: Shipping rate amount
 *                       carrier_name:
 *                         type: string
 *                         description: Name of the carrier
 *                       carrier_logo:
 *                         type: string
 *                         description: URL to carrier logo
 *                       carrier_rate_description:
 *                         type: string
 *                         description: Description of the rate
 *                       delivery_eta:
 *                         type: number
 *                         description: Estimated delivery time in minutes
 *                       delivery_time:
 *                         type: string
 *                         description: Human-readable delivery time estimate
 *                       pickup_eta:
 *                         type: number
 *                         description: Estimated pickup time in minutes
 *                       pickup_time:
 *                         type: string
 *                         description: Human-readable pickup time estimate
 *                       rate_id:
 *                         type: string
 *                         description: ID of the rate
 *       400:
 *         description: Invalid order ID or order does not have a valid shipment
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error or failed to retrieve rates from Terminal Africa
 */
router.get('/:orderId/rates', authMiddleware.verifyToken, orderController.getOrderRates);

/**
 * @swagger
 * /api/v2/order/{orderId}/select-carrier:
 *   post:
 *     summary: Select a carrier for an order
 *     description: Updates an order with the selected carrier and shipping rate information
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rate_id
 *               - amount
 *               - carrier_name
 *               - carrier_reference
 *             properties:
 *               rate_id:
 *                 type: string
 *                 description: Terminal Africa rate ID
 *               amount:
 *                 type: number
 *                 description: Shipping rate amount
 *               carrier_name:
 *                 type: string
 *                 description: Name of the carrier
 *               carrier_reference:
 *                 type: string
 *                 description: Reference ID of the carrier
 *               carrier_logo:
 *                 type: string
 *                 description: URL to carrier logo
 *               carrier_rate_description:
 *                 type: string
 *                 description: Description of the rate
 *               delivery_time:
 *                 type: string
 *                 description: Human-readable delivery time estimate
 *               pickup_time:
 *                 type: string
 *                 description: Human-readable pickup time estimate
 *               delivery_eta:
 *                 type: number
 *                 description: Estimated delivery time in minutes
 *               pickup_eta:
 *                 type: number
 *                 description: Estimated pickup time in minutes
 *               delivery_date:
 *                 type: string
 *                 format: date-time
 *                 description: Estimated delivery date
 *               pickup_date:
 *                 type: string
 *                 format: date-time
 *                 description: Estimated pickup date
 *     responses:
 *       200:
 *         description: Carrier selected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Carrier selected successfully
 *                 order_id:
 *                   type: string
 *                   description: Human-readable order ID
 *                 shipment_id:
 *                   type: string
 *                   description: Terminal Africa shipment ID
 *                 carrier:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Name of the carrier
 *                     reference:
 *                       type: string
 *                       description: Reference ID of the carrier
 *                     rate_id:
 *                       type: string
 *                       description: Terminal Africa rate ID
 *                     amount:
 *                       type: number
 *                       description: Shipping rate amount
 *                     delivery_time:
 *                       type: string
 *                       description: Human-readable delivery time estimate
 *                     pickup_time:
 *                       type: string
 *                       description: Human-readable pickup time estimate
 *       400:
 *         description: Invalid request body or invalid order
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/select-carrier', authMiddleware.verifyToken, orderController.selectCarrier);

/**
 * @swagger
 * /api/v2/order/{orderId}/arrange-shipment:
 *   post:
 *     summary: Arrange shipment pickup with Terminal Africa
 *     description: Calls Terminal Africa to arrange pickup for an order and updates tracking information
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rate_id
 *             properties:
 *               rate_id:
 *                 type: string
 *                 description: Terminal Africa rate ID to use for arranging pickup
 *     responses:
 *       200:
 *         description: Shipment arranged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Shipment arranged successfully
 *                 order_id:
 *                   type: string
 *                   description: Human-readable order ID
 *                 shipment_id:
 *                   type: string
 *                   description: Terminal Africa shipment ID
 *                 tracking:
 *                   type: object
 *                   properties:
 *                     number:
 *                       type: string
 *                       description: Tracking number
 *                     url:
 *                       type: string
 *                       description: Tracking URL
 *                     carrier_url:
 *                       type: string
 *                       description: Carrier-specific tracking URL
 *                 documents:
 *                   type: object
 *                   properties:
 *                     shipping_label:
 *                       type: string
 *                       description: URL to shipping label
 *                     commercial_invoice:
 *                       type: string
 *                       description: URL to commercial invoice
 *       400:
 *         description: Invalid request body or order does not have a valid shipment
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error or failed to arrange shipment with Terminal Africa
 */
router.post('/:orderId/arrange-shipment', authMiddleware.verifyToken, orderController.arrangeShipment);

/**
 * @swagger
 * /api/v2/order/{orderId}/cancel-by-seller:
 *   post:
 *     summary: Cancel order by seller
 *     description: Allows a seller to cancel their order. Cancels the shipment with Terminal Africa and handles refunds appropriately.
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the order
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancelling the order
 *                 example: Out of stock
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order cancelled successfully
 *                 order:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: MongoDB ID of the order
 *                     order_id:
 *                       type: string
 *                       description: Human-readable order ID
 *                     isOpen:
 *                       type: boolean
 *                       description: Whether the order is still open
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                             description: Status of the item
 *                           statusHistory:
 *                             type: array
 *                             description: History of status changes
 *                     shipping:
 *                       type: object
 *                       properties:
 *                         tracking:
 *                           type: object
 *                           description: Shipping tracking information
 *                     refundRequest:
 *                       type: object
 *                       description: Refund request details if applicable
 *                     closedAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the order was closed
 *                     closedBy:
 *                       type: string
 *                       description: Who closed the order
 *                     closedReason:
 *                       type: string
 *                       description: Reason for closing the order
 *                 walletRefunded:
 *                   type: boolean
 *                   description: Whether wallet funds were refunded
 *                 walletRefundAmount:
 *                   type: number
 *                   description: Amount refunded to wallet
 *       400:
 *         description: Order cannot be cancelled or is already cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to cancel this order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/cancel-by-seller', authMiddleware.verifyToken, orderController.cancelOrderBySeller);

/**
 * @swagger
 * /api/v2/order/{orderId}/cancel-by-buyer:
 *   post:
 *     summary: Cancel order by buyer
 *     description: Allows a buyer to cancel their order. Only pending orders can be cancelled by buyers. Cancels the shipment with Terminal Africa and handles refunds appropriately.
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the order
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancelling the order
 *                 example: Changed my mind
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order cancelled successfully
 *                 order:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: MongoDB ID of the order
 *                     order_id:
 *                       type: string
 *                       description: Human-readable order ID
 *                     isOpen:
 *                       type: boolean
 *                       description: Whether the order is still open
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                             description: Status of the item
 *                           statusHistory:
 *                             type: array
 *                             description: History of status changes
 *                     shipping:
 *                       type: object
 *                       properties:
 *                         tracking:
 *                           type: object
 *                           description: Shipping tracking information
 *                     refundRequest:
 *                       type: object
 *                       description: Refund request details if applicable
 *                     closedAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the order was closed
 *                     closedBy:
 *                       type: string
 *                       description: Who closed the order
 *                     closedReason:
 *                       type: string
 *                       description: Reason for closing the order
 *                 walletRefunded:
 *                   type: boolean
 *                   description: Whether wallet funds were refunded
 *                 walletRefundAmount:
 *                   type: number
 *                   description: Amount refunded to wallet
 *       400:
 *         description: Order cannot be cancelled or is already cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to cancel this order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/cancel-by-buyer', authMiddleware.verifyToken, orderController.cancelOrderByBuyer);

/**
 * @swagger
 * /api/v2/order/{orderId}/mark-paid:
 *   post:
 *     summary: Mark Terminal Africa order as paid (Admin/Manual)
 *     description: Manually mark a Terminal Africa order as paid using transaction ID or payment reference
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *                 description: Paystack transaction ID
 *               paymentReference:
 *                 type: string
 *                 description: Paystack payment reference to verify
 *               manualNote:
 *                 type: string
 *                 description: Optional manual note for the payment
 *             oneOf:
 *               - required: [transactionId]
 *               - required: [paymentReference]
 *     responses:
 *       200:
 *         description: Order marked as paid successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Terminal Africa order marked as paid successfully
 *                 order:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: MongoDB ID of the order
 *                     order_id:
 *                       type: string
 *                       description: Human-readable order ID
 *                     paid:
 *                       type: boolean
 *                       description: Whether the order is paid
 *                     paymentInfo:
 *                       type: object
 *                       description: Payment information
 *                 orders:
 *                   type: array
 *                   description: Array of related orders that were also marked as paid (if applicable)
 *       400:
 *         description: Invalid request or order already paid or payment verification failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:id/mark-paid', authMiddleware.verifyToken, orderController.markOrderAsPaid);

/**
 * @swagger
 * /api/v2/order/verify-payment:
 *   post:
 *     summary: Verify Paystack payment by reference
 *     description: Verify a Paystack payment reference and optionally mark an order as paid
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
 *               - reference
 *             properties:
 *               reference:
 *                 type: string
 *                 description: Paystack payment reference to verify
 *               orderId:
 *                 type: string
 *                 description: Optional order ID to mark as paid if verification succeeds
 *     responses:
 *       200:
 *         description: Payment verification successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment verified and Terminal Africa order marked as paid
 *                 order:
 *                   type: object
 *                   description: Order details (if orderId was provided)
 *                 verificationDetails:
 *                   type: object
 *                   description: Paystack verification response data
 *       400:
 *         description: Invalid request or payment verification failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found (if orderId was provided)
 *       500:
 *         description: Server error
 */
router.post('/verify-payment', authMiddleware.verifyToken, orderController.verifyPaymentByReference);

/**
 * @swagger
 * /api/v2/order/paystack-webhook:
 *   post:
 *     summary: Handle Paystack webhook events
 *     description: Webhook endpoint for Paystack payment notifications for Terminal Africa orders
 *     tags: [Order]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Paystack webhook payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Terminal Africa payment processed successfully
 *       400:
 *         description: Invalid webhook signature
 */
router.post('/paystack-webhook', orderController.handlePaystackWebhook);

/**
 * @swagger
 * /api/v2/order/terminal-webhook:
 *   post:
 *     summary: Handle Terminal Africa webhook events
 *     description: Webhook endpoint for Terminal Africa shipping notifications
 *     tags: [Order]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 description: Terminal Africa event type
 *               data:
 *                 type: object
 *                 description: Event data payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature or data
 *       500:
 *         description: Server error
 */
router.post('/terminal-webhook', orderController.handleTerminalWebhook);

/**
 * @swagger
 * /api/v2/order/webhooks:
 *   post:
 *     summary: Create a Terminal Africa webhook
 *     description: Create a new webhook for Terminal Africa events
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
 *               - name
 *               - active
 *               - events
 *               - live
 *               - url
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the webhook
 *                 example: "Order Status Updates"
 *               active:
 *                 type: boolean
 *                 description: Whether the webhook is active
 *                 example: true
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [packaging.created, packaging.updated, shipment.cancelled, shipment.created, shipment.in-transit, shipment.updated, shipment.delivered]
 *                 description: List of webhook event types
 *                 example: ["shipment.created", "shipment.delivered"]
 *               live:
 *                 type: boolean
 *                 description: Whether this is for live environment
 *                 example: false
 *               url:
 *                 type: string
 *                 description: Webhook endpoint URL
 *                 example: "https://yourdomain.com/webhooks/terminal"
 *     responses:
 *       201:
 *         description: Webhook created successfully
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
 *                   example: "Webhook created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     webhook_id:
 *                       type: string
 *                       description: Terminal Africa webhook ID
 *                     name:
 *                       type: string
 *                     active:
 *                       type: boolean
 *                     events:
 *                       type: array
 *                       items:
 *                         type: string
 *                     live:
 *                       type: boolean
 *                     url:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/webhooks', authMiddleware.verifyToken, orderController.createTerminalWebhook);

/**
 * @swagger
 * /api/v2/order/webhooks:
 *   get:
 *     summary: Get all Terminal Africa webhooks
 *     description: Retrieve list of all webhooks for Terminal Africa
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Webhooks retrieved successfully
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
 *                   example: "Webhooks retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     webhooks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           webhook_id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           active:
 *                             type: boolean
 *                           events:
 *                             type: array
 *                             items:
 *                               type: string
 *                           live:
 *                             type: boolean
 *                           url:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         perPage:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pageCount:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/webhooks', authMiddleware.verifyToken, orderController.getTerminalWebhooks);

/**
 * @swagger
 * /api/v2/order/webhooks/{webhook_id}:
 *   delete:
 *     summary: Delete a Terminal Africa webhook
 *     description: Delete an existing Terminal Africa webhook
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: webhook_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Terminal Africa webhook ID
 *         example: "WA-123456789"
 *     responses:
 *       200:
 *         description: Webhook deleted successfully
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
 *                   example: "Webhook deleted successfully"
 *       400:
 *         description: Invalid webhook ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Webhook not found
 *       500:
 *         description: Server error
 */
router.delete('/webhooks/:webhook_id', authMiddleware.verifyToken, orderController.deleteTerminalWebhook);

module.exports = router;
