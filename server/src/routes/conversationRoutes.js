const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
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
 *           enum: [text, image, video, audio, product]
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
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     participants:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Participant'
 *                           - type: object
 *                             properties:
 *                               id:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                   firstName:
 *                                     type: string
 *                                   lastName:
 *                                     type: string
 *                                   storeName:
 *                                     type: string
 *                                   profileImage:
 *                                     type: object
 *                                     properties:
 *                                       url:
 *                                         type: string
 *                                   storeAvatar:
 *                                     type: object
 *                                     properties:
 *                                       url:
 *                                         type: string
 *                     lastMessage:
 *                       $ref: '#/components/schemas/LastMessage'
 *                     unreadCount:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
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
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Server error
 */
router.put('/:conversationId/read', authMiddleware.verifyToken, conversationController.markConversationAsRead);

module.exports = router;
