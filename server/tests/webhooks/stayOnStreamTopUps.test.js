const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mockGet = jest.fn(), mockPost = jest.fn(), mockEmit = jest.fn();
jest.mock('axios', () => { const actual = jest.requireActual('axios'); return { ...actual, create: jest.fn(() => {
  const c = actual.create(); c.get = (...a) => mockGet(...a); c.post = (...a) => mockPost(...a); return c;
}) }; });
const { app } = require('@/app');
const Buyer = require('@models/Buyer'), Card = require('@models/PaystackCard'), Charge = require('@models/WalletCharge'), Transaction = require('@models/Transaction');
const verify = require('@modules/buyer/services/verifyWalletTopUp.service').verifyWalletTopUp;
const store = require('@/services/wallet/cardStore');
let db, buyer, other;
const secret = 'sk_test_mock_only';
const token = (who = buyer, role = 'Buyer') => `Bearer ${jwt.sign({ id: String(who._id), role }, process.env.JWT_SECRET)}`;
const call = (method, path, body, who = buyer) => request(app)[method](`/api/v2/wallet${path}`).set('Authorization', token(who)).send(body);
const webhook = (event, data) => { const body = JSON.stringify({ event, data }); return request(app).post('/api/webhooks/paystack').set('Content-Type', 'application/json').set('x-paystack-signature', crypto.createHmac('sha512', secret).update(body).digest('hex')).send(body); };
const account = { account_number: '1234567890', account_name: 'ADA TEST', bank: { name: 'Test Bank', slug: 'test-bank' } };
const payment = (reference, extra = {}) => ({ status: 'success', currency: 'NGN', amount: 500000, reference, channel: 'card', customer: { email: buyer.email, customer_code: 'CUS_ada' }, metadata: { buyerId: String(buyer._id), purpose: 'wallet_topup', saveCard: true }, authorization: { authorization_code: 'AUTH_server_only', reusable: true, signature: 'card_signature', last4: '4081', bank: 'Test Bank', brand: 'visa', exp_month: '12', exp_year: '2035' }, ...extra });
const provider = (data) => ({ data: { status: true, data } });
const balance = async () => (await Buyer.findById(buyer._id)).wallet.balance;
const saveCard = async () => { await store.saveCard(buyer, payment('store')); return (await Card.findOne({ buyer: buyer._id }))._id.toString(); };
beforeAll(async () => {
  db = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '7.0.3' } }); await mongoose.connect(db.getUri());
  await Promise.all([Buyer, Card, Charge, Transaction].map((m) => m.init()));
  jest.spyOn(require('@/socket/socketManager'), 'getIO').mockReturnValue({ to: () => ({ emit: mockEmit }) });
});
afterAll(async () => { await mongoose.disconnect(); await db.stop(); delete process.env.PAYSTACK_DVA_ENABLED; delete process.env.PAYSTACK_SAVED_CARDS_ENABLED; });
beforeEach(async () => {
  process.env.PAYSTACK_SECRET_KEY = secret; process.env.PAYSTACK_DVA_ENABLED = 'true'; process.env.PAYSTACK_SAVED_CARDS_ENABLED = 'true'; process.env.PAYSTACK_DVA_BANK = 'test-bank';
  await Promise.all([Buyer, Card, Charge, Transaction].map((m) => m.deleteMany({}))); mockGet.mockReset(); mockPost.mockReset(); mockEmit.mockClear();
  buyer = await Buyer.create({ firstName: 'Ada', lastName: 'Test', email: 'ada@test.example', username: 'ada', phoneNumber: '08012345678', authProvider: 'google' });
  other = await Buyer.create({ email: 'other@test.example', username: 'other', authProvider: 'google' });
  mockGet.mockImplementation(async (url) => url.startsWith('/transaction/verify/') ? provider(payment(decodeURIComponent(url.split('/').pop()))) : provider({ customer_code: 'CUS_ada' }));
  mockPost.mockResolvedValue(provider(null));
});
it('requires buyer authentication and flags; off keeps methods unavailable', async () => {
  expect((await request(app).post('/api/v2/wallet/dva').send({ consent: true })).status).toBe(401);
  expect((await request(app).post('/api/v2/wallet/dva').set('Authorization', token(buyer, 'Seller')).send({ consent: true })).status).toBe(403);
  process.env.PAYSTACK_DVA_ENABLED = 'false'; process.env.PAYSTACK_SAVED_CARDS_ENABLED = 'false';
  expect((await call('post', '/dva', { consent: true })).status).toBe(404);
  expect((await call('get', '/cards')).body.cards).toEqual([]);
  expect(mockPost).not.toHaveBeenCalled();
});
it('requires consent and profile details before contacting Paystack', async () => {
  expect((await call('post', '/dva', {})).status).toBe(400);
  expect((await call('post', '/dva', { consent: true }, other)).body.message).toMatch(/profile/);
  // Bypass setters to represent invalid pre-existing data.
  await Buyer.collection.updateOne({ _id: buyer._id }, { $set: { phoneNumber: '1234' } });
  expect((await call('post', '/dva', { consent: true })).body.message).toMatch(/11-digit/);
  expect(mockPost).not.toHaveBeenCalled();
});
it('assigns once, persists consent/customer code and returns pending on repeated calls', async () => {
  expect((await call('post', '/dva', { consent: true })).body.status).toBe('pending');
  expect((await call('post', '/dva', { consent: true })).body.status).toBe('pending');
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(mockPost).toHaveBeenCalledWith('/dedicated_account/assign', expect.objectContaining({ email: buyer.email, phone: '08012345678', preferred_bank: 'test-bank', country: 'NG' }));
  expect((await Buyer.findById(buyer._id)).dvaConsentAt).toBeTruthy();
});
for (const prefix of ['dedicatedaccount.assign', 'assigndedicatedaccount', 'assigndedicatedaccount.assign']) {
  it(`handles ${prefix}.success and failed idempotently`, async () => {
    await call('post', '/dva', { consent: true });
    expect((await webhook(`${prefix}.failed`, { customer: { customer_code: 'CUS_ada' } })).status).toBe(200);
    expect((await call('get', '/dva')).body.status).toBe('failed');
    expect((await webhook(`${prefix}.success`, { customer: { customer_code: 'CUS_ada' }, dedicated_account: account })).status).toBe(200);
    const res = await call('get', '/dva'); expect(res.body).toMatchObject({ status: 'active', accountNumber: '1234567890', bankName: 'Test Bank' });
    await webhook(`${prefix}.failed`, { customer: { customer_code: 'CUS_ada' } });
    expect((await call('get', '/dva')).body.status).toBe('active');
    expect(mockEmit).toHaveBeenCalledWith('wallet_dva_ready', expect.any(Object));
  });
}
it('reports a plain failure when BVN/customer validation is required', async () => {
  mockPost.mockRejectedValue({ response: { status: 400, data: { message: 'BVN customer validation required' } } });
  const res = await call('post', '/dva', { consent: true }); expect(res.status).toBe(422); expect(res.body.message).toBe("We can't set up an account number right now. Use a card instead.");
  expect((await Buyer.findById(buyer._id)).dva.status).toBe('failed');
});
it('picks up an account through customer polling after 10 seconds', async () => {
  await call('post', '/dva', { consent: true });
  await Buyer.updateOne({ _id: buyer._id }, { $set: { 'dva.requestedAt': new Date(Date.now() - 11000) } });
  mockGet.mockResolvedValue(provider({ dedicated_account: account }));
  expect((await call('get', '/dva')).body.status).toBe('active');
  expect(mockGet).toHaveBeenCalledWith('/customer/CUS_ada');
});
it('verifies dedicated_nuban and credits once even when purpose also matches', async () => {
  await Buyer.updateOne({ _id: buyer._id }, { $set: { paystackCustomerCode: 'CUS_ada', dvaConsentAt: new Date() } });
  mockGet.mockImplementation(async (url) => provider(payment(url.split('/').pop(), { channel: 'dedicated_nuban' })));
  const event = { reference: 'BANK_REF', channel: 'dedicated_nuban', customer: { customer_code: 'CUS_ada' }, metadata: { purpose: 'wallet_topup' } };
  const responses = await Promise.all([webhook('charge.success', event), webhook('charge.success', event)]);
  expect(responses.map((r) => r.status)).toEqual([200, 200]); expect(await balance()).toBe(5000);
  expect(await Transaction.countDocuments({ type: 'wallet_topup', source: 'bank_transfer' })).toBe(1);
  expect(mockEmit.mock.calls.filter(([name]) => name === 'wallet_credited')).toHaveLength(1);
});
it('refuses a transfer whose verified customer, currency or amount does not match', async () => {
  await Buyer.updateOne({ _id: buyer._id }, { $set: { paystackCustomerCode: 'CUS_ada', dvaConsentAt: new Date() } });
  for (const extra of [{ customer: { customer_code: 'CUS_other' } }, { currency: 'USD' }, { amount: -1 }]) {
    mockGet.mockResolvedValue(provider(payment('BAD', { channel: 'dedicated_nuban', ...extra })));
    await expect(verify('BAD', { dedicatedCustomerCode: 'CUS_ada' })).rejects.toThrow();
  }
  expect(await balance()).toBe(0);
});
it('limits requery atomically to one call in ten minutes', async () => {
  await Buyer.updateOne({ _id: buyer._id }, { $set: { 'dva.status': 'active', 'dva.accountNumber': account.account_number, 'dva.bankSlug': 'test-bank' } });
  expect((await call('post', '/dva/requery', {})).status).toBe(200);
  expect((await call('post', '/dva/requery', {})).status).toBe(429);
  expect(mockGet.mock.calls.filter(([url]) => url === '/dedicated_account/requery')).toHaveLength(1);
});
it('saves only consented reusable card charges, encrypted and deduped by signature', async () => {
  for (const data of [payment('a', { metadata: { saveCard: false } }), payment('b', { channel: 'bank' }), payment('c', { authorization: { ...payment('x').authorization, reusable: false } })]) await store.saveCard(buyer, data);
  expect(await Card.countDocuments()).toBe(0);
  await store.saveCard(buyer, payment('d')); await store.saveCard(buyer, payment('e'));
  expect(await Card.countDocuments()).toBe(1);
  const card = await Card.findOne().select('+authorization'); expect(card.authorization).not.toContain('AUTH_server_only');
  const res = await call('get', '/cards'); expect(res.body.cards[0]).toMatchObject({ usable: true, last4: '4081' });
  expect(JSON.stringify(res.body)).not.toMatch(/AUTH_|authorization|signature|email/);
});
it('marks an email-changed or expired card unusable and permits removal', async () => {
  const id = await saveCard();
  await Buyer.updateOne({ _id: buyer._id }, { $set: { email: 'new@test.example' } });
  expect((await call('get', '/cards')).body.cards[0].usable).toBe(false);
  await Buyer.updateOne({ _id: buyer._id }, { $set: { email: buyer.email } });
  await Card.updateOne({ _id: id }, { $set: { expYear: 2020 } });
  expect((await call('get', '/cards')).body.cards[0].usable).toBe(false);
  expect((await call('delete', `/cards/${id}`, undefined, other)).status).toBe(200); expect(await Card.countDocuments()).toBe(1);
  await call('delete', `/cards/${id}`); expect(await Card.countDocuments()).toBe(0);
});
it('charges once under concurrent idempotency-key reuse and verifies before credit', async () => {
  const id = await saveCard(); mockPost.mockResolvedValue(provider({ status: 'success' }));
  const charge = () => call('post', `/cards/${id}/charge`, { amount: 5000, idempotencyKey: 'same_click_key' });
  const responses = await Promise.all([charge(), charge()]); expect(responses.every((r) => r.status === 200)).toBe(true);
  expect(mockPost).toHaveBeenCalledTimes(1); expect(await balance()).toBe(5000);
  const again = await charge(); expect(again.body.status).toBe('success'); expect(mockPost).toHaveBeenCalledTimes(1);
  expect((await call('post', `/cards/${id}/charge`, { amount: 10000, idempotencyKey: 'same_click_key' })).status).toBe(409);
  expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/transaction/verify/'));
});
it('returns paused access code without authorizations and credits through the webhook later', async () => {
  const id = await saveCard(); mockPost.mockResolvedValue(provider({ paused: true, access_code: 'resume_public_code' }));
  const res = await call('post', `/cards/${id}/charge`, { amount: 5000, idempotencyKey: 'bank_check_key' });
  expect(res.body).toMatchObject({ status: 'needs_bank_check', accessCode: 'resume_public_code' }); expect(await balance()).toBe(0);
  await webhook('charge.success', { reference: res.body.reference, metadata: { purpose: 'wallet_topup' } });
  expect(await balance()).toBe(5000);
  expect((await call('get', `/topups/${res.body.reference}`)).body.status).toBe('success');
  expect((await call('get', `/topups/${res.body.reference}`, undefined, other)).status).toBe(404);
});
it('declines plainly, requires a key, and rejects another buyer card', async () => {
  const id = await saveCard();
  expect((await call('post', `/cards/${id}/charge`, { amount: 5000 })).status).toBe(400);
  mockPost.mockResolvedValue(provider({ status: 'failed' }));
  const res = await call('post', `/cards/${id}/charge`, { amount: 5000, idempotencyKey: 'decline_key' });
  expect(res.status).toBe(422); expect(res.body.message).toBe('Your bank declined this card. Try another card or a bank transfer.');
  expect(await balance()).toBe(0);
  expect((await call('post', `/cards/${id}/charge`, { amount: 5000, idempotencyKey: 'other_buyer_key' }, other)).status).toBe(422);
});
it('does not credit an unverified success, and retries verification without charging again', async () => {
  const id = await saveCard(); mockPost.mockResolvedValue(provider({ status: 'success' }));
  mockGet.mockRejectedValue({ config: { headers: { Authorization: 'Bearer sk_test_do_not_log' } } });
  const first = await call('post', `/cards/${id}/charge`, { amount: 5000, idempotencyKey: 'verify_retry_key' });
  expect(first.body.status).toBe('processing'); expect(await balance()).toBe(0);
  expect(await Transaction.countDocuments()).toBe(0);
  mockGet.mockImplementation(async (url) => provider(payment(url.split('/').pop())));
  const final = await call('get', `/topups/${first.body.reference}`);
  expect(final.body.status).toBe('success'); expect(await balance()).toBe(5000); expect(mockPost).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(console.error.mock.calls)).not.toContain('sk_test_do_not_log');
});
it('does not resurrect a removed card when a duplicate webhook arrives', async () => {
  mockGet.mockResolvedValue(provider(payment('CONSENTED_CARD')));
  await verify('CONSENTED_CARD'); const id = String((await Card.findOne())._id);
  await call('delete', `/cards/${id}`); await verify('CONSENTED_CARD');
  expect(await Card.countDocuments()).toBe(0); expect(await balance()).toBe(5000);
});
it('rejects concurrent reuse of a key with a different amount', async () => {
  const id = await saveCard(); mockPost.mockResolvedValue(provider({ paused: true, access_code: 'resume_public_code' }));
  const responses = await Promise.all([5000, 10000].map(amount => call('post', `/cards/${id}/charge`, { amount, idempotencyKey: 'race_mismatch_key' })));
  expect(responses.map(r => r.status).sort()).toEqual([200, 409]); expect(mockPost).toHaveBeenCalledTimes(1); expect(await balance()).toBe(0);
});
it('does not credit when the ledger or wallet write fails inside the transaction', async () => {
  const fail = jest.spyOn(Buyer.prototype, 'save').mockRejectedValueOnce(new Error('wallet unavailable'));
  await expect(verify('ATOMIC_ROLLBACK')).rejects.toThrow('wallet unavailable'); fail.mockRestore();
  expect(await balance()).toBe(0); expect(await Transaction.countDocuments()).toBe(0);
  await verify('ATOMIC_ROLLBACK'); expect(await balance()).toBe(5000); expect(await Transaction.countDocuments()).toBe(1);
});
it('funds a bid and its real Shipbubble quote with a verified saved-card top-up', async () => {
  const shipbubble = require('@/services/shipbubble');
  const spies = [
    jest.spyOn(shipbubble, 'isConfigured').mockReturnValue(true),
    jest.spyOn(shipbubble, 'validateAddress').mockImplementation(async a => ({ address_code: /Admiralty/.test(a.address) ? 222 : 111 })),
    jest.spyOn(shipbubble, 'categoryIdFor').mockResolvedValue(90097994),
    jest.spyOn(shipbubble, 'boxFor').mockResolvedValue({ length: 25, width: 20, height: 10 }),
    jest.spyOn(shipbubble, 'fetchRates').mockResolvedValue({ couriers: [{ courier_id: 'kwik', courier_name: 'Kwik', rate_card_amount: 6650 }] }),
  ];
  try {
    const Seller = require('@models/Seller'), Product = require('@models/Product'), Stream = require('@models/Stream');
    const seller = await Seller.collection.insertOne({ firstName: 'Host', email: 'host@test.example', phoneNumber: '08031234567', sellerAddress: { addressLine1: '1 Allen Avenue', city: 'Ikeja', state: 'Lagos' } });
    const product = await Product.collection.insertOne({ name: 'Adire Bubu', price: 11000, status: 'active', stock: 3, seller: seller.insertedId, shippingInfo: { weight: { value: 0.4 } } });
    const show = await Stream.create({ seller: seller.insertedId, title: 'Adire live', category: 'Fashion', channelName: 'quoted', status: 'live', type: 'auction', products: [{ product: { productId: String(product.insertedId), name: 'Adire Bubu' }, minBid: 11000, maxBid: 100000, currentBid: 11000, bidStatus: 'active', run: 1, auctionEndsAt: new Date(Date.now() + 60000) }] });
    await Buyer.updateOne({ _id: buyer._id }, { $set: { 'wallet.balance': 2000, shippingAddresses: [{ country: 'NG', state: 'Lagos', city: 'Lekki', addressLine1: '5 Admiralty Way' }] } });
    const quotePath = `/api/v2/watch/${show._id}/me?productId=${product.insertedId}`;
    const quote = await request(app).get(quotePath).set('Authorization', token());
    expect(quote.body).toMatchObject({ depositDue: 6650, delivery: { amount: 6650, courierName: 'Kwik' } });
    const id = await saveCard();
    mockPost.mockResolvedValue(provider({ status: 'success' }));
    mockGet.mockImplementation(async url => provider(payment(url.split('/').pop(), { amount: 2000000 })));
    const topUp = await call('post', `/cards/${id}/charge`, { amount: 20000, idempotencyKey: 'quoted_delivery_bid' });
    expect(topUp.body).toMatchObject({ status: 'success', balance: 22000 });
    const deposit = await require('@/services/deliveryService').depositFor(show._id, buyer._id, product.insertedId);
    const result = await require('@/services/streamBidService').placeBid({ streamId: show._id, productId: String(product.insertedId), buyer, bidAmount: 12000, shippingFee: deposit, expectedRun: 1 });
    expect(result.ok).toBe(true);
    expect((await Buyer.findById(buyer._id)).wallet).toMatchObject({ balance: 22000, onHoldAmount: 18650 });
    expect(await Transaction.countDocuments({ type: 'wallet_topup', buyer: buyer._id })).toBe(1);
    expect(shipbubble.fetchRates).toHaveBeenCalledWith(expect.objectContaining({ sender_address_code: 111, reciever_address_code: 222, package_items: [expect.objectContaining({ unit_weight: '0.4' })] }));
  } finally { spies.forEach(spy => spy.mockRestore()); }
});
