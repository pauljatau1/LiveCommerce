const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware.verifyToken, orderController.createOrder);
router.get('/', authMiddleware.verifyToken, orderController.getAllOrders);
router.get('/buyer/:buyerId', authMiddleware.verifyToken, orderController.getOrdersForBuyer);
router.get('/seller/:sellerId', authMiddleware.verifyToken, orderController.getOrdersForSeller);
router.get('/:id', authMiddleware.verifyToken, orderController.getOrder);
router.put('/:id', authMiddleware.verifyToken, orderController.updateOrder);
router.put('/:id/mark-as-paid', authMiddleware.verifyToken, orderController.markOrderAsPaid);
router.delete('/:id', authMiddleware.verifyToken, orderController.deleteOrder);

module.exports = router;
