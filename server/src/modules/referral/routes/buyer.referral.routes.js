const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyer.referral.controller');
const authMiddleware = require('../../../middlewares/authMiddleware'); // assuming standard path for buyer auth token

// Ensure all routes are protected
router.use(authMiddleware.verifyToken, authMiddleware.isBuyer);

// GET /api/v2/buyers/referral/overview
router.get('/overview', buyerController.getOverview);

// GET /api/v2/buyers/referral/history
router.get('/history', buyerController.getHistory);

// POST /api/v2/buyers/referral/:referralId/remind
router.post('/:referralId/remind', buyerController.remindReferee);

module.exports = router;
