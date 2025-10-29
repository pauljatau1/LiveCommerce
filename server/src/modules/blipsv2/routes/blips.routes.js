const express = require('express');
const router = express.Router();
const blipsController = require('../controllers/blips.controller');
const optionalAuthMiddleware = require('../../../middlewares/optionalAuthMiddleware');
const { verifyToken, isBuyer } = require('../../../middlewares/authMiddleware');

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

// Get top blips (recent + high engagement) with optional auth
router.get('/top', optionalAuthMiddleware, blipsController.getTopBlips);

// Get blips by category (query ?category= or path /:category)
router.get('/by-category', optionalAuthMiddleware, blipsController.getBlipsByCategory);

// Get blips by a random category (ensures at least 6 blips exist)
router.get('/by-random-category', optionalAuthMiddleware, blipsController.getBlipsByRandomCategory);

// Get following blips (requires authentication)
router.get('/following', verifyToken, blipsController.getFollowingBlips);

// Get blips categories with statistics (optional authentication)
router.get('/categories', optionalAuthMiddleware, blipsController.getBlipsCategories);

// Save a blip for the authenticated buyer
router.post('/:blipId/save', verifyToken, isBuyer, blipsController.saveBlip);

// Check if a blip is saved by the authenticated buyer
router.get('/:blipId/saved', verifyToken, isBuyer, blipsController.isBlipSaved);

// Unsave a blip for the authenticated buyer
router.delete('/:blipId/save', verifyToken, isBuyer, blipsController.unsaveBlip);

// Get all saved blips for the authenticated buyer (paginated)
router.get('/saved', verifyToken, isBuyer, blipsController.getSavedBlips);

module.exports = router;
