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
router.put('/sellers/:sellerId/feature', authMiddleware.verifyToken, adminController.markSellerAsFeatured);
router.put('/buyers/:buyerId/disable', authMiddleware.verifyToken, adminController.disableBuyer);
router.get('/products', authMiddleware.verifyToken, adminController.getAllProducts);
router.post('/categories', authMiddleware.verifyToken, adminController.createCategory);
router.get('/categories', authMiddleware.verifyToken, adminController.getCategories);
router.post('/banners', authMiddleware.verifyToken, adminController.createBanner);
router.put('/banners/:bannerId', authMiddleware.verifyToken, adminController.updateBanner);
router.delete('/banners/:bannerId', authMiddleware.verifyToken, adminController.deleteBanner);
router.get('/banners', authMiddleware.verifyToken, adminController.getAllBanners);
router.get('/banners/category/:categoryId', authMiddleware.verifyToken, adminController.getBannersByCategory);
router.get('/orders', authMiddleware.verifyToken, adminController.getAllOrdersAdmin);
router.put('/orders/:id', authMiddleware.verifyToken, adminController.updateOrderStatusAdmin);


module.exports = router;
