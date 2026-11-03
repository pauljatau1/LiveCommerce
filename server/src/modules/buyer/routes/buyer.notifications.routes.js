const express = require('express');
const router = express.Router();

const { verifyToken } = require('../../../middlewares/authMiddleware');
const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/notification-preferences:
 *   get:
 *     summary: Get buyer's notification preferences
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences retrieved successfully
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
 *                   example: "Notification preferences retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     preferences:
 *                       type: object
 *                       properties:
 *                         orderUpdates:
 *                           type: object
 *                           properties:
 *                             orderConfirmation:
 *                               type: boolean
 *                               example: true
 *                             shippingAndDelivery:
 *                               type: boolean
 *                               example: true
 *                             orderCancellation:
 *                               type: boolean
 *                               example: false
 *                             refundUpdates:
 *                               type: boolean
 *                               example: true
 *                         liveShows:
 *                           type: object
 *                           properties:
 *                             allShows:
 *                               type: boolean
 *                               example: true
 *                             followedSellers:
 *                               type: boolean
 *                               example: true
 *                             recommendedShows:
 *                               type: boolean
 *                               example: false
 *                         messages:
 *                           type: object
 *                           properties:
 *                             fromSellers:
 *                               type: boolean
 *                               example: true
 *                             fromBuyers:
 *                               type: boolean
 *                               example: false
 *                             chatReplies:
 *                               type: boolean
 *                               example: true
 *                             mentions:
 *                               type: boolean
 *                               example: true
 *                         communityActivity:
 *                           type: object
 *                           properties:
 *                             postComments:
 *                               type: boolean
 *                               example: true
 *                             postLikes:
 *                               type: boolean
 *                               example: false
 *                             repliesAndMentions:
 *                               type: boolean
 *                               example: true
 *                         promotionsAndSales:
 *                           type: object
 *                           properties:
 *                             flashSales:
 *                               type: boolean
 *                               example: true
 *                             couponsAndDeals:
 *                               type: boolean
 *                               example: true
 *                             trendingProducts:
 *                               type: boolean
 *                               example: false
 *                             recommendations:
 *                               type: boolean
 *                               example: true
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid input data
 *       500:
 *         description: Internal server error
 */
router.get('/notification-preferences', verifyToken, buyerController.getNotificationPreferences);

/**
 * @swagger
 * /api/v2/buyers/notification-preferences:
 *   put:
 *     summary: Update buyer's notification preferences
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - preferences
 *             properties:
 *               preferences:
 *                 type: object
 *                 properties:
 *                   orderUpdates:
 *                     type: object
 *                     properties:
 *                       orderConfirmation:
 *                         type: boolean
 *                         example: true
 *                       shippingAndDelivery:
 *                         type: boolean
 *                         example: true
 *                       orderCancellation:
 *                         type: boolean
 *                         example: false
 *                       refundUpdates:
 *                         type: boolean
 *                         example: true
 *                   liveShows:
 *                     type: object
 *                     properties:
 *                       allShows:
 *                         type: boolean
 *                         example: true
 *                       followedSellers:
 *                         type: boolean
 *                         example: true
 *                       recommendedShows:
 *                         type: boolean
 *                         example: false
 *                   messages:
 *                     type: object
 *                     properties:
 *                       fromSellers:
 *                         type: boolean
 *                         example: true
 *                       fromBuyers:
 *                         type: boolean
 *                         example: false
 *                       chatReplies:
 *                         type: boolean
 *                         example: true
 *                       mentions:
 *                         type: boolean
 *                         example: true
 *                   communityActivity:
 *                     type: object
 *                     properties:
 *                       postComments:
 *                         type: boolean
 *                         example: true
 *                       postLikes:
 *                         type: boolean
 *                         example: false
 *                       repliesAndMentions:
 *                         type: boolean
 *                         example: true
 *                   promotionsAndSales:
 *                     type: object
 *                     properties:
 *                       flashSales:
 *                         type: boolean
 *                         example: true
 *                       couponsAndDeals:
 *                         type: boolean
 *                         example: true
 *                       trendingProducts:
 *                         type: boolean
 *                         example: false
 *                       recommendations:
 *                         type: boolean
 *                         example: true
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
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
 *                   example: "Notification preferences updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     preferences:
 *                       type: object
 *                       properties:
 *                         orderUpdates:
 *                           type: object
 *                           properties:
 *                             orderConfirmation:
 *                               type: boolean
 *                               example: true
 *                             shippingAndDelivery:
 *                               type: boolean
 *                               example: true
 *                             orderCancellation:
 *                               type: boolean
 *                               example: false
 *                             refundUpdates:
 *                               type: boolean
 *                               example: true
 *                         liveShows:
 *                           type: object
 *                           properties:
 *                             allShows:
 *                               type: boolean
 *                               example: true
 *                             followedSellers:
 *                               type: boolean
 *                               example: true
 *                             recommendedShows:
 *                               type: boolean
 *                               example: false
 *                         messages:
 *                           type: object
 *                           properties:
 *                             fromSellers:
 *                               type: boolean
 *                               example: true
 *                             fromBuyers:
 *                               type: boolean
 *                               example: false
 *                             chatReplies:
 *                               type: boolean
 *                               example: true
 *                             mentions:
 *                               type: boolean
 *                               example: true
 *                         communityActivity:
 *                           type: object
 *                           properties:
 *                             postComments:
 *                               type: boolean
 *                               example: true
 *                             postLikes:
 *                               type: boolean
 *                               example: false
 *                             repliesAndMentions:
 *                               type: boolean
 *                               example: true
 *                         promotionsAndSales:
 *                           type: object
 *                           properties:
 *                             flashSales:
 *                               type: boolean
 *                               example: true
 *                             couponsAndDeals:
 *                               type: boolean
 *                               example: true
 *                             trendingProducts:
 *                               type: boolean
 *                               example: false
 *                             recommendations:
 *                               type: boolean
 *                               example: true
 */
router.put('/notification-preferences', verifyToken, buyerController.updateNotificationPreferences);

module.exports = router;


