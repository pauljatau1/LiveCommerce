const Product = require('../models/Product');
const Order = require('../models/Order');
const Seller = require('../models/Seller');
const Notification = require('../models/Notification');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('SG.REDACTED');

exports.createOrder = async (req, res) => {
  const { cart, shippingAddress, user, paymentInfo } = req.body;

  try {
    let totalPrice = 0;
    const subOrders = [];

    // Group products by seller
    const groupedCart = cart.reduce((acc, item) => {
      const product = acc.find(group => group.sellerId === item.sellerId);
      if (product) {
        product.items.push(item);
      } else {
        acc.push({ sellerId: item.sellerId, items: [item] });
      }
      return acc;
    }, []);

    // Create sub-orders for each seller
    for (const group of groupedCart) {
      const sellerId = group.sellerId;
      const cartDetails = [];
      let subTotalPrice = 0;

      for (const item of group.items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({ message: `Product with id ${item.product} not found` });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({ message: `Not enough stock for product ${product.name}` });
        }

        // Use sale price if available, otherwise use the regular price
        const itemPrice = product.salePrice ? product.salePrice : product.price;
        const itemTotal = itemPrice * item.quantity;
        subTotalPrice += itemTotal;

        cartDetails.push({
          product: item.product,
          quantity: item.quantity,
          price: itemTotal,
        });
      }

      const newOrder = new Order({
        cart: cartDetails,
        shippingAddress,
        user,
        seller: sellerId,
        totalPrice: subTotalPrice,
        paymentInfo,
      });

      await newOrder.save();
      subOrders.push(newOrder);
      totalPrice += subTotalPrice;
    }

    // Include the total amount in the response
    const response = {
      subOrders,
      totalAmount: totalPrice,
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order', error: error.message });
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
    const { id } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify seller ownership
    if (order.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    // Update tracking status
    order.tracking.status = status;
    if (note) {
      order.tracking.statusHistory.push({
        status,
        note,
        updatedBy: req.user.id,
        timestamp: Date.now()
      });
    }

    // Handle specific status changes
    switch (status) {
      case 'shipped':
        // Send shipping notification to buyer
        await notificationController.createNotification({
          recipient: order.user,
          type: 'ORDER_SHIPPED',
          title: 'Order Shipped',
          message: `Your order #${order._id} has been shipped`,
          reference: order._id
        });
        break;
      case 'delivered':
        order.deliveredAt = Date.now();
        break;
      case 'cancelled':
        // Restore inventory
        for (const item of order.cart) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { 'inventory.quantity': item.quantity }
          });
        }
        break;
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
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
    if (order.dispute) {
      return res.status(400).json({ message: 'Dispute already exists for this order' });
    }

    order.dispute = {
      reason,
      description,
      status: 'open',
      createdAt: Date.now(),
      createdBy: req.user.id
    };

    await order.save();

    // Notify relevant parties
    await notificationController.createNotification({
      recipient: order.seller,
      type: 'DISPUTE_CREATED',
      title: 'New Dispute Created',
      message: `A dispute has been created for order #${order._id}`,
      reference: order._id
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create dispute', error: error.message });
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
