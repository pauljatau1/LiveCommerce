const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

// First, add a special middleware for the order/:orderId route
// to handle refund-requests and other special routes
const handleSpecialOrderRoutes = (req, res, next) => {
  // List of special routes that should not be treated as order IDs
  const specialRoutes = ['refund-requests', 'buyer', 'seller', 'shipping-rates', 'export', 'revenue-analytics',
    'bulk-update', 'test-webhook', 'delivery-cost', 'track', 'delivery-time-estimate', 'paystack-webhook',
    'simple-mark-paid', 'verify-payment'];
  
  if (specialRoutes.includes(req.params.orderId)) {
    // This is a special route, not an order ID
    return res.status(404).json({
      message: `Route not found. You might be looking for /api/order/${req.params.orderId} (without orderId parameter)`
    });
  }
  
  // Continue to the actual order lookup
  next();
};

/**
 * @swagger
 * /api/order/refund-requests:
 *   get:
 *     summary: Get all refund requests (admin only)
 *     description: Retrieves a paginated list of all refund requests across the platform
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by refund request status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of requests per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by order ID
 *     responses:
 *       200:
 *         description: Refund requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refundRequests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       orderId:
 *                         type: string
 *                       orderNumber:
 *                         type: string
 *                       refundRequest:
 *                         type: object
 *                       buyer:
 *                         type: object
 *                       seller:
 *                         type: object
 *                       amount:
 *                         type: number
 *                       paymentMethod:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 *                     currentPage:
 *                       type: number
 *                     limit:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not an admin
 *       500:
 *         description: Server error
 */
router.get('/refund-requests', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  orderController.getRefundRequests
);

/**
 * @swagger
 * /api/order/{orderId}/process-refund:
 *   post:
 *     summary: Process a refund request (admin only)
 *     description: Approve or reject a refund request for a cancelled order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order with the refund request
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
 *                 description: Status to set for the refund request
 *               notes:
 *                 type: string
 *                 description: Optional notes about the decision
 *     responses:
 *       200:
 *         description: Refund request processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     order_id:
 *                       type: string
 *                     refundRequest:
 *                       type: object
 *       400:
 *         description: Invalid request or refund request already processed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/process-refund', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  orderController.processRefundRequest
);

/**
 * @swagger
 * /api/order:
 *   post:
 *     summary: Create new order(s) with Fez Delivery shipping
 *     description: Creates orders for multiple items, potentially from different sellers, with shipping through Fez Delivery
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
 *                         parcelInfo:
 *                           type: object
 *                           description: Parcel information specific to this seller's items
 *                           properties:
 *                             itemDescription:
 *                               type: string
 *                               description: Description of the items from this seller
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
 *               parcel:
 *                 type: object
 *                 description: Default parcel information (optional, can be specified at item level)
 *                 properties:
 *                   weight:
 *                     type: number
 *                     description: Default weight of the parcel in kg (if not specified at item level)
 *                   valueOfItem:
 *                     type: string
 *                     description: Default value of the items being shipped
 *                   itemDescription:
 *                     type: string
 *                     description: Default description of the items
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
 *                   example: Orders created successfully
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
 *                       fezOrderNo:
 *                         type: string
 *                         description: Fez Delivery order number
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
 *                       description: Total shipping cost (goes to Fez Delivery)
 *                 fezResponse:
 *                   type: object
 *                   description: Response from Fez Delivery API
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
 * /api/order/buyer/{buyerId}:
 *   get:
 *     summary: Get all orders for a buyer
 *     description: Retrieves all orders associated with a specific buyer with optional filters and pagination
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: trackingStatus
 *         schema:
 *           type: string
 *           enum: [Pending, Picked-Up, Dispatched, Delivered, Cancelled, Refunded]
 *         description: Filter orders by shipping tracking status (completely case-insensitive, accepts various formats like "picked-up", "pickedUp", "PICKED_UP", etc.)
 *       - in: query
 *         name: hasReturn
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter orders by whether they have return requests
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search orders by order_id or product name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of orders per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "-createdAt"
 *         description: Sort orders by field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Total number of orders matching the filters
 *                     pages:
 *                       type: number
 *                       description: Total number of pages
 *                     currentPage:
 *                       type: number
 *                       description: Current page number
 *                     limit:
 *                       type: number
 *                       description: Number of orders per page
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/buyer/:buyerId', authMiddleware.verifyToken, orderController.getOrdersForBuyer);

/**
 * @swagger
 * /api/order/buyer/{buyerId}/refunds:
 *   get:
 *     summary: Get refund requests for a buyer
 *     description: Retrieves all refund requests for a specific buyer with optional filtering by status
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the buyer (can only access own refunds unless admin)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by refund status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of refunds per page
 *     responses:
 *       200:
 *         description: Refund requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refundRequests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       orderId:
 *                         type: string
 *                       orderNumber:
 *                         type: string
 *                       refundRequest:
 *                         type: object
 *                       seller:
 *                         type: object
 *                       amount:
 *                         type: number
 *                       refundAmount:
 *                         type: number
 *                       status:
 *                         type: string
 *                       requestedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 *                     currentPage:
 *                       type: number
 *                     limit:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot access another buyer's refunds
 *       500:
 *         description: Server error
 */
