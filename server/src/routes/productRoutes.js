const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/create', authMiddleware.verifyToken, productController.createProduct);
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProduct);
router.put('/products/:id', authMiddleware.verifyToken, productController.updateProduct);
router.delete('/products/:id', authMiddleware.verifyToken, productController.deleteProduct);
router.get('/products/search', productController.searchProducts);

router.put('/products/:id/price', authMiddleware.verifyToken, productController.updateProductPrice);
router.put('/products/:id/stock', authMiddleware.verifyToken, productController.updateProductStock);
router.get('/products/deep-search', productController.deepSearchProducts);
router.get('/products/just-arrived', productController.getJustArrivedProducts);
router.get('/products/best-selling', productController.getBestSellingProducts);

router.get('/products/selected-categories', authMiddleware.verifyToken, productController.getProductsBySelectedCategories);


module.exports = router;
