const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/social/follow/{userId}:
 *   post:
 *     summary: Follow a user (buyer or seller)
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Buyer, Seller]
 *     responses:
 *       200:
 *         description: Successfully followed the user
 */
router.post('/follow/:userId', authMiddleware.verifyToken, socialController.followUser);

/**
 * @swagger
 * /api/social/unfollow/{userId}:
 *   post:
 *     summary: Unfollow a user (buyer or seller)
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Buyer, Seller]
 *     responses:
 *       200:
 *         description: Successfully unfollowed the user
 */
router.post('/unfollow/:userId', authMiddleware.verifyToken, socialController.unfollowUser);

/**
 * @swagger
 * /api/social/feed:
 *   get:
 *     summary: Get user's social feed
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: Social feed retrieved successfully
 */
router.get('/feed', authMiddleware.verifyToken, socialController.getFeed);

/**
 * @swagger
 * /api/social/followers:
 *   get:
 *     summary: Get user's followers
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: List of followers retrieved successfully
 */
router.get('/followers', authMiddleware.verifyToken, socialController.getFollowers);
router.get('/followers/:userId', authMiddleware.verifyToken, socialController.getFollowers);

/**
 * @swagger
 * /api/social/following:
 *   get:
 *     summary: Get user's following list
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: List of following retrieved successfully
 */
router.get('/following', authMiddleware.verifyToken, socialController.getFollowing);
router.get('/following/:userId', authMiddleware.verifyToken, socialController.getFollowing);

/**
 * @swagger
 * /api/social/suggestions:
 *   get:
 *     summary: Get follower suggestions
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: List of suggestions retrieved successfully
 */
router.get('/suggestions', authMiddleware.verifyToken, socialController.getFollowerSuggestions);

module.exports = router;
