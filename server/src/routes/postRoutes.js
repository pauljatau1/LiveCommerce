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
 *                 required: true
 *                 description: Title of the post
 *               body:
 *                 type: string
 *                 required: true
 *                 description: Content of the post
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Images or videos to be uploaded
 *               productIds:
 *                 type: string
 *                 description: Comma-separated list of product IDs or array of product IDs to tag
 *                 example: "id1,id2,id3"
 *               taggedSellers:
 *                 type: string
 *                 description: JSON string containing seller IDs to tag
 *                 example: '{"sellerId":"seller123"}'
 *               tags:
 *                 type: string
 *                 description: Comma-separated list of tags or array of tags
 *                 example: "fashion,lifestyle,summer"
 *               visibility:
 *                 type: string
 *                 enum: [public, private, draft]
 *                 default: public
 *                 description: Visibility setting for the post
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post created successfully
 *                 post:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     body:
 *                       type: string
 *                     author:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                         userModel:
 *                           type: string
 *                           enum: [Buyer, Seller]
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         profileImage:
 *                           type: object
 *                         username:
 *                           type: string
 *                         storeName:
 *                           type: string
 *                     images:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           public_id:
 *                             type: string
 *                     videos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           public_id:
 *                             type: string
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               images:
 *                                 type: array
 *                               price:
 *                                 type: number
 *                           taggedAt:
 *                             type: string
 *                             format: date-time
 *                     taggedSellers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sellerId:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               storeName:
 *                                 type: string
 *                               businessName:
 *                                 type: string
 *                           taggedAt:
 *                             type: string
 *                             format: date-time
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     visibility:
 *                       type: string
 *                       enum: [public, private, draft]
 *                     stats:
 *                       type: object
 *                       properties:
 *                         likeCount:
 *                           type: number
 *                         dislikeCount:
 *                           type: number
 *                         viewCount:
 *                           type: number
 *                         shareCount:
 *                           type: number
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/', 
  authMiddleware.verifyToken,
  upload.array('media', 10),
  postController.createPost
);

