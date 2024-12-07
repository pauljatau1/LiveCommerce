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

module.exports = router;
