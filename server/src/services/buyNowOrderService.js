// Buy Now during a live show, paid from the buyer's wallet.
//
// In one transaction: check the show is live and the item is in it, charge
// price x quantity from the wallet's available balance (balance minus holds),
// take the stock, and create a paid order. If anything fails nothing is
// written, so a buyer is never charged for stock that ran out.

const mongoose = require('mongoose');
const { productIdMatch } = require('./streamBidService');
const { toDeliveryAddress, toPickupAddress } = require('./auctionOrderService');

const model = (name) => mongoose.model(name);
const MAX_QUANTITY = 10;

class BuyNowError extends Error {
  constructor(reason, message) {
    super(message);
    this.reason = reason;
  }
}

const createBuyNowOrder = async ({ streamId, productId, buyerId, quantity = 1, shippingFee = 0 }) => {
  const qty = Math.floor(Number(quantity));
  if (!(qty >= 1 && qty <= MAX_QUANTITY)) return { success: false, reason: 'bad_quantity', message: `Choose 1 to ${MAX_QUANTITY}` };
  const fee = Math.max(0, Number(shippingFee) || 0);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const stream = await model('Stream').findOne(
        { _id: streamId, status: 'live', 'products.product.productId': productIdMatch(productId) },
        { seller: 1, 'products.$': 1 },
        { session }
      ).lean();
      if (!stream) throw new BuyNowError('closed', 'This item is not on sale in this show right now');

      const product = await model('Product').findOne({ _id: productId, status: 'active' }, null, { session }).populate('seller');
      if (!product) throw new BuyNowError('closed', 'This item is no longer for sale');
      const unitPrice = product.salePrice > 0 && product.salePrice < product.price ? product.salePrice : product.price;
      const subtotal = unitPrice * qty;
      const total = subtotal + fee;

      // Take the stock first: the conditional write means the last item can only sell once
      const stocked = await model('Product').findOneAndUpdate(
        { _id: productId, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true, session }
      );
      if (!stocked) throw new BuyNowError('sold_out', qty > 1 ? 'Not enough left. Try a smaller quantity.' : 'Sold out');

      const reference = `buynow_${streamId}_${productId}_${buyerId}_${Date.now()}`;
      const charged = await model('Buyer').findOneAndUpdate(
        {
          _id: buyerId,
          $expr: { $gte: [{ $subtract: [{ $ifNull: ['$wallet.balance', 0] }, { $ifNull: ['$wallet.onHoldAmount', 0] }] }, total] },
        },
        {
          $inc: { 'wallet.balance': -total },
          $push: { 'wallet.transactions': { type: 'debit', amount: total, paymentReference: reference, description: `Buy Now: ${product.name}`, status: 'completed' } },
        },
        { new: true, session }
      );
      if (!charged) throw new BuyNowError('insufficient_funds', 'Not enough in your wallet. Top up to buy this.');
      if (!charged.shippingAddresses?.length) throw new BuyNowError('no_address', 'Add a delivery address first');

      const seller = product.seller || {};
      const [order] = await model('Order').create(
        [{
          buyer: charged._id,
          buyerDetails: {
            _id: charged._id,
            firstName: charged.firstName,
            lastName: charged.lastName,
            username: charged.username,
            profileImage: charged.profileImage?.url ? [{ url: charged.profileImage.url }] : [],
          },
          seller: seller._id || stream.seller,
          channel: 'liveshow',
          status: 'processing',
          items: [{
            product: product._id,
            productName: product.name,
            seller: seller._id || stream.seller,
            productImages: (product.images || []).slice(0, 1).map((i) => ({ url: i.url })),
            quantity: qty,
            price: unitPrice,
            status: 'pending',
          }],
          totalAmount: subtotal,
          delivery_address: toDeliveryAddress(charged),
          pickup_address: toPickupAddress(seller),
          shipping: { fee: { amount: fee, currency: 'NGN' } },
          paid: true,
          paymentInfo: { method: 'wallet', status: 'completed', paymentReference: reference, paidAt: new Date(), isWalletCredit: true, walletAmountUsed: total },
        }],
        { session }
      );

      const liveShowOrder = {
        orderId: order.order_id,
        buyer: charged._id, // the schema stores the buyer's id; details live in orderDetails
        product: product._id,
        amount: total, // required by the show's order list (bid or price x qty, plus delivery)
        orderDetails: { buyer: order.buyerDetails, _id: order._id, order_id: order.order_id, itemsCount: 1, totalAmount: subtotal, shippingFee: fee, orderTotal: total, seller: order.seller, items: order.items },
      };
      await model('Stream').updateOne({ _id: streamId }, { $push: { orders: liveShowOrder } }, { session });

      result = {
        success: true,
        order: { orderId: order.order_id, _id: order._id, quantity: qty, unitPrice, total },
        stockLeft: stocked.stock,
        productName: product.name,
        buyer: { username: charged.username, firstName: charged.firstName },
        walletBalance: charged.wallet.balance,
      };
    });
    return result;
  } catch (error) {
    if (error instanceof BuyNowError) return { success: false, reason: error.reason, message: error.message };
    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = { createBuyNowOrder, MAX_QUANTITY };
