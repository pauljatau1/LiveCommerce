const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const Counter = require('../models/PasswordResetThrottle');
const WINDOW = 15 * 60000;
const MESSAGE = 'Too many tries. Please wait 15 minutes before trying again.';
const pathMatches = path => /^\/api\/(?:v2\/)?(?:buyer|buyers|seller|sellers)\/(?:auth\/)?(?:forgot-password(?:-sms)?|request-password-reset|reset-password(?:-with-token)?|verify-reset-token|resend-otp|resend-code)\/?$/.test(path);

function createPasswordResetLimit() {
  const ip = rateLimit({windowMs: WINDOW, max: 30, standardHeaders: true, legacyHeaders: false, message: {message: MESSAGE}});
  async function emailLimit(req, res, next) {
    try {
      const role = /\/sellers?\//.test(req.path) ? 'Seller' : 'Buyer';
      let identifier = String(req.body?.email || req.body?.phoneNumber || '').trim().toLowerCase();
      if (req.body?.token) {
        const challenge = await require('../models/PasswordResetChallenge').findOne({role, linkHash: require('../services/auth/passwordReset').hash(req.body.token)}).lean();
        const account = challenge && await require(`../models/${role}`).findById(challenge.account, {email: 1}).lean();
        // The link and code endpoints share the same email quota.
        identifier = account?.email?.trim().toLowerCase() || 'unknown-link';
      }
      if (!identifier) identifier = 'missing';
      const lane = /forgot|request-password|resend/.test(req.path) ? 'send' : 'verify';
      const bucket = Math.floor(Date.now() / WINDOW);
      const key = crypto.createHash('sha256').update(`${role}:${lane}:${identifier}:${bucket}`).digest('hex');
      const counter = await Counter.findOneAndUpdate({_id: key}, {$inc: {count: 1}, $setOnInsert: {expiresAt: new Date((bucket + 2) * WINDOW)}}, {upsert: true, new: true});
      if (counter.count > (lane === 'send' ? 5 : 20)) return res.status(429).json({message: MESSAGE});
      next();
    } catch (error) {
      console.warn('[password-reset] Rate check unavailable.');
      res.status(503).json({message: 'Password reset is temporarily unavailable. Please try again shortly.'});
    }
  }
  return (req, res, next) => req.method === 'POST' && pathMatches(req.path) ? ip(req, res, () => emailLimit(req, res, next)) : next();
}
module.exports = createPasswordResetLimit();
module.exports.createPasswordResetLimit = createPasswordResetLimit;
module.exports.pathMatches = pathMatches;
