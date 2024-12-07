const Order = require('../models/Order');
const Product = require('../models/Product');
const Discount = require('../models/Discount');
const Seller = require('../models/Seller');
const Notification = require('../models/Notification');
const axios = require('axios'); // For Paystack API calls
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Initialize Paystack
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
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
    const { 
      items, 
      shippingAddress, 
      paymentMethod,
      discountCode,
      email // Required for Paystack
    } = req.body;

    // 1. Validate and group items by seller
    const groupedItems = {};
    let totalAmount = 0;
    
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
      
      const sellerId = product.seller.toString();
      if (!groupedItems[sellerId]) {
        groupedItems[sellerId] = [];
      }
      
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      groupedItems[sellerId].push({
        product: product._id,
        seller: sellerId,
        quantity: item.quantity,
        price: product.price
      });
      
      // Update product stock
      product.stock -= item.quantity;
      await product.save({ session });
    }

    // 2. Apply discount if provided
    let discountAmount = 0;
    if (discountCode) {
      const discount = await Discount.findOne({ code: discountCode.toUpperCase() });
      if (discount && discount.isValid()) {
        discountAmount = discount.calculateDiscount(totalAmount);
        discount.usageCount += 1;
        await discount.save({ session });
      }
    }

    // 3. Initialize Paystack payment
    const paystackResponse = await paystack.post('/transaction/initialize', {
      email: email || req.user.email,
      amount: Math.round((totalAmount - discountAmount) * 100), // Amount in kobo
      callback_url: process.env.PAYSTACK_CALLBACK_URL,
      metadata: {
        custom_fields: [{
          display_name: "Order Items",
          variable_name: "order_items",
          value: JSON.stringify(items)
        }]
      }
    });

    // Create orders with pending status
    const orders = [];
    for (const [sellerId, sellerItems] of Object.entries(groupedItems)) {
      const sellerTotal = sellerItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      const order = new Order({
        buyer: req.user.id,
        items: sellerItems,
        totalAmount: sellerTotal,
        shippingAddress,
        paymentInfo: {
          method: 'paystack',
          status: 'pending',
          reference: paystackResponse.data.data.reference,
          accessCode: paystackResponse.data.data.access_code
        },
        discount: discountCode ? {
          code: discountCode,
          amount: (discountAmount * sellerTotal) / totalAmount
        } : undefined
      });

      await order.save({ session });
      orders.push(order);
    }

    await session.commitTransaction();
    res.status(201).json({
      message: 'Orders initialized successfully',
      orders: orders,
      payment: {
        authorization_url: paystackResponse.data.data.authorization_url,
        access_code: paystackResponse.data.data.access_code,
        reference: paystackResponse.data.data.reference
      }
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({
      message: 'Failed to create order',
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
  const { id } = req.params;

  try {
    const order = await Order.findById(id).populate('seller');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({ message: 'Order can only be marked as paid if it is in Pending status' });
    }

    order.paymentInfo.status = 'Paid';
    order.paidAt = Date.now();
    order.status = 'Paid';

    // Update seller's wallet balance
    const seller = order.seller;
    seller.walletBalance += order.totalPrice;
    await seller.save();

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark order as paid', error: error.message });
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
