const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Add these debugging logs at the top of your file
console.log("Loading streamRoutes.js");

// First, define a debugging middleware to log all requests
const debugMiddleware = (req, res, next) => {
  console.log(`[DEBUG] Request received: ${req.method} ${req.originalUrl}`);
  next();
};

// Apply this middleware to all routes
router.use(debugMiddleware);

/**
 * @swagger
 * /api/streams/for-you:
 *   get:
 *     summary: Get personalized streams based on buyer's selected categories
 *     description: Returns streams that match the logged-in buyer's selected categories preferences
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
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
 *         description: List of personalized streams based on buyer preferences
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
 *       401:
 *         description: Unauthorized - only buyers can access this endpoint
 *       500:
 *         description: Server error
 */
router.get('/for-you',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  streamController.getStreamsForYou
);

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
 *         application/json:
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
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: string
 *                     description: Base64 encoded image data
 *                   contentType:
 *                     type: string
 *                     example: 'image/jpeg'
 *               video:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: string
 *                     description: Base64 encoded video data
 *                   contentType:
 *                     type: string
 *                     example: 'video/mp4'
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of tag strings
 *               products:
 *                 type: array
 *                 description: Array of products with bid limits
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
 * /api/streams/{streamId}/activate-product-bidding:
 *   post:
 *     summary: Activate bidding for a specific product in an auction stream
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID of the product to activate bidding for
 *     responses:
 *       200:
 *         description: Product bidding activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   type: object
 *       400:
 *         description: Invalid request or stream is not an auction
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Stream or product not found
 */
router.post('/:streamId/activate-product-bidding',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  streamController.activateProductBidding
);

/**
 * @swagger
 * /api/streams/{streamId}/end-product-bidding:
 *   post:
 *     summary: End bidding for a specific product in an auction stream
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID of the product to end bidding for
 *     responses:
 *       200:
 *         description: Product bidding ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   type: object
 *       400:
 *         description: Invalid request or product bidding is not active
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Stream or product not found
 */
router.post('/:streamId/end-product-bidding',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  streamController.endProductBidding
);

/**
 * @swagger
 * /api/streams/{streamId}/place-bid:
 *   post:
 *     summary: Place a bid on a product in an auction stream (REST API fallback - WebSocket preferred)
 *     description: This endpoint is provided as a fallback. For real-time bidding, use the WebSocket connection with 'stream_place_bid' event.
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - bidAmount
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID of the product to bid on
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
 *                 bid:
 *                   type: object
 *                 product:
 *                   type: object
 *                 isWinner:
 *                   type: boolean
 *       400:
 *         description: Invalid request or bidding is not active
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Stream or product not found
 */
