const express = require('express');
const router = express.Router();

const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/public-profile/{buyerId}:
 *   get:
 *     summary: Get public profile information for a buyer
 *     tags: [Buyer V2]
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The buyer's ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Public profile retrieved successfully
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
 *                   example: "Public profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     basicInfo:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                           example: "John"
 *                         lastName:
 *                           type: string
 *                           example: "Doe"
 *                         username:
 *                           type: string
 *                           example: "johndoe"
 *                         profileImage:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                               example: "https://example.com/profile.jpg"
 *                         bio:
 *                           type: string
 *                           example: "Passionate shopper and reviewer"
 *                         country:
 *                           type: string
 *                           example: "Nigeria"
 *                         joinedDate:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-01-15T10:30:00Z"
 *                         isIdentityVerified:
 *                           type: boolean
 *                           example: true
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalPosts:
 *                           type: number
 *                           example: 25
 *                         totalReviews:
 *                           type: number
 *                           example: 15
 *                         totalFollowers:
 *                           type: number
 *                           example: 120
 *                         totalFollowing:
 *                           type: number
 *                           example: 45
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             example: "product_review"
 *                           content:
 *                             type: string
 *                             example: "Great product, highly recommended!"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2023-12-01T15:30:00Z"
 *                     selectedCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Electronics"
 *                           subCategories:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "Smartphones"
 *       404:
 *         description: Buyer not found
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
 *                   example: "Buyer not found"
 *       422:
 *         description: Validation error
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
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "buyerId"
 *                       message:
 *                         type: string
 *                         example: "Invalid buyer ID format"
 *       500:
 *         description: Internal server error
 */
router.get('/public-profile/:buyerId', buyerController.getPublicProfile);

module.exports = router;


