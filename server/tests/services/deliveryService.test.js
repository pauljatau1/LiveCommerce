const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

jest.mock('@/services/shipbubble', () => ({
  isConfigured: () => true,
  validateAddress: jest.fn(async (a) => ({ address_code: /Admiralty/.test(a.address) ? 222 : 111 })),
  categoryIdFor: jest.fn(async () => 90097994),
  pickupDate: () => '2026-11-07',
  fetchRates: jest.fn(),
  boxFor: jest.fn(async () => ({ length: 25, width: 20, height: 10 })),
  walletBalance: jest.fn(async () => ({ balance: 100000, currency: 'NGN' })),
  cancelShipment: jest.fn(async () => ({})),
  createShipment: jest.fn(),
  getShipments: jest.fn(),
  ShipbubbleError: class extends Error {},
}));

const shipbubble = require('@/services/shipbubble');
const Buyer = require('@models/Buyer');
const Seller = require('@models/Seller');
const Stream = require('@models/Stream');
const Product = require('@models/Product');
const Order = require('@models/Order');
const ShowDelivery = require('@/models/ShowDelivery');
const deliveries = require('@/services/deliveryService');
const { createBuyNowOrder } = require('@/services/buyNowOrderService');

let replSet;
const rates = (amount) => ({ request_token: 'tok_1', couriers: [
  { courier_id: 'gig', courier_name: 'GIG', service_code: 'std', rate_card_amount: amount + 700, total: amount + 600 },
  { courier_id: 'kwik', courier_name: 'Kwik', service_code: 'same_day', rate_card_amount: amount, total: amount - 100, delivery_eta: 'Within 24 hrs' },
] });

