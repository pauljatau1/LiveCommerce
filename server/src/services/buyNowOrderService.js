// Buy Now during a live show, paid from the buyer's wallet.
//
// In one transaction: check the show is live and the item is in it, charge
// price x quantity from the wallet's available balance (balance minus holds),
// take the stock, and create a paid order. If anything fails nothing is
// written, so a buyer is never charged for stock that ran out.

const mongoose = require('mongoose');
const { productIdMatch } = require('./streamBidService');
const { toDeliveryAddress, toPickupAddress } = require('./auctionOrderService');
const deliveries = require('./deliveryService');

const model = (name) => mongoose.model(name);
const MAX_QUANTITY = 10;

class BuyNowError extends Error {
  constructor(reason, message, needed) {
    super(message);
    this.reason = reason;
    this.needed = needed;
  }
}

const createBuyNowOrder = async ({ streamId, productId, buyerId, quantity = 1, shippingFee = 0, expectedAmount, expectedRun, colour }) => {
  try { await require('./serviceArea').checkPurchase(streamId, buyerId); }
  catch (e) { if (e.code === 'out_of_area') return { success: false, reason: e.code, message: e.message, state: e.state }; throw e; }

  const qty = Math.floor(Number(quantity));
  if (!(qty >= 1 && qty <= MAX_QUANTITY)) return { success: false, reason: 'bad_quantity', message: `Choose 1 to ${MAX_QUANTITY}` };
  const fee = Math.max(0, Number(shippingFee) || 0);
  // The first purchase in a show holds a delivery deposit: a real Shipbubble
  // quote to the buyer's saved address. Priced before the transaction starts.
  let deposit = 0;
  try {
    deposit = await deliveries.depositFor(streamId, buyerId, productId);
  } catch (error) {
    if (error.code === 'out_of_area') return { success: false, reason: error.code, message: error.message, state: error.state };
    if (error instanceof deliveries.DeliveryError) {
      return { success: false, reason: ['courier_name','courier_phone'].includes(error.code) || /add your delivery address|phone number for the courier/i.test(error.message) ? 'no_address' : 'delivery', message: error.message };
    }
    throw error;
  }
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

      const lot=stream.products[0];
      const selectedColour=require('../config/colours').coloursEnabled()?(colour || lot.product?.colour):undefined;
      const product = await model('Product').findOne({ _id: require('./colourLots').catalogueId(lot), status: 'active' }, null, { session }).populate('seller');
      if (!product) throw new BuyNowError('closed', 'This item is no longer for sale');
      const unitPrice = product.salePrice > 0 && product.salePrice < product.price ? product.salePrice : product.price;
      const subtotal = unitPrice * qty;
      const total = subtotal + fee;
      // Resumed top-ups carry the original offer into this transaction.
      // Legacy callers keep their existing purchase behavior.
      if (expectedAmount !== undefined) {
        const shown = stream.products[0];
        if (!Number.isFinite(expectedAmount) || expectedAmount !== subtotal || !shown.isVisible || shown.minBid > 0 ||
            shown.bidStatus === 'ended' || Number(shown.run || 1) !== Number(expectedRun)) {
          throw new BuyNowError('changed', 'This item changed. Check the price and choose it again.');
        }
      }

      // Take the stock first: the conditional write means the last item can only sell once
      let write;try{write=require('./colourLots').stockWrite(product,selectedColour,qty);}catch(e){throw new BuyNowError(e.reason || 'choose_colour',e.message);}
      const stocked = await model('Product').findOneAndUpdate(write.filter,write.update,{new:true,session,...write.options});
      if (!stocked) throw new BuyNowError('sold_out', qty > 1 ? 'Not enough left. Try a smaller quantity.' : 'Sold out');
      await model('Stream').updateOne({_id:streamId,'products.product.productId':productIdMatch(productId)},{$set:{'products.$.product.quantity':require('../config/colours').coloursEnabled()&&lot.product?.colour?require('./productColours').colourRows(stocked).find(c=>c.colour===lot.product.colour)?.quantity || 0:stocked.stock,...(require('../config/colours').coloursEnabled()?{'products.$.product.colourQuantities':require('./productColours').colourRows(stocked)}:{})}},{session});

      const reference = `buynow_${streamId}_${productId}_${buyerId}_${Date.now()}`;
      const charged = await model('Buyer').findOneAndUpdate(
        {
          _id: buyerId,
          $expr: { $gte: [{ $subtract: [{ $ifNull: ['$wallet.balance', 0] }, { $ifNull: ['$wallet.onHoldAmount', 0] }] }, total + deposit] },
        },
        {
          $inc: { 'wallet.balance': -total },
          $push: { 'wallet.transactions': { type: 'debit', amount: total, paymentReference: reference, description: `Buy Now: ${product.name}`, status: 'completed' } },
        },
        { new: true, session }
      );
      if (!charged) throw new BuyNowError('insufficient_funds', deposit ? `Not enough in your wallet. You need ₦${(total + deposit).toLocaleString('en-NG')}, including a ₦${deposit.toLocaleString('en-NG')} delivery deposit for this show.` : 'Not enough in your wallet. Top up to buy this.', total + deposit);
      if (!charged.shippingAddresses?.length) throw new BuyNowError('no_address', 'Add a delivery address first');

      // Product autopopulation omits some pickup fields; read the seller in this transaction.
      const seller = await model('Seller').findById(product.seller?._id || product.seller).session(session).lean() || {};
      require('./serviceArea').checkAddresses(charged, seller);
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
            productName: require('./colourLots').label(product.name,selectedColour),
            colour:selectedColour,
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
        ...(lot.product?.catalogueProductId?{lotId:productId}:{}),
        orderId: order.order_id,
        buyer: charged._id, // the schema stores the buyer's id; details live in orderDetails
        product: product._id,
        amount: total, // required by the show's order list (bid or price x qty, plus delivery)
        orderDetails: { buyer: order.buyerDetails, _id: order._id, order_id: order.order_id, itemsCount: 1, totalAmount: subtotal, shippingFee: fee, orderTotal: total, seller: order.seller, items: order.items },
      };
      await model('Stream').updateOne({ _id: streamId }, { $push: { orders: liveShowOrder } }, { session });
      const delivery = await deliveries.attachOrder({ session, streamId, buyerId: charged._id, sellerId: seller._id || stream.seller, order, product, quantity: qty, unitPrice, deposit });

      result = {
        success: true,
        order: { orderId: order.order_id, _id: order._id, quantity: qty, unitPrice, total },
        stockLeft:selectedColour?require('./productColours').colourRows(stocked).find(c=>c.colour===selectedColour)?.quantity || 0:stocked.stock,
        colourQuantities:require('./productColours').colourRows(stocked),
        productName: require('./colourLots').label(product.name,selectedColour),
        colour:selectedColour,
        buyer: { username: charged.username, firstName: charged.firstName },
        walletBalance: charged.wallet.balance,
        delivery: { _id: delivery._id, depositHeld: delivery.depositHeld, firstItem: delivery.items.length === 1 },
      };
    });
    return result;
  } catch (error) {
    if (error.code === 'out_of_area') return { success: false, reason: error.code, message: error.message, state: error.state };
    if (error instanceof BuyNowError) return { success: false, reason: error.reason, message: error.message, ...(error.needed ? { needed: error.needed } : {}) };
    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = { createBuyNowOrder, MAX_QUANTITY };
