const crypto = require('crypto');
const Card = require('../../models/PaystackCard');
// Domain-separated key from the existing server session secret. Rotation makes
// old authorizations unusable; buyers can remove/re-save them. No extra secret.
const key = () => {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('Server encryption is not configured');
  return Buffer.from(crypto.hkdfSync('sha256', Buffer.from(secret), Buffer.alloc(0), Buffer.from('gbam-paystack-card-v1'), 32));
};
const encrypt = (value) => {
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':');
};
const decrypt = (value) => {
  const [version, iv, tag, data] = value.split(':');
  if (version !== 'v1') throw new Error('Unsupported card format');
  const cipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
  cipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([cipher.update(Buffer.from(data, 'base64')), cipher.final()]).toString('utf8');
};
const usable = (card, email, now = new Date()) => card.email.toLowerCase() === String(email).toLowerCase() &&
  new Date(Date.UTC(card.expYear, card.expMonth, 1)) > now;
const publicCard = (card, email) => ({ id: String(card._id), bank: card.bank, brand: card.brand,
  last4: card.last4, expMonth: card.expMonth, expYear: card.expYear, usable: usable(card, email) });
const saveCard = async (buyer, payment) => {
  const auth = payment.authorization;
  if (!require('./paystackClient').methods().savedCards || payment.metadata?.saveCard !== true ||
      payment.channel !== 'card' || auth?.reusable !== true || !auth.authorization_code || !auth.signature) return;
  if (!/^\d{4}$/.test(auth.last4) || !(Number(auth.exp_month) >= 1 && Number(auth.exp_month) <= 12) || !/^\d{4}$/.test(String(auth.exp_year))) return;
  const email = String(payment.customer?.email || '').trim().toLowerCase();
  if (!email) return;
  await Card.init();
  await Card.updateOne({ buyer: buyer._id, signature: String(auth.signature) }, { $set: {
    authorization: encrypt(auth.authorization_code), email,
    bank: String(auth.bank || '').slice(0, 80), brand: String(auth.brand || auth.card_type || '').slice(0, 40),
    last4: auth.last4, expMonth: Number(auth.exp_month), expYear: Number(auth.exp_year),
  } }, { upsert: true });
};
module.exports = { saveCard, decrypt, publicCard, usable };
