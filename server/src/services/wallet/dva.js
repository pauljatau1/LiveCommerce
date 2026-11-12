const Buyer = require('../../models/Buyer');
const Transaction = require('../../models/Transaction');
const { client, requireMethod, WalletPaymentError: Error, emit } = require('./paystackClient');
const failure = "We can't set up an account number right now. Use a card instead.";
const {phoneDigits,phoneProblem,PHONE_ERROR}=require('../../utils/phone');
const phoneFor = value => require('../../utils/phone').normalisePhone(value);
const details = (buyer) => ({ status: buyer.dva?.status || 'none', accountNumber: buyer.dva?.accountNumber,
  accountName: buyer.dva?.accountName, bankName: buyer.dva?.bankName, bankSlug: buyer.dva?.bankSlug,
  assignedAt: buyer.dva?.assignedAt });
const providerReason = (error) => {
  const message = String(error.response?.data?.message || 'Paystack assignment unavailable').slice(0, 180);
  console.warn('[wallet] DVA assignment:', message.replace(/(?:sk_|AUTH_)[A-Za-z0-9_]+/g, '[redacted]'));
};
async function saveAccount(buyer, data) {
  const account = data.dedicated_account || data;
  if (!/^\d{10}$/.test(String(account.account_number || '')) || !account.bank?.name || !account.account_name) return false;
  await Buyer.updateOne({ _id: buyer._id, dvaConsentAt: { $ne: null }, 'dva.status': { $ne: 'active' } }, { $set: {
    'dva.status': 'active', 'dva.accountNumber': account.account_number, 'dva.accountName': account.account_name,
    'dva.bankName': account.bank.name, 'dva.bankSlug': account.bank.slug,
    'dva.assignedAt': new Date(), ...(data.customer?.customer_code ? { paystackCustomerCode: data.customer.customer_code } : {}),
  } });
  return true;
}
async function assign(buyerId, consent) {
  requireMethod('dva');
  if (consent !== true) throw new Error(400, 'Please agree before we open an account number.');
  let buyer = await Buyer.findById(buyerId);
  if (!buyer) throw new Error(404, 'Your profile could not be found.');
  if (buyer.dva?.status === 'active' || buyer.dva?.status === 'pending') return details(buyer);
  if (!buyer.firstName?.trim() || !buyer.lastName?.trim()) throw new Error(400, 'Add your first and last name to your profile.');
  const phone = phoneFor(buyer.phoneNumber);
  if (!phone) throw new Error(400, PHONE_ERROR);
  const preferredBank = process.env.PAYSTACK_DVA_BANK || (process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_') ? 'test-bank' : null);
  if (!preferredBank) throw new Error(503, failure);
  const claimed = await Buyer.findOneAndUpdate({ _id: buyerId, 'dva.status': { $nin: ['pending', 'active'] } },
    { $set: { 'dva.status': 'pending', 'dva.requestedAt': new Date(), dvaConsentAt: new Date() } }, { new: true });
  if (!claimed) return details(await Buyer.findById(buyerId));
  buyer = claimed;
  try {
    if (!buyer.paystackCustomerCode) {
      let customer;
      try { customer = (await client().get(`/customer/${encodeURIComponent(buyer.email)}`)).data.data; }
      catch (error) {
        if (error.response?.status !== 404) throw error;
        customer = (await client().post('/customer', { email: buyer.email, first_name: buyer.firstName, last_name: buyer.lastName, phone })).data.data;
      }
      if (!customer?.customer_code) throw new Error(502, failure);
      await Buyer.updateOne({ _id: buyerId }, { $set: { paystackCustomerCode: customer.customer_code } });
    }
    const response = await client().post('/dedicated_account/assign', {
      email: buyer.email, first_name: buyer.firstName, last_name: buyer.lastName, phone, country: 'NG',
      preferred_bank: preferredBank,
    });
    if (response.data.status !== true) throw new Error(502, failure);
    if (response.data.data) await saveAccount(buyer, response.data.data);
    return details(await Buyer.findById(buyerId));
  } catch (error) {
    providerReason(error);
    await Buyer.updateOne({ _id: buyerId, 'dva.status': 'pending' }, { $set: { 'dva.status': 'failed' } });
    throw new Error(422, failure);
  }
}
async function get(buyerId, since) {
  let buyer = await Buyer.findById(buyerId);
  if (!buyer) throw new Error(404, 'Your profile could not be found.');
  if (buyer.dva?.status === 'pending' && buyer.paystackCustomerCode && Date.now() - new Date(buyer.dva.requestedAt).getTime() > 10000) {
    const polled = await Buyer.findOneAndUpdate({ _id: buyerId, 'dva.status': 'pending', $or: [
      { 'dva.lastPolledAt': { $exists: false } }, { 'dva.lastPolledAt': { $lt: new Date(Date.now() - 10000) } } ] },
      { $set: { 'dva.lastPolledAt': new Date() } });
    if (polled) {
      try { const customer = (await client().get(`/customer/${encodeURIComponent(buyer.paystackCustomerCode)}`)).data.data;
        if (customer?.dedicated_account) await saveAccount(buyer, customer);
      } catch { /* pending is retried by the next poll; do not expose provider details */ }
      buyer = await Buyer.findById(buyerId);
    }
  }
  const from = Date.parse(since);
  const credit = Number.isFinite(from) ? await Transaction.findOne({ buyer: buyerId, type: 'wallet_topup', source: 'bank_transfer', createdAt: { $gte: new Date(from) } }).sort({ createdAt: -1 }).lean() : null;
  return { ...details(buyer), ...(credit ? { latestCredit: { reference: credit.paymentReference, amount: credit.amount, source: 'transfer' } } : {}) };
}
async function assignmentEvent(event, success) {
  const data = event.data || {}, customer = data.customer || {};
  const query = customer.customer_code ? { paystackCustomerCode: customer.customer_code } : { email: String(customer.email || '').toLowerCase() };
  const buyer = await Buyer.findOne({ ...query, dvaConsentAt: { $ne: null } });
  if (!buyer) return;
  if (success) await saveAccount(buyer, data);
  else await Buyer.updateOne({ _id: buyer._id, 'dva.status': { $ne: 'active' } }, { $set: { 'dva.status': 'failed' } });
  emit(buyer._id, 'wallet_dva_ready', details(await Buyer.findById(buyer._id)));
}
async function requery(buyerId) {
  requireMethod('dva');
  const buyer = await Buyer.findOneAndUpdate({ _id: buyerId, 'dva.status': 'active', $or: [
    { 'dva.lastRequeryAt': { $exists: false } }, { 'dva.lastRequeryAt': { $lte: new Date(Date.now() - 600000) } } ] },
    { $set: { 'dva.lastRequeryAt': new Date() } }, { new: true });
  if (!buyer) throw new Error(429, 'Please wait before checking this transfer again.');
  try { await client().get('/dedicated_account/requery', { params: { account_number: buyer.dva.accountNumber, provider_slug: buyer.dva.bankSlug } }); }
  catch { throw new Error(502, 'We could not check yet. Your transfer will still arrive.'); }
  return { message: 'We’re checking your transfer. Keep watching.' };
}
module.exports = { assign, get, assignmentEvent, requery, phoneFor };
