const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Tracking endpoints
router.get('/track/open/:trackingId', campaignController.trackEmailOpen);
router.get('/track/click/:trackingId', campaignController.trackEmailClick);

/**
 * @swagger
 * /api/campaigns/performance:
 *   get:
 *     summary: Get detailed campaign performance metrics
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7, 30, 90, 180, 365]
 *           default: 30
 *     responses:
 *       200:
 *         description: Detailed campaign performance metrics
 *       500:
 *         description: Server error
 */
router.get('/performance',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  campaignController.getCampaignPerformance
);

/**
 * @swagger
 * /api/campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaigns]
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
 *               message:
 *                 type: string
 *               audienceType:
 *                 type: string
 *                 enum: [all, active, inactive]
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *               products:
 *                 type: array
 *                 items:
 *                   type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *       400:
 *         description: Invalid request or daily limit reached
 *       500:
 *         description: Server error
 */
router.post('/',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  upload.array('media', 5),
  campaignController.createCampaign
);

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: Get all campaigns for the authenticated seller
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, scheduled, sent, failed]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of campaigns
 *       500:
 *         description: Server error
 */
router.get('/',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  campaignController.getCampaigns
);

/**
 * @swagger
 * /api/campaigns/trends:
 *   get:
 *     summary: Get campaign trends for the authenticated seller
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of campaign trends
 *       500:
 *         description: Server error
 */
router.get('/trends',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  campaignController.getCampaignTrends
);

/**
 * @swagger
 * /api/campaigns/stats:
 *   get:
 *     summary: Get campaign statistics for the authenticated seller
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Campaign statistics
 *       500:
 *         description: Server error
 */
router.get('/stats',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  campaignController.getCampaignStats
);

module.exports = router; 