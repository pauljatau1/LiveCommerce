const express = require('express');
const router = express.Router();

const { verifyToken, isBuyer } = require('../../../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../../../middlewares/optionalAuthMiddleware');
const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/sellers:
 *   get:
 *     summary: Get list of sellers that can be followed
 *     description: Returns a list of sellers with filtering, pagination, and sorting options. If authenticated, excludes already followed sellers.
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Number of sellers per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for store name or business name
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category name
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [rating, followers, newest]
 *           default: rating
 *         description: Sort criteria for sellers
 *     responses:
 *       200:
 *         description: List of sellers retrieved successfully
 *       400:
 *         description: Bad request - Invalid query parameters
 *       422:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.get('/sellers', verifyToken, isBuyer, buyerController.getSellersToFollow);

/**
 * @swagger
 * /api/v2/buyers/seller/{sellerId}:
 *   get:
 *     summary: Get detailed seller profile and store information (Public endpoint)
 *     description: |
 *       Retrieves comprehensive seller profile information including store details, 
 *       business information, statistics, and reviews. This endpoint works with or 
 *       without authentication. When authenticated, it provides additional context 
 *       like following status.
 *     tags: [Buyer V2]
 *     security: []  # No authentication required
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller to fetch
 *       - in: header
 *         name: Authorization
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional Bearer token for authenticated requests (provides following status)
 *     responses:
 *       200:
 *         description: Seller profile retrieved successfully
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
 *                   example: "Seller profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     personalInfo:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                     storeInfo:
 *                       type: object
 *                       properties:
 *                         storeName:
 *                           type: string
 *                         aboutStore:
 *                           type: string
 *                         storeAvatar:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                         storeBanner:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                         isVerified:
 *                           type: boolean
 *                         isFeatured:
 *                           type: boolean
 *                         accountPending:
 *                           type: boolean
 *                         joinedDate:
 *                           type: string
 *                           format: date-time
 *                         bio:
 *                           type: string
 *                         isFollowing:
 *                           type: boolean
 *                           description: Only present when authenticated
 *                         socialMedia:
 *                           type: object
 *                           properties:
 *                             instagram:
 *                               type: string
 *                             facebook:
 *                               type: string
 *                             tiktok:
 *                               type: string
 *                     businessInfo:
 *                       type: object
 *                       properties:
 *                         businessName:
 *                           type: string
 *                         businessType:
 *                           type: string
 *                         categories:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               subCategories:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                         addresses:
 *                           type: object
 *                           properties:
 *                             business:
 *                               type: object
 *                             warehouse:
 *                               type: object
 *                             seller:
 *                               type: object
 *                     location:
 *                       type: object
 *                       properties:
 *                         country:
 *                           type: string
 *                         state:
 *                           type: string
 *                         city:
 *                           type: string
 *                     storePolicies:
 *                       type: object
 *                       properties:
 *                         delivery:
 *                           type: object
 *                           properties:
 *                             processingTime:
 *                               type: string
 *                             deliveryTimes:
 *                               type: string
 *                             freeShippingPolicy:
 *                               type: string
 *                             allowsCod:
 *                               type: boolean
 *                         returns:
 *                           type: object
 *                           properties:
 *                             returnWindow:
 *                               type: number
 *                             returnCondition:
 *                               type: string
 *                             returnShipping:
 *                               type: string
 *                             nonRefundableItems:
 *                               type: array
 *                               items:
 *                                 type: string
 *                         refunds:
 *                           type: object
 *                           properties:
 *                             refundPolicy:
 *                               type: string
 *                             refundMethod:
 *                               type: string
 *                             lostOrDamagedPolicy:
 *                               type: string
 *                         exchange:
 *                           type: object
 *                           properties:
 *                             exchangePolicy:
 *                               type: string
 *                     stats:
 *                       type: object
 *                       properties:
 *                         followersCount:
 *                           type: number
 *                         followingCount:
 *                           type: number
 *                         totalOrders:
 *                           type: number
 *                         totalStreams:
 *                           type: number
 *                         soldItems:
 *                           type: number
 *                     reviews:
 *                       type: object
 *                       properties:
 *                         averageRating:
 *                           type: number
 *                         totalReviews:
 *                           type: number
 *                         ratingDistribution:
 *                           type: object
 *                           properties:
 *                             "1":
 *                               type: number
 *                             "2":
 *                               type: number
 *                             "3":
 *                               type: number
 *                             "4":
 *                               type: number
 *                             "5":
 *                               type: number
 *       404:
 *         description: Seller not found
 *       422:
 *         description: Validation error - Invalid seller ID format
 *       500:
 *         description: Internal server error
 */
