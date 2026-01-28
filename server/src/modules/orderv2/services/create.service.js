// services/orderService.js
const orderRepository = require('../repositories/order.repository');
const { validateItems, validateAddress, formatAddressForTerminal, determinePickupAddress } = require('../helpers/order.helper');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Product = require('../../../models/Product');
const Seller = require('../../../models/Seller');
const mixpanel = require('../../../config/mixpanel');
const { agenda } = require('../../../config/agenda');


const createDraftOrders = async (req, session, sellerItems) => {
  const buyerId = req.user.id;
  const buyer = await orderRepository.findBuyerById(buyerId, session);

  const orders = [];

  // Create draft orders for each seller
  for (const sellerId in sellerItems) {
    const sellerData = sellerItems[sellerId];
    const seller = sellerData.seller;

    // Automatically flag orders from international sellers
    if (seller.isInternational) {
      sellerData.isInternational = true;
    }

    const orderId = `AUQLI-${uuidv4().substring(0, 8)}`;
    const { order } = await createDraftOrderForSeller(sellerData, buyer, orderId, req, session);
    orders.push({
      ...order.toObject(),
      isInternational: seller.isInternational
    });
  }

  return orders; // Return raw order documents
};

exports.createOrder = async (req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      items,
      shippingAddress,
      isStorePickup = false,
      senderInfo,
      channel,
      campaignId,
      streamId
    } = req.body;

    const buyerId = req.user.id;
    const buyer = await orderRepository.findBuyerById(buyerId, session);

    // Validate inputs
    const itemsValidation = validateItems(items);
    if (!itemsValidation.valid) {
      throw new Error(itemsValidation.message);
    }

    // Validate shipping address if not store pickup
    if (!isStorePickup) {
      const deliveryAddress = formatAddressForTerminal({ ...shippingAddress, country: 'NG' });
      const addressValidation = validateAddress(deliveryAddress);
      if (!addressValidation.valid) {
        throw new Error(addressValidation.message);
      }
    }

    // Fetch products and calculate total
    const productIds = items.map(item => item.productId);
    const products = await orderRepository.findProductsByIds(productIds, session);

    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p._id.toString());
      const missingIds = productIds.filter(id => !foundIds.includes(id.toString()));
      throw new Error(`Products not found: ${missingIds.join(', ')}`);
    }

    // Ensure all items are from the same seller
    if (products.length > 0) {
      const uniqueSellerIds = [...new Set(products.map((p) => p.seller._id.toString()))];
      if (uniqueSellerIds.length > 1) {
        throw new Error('All items in an order must belong to a single seller.');
      }
    }

    // Group items by seller (this now includes seller validation and fetching)
    const { sellerItems, totalAmount } = await groupItemsBySeller(items, products, buyerId, session, isStorePickup);

    const orders = await createDraftOrders(req, session, sellerItems);

    await session.commitTransaction();
    session.endSession();

    // Parallelize agenda job scheduling - significant performance improvement
    const jobPromises = [];
    for (const order of orders) {
      jobPromises.push(
        agenda.schedule('in 30 minutes', 'mark_terminal_orders_stale', { orderId: order._id.toString() })
      );

      // Schedule job to expire order if not paid in 30 minutes
      if (!order.isStorePickup && !order.isInternational) {
        jobPromises.push(
          agenda.schedule('in 30 minutes', 'expire-order', { orderId: order._id })
        );
      }
    }
    await Promise.all(jobPromises);

    // Combined data transformation loop - optimize by doing both operations in one pass
    const liveShowOrders = orders.map(order => {
      const firstItem = order.items[0];
      return {
        orderId: order.order_id,
        buyer: order.buyerDetails,
        orderDetails: {
          _id: order._id,
          order_id: order.order_id,
          itemsCount: order.items.length,
          totalAmount: order.totalAmount,
          shippingFee: sellerItems[order.seller.toString()].shippingFee,
          orderTotal: order.totalAmount + sellerItems[order.seller.toString()].shippingFee,
          seller: order.seller,
          items: order.items
        },
        product: firstItem.product,
        amount: order.totalAmount,
        createdAt: new Date()
      };
    });

    // Move livestream processing to background to not block response
    if (req.body.channel === "livestream" && req.body.streamId) {
      setImmediate(() => {
        processLiveStreamOrder(req.body.streamId, orders, liveShowOrders, sellerItems, buyer, req.app)
          .catch(err => console.error('Background livestream processing error:', err));
      });
    }

    // Return only the essential order data for the controller to process
    return {
      mainOrder: orders.map(o => ({
        orderId: o._id,
        order_id: o.order_id,
        seller: o.seller,
        totalAmount: o.totalAmount,
        status: o.status,
        isStorePickup: o.isStorePickup,
        isInternational: o.isInternational
      })),
      liveShowOrders: liveShowOrders
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    throw error;
  }
};

