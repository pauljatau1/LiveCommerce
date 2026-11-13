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

const mockAgenda = { jobs: jest.fn(async () => []), schedule: jest.fn(async () => ({})) };
jest.mock('@/config/agenda', () => ({ agenda: mockAgenda }));

const shipbubble = require('@/services/shipbubble');
const Buyer = require('@models/Buyer');
const Seller = require('@models/Seller');
const Stream = require('@models/Stream');
const Product = require('@models/Product');
const Order = require('@models/Order');
const ShowDelivery = require('@/models/ShowDelivery');
const DeliveryEstimate = require('@/models/DeliveryEstimate');
const deliveries = require('@/services/deliveryService');
const { createBuyNowOrder } = require('@/services/buyNowOrderService');
const { createAuctionOrder } = require('@/services/auctionOrderService');
const bids = require('@/services/streamBidService');

let replSet;
const DEP = 2450; // Shipbubble's quote for the first item, held as the deposit
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
    shipbubble.fetchRates.mockResolvedValue(rates(DEP));
    await Promise.all([Buyer, Seller, Stream, Product, Order, ShowDelivery, DeliveryEstimate].map((m) => m.deleteMany({})));
    seller = await Seller.collection.insertOne({ firstName: 'Sade', lastName: 'Seller', storeName: 'Figure Den', email: 's@example.com', phoneNumber: '08031112222', sellerAddress: { addressLine1: '1 Allen Avenue', city: 'Ikeja', state: 'Lagos' } }).then((r) => ({ _id: r.insertedId }));
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
    expect(list[0]).toMatchObject({ status: 'collecting', depositHeld: DEP });
    expect(list[0].items.map((i) => i.name)).toEqual(['Nezuko plush', 'Gojo figure']);
    expect(await wallet(ada)).toMatchObject({ balance: 15000, onHoldAmount: DEP });
    const orders = await Order.find({ buyer: ada._id }).lean();
    expect(orders.every((o) => String(o.delivery) === String(list[0]._id))).toBe(true);
  });

  it('uses coordinates in pickup, typed quotes and saved quotes; a changed pin revalidates the cached address', async () => {
    await Seller.updateOne({_id:seller._id},{$set:{'sellerAddress.latitude':6.6,'sellerAddress.longitude':3.3}});
    const ada=await createBuyer('Map',50000,{shippingAddresses:[{country:'NG',state:'Lagos',city:'Lekki',addressLine1:'5 Admiralty Way',latitude:6.45,longitude:3.47}]});
    await deliveries.depositQuote({streamId:stream._id,buyerId:ada._id,productId:plush._id});
    expect(shipbubble.validateAddress).toHaveBeenCalledWith(expect.objectContaining({latitude:6.6,longitude:3.3}));
    expect(shipbubble.validateAddress).toHaveBeenCalledWith(expect.objectContaining({latitude:6.45,longitude:3.47}));
    shipbubble.validateAddress.mockClear();
    await deliveries.depositQuote({streamId:stream._id,buyerId:ada._id,productId:plush._id});
    expect(shipbubble.validateAddress).not.toHaveBeenCalled();
    await Buyer.updateOne({_id:ada._id},{$set:{'shippingAddresses.0.latitude':6.46}});
    await deliveries.depositQuote({streamId:stream._id,buyerId:ada._id,productId:plush._id});
    expect(shipbubble.validateAddress).toHaveBeenCalledWith(expect.objectContaining({latitude:6.46,longitude:3.47}));
    await deliveries.previewQuote({streamId:stream._id,productId:plush._id,address:{name:'Ada Test',addressLine1:'5 Admiralty Way',city:'Lekki',state:'Lagos',phoneNumber:'08031234567',latitude:6.48,longitude:3.49}});
    expect(shipbubble.validateAddress).toHaveBeenCalledWith(expect.objectContaining({latitude:6.48,longitude:3.49}));
  });

  it('quotes using the warehouse contact when the account phone is null',async()=>{
    await Seller.updateOne({_id:seller._id},{$set:{phoneNumber:null,'warehouseDetails.contactNumber':'08031234567','warehouseDetails.address':{state:'Lagos',city:'Yaba',lga:'Lagos Mainland',addressLine1:'14 Herbert Macaulay Way',addressLine2:'By the gate'}}});
    const ada=await createBuyer('Warehouse',50000);
    const q=await deliveries.previewQuote({streamId:stream._id,productId:plush._id,address:{name:'Ada Test',state:'Lagos',city:'Lekki',addressLine1:'5 Admiralty Way',phoneNumber:'08031234567'}});
    expect(q.amount).toBe(DEP);expect(shipbubble.validateAddress).toHaveBeenCalledWith(expect.objectContaining({phone:'08031234567',address:'14 Herbert Macaulay Way, By the gate, Yaba, Lagos Mainland, Lagos, Nigeria'}));
    expect((await deliveries.depositQuote({streamId:stream._id,buyerId:ada._id,productId:plush._id})).amount).toBe(DEP);
  });
  it('remembers a fixable host validation failure and clears it after a corrected quote',async()=>{
    const host=await Seller.findById(seller._id).lean();
    shipbubble.validateAddress.mockRejectedValueOnce(Object.assign(new Error('Invalid phone number'),{status:422}));
    await expect(deliveries.sellerAddressCode(host)).rejects.toMatchObject({fixable:true,party:'seller',kind:'phone'});
    const failed=await Seller.findById(seller._id).lean();expect(deliveries.pickupProblem(failed)).toMatch(/Check the phone number/);
    await deliveries.sellerAddressCode(failed);expect((await Seller.findById(seller._id).lean()).pickupValidation).toBeUndefined();
  });
  it.each(['seller','buyer'])('pauses %s address failures, notifies once and resumes only after an edit',async party=>{
    const ada=await createBuyer('Fix',50000);await buy(ada,plush);
    if(party==='seller')await Seller.collection.updateOne({_id:seller._id},{$set:{phoneNumber:'081085565429'}});
    else await Buyer.collection.updateOne({_id:ada._id},{$set:{'shippingAddresses.0.phoneNumber':'081085565429'}});
    const [paused]=await deliveries.settleShow(stream._id);expect(paused.status).toBe('needs_fix');expect(paused.fix.party).toBe(party);
    const Notification=require('@models/Notification');expect(await Notification.countDocuments({type:'delivery_needs_fix',[party]:party==='seller'?seller._id:ada._id})).toBe(1);
    shipbubble.validateAddress.mockClear();await deliveries.retryStuck({now:Date.now()+60*60*1000});await deliveries.settle(paused._id);
    expect(shipbubble.validateAddress).not.toHaveBeenCalled();expect(await Notification.countDocuments({type:'delivery_needs_fix',[party]:party==='seller'?seller._id:ada._id})).toBe(1);
    if(party==='seller')await Seller.updateOne({_id:seller._id},{$set:{phoneNumber:'08031234567'}});
    else await Buyer.updateOne({_id:ada._id},{$set:{'shippingAddresses.0.phoneNumber':'08031234567'}});
    const [retried]=await deliveries.retryStuck({now:Date.now()+60*60*1000});expect(retried.status).toBe('paid');
  });
  it('pauses an address-not-found response instead of polling Shipbubble',async()=>{
    const ada=await createBuyer('AddressFix',50000);await buy(ada,plush);await Buyer.updateOne({_id:ada._id},{$unset:{'shippingAddresses.0.shipbubbleCode':1}});
    shipbubble.validateAddress.mockRejectedValueOnce(Object.assign(new Error('Address not found'),{status:422}));
    const [paused]=await deliveries.settleShow(stream._id);expect(paused).toMatchObject({status:'needs_fix',fix:{party:'buyer',kind:'address'}});
    shipbubble.validateAddress.mockClear();await deliveries.retryStuck({now:Date.now()+600000});expect(shipbubble.validateAddress).not.toHaveBeenCalled();
  });

  it('holds a real Shipbubble quote for the first item, to the buyer\'s saved address (no flat fee)', async () => {
    const ada = await createBuyer('Ada', 50000);
    const q = await deliveries.depositQuote({ streamId: stream._id, buyerId: ada._id, productId: plush._id });
    expect(q).toMatchObject({ amount: DEP, courierName: 'Kwik', area: 'Lekki, Lagos' });
    const body = shipbubble.fetchRates.mock.calls[0][0];
    expect(body).toMatchObject({ sender_address_code: 111, reciever_address_code: 222 });
    expect(body.package_items).toEqual([expect.objectContaining({ name: 'Nezuko plush', unit_weight: '0.4' })]);
    // The same route and weight is reused for a day, not re-quoted on every bid
    shipbubble.fetchRates.mockClear();
    await deliveries.depositQuote({ streamId: stream._id, buyerId: ada._id, productId: plush._id });
    expect(shipbubble.fetchRates).not.toHaveBeenCalled();
    // A buyer who already has an item in this show owes no second deposit
    await buy(ada, plush);
    expect(await deliveries.depositFor(stream._id, ada._id, figure._id)).toBe(0);
  });

  it('an auction win holds the same quoted deposit (the bid reserved room for it)', async () => {
    const ada = await createBuyer('Ada', 50000);
    const auction = await Stream.create({
      seller: seller._id, title: 'Auction', category: 'Clothing', channelName: 'ch2', status: 'live', type: 'auction',
      products: [{ product: { productId: plush._id.toString(), name: 'Nezuko plush' }, minBid: 5000, maxBid: 100000, bidStatus: 'active' }],
    });
    const fee = await deliveries.depositFor(auction._id, ada._id, plush._id);
    expect(fee).toBe(DEP);
    await bids.placeBid({ streamId: auction._id, productId: plush._id.toString(), buyer: ada, bidAmount: 20000, shippingFee: fee, maxBid: 100000 });
    expect((await wallet(ada)).onHoldAmount).toBe(20000 + DEP);
    const r = await createAuctionOrder({ streamId: auction._id, productId: plush._id.toString(), buyerId: ada._id, bidAmount: 20000 });
    expect(r.success).toBe(true);
    expect(await wallet(ada)).toMatchObject({ balance: 30000, onHoldAmount: DEP });
    expect(await ShowDelivery.findOne({ stream: auction._id }).lean()).toMatchObject({ depositHeld: DEP });
  });

  it('won\'t price or sell without the buyer\'s address or the host\'s pickup address, and says why', async () => {
    const noAddress = await createBuyer('Bola', 50000, { shippingAddresses: [] });
    expect(await buy(noAddress, plush)).toMatchObject({ success: false, reason: 'no_address', message: 'Add your delivery address first.' });
    expect((await Product.findById(plush._id).lean()).stock).toBe(5);

    const ada = await createBuyer('Ada', 50000);
    await Seller.collection.updateOne({ _id: seller._id }, { $unset: { sellerAddress: 1 } });
    const r = await buy(ada, plush);
    expect(r).toMatchObject({ success: false, reason: 'out_of_area' });
    expect(r.message).toMatch(/Update your pickup address/);
    expect(shipbubble.fetchRates).not.toHaveBeenCalled();
  });

  it('prices a typed address for the one-step sheet without saving anything', async () => {
    const before = await Buyer.countDocuments();
    const q = await deliveries.previewQuote({ streamId: stream._id, productId: plush._id, address: { name:'Ada Test',addressLine1: '5 Admiralty Way', city: 'Lekki', state: 'Lagos', phoneNumber: '08031234567' } });
    expect(q).toMatchObject({ amount: DEP, area: 'Lekki, Lagos' });
    expect(shipbubble.validateAddress).toHaveBeenCalledWith(expect.objectContaining({ address: '5 Admiralty Way, Lekki, Eti-Osa, Lagos, Nigeria', phone: '08031234567' }));
    expect(await Buyer.countDocuments()).toBe(before);
    await expect(deliveries.previewQuote({ streamId: stream._id, address: { city: 'Lekki', state: 'Lagos' } })).rejects.toThrow(/street, area and state/);
  });

  it('needs room for the deposit on the first purchase only', async () => {
    const ada = await createBuyer('Ada', 16000); // 15,000 item + 2,450 quoted deposit doesn't fit
    expect(await buy(ada, plush)).toMatchObject({ success: false, reason: 'insufficient_funds', needed: 15000 + DEP });
    expect(await wallet(ada)).toMatchObject({ balance: 16000, onHoldAmount: 0 });
  });

  it('after the show: one quote (cheapest courier), charged with the deposit counted', async () => {
    const ada = await createBuyer('Ada', 50000);
    await buy(ada, plush);
    await buy(ada, figure);
    shipbubble.fetchRates.mockResolvedValue(rates(2800));

    const [settled] = await deliveries.settleShow(stream._id);

    expect(settled).toMatchObject({ status: 'paid', fee: 2800, depositApplied:DEP,adjustment:2800-DEP,depositHeld: 0, quote: { courierName: 'Kwik', requestToken: 'tok_1' } });
    expect(await wallet(ada)).toMatchObject({ balance: 15000 - 2800, onHoldAmount: 0 });
    const body = shipbubble.fetchRates.mock.calls.at(-1)[0]; // the after-show quote (the first call priced the deposit)
    expect(body).toMatchObject({ sender_address_code: 111, reciever_address_code: 222, category_id: 90097994 });
    expect(body.package_items).toHaveLength(2);
    // Addresses are verified once and reused
    shipbubble.validateAddress.mockClear();
    await deliveries.settle(settled._id);
    expect(shipbubble.validateAddress).not.toHaveBeenCalled();
  });

  it('waits for payment when the wallet is short, keeping the deposit, then the buyer pays', async () => {
    const ada = await createBuyer('Ada', 18000);
    await buy(ada, plush); // 3,000 left, 2,450 of it held as the deposit
    shipbubble.fetchRates.mockResolvedValue(rates(4500));

    const [settled] = await deliveries.settleShow(stream._id);
    expect(settled).toMatchObject({ status: 'awaiting_payment', depositHeld: DEP, quote: { amount: 4500 } });
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
    expect(settled).toMatchObject({ status: 'quote_failed', depositHeld: DEP });
    expect(settled.lastError).toMatch(/route not covered/);
  });

  it('retries a failed price on schedule and charges once Shipbubble answers', async () => {
    const ada = await createBuyer('Ada', 50000);
    await buy(ada, plush);
    shipbubble.fetchRates.mockRejectedValueOnce(new Error('Delivery quote failed: Enable API access in your dashboard to continue'));
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
    expect(settled).toMatchObject({ status: 'paid', fee: 2000,depositApplied:DEP,adjustment:2000-DEP });
  });

  it('asks for a courier phone number before the first buy, not after the show', async () => {
    const ada = await createBuyer('Ada', 50000, { phoneNumber: undefined });
    expect(await buy(ada, plush)).toMatchObject({ success: false, reason: 'no_address', message: 'Check the phone number' });
    expect(await ShowDelivery.countDocuments()).toBe(0);
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
    const order = await Order.findOne({ buyer: ada._id }).lean();
    expect(order.status).toBe('delivered');
    // Seller payout: items delivered and the closeOrder job scheduled once
    expect(order.shipping.tracking.status).toBe('delivered');
    expect(order.items.every((i) => i.status === 'delivered')).toBe(true);
    expect(mockAgenda.schedule).toHaveBeenCalledWith('in 1 day', 'closeOrder', { orderId: String(order._id) });
    expect(mockAgenda.schedule).toHaveBeenCalledTimes(1);
  });

  const paidDelivery = async () => {
    const ada = await createBuyer('Ada', 50000);
    await buy(ada, plush);
    shipbubble.fetchRates.mockResolvedValue(rates(2800));
    const [settled] = await deliveries.settleShow(stream._id);
    return { ada, settled };
  };

  it('applies a signed webhook payload directly, and ignores unknown shipments', async () => {
    const ada = await createBuyer('Ada', 50000);
    await buy(ada, plush);
    shipbubble.fetchRates.mockResolvedValue(rates(2800));
    const [settled] = await deliveries.settleShow(stream._id);
    shipbubble.createShipment.mockResolvedValue({ order_id: 'SB-WH1', status: 'pending', tracking_url: 't' });
    await deliveries.book({ sellerId: seller._id, deliveryId: settled._id });

    await deliveries.applyShipment({ event: 'shipment.status.changed', order_id: 'SB-WH1', status: 'in_transit', courier: { tracking_code: 'TC9' } });
    const d = await ShowDelivery.findById(settled._id).lean();
    expect(d).toMatchObject({ status: 'in_transit', shipbubble: { status: 'in_transit', trackingCode: 'TC9', trackingUrl: 't' } });
    expect(await deliveries.applyShipment({ order_id: 'SB-NOPE', status: 'completed' })).toBeNull();
  });

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
  it('refuses out-of-area quotes without contacting the courier', async () => {
    const b=await createBuyer('Outside',50000,{shippingAddresses:[{country:'NG',state:'Abuja',city:'Wuse',addressLine1:'1 Test Road'}]});
    await expect(deliveries.depositQuote({streamId:stream._id,buyerId:b._id,productId:plush._id})).rejects.toMatchObject({code:'out_of_area'});
    await expect(deliveries.previewQuote({streamId:stream._id,productId:plush._id,address:{state:'Ogun',city:'Ota',addressLine1:'1 Test Road',phoneNumber:'08031234567'}})).rejects.toMatchObject({code:'out_of_area'});
    expect(shipbubble.fetchRates).not.toHaveBeenCalled();
  });

  it('keeps an already paid delivery bookable after the service area changes', async () => {
    const {ada,settled}=await paidDelivery();
    await Seller.updateOne({_id:seller._id},{$set:{'sellerAddress.state':'Ogun'}});
    await Buyer.updateOne({_id:ada._id},{$set:{'shippingAddresses.0.state':'Abuja'}});
    shipbubble.createShipment.mockResolvedValue({order_id:'SB-EXISTING',status:'pending',tracking_url:'existing'});
    expect(await deliveries.book({sellerId:seller._id,deliveryId:settled._id})).toMatchObject({status:'booked'});
  });

  it('quotes a colour lot using its catalogue product weight',async()=>{
    const ada=await createBuyer('ColourQuote',50000),lot=new mongoose.Types.ObjectId();
    await Stream.updateOne({_id:stream._id},{$set:{products:[{product:{productId:lot,catalogueProductId:plush._id,colour:'Indigo',name:'Nezuko plush · Indigo'}}]}});
    await deliveries.depositQuote({streamId:stream._id,buyerId:ada._id,productId:lot});
    const body=shipbubble.fetchRates.mock.calls[0][0];
    expect(body.package_items).toEqual([expect.objectContaining({unit_weight:'0.4'})]);
  });

});
