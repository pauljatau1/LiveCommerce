const Order = require('../models/Order');
const Product = require('../models/Product');
const Discount = require('../models/Discount');
const Seller = require('../models/Seller');
const Notification = require('../models/Notification');
const Buyer = require('../models/Buyer');
const axios = require('axios'); // For Paystack API calls
const sgMail = require('@sendgrid/mail');
const shippingService = require('../services/shippingService');
const terminalService = require('../services/terminalService');
const terminalAPI = axios.create({
  baseURL: 'https://sandbox.terminal.africa/v1',
  headers: {
    Authorization: `Bearer ${process.env.TERMINAL_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const mongoose = require('mongoose');

// Initialize Paystack
const paystackSecretKey = "sk_test_REDACTED";
const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${paystackSecretKey}`,
    'Content-Type': 'application/json'
  }
});

exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, shippingAddress } = req.body;
    const buyer = await Buyer.findById(req.user.id);

    // Validate product and create initial order...
    const product = await Product.findById(items[0].productId)
      .populate('seller', 'email firstName lastName phoneNumber sellerAddress');
    
    // Create addresses for Terminal API
    const fromAddress = {
      city: product.seller.sellerAddress.city,
      country: product.seller.sellerAddress.country === 'Nigeria' ? 'NG' : product.seller.sellerAddress.country,
      email: product.seller.email,
      first_name: product.seller.firstName,
      last_name: product.seller.lastName,
      line1: product.seller.sellerAddress.addressLine1,
      line2: product.seller.sellerAddress.addressLine2 || '',
      phone: product.seller.phoneNumber,
      state: product.seller.sellerAddress.state,
      zip: product.seller.sellerAddress.zipCode
    };

    const toAddress = {
      city: shippingAddress.city,
      country: shippingAddress.country === 'Nigeria' ? 'NG' : shippingAddress.country,
      email: buyer.email,
      first_name: buyer.firstName,
      last_name: buyer.lastName,
      line1: shippingAddress.addressLine1,
      line2: shippingAddress.addressLine2 || '',
      phone: buyer.phoneNumber,
      state: shippingAddress.state,
      zip: shippingAddress.zipCode
    };

    // Create addresses in Terminal
    const [fromAddressRes, toAddressRes] = await Promise.all([
      terminalAPI.post('/addresses', fromAddress),
      terminalAPI.post('/addresses', toAddress)
    ]);

    // Create parcel
    const parcelData = {
      weight: product.weight || 1,
      height: product.dimensions?.height || 10,
      width: product.dimensions?.width || 10,
      length: product.dimensions?.length || 10
    };

    const parcelResponse = await terminalAPI.post('/parcels', parcelData);

    // Get shipping rates
    const shippingRates = await getShippingRatesForOrder(
      fromAddressRes.data.data.address_id,
      toAddressRes.data.data.address_id,
      parcelResponse.data.data.parcel_id
    );

    // Calculate initial total (product price * quantity)
    const subtotal = product.price * items[0].quantity;

    // Create order with initial shipping details
    const order = new Order({
      buyer: buyer._id,
      items: [{
        product: items[0].productId,
        quantity: items[0].quantity,
        seller: product.seller._id,
        price: product.price
      }],
      shippingAddress,
      subtotal,
      totalAmount: subtotal, // Will be updated with shipping fee
      paid: false,
      shipping: {
        fromAddressId: fromAddressRes.data.data.address_id,
        toAddressId: toAddressRes.data.data.address_id,
        parcelId: parcelResponse.data.data.parcel_id,
        availableRates: shippingRates,
        status: 'pending_carrier_selection'
      }
    });

    await order.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      message: 'Order created successfully',
      order,
      shippingRates,
      nextStep: {
        action: 'select_shipping_carrier',
        endpoint: `/api/order/${order._id}/select-carrier`
      }
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: 'Failed to create order',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Modified select carrier endpoint
exports.selectShippingCarrier = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { carrierReference, rateId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find selected rate from available rates
    const selectedRate = order.shipping.availableRates.find(
      rate => rate.rateId === rateId
    );

    if (!selectedRate) {
      return res.status(400).json({ message: 'Invalid rate selected' });
    }

    // Enable carrier
    await terminalAPI.get(`/carriers/enable/${carrierReference}`, {
      params: { domestic: true }
    });

    // Update order with shipping fee and total
    order.shipping.carrier = carrierReference;
    order.shipping.rateId = rateId;
    order.shipping.fee = selectedRate.amount;
    order.totalAmount = order.subtotal + selectedRate.amount;
    order.shipping.status = 'carrier_selected';

    await order.save({ session });
    await session.commitTransaction();

    res.json({
      message: 'Shipping carrier selected successfully',
      order,
      nextStep: {
        action: 'process_payment',
        endpoint: `/api/order/${order._id}/process-payment`
      }
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: 'Failed to select shipping carrier',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// New endpoint to handle payment and create shipment
exports.processPaymentAndCreateShipment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { paymentDetails } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Process payment (implement your payment logic here)
    // const paymentResult = await processPayment(paymentDetails, order.totalAmount);

    // Create shipment
    const shipmentData = {
      address_from: order.shipping.fromAddressId,
      address_to: order.shipping.toAddressId,
      parcel: order.shipping.parcelId,
      carrier_reference: order.shipping.carrier,
      rate_id: order.shipping.rateId,
      metadata: {
        orderId: order._id
      }
    };

    const shipmentResponse = await terminalAPI.post('/shipments', shipmentData);

    // Update order
    order.paid = true;
    order.shipping.status = 'shipment_created';
    order.shipping.shipmentId = shipmentResponse.data.data.shipment_id;
    order.shipping.trackingNumber = shipmentResponse.data.data.tracking_number;

    await order.save({ session });
    await session.commitTransaction();

    res.json({
      message: 'Payment processed and shipment created successfully',
      order,
      shipment: shipmentResponse.data.data
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: 'Failed to process payment and create shipment',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Paystack webhook handler
exports.paystackWebhook = async (req, res) => {
  try {
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const orders = await Order.find({
        'paymentInfo.reference': event.data.reference
      });

      for (const order of orders) {
        order.paymentInfo.status = 'completed';
        order.paymentInfo.paidAt = new Date();
        await order.save();

        // Notify seller
        await notificationController.createNotification({
          recipient: order.items[0].seller,
          type: 'new_order',
          title: 'New Order Received',
          message: `You have received a new order (#${order._id})`,
          data: { orderId: order._id }
        });
      }

      // Send confirmation email to buyer
      if (orders.length > 0) {
        await sgMail.send({
          to: event.data.customer.email,
          from: 'orders@yourdomain.com',
          subject: 'Order Confirmation',
          html: `
            <h1>Thank you for your order!</h1>
            <p>Your order(s) have been successfully placed:</p>
            ${orders.map(order => `
              <p>Order ID: ${order._id}</p>
              <p>Total Amount: ₦${order.totalAmount}</p>
            `).join('<br>')}
          `
        });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.sendStatus(500);
  }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'firstName lastName').populate('seller', 'name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve orders', error: error.message });
  }
};

// Get all orders for a buyer
exports.getOrdersForBuyer = async (req, res) => {
  const { buyerId } = req.params;

  try {
    const orders = await Order.find({ user: buyerId }).populate('user', 'firstName lastName').populate('seller', 'name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve orders for buyer', error: error.message });
  }
};

// Get all orders for a seller
exports.getOrdersForSeller = async (req, res) => {
  const { sellerId } = req.params;

  try {
    const orders = await Order.find({ seller: sellerId }).populate('user', 'firstName lastName').populate('seller', 'name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve orders for seller', error: error.message });
  }
};

// Get a single order
exports.getOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id).populate('user', 'firstName lastName').populate('seller', 'name');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve order', error: error.message });
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

