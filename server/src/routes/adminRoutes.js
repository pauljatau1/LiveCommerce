const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

// Admin authentication routes
router.post('/register', adminController.register);
router.post('/login', adminController.login);
router.get('/profile', authMiddleware.verifyToken, adminController.getProfile);

// User management routes
router.get('/users', authMiddleware.verifyToken, adminController.getAllUsers);
router.get('/sellers', authMiddleware.verifyToken, adminController.getAllSellers);
router.put('/sellers/:sellerId/disable', authMiddleware.verifyToken, adminController.disableSeller);
router.put('/sellers/:sellerId/enable', authMiddleware.verifyToken, adminController.enableSeller);
router.put('/sellers/:sellerId/feature', authMiddleware.verifyToken, adminController.markSellerAsFeatured);
router.put('/buyers/:buyerId/disable', authMiddleware.verifyToken, adminController.disableBuyer);
router.put('/buyers/:buyerId/enable', authMiddleware.verifyToken, adminController.enableBuyer);

// Product and category management routes
router.get('/products', authMiddleware.verifyToken, adminController.getAllProducts);
router.post('/categories', authMiddleware.verifyToken, adminController.createCategory);
router.get('/categories', authMiddleware.verifyToken, adminController.getCategories);
router.put('/categories/:id', authMiddleware.verifyToken, adminController.updateCategory);
router.delete('/categories/:id', authMiddleware.verifyToken, adminController.deleteCategory);

// Banner management routes
router.post('/banners', authMiddleware.verifyToken, adminController.createBanner);
router.put('/banners/:bannerId', authMiddleware.verifyToken, adminController.updateBanner);
router.delete('/banners/:bannerId', authMiddleware.verifyToken, adminController.deleteBanner);
router.get('/banners', authMiddleware.verifyToken, adminController.getAllBanners);
router.get('/banners/category/:categoryId', authMiddleware.verifyToken, adminController.getBannersByCategory);

// Order management routes
router.get('/orders', authMiddleware.verifyToken, adminController.getAllOrdersAdmin);
router.put('/orders/:id', authMiddleware.verifyToken, adminController.updateOrderStatusAdmin);

module.exports = router;
