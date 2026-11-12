// Turns a won auction into a paid order.
//
// The winner's bid plus delivery fee is already reserved in their wallet (see
// streamBidService). Here, in one transaction, we:
//   1. claim the hold on the stream product (so a win can only be charged once),
//   2. convert that hold into a debit of bid + delivery,
//   3. take one unit of stock,
//   4. create the order, paid from the wallet.
// If any step fails the transaction rolls back and the hold is released, so the
// buyer's money is never left reserved for an order that does not exist.

const mongoose = require('mongoose');
const { releaseProductHold, productIdMatch } = require('./streamBidService');
const deliveries = require('./deliveryService');

const model = (name) => mongoose.model(name);

class AuctionOrderError extends Error {
  constructor(reason, message) {
    super(message);
    this.reason = reason;
  }
}

const toDeliveryAddress = (buyer) => {
  const a = (buyer.shippingAddresses || [])[0];
  if (!a) return null;
  return {
    first_name: a.firstName || buyer.firstName,
    last_name: a.lastName || buyer.lastName,
    email: a.email || buyer.email,
    phone: a.phoneNumber || buyer.phoneNumber,
    line1: a.addressLine1,
    line2: a.addressLine2,
    city: a.city,
    ...(a.lga ? {lga:a.lga} : {}),
    ...(Number.isFinite(a.latitude)&&Number.isFinite(a.longitude)?{latitude:a.latitude,longitude:a.longitude}:{}),
    state: a.state,
    country: a.country || 'NG',
    zip: a.zipCode || a.postalCode || a.zip,
  };
};

const toPickupAddress = (seller) => {
  const a = require('./serviceArea').pickupAddress(seller);
  return {
    first_name: seller.firstName,
    last_name: seller.lastName,
    email: seller.businessEmail || seller.email,
    phone: seller.phoneNumber,
    line1: a.addressLine1,
    city: a.city,
    ...(a.lga ? {lga:a.lga} : {}),
    ...(Number.isFinite(a.latitude)&&Number.isFinite(a.longitude)?{latitude:a.latitude,longitude:a.longitude}:{}),
    state: a.state,
    country: a.country || 'NG',
  };
};

