const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const Announcement = require('../models/Annoucement')
const Resource = require('../models/Resource')

/**
 * @swagger
 * /api/public/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/categories', adminController.getCategories);

/**
 * @swagger
 * /api/public/banners:
 *   get:
 *     summary: Get all banners
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of banners retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/banners', adminController.getAllBanners);

/**
 * @swagger
 * /api/public/announcements:
 *   get:
 *     summary: Get all announcements
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of announcements retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find();
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/public/resources:
 *   get:
 *     summary: Get all resources
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of resources retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   media:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [file, image, video]
 *                       url:
 *                         type: string
 *                   banner:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                   link:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/resources', async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


