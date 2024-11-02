const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', buyerController.register);
router.post('/login', buyerController.login);
router.get('/profile', authMiddleware.verifyToken, buyerController.getProfile);
router.put('/profile', authMiddleware.verifyToken, buyerController.updateProfile); 

module.exports = router;