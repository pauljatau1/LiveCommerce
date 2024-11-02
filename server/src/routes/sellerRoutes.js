const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', sellerController.register);
router.post('/login', sellerController.login);
router.get('/profile', authMiddleware.verifyToken, sellerController.getProfile);
router.put('/profile', authMiddleware.verifyToken, sellerController.updateProfile);

module.exports = router;
