// Extra facts the buyer Watch screen needs that the stream itself doesn't carry:
// how many of each item sold, how many bids each auction has had, and a way
// to report a show. Public reads; reporting needs a buyer account.
const express = require('express');
const mongoose = require('mongoose');
const { verifyToken, isBuyer } = require('../middlewares/authMiddleware');
const Stream = require('../models/Stream');

const router = express.Router();

const REPORT_REASONS = ['Selling fakes as original', 'Asking to pay outside the app', 'Rude or abusive', 'Something else'];

const validId = (req, res, next) => (mongoose.isValidObjectId(req.params.streamId) ? next() : res.status(404).json({ success: false, message: "We couldn't find this show." }));

const countBy = (list, key, amount = () => 1) => list.reduce((m, x) => {
  const k = x && key(x);
  if (k) m[k] = (m[k] || 0) + amount(x);
  return m;
}, {});

// GET /api/v2/watch/:streamId/summary → { sold: {productId: n}, bids: {productId: n} }
router.get('/:streamId/summary', validId, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId).select('orders.product orders.orderDetails.quantity bids.product').lean();
    if (!stream) return res.status(404).json({ success: false, message: "We couldn't find this show." });
    res.json({
      success: true,
      sold: countBy(stream.orders || [], (o) => o.product && String(o.product), (o) => Number(o.orderDetails?.quantity) || 1),
      bids: countBy(stream.bids || [], (b) => b.product && String(b.product)),
    });
  } catch (error) {
    console.error('[watch] summary', error.message);
    res.status(500).json({ success: false, message: "Couldn't load the show details. Try again." });
  }
});

// POST /api/v2/watch/:streamId/report { reason, note? }
router.post('/:streamId/report', verifyToken, isBuyer, validId, async (req, res) => {
  const reason = String(req.body?.reason || '');
  if (!REPORT_REASONS.includes(reason)) return res.status(400).json({ success: false, message: 'Pick a reason for the report.', reasons: REPORT_REASONS });
  const note = String(req.body?.note || '').trim().slice(0, 300);
  try {
    const buyer = new mongoose.Types.ObjectId(String(req.user.id));
    // One report per viewer per show; a second one replaces the first
    const stream = await Stream.findOneAndUpdate({ _id: req.params.streamId }, { $pull: { reports: { buyer } } }, { projection: { _id: 1 } });
    if (!stream) return res.status(404).json({ success: false, message: "We couldn't find this show." });
    await Stream.updateOne({ _id: stream._id }, { $push: { reports: { buyer, reason, note, createdAt: new Date() } } });
    res.json({ success: true, message: 'Thanks. Our team will look at this show.' });
  } catch (error) {
    console.error('[watch] report', error.message);
    res.status(500).json({ success: false, message: "Couldn't send the report. Try again." });
  }
});

router.REPORT_REASONS = REPORT_REASONS;
module.exports = router;
