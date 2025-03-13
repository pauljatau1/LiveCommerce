const Agenda = require('agenda');
const mongoose = require('mongoose');

const agenda = new Agenda({
  db: {
    address: process.env.MONGODB_URI,
    collection: 'agendaJobs'
  }
});

// Define the job processor for order closure
agenda.define('closeOrder', async (job) => {
  try {
    const { orderId } = job.attrs.data;
    const Order = mongoose.model('Order');
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const order = await Order.findById(orderId)
      .populate('buyer', 'email firstName')
      .populate('seller', 'email firstName businessName');

    if (!order || !order.isOpen) return;

    // Close the order
    order.isOpen = false;
    order.closedAt = new Date();
    order.closedBy = 'auto';
    order.closedReason = 'Auto-closed after delivery with no reported issues';

    await order.save(); // This will trigger the pre-save middleware for wallet updates

    // Send closure notification emails
    const buyerClosureEmail = {
      to: order.buyer.email,
      from: 'Auqli Orders <joseph@auqli.com>',
      subject: 'Order Closed Successfully - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Closed Successfully</h2>
          <p>Dear ${order.buyer.firstName},</p>
          <p>Your order #${order.order_id} has been automatically closed as no issues were reported after delivery.</p>
          <p>Thank you for shopping with us!</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    const sellerClosureEmail = {
      to: order.seller.email,
      from: 'Auqli Orders <joseph@auqli.com>',
      subject: 'Order Closed and Payment Released - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Closed and Payment Released</h2>
          <p>Dear ${order.seller.firstName},</p>
          <p>Order #${order.order_id} has been automatically closed and payment has been released to your wallet.</p>
          <p>Thank you for selling with Auqli!</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    await Promise.all([
      sgMail.send(buyerClosureEmail),
      sgMail.send(sellerClosureEmail)
    ]);

  } catch (error) {
    console.error('Error in closeOrder job:', error);
  }
});

// Define job for sending order notifications
agenda.define('send-order-notifications', async (job) => {
  try {
    console.log('Starting send-order-notifications job:', job.attrs.data);
    
    const { orderId, buyerId, sellerId } = job.attrs.data;
    
    const Order = mongoose.model('Order');
    const Buyer = mongoose.model('Buyer');
    const Seller = mongoose.model('Seller');
    const Message = mongoose.model('Message');
    const Conversation = mongoose.model('Conversation');
    const notificationController = require('../controllers/notificationController');
    
    // Fetch the necessary data
    console.log('Fetching order, buyer, and seller data...', {
      orderId: orderId.toString(),
      buyerId,
      sellerId
    });

    let order, buyer, seller;
    try {
      order = await Order.findById(orderId)
        .populate('items.product', 'name images price')
        .populate('shipping')
        .populate('delivery_address');
      console.log('Order fetch result:', order ? 'Found' : 'Not found');
    } catch (err) {
      console.error('Error fetching order:', err);
    }

    try {
      buyer = await Buyer.findById(buyerId);
      console.log('Buyer fetch result:', buyer ? 'Found' : 'Not found');
    } catch (err) {
      console.error('Error fetching buyer:', err);
    }

    try {
      seller = await Seller.findById(sellerId);
      console.log('Seller fetch result:', seller ? 'Found' : 'Not found');
    } catch (err) {
      console.error('Error fetching seller:', err);
    }
    
    console.log('Data fetch results:', {
      orderFound: !!order,
      buyerFound: !!buyer,
      sellerFound: !!seller,
      orderDetails: order ? {
        id: order._id.toString(),
        order_id: order.order_id,
        items: order.items.length
      } : null
    });
    
    if (!order || !buyer || !seller) {
      console.error('Missing data for order notifications:', { orderId, buyerId, sellerId });
      return;
    }

    // Find or create conversation
    console.log('Finding or creating conversation...');
    let conversation = await Conversation.findOne({
      'participants': {
        $all: [
          { $elemMatch: { id: buyerId, model: 'Buyer' } },
          { $elemMatch: { id: sellerId, model: 'Seller' } }
        ]
      }
    });

    if (!conversation) {
      console.log('Creating new conversation...');
      conversation = new Conversation({
        participants: [
          { id: buyerId, model: 'Buyer' },
          { id: sellerId, model: 'Seller' }
        ]
      });
      await conversation.save();
      console.log('New conversation created:', conversation._id.toString());
    } else {
      console.log('Found existing conversation:', conversation._id.toString());
    }

    // Format order items for the message
    console.log('Formatting order items...');
    const formattedItems = order.items.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      image: item.product.images[0]?.url || ''
    }));

    // Create the order message
    console.log('Creating order message...');
    const message = new Message({
      conversation: conversation._id,
      sender: { id: sellerId, model: 'Seller' },
      recipient: { id: buyerId, model: 'Buyer' },
      content: `Thank you for your order #${order.order_id}. We'll process it right away!`,
      messageType: 'order',
      order: {
        id: order._id,
        items: formattedItems,
        shippingFee: order.shipping?.fee?.amount || 0,
        totalAmount: order.totalAmount,
        tracking: {
          number: order.shipping?.tracking?.number,
          url: order.shipping?.tracking?.url,
          carrier: order.shipping?.carrier?.name,
          status: order.shipping?.tracking?.status
        },
        delivery_address: {
          first_name: order.delivery_address?.first_name,
          last_name: order.delivery_address?.last_name,
          email: order.delivery_address?.email,
          phone: order.delivery_address?.phone,
          line1: order.delivery_address?.line1,
          line2: order.delivery_address?.line2,
          city: order.delivery_address?.city,
          state: order.delivery_address?.state,
          country: order.delivery_address?.country,
          zip: order.delivery_address?.zip
        },
        status: order.status
      }
    });

    await message.save();
    console.log('Order message saved:', message._id.toString());

    // Update conversation
    console.log('Updating conversation...');
    conversation.lastMessage = {
      content: `Thank you for your order #${order.order_id}. We'll process it right away!`,
      sender: { id: sellerId, model: 'Seller' },
      messageType: 'order',
      createdAt: message.createdAt
    };

    // Increment unread count for buyer
    const buyerKey = buyerId.toString();
    const currentCount = conversation.unreadCount.get(buyerKey) || 0;
    conversation.unreadCount.set(buyerKey, currentCount + 1);

    await conversation.save();
    console.log('Conversation updated successfully');
    
    // Send notifications and emails
    console.log('Sending notifications...');
    await notificationController.handleOrderCreationNotifications(order, buyer, seller);
    
    console.log('Order notifications and message sent successfully');
  } catch (error) {
    console.error('Error in send-order-notifications job:', error);
  }
});