async function groupItemsBySeller(items, products, buyerId, session, isStorePickup) {
  const sellerItems = {};
  let totalAmount = 0;
  const uniqueSellerIds = new Set();

  const productMap = products.reduce((map, product) => {
    map[product._id.toString()] = product;
    return map;
  }, {});

  // Extract unique seller IDs first
  for (const item of items) {
    const product = productMap[item.productId];
    if (product) {
      uniqueSellerIds.add(product.seller._id.toString());
    }
  }

  // Batch fetch all sellers at once - eliminates N+1 query problem
  const Seller = require('../../../models/Seller');
  const sellers = await Seller.find({ _id: { $in: Array.from(uniqueSellerIds) } }).session(session);
  const sellerMap = sellers.reduce((map, seller) => {
    map[seller._id.toString()] = seller;
    return map;
  }, {});

  // Validate sellers early
  for (const [sellerId, seller] of Object.entries(sellerMap)) {
    if (isStorePickup && !seller.offersStorePickup) {
      throw new Error(`Seller ${seller.businessName} does not offer store pickup.`);
    }
  }

  // Group items by seller
  for (const item of items) {
    const product = productMap[item.productId];
    if (!product) continue;

    if (product.stock <= 0 || product.stock < item.quantity) {
      throw new Error('This product is out of stock');
    }

    const sellerId = product.seller._id.toString();
    const seller = sellerMap[sellerId];
    if (!seller) continue;

    if (!sellerItems[sellerId]) {
      sellerItems[sellerId] = initializeSellerData(seller, sellerId);
    }

    const itemTotal = item.price * item.quantity;
    totalAmount += itemTotal;
    updateSellerItems(sellerItems[sellerId], item, product, itemTotal);
  }

  // Optimize follower updates - use upsert to avoid read-before-write
  await updateSellerFollowersOptimized(uniqueSellerIds, buyerId, session);

  return { sellerItems, totalAmount };
}

function initializeSellerData(seller, sellerId) {
  return {
    items: [],
    seller,
    totalAmount: 0,
    senderInfo: null,
    batchId: `AUQLI-${sellerId.substring(0, 4)}-${uuidv4().substring(0, 8)}`,
    shippingFee: 0,
    totalWeight: 0,
    parcelItems: []
  };
}

function updateSellerItems(sellerData, item, product, itemTotal) {
  sellerData.totalAmount += itemTotal;
  const itemWeight = (item.weight || product.weight || 0.1) * item.quantity;
  sellerData.totalWeight += itemWeight;

  sellerData.parcelItems.push(createParcelItem(product, item, itemWeight));
  sellerData.items.push(createOrderItem(product, item, itemWeight));
}

function createParcelItem(product, item, itemWeight) {
  return {
    description: product.description?.substring(0, 100) || product.name,
    name: product.name,
    type: "parcel",
    currency: "NGN",
    value: item.price,
    quantity: item.quantity,
    weight: itemWeight / item.quantity,
    metadata: {
      productId: product._id.toString(),
      specifications: item.specifications || {}
    }
  };
}

function createOrderItem(product, item, itemWeight) {
  return {
    product: product._id,
    productImages: product.images,
    productName: product.name,
    seller: product.seller._id,
    quantity: item.quantity,
    price: item.price,
    weight: itemWeight,
    specifications: item.specifications || {},
    status: 'draft' // Ensure items in a draft order also have draft status
  };
}

