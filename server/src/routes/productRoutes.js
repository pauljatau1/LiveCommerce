const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/products/blips:
 *   get:
 *     summary: Get all blips from all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of blips per page
 *         default: 10
 *     responses:
 *       200:
 *         description: Successfully retrieved blips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 blips:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                         description: URL of the blip video
 *                       thumbnail:
 *                         type: string
 *                         description: URL of the blip thumbnail
 *                       productId:
 *                         type: string
 *                         description: ID of the associated product
 *                       sellerId:
 *                         type: string
 *                         description: ID of the seller
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalBlips:
 *                       type: integer
 *       500:
 *         description: Server error
 * 
 * /api/products/seller/{sellerId}/blips:
 *   get:
 *     summary: Get all blips from a specific seller
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of blips per page
 *         default: 10
 *     responses:
 *       200:
 *         description: Successfully retrieved seller's blips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 blips:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       thumbnail:
 *                         type: string
 *                       productId:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalBlips:
 *                       type: integer
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */

// Public routes for blips

router.get('/blips', 
  authMiddleware.verifyToken, 
  productController.getAllBlips
);

router.get('/seller/:sellerId/blips', productController.getSellerBlips);


/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Deep search products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get('/search', productController.deepSearchProducts);

/**
 * @swagger
 * /api/products/just-arrived:
 *   get:
 *     summary: Get recently added products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Recently arrived products retrieved successfully
 */
router.get('/just-arrived', productController.getJustArrivedProducts);

/**
 * @swagger
 * /api/products/all:
 *   get:
 *     summary: Get all products with optional filters and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         default: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         required: false
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         required: false
 *         default: 0
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         required: false
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, newest, oldest, popular, best_selling]
 *         required: false
 *         default: newest
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, archived, out_of_stock]
 *         required: false
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [visible, hidden, featured]
 *         required: false
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           price:
 *                             type: number
 *                           category:
 *                             type: string
 *                           subCategory:
 *                             type: string
 *                           images:
 *                             type: array
 *                           stock:
 *                             type: number
 *                           status:
 *                             type: string
 *                           visibility:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalProducts:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *                         limit:
 *                           type: integer
 *                     filters:
 *                       type: object
 *                       properties:
 *                         category:
 *                           type: string
 *                         priceRange:
 *                           type: object
 *                         sortBy:
 *                           type: string
 *                         status:
 *                           type: string
 *                         visibility:
 *                           type: string
 *       500:
 *         description: Server error
 */
router.get('/all', productController.getAllProducts);

/**
 * @swagger
 * /api/products/personalized:
 *   get:
 *     summary: Get personalized products based on buyer's selected categories
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, price, stats.averageRating]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of personalized products
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.get('/personalized',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  productController.getPersonalizedProducts
);

/**
 * @swagger
 * /api/products/trending:
 *   get:
 *     summary: Get trending products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products to return
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *         description: Time period for trending calculation
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Optional category filter
 *     responses:
 *       200:
 *         description: List of trending products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 period:
 *                   type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       discountedPrice:
 *                         type: number
 *                       images:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                       category:
 *                         type: string
 *                       seller:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           storeName:
 *                             type: string
 *                       trendingScore:
 *                         type: number
 *                       stats:
 *                         type: object
 *                         properties:
 *                           rating:
 *                             type: number
 *                           reviewCount:
 *                             type: number
 *                           views:
 *                             type: number
 *                           sales:
 *                             type: number
 *       500:
 *         description: Server error
 */
