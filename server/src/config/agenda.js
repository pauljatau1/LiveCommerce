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

// Start Agenda
const startAgenda = async () => {
  await agenda.start();
  console.log('Agenda started successfully');
};

module.exports = { agenda, startAgenda }; 