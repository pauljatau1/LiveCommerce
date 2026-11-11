const express = require('express');
const rateLimit = require('express-rate-limit');
const { verifyToken, isBuyer } = require('../middlewares/authMiddleware');
const { methods, WalletPaymentError } = require('../services/wallet/paystackClient');
const dva = require('../services/wallet/dva');
const cards = require('../services/wallet/cards');
const router = express.Router();
router.use(verifyToken, isBuyer);
const limit = rateLimit({ windowMs: 600000, limit: 10, keyGenerator: (req) => String(req.user.id),
  standardHeaders: true, legacyHeaders: false, message: { message: 'Please wait a moment before another top-up.' } });
const handle = (fn) => async (req, res) => {
  try { const data = await fn(req); res.status(data?.status === 'failed' ? 422 : 200).json(data); }
  catch (error) {
    if (!(error instanceof WalletPaymentError)) console.error('[wallet] Operation unavailable:', { name: error.name });
    res.status(error instanceof WalletPaymentError ? error.status : 503).json({ message: error instanceof WalletPaymentError ? error.message : 'We could not complete that just now. Please try again.' });
  }
};
router.post('/dva', limit, handle((r) => dva.assign(r.user.id, r.body?.consent)));
router.get('/dva', handle((r) => dva.get(r.user.id, r.query.since)));
router.post('/dva/requery', handle((r) => dva.requery(r.user.id)));
router.get('/cards', handle(async (r) => ({ cards: methods().savedCards ? await cards.list(r.user.id) : [] })));
router.delete('/cards/:id', handle((r) => cards.remove(r.user.id, r.params.id)));
router.post('/cards/:id/charge', limit, handle((r) => cards.charge(r.user.id, r.params.id, r.body || {})));
router.get('/topups/:reference', handle((r) => cards.status(r.user.id, r.params.reference)));
module.exports = router;
