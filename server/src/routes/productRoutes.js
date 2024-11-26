const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });


/**
 * @swagger
 * /api/product/create:
 *   post:
 *     summary: Create a new product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               brand:
 *                 type: string
 *               stock:
 *                 type: number
 *               sku:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               blips:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               careInstructions:
 *                 type: string
 *               logistics:
 *                 type: object
 *                 properties:
 *                   shippingOptions:
 *                     type: array
 *                     items:
 *                       type: string
 *                   deliveryTime:
 *                     type: string
 *               warehouseLocation:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, active]
 *     responses:
 *       201:
 *         description: Product created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/create', authMiddleware.verifyToken, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'blips', maxCount: 10 }]), productController.createProduct);



/**
 * @swagger
 * /api/product/products:
 *   get:
 *     summary: Get all products
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/products', productController.getAllProducts);

/**
 * @swagger
 * /api/product/products/{id}:
 *   get:
 *     summary: Get a single product
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/products/:id', productController.getProduct);

/**
 * @swagger
 * /api/product/update/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               brand:
 *                 type: string
 *               stock:
 *                 type: number
 *               sku:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               blips:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               careInstructions:
 *                 type: string
 *               logistics:
 *                 type: object
 *                 properties:
 *                   shippingOptions:
 *                     type: array
 *                     items:
 *                       type: string
 *                   deliveryTime:
 *                     type: string
 *               warehouseLocation:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, active]
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.put('/update/:id', authMiddleware.verifyToken, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'blips', maxCount: 10 }]), productController.updateProduct);
/**
 * @swagger
 * /api/product/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.delete('/products/:id', authMiddleware.verifyToken, productController.deleteProduct);

/**
 * @swagger
 * /api/product/products/search:
 *   get:
 *     summary: Search products
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/products/search', productController.searchProducts);

/**
 * @swagger
 * /api/product/products/{id}/price:
 *   put:
 *     summary: Update product price
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product price updated successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.put('/products/:id/price', authMiddleware.verifyToken, productController.updateProductPrice);

/**
 * @swagger
 * /api/product/products/{id}/stock:
 *   put:
 *     summary: Update product stock
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stock:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product stock updated successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.put('/products/:id/stock', authMiddleware.verifyToken, productController.updateProductStock);

/**
 * @swagger
 * /api/product/products/deep-search:
 *   get:
 *     summary: Deep search products
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Deep search query
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/products/deep-search', productController.deepSearchProducts);

/**
 * @swagger
 * /api/product/products/just-arrived:
 *   get:
 *     summary: Get just arrived products
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: List of just arrived products retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/products/just-arrived', productController.getJustArrivedProducts);

/**
 * @swagger
 * /api/product/products/best-selling:
 *   get:
 *     summary: Get best selling products
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: List of best selling products retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/products/best-selling', productController.getBestSellingProducts);

/**
 * @swagger
 * /api/product/products/selected-categories:
 *   get:
 *     summary: Get products by selected categories
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.get('/products/selected-categories', authMiddleware.verifyToken, productController.getProductsBySelectedCategories);

module.exports = router;