router.get('/seller/:sellerId', optionalAuthMiddleware, buyerController.getSellerProfile);

/**
 * @swagger
 * /api/v2/buyers/seller/{sellerId}/review:
 *   post:
 *     summary: Write a review for a seller's store
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller to review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 minLength: 10
 *                 description: Review comment
 *                 example: "Great seller! Fast delivery and excellent products."
 *     responses:
 *       201:
 *         description: Review created successfully
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
 *                   example: "Review submitted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       type: object
 *                       properties:
 *                         buyer:
 *                           type: string
 *                           description: Buyer ID
 *                           example: "507f1f77bcf86cd799439011"
 *                         rating:
 *                           type: number
 *                           example: 5
 *                         comment:
 *                           type: string
 *                           example: "Great seller! Fast delivery and excellent products."
 *                         buyerName:
 *                           type: string
 *                           example: "John Doe"
 *                         buyerImage:
 *                           type: string
 *                           nullable: true
 *                           example: "https://cdn.example.com/profile.jpg"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00.000Z"
 *                         isVerifiedPurchase:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Invalid input or already reviewed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You have already reviewed this seller"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Buyer must be a follower or have made a purchase
 *       404:
 *         description: Seller not found
 *       422:
 *         description: Validation error - Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/seller/:sellerId/review', verifyToken, isBuyer, buyerController.reviewSeller);

/**
 * @swagger
 * /api/v2/buyers/seller/{sellerId}/reviews:
 *   get:
 *     summary: Get all reviews for a seller's store
 *     tags: [Buyer V2]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller
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
 *         description: Number of reviews per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, rating-high, rating-low]
 *           default: recent
 *         description: Sort order for reviews
 *     responses:
 *       200:
 *         description: List of seller reviews
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
 *                   example: "Seller reviews retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           rating:
 *                             type: number
 *                             example: 5
 *                           comment:
 *                             type: string
 *                             example: "Great seller! Fast delivery and excellent products."
 *                           buyer:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "507f1f77bcf86cd799439012"
 *                               name:
 *                                 type: string
 *                                 example: "John Doe"
 *                               image:
 *                                 type: string
 *                                 nullable: true
 *                                 example: "https://cdn.example.com/profile.jpg"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           isVerifiedPurchase:
 *                             type: boolean
 *                             example: true
 *                     stats:
 *                       type: object
 *                       properties:
 *                         averageRating:
 *                           type: number
 *                           example: 4.5
 *                         totalReviews:
 *                           type: number
 *                           example: 25
 *                         ratingDistribution:
 *                           type: object
 *                           properties:
 *                             "1":
 *                               type: number
 *                               example: 1
 *                             "2":
 *                               type: number
 *                               example: 2
 *                             "3":
 *                               type: number
 *                               example: 3
 *                             "4":
 *                               type: number
 *                               example: 8
 *                             "5":
 *                               type: number
 *                               example: 11
 *                         verifiedPurchaseCount:
 *                           type: number
 *                           example: 20
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                           example: 1
 *                         totalPages:
 *                           type: number
 *                           example: 3
 *                         totalReviews:
 *                           type: number
 *                           example: 25
 *       404:
 *         description: Seller not found
 *       422:
 *         description: Validation error - Invalid input data
 *       500:
 *         description: Internal server error
 */
router.get('/seller/:sellerId/reviews', buyerController.getSellerReviews);

module.exports = router;


