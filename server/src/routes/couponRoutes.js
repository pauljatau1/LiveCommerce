const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/coupons:
 *   post:
 *     summary: Create a new coupon
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
 *               - startDate
 *               - customerEligibility
 *               - productDiscounts
 *             properties:
 *               name:
 *                 type: string
 *               code:
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

module.exports = router; 