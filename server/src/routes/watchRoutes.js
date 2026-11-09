// Extra facts the buyer Watch screen needs that the stream itself doesn't carry:
// how many of each item sold, how many bids each auction has had, and a way
// to report a show. Public reads; reporting needs a buyer account.
const express = require('express');
const mongoose = require('mongoose');
const { verifyToken, isBuyer } = require('../middlewares/authMiddleware');
const Stream = require('../models/Stream');
require('../models/Seller'); // registered for populate()
require('../models/Buyer');
const agoraService = require('../services/agoraService');
const { RtcRole } = require('agora-access-token');
const deliveries = require('../services/deliveryService');
const deliveryEstimate = require('../services/deliveryEstimate');
const jwt = require('jsonwebtoken');

// Reads the buyer from the token when there is one; guests carry on without
const optionalBuyer = (req, res, next) => {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token) {
    try { const u = jwt.verify(token, process.env.JWT_SECRET); if (u?.role === 'Buyer') req.user = u; } catch { /* treat as a guest */ }
  }
  next();
};

const router = express.Router();

const REPORT_REASONS = ['Selling fakes as original', 'Asking to pay outside the app', 'Rude or abusive', 'Something else'];

const validId = (req, res, next) => (mongoose.isValidObjectId(req.params.streamId) ? next() : res.status(404).json({ success: false, message: "We couldn't find this show." }));

// The host's rating shows once they have MIN_RATINGS; before that buyers see "New host"
const MIN_RATINGS = 5;
const hostRating = async (sellerId) => {
  const seller = sellerId && await mongoose.model('Seller').findById(sellerId).select('stats.averageRating stats.totalReviews').lean();
  const ratings = Number(seller?.stats?.totalReviews) || 0;
  return ratings >= MIN_RATINGS
    ? { rating: Math.round((Number(seller.stats.averageRating) || 0) * 10) / 10, ratings, isNew: false }
    : { rating: null, ratings, isNew: true };
};

const countBy = (list, key, amount = () => 1) => list.reduce((m, x) => {
  const k = x && key(x);
  if (k) m[k] = (m[k] || 0) + amount(x);
  return m;
}, {});

// GET /api/v2/watch/:streamId/summary → { sold: {productId: n}, bids: {productId: n} }
router.get('/:streamId/summary', validId, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId).select('seller orders.product orders.orderDetails.quantity bids.product').lean();
    if (!stream) return res.status(404).json({ success: false, message: "We couldn't find this show." });
    res.json({
      success: true,
      sold: countBy(stream.orders || [], (o) => o.product && String(o.product), (o) => Number(o.orderDetails?.quantity) || 1),
      bids: countBy(stream.bids || [], (b) => b.product && String(b.product)),
      // Held once per show with a buyer's first item (see deliveryService)
      deliveryDeposit: deliveries.depositAmount(),
      host: await hostRating(stream.seller),
    });
  } catch (error) {
    console.error('[watch] summary', error.message);
    res.status(500).json({ success: false, message: "Couldn't load the show details. Try again." });
  }
});

// GET /api/v2/watch/:streamId/me → what this buyer still owes before a first bid:
// the show's one delivery deposit, unless they already have an item in this show.
router.get('/:streamId/me', verifyToken, isBuyer, validId, async (req, res) => {
  try {
    const depositDue = await deliveries.depositFor(req.params.streamId, req.user.id);
    const stream = await Stream.findById(req.params.streamId).select('seller').lean();
    const following = Boolean(stream && await mongoose.model('Seller').exists({ _id: stream.seller, 'followers.buyerId': new mongoose.Types.ObjectId(String(req.user.id)) }));
    res.json({ success: true, depositDue, following });
  } catch (error) {
    console.error('[watch] me', error.message);
    res.status(500).json({ success: false, message: "Couldn't check your delivery deposit. Try again." });
  }
});

