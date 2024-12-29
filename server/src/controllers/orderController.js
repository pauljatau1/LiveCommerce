const Order = require('../models/Order');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const Notification = require('../models/Notification');
const Buyer = require('../models/Buyer');
const axios = require('axios'); // For Paystack API calls
const sgMail = require('@sendgrid/mail');
const terminalAPI = axios.create({
  baseURL: 'https://sandbox.terminal.africa/v1',
  headers: {
    Authorization: `Bearer ${process.env.TERMINAL_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const mongoose = require('mongoose');
const WebhookService = require('../services/WebhookService');

// Initialize Paystack
const paystackSecretKey = "sk_test_REDACTED";
const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${paystackSecretKey}`,
    'Content-Type': 'application/json'
  }
});

// Helper function to validate address format
const validateAddress = (address) => {
  const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'line1', 'city', 'state', 'country', 'zip'];
  const missingFields = requiredFields.filter(field => !address[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required address fields: ${missingFields.join(', ')}`);
  }
  return true;
};

// Helper function to validate parcel data
const validateParcel = (parcel) => {
  const requiredFields = ['weight', 'width', 'height', 'length'];
  const missingFields = requiredFields.filter(field => !parcel[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required parcel fields: ${missingFields.join(', ')}`);
  }

  // Validate weight is a positive number
  if (parcel.weight <= 0) {
    throw new Error('Parcel weight must be greater than 0');
  }

  return true;
};

// Helper function to validate item data
const validateItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Items must be a non-empty array');
  }

  items.forEach((item, index) => {
    if (!item.weight || item.weight <= 0) {
      throw new Error(`Invalid weight for item at index ${index}`);
    }
  });

  return true;
};

// create an order
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      items,
      delivery_address,
      pickup_address,
      parcel,
      paymentMethod
    } = req.body;

    // Validate addresses and parcel before proceeding
    validateAddress(pickup_address);
    validateAddress(delivery_address);
    validateParcel(parcel);
    validateItems(items);

    try {
      const shippingData = {
        pickup_address: {
          first_name: pickup_address.first_name,
          last_name: pickup_address.last_name,
          email: pickup_address.email,
          phone: pickup_address.phone,
          line1: pickup_address.line1,
          line2: pickup_address.line2 || '',
          city: pickup_address.city,
          state: pickup_address.state,
          country: pickup_address.country,
          zip: pickup_address.zip
        },
        delivery_address: {
          first_name: delivery_address.first_name,
          last_name: delivery_address.last_name,
          email: delivery_address.email,
          phone: delivery_address.phone,
          line1: delivery_address.line1,
          line2: delivery_address.line2 || '',
          city: delivery_address.city,
          state: delivery_address.state,
          country: delivery_address.country,
          zip: delivery_address.zip
        },
        parcel: {
          weight: parcel.weight,
          width: parcel.width,
          height: parcel.height,
          length: parcel.length,
          weight_unit: 'kg',
          description: "Auqli Order Items",
          items: items.map(item => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            weight: item.weight,
            weight_unit: 'kg',
            value: item.price,
            currency: 'NGN'
          }))
        },
        shipment_purpose: "commercial",
        metadata: {
          order_type: "auqli_order",
          description: "Auqli Marketplace Order"
        }
      };

      const shipmentResponse = await terminalAPI.post('/shipments/quick', shippingData);

      if (!shipmentResponse.data.status) {
        throw new Error(shipmentResponse.data.message || 'Failed to create shipment');
      }

      // Group items by seller and create orders
      const itemsBySeller = {};
      for (const item of items) {
        const product = await Product.findById(item.productId)
          .populate('seller', 'warehouseAddress');

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const sellerId = product.seller._id.toString();
        if (!itemsBySeller[sellerId]) {
          itemsBySeller[sellerId] = {
            items: [],
            seller: sellerId
          };
        }
        itemsBySeller[sellerId].items.push({
          product: item.productId,
          seller: sellerId,
          quantity: item.quantity,
          price: product.price
        });
      }

      // Create orders for each seller
      const orderPromises = Object.entries(itemsBySeller).map(([sellerId, sellerData]) => {
        const orderData = {
          buyer: req.user.id,
          seller: sellerId,
          items: sellerData.items,
          delivery_address: delivery_address,
          pickup_address: pickup_address,
          shipping: {
            method: shipmentResponse.data.data.carrier?.name || 'standard',
            fee: shipmentResponse.data.data.amount,
            estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            tracking: {
              number: shipmentResponse.data.data.tracking_number,
              carrier: shipmentResponse.data.data.carrier?.name,
              status: 'pending'
            },
            shipment_id: shipmentResponse.data.data.shipment_id,
            shipment_purpose: "commercial"
          },
          paymentInfo: {
            method: paymentMethod,
            status: 'pending'
          },
          totalAmount: sellerData.items.reduce((total, item) => total + item.price * item.quantity, 0)
        };

        const order = new Order(orderData);
        return order.save({ session });
      });

      const orders = await Promise.all(orderPromises);
      await session.commitTransaction();

      res.status(201).json({
        message: 'Orders created successfully',
        orders,
        shipping: shipmentResponse.data.data
      });

    } catch (error) {
      console.error('Terminal Africa API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create shipment with Terminal Africa');
    }

  } catch (error) {
    await session.abortTransaction();
    console.error('Order Creation Error:', error);
    res.status(error.response?.status || 500).json({
      message: 'Failed to create order',
      error: error.message,
      details: error.response?.data
    });
  } finally {
    session.endSession();
  }

  // After order is created successfully
  await WebhookService.sendWebhookEvent('order.created', {
    orderId: order._id,
    sellerId: order.seller,
    status: order.status,
    createdAt: order.createdAt,
    // Add other relevant order data
  }, order.seller);

  res.status(201).json(order);
};

