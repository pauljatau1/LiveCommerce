const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const webhookController = require('../controllers/WebhookController');
const authMiddleware = require('../middlewares/authMiddleware');
const orderController = require('../controllers/orderController');

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

router.post('/paystack', express.raw({ type: 'application/json' }), webhookController.handlePaystackWebhook);

// Shipbubble shipment updates. Signed with HMAC-SHA512 of the body using our
// API key (x-ship-signature). A signed payload is applied as sent; anything
// else is only a hint and the status is re-read from Shipbubble's API, so a
// forged call changes nothing.
const shipSignatureOk = (req) => {
  const key = process.env.SHIPBUBBLE_API_KEY;
  const sent = String(req.headers['x-ship-signature'] || '');
  if (!key || !sent || !req.rawBody) return false;
  const mac = crypto.createHmac('sha512', key).update(req.rawBody);
  const digest = mac.digest();
  return [digest.toString('hex'), digest.toString('base64')].some((expected) => (
    expected.length === sent.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sent))
  ));
};

router.post('/shipbubble', async (req, res) => {
  res.status(200).json({ received: true }); // Shipbubble wants a 200 within 15s
  try {
    const body = req.body || {};
    const orderId = body.order_id || body.data?.order_id;
    if (typeof orderId !== 'string' || !/^SB-[A-Z0-9]+$/i.test(orderId)) return;
    const deliveries = require('../services/deliveryService');
    const signed = shipSignatureOk(req);
    console.log(`[shipbubble webhook] ${body.event || 'event'} ${orderId} → ${body.status || '?'} (${signed ? 'signed' : 'unsigned, re-checking with API'})`);
    if (signed) await deliveries.applyShipment(body.data?.order_id ? body.data : body);
    else await deliveries.refreshTracking([orderId]);
  } catch (error) {
    console.error('[shipbubble webhook]', error.message);
  }
});

/**
 * @swagger
 * /api/webhooks/fez:
 *   post:
 *     summary: Fez Delivery webhook endpoint
 *     description: Receives webhook events from Fez Delivery for order status updates
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderNumber
 *               - status
 *             properties:
 *               orderNumber:
 *                 type: string
 *                 description: The Fez order number
 *                 example: D0QR05032515
 *               status:
 *                 type: string
 *                 description: The new status of the order
 *                 enum:
 *                   - Pending Pick-Up
 *                   - Picked-Up
 *                   - Dispatched
 *                   - Delivered
 *                   - Cancelled
 *                 example: Delivered
 *     responses:
 *       200:
 *         description: Webhook received and processed
 *       400:
 *         description: Invalid webhook payload
 *       500:
 *         description: Server error
 */
router.post('/fez', orderController.handleFezWebhook);

module.exports = router;