router.post('/:streamId/place-bid',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  streamController.placeBid
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
 *     summary: Join a live stream as a buyer/viewer
 *     description: For buyers only. Sellers should use the /join-seller endpoint instead.
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
 *         description: Successfully joined stream as buyer/viewer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 channelName:
 *                   type: string
 *                 token:
 *                   type: string
 *                 uid:
 *                   type: number
 *                   description: User ID for Agora
 *                 role:
 *                   type: number
 *                   description: Role in the stream (1 for host, 2 for audience)
 *                 tokenExpiration:
 *                   type: number
 *                   description: Timestamp when the token expires
 *                 stream:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     seller:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         storeName:
 *                           type: string
 *                         businessName:
 *                           type: string
 *                         storeAvatar:
 *                           type: object
 *                         rating:
 *                           type: number
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     coverImage:
 *                       type: object
 *                     category:
 *                       type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               images:
 *                                 type: array
 *                               price:
 *                                 type: number
 *                               stock:
 *                                 type: number
 *                               sku:
 *                                 type: string
 *                               variants:
 *                                 type: array
 *                           minBid:
 *                             type: number
 *                           maxBid:
 *                             type: number
 *                           currentBid:
 *                             type: number
 *                           currentBidder:
 *                             type: object
 *                     status:
 *                       type: string
 *                       enum: [scheduled, live, ended, expired]
 *                     channelName:
 *                       type: string
 *                     scheduledStartTime:
 *                       type: string
 *                       format: date-time
 *                     actualStartTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                     viewers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     type:
 *                       type: string
 *                       enum: [auction, open_show]
 *                     bids:
 *                       type: array
 *                       items:
 *                         type: object
 *                     viewerCount:
 *                       type: number
 *                     isLive:
 *                       type: boolean
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
 * /api/streams/{streamId}/join-seller:
 *   post:
 *     summary: Join a live stream as the seller/host
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
 *         description: Successfully joined stream as seller
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 channelName:
 *                   type: string
 *                 token:
 *                   type: string
 *                 uid:
 *                   type: number
 *                   description: User ID for Agora (seller's permanent UID)
 *                 role:
 *                   type: number
 *                   description: Role in the stream (1 for host/publisher)
 *                 tokenExpiration:
 *                   type: number
 *                   description: Timestamp when the token expires
 *                 stream:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     seller:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         storeName:
 *                           type: string
 *                         businessName:
 *                           type: string
 *                         storeAvatar:
 *                           type: object
 *                         rating:
 *                           type: number
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     coverImage:
 *                       type: object
 *                     category:
 *                       type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               images:
 *                                 type: array
 *                               price:
 *                                 type: number
 *                               stock:
 *                                 type: number
 *                               sku:
 *                                 type: string
 *                               variants:
 *                                 type: array
 *                           minBid:
 *                             type: number
 *                           maxBid:
 *                             type: number
 *                           currentBid:
 *                             type: number
 *                           currentBidder:
 *                             type: object
 *                     status:
 *                       type: string
 *                       enum: [scheduled, live, ended, expired]
 *                     channelName:
 *                       type: string
 *                     scheduledStartTime:
 *                       type: string
 *                       format: date-time
 *                     actualStartTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                     viewers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     type:
 *                       type: string
 *                       enum: [auction, open_show]
 *                     bids:
 *                       type: array
 *                       items:
 *                         type: object
 *                     viewerCount:
 *                       type: number
 *                     isLive:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Stream not found or you do not have permission
 *       400:
 *         description: Seller Agora UID not found
 */
router.post('/:streamId/join-seller',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  streamController.joinStreamSeller
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
 * /api/streams/popular:
 *   get:
 *     summary: Get popular streams based on viewer count
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
 *         description: List of popular streams
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
router.get('/popular', (req, res, next) => {
  console.log('[DEBUG] /popular route matched');
  next();
}, streamController.getPopularStreams);

/**
 * @swagger
 * /api/streams/spotlight:
 *   get:
 *     summary: Get streams from featured sellers (spotlight)
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
 *         description: List of spotlight streams from featured sellers
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
router.get('/spotlight', (req, res, next) => {
  console.log('[DEBUG] /spotlight route matched');
  next();
}, streamController.getSpotlightStreams);

/**
 * @swagger
 * /api/streams/search:
 *   get:
 *     summary: Deep search for streams based on multiple criteria
 *     description: Search streams by name, product names, and category with optional filters for status and type
 *     tags: [Streams]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term for stream title, product names, or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category to filter streams by (optional)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, live, ended, expired]
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
 *         description: List of streams matching search criteria
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
router.get('/search', (req, res, next) => {
  console.log('[DEBUG] /search route matched with query:', req.query);
  next();
}, streamController.searchStreams);

/**
 * @swagger
 * /api/streams/favorite-sellers:
 *   get:
 *     summary: Get streams from sellers that the buyer follows
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
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
 *         description: List of streams from followed sellers
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/favorite-sellers',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  streamController.getStreamsFromFavoriteSellers
);

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
router.get('/:streamId', (req, res, next) => {
  console.log(`[DEBUG] /:streamId route matched with streamId = ${req.params.streamId}`);
  next();
}, streamController.getStreamDetails);

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
 *         application/json:
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
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: string
 *                     description: Base64 encoded image data
 *                   contentType:
 *                     type: string
 *                     example: 'image/jpeg'
 *               video:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: string
 *                     description: Base64 encoded video data
 *                   contentType:
 *                     type: string
 *                     example: 'video/mp4'
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of tag strings
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
 * /api/streams/category/{category}:
 *   get:
 *     summary: Get streams by category
 *     description: Retrieve all streams for a specific category with optional filtering by status, type, and sorting by views count
 *     tags: [Streams]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Category name to filter streams by
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
 *         name: sortByViews
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort streams by viewer count (asc for ascending, desc for descending)
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
 *         description: List of streams in the specified category
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
router.get('/category/:category', (req, res, next) => {
  console.log("[DEBUG] Route triggered: GET /category/:category");
  next();
}, streamController.getStreamsByCategory);


/**
 * @swagger
 * /api/streams/category/{category}/subcategory/{subcategory}:
 *   get:
 *     summary: Get streams by category and subcategory
 *     description: Retrieves streams filtered by both a main category and its subcategory
 *     tags: [Streams]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: The main category to filter streams by
 *       - in: path
 *         name: subcategory
 *         required: true
 *         schema:
 *           type: string
 *         description: The subcategory within the main category to filter streams by
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, live, ended]
 *         description: Filter by stream status (optional)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [auction, open_show]
 *         description: Filter by stream type (optional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortByViews
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort by viewer count (ascending or descending)
 *     responses:
 *       200:
 *         description: A list of streams matching the specified category and subcategory
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
 *                       description: Total number of streams
 *                     pages:
 *                       type: integer
 *                       description: Total number of pages
 *                     currentPage:
 *                       type: integer
 *                       description: Current page number
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more pages available
 *       500:
 *         description: Server error
 */
router.get('/category/:category/subcategory/:subcategory', (req, res, next) => {
  console.log("[DEBUG] Route triggered: GET /category/:category/subcategory/:subcategory");
  next();
}, streamController.getStreamsByCategoryAndSubcategory);

/**
 * @swagger
 * /api/streams/{streamId}/chat:
 *   get:
 *     summary: Get chat interactions for a stream
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
 *         description: Successfully retrieved chat interactions
 *       404:
 *         description: Stream not found
 *       500:
 *         description: Server error
 */
router.get('/:streamId/chat',
  authMiddleware.verifyToken,
  streamController.getChatInteractions
);

/**
 * @swagger
 * /api/streams/{streamId}/leave:
 *   post:
 *     summary: Leave a live stream as a buyer/viewer
 *     description: Remove the user from the viewers list, add them to departedViewers list, and notify other participants
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
 *         description: Successfully left the stream
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully left stream
 *                 streamId:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Stream not found or not active
 *       500:
 *         description: Server error
 */
router.post('/:streamId/leave',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  streamController.leaveStream
);

/**
 * @swagger
 * /api/streams/{streamId}/leave-seller:
 *   post:
 *     summary: Leave a live stream as the seller/host
 *     description: Notify all participants when the host/seller leaves the room
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
 *         description: Successfully left the stream as seller
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully left stream as seller
 *                 streamId:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Stream not found or you do not have permission
 *       500:
 *         description: Server error
 */
router.post('/:streamId/leave-seller',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  streamController.leaveStreamSeller
);

/**
 * @swagger
 * /api/streams/{streamId}/subscribe:
 *   post:
 *     summary: Subscribe to notifications for an upcoming stream
 *     description: Register a buyer to receive both push notifications and email alerts when the stream goes live
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the upcoming stream to subscribe to
 *     responses:
 *       200:
 *         description: Successfully subscribed to stream notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You will be notified when this stream goes live
 *                 streamId:
 *                   type: string
 *                 streamTitle:
 *                   type: string
 *                 scheduledStartTime:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request - stream is not in scheduled status or already subscribed
 *       401:
 *         description: Unauthorized - only buyers can subscribe to streams
 *       404:
 *         description: Stream not found
 *       500:
 *         description: Server error
 */
router.post('/:streamId/subscribe',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  streamController.subscribeToStream
);

/**
 * @swagger
 * /api/streams/{streamId}/unsubscribe:
 *   post:
 *     summary: Unsubscribe from notifications for an upcoming stream
 *     description: Remove a buyer from the notification list for when the stream goes live
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the upcoming stream to unsubscribe from
 *     responses:
 *       200:
 *         description: Successfully unsubscribed from stream notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You have unsubscribed from notifications for this stream
 *                 streamId:
 *                   type: string
 *       401:
 *         description: Unauthorized - only buyers can unsubscribe from streams
 *       404:
 *         description: Stream not found or not subscribed
 *       500:
 *         description: Server error
 */
router.post('/:streamId/unsubscribe',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  streamController.unsubscribeFromStream
);

/**
 * @swagger
 * /api/streams/{streamId}/related:
 *   get:
 *     summary: Get related streams based on a specific stream
 *     description: Retrieve streams that are related to a specified stream by category and tags
 *     tags: [Streams]
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the stream to find related streams for
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, live, ended, expired]
 *         description: Filter related streams by status (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Number of related streams per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: excludeSeller
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to exclude streams from the same seller
 *     responses:
 *       200:
 *         description: List of related streams with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 streams:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Stream'
 *                 sourceStream:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     category:
 *                       type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     type:
 *                       type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of related streams
 *                     pages:
 *                       type: integer
 *                       description: Total number of pages
 *                     currentPage:
 *                       type: integer
 *                       description: Current page number
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more pages
 *       404:
 *         description: Stream not found
 *       500:
 *         description: Server error
 */
router.get('/:streamId/related',
  streamController.getRelatedStreams
);

/**
 * @swagger
 * /api/streams/{streamId}/next:
 *   get:
 *     summary: Get the next stream after a specific stream
 *     description: Retrieve the next upcoming stream after the specified stream ID
 *     tags: [Streams]
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the stream to find the next stream for
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, live]
 *         description: Filter the next stream by status (scheduled or live only)
 *     responses:
 *       200:
 *         description: The next stream
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nextStream:
 *                   $ref: '#/components/schemas/Stream'
 *                 currentStream:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     scheduledStartTime:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: No next stream found or current stream not found
 *       500:
 *         description: Server error
 */
router.get('/:streamId/next',
  streamController.getNextStream
);

/**
 * @swagger
 * /api/streams/{streamId}/is-subscribed:
 *   get:
 *     summary: Check if buyer is subscribed to stream notifications
 *     description: Determines if the currently logged-in buyer is subscribed to notifications for when the stream goes live
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the stream to check subscription status for
 *     responses:
 *       200:
 *         description: Successfully retrieved subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSubscribed:
 *                   type: boolean
 *                   description: Whether the buyer is subscribed to this stream
 *       401:
 *         description: Unauthorized - only buyers can check subscription status
 *       404:
 *         description: Stream not found
 *       500:
 *         description: Server error
 */
router.get('/:streamId/is-subscribed',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  streamController.isSubscribedToStream
);

/**
 * @swagger
 * /api/streams/{streamId}/orders:
 *   get:
 *     summary: Get all orders for a specific stream
 *     tags: [Streams]
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stream orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Stream not found
 *       500:
 *         description: Server error
 */
router.get('/:streamId/orders', streamController.getStreamOrders);


/**
 * @swagger
 * /api/streams/{streamId}/renew-token:
 *   get:
 *     summary: Renew Agora token for a stream
 *     description: Generates a fresh Agora token for the specified stream based on user role (Seller gets PUBLISHER role, Buyer gets SUBSCRIBER role)
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the stream to renew token for
 *     responses:
 *       200:
 *         description: Successfully renewed Agora token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: The renewed Agora token
 *                 tokenExpiration:
 *                   type: number
 *                   description: Timestamp when the token expires
 *                 uid:
 *                   type: number
 *                   description: User ID for Agora
 *                 role:
 *                   type: string
 *                   enum: [publisher, subscriber]
 *                   description: Role in the stream
 *                 channelName:
 *                   type: string
 *                   description: Channel name for the stream
 *       400:
 *         description: Invalid request or seller Agora UID not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid user role
 *       404:
 *         description: Stream not found
 *       500:
 *         description: Server error
 */
router.get('/:streamId/renew-token',
  authMiddleware.verifyToken,
  streamController.renewAgoraToken
);

module.exports = router; 