// get rates from shipments
exports.getShippingRates = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const ratesResponse = await terminalAPI.get('/rates/shipment', {
      params: {
        currency: 'NGN',
        shipment_id: shipmentId
      }
    });

    if (!ratesResponse.data.status) {
      throw new Error('Failed to fetch shipping rates');
    }

    res.json({
      status: true,
      message: 'Shipping rates retrieved successfully',
      data: ratesResponse.data.data
    });

  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch shipping rates',
      error: error.message
    });
  }
};

// Mark order as paid and enable carrier
exports.markOrderAsPaid = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, carrierReference } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify that the order belongs to the current user
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update order payment status
    order.paid = true;
    order.paymentInfo = {
      method: paymentMethod,
      status: 'completed',
      paidAt: new Date()
    };

    // Enable carrier
    if (carrierReference) {
      const params = new URLSearchParams({
        domestic: true,
        international: false,
        regional: false
      });

      const enableResponse = await terminalAPI.post(`/carriers/enable/${carrierReference}?${params.toString()}`);

      if (!enableResponse.data.status) {
        throw new Error('Failed to enable carrier');
      }

      order.shipping.carrier = carrierReference;
      order.shipping.status = 'carrier_enabled';
    }

    await order.save();

    

    res.json({
      message: 'Order marked as paid successfully',
      order
    });

  } catch (error) {
    console.error('Error marking order as paid:', error);
    res.status(500).json({
      message: 'Failed to mark order as paid',
      error: error.message
    });
  }
};


// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('buyer', 'firstName lastName').populate('seller', 'name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve orders', error: error.message });
  }
};

// Get all orders for a buyer
exports.getOrdersForBuyer = async (req, res) => {
  const { buyerId } = req.params;

  try {
    const orders = await Order.find({ buyer: buyerId })
      .populate('buyer', 'firstName lastName')
      .populate('seller', 'name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve orders for buyer', error: error.message });
  }
};

// Get all orders for a seller
exports.getOrdersForSeller = async (req, res) => {
  const { sellerId } = req.params;

  try {
    const orders = await Order.find({ seller: sellerId })
      .populate('buyer', 'firstName lastName')
      .populate('seller', 'name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve orders for seller', error: error.message });
  }
};



