const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/coupons:
 *   post:
 *     summary: Create a new coupon for product discounts (without coupon code)
 *     tags: [Coupons]
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
 *               - discountPercentage
 *               - startDate
 *               - customerEligibility
 *               - productDiscounts
 *             properties:
 *               name:
 *                 type: string
 *               discountPercentage:
 *                 type: number
 *               hasMinimumRequirement:
 *                 type: boolean
 *               minimumAmount:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               customerEligibility:
 *                 type: string
 *                 enum: [all, followers, new]
 *               productDiscounts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     discountedPrice:
 *                       type: number
 *               usageLimit:
 *                 type: number
 *     responses:
 *       201:
 *         description: Coupon created successfully
 */
router.post('/', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  couponController.createCoupon
);

/**
 * @swagger
 * /api/coupons/seller:
 *   get:
 *     summary: Get all coupons for the authenticated seller
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, expired]
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
 *         description: List of coupons retrieved successfully
 */
router.get('/seller', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  couponController.getSellerCoupons
);

/**
 * @swagger
 * /api/coupons/{id}:
 *   put:
 *     summary: Update a coupon
 *     tags: [Coupons]
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
 *                 enum: [active, inactive]
 *               discountPercentage:
 *                 type: number
 *               hasMinimumRequirement:
 *                 type: boolean
 *               minimumAmount:
 *                 type: number
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               applicableProducts:
 *                 type: array
 *                 items:
 *                   type: string
 *               usageLimit:
 *                 type: number
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 */
router.put('/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  couponController.updateCoupon
);

/**
 * @swagger
 * /api/coupons/{id}:
 *   delete:
 *     summary: Delete a coupon
 *     tags: [Coupons]
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
 *         description: Coupon deleted successfully
 */
router.delete('/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  couponController.deleteCoupon
);

/**
 * @swagger
 * /api/coupons/validate/{code}:
 *   get:
 *     summary: Validate a coupon code
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: cartTotal
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Coupon validation result
 */
router.get('/validate/:code', 
  authMiddleware.verifyToken, 
  authMiddleware.isBuyer, 
  couponController.validateCoupon
);

/**
 * @swagger
 * /api/coupons/{id}/expire:
 *   post:
 *     summary: Expire a coupon and remove its discounts from products
 *     tags: [Coupons]
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
 *         description: Coupon expired successfully
 */
router.post('/:id/expire', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  couponController.expireCoupon
);

/**
 * @swagger
 * /api/coupons/special:
 *   post:
 *     summary: Create a new special coupon code
 *     tags: [Coupons]
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
 *               - code
 *               - discountPercentage
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the coupon
 *               code:
 *                 type: string
 *                 description: Unique coupon code
 *               discountPercentage:
 *                 type: number
 *                 description: Percentage discount to apply
 *                 minimum: 0
 *                 maximum: 100
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the coupon becomes valid
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the coupon expires
 *               usageLimit:
 *                 type: number
 *                 description: Maximum number of times the coupon can be used
 *               applicableProductIds:
 *                 type: array
 *                 description: List of product IDs this coupon can be applied to (if empty, applies to all products)
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Special coupon created successfully
 *       400:
 *         description: Invalid input or coupon code already exists
 */
router.post('/special', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  couponController.createSpecialCoupon
);

/**
 * @swagger
 * /api/coupons/special:
 *   get:
 *     summary: Get all special coupons for the authenticated seller
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, expired]
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
 *         description: List of special coupons retrieved successfully
 */
router.get('/special', 
  authMiddleware.verifyToken, 
  authMiddleware.isSeller, 
  couponController.getSpecialCoupons
);

/**
 * @swagger
 * /api/coupons/apply:
 *   post:
 *     summary: Apply a special coupon code to a product
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - productId
 *             properties:
 *               code:
 *                 type: string
 *                 description: The coupon code to apply
 *               productId:
 *                 type: string
 *                 description: ID of the product to apply the coupon to
 *     responses:
 *       200:
 *         description: Coupon applied successfully with discounted product details
 *       400:
 *         description: Invalid coupon or product
 *       404:
 *         description: Coupon or product not found
 */
router.post('/apply', 
  authMiddleware.verifyToken, 
  couponController.applySpecialCoupon
);

/**
 * @swagger
 * /api/coupons/product/{productId}:
 *   get:
 *     summary: Get all available coupon discounts for a specific product
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to check for available coupons
 *     responses:
 *       200:
 *         description: List of available coupons and their discounted prices for the product
 *       404:
 *         description: Product not found
 */
router.get('/product/:productId', 
  authMiddleware.verifyToken, 

  couponController.getProductCoupons
);

module.exports = router; 