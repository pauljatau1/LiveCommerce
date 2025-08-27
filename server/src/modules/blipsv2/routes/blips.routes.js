const express = require('express');
const router = express.Router();
const blipsController = require('../controllers/blips.controller');
const optionalAuthMiddleware = require('../../../middlewares/optionalAuthMiddleware');
const { verifyToken } = require('../../../middlewares/authMiddleware');

// Get personalized blips
router.get('/personalized', optionalAuthMiddleware, blipsController.getPersonalizedBlips);

// Get suggested blips
router.get('/suggested', optionalAuthMiddleware, blipsController.getSuggestedBlips);

// Get related blips
router.get('/related/:blipId', optionalAuthMiddleware, blipsController.getRelatedBlips);

// Get new blips
router.get('/new', optionalAuthMiddleware, blipsController.getNewBlips);

// Get trending blips
router.get('/trending', optionalAuthMiddleware, blipsController.getTrendingBlips);

// Get following blips (requires authentication)
router.get('/following', verifyToken, blipsController.getFollowingBlips);

module.exports = router;
