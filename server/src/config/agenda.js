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
    const { orderId, buyerId, sellerId } = job.attrs.data;
    
    const Order = mongoose.model('Order');
    const Buyer = mongoose.model('Buyer');
    const Seller = mongoose.model('Seller');
    const notificationController = require('../controllers/notificationController');
    
    // Fetch the necessary data
    const [order, buyer, seller] = await Promise.all([
      Order.findById(orderId),
      Buyer.findById(buyerId),
      Seller.findById(sellerId)
    ]);
    
    if (!order || !buyer || !seller) {
      console.error('Missing data for order notifications:', { orderId, buyerId, sellerId });
      return;
    }
    
    // Send notifications and emails
    await notificationController.handleOrderCreationNotifications(order, buyer, seller);
    
    console.log(`Order notifications sent for order: ${order.order_id}`);
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

// Start Agenda
const startAgenda = async () => {
  await agenda.start();
  console.log('Agenda started successfully');
};

module.exports = { agenda, startAgenda }; 