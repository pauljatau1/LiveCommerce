const express = require('express');
const router = express.Router();
const returnControllerv2 = require('../controllers/returnControllerv2');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/v2/returns/request:
 *   post:
 *     summary: Create a new return request for Terminal Africa orders
 *     tags: [Returns v2 - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - items
 *               - description
 *               - preferredResolution
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Terminal Africa order ID
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     reason:
 *                       type: string
 *                     description:
 *                       type: string
 *               description:
 *                 type: string
 *               preferredResolution:
 *                 type: string
 *                 enum: [refund, replacement, partial_refund]
 *               evidence:
 *                 type: array
 *                 items:
 *                   type: file
 *     responses:
 *       201:
 *         description: Return request created successfully for Terminal Africa order
 *       400:
 *         description: Invalid request data or not a Terminal Africa order
 *       404:
 *         description: Order not found
 */
router.post('/request',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  upload.array('evidence', 5),
  returnControllerv2.createReturnRequest
);

/**
 * @swagger
 * /api/v2/returns/seller:
 *   get:
 *     summary: Get all Terminal Africa return requests for a seller
 *     tags: [Returns v2 - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by return status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of Terminal Africa return requests
 */
router.get('/seller',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  returnControllerv2.getSellerReturns
);

/**
 * @swagger
 * /api/v2/returns/buyer:
 *   get:
 *     summary: Get all Terminal Africa return requests for a buyer
 *     tags: [Returns v2 - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by return status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of Terminal Africa return requests
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/buyer',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  returnControllerv2.getBuyerReturns
);

/**
 * @swagger
 * /api/v2/returns/{returnId}/respond:
 *   post:
 *     summary: Seller response to Terminal Africa return request
 *     tags: [Returns v2 - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - message
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject, need_info, partial_refund]
 *               message:
 *                 type: string
 *               partialRefundAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Response processed successfully for Terminal Africa return
 */
router.post('/:returnId/respond',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  returnControllerv2.respondToReturn
);

/**
 * @swagger
 * /api/v2/returns/{returnId}:
 *   get:
 *     summary: Get Terminal Africa return request details
 *     tags: [Returns v2 - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Terminal Africa return request details retrieved successfully
 *       404:
 *         description: Return request not found
 */
router.get('/:returnId', 
  authMiddleware.verifyToken,
  async (req, res, next) => {
    // Check if user is admin before proceeding
    const Admin = require('../models/Admin');
    try {
      const admin = await Admin.findById(req.user.id);
      if (admin) {
        req.user.role = 'admin';
      }
      next();
    } catch (error) {
      next();
    }
  },
  returnControllerv2.getReturnDetails
);

/**
 * @swagger
 * /api/v2/returns/{returnId}/shipping-label:
 *   post:
 *     summary: Generate Terminal Africa return shipping label
 *     tags: [Returns v2 - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Terminal Africa shipping label generated successfully
 */
router.post('/:returnId/shipping-label',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  returnControllerv2.generateShippingLabel
);

/**
 * @swagger
 * /api/v2/returns/{returnId}/create-shipping-label:
 *   post:
 *     summary: Create detailed Terminal Africa return shipping label
 *     tags: [Returns v2 - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detailed Terminal Africa shipping label created successfully
 *       400:
 *         description: Invalid request or label already exists
 */
router.post('/:returnId/create-shipping-label',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  returnControllerv2.createReturnShippingLabel
);

/**
 * @swagger
 * /api/v2/returns/{returnId}/shipping-rates:
 *   get:
 *     summary: Get Terminal Africa shipping rates for return
 *     tags: [Returns v2 - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Terminal Africa shipping rates retrieved successfully
 *       400:
 *         description: No shipment ID found or other error
 */
router.get('/:returnId/shipping-rates',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  returnControllerv2.getReturnShippingRates
);

/**
 * @swagger
 * /api/v2/returns/{returnId}/arrange-pickup:
 *   post:
 *     summary: Arrange Terminal Africa pickup for return
 *     tags: [Returns v2 - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rate_id
 *             properties:
 *               rate_id:
 *                 type: string
 *                 description: Terminal Africa rate ID
 *     responses:
 *       200:
 *         description: Return pickup arranged successfully with Terminal Africa
 *       400:
 *         description: Missing rate ID or pickup arrangement failed
 */
router.post('/:returnId/arrange-pickup',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  returnControllerv2.arrangeReturnPickup
);

/**
 * @swagger
 * /api/v2/returns/admin/all:
 *   get:
 *     summary: Admin - Get all Terminal Africa return requests
 *     tags: [Returns v2 - Admin - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: disputeStatus
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
 *         description: List of all Terminal Africa return requests
 */
router.get('/admin/all',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  returnControllerv2.getAllReturns
);

/**
 * @swagger
 * /api/v2/returns/{returnId}/confirm-refund:
 *   post:
 *     summary: Confirm refund payment for Terminal Africa return
 *     tags: [Returns v2 - Admin - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refundAmount
 *               - refundMethod
 *             properties:
 *               refundAmount:
 *                 type: number
 *               refundMethod:
 *                 type: string
 *                 enum: [bank_transfer, wallet_credit, payment_reversal, paystack]
 *               transactionReference:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund confirmed successfully for Terminal Africa return
 */
router.post('/:returnId/confirm-refund',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  returnControllerv2.confirmRefund
);

/**
 * @swagger
 * /api/v2/returns/{returnId}/initiate-refund:
 *   post:
 *     summary: Seller initiates refund request for Terminal Africa return
 *     tags: [Returns v2 - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Refund amount
 *               reason:
 *                 type: string
 *                 description: Reason for refund
 *     responses:
 *       200:
 *         description: Refund request initiated successfully for Terminal Africa return
 *       400:
 *         description: Invalid refund amount or return not eligible
 */
router.post('/:returnId/initiate-refund',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  returnControllerv2.initiateRefundRequest
);

/**
 * @swagger
 * /api/v2/returns/admin/refund-requests:
 *   get:
 *     summary: Admin - Get all Terminal Africa refund requests
 *     tags: [Returns v2 - Admin - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by refund request status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of Terminal Africa refund requests
 */
router.get('/admin/refund-requests',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  returnControllerv2.getRefundRequests
);

/**
 * @swagger
 * /api/v2/returns/{returnId}/admin/process-refund:
 *   post:
 *     summary: Admin - Process Terminal Africa refund request
 *     tags: [Returns v2 - Admin - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - note
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Admin action on refund request
 *               note:
 *                 type: string
 *                 description: Admin note
 *     responses:
 *       200:
 *         description: Refund request processed successfully
 *       400:
 *         description: Invalid return status for processing refund
 */
router.post('/:returnId/admin/process-refund',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  returnControllerv2.processRefundRequest
);

/**
 * @swagger
 * /api/v2/returns/statistics:
 *   get:
 *     summary: Get Terminal Africa return statistics
 *     tags: [Returns v2 - Admin - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: Terminal Africa return statistics retrieved successfully
 */
router.get('/statistics',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  returnControllerv2.getReturnStatistics
);

/**
 * @swagger
 * /api/v2/returns/{returnId}/admin/note:
 *   post:
 *     summary: Admin - Add note to Terminal Africa return
 *     tags: [Returns v2 - Admin - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *                 description: Admin note
 *     responses:
 *       200:
 *         description: Admin note added successfully to Terminal Africa return
 */
router.post('/:returnId/admin/note',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  returnControllerv2.addAdminNote
);

// Payment-related routes for Terminal Africa returns

/**
 * @swagger
 * /api/v2/returns/{returnId}/mark-refund-paid:
 *   post:
 *     summary: Mark Terminal Africa return refund as paid using Paystack
 *     tags: [Returns v2 - Payments - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
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
 *               transactionId:
 *                 type: string
 *                 description: Paystack transaction ID
 *               paymentReference:
 *                 type: string
 *                 description: Paystack payment reference
 *               manualNote:
 *                 type: string
 *                 description: Manual note for the refund
 *     responses:
 *       200:
 *         description: Terminal Africa return refund marked as paid successfully
 *       400:
 *         description: Missing transaction details or verification failed
 */
router.post('/:returnId/mark-refund-paid',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  returnControllerv2.markReturnRefundAsPaid
);

/**
 * @swagger
 * /api/v2/returns/verify-refund-payment:
 *   post:
 *     summary: Verify Terminal Africa return refund payment by reference
 *     tags: [Returns v2 - Payments - Terminal Africa]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reference
 *             properties:
 *               reference:
 *                 type: string
 *                 description: Paystack payment reference
 *               returnId:
 *                 type: string
 *                 description: Return ID (optional)
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Payment verification failed
 */
router.post('/verify-refund-payment',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  returnControllerv2.verifyRefundPaymentByReference
);

/**
 * @swagger
 * /api/v2/returns/webhook/paystack-refunds:
 *   post:
 *     summary: Handle Paystack webhook for Terminal Africa return refunds
 *     tags: [Returns v2 - Webhooks - Terminal Africa]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Paystack webhook payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid signature
 */
router.post('/webhook/paystack-refunds',
  returnControllerv2.handlePaystackWebhookForRefunds
);

module.exports = router; 