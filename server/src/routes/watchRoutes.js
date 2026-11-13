// Extra facts the buyer Watch screen needs that the stream itself doesn't carry:
// how many of each item sold, how many bids each auction has had, and a way
// to report a show. Public reads; reporting needs a buyer account.
const express = require('express');
const mongoose = require('mongoose');
const { verifyToken, isBuyer } = require('../middlewares/authMiddleware');
const Stream = require('../models/Stream');
require('../models/Seller'); // registered for populate()
require('../models/Buyer');
require('../models/ShowDelivery');
const agoraService = require('../services/agoraService');
const { RtcRole } = require('agora-access-token');
const deliveries = require('../services/deliveryService');
const deliveryEstimate = require('../services/deliveryEstimate');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Reads the buyer from the token when there is one; guests carry on without
const optionalBuyer = async (req, res, next) => {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token) {
    try { const u = jwt.verify(token, process.env.JWT_SECRET); await require('../services/auth/sessions').assertSession(u); if (u?.role === 'Buyer') req.user = u; } catch { /* treat as a guest */ }
  }
  next();
};

const router = express.Router();

const area = require('../services/serviceArea');
const DeliveryWaitlist = require('../models/DeliveryWaitlist');
router.get('/config', (req, res) => res.json({ serviceArea: area.serviceAreaConfig() }));
const optionalAccount = async (req,res,next)=>{
  const token=String(req.headers.authorization || '').replace(/^Bearer\s+/i,'');
  if(token){try{const u=jwt.verify(token,process.env.JWT_SECRET);await require('../services/auth/sessions').assertSession(u);if(['Buyer','Seller'].includes(u.role))req.user=u;}catch{return res.status(401).json({message:'Please sign in again.'});}}
  next();
};
router.post('/waitlist', rateLimit({ windowMs: 60000, max: 10, message: { message: 'Please wait a minute before trying again.' } }), optionalAccount, async (req, res) => {
  const state = area.normalizeState(req.body?.state);
  if (!state || state.length > 80) return res.status(400).json({ message: 'Choose the state you want delivery in.' });
  if (req.body.streamId && !mongoose.isValidObjectId(req.body.streamId)) return res.status(400).json({ message: 'Check the show link and try again.' });
  try {
    let buyer,owner;
    if(req.user){buyer=await mongoose.model(req.user.role).findById(req.user.id).lean();owner={[req.user.role.toLowerCase()]:buyer?._id};if(!buyer)return res.status(404).json({message:'Please sign in again.'});}
    else {const email=String(req.body?.email || '').trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254)return res.status(401).json({message:'Add your email so we can notify you.'});buyer={email};owner={contactType:'guest',email};}
    if (!buyer.email && !buyer.phoneNumber) return res.status(400).json({ message: 'Add an email or phone number to your account so we can notify you.' });
    await DeliveryWaitlist.init(); // Wait for the unique index before concurrent first requests.
    await DeliveryWaitlist.updateOne({ ...owner, state }, { $setOnInsert: { ...owner, email: buyer.email, phone: buyer.phoneNumber, state, streamId: req.body.streamId } }, { upsert: true });
    res.json({ success: true, message: 'We’ll tell you when delivery opens in your state.' });
  } catch (e) { if (e.code === 11000) return res.json({ success: true }); res.status(500).json({ message: 'Couldn’t save your request. Please try again.' }); }
});
router.get('/waitlist/counts', verifyToken, (req, res, next) => require('../middlewares/authMiddleware').isAdmin(req, res, next), async (req, res) => {
  try { res.json({ counts: await DeliveryWaitlist.aggregate([{ $group: { _id: '$state', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }]) }); }
  catch { res.status(500).json({ message: 'Couldn’t load the waitlist. Please try again.' }); }
});

const REPORT_REASONS = ['Selling fakes as original', 'Asking to pay outside the app', 'Rude or abusive', 'Something else'];

const validId = (req, res, next) => (mongoose.isValidObjectId(req.params.streamId) ? next() : res.status(404).json({ success: false, message: "We couldn't find this show." }));

// The host's rating shows once they have MIN_RATINGS; before that buyers see "New host"
const MIN_RATINGS = 5;
const hostRating = async (sellerId) => {
  const seller = sellerId && await mongoose.model('Seller').findById(sellerId).select('stats.averageRating stats.totalReviews weeklySlot').lean();
  const ratings = Number(seller?.stats?.totalReviews) || 0;
  // "Live every Saturday at 7pm", for Follow and the weekly calendar invite
  const weeklySlot = require('../services/weeklySlot');
  const slot = weeklySlot.validSlot(seller?.weeklySlot)
    ? { day: seller.weeklySlot.day, time: seller.weeklySlot.time, label: weeklySlot.label(seller.weeklySlot), next: weeklySlot.nextOccurrence(seller.weeklySlot) }
    : null;
  const shipsInDays = await shippingDays(sellerId);
  return ratings >= MIN_RATINGS
    ? { rating: Math.round((Number(seller.stats.averageRating) || 0) * 10) / 10, ratings, isNew: false, slot, shipsInDays }
    : { rating: null, ratings, isNew: true, slot, shipsInDays };
};

// "ships in 1–2 days": the host's real median time from paid delivery to courier booked,
// over their last 20 shipped packages. Null until there are at least 3, so it's never made up.
const MIN_SHIPPED = 3;
const shippingDays = async (sellerId) => {
  if (!sellerId) return null;
  const shipped = await mongoose.model('ShowDelivery').find(
    { seller: sellerId, paidAt: { $ne: null }, 'shipbubble.bookedAt': { $ne: null } },
    { paidAt: 1, 'shipbubble.bookedAt': 1 }
  ).sort({ 'shipbubble.bookedAt': -1 }).limit(20).lean();
  if (shipped.length < MIN_SHIPPED) return null;
  const days = shipped.map((d) => (new Date(d.shipbubble.bookedAt) - new Date(d.paidAt)) / 86400000).filter((n) => n >= 0).sort((a, b) => a - b);
  if (days.length < MIN_SHIPPED) return null;
  const median = days[Math.floor(days.length / 2)];
  return Math.max(1, Math.ceil(median));
};

const countBy = (list, key, amount = () => 1) => list.reduce((m, x) => {
  const k = x && key(x);
  if (k) m[k] = (m[k] || 0) + amount(x);
  return m;
}, {});

// GET /api/v2/watch/:streamId/summary → { sold: {productId: n}, bids: {productId: n} }
router.get('/:streamId/summary', validId, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId).select('seller orders.product orders.orderDetails.quantity orders.lotId bids.product bids.lotId').lean();
    if (!stream) return res.status(404).json({ success: false, message: "We couldn't find this show." });
    res.json({
      serviceArea: area.serviceAreaConfig(),
      success: true,
      sold: countBy(stream.orders || [], (o) => (o.lotId || o.product) && String(o.lotId || o.product), (o) => Number(o.orderDetails?.quantity) || 1),
      bids: countBy(stream.bids || [], (b) => (b.lotId || b.product) && String(b.lotId || b.product)),
      // The delivery deposit is a Shipbubble quote per buyer (GET /:streamId/me)
      deliveryDeposit: 0,
      topUpMethods: require('../services/wallet/paystackClient').methods(),
      host: await hostRating(stream.seller),
    });
  } catch (error) {
    console.error('[watch] summary', error.message);
    res.status(500).json({ success: false, message: "Couldn't load the show details. Try again." });
  }
});

