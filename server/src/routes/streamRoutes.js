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
 *     summary: Create a new auction stream
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - products
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               coverImage:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: Comma-separated list of tags
 *               products:
 *                 type: string
 *                 description: JSON string array of products with bid limits
 *                 example: '[{"productId":"123","minBid":10,"maxBid":1000},{"productId":"456","minBid":20,"maxBid":2000}]'
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
 *     summary: Place a bid on an auction stream product
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - streamId
 *               - productId
 *               - bidAmount
 *             properties:
 *               streamId:
 *                 type: string
 *                 description: ID of the auction stream
 *               productId:
 *                 type: string
 *                 description: ID of the product being bid on
 *               bidAmount:
 *                 type: number
 *                 description: Amount of the bid
 *     responses:
 *       200:
 *         description: Bid placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 currentBid:
 *                   type: number
 *                 productId:
 *                   type: string
 *                 streamId:
 *                   type: string
 *       400:
 *         description: Invalid bid amount or stream type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bids can only be placed on auction streams
 *       403:
 *         description: Seller attempting to bid on their own auction
 *       404:
 *         description: Stream or product not found
 *       500:
 *         description: Server error
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
 * /api/streams/seller/{sellerId}:
 *   get:
 *     summary: Get all streams for a specific seller
 *     tags: [Streams]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, live, ended]
 *         description: Filter streams by status (optional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of seller's streams
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 streams:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Stream'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get('/seller/:sellerId', streamController.getSellerStreams);

/**
 * @swagger
 * /api/streams/open-live-show:
 *   post:
 *     summary: Create a new open live show
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               coverImage:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: Comma-separated list of tags
 *               scheduledStartTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Open live show created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/open-live-show',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  upload.single('coverImage'),
  streamController.createOpenLiveShow
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

/**
 * @swagger
 * /api/streams:
 *   get:
 *     summary: Get streams filtered by status and type
 *     tags: [Streams]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, live, ended]
 *         description: Filter streams by status (optional)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [auction, open_show]
 *         description: Filter streams by type (optional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of streams
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 streams:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Stream'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       500:
 *         description: Server error
 */
router.get('/', streamController.getStreamsByStatus);

/**
 * @swagger
 * /api/streams/seller/{sellerId}/filtered:
 *   get:
 *     summary: Get seller's streams filtered by status and type
 *     tags: [Streams]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, live, ended]
 *         description: Filter streams by status (optional)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [auction, open_show]
 *         description: Filter streams by type (optional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of seller's streams
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 streams:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Stream'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get('/seller/:sellerId/filtered', streamController.getSellerStreamsByStatus);

/**
 * @swagger
 * /api/streams/{streamId}/refresh-token:
 *   get:
 *     summary: Refresh viewer token and get stream details
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
 *         description: Stream details with refreshed token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StreamWithToken'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Seller cannot use viewer token
 *       404:
 *         description: Stream not found
 */
router.get('/:streamId/refresh-token',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  streamController.getStreamWithRefreshedToken
);

module.exports = router; 