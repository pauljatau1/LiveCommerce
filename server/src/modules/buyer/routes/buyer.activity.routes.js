const express = require('express');
const router = express.Router();

const { verifyToken, isBuyer } = require('../../../middlewares/authMiddleware');
const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/toggle-activity:
 *   post:
 *     summary: Toggle buyer's activity status
 *     description: Toggles the buyer's account between active and inactive states
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity status toggled successfully
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
 *                   example: "Account successfully deactivated"
 *                 data:
 *                   type: object
 *                   properties:
 *                     isActive:
 *                       type: boolean
 *                       example: false
 *                     message:
 *                       type: string
 *                       example: "Account successfully deactivated"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/toggle-activity', verifyToken, isBuyer, buyerController.toggleActivityStatus);

/**
 * @swagger
 * /api/v2/buyers/activity-status:
 *   get:
 *     summary: Get buyer's activity status
 *     description: Retrieves the current activity status of the buyer's account
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved activity status
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
 *                   example: "Activity status retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.get('/activity-status', verifyToken, isBuyer, buyerController.getActivityStatus);

module.exports = router;


