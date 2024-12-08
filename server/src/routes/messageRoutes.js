const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a text message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipientId:
 *                 type: string
 *               recipientModel:
 *                 type: string
 *                 enum: [Buyer, Seller]
 *               content:
 *                 type: string
 */
router.post('/', authMiddleware.verifyToken, messageController.sendTextMessage);

/**
 * @swagger
 * /api/messages/media:
 *   post:
 *     summary: Send a media message (image/video/file)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               recipientId:
 *                 type: string
 *               recipientModel:
 *                 type: string
 *                 enum: [Buyer, Seller]
 *               messageType:
 *                 type: string
 *                 enum: [image, video, file]
 *               content:
 *                 type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 */
router.post('/media', 
  authMiddleware.verifyToken, 
  upload.array('media', 5),
  messageController.sendMediaMessage
);

/**
 * @swagger
 * /api/messages/mark-read:
 *   put:
 *     summary: Mark messages as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageIds:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.put('/mark-read', authMiddleware.verifyToken, messageController.markMessagesAsRead);

/**
 * @swagger
 * /api/messages/{conversationId}:
 *   get:
 *     summary: Get messages in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the conversation
 *     responses:
 *       200:
 *         description: Messages fetched successfully
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */
router.get('/:conversationId', authMiddleware.verifyToken, messageController.getMessages);

/**
 * @swagger
 * /api/messages/{messageId}/deliver:
 *   put:
 *     summary: Mark a message as delivered
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message marked as delivered
 *       404:
 *         description: Message not found or already delivered
 */
router.put('/:messageId/deliver', 
  authMiddleware.verifyToken, 
  messageController.markMessageDelivered
);

/**
 * @swagger
 * /api/messages/unread/count:
 *   get:
 *     summary: Get total unread messages count
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread messages count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: number
 */
router.get('/unread/count', 
  authMiddleware.verifyToken, 
  messageController.getUnreadCount
);

module.exports = router;
