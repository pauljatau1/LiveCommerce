const express = require('express');
const router = express.Router();

const listingController = require('../controllers/listing.controller');
const authMiddleware = require('../../../middlewares/authMiddleware');

/**
 * @swagger
 * /api/users/{userId}/listings:
 *   get:
 *     summary: Get list of listings (paginated or unpaginated based on query params)
 *     description: Requires valid JWT
 *     tags:
 *       - Listings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: A list of listings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Listing'
 *       401:
 *         description: Unauthorized (JWT missing or invalid)
 */
router.get('/', authMiddleware.verifyToken, listingController.index);

module.exports = router;