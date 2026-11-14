const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const Buyer = require('@models/Buyer');
const Seller = require('@models/Seller');
const Stream = require('@models/Stream');
const Product = require('@models/Product');
const Order = require('@models/Order');
const bids = require('@/services/streamBidService');
const { createAuctionOrder } = require('@/services/auctionOrderService');

let replSet;

describe('auctionOrderService', () => {
  let seller;
  let product;
  let stream;

  const createBuyer = (name, balance) =>
    Buyer.create({
      firstName: name,
      lastName: 'Test',
      username: `${name.toLowerCase()}-${new mongoose.Types.ObjectId()}`,
      email: `${name.toLowerCase()}-${new mongoose.Types.ObjectId()}@example.com`,
      authProvider: 'google',
      wallet: { balance, onHoldAmount: 0 },
      shippingAddresses: [{ country: 'NG', state: 'Lagos', city: 'Ikeja', addressLine1: '1 Allen Avenue', zipCode: '100001' }],
    });

  const wallet = async (b) => (await Buyer.findById(b._id).lean()).wallet;
  const streamProduct = async () => (await Stream.findById(stream._id).lean()).products[0];
  const win = (buyer, bidAmount = 20000, shippingFee = 2000) =>
    bids.placeBid({ streamId: stream._id, productId: product._id.toString(), buyer, bidAmount, shippingFee, maxBid: 100000 });
  const order = (buyer, bidAmount = 20000, shippingFee = 2000) =>
    createAuctionOrder({ streamId: stream._id, productId: product._id.toString(), buyerId: buyer._id, bidAmount, shippingFee });

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '7.0.3' } });
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoose.connect(replSet.getUri());
    // Collections must exist before use inside a transaction
    await Promise.all([Order, Buyer, Product, Stream].map((m) => m.createCollection()));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await replSet.stop();
  });

  beforeEach(async () => {
    await Promise.all([Buyer, Seller, Stream, Product, Order].map((m) => m.deleteMany({})));
    seller = await Seller.collection.insertOne({ firstName: 'Sade', lastName: 'Seller', email: 's@example.com', sellerAddress: {state:'Lagos', city:'Yaba', addressLine1:'1 Test Street'}, storeName: 'Figures' })
      .then((r) => ({ _id: r.insertedId }));
    product = await Product.collection.insertOne({ name: 'Gojo figure', price: 20000, stock: 1, seller: seller._id, images: [] })
      .then((r) => ({ _id: r.insertedId }));
    stream = await Stream.create({
      seller: seller._id,
      title: 'Figure auction',
      category: 'Figures',
      channelName: 'ch-1',
      status: 'live',
      type: 'auction',
      products: [{ product: { productId: product._id.toString(), name: 'Gojo figure' }, minBid: 5000, maxBid: 100000, bidStatus: 'active' }],
    });
  });

  it('charges the winner bid plus delivery, clears the hold and creates a paid order', async () => {
    const ada = await createBuyer('Ada', 50000);
    await win(ada);
    expect((await wallet(ada)).onHoldAmount).toBe(22000);

    const result = await order(ada);

    expect(result).toMatchObject({ success: true, totals: { grandTotal: 22000 } });
    // The bid hold is gone; the show's delivery deposit (3,000) is now held
    expect(await wallet(ada)).toMatchObject({ balance: 28000, onHoldAmount: 0 }); // delivery pricing is off in this suite: no deposit
    const saved = await Order.findOne({ buyer: ada._id }).lean();
    expect(saved).toMatchObject({ paid: true, channel: 'auction', totalAmount: 20000, shipping: { fee: { amount: 2000 } } });
    expect(saved.delivery_address.state).toBe('Lagos');
    expect((await Product.findById(product._id).lean()).stock).toBe(0);
    const sp = await streamProduct();
    expect(sp).toMatchObject({ orderCreated: true, orderId: saved.order_id, holdAmount: 0 });
    expect((await Stream.findById(stream._id).lean()).orders).toHaveLength(1);
    const show = await Stream.findById(stream._id);
    expect(show.orders[0]).toMatchObject({ amount: 22000 });
    await expect(show.save()).resolves.toBeTruthy();
  });

  it('charges a win only once, even when called twice at the same time', async () => {
    const ada = await createBuyer('Ada', 50000);
    await win(ada);

    const results = await Promise.all([order(ada), order(ada)]);

    expect(results.filter((r) => r.success)).toHaveLength(1);
    // The bid hold is gone; the show's delivery deposit (3,000) is now held
    expect(await wallet(ada)).toMatchObject({ balance: 28000, onHoldAmount: 0 }); // delivery pricing is off in this suite: no deposit
    expect(await Order.countDocuments({ buyer: ada._id })).toBe(1);
  });

  it('rolls everything back and frees the hold when the item is out of stock', async () => {
    const ada = await createBuyer('Ada', 50000);
    await win(ada);
    await Product.collection.updateOne({ _id: product._id }, { $set: { stock: 0 } });

    const result = await order(ada);

    expect(result).toMatchObject({ success: false, reason: 'sold_out' });
    expect(await wallet(ada)).toMatchObject({ balance: 50000, onHoldAmount: 0 });
    expect(await Order.countDocuments({})).toBe(0);
    expect((await streamProduct()).orderCreated).not.toBe(true);
  });

  it('refuses to charge a buyer who does not hold the win', async () => {
    const ada = await createBuyer('Ada', 50000);
    const bola = await createBuyer('Bola', 50000);
    await win(ada);

    const result = await order(bola);

    expect(result).toMatchObject({ success: false, reason: 'no_hold' });
    expect(await wallet(bola)).toMatchObject({ balance: 50000, onHoldAmount: 0 });
  });

  describe('auction runs ("Run again")', () => {
    const { prepareRun } = require('@/services/auctionRuns');
    const ShowDelivery = require('@/models/ShowDelivery');
    const setStatus = (bidStatus) => Stream.updateOne({ _id: stream._id }, { $set: { 'products.0.bidStatus': bidStatus } });
    const run = (note, extra = {}) => prepareRun({ streamId: stream._id, sellerId: seller._id, productId: product._id.toString(), note, ...extra });

    beforeEach(async () => {
      await Product.updateOne({ _id: product._id }, { $set: { stock: 2 } });
      await setStatus('pending');
      await ShowDelivery.deleteMany({});
    });

    it('two runs make two orders, each with its own note, and take stock down by one each', async () => {
      const ada = await createBuyer('Ada', 100000);

      await run('Red, size M');
      await setStatus('active');
      await win(ada, 20000, 0);
      expect((await order(ada, 20000, 0)).success).toBe(true);
      await setStatus('ended');
      expect((await Product.findById(product._id).lean()).stock).toBe(1);
      expect((await streamProduct()).product.quantity).toBe(1);

      // Run again: a fresh auction for one more unit, same buyer wins again
      const next = await run('Blue, size L', { minBid: 6000, seconds: 60 });
      expect(next).toMatchObject({ run: 2, runNote: 'Blue, size L', bidStatus: 'pending', minBid: 6000, auctionSeconds: 60, currentBid: 0, orderCreated: false });
      await setStatus('active');
      await win(ada, 21000, 0);
      const second = await order(ada, 21000, 0);
      expect(second.success).toBe(true);

      expect((await Product.findById(product._id).lean()).stock).toBe(0);
      const orders = await Order.find({ buyer: ada._id }).sort({ createdAt: 1 }).lean();
      expect(orders.map((o) => o.items[0].note)).toEqual(['Red, size M', 'Blue, size L']);
      expect(orders.map((o) => o.paymentInfo.paymentReference)).toEqual([`auction_${stream._id}_${product._id}`, `auction_${stream._id}_${product._id}_r2`]);
      const delivery = await ShowDelivery.findOne({ buyer: ada._id }).lean();
      expect(delivery.items.map((i) => i.note)).toEqual(['Red, size M', 'Blue, size L']);
      expect((await wallet(ada)).balance).toBe(100000 - 41000);
    });

    it("can't run again with none left; an unsold run doesn't touch stock", async () => {
      await Product.updateOne({ _id: product._id }, { $set: { stock: 0 } });
      await setStatus('ended');
      await expect(run('Last one')).rejects.toThrow('None left in stock');

      await Product.updateOne({ _id: product._id }, { $set: { stock: 1 } });
      await run(''); // unsold run ended with no bids: run it again
      await setStatus('ended');
      expect((await Product.findById(product._id).lean()).stock).toBe(1);
    });

    it('repairs an older paid ongoing run without charging it again', async () => {
      const ada = await createBuyer('Ada', 100000);
      await setStatus('active'); await win(ada, 20000, 0);
      expect((await order(ada, 20000, 0)).success).toBe(true);
      await setStatus('ongoing');
      await Stream.updateOne({ _id: stream._id }, { $unset: { 'products.0.run': 1 } });
      const next = await run('Blue');
      expect(next).toMatchObject({ bidStatus: 'pending', run: 2 });
      expect(await Order.countDocuments()).toBe(1);
      expect((await wallet(ada)).balance).toBe(80000);
    });
    it('repairs an older unsold ongoing run and keeps stock', async () => {
      await setStatus('ongoing');
      expect((await run('Red')).bidStatus).toBe('pending');
      expect((await Product.findById(product._id).lean()).stock).toBe(2);
    });
    it('never resets a pending settlement or clears a wallet hold', async () => {
      const ada = await createBuyer('Ada', 100000);
      await setStatus('active'); await win(ada, 20000, 0); await setStatus('ongoing');
      await expect(run('Red')).rejects.toThrow('Finishing the last sale');
      expect((await wallet(ada)).onHoldAmount).toBe(20000);
      expect((await streamProduct()).holdAmount).toBe(20000);
      expect(await Order.countDocuments()).toBe(0);
    });
    const endOnServer = async () => {
      const emit = jest.fn(); const io = { to: () => ({ emit }), in: () => ({ fetchSockets: async () => [] }) };
      const req = { params: { streamId: String(stream._id) }, body: { productId: String(product._id), sellerId: String(seller._id) }, user: { id: String(seller._id) }, app: { get: () => io } };
      const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
      await require('@/controllers/streamController').endProductBidding(req, res);
      return res;
    };
    it('the real end controller finishes a sold run and permits Run again', async () => {
      const ada = await createBuyer('Ada', 100000);
      await setStatus('active'); await win(ada, 20000, 0);
      const ended = await endOnServer();
      expect(ended.statusCode).toBe(200);
      expect(await streamProduct()).toMatchObject({ bidStatus: 'ended', holdAmount: 0, orderCreated: true });
      expect((await streamProduct()).product.quantity).toBe(1);
      expect((await run('Next colour')).run).toBe(2);
      expect((await wallet(ada)).balance).toBe(80000);
      expect(await Order.countDocuments()).toBe(1);
    });
    it('the real end controller finishes an unsold legacy run and permits Run again', async () => {
      await setStatus('active');
      await Stream.updateOne({ _id: stream._id }, { $unset: { 'products.0.run': 1 } });
      expect((await endOnServer()).statusCode).toBe(200);
      expect((await streamProduct()).bidStatus).toBe('ended');
      expect((await run('Try again')).run).toBe(2);
      expect((await Product.findById(product._id).lean()).stock).toBe(2);
    });

    it('checks the note and refuses while the item is being auctioned', async () => {
      await expect(run('x'.repeat(41))).rejects.toThrow('40 characters');
      await expect(run('call 08031234567')).rejects.toThrow('phone numbers');
      await setStatus('active');
      await expect(run('Red')).rejects.toThrow('being auctioned now');
    });
  });
  it('refuses an out-of-area winner without charging and frees the reservation', async () => {
    const b=await createBuyer('Ada',50000); await win(b);
    await Buyer.updateOne({_id:b._id}, {$set:{'shippingAddresses.0.state':'Abuja'}});
    expect(await order(b)).toMatchObject({success:false,reason:'out_of_area'});
    expect(await wallet(b)).toMatchObject({balance:50000,onHoldAmount:0});
    expect(await Order.countDocuments()).toBe(0);
  });

  it('settles a distinct colour lot against the shared catalogue stock, keeping its sibling untouched',async()=>{
    process.env.COLOURS='true';
    await Product.updateOne({_id:product._id},{$set:{stock:3,colourVariants:['Indigo','Rust'],colourQuantities:[{colour:'Indigo',quantity:2},{colour:'Rust',quantity:1}]}});
    const a=new mongoose.Types.ObjectId(),b=new mongoose.Types.ObjectId();
    await Stream.updateOne({_id:stream._id},{$set:{products:[{product:{productId:a,catalogueProductId:product._id,colour:'Indigo',name:'Gojo figure · Indigo'},minBid:5000,maxBid:100000,bidStatus:'active'},{product:{productId:b,catalogueProductId:product._id,colour:'Rust',name:'Gojo figure · Rust'},minBid:5000,maxBid:100000,bidStatus:'pending'}]}});
    const buyer=await createBuyer('LotBuyer',50000);
    expect(await bids.placeBid({streamId:stream._id,productId:String(a),buyer,bidAmount:20000,maxBid:100000})).toMatchObject({ok:true});
    expect(await createAuctionOrder({streamId:stream._id,productId:String(a),buyerId:buyer._id,bidAmount:20000})).toMatchObject({success:true});
    const saved=await Product.findById(product._id).lean();expect(saved.stock).toBe(2);expect(saved.colourQuantities.map(c=>c.quantity)).toEqual([1,1]);
    const show=await Stream.findById(stream._id).lean();expect(show.products[1].bidStatus).toBe('pending');expect(show.products[1].orderCreated).toBe(false);
    expect((await Order.findOne().lean()).items[0]).toMatchObject({colour:'Indigo'});
  });

  it('off settles a legacy colour product from total stock and keeps the exact title',async()=>{
    delete process.env.COLOURS;
    await Product.updateOne({_id:product._id},{$set:{stock:3,colourVariants:['Indigo'],colourQuantities:[{colour:'Indigo',quantity:0}]}});
    const buyer=await createBuyer('PlainWinner',50000);expect(await win(buyer)).toMatchObject({ok:true});expect(await order(buyer)).toMatchObject({success:true});
    const saved=await Product.findById(product._id).lean();expect(saved.stock).toBe(2);expect(saved.colourQuantities[0].quantity).toBe(0);
    const orders=await Order.find().lean();expect(orders).toHaveLength(1);expect(orders[0].items[0].colour).toBeUndefined();expect(orders[0].items[0].productName).toBe(saved.name);
    const show=await Stream.findById(stream._id).lean();expect(show.orders).toHaveLength(1);expect(show.products[0].product.quantity).toBe(2);
  });

  it('off preserves legacy lot identities while charging and settling plain total stock',async()=>{
    delete process.env.COLOURS;const lot=new mongoose.Types.ObjectId();
    await Product.updateOne({_id:product._id},{$set:{stock:3,name:'Adire Two-Piece – Indigo',colourQuantities:[{colour:'Blue',quantity:0}]}});
    await Stream.updateOne({_id:stream._id},{$set:{products:[{product:{productId:lot,catalogueProductId:product._id,name:'Old title · Blue',colour:'Blue',quantity:0},minBid:5000,maxBid:100000,bidStatus:'active'}]}});
    const buyer=await createBuyer('LegacyLot',50000);expect(await bids.placeBid({streamId:stream._id,productId:String(lot),buyer,bidAmount:20000,maxBid:100000})).toMatchObject({ok:true});
    expect(await createAuctionOrder({streamId:stream._id,productId:String(lot),buyerId:buyer._id,bidAmount:20000})).toMatchObject({success:true});
    const saved=await Product.findById(product._id).lean();expect(saved.stock).toBe(2);expect(saved.colourQuantities[0].quantity).toBe(0);
    const order=await Order.findOne().lean();expect(order.items[0].productName).toBe(saved.name);expect(order.items[0].colour).toBeUndefined();
    const show=await Stream.findById(stream._id).lean(),view=await require('@/services/plainProducts').productsForDisplay(show.products);
    expect(String(view[0].product.productId)).toBe(String(lot));expect(view[0].product.name).toBe(saved.name);expect(view[0].product.quantity).toBe(2);expect(view[0].product.colour).toBeUndefined();expect(show.products[0].product.colour).toBe('Blue');
  });

});

afterEach(()=>{delete process.env.COLOURS;});
