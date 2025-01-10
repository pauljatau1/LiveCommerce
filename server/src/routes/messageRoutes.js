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
 *             required:
 *               - recipientId
 *               - recipientModel
 *               - content
 *             properties:
 *               recipientId:
 *                 type: string
 *               recipientModel:
 *                 type: string
 *                 enum: [Buyer, Seller]
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware.verifyToken, messageController.sendTextMessage);

/**
 * @swagger
 * /api/messages/media:
 *   post:
 *     summary: Send a media message
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
 *     responses:
 *       201:
 *         description: Media message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 mediaUrls:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid request or file upload error
 *       500:
 *         description: Server error
 */
router.post('/media', 
  authMiddleware.verifyToken,
  upload.array('media', 5),
  messageController.sendMediaMessage
);

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
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 *       500:
 *         description: Server error
 */
router.get('/:conversationId', authMiddleware.verifyToken, messageController.getMessages);

/**
 * @swagger
 * /api/messages/product:
 *   post:
 *     summary: Send a product message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - recipientModel
 *               - productId
 *             properties:
 *               recipientId:
 *                 type: string
 *                 description: ID of the message recipient
 *               recipientModel:
 *                 type: string
 *                 enum: [Buyer, Seller]
 *                 description: Type of recipient (Buyer or Seller)
 *               productId:
 *                 type: string
 *                 description: ID of the product to share
 *               content:
 *                 type: string
 *                 description: Optional message text to accompany the product
 *     responses:
 *       201:
 *         description: Product message sent successfully
 *       404:
 *         description: Product or recipient not found
 *       500:
 *         description: Server error
 */
router.post('/product',
  authMiddleware.verifyToken,
  messageController.sendProductMessage
);

module.exports = router;
