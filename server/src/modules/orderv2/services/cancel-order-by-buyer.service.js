const mongoose = require('mongoose');
const orderRepository = require('../repositories/order.repository');
const terminalAPI = require('../../../config/terminalAPI');
const Product = require('../../../models/Product');
const Buyer = require('../../../models/Buyer');
const Seller = require('../../../models/Seller');
const termiiEmailService = require('../../../services/termiiEmailService');

// Set this to true to enable free shipping promo, false to disable
const FREE_SHIPPING_PROMO = true;

exports.cancelOrderByBuyer = async (orderId, buyerId, reason) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find and validate the order
    const order = await orderRepository.findOrderById(orderId);

    if (!order) {
      return { status: 404, data: { message: 'Order not found' } };
    }

    // Verify authorization
    if (order.buyer._id.toString() !== buyerId) {
      return { status: 403, data: { message: 'Not authorized to cancel this order' } };
    }

    // Validate order status for buyer cancellation
    const statusValidation = validateOrderForBuyerCancellation(order);
    if (!statusValidation.canCancel) {
      return { status: 400, data: { message: statusValidation.message } };
    }

    // Cancel Terminal Africa shipment if applicable
    await handleTerminalAfricaCancellation(order);

    // Handle wallet refund for hybrid payments
    const walletRefundResult = await handleWalletRefund(order, session);

    // Update order status and items
    await updateOrderForCancellation(order, reason, session);

    // Restore product stock
    await restoreProductStock(order, session);

    // Handle refund request for paid orders
    handleRefundRequest(order, reason);

    // Save the order
    await order.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Send email notifications
    sendCancellationEmails(order, reason, walletRefundResult);

    // Send SMS notifications to buyer and seller (non-blocking)
    // This will not affect order processing if SMS sending fails
    try {
      const { sendOrderCancellationSMS } = require('../helpers/sms.helper');
      const buyer = await Buyer.findById(order.buyer).select('phoneNumber firstName lastName');
      const seller = await Seller.findById(order.seller).select('phoneNumber firstName lastName businessName storeName');
      const hasRefund = order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet');
      sendOrderCancellationSMS(order, reason, hasRefund, buyer, seller);
    } catch (smsError) {
      // Log error but don't throw - SMS failures should not affect order processing
      console.error(`Error sending SMS notifications for cancelled order ${order.order_id}:`, smsError);
    }

    return {
      status: 200,
      data: {
        message: 'Order cancelled successfully',
        order: formatOrderResponse(order),
        walletRefunded: walletRefundResult.refunded,
        walletRefundAmount: walletRefundResult.amount
      }
    };

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error('Error cancelling order:', error);
    throw error;
  }
};

function validateOrderForBuyerCancellation(order) {
  // Check if order is already cancelled
  if (order.items.some(item => item.status === 'cancelled')) {
    return {
      canCancel: false,
      message: 'This order has already been cancelled'
    };
  }


  const nonCancellableStatuses = ['shipped', 'delivered', 'in-transit', 'in_transit', 'cancelled'];

  if (order.items.some(item => nonCancellableStatuses.includes(item.status))) {
    return {
      canCancel: false,
      message: 'Order cannot be cancelled. Orders with shipped, delivered, in-transit, or cancelled statuses cannot be cancelled by buyers.'
    };
  }



  return { canCancel: true };
}

async function handleTerminalAfricaCancellation(order) {
  // Check if this is a store pickup order
  if (order.isStorePickup) {
    console.log('Store pickup order - skipping Terminal Africa cancellation');
    return;
  }

  // Cancel shipment with Terminal Africa if shipment exists
  const shipmentId = order.shipping?.shipment_id;

  if (shipmentId && !shipmentId.startsWith('MANUAL-') && !shipmentId.startsWith('PICKUP-')) {
    const requestBody = { shipment_id: shipmentId };
    console.log(`Attempting to cancel Terminal Africa shipment for order ${order.order_id}`);
    console.log('Using shipmentId:', shipmentId);
    console.log('Terminal Africa API Request Body:', JSON.stringify(requestBody, null, 2));

    try {
      const cancelResponse = await terminalAPI.post('/shipments/cancel', requestBody);

      console.log('Terminal Africa cancellation successful response:', JSON.stringify(cancelResponse.data, null, 2));

      if (cancelResponse.data.status) {
        console.log('Terminal Africa shipment cancelled successfully');
      } else {
        console.log('Terminal Africa cancellation failed:', cancelResponse.data.message);
        if (cancelResponse.data.message !== 'Shipment transaction could not be found for shipment') {
          throw new Error(`Error cancelling Terminal Africa shipment for order ${order.order_id}: ${cancelResponse.data.message}`);
        }
      }
    } catch (error) {
      console.error(`Error cancelling Terminal Africa shipment for order ${order.order_id}:`, error.message);
      if (error.response) {
        console.error('Terminal API error response:', JSON.stringify(error.response.data, null, 2));
      }

      // Decide if we should re-throw or just log
      if (error.response && error.response.data && error.response.data.message === 'Shipment transaction could not be found for shipment') {
        console.warn(`Shipment for order ${order.order_id} not found on Terminal Africa. Proceeding with cancellation in our system.`);
      } else {
        throw new Error(`Error cancelling Terminal Africa shipment for order ${order.order_id}`);
      }
    }
  }
}