// Update an order
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const { status, deliveredAt } = req.body;

  try {
    const order = await Order.findById(id).populate('seller');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate status transitions
    const validStatusTransitions = {
      'Pending': ['Paid'],
      'Paid': ['Confirmed', 'On its way'],
      'Confirmed': ['On its way'],
      'On its way': ['Delivered'],
    };

    if (!validStatusTransitions[order.status] || !validStatusTransitions[order.status].includes(status)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }

    order.status = status || order.status;
    order.deliveredAt = deliveredAt || order.deliveredAt;

    // Update seller's wallet balance if the order is marked as paid
    if (status === 'Paid') {
      const seller = order.seller;
      seller.walletBalance += order.totalPrice;
      await seller.save();
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete order', error: error.message });
  }
};

// Order Status Management
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId)
      .populate('buyer')
      .populate('seller');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = status;
    await order.save();

    // Prepare webhook data
    const webhookData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      oldStatus,
      newStatus: status,
      updatedAt: new Date(),
      items: order.items.map(item => ({
        productId: item.product,
        quantity: item.quantity,
        status: item.status
      })),
      shipping: {
        trackingNumber: order.shipping.tracking.number,
        carrier: order.shipping.tracking.carrier,
        estimatedDelivery: order.shipping.estimatedDeliveryDate
      }
    };

    // Send webhooks to both seller and buyer
    await WebhookService.sendWebhookEvent('order.status_updated', webhookData, {
      sellerId: order.seller._id,
      buyerId: order.buyer._id
    });

    // Send specific event based on status
    if (status === 'out_for_delivery') {
      await WebhookService.sendWebhookEvent('order.out_for_delivery', webhookData, {
        sellerId: order.seller._id,
        buyerId: order.buyer._id
      });
    } else if (status === 'delivered') {
      await WebhookService.sendWebhookEvent('order.delivered', webhookData, {
        sellerId: order.seller._id,
        buyerId: order.buyer._id
      });
    }

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Refund Management
exports.initiateRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify seller ownership
    if (order.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to refund this order' });
    }

    // Validate refund amount
    if (amount > order.totalAmount) {
      return res.status(400).json({ message: 'Refund amount cannot exceed order total' });
    }

    order.refund = {
      status: 'processing',
      amount,
      reason,
      requestDate: Date.now()
    };

    // Update seller's wallet balance
    const seller = await Seller.findById(order.seller);
    if (seller.walletBalance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance for refund' });
    }
    seller.walletBalance -= amount;
    await seller.save();

    // Notify buyer
    await notificationController.createNotification({
      recipient: order.buyer,
      type: 'REFUND_INITIATED',
      title: 'Refund Initiated',
      message: `A refund of ${amount} has been initiated for order #${order._id}`,
      reference: order._id
    });

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to initiate refund', error: error.message });
  }
};

