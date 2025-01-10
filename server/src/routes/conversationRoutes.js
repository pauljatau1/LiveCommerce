const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get all conversations for the current user
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware.verifyToken, conversationController.getConversations);

/**
 * @swagger
 * /api/conversations/{conversationId}:
 *   get:
 *     summary: Get a specific conversation
 *     tags: [Conversations]
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
 *         description: Conversation details
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Server error
 */
router.get('/:conversationId', authMiddleware.verifyToken, conversationController.getConversation);

/**
 * @swagger
 * /api/conversations/{conversationId}/read:
 *   put:
 *     summary: Mark conversation as read
 *     tags: [Conversations]
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
 *         description: Conversation marked as read
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Server error
 */
router.put('/:conversationId/read', authMiddleware.verifyToken, conversationController.markConversationAsRead);

module.exports = router;
