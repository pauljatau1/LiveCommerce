const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               category:
 *                 type: string
 *               shippingInfo:
 *                 type: object
 *                 properties:
 *                   weight:
 *                     type: object
 *                   dimensions:
 *                     type: object
 *                   shippingMethods:
 *                     type: array
 *               returnPolicy:
 *                 type: object
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  upload.array('images', 5),
  productController.createProduct
);


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
 * /api/products/inventory:
 *   put:
 *     summary: Update product inventory
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
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               operation:
 *                 type: string
 *                 enum: [increase, decrease]
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 */
router.put('/inventory',
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
 *   get:
 *     summary: Get a single product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get('/:id', productController.getProduct);

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
 *               onSale:
 *                 type: boolean
 *               salePrice:
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
 *         description: Review added successfully
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

module.exports = router;
