const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/analytics/livestreams/24h:
 *   get:
 *     summary: Get total number of livestreams in a 24 hour period
 *     description: Retrieves analytics about livestreams that ended on a specific date
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional date parameter (YYYY-MM-DD). If not provided, will use yesterday.
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: '2023-04-01'
 *                     totalLivestreams:
 *                       type: integer
 *                       example: 5
 *                     streams:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/livestreams/24h', authMiddleware.verifyToken, authMiddleware.isAdmin, analyticsController.getTotalNumberOfLivestreamin24Hours);

/**
 * @swagger
 * /api/analytics/livestreams/weekly:
 *   get:
 *     summary: Get livestream analytics for a specific week
 *     description: Retrieves analytics about livestreams that ended within a specified week
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *         description: Week in YYYY-WW format (e.g., 2023-42). If not provided, will use previous week.
 *     responses:
 *       200:
 *         description: Weekly analytics data retrieved successfully
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/livestreams/weekly', authMiddleware.verifyToken, authMiddleware.isAdmin, analyticsController.getWeeklyLivestreamAnalytics);

/**
 * @swagger
 * /api/analytics/livestreams/monthly:
 *   get:
 *     summary: Get livestream analytics for a specific month
 *     description: Retrieves analytics about livestreams that ended within a specified month
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Month in YYYY-MM format (e.g., 2023-11). If not provided, will use previous month.
 *     responses:
 *       200:
 *         description: Monthly analytics data retrieved successfully
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/livestreams/monthly', authMiddleware.verifyToken, authMiddleware.isAdmin, analyticsController.getMonthlyLivestreamAnalytics);

/**
 * @swagger
 * /api/analytics/livestreams:
 *   get:
 *     summary: Get livestream analytics by date range
 *     description: Retrieves analytics about livestreams that ended within a specified date range
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date in YYYY-MM-DD format
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *       400:
 *         description: Missing date parameters
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/livestreams', authMiddleware.verifyToken, authMiddleware.isAdmin, analyticsController.getLivestreamsByDateRange);

module.exports = router; 