// Mark order as paid
exports.markOrderAsPaid = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { transactionId, paymentMethod } = req.body;

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
      transactionId: transactionId,
      paidAt: new Date()
    };

    await order.save();

    // Notify seller about the payment
    await notificationController.createNotification({
      recipient: order.items[0].seller,
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment received for order #${order._id}`,
      reference: order._id
    });

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
    const { orderId, itemId, status, note } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify seller owns this order item
    const orderItem = order.items.id(itemId);
    if (!orderItem || orderItem.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this order' });
    }

    // Update status
    orderItem.status = status;
    orderItem.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`
    });

    // If status is shipped, require tracking information
    if (status === 'shipped' && (!req.body.trackingNumber || !req.body.carrier)) {
      return res.status(400).json({ 
        message: 'Tracking number and carrier required for shipped status' 
      });
    }

    if (status === 'shipped') {
      order.shipping = {
        ...order.shipping,
        trackingNumber: req.body.trackingNumber,
        carrier: req.body.carrier,
        estimatedDelivery: req.body.estimatedDelivery
      };

      // Notify buyer
      await notificationController.createNotification(
        order.buyer,
        'order_shipped',
        'Order Shipped',
        `Your order #${order._id} has been shipped`,
        {
          orderId: order._id,
          trackingNumber: req.body.trackingNumber,
          carrier: req.body.carrier
        }
      );
    }

    await order.save();
    res.json({ message: 'Order status updated successfully', order });

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
    if (amount > order.billing.total) {
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
      recipient: order.user,
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
            totalRevenue: { $sum: '$billing.total' },
            averageOrderValue: { $avg: '$billing.total' },
            totalShipping: { $sum: '$billing.shipping' },
            totalTax: { $sum: '$billing.tax' }
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
      recipient: order.user,
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
        recipient: order.user,
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
      .populate('user', 'firstName lastName email')
      .populate('cart.product', 'name sku');

    // Format orders for export
    const exportData = orders.map(order => ({
      orderId: order._id,
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      customerEmail: order.user.email,
      status: order.tracking.status,
      total: order.billing.total,
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
          revenue: { $sum: '$billing.total' },
          orders: { $sum: 1 },
          averageOrderValue: { $avg: '$billing.total' }
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
      recipient: order.user,
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

exports.calculateShipping = async (req, res) => {
  try {
    const { items, shippingAddress, pickupAddress } = req.body;
    
    // Validate addresses
    if (!validateAddress(shippingAddress) || !validateAddress(pickupAddress)) {
      return res.status(400).json({ message: 'Invalid address format' });
    }

    let totalShippingFee = 0;
    const shippingDetails = [];

    for (const item of items) {
      const product = await Product.findById(item.productId)
        .populate('seller', 'warehouseAddress');

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      const rates = await shippingService.calculateShippingFee(
        product,
        shippingAddress,
        pickupAddress || product.seller.warehouseAddress
      );

      const estimatedDeliveryDate = shippingService.estimateDeliveryDate(rates.method);

      shippingDetails.push({
        productId: item.productId,
        availableRates: rates,
        estimatedDeliveryDate
      });
    }

    res.json({
      shippingDetails,
      carriers: await terminalService.getCarriers(shippingAddress.country)
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to calculate shipping', 
      error: error.message 
    });
  }
};

// Search shipping rates
exports.searchShippingRates = async (req, res) => {
  try {
    const { pickupAddressId, deliveryAddressId, parcelId } = req.body;

    if (!pickupAddressId || !deliveryAddressId || !parcelId) {
      return res.status(400).json({
        message: 'Missing required parameters: pickupAddressId, deliveryAddressId, or parcelId'
      });
    }

    const ratesResponse = await terminalAPI.get('/rates/shipment', {
      params: {
        currency: 'NGN',
        pickup_address: pickupAddressId,
        delivery_address: deliveryAddressId,
        parcel_id: parcelId,
        cash_on_delivery: false
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

// Enable carrier
exports.enableCarrier = async (req, res) => {
  try {
    const { carrierReference } = req.params;
    const { domestic = true, international = false, regional = false } = req.body;

    if (!carrierReference) {
      return res.status(400).json({
        message: 'Carrier reference is required'
      });
    }

    const enableResponse = await terminalAPI.get(`/carriers/enable/${carrierReference}`, {
      params: {
        domestic,
        international,
        regional
      }
    });

    if (!enableResponse.data.status) {
      throw new Error('Failed to enable carrier');
    }

    res.json({
      status: true,
      message: 'Carrier enabled successfully',
      data: enableResponse.data.data
    });

  } catch (error) {
    console.error('Error enabling carrier:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to enable carrier',
      error: error.message
    });
  }
};

// Helper function to get shipping rates for an order
async function getShippingRatesForOrder(pickupAddressId, deliveryAddressId, parcelId) {
  try {
    const ratesResponse = await terminalAPI.get('/rates/shipment', {
      params: {
        currency: 'NGN',
        pickup_address: pickupAddressId,
        delivery_address: deliveryAddressId,
        parcel_id: parcelId,
        cash_on_delivery: false
      }
    });

    if (!ratesResponse.data.status) {
      throw new Error('Failed to fetch shipping rates');
    }

    return ratesResponse.data.data;

  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    throw error;
  }
}

// Create shipment
exports.createShipment = async (req, res) => {
  try {
    const { 
      addressFromId, 
      addressToId, 
      parcelId, 
      addressReturnId, 
      metadata 
    } = req.body;

    // Validate required fields
    if (!addressFromId || !addressToId || !parcelId) {
      return res.status(400).json({
        status: false,
        message: 'Missing required fields: addressFromId, addressToId, or parcelId'
      });
    }

    const shipmentData = {
      address_from: addressFromId,
      address_to: addressToId,
      parcel: parcelId,
      address_return: addressReturnId,
      shipment_purpose: "commercial",
      metadata: {
        ...metadata,
        orderId: req.body.orderId // If available
      }
    };

    const shipmentResponse = await terminalAPI.post('/shipments', shipmentData);

    if (!shipmentResponse.data.status) {
      throw new Error('Failed to create shipment');
    }

   
    if (req.body.orderId) {
      const order = await Order.findById(req.body.orderId);
      if (order) {
        order.shipping = {
          ...order.shipping,
          shipmentId: shipmentResponse.data.data.shipment_id,
          status: 'shipment_created',
          createdAt: new Date()
        };
        await order.save();
      }
    }

    res.json({
      status: true,
      message: 'Shipment created successfully',
      data: shipmentResponse.data.data
    });

  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to create shipment',
      error: error.message
    });
  }
};

// Get all orders for a specific buyer
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify if the requesting user is the same as userId
    if (req.user.id !== userId) {
      return res.status(403).json({
        message: 'Unauthorized to view these orders'
      });
    }

    const orders = await Order.find({ buyer: userId })
      .populate('items.product')
      .populate('items.seller', 'firstName lastName businessName')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Orders retrieved successfully',
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve orders',
      error: error.message
    });
  }
};

// Cancel an order
exports.cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized to cancel the order
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to cancel this order' });
    }

    // Check if order can be cancelled
    if (order.shipping.status !== 'pending_carrier_selection' && 
        order.shipping.status !== 'carrier_selected') {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled at this stage',
        currentStatus: order.shipping.status
      });
    }

    // If shipment was created, cancel it with Terminal
    if (order.shipping.shipmentId) {
      try {
        await terminalAPI.post(`/shipments/${order.shipping.shipmentId}/cancel`);
      } catch (error) {
        console.error('Failed to cancel shipment:', error);
        // Continue with order cancellation even if shipment cancellation fails
      }
    }

    // Update order status
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = req.body.reason || 'Cancelled by buyer';

    await order.save({ session });

    // Notify seller
    await notificationController.createNotification({
      recipient: order.items[0].seller,
      type: 'order_cancelled',
      title: 'Order Cancelled',
      message: `Order #${order._id} has been cancelled by the buyer`,
      data: { orderId: order._id }
    });

    await session.commitTransaction();

    res.json({
      message: 'Order cancelled successfully',
      order
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: 'Failed to cancel order',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Get all orders for a seller
exports.getSellerOrders = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    // Verify if the requesting user is the seller
    if (req.user.id !== sellerId) {
      return res.status(403).json({
        message: 'Unauthorized to view these orders'
      });
    }

    const orders = await Order.find({ 'items.seller': sellerId })
      .populate('buyer', 'firstName lastName email')
      .populate('items.product')
      .sort({ createdAt: -1 });

    // Group orders by status
    const groupedOrders = {
      pending: orders.filter(order => order.status === 'pending'),
      processing: orders.filter(order => order.status === 'processing'),
      shipped: orders.filter(order => order.status === 'shipped'),
      delivered: orders.filter(order => order.status === 'delivered'),
      cancelled: orders.filter(order => order.status === 'cancelled')
    };

    res.json({
      message: 'Orders retrieved successfully',
      totalCount: orders.length,
      ordersByStatus: groupedOrders,
      orders
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve seller orders',
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId)
      .populate('buyer', 'email firstName lastName')
      .populate('items.seller');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify if the requesting user is the seller of this order
    const isSeller = order.items.some(item => 
      item.seller._id.toString() === req.user.id
    );

    if (!isSeller) {
      return res.status(403).json({
        message: 'Unauthorized to update this order'
      });
    }

    // Validate status transition
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status',
        validStatuses
      });
    }

    // Update order status
    order.status = status;
    order.statusHistory.push({
      status,
      updatedBy: req.user.id,
      updatedAt: new Date()
    });

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    await order.save({ session });

    // Send notification to buyer
    await notificationController.createNotification({
      recipient: order.buyer._id,
      type: 'order_status_update',
      title: 'Order Status Updated',
      message: `Your order #${order._id} is now ${status}`,
      data: { orderId: order._id, status }
    });

    // Send email notification
    const emailTemplate = getEmailTemplateForStatus(status, order);
    await sgMail.send(emailTemplate);

    await session.commitTransaction();

    res.json({
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: 'Failed to update order status',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Helper function for email templates
const getEmailTemplateForStatus = (status, order) => {
  const template = {
    to: order.buyer.email,
    from: 'orders@yourdomain.com',
    subject: `Order Status Update - ${status.toUpperCase()}`,
    html: `
      <h1>Order Status Update</h1>
      <p>Dear ${order.buyer.firstName},</p>
      <p>Your order #${order._id} has been ${status}.</p>
      ${status === 'shipped' ? `
        <p>Tracking Number: ${order.shipping.trackingNumber}</p>
        <p>Carrier: ${order.shipping.carrier}</p>
      ` : ''}
      <p>Thank you for shopping with us!</p>
    `
  };
  return template;
};
