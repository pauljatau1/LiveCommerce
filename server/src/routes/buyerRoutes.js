const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');
const authMiddleware = require('../middlewares/authMiddleware');
const passport = require('passport');

router.post('/register', buyerController.register);
router.post('/login', buyerController.login);
router.get('/profile', authMiddleware.verifyToken, buyerController.getProfile);
router.put('/profile', authMiddleware.verifyToken, buyerController.updateProfile);
router.post('/verify-otp', buyerController.verifyOTP);
router.put('/selected-categories', authMiddleware.verifyToken, buyerController.updateSelectedCategories);



// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google-callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  const { user, token } = req.user;
  res.json({ user, token });
});

module.exports = router;



