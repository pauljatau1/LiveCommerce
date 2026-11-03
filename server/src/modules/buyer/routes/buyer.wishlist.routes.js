const express = require('express');
const router = express.Router();

const { verifyToken, isBuyer } = require('../../../middlewares/authMiddleware');
const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/wishlist:
 *   post:
 *     summary: Add a product to wishlist
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID of the product to add to wishlist
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Product added to wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product added to wishlist successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     wishlist:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             type: string
 *                             description: Product ID
 *                           addedAt:
 *                             type: string
 *                             format: date-time
 *                             description: Date when product was added to wishlist
 *       400:
 *         description: Bad Request - Product already in wishlist
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer or product not found
 *       422:
 *         description: Validation error - Invalid product ID format
 *       500:
 *         description: Internal server error
 */
router.post('/wishlist', verifyToken, isBuyer, buyerController.addToWishlist);

/**
 * @swagger
 * /api/v2/buyers/wishlist:
 *   get:
 *     summary: Get buyer's wishlist
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Wishlist retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Product ID
 *                           name:
 *                             type: string
 *                             description: Product name
 *                           description:
 *                             type: string
 *                             description: Product description
 *                           price:
 *                             type: number
 *                             description: Product price
 *                           images:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Product images
 *                           category:
 *                             type: string
 *                             description: Product category
 *                           brand:
 *                             type: string
 *                             description: Product brand
 *                           stock:
 *                             type: number
 *                             description: Product stock
 *                           seller:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: Seller ID
 *                               storeName:
 *                                 type: string
 *                                 description: Seller store name
 *                               businessName:
 *                                 type: string
 *                                 description: Seller business name
 *                       addedAt:
 *                         type: string
 *                         format: date-time
 *                         description: Date when product was added to wishlist
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid buyer ID format
 *       500:
 *         description: Internal server error
 */
router.get('/wishlist', verifyToken, isBuyer, buyerController.getWishlist);

/**
 * @swagger
 * /api/v2/buyers/wishlist/{productId}:
 *   delete:
 *     summary: Remove a product from wishlist
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to remove from wishlist
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Product removed from wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product removed from wishlist successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     wishlist:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             type: string
 *                             description: Product ID
 *                           addedAt:
 *                             type: string
 *                             format: date-time
 *                             description: Date when product was added to wishlist
 *       400:
 *         description: Bad Request - Product not found in wishlist
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid product ID format
 *       500:
 *         description: Internal server error
 */
router.delete('/wishlist/:productId', verifyToken, isBuyer, buyerController.removeFromWishlist);

/**
 * @swagger
 * /api/v2/buyers/wishlist/{productId}/check:
 *   get:
 *     summary: Check if a product is in buyer's wishlist
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to check in wishlist
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Wishlist status checked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Wishlist status checked successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     inWishlist:
 *                       type: boolean
 *                       description: Whether the product is in the buyer's wishlist
 *                       example: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer or product not found
 *       422:
 *         description: Validation error - Invalid product ID format
 *       500:
 *         description: Internal server error
 */
router.get('/wishlist/:productId/check', verifyToken, isBuyer, buyerController.checkWishlistStatus);

module.exports = router;