// Optimized follower update using single upsert operation per seller
async function updateSellerFollowersOptimized(uniqueSellerIds, buyerId, session) {
  const Buyer = require('../../../models/Buyer');
  const Seller = require('../../../models/Seller');

  // Fetch buyer once for all operations
  const buyer = await Buyer.findById(buyerId).session(session);
  if (!buyer) return;

  const mainAddress = buyer.shippingAddresses && buyer.shippingAddresses.length > 0
    ? {
      country: buyer.shippingAddresses[0].country,
      city: buyer.shippingAddresses[0].city,
      address1: buyer.shippingAddresses[0].addressLine1,
      address2: buyer.shippingAddresses[0].addressLine2,
      zipCode: buyer.shippingAddresses[0].zipCode
    }
    : null;

  const updatePromises = [];

  for (const sellerId of uniqueSellerIds) {
    // Use upsert with conditional operators for optimal performance
    const updatePromise = Seller.findOneAndUpdate(
      {
        _id: sellerId,
        'followers.buyerId': { $ne: buyerId } // Only if not already a follower
      },
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
            totalOrders: 0,
            address: mainAddress
          }
        }
      },
      { session }
    ).catch(() => {
      // If push fails (follower exists), update existing follower
      return Seller.findOneAndUpdate(
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
    });

    updatePromises.push(updatePromise);

    // Update buyer activity feed if applicable
    if (buyer.activityFeed) {
      const activityPromise = Seller.findById(sellerId).session(session).then(seller => {
        if (seller && !buyer.activityFeed.some(a => a.reference?.toString() === sellerId)) {
          buyer.activityFeed.push({
            type: 'follow',
            content: `Started following ${seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`}`,
            reference: seller._id,
            referenceModel: 'Seller',
            createdAt: new Date()
          });
        }
      });
      updatePromises.push(activityPromise);
    }
  }

  await Promise.all(updatePromises);

  if (buyer.isModified()) {
    await buyer.save({ session });
  }
}

// Set this to true to enable free shipping promo, false to disable
const FREE_SHIPPING_PROMO = true;
async function createDraftOrderForSeller(sellerData, buyer, orderId, req, session) {
  const { items: sellerItemsList, seller, senderInfo } = sellerData;
  const sellerId = seller._id.toString();
  const sellerTotal = sellerItemsList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const fullSellerData = await orderRepository.findSellerById(sellerId, session);

  // An order is international if the seller is international
  const isInternational = seller.isInternational;
  console.log('Seller Details:', { sellerId: seller._id, isInternational: seller.isInternational });
  console.log(`Order isInternational flag set to: ${isInternational}`);


  // Skip terminal-related address formatting if international or store pickup
  const deliveryAddress = req.body.isStorePickup
    ? null
    : isInternational
      ? { ...req.body.shippingAddress }
      : formatAddressForTerminal({ ...req.body.shippingAddress, country: 'NG' });
  const pickupAddress = determinePickupAddress(fullSellerData, senderInfo || req.body.senderInfo || {});

  // Determine shipping fee
  let shippingFeeAmount = 0;
  let isFreeShipping = false;
  if (FREE_SHIPPING_PROMO) {
    shippingFeeAmount = 0;
    isFreeShipping = true;
  } else {
    // Use carrier amount from payload if available, else 0
    shippingFeeAmount = req.body.carrier && req.body.carrier.amount ? req.body.carrier.amount : 0;
    isFreeShipping = false;
  }

  const order = await orderRepository.createOrder({
    order_id: orderId,
    buyer: buyer._id,
    buyerDetails: getBuyerDetails(buyer),
    seller: sellerId,
    channel: req.body.channel || 'marketplace',
    status: 'draft',
    items: sellerItemsList,
    itemsTotal: sellerTotal,
    totalAmount: sellerTotal + shippingFeeAmount,
    isFreeShipping: isFreeShipping,
    isStorePickup: req.body.isStorePickup,
    isInternational,
    delivery_address: deliveryAddress,
    pickup_address: pickupAddress,
    shipping: {
      fee: { amount: shippingFeeAmount, currency: 'NGN' }
    },
    paid: false,
    paymentInfo: {
      status: 'pending'
    },
    statusHistory: [{ status: 'draft', note: 'Order created' }],
    notificationsSent: false
  }, session);

  return { order };
}

function getBuyerDetails(buyer) {
  return {
    _id: buyer._id,
    firstName: buyer.firstName,
    lastName: buyer.lastName,
    username: buyer.username,
    profileImage: buyer.profileImage
  };
}

// Background processing for livestream orders - moved out of critical path
async function processLiveStreamOrder(streamId, orders, liveShowOrders, sellerItems, buyer, app) {
  try {
    const Stream = mongoose.model('Stream');
    const stream = await Stream.findById(streamId);

    if (!stream) {
      console.warn('Stream not found for liveshow order:', streamId);
      return;
    }

    console.log('Processing liveshow order for stream:', {
      streamId: stream._id,
      title: stream.title
    });

    // Helper function to format product name to only 3 words
    function formatProductName(name) {
      if (!name) return 'an item';
      const words = name.split(' ');
      return words.slice(0, 3).join(' ') + (words.length > 3 ? '...' : '');
    }

    // Prepare notification object
    const notificationObj = {
      id: Date.now().toString(),
      type: 'liveshow_order',
      user: buyer.username || 'Anonymous User',
      avatar: buyer.profileImage?.url || '',
      content: `purchased ${formatProductName(orders[0]?.items[0]?.productName || 'an item')} 🎉🎉`,
      data: {
        message: `New order placed during the liveshow`,
        streamId: stream._id.toString(),
        sellerId: stream.seller._id.toString(),
        storeName: stream.seller.storeName || 'Unknown Store',
        orders: orders,
        streamOrders: stream.orders
      },
      timestamp: new Date()
    };

    // Combine both updates into a single database operation
    const ordersToAdd = liveShowOrders;
    await Stream.findByIdAndUpdate(
      streamId,
      {
        $push: {
          orders: { $each: ordersToAdd },
          chatInteractions: notificationObj
        }
      }
    );

    // Send WebSocket notification (non-blocking)
    if (app && app.get('io')) {
      const io = app.get('io');
      const streamRoom = `stream_notifications_${stream._id.toString()}`;
      io.to(streamRoom).emit('stream_notification', notificationObj);
      console.log('Broadcasting liveshow order notification to subscribers');
    } else {
      console.warn('Could not send socket notification - io not available');
    }

    // Track live show order event on mixpanel (non-blocking)
    setImmediate(() => {
      mixpanel.track('live_show_order', {
        streamId: stream._id,
        buyerId: buyer.id,
        productId: orders[0].items[0].product,
        productName: orders[0].items[0].productName,
        buyerName: buyer.firstName + " " + buyer.lastName,
        buyerUsername: buyer.username,
        orderId: orders[0].order_id,
        orderTotal: orders[0].totalAmount,
        orderDate: orders[0].createdAt,
      });
    });

  } catch (streamError) {
    console.error('Error updating stream with order information:', streamError);
  }
}
