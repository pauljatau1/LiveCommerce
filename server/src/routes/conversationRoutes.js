const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatSettings:
 *       type: object
 *       properties:
 *         isBlocked:
 *           type: boolean
 *           description: Whether the conversation is blocked
 *         isMuted:
 *           type: boolean
 *           description: Whether notifications are muted for this conversation
 *         blockedBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the user who blocked the conversation
 *         mutedBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the user who muted the conversation
 *     Participant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         model:
 *           type: string
 *           enum: [Buyer, Seller]
 *         name:
 *           type: string
 *         avatar:
 *           type: string
 *           nullable: true
 *         location:
 *           type: object
 *           properties:
 *             country:
 *               type: string
 *               nullable: true
 *             city:
 *               type: string
 *               nullable: true
 *         verified:
 *           type: boolean
 *         isOnline:
 *           type: boolean
 *           description: Whether the participant is currently online
 *         lastActive:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp of when the participant was last active
 *         settings:
 *           $ref: '#/components/schemas/ChatSettings'
 *     LastMessage:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *         sender:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             model:
 *               type: string
 *               enum: [Buyer, Seller]
 *         messageType:
 *           type: string
 *           enum: [text, image, video, audio, product, order]
 *         createdAt:
 *           type: string
 *           format: date-time
 *     Conversation:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         participant:
 *           $ref: '#/components/schemas/Participant'
 *         lastMessage:
 *           $ref: '#/components/schemas/LastMessage'
 *         unreadCount:
 *           type: integer
 *           minimum: 0
 *         settings:
 *           $ref: '#/components/schemas/ChatSettings'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Message:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         content:
 *           type: string
 *         sender:
 *           allOf:
 *             - $ref: '#/components/schemas/Participant'
 *             - type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 model:
 *                   type: string
 *                   enum: [Buyer, Seller]
 *         messageType:
 *           type: string
 *           enum: [text, image, video, audio, product]
 *         isRead:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/conversations/blocked-users:
 *   get:
 *     summary: Get list of blocked users
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of blocked users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 blockedUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       userType:
 *                         type: string
 *                         enum: [Buyer, Seller]
 *                       profileImage:
 *                         type: string
 *                         nullable: true
 *       500:
 *         description: Server error
 */
router.get('/blocked-users', authMiddleware.verifyToken, conversationController.getBlockedUsers);

/**
 * @swagger
 * /api/conversations/unread/count:
 *   get:
 *     summary: Get total unread messages count for the logged in user
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total unread messages count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUnreadCount:
 *                   type: integer
 *                   minimum: 0
 *                   description: Total count of unread messages across all conversations
 *       500:
 *         description: Server error
 */
router.get('/unread/count', authMiddleware.verifyToken, conversationController.getTotalUnreadCount);

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get all conversations for the current user
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of conversations per page
 *     responses:
 *       200:
 *         description: List of conversations with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Conversation'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalConversations:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware.verifyToken, conversationController.getConversations);

/**
 * @swagger
 * /api/conversations/{conversationId}:
 *   get:
 *     summary: Get a specific conversation with messages
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
 *         description: Conversation details with messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversation:
 *                   $ref: '#/components/schemas/Conversation'
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       content:
 *                         type: string
 *                       messageType:
 *                         type: string
 *                         enum: [text, image, video, audio, product, order]
 *                       sender:
 *                         $ref: '#/components/schemas/Participant'
 *                       isRead:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Conversation marked as read
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Server error
 */
router.put('/:conversationId/read', authMiddleware.verifyToken, conversationController.markConversationAsRead);

/**
 * @swagger
 * /api/conversations/{conversationId}/block:
 *   put:
 *     summary: Block a user in a conversation
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
 *         description: User blocked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User blocked successfully
 *                 settings:
 *                   $ref: '#/components/schemas/ChatSettings'
 *       404:
 *         description: Conversation or participant not found
 *       500:
 *         description: Server error
 */
router.put('/:conversationId/block', authMiddleware.verifyToken, conversationController.blockUser);

/**
 * @swagger
 * /api/conversations/{conversationId}/unblock:
 *   put:
 *     summary: Unblock a user in a conversation
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
 *         description: User unblocked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User unblocked successfully
 *                 settings:
 *                   $ref: '#/components/schemas/ChatSettings'
 *       404:
 *         description: Conversation or participant not found
 *       500:
 *         description: Server error
 */
router.put('/:conversationId/unblock', authMiddleware.verifyToken, conversationController.unblockUser);

/**
 * @swagger
 * /api/conversations/{conversationId}/mute:
 *   put:
 *     summary: Mute notifications for a conversation
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
 *         description: Conversation muted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Conversation muted successfully
 *                 settings:
 *                   $ref: '#/components/schemas/ChatSettings'
 *       404:
 *         description: Conversation or participant not found
 *       500:
 *         description: Server error
 */
router.put('/:conversationId/mute', authMiddleware.verifyToken, conversationController.muteConversation);

/**
 * @swagger
 * /api/conversations/{conversationId}/unmute:
 *   put:
 *     summary: Unmute notifications for a conversation
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
 *         description: Conversation unmuted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Conversation unmuted successfully
 *                 settings:
 *                   $ref: '#/components/schemas/ChatSettings'
 *       404:
 *         description: Conversation or participant not found
 *       500:
 *         description: Server error
 */
router.put('/:conversationId/unmute', authMiddleware.verifyToken, conversationController.unmuteConversation);

module.exports = router;
