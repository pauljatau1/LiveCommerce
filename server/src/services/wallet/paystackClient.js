const axios = require('axios');
class WalletPaymentError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const methods = () => ({
  dva: /^(true|1)$/i.test(process.env.PAYSTACK_DVA_ENABLED || ''),
  savedCards: /^(true|1)$/i.test(process.env.PAYSTACK_SAVED_CARDS_ENABLED || ''),
});
const client = () => {
  if (!process.env.PAYSTACK_SECRET_KEY) throw new WalletPaymentError(503, 'Payments are unavailable right now. Please try again.');
  return axios.create({ baseURL: 'https://api.paystack.co', timeout: 20000,
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' } });
};
const requireMethod = (name) => { if (!methods()[name]) throw new WalletPaymentError(404, 'This top-up method is not available. Use a card instead.'); };
const emit = (buyerId, event, data) => {
  const io = require('../../socket/socketManager').getIO();
  io?.to(String(buyerId)).emit(event, data);
};
module.exports = { client, methods, requireMethod, WalletPaymentError, emit };
