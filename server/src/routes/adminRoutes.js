const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', adminController.register);
router.post('/login', adminController.login);
router.get('/profile', authMiddleware.verifyToken, adminController.getProfile);

router.get('/users', authMiddleware.verifyToken, adminController.getAllUsers);
router.get('/sellers', authMiddleware.verifyToken, adminController.getAllSellers);
router.put('/sellers/:sellerId/disable', authMiddleware.verifyToken, adminController.disableSeller);
router.put('/buyers/:buyerId/disable', authMiddleware.verifyToken, adminController.disableBuyer);
router.get('/products', authMiddleware.verifyToken, adminController.getAllProducts);
router.post('/categories', authMiddleware.verifyToken, adminController.createCategory);
router.get('/categories', authMiddleware.verifyToken, adminController.getCategories);

module.exports = router;