// Order Analytics
exports.getOrderAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const sellerId = req.user.id;

    const dateFilter = {
      seller: sellerId,
      createdAt: {
        $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        $lte: endDate ? new Date(endDate) : new Date()
      }
    };

    const [orders, analytics] = await Promise.all([
      Order.find(dateFilter),
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            averageOrderValue: { $avg: '$totalAmount' },
            totalShipping: { $sum: '$shipping.fee' },
            totalTax: { $sum: '$tax' }
          }
        }
      ])
    ]);

    // Calculate status breakdown
    const statusBreakdown = orders.reduce((acc, order) => {
      acc[order.tracking.status] = (acc[order.tracking.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      ...analytics[0],
      statusBreakdown,
      timeframe: {
        start: dateFilter.createdAt.$gte,
        end: dateFilter.createdAt.$lte
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get order analytics', error: error.message });
  }
};

// Bulk Order Operations
exports.bulkUpdateOrders = async (req, res) => {
  try {
    const { orderIds, update } = req.body;
    const sellerId = req.user.id;

    // Verify ownership of all orders
    const orders = await Order.find({
      _id: { $in: orderIds },
      seller: sellerId
    });

    if (orders.length !== orderIds.length) {
      return res.status(403).json({ message: 'Not authorized to update some orders' });
    }

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: update },
      { new: true }
    );

    res.json({
      message: 'Orders updated successfully',
      modifiedCount: result.nModified
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to bulk update orders', error: error.message });
  }
};

// Tracking Management
exports.updateTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, carrier, estimatedDelivery } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify seller ownership
    if (order.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.tracking = {
      ...order.tracking,
      trackingNumber,
      carrier,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined
    };

    // Add to status history
    order.tracking.statusHistory.push({
      status: 'tracking_updated',
      note: `Tracking updated - ${carrier}: ${trackingNumber}`,
      updatedBy: req.user.id,
      timestamp: Date.now()
    });

    await order.save();

    // Notify buyer
    await notificationController.createNotification({
      recipient: order.buyer,
      type: 'TRACKING_UPDATED',
      title: 'Order Tracking Updated',
      message: `Tracking information updated for order #${order._id}`,
      reference: order._id
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update tracking', error: error.message });
  }
};

// Order Notes
exports.addOrderNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, isPrivate } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify seller ownership
    if (order.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    if (isPrivate) {
      order.notes.privateNote = note;
    } else {
      order.notes.customerNote = note;
      // Notify buyer of new note
      await notificationController.createNotification({
        recipient: order.buyer,
        type: 'ORDER_NOTE',
        title: 'New Order Note',
        message: `New note added to order #${order._id}`,
        reference: order._id
      });
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add note', error: error.message });
  }
};

// Export Orders
exports.exportOrders = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const sellerId = req.user.id;

    const query = {
      seller: sellerId,
      createdAt: {
        $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        $lte: endDate ? new Date(endDate) : new Date()
      }
    };

    if (status) {
      query['tracking.status'] = status;
    }

    const orders = await Order.find(query)
      .populate('buyer', 'firstName lastName email')
      .populate('cart.product', 'name sku');

    // Format orders for export
    const exportData = orders.map(order => ({
      orderId: order._id,
      customerName: `${order.buyer.firstName} ${order.buyer.lastName}`,
      customerEmail: order.buyer.email,
      status: order.tracking.status,
      total: order.totalAmount,
      items: order.cart.map(item => `${item.product.name} (${item.quantity})`).join(', '),
      createdAt: order.createdAt
    }));

    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export orders', error: error.message });
  }
};

// Revenue Analytics
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const sellerId = req.user.id;

    const matchStage = {
      seller: mongoose.Types.ObjectId(sellerId),
      'tracking.status': { $in: ['delivered', 'completed'] },
      createdAt: {
        $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        $lte: endDate ? new Date(endDate) : new Date()
      }
    };

    const groupStages = {
      day: {
        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
      },
      week: {
        $dateToString: { format: '%Y-W%V', date: '$createdAt' }
      },
      month: {
        $dateToString: { format: '%Y-%m', date: '$createdAt' }
      }
    };

    const analytics = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupStages[groupBy],
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get revenue analytics', error: error.message });
  }
};

// Dispute Management
exports.createDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if dispute already exists
    if (order.dispute.status !== 'none') {
      return res.status(400).json({ message: 'Dispute already exists for this order' });
    }

    order.dispute = {
      status: 'opened',
      reason,
      description,
      openedAt: new Date()
    };

    // Add note to order
    order.notes.push({
      type: 'buyer',
      content: `Dispute opened: ${reason} - ${description}`
    });

    await order.save();

    // Notify seller and admin
    await Promise.all([
      notificationController.createNotification(
        order.items[0].seller, // Assuming single seller order
        'dispute_opened',
        'New Dispute Opened',
        `A dispute has been opened for order #${order._id}`,
        { orderId: order._id }
      ),
      notificationController.createNotification(
        'admin', // Special handling in notification controller for admin
        'dispute_opened',
        'New Dispute Opened',
        `A dispute has been opened for order #${order._id}`,
        { orderId: order._id }
      )
    ]);

    res.json({ message: 'Dispute created successfully', order });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to create dispute',
      error: error.message
    });
  }
};

