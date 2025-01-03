const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/streams/create:
 *   post:
 *     summary: Create a new live stream auction
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 required: true
 *               description:
 *                 type: string
 *               coverImage:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *                 required: true
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     minBid:
 *                       type: number
 *                     maxBid:
 *                       type: number
 *               scheduledStartTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Stream created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/create', 
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  upload.single('coverImage'),
  streamController.createStream
);

/**
 * @swagger
 * /api/streams/{streamId}/start:
 *   post:
 *     summary: Start a scheduled stream
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stream started successfully
 *       400:
 *         description: Stream cannot be started
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Stream not found
 */
router.post('/:streamId/start',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  streamController.startStream
);

/**
 * @swagger
 * /api/streams/{streamId}/end:
 *   post:
 *     summary: End an active stream
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stream ended successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Stream not found
 */
router.post('/:streamId/end',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  streamController.endStream
);

/**
 * @swagger
 * /api/streams/bid:
 *   post:
 *     summary: Place a bid on a product in an active stream
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               streamId:
 *                 type: string
 *               productId:
 *                 type: string
 *               bidAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Bid placed successfully
 *       400:
 *         description: Invalid bid amount
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Stream or product not found
 */
router.post('/bid',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  streamController.placeBid
);

/**
 * @swagger
 * /api/streams/{streamId}/join:
 *   post:
 *     summary: Join a live stream as a viewer
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully joined stream
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 channelName:
 *                   type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Stream not found
 */
router.post('/:streamId/join',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  streamController.joinStream
);

/**
 * @swagger
 * /api/streams/active:
 *   get:
 *     summary: Get all active streams
 *     tags: [Streams]
 *     responses:
 *       200:
 *         description: List of active streams
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Stream'
 */
router.get('/active',
  streamController.getActiveStreams
);

/**
 * @swagger
 * /api/streams/{streamId}:
 *   get:
 *     summary: Get details of a specific stream
 *     tags: [Streams]
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stream details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stream'
 *       404:
 *         description: Stream not found
 */
router.get('/:streamId',
  streamController.getStreamDetails
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Stream:
 *       type: object
 *       properties:
 *         seller:
 *           type: string
 *           description: ID of the seller
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         coverImage:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *             public_id:
 *               type: string
 *         category:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [scheduled, live, ended]
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *               minBid:
 *                 type: number
 *               maxBid:
 *                 type: number
 *               currentBid:
 *                 type: number
 *               currentBidder:
 *                 type: string
 */

module.exports = router; 