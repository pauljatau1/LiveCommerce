const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/webhooks:
 *   post:
 *     summary: Create a new webhook
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

router.post('/buyer', 
  authMiddleware.verifyToken,
  authMiddleware.isBuyer,
  webhookController.createWebhook
);

router.get('/',
  authMiddleware.verifyToken,
  webhookController.getWebhooks
);

router.put('/:webhookId',
  authMiddleware.verifyToken,
  webhookController.updateWebhook
);

router.delete('/:webhookId',
  authMiddleware.verifyToken,
  webhookController.deleteWebhook
);

module.exports = router;