router.get('/trending', productController.getTrendingProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *                 priceVariants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       size:
 *                         type: string
 *                       price:
 *                         type: number
 *                 category:
 *                   type: string
 *                 subCategory:
 *                   type: string
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       public_id:
 *                         type: string
 *                 blips:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       thumbnail:
 *                         type: string
 *                 seller:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     storeName:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                     rating:
 *                       type: number
 *                     verified:
 *                       type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     averageRating:
 *                       type: number
 *                     reviewCount:
 *                       type: integer
 *                     viewCount:
 *                       type: integer
 *                     soldCount:
 *                       type: integer
 *                 stock:
 *                   type: number
 *                 status:
 *                   type: string
 *                   enum: [draft, active, archived, out_of_stock]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Product not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.get('/:id', productController.getProduct);




/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - category
 *               - stock
 *               - sku
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *               description:
 *                 type: string
 *                 description: Detailed product description
 *               price:
 *                 type: number
 *                 description: Base price of the product
 *               category:
 *                 type: string
 *                 description: Main category of the product
 *               variants:
 *                 type: array
 *                 description: Product variants (color, size, etc.)
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [color, size, material, style, other]
 *                       description: Type of variant
 *                     name:
 *                       type: string
 *                       description: Display name for the variant type
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Display name for the option
 *                           value:
 *                             type: string
 *                             description: Value identifier for the option
 *                           price:
 *                             type: number
 *                             description: Price for this specific variant
 *                           stock:
 *                             type: number
 *                             description: Stock quantity for this variant
 *                           images:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 data:
 *                                   type: string
 *                                   format: binary
 *                                   description: Image file for the variant
 *                                 isDefault:
 *                                   type: boolean
 *                                   description: Whether this is the default image
 *               subCategory:
 *                 type: string
 *                 description: Sub-category of the product
 *               brand:
 *                 type: string
 *               modelNumber:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Default product images (max 8)
 *               blips:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Product video blips (max 4)
 *               stock:
 *                 type: number
 *                 minimum: 0
 *               shippingInfo:
 *                 type: object
 *                 properties:
 *                   weight:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: number
 *                       unit:
 *                         type: string
 *                         enum: [kg, g, lb, oz]
 *                   dimensions:
 *                     type: object
 *                     properties:
 *                       length:
 *                         type: number
 *                       width:
 *                         type: number
 *                       height:
 *                         type: number
 *                       unit:
 *                         type: string
 *                         enum: [cm, in]
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *                 category:
 *                   type: string
 *                 variants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       name:
 *                         type: string
 *                       options:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             value:
 *                               type: string
 *                             price:
 *                               type: number
 *                             stock:
 *                               type: number
 *                             sku:
 *                               type: string
 *                             images:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   url:
 *                                     type: string
 *                                   isDefault:
 *                                     type: boolean
 *                 seller:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                     about:
 *                       type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a seller
 *       500:
 *         description: Server error
 */
router.post('/',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  upload.fields([
    { name: 'images', maxCount: 8 },
    { name: 'blips', maxCount: 4 },
    { name: /^variant-[a-zA-Z0-9]+-images$/, maxCount: 10 },
    { name: /^variant-[a-zA-Z0-9]+-[a-zA-Z0-9]+-images$/, maxCount: 10 },
    { name: /^variant-[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+-images$/, maxCount: 10 }
  ]),
  productController.createProduct
);

/**
 * @swagger
 * /api/products/{productId}/inventory:
 *   put:
 *     summary: Update product inventory
 *     description: Update product stock quantity. Can add, subtract, or set specific stock levels.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: The quantity to add, subtract, or set
 *                 example: 10
 *               operation:
 *                 type: string
 *                 enum: [add, subtract, set]
 *                 description: Type of inventory operation to perform
 *                 default: set
 *                 example: add
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Inventory updated successfully
 *                 product:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Product ID
 *                     name:
 *                       type: string
 *                       description: Product name
 *                     stock:
 *                       type: number
 *                       description: Current stock level
 *                     lowStockAlert:
 *                       type: number
 *                       description: Low stock threshold
 *                     isLowStock:
 *                       type: boolean
 *                       description: Whether the product is in low stock
 *       400:
 *         description: Invalid request or operation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to update inventory
 *                 error:
 *                   type: string
 *                   example: Invalid operation. Use "add", "subtract", or "set"
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to update this product
 *       404:
 *         description: Product not found
 */
router.put('/:productId/inventory',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  productController.updateInventory
);

/**
 * @swagger
 * /api/products/{id}/shipping:
 *   put:
 *     summary: Update product shipping information
 *     tags: [Products]
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
 *               shippingMethods:
 *                 type: array
 *               weight:
 *                 type: object
 *               dimensions:
 *                 type: object
 *     responses:
 *       200:
 *         description: Shipping information updated successfully
 */
router.put('/:id/shipping',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  productController.updateShipping
);

/**
 * @swagger
 * /api/products/analytics:
 *   get:
 *     summary: Get product performance analytics
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product analytics retrieved successfully
 */
router.get('/analytics',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  productController.getProductAnalytics
);

/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock products retrieved successfully
 */
router.get('/low-stock',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  productController.getLowStockProducts
);

/**
 * @swagger
 * /api/products/{id}/return-policy:
 *   put:
 *     summary: Update product return policy
 *     tags: [Products]
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
 *               allowed:
 *                 type: boolean
 *               periodInDays:
 *                 type: number
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Return policy updated successfully
 */
router.put('/:id/return-policy',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  productController.updateReturnPolicy
);

/**
 * @swagger
 * /api/products/bulk-update:
 *   put:
 *     summary: Bulk update products
 *     tags: [Products]
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
 */
router.put('/bulk-update',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  productController.bulkUpdateProducts
);

/**
 * @swagger
 * /api/products/{id}/stats:
 *   get:
 *     summary: Get product statistics
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product statistics retrieved successfully
 */
router.get('/:id/stats',
  productController.getProductStats
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a single product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to update
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
 *               priceVariants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     size:
 *                       type: string
 *                     price:
 *                       type: number
 *               category:
 *                 type: string
 *               subCategory:
 *                 type: string
 *               brand:
 *                 type: string
 *               modelNumber:
 *                 type: string
 *               stock:
 *                 type: number
 *               shippingInfo:
 *                 type: object
 *                 properties:
 *                   weight:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: number
 *                       unit:
 *                         type: string
 *                         enum: [kg, g, lb, oz]
 *                   dimensions:
 *                     type: object
 *                     properties:
 *                       length:
 *                         type: number
 *                       width:
 *                         type: number
 *                       height:
 *                         type: number
 *                       unit:
 *                         type: string
 *                         enum: [cm, in]
 *               returnPolicy:
 *                 type: object
 *                 properties:
 *                   allowed:
 *                     type: boolean
 *                   periodInDays:
 *                     type: number
 *                   conditions:
 *                     type: array
 *                     items:
 *                       type: string
 *               status:
 *                 type: string
 *                 enum: [draft, active, archived, out_of_stock]
 *               visibility:
 *                 type: string
 *                 enum: [visible, hidden, featured]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *               size:
 *                 type: string
 *               material:
 *                 type: string
 *               weight:
 *                 type: number
 *               dimensions:
 *                 type: string
 *               taxClass:
 *                 type: string
 *               taxRate:
 *                 type: number
 *               warranty:
 *                 type: string
 *               minimumPurchaseQuantity:
 *                 type: number
 *               vendor:
 *                 type: string
 *               seo:
 *                 type: object
 *                 properties:
 *                   metaTitle:
 *                     type: string
 *                   metaDescription:
 *                     type: string
 *                   metaKeywords:
 *                     type: array
 *                     items:
 *                       type: string
 *                   slug:
 *                     type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 product:
 *                   type: object
 *       403:
 *         description: Not authorized to update this product
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.put('/:id',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  productController.updateProduct
);



/**
 * @swagger
 * /api/products/{id}/seo:
 *   put:
 *     summary: Update product SEO information
 *     tags: [Products]
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
 *               metaTitle:
 *                 type: string
 *               metaDescription:
 *                 type: string
 *               metaKeywords:
 *                 type: array
 *                 items:
 *                   type: string
 *               slug:
 *                 type: string
 *     responses:
 *       200:
 *         description: SEO information updated successfully
 */
router.put('/:id/seo',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  productController.updateSEO
);

/**
 * @swagger
 * /api/products/bulk-delete:
 *   delete:
 *     summary: Bulk delete products
 *     tags: [Products]
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
 */
router.delete('/bulk-delete',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  productController.bulkDelete
);

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   post:
 *     summary: Add a review to a product
 *     tags: [Products]
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
 *             required:
 *               - rating
 *               - title
 *               - comment
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     base64:
 *                       type: string
 *                       description: Base64 encoded image data
 *                     mimeType:
 *                       type: string
 *                       description: Image MIME type (e.g., image/jpeg, image/png)
 *               purchasedVariant:
 *                 type: object
 *                 description: Optional details about the purchased variant
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         description: Invalid input or too many images
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.post('/:id/reviews',
  authMiddleware.verifyToken,
  productController.addReview
);

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   get:
 *     summary: Get product reviews
 *     tags: [Products]
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get('/:id/reviews', productController.getProductReviews);

/**
 * @swagger
 * /api/products/{id}/reviews/{reviewId}:
 *   put:
 *     summary: Update a product review
 *     tags: [Products]
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
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 */
router.put('/:id/reviews/:reviewId',
  authMiddleware.verifyToken,
  productController.updateReview
);

/**
 * @swagger
 * /api/products/{id}/visibility:
 *   put:
 *     summary: Update product visibility
 *     tags: [Products]
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
 *         description: Visibility updated successfully
 */
router.put('/:id/visibility',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  productController.updateVisibility
);

/**
 * @swagger
 * /api/products/seller/{sellerId}:
 *   get:
 *     summary: Get all products for a specific seller
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the seller
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, archived, out_of_stock]
 *         description: Filter by product status
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [visible, hidden, featured]
 *         description: Filter by visibility status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest, price_asc, price_desc, best_selling]
 *         description: Sort products by specific criteria
 *     responses:
 *       200:
 *         description: Seller's products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalProducts:
 *                   type: integer
 *       404:
 *         description: Seller not found
 */
router.get('/seller/:sellerId', productController.getSellerProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a single product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to delete
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       403:
 *         description: Not authorized to delete this product
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.delete('/:id',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  productController.deleteProduct
);

/**
 * @swagger
 * /api/products/{id}/sold-count:
 *   get:
 *     summary: Get product's sold count
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product sold count retrieved successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/sold-count', productController.getProductSoldCount);

/**
 * @swagger
 * /api/products/{id}/discount:
 *   put:
 *     summary: Update product discount
 *     tags: [Products]
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
 *               isActive:
 *                 type: boolean
 *               type:
 *                 type: string
 *               value:
 *                 type: number
 *               startDate:
 *                 type: string
 *               endDate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Discount updated successfully
 */
router.put('/:id/discount', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  productController.updateProductDiscount
);

/**
 * @swagger
 * /api/products/{id}/blips/{blipId}/like:
 *   post:
 *     summary: Like/unlike a product blip
 *     tags: [Products]
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
 *         name: blipId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blip ID
 *     responses:
 *       200:
 *         description: Blip liked/unliked successfully
 *       404:
 *         description: Product or blip not found
 */
router.post('/:id/blips/:blipId/like',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  productController.toggleBlipLike
);

/**
 * @swagger
 * /api/products/{id}/blips/{blipId}/comments:
 *   post:
 *     summary: Add a comment to a product blip
 *     tags: [Products]
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
 *         name: blipId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blip ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 required: true
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       404:
 *         description: Product or blip not found
 */
router.post('/:id/blips/:blipId/comments',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  productController.addBlipComment
);

/**
 * @swagger
 * /api/products/{id}/blips/{blipId}/comments:
 *   get:
 *     summary: Get comments for a product blip
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: path
 *         name: blipId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blip ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       404:
 *         description: Product or blip not found
 */
router.get('/:id/blips/:blipId/comments', productController.getBlipComments);

module.exports = router;
