const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for a seller
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', authMiddleware.verifyToken, notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications/unread:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notification count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/unread', authMiddleware.verifyToken, notificationController.getUnreadCount);

/**
 * @swagger
 * /api/notifications/{id}/mark-read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/mark-read', authMiddleware.verifyToken, notificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/mark-all-read', authMiddleware.verifyToken, notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/simulate-fez-webhook:
 *   post:
 *     summary: Simulate Fez Delivery order webhook events
 *     description: Test endpoint to simulate different order status webhook events from Fez Delivery
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderNumber
 *               - status
 *             properties:
 *               orderNumber:
 *                 type: string
 *                 description: Fez Delivery order number
 *                 example: "D0QR05032515"
 *               status:
 *                 type: string
 *                 enum: [Pending Pick-Up, Picked-Up, Dispatched, Delivered, Cancelled]
 *                 description: Order status to simulate
 *     responses:
 *       200:
 *         description: Webhook event simulated successfully
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/simulate-fez-webhook', notificationController.simulateFezWebhook);

/**
 * @swagger
 * /api/notifications/simulate-terminal-webhook:
 *   post:
 *     summary: Simulate Terminal Africa webhook events
 *     description: Test endpoint to simulate different Terminal Africa webhook events for shipments
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *               - shipment_id
 *             properties:
 *               event:
 *                 type: string
 *                 enum: [packaging.created, packaging.updated, shipment.cancelled, shipment.created, shipment.in-transit, shipment.updated, shipment.delivered]
 *                 description: Terminal Africa webhook event type
 *                 example: "shipment.delivered"
 *               shipment_id:
 *                 type: string
 *                 description: Terminal Africa shipment ID
 *                 example: "TS-123456789"
 *               tracking_number:
 *                 type: string
 *                 description: Optional tracking number
 *                 example: "TN-987654321"
 *               carrier:
 *                 type: string
 *                 description: Optional carrier name
 *                 example: "DHL"
 *               delivery_date:
 *                 type: string
 *                 format: date-time
 *                 description: Optional delivery date for delivered events
 *     responses:
 *       200:
 *         description: Terminal webhook event simulated successfully
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/simulate-terminal-webhook', notificationController.simulateTerminalWebhook2);

// Test webhook logging endpoint
router.post('/test-webhook-logging', notificationController.testWebhookLogging);

/**
 * @swagger
 * /api/notifications/webhook-logs:
 *   get:
 *     summary: Get webhook request logs
 *     description: Retrieve logged webhook requests with filtering and pagination
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: endpoint
 *         schema:
 *           type: string
 *         description: Filter by endpoint URL (partial match)
 *         example: "simulate-terminal-webhook"
 *       - in: query
 *         name: success
 *         schema:
 *           type: boolean
 *         description: Filter by success status
 *         example: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *         example: 20
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date (ISO 8601)
 *         example: "2025-01-01T00:00:00.000Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to date (ISO 8601)
 *         example: "2025-12-31T23:59:59.999Z"
 *     responses:
 *       200:
 *         description: Webhook logs retrieved successfully
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
 *                   example: "Webhook logs retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           endpoint:
 *                             type: string
 *                           method:
 *                             type: string
 *                           headers:
 *                             type: object
 *                           body:
 *                             type: object
 *                           response:
 *                             type: object
 *                           success:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalCount:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       500:
 *         description: Server error
 */
router.get('/webhook-logs', notificationController.getWebhookLogs);

/**
 * @swagger
 * /api/notifications/webhook-stats:
 *   get:
 *     summary: Get webhook request statistics
 *     description: Retrieve statistical information about webhook requests
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: endpoint
 *         schema:
 *           type: string
 *         description: Filter by endpoint URL (partial match)
 *         example: "simulate-terminal-webhook"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date (ISO 8601)
 *         example: "2025-01-01T00:00:00.000Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to date (ISO 8601)
 *         example: "2025-12-31T23:59:59.999Z"
 *     responses:
 *       200:
 *         description: Webhook statistics retrieved successfully
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
 *                   example: "Webhook statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRequests:
 *                       type: integer
 *                       example: 150
 *                     successfulRequests:
 *                       type: integer
 *                       example: 140
 *                     failedRequests:
 *                       type: integer
 *                       example: 10
 *                     successRate:
 *                       type: string
 *                       example: "93.33"
 *                     averageResponseTime:
 *                       type: integer
 *                       example: 245
 *                     statusCodeDistribution:
 *                       type: object
 *                       example: { "200": 140, "400": 5, "500": 5 }
 *       500:
 *         description: Server error
 */
router.get('/webhook-stats', notificationController.getWebhookStats);

/**
 * @swagger
 * /api/notifications/buyer:
 *   get:
 *     summary: Get all notifications for a buyer
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, orders, posts]
 *         description: Filter notifications by type
 *         example: "all"
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalNotifications:
 *                   type: integer
 *                 filter:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/buyer', authMiddleware.verifyToken, notificationController.getBuyerNotifications);

/**
 * @swagger
 * /api/notifications/buyer/{id}/mark-read:
 *   put:
 *     summary: Mark a buyer notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.put('/buyer/:id/mark-read', authMiddleware.verifyToken, notificationController.markBuyerNotificationAsRead);

/**
 * @swagger
 * /api/notifications/buyer/mark-all-read:
 *   put:
 *     summary: Mark all buyer notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/buyer/mark-all-read', authMiddleware.verifyToken, notificationController.markAllBuyerNotificationsAsRead);

module.exports = router;