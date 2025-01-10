const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
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
 *               body:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Post created successfully
 *       500:
 *         description: Server error
 */
router.post('/', 
  authMiddleware.verifyToken,
  upload.array('images', 5),
  postController.createPost
);

/**
 * @swagger
 * /api/posts/{postId}/reactions:
 *   post:
 *     summary: Add a reaction to a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [like, dislike, love, laugh, sad, angry]
 *     responses:
 *       200:
 *         description: Reaction added successfully
 *       404:
 *         description: Post not found
 */
router.post('/:postId/reactions',
  authMiddleware.verifyToken,
  postController.addReaction
);

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment added successfully
 *       404:
 *         description: Post not found
 */
router.post('/:postId/comments',
  authMiddleware.verifyToken,
  postController.addComment
);

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts with pagination
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: List of posts retrieved successfully
 */
router.get('/',
  postController.getPosts
);

/**
 * @swagger
 * /api/posts/seller-feed:
 *   get:
 *     summary: Get posts from followers and followed sellers
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: Feed retrieved successfully
 *       401:
 *         description: Unauthorized - Only sellers can access this endpoint
 */
router.get('/seller-feed',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  postController.getSellerFeed
);

/**
 * @swagger
 * /api/posts/buyer-feed:
 *   get:
 *     summary: Get posts from followed sellers and public buyer posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 */
router.get('/buyer-feed',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  postController.getBuyerFeed
);

/**
 * @swagger
 * /api/posts/user/{userType}/{userId}:
 *   get:
 *     summary: Get all posts from a specific user
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Buyer, Seller]
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/user/:userType/:userId', postController.getUserPosts);

/**
 * @swagger
 * /api/posts/{postId}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:postId',
  authMiddleware.verifyToken,
  upload.array('images', 5),
  postController.updatePost
);

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:postId',
  authMiddleware.verifyToken,
  postController.deletePost
);

/**
 * @swagger
 * /api/posts/{postId}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:postId/comments/:commentId',
  authMiddleware.verifyToken,
  postController.deleteComment
);

module.exports = router; 