/**
 * @swagger
 * /api/posts/{postId}/reactions:
 *   post:
 *     summary: Add or update a reaction to a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to react to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [like, love, haha, wow, sad, angry]
 *                 description: Type of reaction to add
 *                 example: love
 *           examples:
 *             like:
 *               value:
 *                 type: "like"
 *               summary: Like reaction (👍)
 *             love:
 *               value:
 *                 type: "love"
 *               summary: Love reaction (❤️)
 *             haha:
 *               value:
 *                 type: "haha"
 *               summary: Haha reaction (😂)
 *             wow:
 *               value:
 *                 type: "wow"
 *               summary: Wow reaction (😮)
 *             sad:
 *               value:
 *                 type: "sad"
 *               summary: Sad reaction (😢)
 *             angry:
 *               value:
 *                 type: "angry"
 *               summary: Angry reaction (😡)
 *     responses:
 *       200:
 *         description: Reaction added or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reaction updated successfully
 *                 reactionCounts:
 *                   type: object
 *                   properties:
 *                     like:
 *                       type: number
 *                       example: 5
 *                     love:
 *                       type: number
 *                       example: 3
 *                     haha:
 *                       type: number
 *                       example: 2
 *                     wow:
 *                       type: number
 *                       example: 1
 *                     sad:
 *                       type: number
 *                       example: 0
 *                     angry:
 *                       type: number
 *                       example: 1
 *                 userReaction:
 *                   type: string
 *                   nullable: true
 *                   example: love
 *                   description: The user's current reaction after the update, null if removed
 *       400:
 *         description: Invalid reaction type
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Post or user not found
 *       500:
 *         description: Server error
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
 *     tags: [Posts, Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Content of the comment
 *               taggedSellers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of seller IDs to tag in the comment
 *               taggedProducts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of product IDs to tag in the comment
 *     responses:
 *       200:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment added successfully
 *                 comment:
 *                   type: object
 *                   properties:
 *                     content:
 *                       type: string
 *                     author:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     taggedSellers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sellerId:
 *                             type: string
 *                           storeName:
 *                             type: string
 *                           taggedAt:
 *                             type: string
 *                             format: date-time
 *                     taggedProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           taggedAt:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.post('/:postId/comments',
  authMiddleware.verifyToken,
  postController.addComment
);

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Posts, Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to get comments for
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
 *         description: Number of comments per page
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       author:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           image:
 *                             type: string
 *                             nullable: true
 *                           type:
 *                             type: string
 *                             enum: [Buyer, Seller]
 *                       likes:
 *                         type: integer
 *                       taggedSellers:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             storeName:
 *                               type: string
 *                             businessName:
 *                               type: string
 *                             image:
 *                               type: string
 *                               nullable: true
 *                             taggedAt:
 *                               type: string
 *                               format: date-time
 *                       taggedProducts:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             image:
 *                               type: string
 *                               nullable: true
 *                             price:
 *                               type: number
 *                             taggedAt:
 *                               type: string
 *                               format: date-time
 *                       replies:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             content:
 *                               type: string
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                             author:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 image:
 *                                   type: string
 *                                   nullable: true
 *                                 type:
 *                                   type: string
 *                                   enum: [Buyer, Seller]
 *                             likes:
 *                               type: integer
 *                             taggedSellers:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   storeName:
 *                                     type: string
 *                                   businessName:
 *                                     type: string
 *                                   image:
 *                                     type: string
 *                                     nullable: true
 *                                   taggedAt:
 *                                     type: string
 *                                     format: date-time
 *                             taggedProducts:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   name:
 *                                     type: string
 *                                   image:
 *                                     type: string
 *                                     nullable: true
 *                                   price:
 *                                     type: number
 *                                   taggedAt:
 *                                     type: string
 *                                     format: date-time
 *                             repliesCount:
 *                               type: integer
 *                 totalComments:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.get('/:postId/comments',
  postController.getComments
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of posts per page
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [public, private, draft]
 *           default: public
 *         description: Post visibility filter
 *     responses:
 *       200:
 *         description: List of user's posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       body:
 *                         type: string
 *                       author:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           image:
 *                             type: string
 *                           bio:
 *                             type: string
 *                           country:
 *                             type: string
 *                           type:
 *                             type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                             public_id:
 *                               type: string
 *                       products:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             price:
 *                               type: number
 *                             images:
 *                               type: array
 *                               items:
 *                                 type: string
 *                       stats:
 *                         type: object
 *                         properties:
 *                           likeCount:
 *                             type: number
 *                           dislikeCount:
 *                             type: number
 *                           viewCount:
 *                             type: number
 *                           shareCount:
 *                             type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 totalPages:
 *                   type: number
 *                 currentPage:
 *                   type: number
 *                 totalPosts:
 *                   type: number
 *                 authorInfo:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     image:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     country:
 *                       type: string
 *                     type:
 *                       type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
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
 * /api/posts/{postId}/like:
 *   post:
 *     summary: Like or unlike a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post liked/unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 likes:
 *                   type: number
 *                 dislikes:
 *                   type: number
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.post('/:postId/like',
  authMiddleware.verifyToken,
  postController.likePost
);

/**
 * @swagger
 * /api/posts/{postId}/dislike:
 *   post:
 *     summary: Dislike or undislike a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post disliked/undisliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 likes:
 *                   type: number
 *                 dislikes:
 *                   type: number
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.post('/:postId/dislike',
  authMiddleware.verifyToken,
  postController.dislikePost
);

/**
 * @swagger
 * /api/posts/trending:
 *   get:
 *     summary: Get trending posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: List of trending posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       body:
 *                         type: string
 *                       stats:
 *                         type: object
 *                         properties:
 *                           likeCount:
 *                             type: number
 *                           dislikeCount:
 *                             type: number
 *                           viewCount:
 *                             type: number
 *                           shareCount:
 *                             type: number
 *                 totalPages:
 *                   type: number
 *                 currentPage:
 *                   type: number
 *                 totalPosts:
 *                   type: number
 *       500:
 *         description: Server error
 */
router.get('/trending',
  postController.getTrendingPosts
);

/**
 * @swagger
 * /api/posts/new:
 *   get:
 *     summary: Get new posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: List of new posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       body:
 *                         type: string
 *                       author:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           storeName:
 *                             type: string
 *                           businessName:
 *                             type: string
 *                           profileImage:
 *                             type: string
 *                       products:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             price:
 *                               type: number
 *                             images:
 *                               type: array
 *                               items:
 *                                 type: string
 *                 totalPages:
 *                   type: number
 *                 currentPage:
 *                   type: number
 *                 totalPosts:
 *                   type: number
 *       500:
 *         description: Server error
 */
router.get('/new',
  postController.getNewPosts
);

/**
 * @swagger
 * /api/posts/search:
 *   get:
 *     summary: Search posts by query parameters
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for title, body, or tags
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: seller
 *         schema:
 *           type: string
 *         description: Filter by seller ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of posts per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [recent, popular]
 *           default: recent
 *         description: Sort posts by date or popularity
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       body:
 *                         type: string
 *                       author:
 *                         type: object
 *                       products:
 *                         type: array
 *                       stats:
 *                         type: object
 *                 totalPages:
 *                   type: number
 *                 currentPage:
 *                   type: number
 *                 totalPosts:
 *                   type: number
 *       500:
 *         description: Server error
 */
router.get('/search', postController.searchPosts);