const createAuctionOrder = async ({ streamId, productId, buyerId, bidAmount, shippingFee = 0 }) => {
  try { await require('./serviceArea').checkPurchase(streamId, buyerId); }
  catch (e) { if (e.code === 'out_of_area') { await releaseProductHold(streamId, productId).catch(() => {}); return { success: false, reason: e.code, message: e.message, state: e.state }; } throw e; }

  const fee = Math.max(0, Number(shippingFee) || 0);
  const bid = Number(bidAmount);
  const total = bid + fee;
  // First item in this show for the winner: hold the Shipbubble-quoted
  // delivery deposit (their bid already reserved room for it). If it can't be
  // priced now, nothing is held and the after-show quote covers delivery.
  const deposit = await deliveries.depositFor(streamId, buyerId, productId).catch(() => 0);
  const session = await mongoose.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      // 1. Claim the winner's hold and mark the product as ordered, once.
      const before = await model('Stream').findOneAndUpdate(
        {
          _id: streamId,
          products: {
            $elemMatch: {
              'product.productId': productIdMatch(productId),
              holdBuyer: buyerId,
              orderCreated: { $ne: true },
            },
          },
        },
        {
          $set: { 'products.$.holdAmount': 0, 'products.$.orderCreated': true },
          $unset: { 'products.$.holdBuyer': 1 },
        },
        { new: false, projection: { 'products.$': 1, seller: 1 }, session }
      ).lean();
      const streamProduct = before && before.products && before.products[0];
      if (!streamProduct) throw new AuctionOrderError('no_hold', 'This win has already been charged or has no wallet hold');
      const held = streamProduct.holdAmount || 0;

      // 2. Release the hold and charge bid + delivery in one conditional write.
      // Each run of an item is its own charge (run 1 keeps the original reference).
      const run = Number(streamProduct.run) || 1;
      const runNote = streamProduct.runNote || undefined;
      const reference = `auction_${streamId}_${productId}${run > 1 ? `_r${run}` : ''}`;
      const charged = await model('Buyer').findOneAndUpdate(
        {
          _id: buyerId,
          'wallet.onHoldAmount': { $gte: held },
          $expr: {
            $gte: [
              { $add: [{ $subtract: [{ $ifNull: ['$wallet.balance', 0] }, { $ifNull: ['$wallet.onHoldAmount', 0] }] }, held] },
              total,
            ],
          },
          'wallet.transactions.paymentReference': { $ne: reference },
        },
        {
          $inc: { 'wallet.balance': -total, 'wallet.onHoldAmount': -held },
          $push: {
            'wallet.transactions': {
              type: 'debit',
              amount: total,
              paymentReference: reference,
              description: `Auction win: ${streamProduct.product?.name || 'item'}`,
              status: 'completed',
            },
          },
        },
        { new: true, session }
      );
      if (!charged) throw new AuctionOrderError('insufficient_funds', 'Wallet balance no longer covers the winning bid');

      // 3. Take one unit of stock.
      const product = await model('Product').findOneAndUpdate(
        { _id: productId, stock: { $gte: 1 } },
        { $inc: { stock: -1 } },
        { new: true, session }
      ).populate('seller');
      if (!product) throw new AuctionOrderError('sold_out', 'This item is out of stock');

      // 4. Create the paid order.
      // Product autopopulation omits some pickup fields; read the seller in this transaction.
      const seller = await model('Seller').findById(product.seller?._id || product.seller).session(session).lean() || {};
      require('./serviceArea').checkAddresses(charged, seller);
      const [order] = await model('Order').create(
        [
          {
            buyer: charged._id,
            buyerDetails: {
              _id: charged._id,
              firstName: charged.firstName,
              lastName: charged.lastName,
              username: charged.username,
              profileImage: charged.profileImage?.url ? [{ url: charged.profileImage.url }] : [],
            },
            seller: seller._id || before.seller,
            channel: 'auction',
            status: 'processing',
            items: [
              {
                product: product._id,
                productName: product.name,
                seller: seller._id || before.seller,
                productImages: (product.images || []).slice(0, 1).map((i) => ({ url: i.url })),
                quantity: 1,
                price: bid,
                ...(runNote ? { note: runNote } : {}),
                status: 'pending',
              },
            ],
            totalAmount: bid,
            delivery_address: toDeliveryAddress(charged),
            pickup_address: toPickupAddress(seller),
            shipping: { fee: { amount: fee, currency: 'NGN' } },
            paid: true,
            paymentInfo: {
              method: 'wallet',
              status: 'completed',
              paymentReference: reference,
              paidAt: new Date(),
              isWalletCredit: true,
              walletAmountUsed: total,
            },
          },
        ],
        { session }
      );

      const liveShowOrder = {
        orderId: order.order_id,
        buyer: charged._id, // the schema stores the buyer's id; details live in orderDetails
        product: product._id,
        amount: total, // required by the show's order list (bid or price x qty, plus delivery)
        orderDetails: {
          buyer: order.buyerDetails,
          _id: order._id,
          order_id: order.order_id,
          itemsCount: 1,
          totalAmount: bid,
          shippingFee: fee,
          orderTotal: total,
          seller: order.seller,
          items: order.items,
        },
      };

      await model('Stream').updateOne(
        { _id: streamId, 'products.product.productId': productIdMatch(productId) },
        // The show's copy of the stock follows the product, for "2 of 4 left"
        { $set: { 'products.$.orderId': order.order_id, 'products.$.product.quantity': product.stock }, $push: { orders: liveShowOrder } },
        { session }
      );

      // Ships with the buyer's other items from this show (deposit held on the first)
      await deliveries.attachOrder({ session, streamId, buyerId: charged._id, sellerId: seller._id || before.seller, order, product, quantity: 1, unitPrice: bid, note: runNote, deposit });

      result = {
        success: true,
        order,
        orders: [{ orderId: order.order_id, _id: order._id, createdAt: order.createdAt, totalAmount: bid, shippingFee: fee }],
        liveShowOrders: [liveShowOrder],
        totals: { subtotal: bid, shippingFee: fee, grandTotal: total },
      };
    });
    return result;
  } catch (error) {
    // Nothing was written; free the reservation so the buyer can use it.
    await releaseProductHold(streamId, productId).catch(() => {});
    return { success: false, reason: error.reason || 'error', message: error.message };
  } finally {
    await session.endSession();
  }
};

module.exports = { createAuctionOrder, toDeliveryAddress, toPickupAddress };