describe('deliveryService (one delivery per buyer per show)', () => {
  let seller; let plush; let figure; let stream;

  const createBuyer = (name, balance, extra = {}) => Buyer.create({
    firstName: name, lastName: 'Test', authProvider: 'google', phoneNumber: '08031234567',
    username: `${name.toLowerCase()}-${new mongoose.Types.ObjectId()}`,
    email: `${name.toLowerCase()}-${new mongoose.Types.ObjectId()}@example.com`,
    wallet: { balance, onHoldAmount: 0 },
    shippingAddresses: [{ country: 'NG', state: 'Lagos', city: 'Lekki', addressLine1: '5 Admiralty Way' }],
    ...extra,
  });
  const wallet = async (b) => (await Buyer.findById(b._id).lean()).wallet;
  const buy = (buyer, product, quantity = 1) => createBuyNowOrder({ streamId: stream._id, productId: product._id.toString(), buyerId: buyer._id, quantity });

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '7.0.3' } });
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoose.connect(replSet.getUri());
    await Promise.all([Order, Buyer, Product, Stream, ShowDelivery].map((m) => m.createCollection()));
    await ShowDelivery.syncIndexes();
  });
  afterAll(async () => { await mongoose.disconnect(); await replSet.stop(); });

  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.DELIVERY_DEPOSIT_NGN;
    await Promise.all([Buyer, Seller, Stream, Product, Order, ShowDelivery].map((m) => m.deleteMany({})));
    seller = await Seller.collection.insertOne({ firstName: 'Sade', lastName: 'Seller', storeName: 'Figure Den', email: 's@example.com', phoneNumber: '8031112222', sellerAddress: { addressLine1: '1 Allen Avenue', city: 'Ikeja', state: 'Lagos' } }).then((r) => ({ _id: r.insertedId }));
    plush = await Product.collection.insertOne({ name: 'Nezuko plush', price: 15000, salePrice: 0, stock: 5, status: 'active', category: 'Plushies & Keychains', inventory: { sku: 'T-PLUSH' }, seo: { slug: 't-plush' }, seller: seller._id, images: [], shippingInfo: { weight: { value: 0.4 } } }).then((r) => ({ _id: r.insertedId }));
    figure = await Product.collection.insertOne({ name: 'Gojo figure', price: 20000, salePrice: 0, stock: 5, status: 'active', category: 'Figures', inventory: { sku: 'T-FIG' }, seo: { slug: 't-fig' }, seller: seller._id, images: [] }).then((r) => ({ _id: r.insertedId }));
    stream = await Stream.create({
      seller: seller._id, title: 'Friday drop', category: 'Figures', channelName: 'ch', status: 'live', type: 'open_show',
      products: [{ product: { productId: plush._id.toString(), name: 'Nezuko plush' } }, { product: { productId: figure._id.toString(), name: 'Gojo figure' } }],
    });
  });

  it('puts all of a buyer’s items from a show in one delivery and holds one deposit', async () => {
    const ada = await createBuyer('Ada', 50000);
    await buy(ada, plush);
    await buy(ada, figure);

    const list = await ShowDelivery.find({ buyer: ada._id }).lean();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ status: 'collecting', depositHeld: 3000 });
    expect(list[0].items.map((i) => i.name)).toEqual(['Nezuko plush', 'Gojo figure']);
    expect(await wallet(ada)).toMatchObject({ balance: 15000, onHoldAmount: 3000 });
    const orders = await Order.find({ buyer: ada._id }).lean();
    expect(orders.every((o) => String(o.delivery) === String(list[0]._id))).toBe(true);
  });

  it('needs room for the deposit on the first purchase only', async () => {
    const ada = await createBuyer('Ada', 16000); // 15,000 item + 3,000 deposit doesn't fit
    expect(await buy(ada, plush)).toMatchObject({ success: false, reason: 'insufficient_funds', needed: 18000 });
    expect(await wallet(ada)).toMatchObject({ balance: 16000, onHoldAmount: 0 });
  });

  it('after the show: one quote (cheapest courier), charged with the deposit counted', async () => {
    const ada = await createBuyer('Ada', 50000);
    await buy(ada, plush);
    await buy(ada, figure);
    shipbubble.fetchRates.mockResolvedValue(rates(2800));

    const [settled] = await deliveries.settleShow(stream._id);

    expect(settled).toMatchObject({ status: 'paid', fee: 2800, depositHeld: 0, quote: { courierName: 'Kwik', requestToken: 'tok_1' } });
    expect(await wallet(ada)).toMatchObject({ balance: 15000 - 2800, onHoldAmount: 0 });
    const body = shipbubble.fetchRates.mock.calls[0][0];
    expect(body).toMatchObject({ sender_address_code: 111, reciever_address_code: 222, category_id: 90097994 });
    expect(body.package_items).toHaveLength(2);
    // Addresses are verified once and reused
    shipbubble.validateAddress.mockClear();
    await deliveries.settle(settled._id);
    expect(shipbubble.validateAddress).not.toHaveBeenCalled();
  });

  it('waits for payment when the wallet is short, keeping the deposit, then the buyer pays', async () => {
    const ada = await createBuyer('Ada', 18000);
    await buy(ada, plush); // 3,000 left, all held as deposit
    shipbubble.fetchRates.mockResolvedValue(rates(4500));

    const [settled] = await deliveries.settleShow(stream._id);
    expect(settled).toMatchObject({ status: 'awaiting_payment', depositHeld: 3000, quote: { amount: 4500 } });
    await expect(deliveries.payDelivery({ buyerId: ada._id, deliveryId: settled._id })).rejects.toMatchObject({ status: 402 });

    await Buyer.updateOne({ _id: ada._id }, { $inc: { 'wallet.balance': 2000 } }); // top up
    const paid = await deliveries.payDelivery({ buyerId: ada._id, deliveryId: settled._id });
    expect(paid).toMatchObject({ status: 'paid', fee: 4500 });
    expect(await wallet(ada)).toMatchObject({ balance: 500, onHoldAmount: 0 });
    // Paying twice charges once
    await deliveries.payDelivery({ buyerId: ada._id, deliveryId: settled._id });
    expect((await wallet(ada)).balance).toBe(500);
  });

  it('keeps the deposit and records why when no quote is possible', async () => {
    const ada = await createBuyer('Ada', 50000);
    await buy(ada, plush);
    shipbubble.fetchRates.mockRejectedValue(new Error('Delivery quote failed: route not covered'));

    const [settled] = await deliveries.settleShow(stream._id);
    expect(settled).toMatchObject({ status: 'quote_failed', depositHeld: 3000 });
    expect(settled.lastError).toMatch(/route not covered/);
  });

  it('retries a failed price on schedule and charges once Shipbubble answers', async () => {
    const ada = await createBuyer('Ada', 50000);
    await buy(ada, plush);
    shipbubble.validateAddress.mockRejectedValueOnce(new Error('Address check failed: Enable API access in your dashboard to continue'));
    const [failed] = await deliveries.settleShow(stream._id);
    expect(failed.status).toBe('quote_failed');
    expect(failed.lastError).toMatch(/switched off on Shipbubble/);

    // Too soon: left alone for 5 minutes
    expect(await deliveries.retryStuck()).toHaveLength(0);

    shipbubble.fetchRates.mockResolvedValue(rates(2500));
    const [retried] = await deliveries.retryStuck({ now: Date.now() + 6 * 60 * 1000 });
    expect(retried).toMatchObject({ status: 'paid', fee: 2500, depositHeld: 0 });
    expect(await wallet(ada)).toMatchObject({ balance: 50000 - 15000 - 2500, onHoldAmount: 0 });
  });

  it('settles a delivery whose show ended without settling', async () => {
    const ada = await createBuyer('Ada', 50000);
    await buy(ada, plush);
    shipbubble.fetchRates.mockResolvedValue(rates(2000));
    expect(await deliveries.retryStuck()).toHaveLength(0); // show still live

    await Stream.updateOne({ _id: stream._id }, { status: 'ended' });
    const [settled] = await deliveries.retryStuck();
    expect(settled).toMatchObject({ status: 'paid', fee: 2000 });
  });

  it('asks for a phone number before quoting a buyer without one', async () => {
    const ada = await createBuyer('Ada', 50000, { phoneNumber: undefined });
    await buy(ada, plush);
    const [settled] = await deliveries.settleShow(stream._id);
    expect(settled.status).toBe('quote_failed');
    expect(settled.lastError).toMatch(/phone number/);
  });

  it('lets only the seller book a paid delivery, once', async () => {
    const ada = await createBuyer('Ada', 50000);
    await buy(ada, plush);
    shipbubble.fetchRates.mockResolvedValue(rates(2800));
    const [settled] = await deliveries.settleShow(stream._id);
    shipbubble.createShipment.mockResolvedValue({ order_id: 'SB-ABC123', status: 'pending', tracking_url: 'https://track/1', courier: { name: 'Kwik' } });

    await expect(deliveries.book({ sellerId: new mongoose.Types.ObjectId(), deliveryId: settled._id })).rejects.toMatchObject({ status: 404 });
    const booked = await deliveries.book({ sellerId: seller._id, deliveryId: settled._id });
    expect(booked).toMatchObject({ status: 'booked', shipbubble: { orderId: 'SB-ABC123', trackingUrl: 'https://track/1' } });
    expect(shipbubble.createShipment).toHaveBeenCalledWith({ requestToken: 'tok_1', courierId: 'kwik', serviceCode: 'same_day' });
    expect((await Order.findOne({ buyer: ada._id }).lean()).status).toBe('confirmed');

    await deliveries.book({ sellerId: seller._id, deliveryId: settled._id });
    expect(shipbubble.createShipment).toHaveBeenCalledTimes(1);
  });

  it('refuses to book before the buyer has paid', async () => {
    const ada = await createBuyer('Ada', 18000);
    await buy(ada, plush);
    shipbubble.fetchRates.mockResolvedValue(rates(4500));
    const [settled] = await deliveries.settleShow(stream._id);
    await expect(deliveries.book({ sellerId: seller._id, deliveryId: settled._id })).rejects.toMatchObject({ status: 409 });
  });

  it('follows Shipbubble’s status to delivered', async () => {
    const ada = await createBuyer('Ada', 50000);
    await buy(ada, plush);
    shipbubble.fetchRates.mockResolvedValue(rates(2800));
    const [settled] = await deliveries.settleShow(stream._id);
    shipbubble.createShipment.mockResolvedValue({ order_id: 'SB-XYZ', status: 'pending', tracking_url: 't' });
    await deliveries.book({ sellerId: seller._id, deliveryId: settled._id });

    shipbubble.getShipments.mockResolvedValue([{ order_id: 'SB-XYZ', status: 'picked_up', courier: { tracking_code: 'SA1' } }]);
    await deliveries.refreshTracking(['SB-XYZ']);
    expect((await ShowDelivery.findById(settled._id).lean()).status).toBe('in_transit');

    shipbubble.getShipments.mockResolvedValue([{ order_id: 'SB-XYZ', status: 'completed' }]);
    await deliveries.refreshTracking(['SB-XYZ']);
    expect((await ShowDelivery.findById(settled._id).lean()).status).toBe('delivered');
    expect((await Order.findOne({ buyer: ada._id }).lean()).status).toBe('delivered');
  });

  const paidDelivery = async () => {
    const ada = await createBuyer('Ada', 50000);
    await buy(ada, plush);
    shipbubble.fetchRates.mockResolvedValue(rates(2800));
    const [settled] = await deliveries.settleShow(stream._id);
    return { ada, settled };
  };

  it('uses Shipbubble’s box sizes for the package', async () => {
    const { settled } = await paidDelivery();
    expect(settled.status).toBe('paid');
    expect(shipbubble.fetchRates.mock.calls[0][0].package_dimension).toEqual({ length: 25, width: 20, height: 10 });
  });

  it('does not book when the Shipbubble wallet is too low, and says why', async () => {
    const { settled } = await paidDelivery();
    shipbubble.walletBalance.mockResolvedValueOnce({ balance: 1200, currency: 'NGN' });
    await expect(deliveries.book({ sellerId: seller._id, deliveryId: settled._id })).rejects.toMatchObject({ status: 402, message: expect.stringMatching(/Shipbubble wallet has ₦1,200/) });
    expect(shipbubble.createShipment).not.toHaveBeenCalled();
    expect((await ShowDelivery.findById(settled._id).lean()).status).toBe('paid');
  });

  it('explains a missing Shipbubble KYC in plain words', async () => {
    const { settled } = await paidDelivery();
    shipbubble.createShipment.mockRejectedValueOnce(Object.assign(new Error('Booking the courier failed: Please complete your KYC'), { status: 400 }));
    await expect(deliveries.book({ sellerId: seller._id, deliveryId: settled._id })).rejects.toMatchObject({ message: expect.stringMatching(/business verification \(KYC\)/) });
  });

  it('cancels a booked pickup so it can be booked again', async () => {
    const { settled } = await paidDelivery();
    shipbubble.createShipment.mockResolvedValue({ order_id: 'SB-C1', status: 'pending', tracking_url: 't' });
    await deliveries.book({ sellerId: seller._id, deliveryId: settled._id });

    const back = await deliveries.cancelPickup({ sellerId: seller._id, deliveryId: settled._id });
    expect(shipbubble.cancelShipment).toHaveBeenCalledWith('SB-C1');
    expect(back.status).toBe('paid');
    expect(back.shipbubble).toBeUndefined();
    shipbubble.fetchRates.mockResolvedValue(rates(2800));
    shipbubble.createShipment.mockResolvedValue({ order_id: 'SB-C2', status: 'pending', tracking_url: 't2' });
    expect(await deliveries.book({ sellerId: seller._id, deliveryId: settled._id })).toMatchObject({ status: 'booked', shipbubble: { orderId: 'SB-C2' } });
  });

  it('refuses to cancel a pickup the courier already processed', async () => {
    const { settled } = await paidDelivery();
    shipbubble.createShipment.mockResolvedValue({ order_id: 'SB-P1', status: 'pending', tracking_url: 't' });
    await deliveries.book({ sellerId: seller._id, deliveryId: settled._id });
    shipbubble.cancelShipment.mockRejectedValueOnce(new Error('Cancelling the pickup failed: Shipment label already processed'));
    await expect(deliveries.cancelPickup({ sellerId: seller._id, deliveryId: settled._id })).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/already processed/) });
    expect((await ShowDelivery.findById(settled._id).lean()).status).toBe('booked');
  });
});
