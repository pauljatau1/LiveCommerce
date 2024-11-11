const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', sellerController.register);
router.post('/login', sellerController.login);
router.get('/profile', authMiddleware.verifyToken, sellerController.getProfile);
router.put('/profile', authMiddleware.verifyToken, sellerController.updateProfile);
router.post('/verify-otp', sellerController.verifyOTP);
router.post('/select-categories', authMiddleware.verifyToken, sellerController.selectCategories);
router.put('/update-categories', authMiddleware.verifyToken, sellerController.updateCategories);
router.get('/followers', authMiddleware.verifyToken, sellerController.getFollowers);

module.exports = router;
