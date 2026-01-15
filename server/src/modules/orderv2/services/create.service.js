// services/orderService.js
const orderRepository = require('../repositories/order.repository');
const { validateItems, validateAddress, formatAddressForTerminal, determinePickupAddress } = require('../helpers/order.helper');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Product = require('../../../models/Product');
const Seller = require('../../../models/Seller');
const mixpanel = require('../../../config/mixpanel');
const { agenda } = require('../../../config/agenda');


const createDraftOrders = async (req, session) => {
  const {
    items,
    shippingAddress,
    isStorePickup = false,
  } = req.body;

  const buyerId = req.user.id;
  const buyer = await orderRepository.findBuyerById(buyerId, session);

  // ... (rest of the logic from createOrder)

  const productIds = items.map(item => item.productId);
  const products = await orderRepository.findProductsByIds(productIds, session);

  // ... (validation logic)
  if (products.length !== productIds.length) {
    throw new Error('One or more products not found');
  }

  if (products.length > 0) {
    const uniqueSellerIds = [...new Set(products.map((p) => p.seller._id.toString()))];
    if (uniqueSellerIds.length > 1) {
      throw new Error('All items in an order must belong to a single seller.');
    }
  }

  const { sellerItems } = await groupItemsBySeller(items, products, buyerId, session);

  const orders = [];
  for (const sellerId in sellerItems) {
    const sellerData = sellerItems[sellerId];
    const seller = sellerData.seller;

    // VALIDATION 1: Check if store pickup is requested for a seller who doesn't offer it
    if (isStorePickup && !seller.offersStorePickup) {
      throw new Error(`Seller ${seller.businessName} does not offer store pickup.`);
    }

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
      throw new Error('One or more products not found');
    }

    // Ensure all items are from the same seller
    if (products.length > 0) {
      const uniqueSellerIds = [...new Set(products.map((p) => p.seller._id.toString()))];
      if (uniqueSellerIds.length > 1) {
        throw new Error('All items in an order must belong to a single seller.');
      }
    }

    // Group items by seller
    const { sellerItems, totalAmount } = await groupItemsBySeller(items, products, buyerId, session);

    const orders = await createDraftOrders(req, session);

    for (const order of orders) {
      const sellerId = order.seller;
      const seller = await orderRepository.findSellerById(sellerId, session);
      if (!seller) continue;

      // VALIDATION 1: Check if store pickup is requested for a seller who doesn't offer it
      if (isStorePickup && !seller.offersStorePickup) {
        throw new Error(`Seller ${seller.businessName} does not offer store pickup.`);
      }

      // Automatically flag orders from international sellers
      if (seller.isInternational) {
        order.isInternational = true;
      }
    }

    await session.commitTransaction();

    // Schedule job to mark orders as stale if not processed
    for (const order of orders) {
      await agenda.schedule('in 30 minutes', 'mark_terminal_orders_stale', { orderId: order._id.toString() });

      // Schedule job to expire order if not paid in 30 minutes
      // This should only apply to non-pickup and non-international orders that require rate selection
      if (!order.isStorePickup && !order.isInternational) {
        console.log(`Scheduling expiration for order ${order.order_id}`);
        await agenda.schedule('in 30 minutes', 'expire-order', { orderId: order._id });
      }
    }

    const liveShowOrders = [];

    for (const order of orders) {
      const firstItem = order.items[0];

      liveShowOrders.push({
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
      });
    }

    // Check if the order is from a liveshow and update the stream with order information
    if (req.body.channel === "livestream" && req.body.streamId) {
      try {
        const Stream = mongoose.model('Stream');
        const stream = await Stream.findById(req.body.streamId);

        if (stream) {
          console.log('Processing liveshow order for stream:', {
            streamId: stream._id,
            title: stream.title
          });

          // For each order, create an entry in the stream's orders array
          for (const order of orders) {
            // Get the first product from the order for simplicity
            const firstItem = order.items[0];

            // Add to the stream's orders array
            stream.orders.push({
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
            });
          }

          // Save the stream with updated orders
          await stream.save();


          // Send a socket notification about the order for the stream
          if (req.app && req.app.get('io')) {
            const io = req.app.get('io');

            // Helper function to format product name to only 3 words
            function formatProductName(name) {
              if (!name) return 'an item';
              const words = name.split(' ');
              return words.slice(0, 3).join(' ') + (words.length > 3 ? '...' : '');
            }

            // Create notification object for WebSocket
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



            // Send WebSocket notification
            console.log('Broadcasting liveshow order notification to subscribers');
            const streamRoom = `stream_notifications_${stream._id.toString()}`;
            io.to(streamRoom).emit('stream_notification', notificationObj);

            // Add the notification to stream chat interactions
            stream.chatInteractions.push(notificationObj);
            await stream.save();
          } else {
            console.warn('Could not send socket notification - io not available');
          }

          // track live show order event on mixpanel
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

        } else {
          console.warn('Stream not found for liveshow order:', req.body.streamId);
        }
      } catch (streamError) {
        console.error('Error updating stream with order information:', streamError);
        // Continue with the response even if stream update fails
      }
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

async function groupItemsBySeller(items, products, buyerId, session) {
  const sellerItems = {};
  let totalAmount = 0;
  const uniqueSellers = new Set();

  const productMap = products.reduce((map, product) => {
    map[product._id.toString()] = product;
    return map;
  }, {});

  for (const item of items) {
    const product = productMap[item.productId];
    if (!product) continue;

    const sellerId = product.seller._id.toString();
    uniqueSellers.add(sellerId);

    if (!sellerItems[sellerId]) {
      const seller = await orderRepository.findSellerById(sellerId, session);
      if (!seller) continue; // Skip if seller not found
      sellerItems[sellerId] = initializeSellerData(seller, sellerId);
    }

    const itemTotal = item.price * item.quantity;
    totalAmount += itemTotal;
    updateSellerItems(sellerItems[sellerId], item, product, itemTotal);
  }

  await updateSellerFollowers(uniqueSellers, buyerId, session);

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

async function updateSellerFollowers(uniqueSellers, buyerId, session) {
  for (const sellerId of uniqueSellers) {
    const seller = await orderRepository.findSellerById(sellerId, session);
    if (!seller) continue;

    const isFollower = seller.followers?.some(follower => follower.buyerId?.toString() === buyerId);

    if (!isFollower) {
      await orderRepository.addFollower(sellerId, buyerId, session);
    } else {
      await orderRepository.updateFollower(sellerId, buyerId, session);
    }
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