router.get('/buyer/:buyerId/refunds', 
  authMiddleware.verifyToken, 
  orderController.getBuyerRefundRequests
);

/**
 * @swagger
 * /api/order/seller/{sellerId}:
 *   get:
 *     summary: Get all orders for a seller with pagination
 *     description: Retrieves paginated orders associated with a specific seller, with optional filters
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of orders per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filter orders by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders created after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders created before this date
 *       - in: query
 *         name: isOpen
 *         schema:
 *           type: boolean
 *         description: Filter by order open/closed status
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [marketplace, liveshow, auction]
 *         description: Filter by order channel
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "-createdAt"
 *         description: Sort orders by field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Total number of orders
 *                     pages:
 *                       type: number
 *                       description: Total number of pages
 *                     currentPage:
 *                       type: number
 *                       description: Current page number
 *                     limit:
 *                       type: number
 *                       description: Number of orders per page
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
router.get('/:orderId', 
  authMiddleware.verifyToken, 
  async (req, res, next) => {
    // Check if user is admin before proceeding
    const Admin = require('../models/Admin');
    try {
      const admin = await Admin.findById(req.user.id);
      if (admin) {
        req.user.role = 'admin';
      }
      next();
    } catch (error) {
      next();
    }
  },
  orderController.getOrderDetails
);

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

/**
 * @swagger
 * /api/order/{orderId}/close:
 *   post:
 *     summary: Close an order (buyer)
 *     description: Allows a buyer to close their order after confirming receipt
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order closed successfully
 *       403:
 *         description: Not authorized to close this order
 *       404:
 *         description: Order not found
 */
router.post('/:orderId/close', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  orderController.closeOrder
);

/**
 * @swagger
 * /api/order/{orderId}/open-status:
 *   put:
 *     summary: Update order open/closed status (admin only)
 *     description: Allows admin to close or reopen an order
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
 *               - isOpen
 *             properties:
 *               isOpen:
 *                 type: boolean
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       404:
 *         description: Order not found
 */
router.put('/:orderId/open-status', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  orderController.updateOrderOpenStatus
);

/**
 * @swagger
 * /api/order/{orderId}/cancel-shipment:
 *   post:
 *     summary: Cancel shipment for an order
 *     description: Cancels the shipment and updates order status. Only available before carrier pickup.
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to cancel shipment for
 *     responses:
 *       200:
 *         description: Shipment cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   type: object
 *                   properties:
 *                     shipping:
 *                       type: object
 *                       properties:
 *                         tracking:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                             history:
 *                               type: array
 *       400:
 *         description: Invalid request or shipment cannot be cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User doesn't have access to this order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/cancel-shipment', 
  authMiddleware.verifyToken, 
  orderController.cancelShipment
);

/**
 * @swagger
 * /api/order/delivery-cost:
 *   post:
 *     summary: Get delivery cost from Fez Delivery
 *     description: Fetches the cost of delivery based on destination state, pickup state, and weight
 *     tags: [Order]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               state:
 *                 type: string
 *                 description: The destination state to deliver to (if not provided, costs for all states will be returned)
 *               pickUpState:
 *                 type: string
 *                 description: The state from which the item is being shipped (optional)
 *               weight:
 *                 type: number
 *                 description: Weight of the parcel in kg (optional, defaults to 0-5kg range)
 *     responses:
 *       200:
 *         description: Delivery costs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Success"
 *                 description:
 *                   type: string
 *                   example: "Cost Fetched Successfully"
 *                 Cost:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       state:
 *                         type: string
 *                         example: "Lagos"
 *                       cost:
 *                         type: string
 *                         example: "900"
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error or Fez API error
 */
router.post('/delivery-cost', orderController.getDeliveryCost);

/**
 * @swagger
 * /api/order/track/{orderNo}:
 *   get:
 *     summary: Track an order using Fez Delivery
 *     description: Get tracking information for an order using the Fez Delivery API
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: orderNo
 *         required: true
 *         schema:
 *           type: string
 *         description: The Fez order number to track
 *     responses:
 *       200:
 *         description: Order tracking information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 tracking:
 *                   type: object
 *                   properties:
 *                     orderNo:
 *                       type: string
 *                       example: 1T7002122309
 *                     orderStatus:
 *                       type: string
 *                       example: Dispatched
 *                     recipientName:
 *                       type: string
 *                       example: John Doe
 *                     recipientAddress:
 *                       type: string
 *                       example: 123 Main St
 *                     recipientState:
 *                       type: string
 *                       example: Lagos
 *                     senderName:
 *                       type: string
 *                       example: KIDS PLACE
 *                     senderAddress:
 *                       type: string
 *                       example: 3A SULAIMON SHODERU STREET
 *                     createdAt:
 *                       type: string
 *                       example: 2023-12-02 06:14:09
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           orderStatus:
 *                             type: string
 *                             example: Dispatched
 *                           statusCreationDate:
 *                             type: string
 *                             example: 2023-12-02 13:14:40
 *                           statusDescription:
 *                             type: string
 *                             example: Your package is on its way to the delivery address
 *       400:
 *         description: Bad request, missing or invalid order number
 *       500:
 *         description: Server error
 */
