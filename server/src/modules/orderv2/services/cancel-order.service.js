const mongoose = require('mongoose');
const orderRepository = require('../repositories/order.repository');
const terminalAPI = require('../../../config/terminalAPI');
const Product = require('../../../models/Product');
const Buyer = require('../../buyer/models/buyer.model');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.cancelOrderBySeller = async (orderId, sellerId, reason) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find and validate the order
    const order = await orderRepository.findOrderById(orderId);
    
    if (!order) {
      return { status: 404, data: { message: 'Order not found' } };
    }

    // Verify authorization
    if (order.seller._id.toString() !== sellerId) {
      return { status: 403, data: { message: 'Not authorized to cancel this order' } };
    }

    // Validate order status
    const statusValidation = validateOrderForCancellation(order);
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
    await sendCancellationEmails(order, reason, walletRefundResult);

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

function validateOrderForCancellation(order) {
  // Check if order is already cancelled
  if (order.items.some(item => item.status === 'cancelled')) {
    return { 
      canCancel: false, 
      message: 'This order has already been cancelled' 
    };
  }

  // Check if order is in cancellable status
  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  if (!order.items.every(item => cancellableStatuses.includes(item.status || 'pending'))) {
    return { 
      canCancel: false, 
      message: 'Order cannot be cancelled at this stage' 
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
    try {
      console.log(`Cancelling Terminal Africa shipment: ${shipmentId}`);
      
      const cancelResponse = await terminalAPI.post('/shipments/cancel', {
        shipment_id: shipmentId
      });
      
      console.log('Terminal Africa cancellation response:', {
        status: cancelResponse.data.status,
        message: cancelResponse.data.message
      });
      
      if (cancelResponse.data.status) {
        console.log('Terminal Africa shipment cancelled successfully');
      } else {
        console.log('Terminal Africa cancellation failed:', cancelResponse.data.message);
        // Continue with local cancellation despite Terminal API error
      }
    } catch (terminalError) {
      console.error('Terminal Africa API error:', {
        message: terminalError.message,
        response: terminalError.response?.data
      });
      // Continue with local cancellation despite Terminal API error
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
        // Refund the wallet amount that was used
        walletRefundAmount = order.paymentInfo.walletAmountUsed;
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
      note: reason || 'Cancelled by seller'
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
      description: reason || 'Order cancelled by seller'
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
      requestedBy: 'seller',
      reason: reason || 'Order cancelled by seller',
      status: 'pending',
      refundAmount: calculateRefundAmount(order)
    };
  } else {
    // For unpaid orders, close the order immediately
    order.status = 'cancelled';
    order.isOpen = false;
    order.closedAt = new Date();
    order.closedBy = 'seller';
    order.closedReason = reason || 'Order cancelled by seller';
  }
}

async function sendCancellationEmails(order, reason, walletRefundResult) {
  try {
    const { buyerEmail, sellerEmail } = generateCancellationEmails(order, reason, walletRefundResult);
    
    await sgMail.send([buyerEmail, sellerEmail]);
    
    // Send admin notification if refund is needed
    if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
      await sendAdminRefundNotification(order, reason, walletRefundResult);
    }
  } catch (emailError) {
    console.error('Error sending cancellation emails:', emailError);
    // Continue processing even if email sending fails
  }
}

function generateCancellationEmails(order, reason, walletRefundResult) {
  let buyerEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Order Cancellation Notice</h2>
      <p>Dear ${order.buyer.firstName},</p>
      <p>Your order #${order.order_id} has been cancelled by the seller.</p>
      <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
      <p><strong>Seller:</strong> ${order.seller.storeName || order.seller.businessName}</p>
  `;
  
  // Add refund information if applicable
  if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
    buyerEmailHtml += `
      <p><strong>Refund Information:</strong></p>
      <p>Since you've already paid for this order, a refund request has been automatically created. Our admin team will process your refund.</p>
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
    from: 'Auqli Orders <support@auqli.com>',
    subject: 'Order Cancellation Confirmation - Auqli',
    html: buyerEmailHtml
  };

  const sellerEmail = {
    to: order.seller.email,
    from: 'Auqli Orders <support@auqli.com>',
    subject: 'Order Cancellation Notice - Auqli',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Cancellation Notice</h2>
        <p>Dear ${order.seller.firstName},</p>
        <p>You have successfully cancelled order #${order.order_id}.</p>
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
        from: 'Auqli Orders <support@auqli.com>',
        subject: 'New Refund Request - Order Cancelled by Seller',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Refund Request</h2>
            <p>A new refund request has been created due to order cancellation by seller.</p>
            <p><strong>Order Details:</strong></p>
            <ul>
              <li>Order ID: ${order.order_id}</li>
              <li>Seller: ${order.seller.storeName || order.seller.businessName}</li>
              <li>Buyer: ${order.buyer.firstName} ${order.buyer.lastName}</li>
              <li>Amount: ₦${order.totalAmount.toLocaleString()}</li>
              <li>Reason: ${reason || 'Order cancelled by seller'}</li>
              ${walletRefundResult.refunded ? `<li>Note: Wallet payment of ₦${walletRefundResult.amount.toLocaleString()} was automatically refunded</li>` : ''}
            </ul>
            <p>Please process this refund request promptly.</p>
          </div>
        `
      };
      
      await sgMail.send(adminEmail);
    }
  } catch (emailError) {
    console.error('Error sending admin notification:', emailError);
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