async function handleWalletRefund(order, session) {
  const isHybridPayment = order.paymentInfo && order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
  let walletRefunded = false;
  let walletRefundAmount = 0;

  if (isHybridPayment && order.paymentInfo.walletAmountUsed > 0) {
    try {
      console.log(`Processing wallet refund for hybrid payment in order ${order.order_id}`);

      const buyer = await Buyer.findById(order.buyer);

      if (buyer) {
        // Refund the wallet amount that was used (excluding shipping if promo is on)
        walletRefundAmount = calculateRefundAmount(order);
        const walletTransaction = {
          type: 'credit',
          amount: walletRefundAmount,
          description: `Refund for cancelled order ${order.order_id}`,
          status: 'completed',
          createdAt: new Date()
        };

        // Add transaction to wallet
        buyer.wallet.balance += walletRefundAmount;
        buyer.wallet.transactions.push(walletTransaction);

        // Save buyer with updated wallet
        await buyer.save({ session });

        walletRefunded = true;
        console.log(`Successfully refunded wallet amount: ${walletRefundAmount}`);
      }
    } catch (refundError) {
      console.error(`Error refunding wallet amount for order ${order.order_id}:`, refundError);
      // Continue with order cancellation even if refund fails
    }
  }

  return { refunded: walletRefunded, amount: walletRefundAmount };
}

async function updateOrderForCancellation(order, reason, session) {
  order.status = 'cancelled';
  // Update all items status to cancelled
  order.items.forEach(item => {
    item.status = 'cancelled';
    if (!item.statusHistory) {
      item.statusHistory = [];
    }
    item.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason || 'Cancelled by buyer'
    });
  });

  // Update shipping status to cancelled
  if (order.shipping && order.shipping.tracking) {
    order.shipping.tracking.status = 'cancelled';
    order.shipping.tracking.lastUpdate = new Date();

    if (!order.shipping.tracking.history) {
      order.shipping.tracking.history = [];
    }

    order.shipping.tracking.history.push({
      status: 'cancelled',
      timestamp: new Date(),
      description: reason || 'Order cancelled by buyer'
    });
  }
}

async function restoreProductStock(order, session) {
  for (const item of order.items) {
    await Product.findByIdAndUpdate(
      item.product,
      {
        $inc: {
          'stats.soldCount': -item.quantity,
          'stock': item.quantity,
          'inventory.quantity': item.quantity
        }
      },
      { session }
    );
  }
}

// Helper to calculate refund amount (items total + shipping if paid)
function calculateRefundAmount(order) {
  const itemsTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (FREE_SHIPPING_PROMO) {
    return itemsTotal;
  }
  const shippingFee = order.shipping && order.shipping.fee && order.shipping.fee.amount > 0 ? order.shipping.fee.amount : 0;
  return itemsTotal + shippingFee;
}

function handleRefundRequest(order, reason) {
  // Handle refund request for paid orders
  if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
    console.log('Creating refund request for paid order:', order.order_id);

    order.refundRequest = {
      requested: true,
      requestedAt: new Date(),
      requestedBy: 'buyer',
      reason: reason || 'Order cancelled by buyer',
      status: 'pending',
      refundAmount: calculateRefundAmount(order)
    };
  } else {
    // Update order status
    order.status = 'cancelled';

    // Close the order
    order.isOpen = false;
    order.closedAt = new Date();
    order.closedBy = 'buyer';
    order.closedReason = reason || 'Order cancelled by buyer';
  }
}

async function sendCancellationEmails(order, reason, walletRefundResult) {
  try {
    const { buyerEmail, sellerEmail } = generateCancellationEmails(order, reason, walletRefundResult);

    // Send buyer email
    await termiiEmailService.sendRawHTMLEmail({
      email: buyerEmail.to,
      subject: buyerEmail.subject,
      html: buyerEmail.html
    });

    // Send seller email
    await termiiEmailService.sendRawHTMLEmail({
      email: sellerEmail.to,
      subject: sellerEmail.subject,
      html: sellerEmail.html
    });

    // Send admin notification if refund is needed
    if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
      await sendAdminRefundNotification(order, reason, walletRefundResult);
    }
  } catch (emailError) {
    console.error('Error sending cancellation emails:', emailError.message);
    // Continue processing even if email sending fails
  }
}