// Add auction status update job
agenda.define('update-auction-status', async (job) => {
  try {
    const { productId, newStatus } = job.attrs.data;
    const Product = mongoose.model('Product');

    const product = await Product.findById(productId);
    if (!product || product.status !== 'offline_auction') return;

    product.auction.status = newStatus;
    await product.save();

    // If starting the auction, notify followers
    if (newStatus === 'ongoing') {
      const Seller = mongoose.model('Seller');
      const seller = await Seller.findById(product.seller).populate('followers.buyerId', 'email firstName');
      
      if (seller && seller.followers.length > 0) {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const notifications = seller.followers.map(follower => ({
          to: follower.buyerId.email,
          from: 'Auqli Auctions <joseph@auqli.com>',
          subject: 'New Auction Started! - Auqli',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>New Auction Started!</h2>
              <p>Dear ${follower.buyerId.firstName},</p>
              <p>A new auction has started for "${product.name}" by ${seller.businessName}.</p>
              <p>Starting bid: $${product.auction.minBid}</p>
              <p>Don't miss out on this opportunity!</p>
              <p><a href="${process.env.FRONTEND_URL}/products/${product._id}">View Auction</a></p>
              <p>Best regards,<br>The Auqli Team</p>
            </div>
          `
        }));

        await sgMail.send(notifications);
      }
    }

  } catch (error) {
    console.error('Error in update-auction-status job:', error);
  }
});

// Define job for updating order status in messages
agenda.define('update-order-message-status', async (job) => {
  try {
    const { orderId, newStatus } = job.attrs.data;
    
    const Order = mongoose.model('Order');
    const Message = mongoose.model('Message');
    
    // Find all messages that contain this order
    const messages = await Message.find({
      'order.id': orderId,
      messageType: 'order'
    });

    // Update the order status in all messages
    await Promise.all(messages.map(message => {
      message.order.status = newStatus;
      return message.save();
    }));

    console.log(`Updated order status to ${newStatus} in ${messages.length} messages for order: ${orderId}`);
  } catch (error) {
    console.error('Error in update-order-message-status job:', error);
  }
});

// Start Agenda
const startAgenda = async () => {
  await agenda.start();
  console.log('Agenda started successfully');
};

module.exports = { agenda, startAgenda }; 