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

/**
 * @swagger
 * /api/returns/{returnId}/create-label:
 *   post:
 *     summary: Create shipping label for return
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
 *               - pickup_address
 *             properties:
 *               pickup_address:
 *                 type: object
 *                 required:
 *                   - first_name
 *                   - last_name
 *                   - email
 *                   - phone
 *                   - line1
 *                   - city
 *                   - state
 *                   - country
 *                   - zip
 *                 properties:
 *                   first_name:
 *                     type: string
 *                   last_name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   line1:
 *                     type: string
 *                   line2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   zip:
 *                     type: string
 *     responses:
 *       200:
 *         description: Return shipping label created successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Return request not found
 */
router.post('/:returnId/create-label',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  returnController.createReturnShippingLabel
);

/**
 * @swagger
 * /api/returns/{returnId}/shipping-rates:
 *   get:
 *     summary: Get shipping rates for a return
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
 *         description: Shipping rates retrieved successfully
 */
router.get('/:returnId/shipping-rates',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  returnController.getReturnShippingRates
);

/**
 * @swagger
 * /api/returns/{returnId}/select-rate:
 *   post:
 *     summary: Select shipping rate for return
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
 *               - rate_id
 *               - carrier_name
 *               - amount
 *             properties:
 *               rate_id:
 *                 type: string
 *               carrier_name:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Shipping rate selected successfully
 */
router.post('/:returnId/select-rate',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  returnController.selectReturnShippingRate
);

/**
 * @swagger
 * /api/returns/{returnId}/arrange-pickup:
 *   post:
 *     summary: Arrange pickup for return shipment
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
 *         description: Return pickup arranged successfully
 *       400:
 *         description: Missing shipment_id or rate_id
 *       404:
 *         description: Return request not found
 *       500:
 *         description: Failed to arrange pickup
 */
router.post('/:returnId/arrange-pickup',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  returnController.arrangeReturnPickup
);

/**
 * @swagger
 * /api/returns/{returnId}/replacement/shipping-rates:
 *   get:
 *     summary: Get shipping rates for replacement product
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
 *         description: Shipping rates retrieved successfully
 *       404:
 *         description: Return request not found
 */
router.get('/:returnId/replacement/shipping-rates',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  returnController.getReplacementShippingRates
);

/**
 * @swagger
 * /api/returns/{returnId}/replacement/create-labels:
 *   post:
 *     summary: Create shipping labels for replacement (return pickup and replacement delivery)
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
 *               - returnRateId
 *               - replacementRateId
 *               - replacementProductId
 *             properties:
 *               returnRateId:
 *                 type: string
 *               replacementRateId:
 *                 type: string
 *               replacementProductId:
 *                 type: string
 *               variant:
 *                 type: object
 *               specifications:
 *                 type: object
 *     responses:
 *       200:
 *         description: Shipping labels created successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Return request or product not found
 */
router.post('/:returnId/replacement/create-labels',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  returnController.createReplacementShippingLabels
);

/**
 * @swagger
 * /api/returns/{returnId}/replacement/arrange-pickup:
 *   post:
 *     summary: Arrange pickup for both return and replacement shipments
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
 *             properties:
 *               purchase_insurance:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Pickups arranged successfully
 *       404:
 *         description: Return request not found
 */
router.post('/:returnId/replacement/arrange-pickup',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  returnController.arrangeReplacementPickup
);

/**
 * @swagger
 * /api/returns/{returnId}/reject:
 *   post:
 *     summary: Reject a return request and create a dispute
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *               - description
 *               - evidence
 *             properties:
 *               reason:
 *                 type: string
 *               description:
 *                 type: string
 *               evidence:
 *                 type: array
 *                 items:
 *                   type: file
 *     responses:
 *       200:
 *         description: Return request rejected and dispute created
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Return request not found
 */
router.post('/:returnId/reject',
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  upload.array('evidence', 5),
  returnController.rejectReturnRequest
);

/**
 * @swagger
 * /api/returns/{returnId}/admin/resolve-dispute:
 *   post:
 *     summary: Resolve a return dispute (Admin only)
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
 *               - resolution
 *               - action
 *               - note
 *             properties:
 *               resolution:
 *                 type: string
 *                 enum: [BUYER_FAVORED, SELLER_FAVORED, COMPROMISE]
 *               action:
 *                 type: string
 *                 enum: [FULL_REFUND, PARTIAL_REFUND, NO_REFUND, REPLACEMENT_APPROVED, RETURN_APPROVED]
 *               refundAmount:
 *                 type: number
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute resolved successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not an admin
 */
router.post('/:returnId/admin/resolve-dispute',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  returnController.resolveDispute
);

/**
 * @swagger
 * /api/returns/{returnId}/admin/update-status:
 *   put:
 *     summary: Update return request status (Admin only)
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
 *               - status
 *               - note
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, REJECTED, CANCELLED, COMPLETED, REFUNDED]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return status updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not an admin
 */
router.put('/:returnId/admin/update-status',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  returnController.adminUpdateStatus
);

/**
 * @swagger
 * /api/returns/{returnId}/admin/add-note:
 *   post:
 *     summary: Add admin note to return request
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
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note added successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not an admin
 */
router.post('/:returnId/admin/add-note',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  returnController.addAdminNote
);

module.exports = router; 