// GET /api/v2/watch/:streamId/estimate?state=&city= → delivery estimate from this host to that area.
// Signed-in buyers can leave out the area to use their delivery address.
router.get('/:streamId/estimate', validId, optionalBuyer, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId).select('seller').lean();
    if (!stream) return res.status(404).json({ success: false, message: "We couldn't find this show." });
    let { state, city } = req.query;
    if ((!state || !city) && req.user?.id) {
      const buyer = await mongoose.model('Buyer').findById(req.user.id).select('shippingAddresses').lean();
      const a = buyer?.shippingAddresses?.find((x) => x.isActive) || buyer?.shippingAddresses?.[0];
      state = a?.state; city = a?.city;
    }
    const est = await deliveryEstimate.estimate({ sellerId: stream.seller, city, state });
    res.json({ success: true, available: true, ...est, deposit: deliveries.depositAmount() });
  } catch (error) {
    if (error instanceof deliveryEstimate.EstimateUnavailable) return res.json({ success: true, available: false, message: error.message });
    console.error('[watch] estimate', error.message);
    res.status(500).json({ success: false, message: "Couldn't get a delivery estimate. Try again." });
  }
});

// POST /api/v2/watch/:streamId/guest-join → video token for someone without an account.
// Guests watch and read chat; bidding and chatting need an account.
router.post('/:streamId/guest-join', validId, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId)
      .populate('seller', 'storeName businessName storeAvatar rating')
      .populate('products.currentBidder', 'firstName username')
      .select('seller title coverImage products status channelName type viewers scheduledStartTime')
      .lean();
    if (!stream) return res.status(404).json({ success: false, message: "We couldn't find this show." });
    if (stream.status !== 'live') return res.status(410).json({ success: false, message: stream.status === 'ended' ? 'This show has ended.' : "This show hasn't started yet.", status: stream.status });
    // Guest UIDs sit above the range used for buyers (1,000–1,000,000), so they never clash
    const uid = 2000000 + Math.floor(Math.random() * 1000000);
    const token = agoraService.generateToken(stream.channelName, uid, RtcRole.SUBSCRIBER);
    const { viewers, ...rest } = stream;
    res.json({
      success: true,
      guest: true,
      channelName: stream.channelName,
      token,
      agoraAppId: process.env.AGORA_APP_ID,
      uid,
      stream: { ...rest, viewerCount: (viewers || []).length },
    });
  } catch (error) {
    console.error('[watch] guest-join', error.message);
    res.status(500).json({ success: false, message: "Couldn't start the video. Try again." });
  }
});

// GET /api/v2/watch/:streamId/chat → the last 50 chat messages (read-only, no account needed)
router.get('/:streamId/chat', validId, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId).select({ chatInteractions: { $slice: -200 } }).lean();
    if (!stream) return res.status(404).json({ success: false, message: "We couldn't find this show." });
    const messages = (stream.chatInteractions || [])
      .filter((m) => m.type === 'comment' && !m.hidden)
      .slice(-50)
      .map((m) => ({ id: m.id, type: m.type, user: m.user, avatar: m.avatar, content: m.content, timestamp: m.timestamp }));
    res.json({ success: true, chatInteractions: messages });
  } catch (error) {
    console.error('[watch] chat', error.message);
    res.status(500).json({ success: false, message: "Couldn't load the chat. Try again." });
  }
});

// GET /api/v2/watch/:streamId/notes → the host's pinned show notes (or null)
router.get('/:streamId/notes', validId, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId).select('showNotes').lean();
    if (!stream) return res.status(404).json({ success: false, message: "We couldn't find this show." });
    const showNotes = require('../services/showNotes');
    const notes = stream.showNotes && !showNotes.isEmpty(stream.showNotes) ? stream.showNotes : null;
    res.json({ success: true, notes, firstLine: showNotes.firstLine(notes), sections: showNotes.SECTIONS });
  } catch (error) {
    console.error('[watch] notes', error.message);
    res.status(500).json({ success: false, message: "Couldn't load the show notes. Try again." });
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
