const express = require('express');
const router = express.Router();
const flashSaleController = require('../controllers/flashSaleController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/flash-sales:
 *   post:
 *     summary: Create a new flash sale
 *     tags: [Flash Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - discountType
 *               - discountValue
 *               - startDate
 *               - startTime
 *               - products
 *             properties:
 *               name:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, amount]
 *               discountValue:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endDate:
 *                 type: string
 *                 format: date
 *               endTime:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     allocatedStock:
 *                       type: number
 *     responses:
 *       201:
 *         description: Flash sale created successfully
 */
router.post('/',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  flashSaleController.createFlashSale
);

/**
 * @swagger
 * /api/flash-sales/seller:
 *   get:
 *     summary: Get all flash sales for the authenticated seller
 *     tags: [Flash Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, scheduled, active, completed, cancelled]
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
 *         description: List of flash sales
 */
router.get('/seller',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  flashSaleController.getSellerFlashSales
);

/**
 * @swagger
 * /api/flash-sales/active:
 *   get:
 *     summary: Get all active flash sales
 *     tags: [Flash Sales]
 *     responses:
 *       200:
 *         description: List of active flash sales
 */
router.get('/active', flashSaleController.getActiveFlashSales);

/**
 * @swagger
 * /api/flash-sales/{id}:
 *   put:
 *     summary: Update a flash sale
 *     tags: [Flash Sales]
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
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, scheduled, active, completed, cancelled]
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     allocatedStock:
 *                       type: number
 *     responses:
 *       200:
 *         description: Flash sale updated successfully
 */
router.put('/:id',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  flashSaleController.updateFlashSale
);

/**
 * @swagger
 * /api/flash-sales/{id}:
 *   delete:
 *     summary: Delete a flash sale
 *     tags: [Flash Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Flash sale deleted successfully
 */
router.delete('/:id',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  flashSaleController.deleteFlashSale
);

module.exports = router; 