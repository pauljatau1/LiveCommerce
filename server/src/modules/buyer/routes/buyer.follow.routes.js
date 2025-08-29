const express = require('express');
const router = express.Router();

const { verifyToken, isBuyer } = require('../../../middlewares/authMiddleware');
const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/follow/{sellerId}:
 *   post:
 *     summary: Follow a seller
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller to follow
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Successfully followed seller
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Successfully followed seller"
 *                 data:
 *                   type: object
 *                   properties:
 *                     followData:
 *                       type: object
 *                       properties:
 *                         buyerId:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         followDate:
 *                           type: string
 *                           format: date-time
 *                         totalOrders:
 *                           type: number
 *                         mainAddress:
 *                           type: object
 *                           nullable: true
 *                     sellerFollowCount:
 *                       type: number
 *                       description: Total number of followers for the seller
 *                     buyerFollowingCount:
 *                       type: number
 *                       description: Total number of sellers the buyer is following
 *       400:
 *         description: Bad Request - Already following this seller
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer or seller not found
 *       422:
 *         description: Validation error - Invalid seller ID format
 *       500:
 *         description: Internal server error
 */
router.post('/follow/:sellerId', verifyToken, isBuyer, buyerController.followSeller);

/**
 * @swagger
 * /api/v2/buyers/follow/{sellerId}:
 *   delete:
 *     summary: Unfollow a seller
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller to unfollow
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Successfully unfollowed seller
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Successfully unfollowed seller"
 *                 data:
 *                   type: object
 *                   properties:
 *                     sellerFollowCount:
 *                       type: number
 *                       description: Total number of followers for the seller after unfollow
 *                     buyerFollowingCount:
 *                       type: number
 *                       description: Total number of sellers the buyer is following after unfollow
 *       400:
 *         description: Bad Request - Not following this seller
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer or seller not found
 *       422:
 *         description: Validation error - Invalid seller ID format
 *       500:
 *         description: Internal server error
 */
router.delete('/follow/:sellerId', verifyToken, isBuyer, buyerController.unfollowSeller);

/**
 * @swagger
 * /api/v2/buyers/followers:
 *   get:
 *     summary: Get buyer's followers with pagination
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Followers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Followers retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     followers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Seller ID
 *                             example: "507f1f77bcf86cd799439011"
 *                           type:
 *                             type: string
 *                             enum: [seller]
 *                             example: "seller"
 *                           name:
 *                             type: string
 *                             description: Seller's full name
 *                             example: "John Doe"
 *                           storeName:
 *                             type: string
 *                             description: Store or business name
 *                             example: "John's Electronics"
 *                           profileImage:
 *                             type: string
 *                             description: URL to profile image
 *                             example: "https://cdn.example.com/profile.jpg"
 *                           followDate:
 *                             type: string
 *                             format: date-time
 *                             description: When the seller started following the buyer
 *                             example: "2024-01-15T10:30:00.000Z"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total number of followers
 *                           example: 25
 *                         pages:
 *                           type: integer
 *                           description: Total number of pages
 *                           example: 3
 *                         current:
 *                           type: integer
 *                           description: Current page number
 *                           example: 1
 *                         hasMore:
 *                           type: boolean
 *                           description: Whether there are more pages
 *                           example: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid pagination parameters
 *       500:
 *         description: Internal server error
 */
router.get('/followers', verifyToken, isBuyer, buyerController.getFollowers);

/**
 * @swagger
 * /api/v2/buyers/following:
 *   get:
 *     summary: Get list of users the buyer follows (both buyers and sellers)
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Following list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Following retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     following:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: User ID (seller or buyer)
 *                             example: "507f1f77bcf86cd799439011"
 *                           type:
 *                             type: string
 *                             enum: [buyer, seller]
 *                             example: "seller"
 *                           name:
 *                             type: string
 *                             description: User's full name
 *                             example: "John Doe"
 *                           storeName:
 *                             type: string
 *                             nullable: true
 *                             description: Store name (only for sellers)
 *                             example: "John's Electronics"
 *                           profileImage:
 *                             type: string
 *                             nullable: true
 *                             description: URL to profile image
 *                             example: "https://cdn.example.com/profile.jpg"
 *                           followDate:
 *                             type: string
 *                             format: date-time
 *                             description: When the buyer started following this user
 *                             example: "2024-01-15T10:30:00.000Z"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total number of following
 *                           example: 25
 *                         pages:
 *                           type: integer
 *                           description: Total number of pages
 *                           example: 3
 *                         current:
 *                           type: integer
 *                           description: Current page number
 *                           example: 1
 *                         hasMore:
 *                           type: boolean
 *                           description: Whether there are more pages
 *                           example: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid pagination parameters
 *       500:
 *         description: Internal server error
 */
router.get('/following', verifyToken, isBuyer, buyerController.getFollowing);

module.exports = router;


