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

/**
 * @swagger
 * /api/product/blips:
 *   get:
 *     summary: Get all product blips
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of product blips retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/blips', productController.getAllBlips);

/**
 * @swagger
 * /api/product/seller/{sellerId}/blips:
 *   get:
 *     summary: Get all blips from a specific seller
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         description: ID of the seller
 *     responses:
 *       200:
 *         description: List of seller's blips retrieved successfully
 */
router.get('/seller/:sellerId/blips', productController.getSellerBlips);

/**
 * @swagger
 * /api/product/seller/{sellerId}/products:
 *   get:
 *     summary: Get all products from a specific seller
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         description: ID of the seller
 *     responses:
 *       200:
 *         description: List of seller's products retrieved successfully
 */
router.get('/seller/:sellerId/products', productController.getSellerProducts);

/**
 * @swagger
 * /api/product/seller/{sellerId}/reviews:
 *   get:
 *     summary: Get all product reviews for a specific seller
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         description: ID of the seller
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 20
 *     responses:
 *       200:
 *         description: List of seller's product reviews retrieved successfully
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
router.get('/seller/:sellerId/reviews', productController.getSellerReviews);

// Inventory management
router.put('/products/:id/inventory', authMiddleware.verifyToken, productController.updateInventory);
router.post('/products/:id/variants', authMiddleware.verifyToken, productController.addVariant);
router.delete('/products/:id/variants/:variantId', authMiddleware.verifyToken, productController.removeVariant);

// Bulk operations
router.post('/products/bulk-update', authMiddleware.verifyToken, productController.bulkUpdate);
router.post('/products/bulk-delete', authMiddleware.verifyToken, productController.bulkDelete);
 
// Analytics and reporting
router.get('/products/:id/analytics', authMiddleware.verifyToken, productController.getProductAnalytics);
router.get('/products/low-stock', authMiddleware.verifyToken, productController.getLowStockProducts);
router.get('/products/performance', authMiddleware.verifyToken, productController.getProductPerformance);

// Product reviews and ratings
router.post('/products/:id/reviews', authMiddleware.verifyToken, productController.addReview);
router.get('/products/:id/reviews', productController.getProductReviews);
router.put('/products/:id/reviews/:reviewId', authMiddleware.verifyToken, productController.updateReview);

// SEO and visibility
router.put('/products/:id/seo', authMiddleware.verifyToken, productController.updateSEO);
router.put('/products/:id/visibility', authMiddleware.verifyToken, productController.updateVisibility);

/**
 * @swagger
 * /api/product/products/{id}/inventory:
 *   put:
 *     summary: Update product inventory
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: Current stock quantity
 *               lowStockThreshold:
 *                 type: number
 *                 description: Threshold for low stock alerts
 *               sku:
 *                 type: string
 *                 description: Stock keeping unit
 *               barcode:
 *                 type: string
 *                 description: Product barcode
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *       403:
 *         description: Not authorized to update this product
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /api/product/products/{id}/variants:
 *   post:
 *     summary: Add product variant
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Variant name (e.g., "Size", "Color")
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: string
 *                     inventory:
 *                       type: number
 *                     price:
 *                       type: number
 *     responses:
 *       200:
 *         description: Variant added successfully
 *       400:
 *         description: Invalid variant data
 *       403:
 *         description: Not authorized to update this product
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /api/product/products/{id}/variants/{variantId}:
 *   delete:
 *     summary: Remove product variant
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Variant removed successfully
 *       403:
 *         description: Not authorized to update this product
 *       404:
 *         description: Product or variant not found
 */

/**
 * @swagger
 * /api/product/products/bulk-update:
 *   post:
 *     summary: Bulk update products
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     updates:
 *                       type: object
 *     responses:
 *       200:
 *         description: Products updated successfully
 *       403:
 *         description: Not authorized to update some products
 */

/**
 * @swagger
 * /api/product/products/bulk-delete:
 *   post:
 *     summary: Bulk delete products
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Products deleted successfully
 *       403:
 *         description: Not authorized to delete some products
 */

/**
 * @swagger
 * /api/product/products/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of low stock products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/product/products/{id}/performance:
 *   get:
 *     summary: Get product performance metrics
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *         default: 30d
 *     responses:
 *       200:
 *         description: Product performance metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 views:
 *                   type: number
 *                 sales:
 *                   type: number
 *                 revenue:
 *                   type: number
 *                 conversionRate:
 *                   type: number
 */

/**
 * @swagger
 * /api/product/products/{id}/reviews:
 *   post:
 *     summary: Add a product review
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review added successfully
 *       404:
 *         description: Product not found
 *
 *   get:
 *     summary: Get product reviews
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 currentPage:
 *                   type: number
 *                 totalPages:
 *                   type: number
 *                 totalReviews:
 *                   type: number
 */

/**
 * @swagger
 * /api/product/products/{id}/reviews/{reviewId}:
 *   put:
 *     summary: Update a product review
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       403:
 *         description: Not authorized to update this review
 *       404:
 *         description: Product or review not found
 */

/**
 * @swagger
 * /api/product/products/{id}/visibility:
 *   put:
 *     summary: Update product visibility
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visibility:
 *                 type: string
 *                 enum: [visible, hidden, featured]
 *     responses:
 *       200:
 *         description: Product visibility updated successfully
 *       403:
 *         description: Not authorized to update this product
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         buyer:
 *           type: object
 *           properties:
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             profileImage:
 *               type: string
 *         rating:
 *           type: number
 *         comment:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = router;
