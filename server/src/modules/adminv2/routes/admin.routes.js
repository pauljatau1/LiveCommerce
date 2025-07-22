const express = require('express');
const adminController = require('../controllers/admin.controller');
const { adminAuth } = require('../../../middlewares/authMiddleware');

const router = express.Router();

router.get('/shipments', adminAuth, adminController.getShipments);
router.delete('/shipments', adminAuth, adminController.deleteShipment);
router.post('/shipments/cancel', adminAuth, adminController.cancelShipment);
router.get('/shipments/track/:shipmentId', adminAuth, adminController.trackShipment);
router.get('/shipments/:shipmentId', adminAuth, adminController.getShipmentById);
router.put('/shipments/:shipmentId', adminAuth, adminController.updateShipment);

router.post('/webhooks', adminAuth, adminController.createWebhook);
router.get('/webhooks', adminAuth, adminController.getWebhooks);
router.get('/webhooks/:webhookId', adminAuth, adminController.getWebhookById);
router.delete('/webhooks/:webhookId', adminAuth, adminController.deleteWebhook);
router.post('/webhooks/enable/:webhookId', adminAuth, adminController.enableWebhook);
router.post('/webhooks/disable/:webhookId', adminAuth, adminController.disableWebhook);
router.patch('/sellers/:sellerId/products/draft-status', adminAuth, adminController.setSellerProductsDraftStatus);
router.patch('/sellers/:sellerId/vacation-mode', adminAuth, adminController.setSellerVacationMode);


module.exports = router; 