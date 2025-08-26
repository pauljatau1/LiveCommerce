// repositories/order.repository.js
const Order = require('../models/order.model');
const Product = require('../../../models/Product');
const Buyer = require('../../../models/Buyer');
const Seller = require('../../../models/Seller');

exports.findProductsByIds = async (productIds, session) => {
  return await Product.find({ _id: { $in: productIds } }).populate('seller').session(session);
};

exports.findBuyerById = async (buyerId, session) => {
  if (session) {
    return await Buyer.findById(buyerId).session(session);
  }
  return await Buyer.findById(buyerId);
};

exports.findSellerById = async (sellerId, session) => {
  return await Seller.findById(sellerId).session(session);
};

exports.createOrder = async (orderData, session) => {
  const order = new Order(orderData);
  await order.save({ session });
  return order;
};

exports.updateWalletBalance = async (buyerId, amount, session) => {
  const walletTransaction = {
    type: 'debit',
    amount,
    description: `Payment for order(s)`,
    status: 'completed'
  };

  await Buyer.findByIdAndUpdate(
    buyerId,
    {
      $inc: { 'wallet.balance': -amount },
      $push: { 'wallet.transactions': walletTransaction }
    },
    { session }
  );
};

exports.addFollower = async (sellerId, buyerId, session) => {
  const buyer = await Buyer.findById(buyerId).session(session);
  const mainAddress = getMainAddress(buyer);

  await Seller.findByIdAndUpdate(
    sellerId,
    {
      $push: {
        followers: {
          buyerId,
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          username: buyer.username,
          profileImage: buyer.profileImage,
          email: buyer.email,
          followDate: new Date(),
          lastInteraction: new Date(),
          address: mainAddress
        }
      }
    },
    { session }
  );

  if (buyer.activityFeed) {
    const seller = await Seller.findById(sellerId).session(session);
    buyer.activityFeed.push({
      type: 'follow',
      content: `Started following ${seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`}`,
      reference: seller._id,
      referenceModel: 'Seller',
      createdAt: new Date()
    });

    await buyer.save({ session });
  }
};

exports.updateFollower = async (sellerId, buyerId, session) => {
  const buyer = await Buyer.findById(buyerId).session(session);
  const mainAddress = getMainAddress(buyer);

  await Seller.findOneAndUpdate(
    {
      _id: sellerId,
      'followers.buyerId': buyerId
    },
    {
      $inc: { 'followers.$.totalOrders': 1 },
      $set: {
        'followers.$.lastInteraction': new Date(),
        'followers.$.address': mainAddress
      }
    },
    { session }
  );
};

function getMainAddress(buyer) {
  if (buyer.shippingAddresses && buyer.shippingAddresses.length > 0) {
    const address = buyer.shippingAddresses[0];
    return {
      country: address.country,
      city: address.city,
      address1: address.addressLine1,
      address2: address.addressLine2,
      zipCode: address.zipCode
    };
  }
  return null;
}

exports.findOrderById = async (orderId, session) => {
  if (session) {
    return await Order.findById(orderId)
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName storeName')
      .session(session);
  }
  return await Order.findById(orderId)
    .populate('buyer', 'email firstName lastName')
    .populate('seller', 'email firstName lastName businessName storeName');
};

exports.findUnpaidOrders = async (searchCriteria) => {
  return await Order.find(searchCriteria).populate('seller', 'email firstName lastName businessName storeName');
};