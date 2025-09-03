// services/orderService.js
const crypto = require('crypto');
const orderRepository = require('../repositories/order.repository');
const { updateProductStockForPaidOrder, sendOrderConfirmationEmail, sendSlackNotificationForPaidOrder } = require('../helpers/order.helper');
const { handleWalletTopUp, handleFailedPayment } = require('../helpers/order.helper');
const agenda = require('../../../config/agenda');
const Buyer = require('../../../models/Buyer');

// Get paystack secret key with fallback
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || require('../../../config/paystack');

exports.handlePaystackWebhook = async (req) => {
  // Verify the event is from Paystack
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || paystackSecretKey)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return { status: 400, data: { message: 'Invalid signature' } };
  }

  const event = req.body;

  // Check if it's a charge.success event
  if (event.event === 'charge.success') {
    return await handleSuccessfulPayment(event);
  }

  // Handle payment failed event
  if (event.event === 'charge.failed') {
    return await handleFailedPayment(event.data);
  }

  // For other events, just acknowledge receipt
  return { status: 200, data: { message: 'Webhook received' } };
};

async function handleSuccessfulPayment(event) {
  console.log(`Received successful payment event from Paystack for Terminal Africa:`, {
    reference: event.data.reference,
    amount: event.data.amount / 100,
    status: event.data.status,
    metadata: event.data.metadata || {}
  });

  const metadata = event.data.metadata || {};

  // Check if this is a wallet top-up
  if (metadata.type === 'wallet_topup') {
    return await handleWalletTopUp(event.data);
  }

  // If there's no metadata or orderId, just acknowledge the webhook
  if (!metadata || !metadata.orderId) {
    return { status: 200, data: { message: 'Webhook received, but no order metadata' } };
  }

  try {
    // Find the order
    const order = await orderRepository.findOrderById(metadata.orderId);

    if (!order) {
      console.log(`Order not found for Terminal Africa Paystack payment: ${metadata.orderId}`);
      return { status: 200, data: { message: 'Order not found, but acknowledging webhook' } };
    }

    // Check if this is a Paystack order that's not already paid
    if (order.paymentInfo.method !== 'paystack' || order.paid) {
      console.log(`Terminal Africa order ${order.order_id} is either not a Paystack order or already paid`);
      return { status: 200, data: { message: 'Order already processed or not Paystack order' } };
    }

    // Mark the order as paid
    await processOrderAsPaid(order, event.data);

    // Get the buyer for notification and send Slack email
    const webhookBuyer = await Buyer.findById(order.buyer);
    if (webhookBuyer) {
      await sendSlackNotificationForPaidOrder(order, webhookBuyer);
    }

    // Send order confirmation email
    if (webhookBuyer && webhookBuyer.email) {
      try {
        console.log(`Sending order confirmation email to ${webhookBuyer.email} for paid Terminal Africa order ${order.order_id}`);
        await sendOrderConfirmationEmail(webhookBuyer, order);
      } catch (emailError) {
        console.error('Error sending order confirmation email for paid Terminal Africa order:', emailError);
      }
    }

    return { status: 200, data: { message: 'Terminal Africa payment processed successfully' } };
  } catch (error) {
    console.error('Error processing Terminal Africa Paystack webhook:', error);
    return { status: 200, data: { message: 'Error processing webhook, but acknowledging receipt' } };
  }
}

async function processOrderAsPaid(order, paymentData) {
  // Mark the order as paid
  order.paid = true;
  order.paymentInfo.status = 'paid';
  order.paymentInfo.transactionId = paymentData.id;
  order.paymentInfo.paymentReference = paymentData.reference;
  order.paymentInfo.paidAt = new Date();

  // Update product stock verification
  await updateProductStockForPaidOrder(order);

  // Cancel the stale job for this order
  try {
    await agenda.cancel({
      name: 'mark_terminal_orders_stale',
      'data.orderId': order._id.toString()
    });
    console.log(`Cancelled stale job for Terminal Africa order ${order.order_id}`);
  } catch (jobErr) {
    console.error('Error cancelling stale job:', jobErr);
  }

  // Check if this is a hybrid payment (wallet + Paystack)
  const isHybridPayment = order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;

  if (isHybridPayment) {
    console.log(`Processing hybrid payment for Terminal Africa order ${order.order_id}`, {
      totalAmount: order.totalAmount,
      walletAmountUsed: order.paymentInfo.walletAmountUsed,
      paystackAmount: order.totalAmount - order.paymentInfo.walletAmountUsed
    });
  }

  await order.save();
}
