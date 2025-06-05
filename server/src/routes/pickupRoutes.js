const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { s3 } = require('../config/awsConfig');
const {
  createPickupRequest,
  getAllPickupRequests,
  processPickupRequest,
  getSellerPickupRequests,
  getPickupStatus
} = require('../controllers/pickupController');
const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');

// Protect all routes after this middleware
router.use(authMiddleware.verifyToken);

// Route to get pickup status for an order
router.get(
  '/:orderId/status',
  getPickupStatus
);

// Route for sellers to create pickup request
router.post(
  '/:orderId/confirm',
  authMiddleware.isSeller,
  upload.single('proofOfDelivery'),
  createPickupRequest
);

// Route for sellers to view their pickup requests
router.get(
  '/seller',
  authMiddleware.isSeller,
  getSellerPickupRequests
);

// Route for admins to get all pickup requests
router.get(
  '/',
  authMiddleware.isAdmin,
  getAllPickupRequests
);

// Route for admins to process (approve/decline) pickup requests
router.post(
  '/:requestId/process',
  authMiddleware.isAdmin,
  processPickupRequest
);

// Combined route for uploading proof and confirming pickup
router.post('/:orderId/confirm',
  authMiddleware.isSeller,
  upload.single('proof'),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { note } = req.body;
      const proofImage = req.file;

      if (!proofImage) {
        return res.status(400).json({ message: 'Proof of delivery is required' });
      }

      const order = await Order.findById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (!order.isStorePickup) {
        return res.status(400).json({ message: 'This order is not a store pickup order' });
      }

      // Upload to S3
      const params = {
        Bucket: process.env.CDN_S3_BUCKET,
        Key: `pickup-proofs/${uuidv4()}-${proofImage.originalname}`,
        Body: proofImage.buffer,
        ContentType: proofImage.mimetype,
      };

      const uploadResult = await s3.upload(params).promise();
      const proofUrl = `https://${process.env.CDN_URL}/${uploadResult.Key}`;

      // Update order status
      order.items = order.items.map(item => ({
        ...item,
        status: 'delivered'
      }));

      order.shipping.tracking.status = 'delivered';
      order.shipping.tracking.history.push({
        status: 'delivered',
        timestamp: new Date(),
        description: 'Order picked up by customer',
        proof: {
          url: proofUrl,
          note: note || 'Pickup confirmed by seller'
        }
      });

      // Update store pickup status
      order.storePickupStatus = {
        state: 'confirmed_by_seller',
        confirmedAt: new Date()
      };

      await order.save();

      res.status(200).json({
        message: 'Pickup confirmed successfully',
        order
      });
    } catch (error) {
      console.error('Error confirming pickup:', error);
      res.status(500).json({ message: 'Error confirming pickup', error: error.message });
    }
  }
);

module.exports = router; 