/**
 * @swagger
 * /api/posts/user/{userType}/{userId}/batch:
 *   delete:
 *     summary: Delete multiple posts from a specific user
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               postIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of post IDs to delete
 *     responses:
 *       200:
 *         description: Posts deleted successfully
 *       401:
 *         description: Unauthorized - Only post owners can delete their posts
 *       404:
 *         description: User or posts not found
 */
router.delete('/user/:userType/:userId/batch',
  authMiddleware.verifyToken,
  postController.deleteBatchPosts
);

/**
 * @swagger
 * /api/posts/user/{userType}/{userId}/batch:
 *   put:
 *     summary: Update multiple posts from a specific user
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     postId:
 *                       type: string
 *                       required: true
 *                     visibility:
 *                       type: string
 *                       enum: [public, private, draft]
 *                     title:
 *                       type: string
 *                     body:
 *                       type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       200:
 *         description: Posts updated successfully
 *       401:
 *         description: Unauthorized - Only post owners can update their posts
 *       404:
 *         description: User or posts not found
 */
router.put('/user/:userType/:userId/batch',
  authMiddleware.verifyToken,
  postController.updateBatchPosts
);

/**
 * @swagger
 * /api/posts/{postId}/report:
 *   post:
 *     summary: Report a post
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
 *             required:
 *               - reason
 *               - description
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [inappropriate_content, spam, harassment, hate_speech, misinformation, copyright_violation, other]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post reported successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.post('/:postId/report',
  authMiddleware.verifyToken,
  postController.reportPost
);

/**
 * @swagger
 * /api/posts/{postId}/comments/{commentId}/like:
 *   post:
 *     summary: Like or unlike a comment
 *     tags: [Posts, Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post containing the comment
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to like/unlike
 *     responses:
 *       200:
 *         description: Comment liked or unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment liked successfully
 *                 liked:
 *                   type: boolean
 *                   example: true
 *                 likesCount:
 *                   type: number
 *                   example: 5
 *       404:
 *         description: Post or comment not found
 *       500:
 *         description: Server error
 */
router.post('/:postId/comments/:commentId/like',
  authMiddleware.verifyToken,
  postController.likeComment
);

/**
 * @swagger
 * /api/posts/{postId}/comments/{commentId}/replies:
 *   post:
 *     summary: Reply to a comment
 *     tags: [Posts, Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post containing the comment
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to reply to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Content of the reply
 *               taggedSellers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of seller IDs to tag in the reply
 *               taggedProducts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of product IDs to tag in the reply
 *     responses:
 *       200:
 *         description: Reply added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reply added successfully
 *                 reply:
 *                   type: object
 *                   properties:
 *                     content:
 *                       type: string
 *                     author:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     likes:
 *                       type: number
 *                     taggedSellers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sellerId:
 *                             type: string
 *                           storeName:
 *                             type: string
 *                           taggedAt:
 *                             type: string
 *                             format: date-time
 *                     taggedProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           taggedAt:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Post or comment not found
 *       500:
 *         description: Server error
 */
router.post('/:postId/comments/:commentId/replies',
  authMiddleware.verifyToken,
  postController.replyToComment
);

/**
 * @swagger
 * /api/posts/{postId}/comments/{commentId}/replies/{replyId}/like:
 *   post:
 *     summary: Like or unlike a reply
 *     tags: [Posts, Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post containing the comment
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment containing the reply
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the reply to like/unlike
 *     responses:
 *       200:
 *         description: Reply liked or unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reply liked successfully
 *                 liked:
 *                   type: boolean
 *                   example: true
 *                 likesCount:
 *                   type: number
 *                   example: 3
 *       404:
 *         description: Post, comment, or reply not found
 *       500:
 *         description: Server error
 */
router.post('/:postId/comments/:commentId/replies/:replyId/like',
  authMiddleware.verifyToken,
  postController.likeReply
);

/**
 * @swagger
 * /api/posts/{postId}/comments/{commentId}/replies/{replyId}:
 *   delete:
 *     summary: Delete a reply
 *     tags: [Posts, Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post containing the comment
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment containing the reply
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the reply to delete
 *     responses:
 *       200:
 *         description: Reply deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reply deleted successfully
 *       403:
 *         description: Unauthorized to delete this reply
 *       404:
 *         description: Post, comment, or reply not found
 *       500:
 *         description: Server error
 */
router.delete('/:postId/comments/:commentId/replies/:replyId',
  authMiddleware.verifyToken,
  postController.deleteReply
);

/**
 * @swagger
 * /api/posts/{postId}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Posts, Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post containing the comment
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment deleted successfully
 *       403:
 *         description: Unauthorized to delete this comment
 *       404:
 *         description: Post or comment not found
 *       500:
 *         description: Server error
 */
router.delete('/:postId/comments/:commentId',
  authMiddleware.verifyToken,
  postController.deleteComment
);

module.exports = router; 