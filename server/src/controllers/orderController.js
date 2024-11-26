const Product = require('../models/Product');
const Order = require('../models/Order');
const Seller = require('../models/Seller');

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
