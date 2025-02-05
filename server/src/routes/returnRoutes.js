const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/returns/request:
 *   post:
 *     summary: Create a new return request
 *     tags: [Returns]
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
 *         description: Return request created successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Order not found
 */
router.post('/request',
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  upload.array('evidence', 5),
  returnController.createReturnRequest
);


/**
 * @swagger
 * /api/returns/seller:
 *   get:
 *     summary: Get all return requests for a seller
 *     tags: [Returns]
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
 *         description: List of return requests
 */
router.get('/seller',
    authMiddleware.verifyToken,
    authMiddleware.isSeller,
    returnController.getSellerReturns
  );
  
  /**
   * @swagger
   * /api/returns/{returnId}/respond:
   *   post:
   *     summary: Seller response to return request
   *     tags: [Returns]
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
   *         description: Response processed successfully
   */
  router.post('/:returnId/respond',
    authMiddleware.verifyToken,
    authMiddleware.isSeller,
    returnController.respondToReturn
  );

/**
 * @swagger
 * /api/returns/{returnId}:
 *   get:
 *     summary: Get return request details
 *     tags: [Returns]
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
 *         description: Return request details retrieved successfully
 *       404:
 *         description: Return request not found
 */
router.get('/:returnId',
  authMiddleware.verifyToken,
  returnController.getReturnDetails
);



/**
 * @swagger
 * /api/returns/{returnId}/shipping-label:
 *   post:
 *     summary: Generate return shipping label
 *     tags: [Returns]
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
 *         description: Shipping label generated successfully
 */
router.post('/:returnId/shipping-label',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  returnController.generateShippingLabel
);

/**
 * @swagger
 * /api/returns/admin/all:
 *   get:
 *     summary: Admin - Get all return requests
 *     tags: [Returns - Admin]
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
 *         description: List of all return requests
 */
router.get('/admin/all',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  returnController.getAllReturns
);

/**
 * @swagger
 * /api/returns/{returnId}/dispute:
 *   post:
 *     summary: Create a dispute for a return request
 *     tags: [Returns]
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
 *               - reason
 *               - description
 *             properties:
 *               reason:
 *                 type: string
 *               description:
 *                 type: string
 *               evidence:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Dispute created successfully
 */
router.post('/:returnId/dispute',
  authMiddleware.verifyToken,
  returnController.createDispute
);

/**
 * @swagger
 * /api/returns/{returnId}/admin/resolve:
 *   post:
 *     summary: Admin - Resolve a disputed return
 *     tags: [Returns - Admin]
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
 *               - resolution
 *               - note
 *             properties:
 *               resolution:
 *                 type: string
 *                 enum: [approve_return, reject_return, partial_refund]
 *               note:
 *                 type: string
 *               refundAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Dispute resolved successfully
 */
router.post('/:returnId/admin/resolve',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  returnController.resolveDispute
);

/**
 * @swagger
 * /api/returns/{returnId}/confirm-refund:
 *   post:
 *     summary: Confirm refund payment for a return
 *     tags: [Returns]
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
 *                 enum: [bank_transfer, wallet_credit, payment_reversal]
 *               transactionReference:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund confirmed successfully
 */
router.post('/:returnId/confirm-refund',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  returnController.confirmRefund
);

/**
 * @swagger
 * /api/returns/admin/statistics:
 *   get:
 *     summary: Get return and refund statistics
 *     tags: [Returns - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *     responses:
 *       200:
 *         description: Return statistics retrieved successfully
 */
router.get('/admin/statistics',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  returnController.getReturnStatistics
);

module.exports = router; 