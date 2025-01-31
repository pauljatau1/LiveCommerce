const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

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

module.exports = router; 