// GET /api/v2/watch/:streamId/me?productId= → what this buyer still owes before a first bid:
// the delivery deposit, a real Shipbubble quote from the host's pickup address to
// their saved address (0 if they already have an item in this show).
router.get('/:streamId/me', verifyToken, isBuyer, validId, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId).select('seller').lean();
    const following = Boolean(stream && await mongoose.model('Seller').exists({ _id: stream.seller, 'followers.buyerId': new mongoose.Types.ObjectId(String(req.user.id)) }));
    const has = await mongoose.model('ShowDelivery').exists({ stream: req.params.streamId, buyer: req.user.id });
    if (has) return res.json({ success: true, depositDue: 0, following });
    try {
      const q = await deliveries.depositQuote({ streamId: req.params.streamId, buyerId: req.user.id, productId: req.query.productId });
      res.json({ success: true, depositDue: q.amount, delivery: q, following });
    } catch (e) {
      if (!(e instanceof deliveries.DeliveryError)) throw e;
      // Can't price it yet (no address, host address unfinished, Shipbubble off): say why
      res.json({ success: true, depositDue: null, deliveryProblem: e.message, following });
    }
  } catch (error) {
    if (error.code === 'out_of_area') return res.status(422).json({ code: error.code, reason: error.code, message: error.message, state: error.state });
    console.error('[watch] me', error.message);
    res.status(500).json({ success: false, message: "Couldn't check delivery for you. Try again." });
  }
});

// GET /api/v2/watch/:streamId/estimate?productId= → the delivery price from this host
// to the signed-in buyer's saved address, from Shipbubble. No area guesses: without
// a saved address there is nothing to price.
router.get('/:streamId/estimate', validId, optionalBuyer, async (req, res) => {
  try {
    if (!req.user?.id) return res.json({ success: true, available: false, message: 'Add your delivery address to see the delivery price.' });
    const q = await deliveries.depositQuote({ streamId: req.params.streamId, buyerId: req.user.id, productId: req.query.productId });
    res.json({ success: true, available: true, ...q });
  } catch (error) {
    if (error.code === 'out_of_area') return res.status(422).json({ code: error.code, reason: error.code, message: error.message, state: error.state });
    if (error instanceof deliveries.DeliveryError) return res.json({ success: true, available: false, message: error.message });
    console.error('[watch] estimate', error.message);
    res.status(500).json({ success: false, message: "Couldn't get a delivery price. Try again." });
  }
});

// POST /api/v2/watch/:streamId/delivery-quote { productId, address } → the Shipbubble
// price to an address the buyer has typed in the one-step sheet but not saved yet.
// Nothing is stored. Limited per IP: each call checks the address with Shipbubble.
const quoteLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many delivery checks. Wait a few minutes.' } });
router.post('/:streamId/delivery-quote', validId, quoteLimiter, optionalBuyer, async (req, res) => {
  try {
    const buyer=req.user?.role==='Buyer'?await mongoose.model('Buyer').findById(req.user.id,{firstName:1,lastName:1}).lean():{};
    const q = await deliveries.previewQuote({ streamId: req.params.streamId, productId: req.body?.productId, address: req.body?.address,buyer });
    res.json({ success: true, available: true, ...q });
  } catch (error) {
    if (error.code === 'out_of_area') return res.status(422).json({ code: error.code, reason: error.code, message: error.message, state: error.state });
    if (error instanceof deliveries.DeliveryError) return res.json({ success: true, available: false, message: error.message });
    console.error('[watch] delivery-quote', error.message);
    res.status(500).json({ success: false, message: "Couldn't get a delivery price. Try again." });
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
      .map((m) => ({ id: m.id, type: m.type, user: m.user, avatar: m.avatar, content: m.content, timestamp: m.timestamp, ...(m.data?.isHost ? { isHost: true } : {}) }));
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