router.get('/track/:orderNo', orderController.trackOrderFez);

/**
 * @swagger
 * /api/order/delivery-time-estimate:
 *   post:
 *     summary: Get estimated delivery time
 *     description: Get estimated delivery time for an order using the Fez Delivery API
 *     tags: [Order]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - delivery_type
 *               - pick_up_state
 *               - drop_off_state
 *             properties:
 *               delivery_type:
 *                 type: string
 *                 enum: [import, export, local]
 *                 description: Type of delivery (import, export, or local)
 *               pick_up_state:
 *                 type: string
 *                 description: State for pickup (must be a valid state in Nigeria)
 *               drop_off_state:
 *                 type: string
 *                 description: State for delivery (must be a valid state in Nigeria)
 *     responses:
 *       200:
 *         description: Delivery time estimate retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 estimate:
 *                   type: string
 *                   example: 2 - 5 day(s)
 *       400:
 *         description: Bad request, missing or invalid parameters
 *       500:
 *         description: Server error
 */
router.post('/delivery-time-estimate', orderController.getDeliveryTimeEstimate);

/**
 * @swagger
 * /api/order/{id}/mark-as-paid:
 *   patch:
 *     summary: Mark a Paystack order as paid
 *     description: Updates the payment status of a Paystack order from pending to paid. Can verify payment with Paystack using a reference.
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
 *               transactionId:
 *                 type: string
 *                 description: Paystack transaction ID
 *               paymentReference:
 *                 type: string
 *                 description: Paystack payment reference for verification
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
 *                 order:
 *                   type: object
 *                 verificationDetails:
 *                   type: object
 *                   description: Details from Paystack verification (if paymentReference was provided)
 *       400:
 *         description: Invalid order status or payment verification failed
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/mark-as-paid', authMiddleware.verifyToken, orderController.markOrderAsPaid);

/**
 * @swagger
 * /api/order/verify-payment:
 *   post:
 *     summary: Verify a Paystack payment by reference
 *     description: Verifies a payment with Paystack using the payment reference. Can optionally mark an order as paid if orderId is provided.
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
 *                 description: Paystack payment reference
 *               orderId:
 *                 type: string
 *                 description: Order ID to mark as paid (optional)
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
 *                 order:
 *                   type: object
 *                   description: Order details (if orderId was provided)
 *                 verificationDetails:
 *                   type: object
 *                   description: Details from Paystack verification
 *       400:
 *         description: Invalid request or payment verification failed
 *       404:
 *         description: Order not found (if orderId was provided)
 *       500:
 *         description: Server error
 */
router.post('/verify-payment', authMiddleware.verifyToken, orderController.verifyPaymentByReference);

/**
 * @swagger
 * /api/order/paystack-webhook:
 *   post:
 *     summary: Paystack webhook endpoint
 *     description: Receives and processes Paystack payment notifications
 *     tags: [Order]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid signature
 */
router.post('/paystack-webhook', orderController.handlePaystackWebhook);

/**
 * @swagger
 * /api/order/simple-mark-paid/{id}:
 *   post:
 *     summary: Simple method to mark an order as paid (fallback)
 *     description: A simplified endpoint to mark an order as paid without complex verification
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
 *               reference:
 *                 type: string
 *                 description: Payment reference
 *     responses:
 *       200:
 *         description: Order marked as paid successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/simple-mark-paid/:id', authMiddleware.verifyToken, orderController.simpleMarkPaid);

/**
 * @swagger
 * /api/order/{orderId}/cancel:
 *   post:
 *     summary: Cancel an order (seller only)
 *     description: Allows a seller to cancel their order that is in pending status
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to cancel
 *     requestBody:
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
 *                     order_id:
 *                       type: string
 *                     isOpen:
 *                       type: boolean
 *                     closedAt:
 *                       type: string
 *                       format: date-time
 *                     closedBy:
 *                       type: string
 *                     closedReason:
 *                       type: string
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           statusHistory:
 *                             type: array
 *                             items:
 *                               type: object
 *       400:
 *         description: Order cannot be cancelled (not in pending status)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to cancel this order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/cancel',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  orderController.cancelOrderBySeller
);

/**
 * @swagger
 * /api/order/{orderNo}/manifest-url:
 *   get:
 *     summary: Get manifest URL for an order from Fez Delivery
 *     description: Retrieves the manifest URL for a specific order using the Fez Delivery API
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNo
 *         required: true
 *         schema:
 *           type: string
 *         description: The Fez order number to get manifest URL for
 *     responses:
 *       200:
 *         description: Manifest URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 manifestUrl:
 *                   type: string
 *                   example: https://fezdelivery.co/manifest/123456.pdf
 *                 description:
 *                   type: string
 *                   example: Manifest URL retrieved successfully
 *       400:
 *         description: Bad request, missing or invalid order number
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *       500:
 *         description: Server error
 */
router.get('/:orderNo/manifest-url', authMiddleware.verifyToken, orderController.getManifestUrl);

module.exports = router;