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
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/simulate-fez-webhook', 
  authMiddleware.verifyToken, 
  notificationController.simulateFezWebhook
);

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
 *     responses:
 *       200:
 *         description: List of notifications
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