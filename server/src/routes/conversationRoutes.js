const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get all conversations for a user
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversations fetched successfully
 *       500:
 *         description: Internal server error
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
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the conversation
 *     responses:
 *       200:
 *         description: Conversation fetched successfully
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */
router.get('/:conversationId', authMiddleware.verifyToken, conversationController.getConversation);

module.exports = router;
