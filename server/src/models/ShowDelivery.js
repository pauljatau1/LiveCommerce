// One delivery per buyer per show: every item a buyer wins or buys in a show
// ships together in one package.
//
// collecting        show is live; items are being added, deposit held
// quote_failed      couldn't get a Shipbubble quote yet (retryable)
// needs_fix         waiting for a phone/address edit; no timed courier retry
// awaiting_payment  quoted, but the wallet couldn't cover it; buyer pays later
// paid              delivery paid; seller can book the pickup
// booked            courier booked with Shipbubble
// in_transit        picked up / on the way
// delivered         delivered
// cancelled         cancelled (deposit or payment refunded to the wallet)

const mongoose = require('mongoose');

const showDeliverySchema = new mongoose.Schema({
  stream: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  items: [{
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    category: String,
    quantity: Number,
    unitPrice: Number,
    weightKg: Number,
    image: String,
    note: String, // the seller's run note ("Red, size M")
  }],
  status: {
    type: String,
    enum: ['collecting', 'quote_failed', 'needs_fix', 'awaiting_payment', 'paid', 'booked', 'in_transit', 'delivered', 'cancelled'],
    default: 'collecting',
  },
  depositHeld: { type: Number, default: 0 }, // currently held in the buyer's wallet
  fee: { type: Number, default: 0 }, // delivery price charged to the buyer
  paidAt: Date,
  quote: {
    requestToken: String,
    courierId: String,
    courierName: String,
    serviceCode: String,
    amount: Number, // shown to the buyer (rate_card_amount)
    cost: Number, // charged to the platform's Shipbubble wallet (total)
    pickupEta: String,
    deliveryEta: String,
    fetchedAt: Date,
  },
  lastError: String,
  fix: {party:String,key:String,kind:String,message:String,notificationId:mongoose.Schema.Types.ObjectId},
  shipbubble: {
    orderId: String,
    trackingUrl: String,
    trackingCode: String,
    status: String,
    courierName: String,
    bookedAt: Date,
    updatedAt: Date,
  },
}, { timestamps: true });

showDeliverySchema.index({ stream: 1, buyer: 1, seller: 1 }, { unique: true });
showDeliverySchema.index({ seller: 1, status: 1 });
showDeliverySchema.index({ buyer: 1, createdAt: -1 });
showDeliverySchema.index({ 'shipbubble.orderId': 1 }, { sparse: true });

module.exports = mongoose.models.ShowDelivery || mongoose.model('ShowDelivery', showDeliverySchema);
