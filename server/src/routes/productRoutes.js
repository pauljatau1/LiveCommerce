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

module.exports = router;
