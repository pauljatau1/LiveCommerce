const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');

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
 *         application/json:
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
 *               color:
 *                 type: string
 *               size:
 *                 type: string
 *               material:
 *                 type: string
 *               weight:
 *                 type: number
 *               dimensions:
 *                 type: string
 *               upc:
 *                 type: string
 *               shippingWeight:
 *                 type: number
 *               shippingDimensions:
 *                 type: string
 *               taxClass:
 *                 type: string
 *               taxRate:
 *                 type: number
 *               onSale:
 *                 type: boolean
 *               salePrice:
 *                 type: number
 *               warranty:
 *                 type: string
 *               minimumPurchaseQuantity:
 *                 type: integer
 *               vendor:
 *                 type: string
 *               metaDescription:
 *                 type: string
 *               metaKeywords:
 *                 type: string
 *               ramSize:
 *                 type: string
 *               storageCapacity:
 *                 type: string
 *               screenSize:
 *                 type: string
 *               resolution:
 *                 type: string
 *               processor:
 *                 type: string
 *               operatingSystem:
 *                 type: string
 *               batteryLife:
 *                 type: string
 *               connectivity:
 *                 type: string
 *               ageRange:
 *                 type: string
 *               ingredients:
 *                 type: string
 *               scent:
 *                 type: string
 *               calorieCount:
 *                 type: number
 *               compatibleDevices:
 *                 type: string
 *               sportsType:
 *                 type: string
 *               petType:
 *                 type: string
 *               travelType:
 *                 type: string
 *               gamingPlatform:
 *                 type: string
 *               includedAccessories:
 *                 type: string
 *               cleaningInstructions:
 *                 type: string
 *               furnitureType:
 *                 type: string
 *               durabilityRating:
 *                 type: string
 *               energyEfficiency:
 *                 type: string
 *               soundQuality:
 *                 type: string
 *               waterproof:
 *                 type: boolean
 *               smartFeatures:
 *                 type: string
 *               maxWeightCapacity:
 *                 type: number
 *               toyType:
 *                 type: string
 *               musicGenre:
 *                 type: string
 *               expirationDate:
 *                 type: string
 *                 format: date-time
 *               certifications:
 *                 type: string
 *               ecoFriendly:
 *                 type: boolean
 *               originCountry:
 *                 type: string
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
router.post('/create', authMiddleware.verifyToken, productController.createProduct);

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
 * /api/product/products/{id}:
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
 *         application/json:
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
 *               color:
 *                 type: string
 *               size:
 *                 type: string
 *               material:
 *                 type: string
 *               weight:
 *                 type: number
 *               dimensions:
 *                 type: string
 *               upc:
 *                 type: string
 *               shippingWeight:
 *                 type: number
 *               shippingDimensions:
 *                 type: string
 *               taxClass:
 *                 type: string
 *               taxRate:
 *                 type: number
 *               featuredProduct:
 *                 type: boolean
 *               onSale:
 *                 type: boolean
 *               salePrice:
 *                 type: number
 *               warranty:
 *                 type: string
 *               minimumPurchaseQuantity:
 *                 type: integer
 *               vendor:
 *                 type: string
 *               metaDescription:
 *                 type: string
 *               metaKeywords:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.put('/products/:id', authMiddleware.verifyToken, productController.updateProduct);

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
