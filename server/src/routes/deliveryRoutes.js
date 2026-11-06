// Show deliveries: buyers see and pay theirs; sellers book pickups.
const express = require('express');
const mongoose = require('mongoose');
const { verifyToken, isBuyer, isSeller } = require('../middlewares/authMiddleware');
const ShowDelivery = require('../models/ShowDelivery');
const deliveries = require('../services/deliveryService');

const router = express.Router();

const fail = (res, error) => {
  const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 500;
  if (status >= 500) console.error('[delivery]', error.message);
  res.status(status).json({ success: false, message: status >= 500 && !error.status ? 'Something went wrong' : error.message });
};
const validId = (req, res, next) => (mongoose.isValidObjectId(req.params.id) ? next() : res.status(404).json({ success: false, message: 'Delivery not found' }));

const view = (d) => ({
  _id: d._id,
  status: d.status,
  show: d.stream && { _id: d.stream._id, title: d.stream.title, coverImage: d.stream.coverImage?.url },
  seller: d.seller && { _id: d.seller._id, storeName: d.seller.storeName },
  buyer: d.buyer && { _id: d.buyer._id, username: d.buyer.username, firstName: d.buyer.firstName, lastName: d.buyer.lastName, area: [d.buyer.shippingAddresses?.[0]?.city, d.buyer.shippingAddresses?.[0]?.state].filter(Boolean).join(', ') },
  items: d.items,
  itemCount: (d.items || []).reduce((n, i) => n + (i.quantity || 1), 0),
  itemsTotal: (d.items || []).reduce((n, i) => n + (i.unitPrice || 0) * (i.quantity || 1), 0),
  depositHeld: d.depositHeld,
  fee: d.status === 'paid' || ['booked', 'in_transit', 'delivered'].includes(d.status) ? d.fee : d.quote?.amount || null,
  courier: d.shipbubble?.courierName || d.quote?.courierName,
  deliveryEta: d.quote?.deliveryEta,
  trackingUrl: d.shipbubble?.trackingUrl,
  trackingCode: d.shipbubble?.trackingCode,
  lastError: d.lastError,
  createdAt: d.createdAt,
  paidAt: d.paidAt,
});
const populate = (q) => q
  .populate('stream', 'title coverImage')
  .populate('seller', 'storeName')
  .populate('buyer', 'username firstName lastName shippingAddresses.city shippingAddresses.state');

// ---- buyer ----
router.get('/', verifyToken, isBuyer, async (req, res) => {
  try {
    const list = await populate(ShowDelivery.find({ buyer: req.user.id }).sort({ createdAt: -1 }).limit(50)).lean();
    res.json({ success: true, deliveries: list.map(view) });
  } catch (e) { fail(res, e); }
});

router.post('/:id/pay', verifyToken, isBuyer, validId, async (req, res) => {
  try {
    await deliveries.payDelivery({ buyerId: req.user.id, deliveryId: req.params.id });
    const d = await populate(ShowDelivery.findById(req.params.id)).lean();
    res.json({ success: true, delivery: view(d) });
  } catch (e) { fail(res, e); }
});

// ---- seller ----
router.get('/seller', verifyToken, isSeller, async (req, res) => {
  try {
    const filter = { seller: req.user.id };
    if (req.query.status) filter.status = { $in: String(req.query.status).split(',') };
    const list = await populate(ShowDelivery.find(filter).sort({ updatedAt: -1 }).limit(100)).lean();
    res.json({ success: true, deliveries: list.map(view) });
  } catch (e) { fail(res, e); }
});

router.post('/:id/book', verifyToken, isSeller, validId, async (req, res) => {
  try {
    await deliveries.book({ sellerId: req.user.id, deliveryId: req.params.id });
    const d = await populate(ShowDelivery.findById(req.params.id)).lean();
    res.json({ success: true, delivery: view(d) });
  } catch (e) { fail(res, e); }
});

router.post('/:id/cancel', verifyToken, isSeller, validId, async (req, res) => {
  try {
    await deliveries.cancelPickup({ sellerId: req.user.id, deliveryId: req.params.id });
    const d = await populate(ShowDelivery.findById(req.params.id)).lean();
    res.json({ success: true, delivery: view(d) });
  } catch (e) { fail(res, e); }
});

router.post('/:id/requote', verifyToken, isSeller, validId, async (req, res) => {
  try {
    const own = await ShowDelivery.exists({ _id: req.params.id, seller: req.user.id });
    if (!own) return res.status(404).json({ success: false, message: 'Delivery not found' });
    await deliveries.settle(req.params.id);
    const d = await populate(ShowDelivery.findById(req.params.id)).lean();
    res.json({ success: true, delivery: view(d) });
  } catch (e) { fail(res, e); }
});

// Refresh tracking for a delivery (buyer or seller who owns it)
router.post('/:id/refresh', verifyToken, validId, async (req, res) => {
  try {
    const d = await ShowDelivery.findOne({ _id: req.params.id, $or: [{ buyer: req.user.id }, { seller: req.user.id }] }).lean();
    if (!d) return res.status(404).json({ success: false, message: 'Delivery not found' });
    if (d.shipbubble?.orderId) await deliveries.refreshTracking([d.shipbubble.orderId]);
    const fresh = await populate(ShowDelivery.findById(d._id)).lean();
    res.json({ success: true, delivery: view(fresh) });
  } catch (e) { fail(res, e); }
});

module.exports = router;