function generateCancellationEmails(order, reason, walletRefundResult) {
  let buyerEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Order Cancellation Confirmation</h2>
      <p>Dear ${order.buyer.firstName},</p>
      <p>Your order #${order.order_id} has been cancelled as requested.</p>
      <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
      <p><strong>Seller:</strong> ${order.seller.storeName || order.seller.businessName}</p>
  `;

  // Add refund information if applicable
  if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
    buyerEmailHtml += `
      <p><strong>Refund Information:</strong></p>
      <p>Since you've already paid for this order, a refund request has been automatically created. Our admin team will process your refund shortly.</p>
      <p>Refund status: Pending</p>
    `;
  }

  // Add wallet refund info if applicable
  if (walletRefundResult.refunded) {
    buyerEmailHtml += `
      <p><strong>Wallet Refund:</strong> Your wallet credit of ₦${walletRefundResult.amount.toLocaleString()} used for this order has been refunded to your wallet.</p>
    `;
  }

  buyerEmailHtml += `
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>The Auqli Team</p>
    </div>
  `;

  const buyerEmail = {
    to: order.buyer.email,
    from: 'Auqli <support@auqli.com>',
    subject: 'Order Cancellation Confirmation - Auqli',
    html: buyerEmailHtml
  };

  const sellerEmail = {
    to: order.seller.email,
    from: 'Auqli <support@auqli.com>',
    subject: 'Order Cancellation Notice - Auqli',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Cancellation Notice</h2>
        <p>Dear ${order.seller.firstName},</p>
        <p>Order #${order.order_id} has been cancelled by the buyer.</p>
        <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
        <p><strong>Buyer:</strong> ${order.buyer.firstName} ${order.buyer.lastName}</p>
        ${order.paid ? `<p>Since this was a paid order, a refund request has been automatically created for the buyer.</p>` : ''}
        ${walletRefundResult.refunded ? `<p>The wallet amount used for this order (₦${walletRefundResult.amount.toLocaleString()}) has been refunded to the buyer's wallet.</p>` : ''}
        <p>The product stock has been restored.</p>
        <p>Best regards,<br>The Auqli Team</p>
      </div>
    `
  };

  return { buyerEmail, sellerEmail };
}

async function sendAdminRefundNotification(order, reason, walletRefundResult) {
  try {
    const Admin = mongoose.model('Admin');
    const admins = await Admin.find({});

    if (admins && admins.length > 0) {
      const adminEmail = {
        to: admins.map(admin => admin.email).filter(Boolean),
        from: 'Auqli <support@auqli.com>',
        subject: 'New Refund Request - Order Cancelled by Buyer',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Refund Request</h2>
            <p>A new refund request has been created due to order cancellation by buyer.</p>
            <p><strong>Order Details:</strong></p>
            <ul>
              <li>Order ID: ${order.order_id}</li>
              <li>Buyer: ${order.buyer.firstName} ${order.buyer.lastName}</li>
              <li>Seller: ${order.seller.storeName || order.seller.businessName}</li>
              <li>Amount: ₦${calculateRefundAmount(order).toLocaleString()}</li>
              <li>Reason: ${reason || 'Order cancelled by buyer'}</li>
              ${walletRefundResult.refunded ? `<li>Note: Wallet payment of ₦${walletRefundResult.amount.toLocaleString()} was automatically refunded</li>` : ''}
            </ul>
            <p>Please process this refund request promptly.</p>
          </div>
        `
      };

      // Send to each admin individually
      for (const adminRecipient of adminEmail.to) {
        try {
          await termiiEmailService.sendRawHTMLEmail({
            email: adminRecipient,
            subject: adminEmail.subject,
            html: adminEmail.html
          });
        } catch (err) {
          console.error(`Failed to send admin notification to ${adminRecipient}:`, err.message);
        }
      }
    }
  } catch (emailError) {
    console.error('Error sending admin notification:', emailError.message);
  }
}

function formatOrderResponse(order) {
  return {
    _id: order._id,
    order_id: order.order_id,
    isOpen: order.isOpen,
    items: order.items.map(item => ({
      status: item.status,
      statusHistory: item.statusHistory
    })),
    shipping: {
      tracking: order.shipping?.tracking
    },
    refundRequest: order.refundRequest,
    closedAt: order.closedAt,
    closedBy: order.closedBy,
    closedReason: order.closedReason
  };
} 
