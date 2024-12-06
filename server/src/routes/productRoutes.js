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
 *               subCategory:
 *                 type: string
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
 *               subCategory:
 *                 type: string
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

/**
 * @swagger
 * /api/product/feed:
 *   get:
 *     summary: Get products for buyer's feed based on their selected categories
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of feed products retrieved successfully
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.get('/feed', authMiddleware.verifyToken, productController.getBuyerFeedProducts);

/**
 * @swagger
 * /api/product/trending:
 *   get:
 *     summary: Get trending products
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: List of trending products retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/trending', productController.getTrendingProducts);

/**
 * @swagger
 * /api/product/trending/{category}:
 *   get:
 *     summary: Get trending products by category
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: category
 *         schema:
 *           type: string
 *         required: true
 *         description: Category name
 *     responses:
 *       200:
 *         description: List of trending products in category retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/trending/:category', productController.getTrendingProductsByCategory);

/**
 * @swagger
 * /api/product/category/{category}:
 *   get:
 *     summary: Get products by category with pagination
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: category
 *         schema:
 *           type: string
 *         required: true
 *         description: Category name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of products in category retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/category/:category', productController.getProductsByCategory);

/**
 * @swagger
 * /api/product/wishlist/add/{productId}:
 *   post:
 *     summary: Add a product to buyer's wishlist
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: ID of the product to add to wishlist
 *     responses:
 *       200:
 *         description: Product added to wishlist successfully
 *       404:
 *         description: Product or buyer not found
 */
router.post('/wishlist/add/:productId', authMiddleware.verifyToken, productController.addToWishlist);

/**
 * @swagger
 * /api/product/wishlist/remove/{productId}:
 *   delete:
 *     summary: Remove a product from buyer's wishlist
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: ID of the product to remove from wishlist
 *     responses:
 *       200:
 *         description: Product removed from wishlist successfully
 *       404:
 *         description: Product or buyer not found
 */
router.delete('/wishlist/remove/:productId', authMiddleware.verifyToken, productController.removeFromWishlist);

/**
 * @swagger
 * /api/product/wishlist:
 *   get:
 *     summary: Get buyer's wishlist
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *       404:
 *         description: Buyer not found
 */
router.get('/wishlist', authMiddleware.verifyToken, productController.getWishlist);

module.exports = router;
