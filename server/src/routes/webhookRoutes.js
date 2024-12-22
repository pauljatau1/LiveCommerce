const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/webhooks/seller:
 *   post:
 *     summary: Create a new webhook for seller
 *     tags: [Webhooks]
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
 *               - url
 *               - events
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post('/seller', 
  authMiddleware.verifyToken,
  authMiddleware.isSeller,
  webhookController.createWebhook
);

/**
 * @swagger
 * /api/webhooks/buyer:
 *   post:
 *     summary: Create a new webhook for buyer
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 */
router.post('/buyer', 
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  webhookController.createWebhook
);

/**
 * @swagger
 * /api/webhooks:
 *   get:
 *     summary: Get all webhooks for authenticated user
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 */
router.get('/',
  authMiddleware.verifyToken,
  webhookController.getWebhooks
);

/**
 * @swagger
 * /api/webhooks/{webhookId}:
 *   get:
 *     summary: Get webhook by ID
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:webhookId',
  authMiddleware.verifyToken,
  webhookController.getWebhookById
);

/**
 * @swagger
 * /api/webhooks/{webhookId}:
 *   put:
 *     summary: Update webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:webhookId',
  authMiddleware.verifyToken,
  webhookController.updateWebhook
);

/**
 * @swagger
 * /api/webhooks/{webhookId}:
 *   delete:
 *     summary: Delete webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:webhookId',
  authMiddleware.verifyToken,
  webhookController.deleteWebhook
);

/**
 * @swagger
 * /api/webhooks/{webhookId}/toggle:
 *   post:
 *     summary: Toggle webhook active status
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:webhookId/toggle',
  authMiddleware.verifyToken,
  webhookController.toggleWebhook
);

module.exports = router;
