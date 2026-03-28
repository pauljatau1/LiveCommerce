const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/seller.referral.controller');
const authMiddleware = require('../../../middlewares/authMiddleware');

// Ensure all routes are protected
router.use(authMiddleware.verifyToken, authMiddleware.isSeller);

// GET /api/v2/sellers/referral/overview
router.get('/overview', sellerController.getOverview);

// GET /api/v2/sellers/referral/history
router.get('/history', sellerController.getHistory);

// GET /api/v2/sellers/referral/:referralId
router.get('/:referralId', sellerController.getSingleReferral);

// POST /api/v2/sellers/referral/:referralId/remind
router.post('/:referralId/remind', sellerController.remindReferee);

// PATCH /api/v2/sellers/referral/link-target
router.patch('/link-target', sellerController.updateLinkTarget);

module.exports = router;
