const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const optionalAuthMiddleware = require('../../../middlewares/optionalAuthMiddleware');
const { verifyToken } = require('../../../middlewares/authMiddleware');

// GET /api/v2/products/personalized
router.get('/personalized', optionalAuthMiddleware, productController.getPersonalizedProducts);

// Create product (authenticated)
router.post('/', verifyToken, productController.createProduct);

// Get all products
router.get('/', optionalAuthMiddleware, productController.getAllProducts);

// Get all products (alternative route)
router.get('/all', optionalAuthMiddleware, productController.getAllProducts);

// Deep search products
router.get('/search/deep', optionalAuthMiddleware, productController.deepSearchProducts);

// Just arrived
router.get('/just-arrived', optionalAuthMiddleware, productController.getJustArrivedProducts);

// Trending
router.get('/trending', optionalAuthMiddleware, productController.getTrendingProducts);

// Get product by id (formatted seller)
// router.get('/by-id/:id', optionalAuthMiddleware, productController.getProductById);

// Get product (aggregation/auction aware)
router.get('/:id', optionalAuthMiddleware, productController.getProduct);

module.exports = router;