exports.updateDispute = async (req, res) => {
  try {
    const { id, disputeId } = req.params;
    const { status, resolution, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.dispute || order.dispute._id.toString() !== disputeId) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Update dispute
    order.dispute.status = status || order.dispute.status;
    if (resolution) order.dispute.resolution = resolution;
    if (note) {
      order.dispute.notes = order.dispute.notes || [];
      order.dispute.notes.push({
        content: note,
        addedBy: req.user.id,
        addedAt: Date.now()
      });
    }

    await order.save();

    // Notify parties of update
    await notificationController.createNotification({
      recipient: order.buyer,
      type: 'DISPUTE_UPDATED',
      title: 'Dispute Updated',
      message: `The dispute for order #${order._id} has been updated`,
      reference: order._id
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update dispute', error: error.message });
  }
};

// Request refund (for buyers)
exports.requestRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, amount } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate refund amount
    if (amount > order.totalAmount) {
      return res.status(400).json({
        message: 'Refund amount cannot exceed order total'
      });
    }

    order.refund = {
      status: 'requested',
      amount,
      reason,
      requestedAt: new Date()
    };

    // Add note to order
    order.notes.push({
      type: 'buyer',
      content: `Refund requested: ${amount} - ${reason}`
    });

    await order.save();

    // Notify seller
    await notificationController.createNotification(
      order.items[0].seller,
      'refund_requested',
      'New Refund Request',
      `A refund has been requested for order #${order._id}`,
      { orderId: order._id }
    );

    res.json({ message: 'Refund requested successfully', order });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to request refund',
      error: error.message
    });
  }
};

// Process refund (for sellers/admin)
exports.processRefund = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(id).session(session);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (status === 'approved') {
      // Process refund through Paystack
      const refundResponse = await paystack.post('/refund', {
        transaction: order.paymentInfo.reference,
        amount: Math.round(order.refund.amount * 100) // Amount in kobo
      });

      if (refundResponse.data.status) {
        order.refund.status = 'processed';
        order.refund.processedAt = new Date();
        order.paymentInfo.status = 'refunded';

        // Update seller's wallet balance
        const seller = await Seller.findById(order.items[0].seller).session(session);
        seller.walletBalance -= order.refund.amount;
        await seller.save({ session });
      } else {
        throw new Error('Refund failed through Paystack');
      }
    } else if (status === 'rejected') {
      order.refund.status = 'rejected';
    }

    // Add note to order
    order.notes.push({
      type: req.user.role.toLowerCase(),
      content: note || `Refund ${status}`
    });

    await order.save({ session });

    // Notify buyer
    await notificationController.createNotification(
      order.buyer,
      'refund_processed',
      'Refund Update',
      `Your refund request for order #${order._id} has been ${status}`,
      { orderId: order._id }
    );

    await session.commitTransaction();
    res.json({ message: 'Refund processed successfully', order });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: 'Failed to process refund',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Get detailed information about a specific order
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Find order and populate all relevant fields
    const order = await Order.findById(orderId)
      .populate({
        path: 'items.product',
        select: 'name description images price specifications categories'
      })
      .populate({
        path: 'items.seller',
        select: 'businessName email phoneNumber storeName'
      })
      .populate({
        path: 'buyer',
        select: 'firstName lastName email phoneNumber'
      });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user has permission to view this order
    const isBuyer = order.buyer._id.toString() === userId;
    const isSeller = order.items.some(item => item.seller._id.toString() === userId);
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to view this order' });
    }

    // Create a timeline of order events
    const timeline = [
      { status: 'created', timestamp: order.createdAt }
    ];

    if (order.paymentInfo.paidAt) {
      timeline.push({ status: 'paid', timestamp: order.paymentInfo.paidAt });
    }

    if (order.shipping.tracking.statusHistory) {
      timeline.push(...order.shipping.tracking.statusHistory.map(status => ({
        status: status.status,
        timestamp: status.timestamp,
        note: status.note
      })));
    }

    // Format response
    const response = {
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        paymentInfo: {
          method: order.paymentInfo.method,
          status: order.paymentInfo.status,
          paidAt: order.paymentInfo.paidAt
        }
      },
      buyer: order.buyer,
      items: order.items.map(item => ({
        product: item.product,
        seller: item.seller,
        quantity: item.quantity,
        price: item.price,
        status: item.status
      })),
      shipping: {
        address: order.delivery_address,
        method: order.shipping.method,
        fee: order.shipping.fee,
        tracking: order.shipping.tracking,
        estimatedDeliveryDate: order.shipping.estimatedDeliveryDate
      },
      timeline: timeline.sort((a, b) => b.timestamp - a.timestamp),
      dispute: order.dispute,
      refund: order.refund,
      notes: order.notes
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      message: 'Failed to retrieve order details',
      error: error.message
    });
  }
};
