// services/orderService.js
const orderRepository = require('../repositories/order.repository');
const { verifyPaystackTransaction, updateProductStockForPaidOrder, sendOrderConfirmationEmail, sendSlackNotificationForPaidOrder } = require('../helpers/order.helper');
const agenda = require('../../../config/agenda');
const Buyer = require('../../../models/Buyer');

exports.markOrderAsPaid = async (id, transactionId, paymentReference, manualNote) => {
  try {
    if (!transactionId && !paymentReference) {
      return { status: 400, data: { message: 'Either transactionId or paymentReference is required' } };
    }

    const order = await orderRepository.findOrderById(id);

    if (!order) {
      return { status: 404, data: { message: 'Order not found' } };
    }

    // Verify Paystack transaction if reference is provided
    let verificationResult = null;
    if (paymentReference) {
      verificationResult = await verifyPaystackTransaction(paymentReference);
      if (!verificationResult.success) {
        return { status: 400, data: { message: 'Payment verification failed', details: verificationResult.error } };
      }
    }

    // Check if order is already paid
    if (order.paid) {
      const result = await handleAlreadyPaidOrder(order, transactionId, paymentReference, verificationResult);
      return { status: 200, data: result };
    }

    // Check if this is a Paystack order
    if (order.paymentInfo.method !== 'paystack') {
      return { status: 400, data: { message: 'Invalid order status. Only unpaid Paystack orders can be marked as paid.' } };
    }

    // Mark order as paid
    const updatedOrder = await processOrderAsPaid(order, transactionId, paymentReference, verificationResult);

    // Send order confirmation email
    const buyer = await Buyer.findById(order.buyer);
    if (buyer && buyer.email) {
      try {
        await sendOrderConfirmationEmail(buyer, updatedOrder);
      } catch (emailError) {
        console.error('Error sending order confirmation email:', emailError);
      }
    }

    // Send Slack notification
    await sendSlackNotificationForPaidOrder(updatedOrder, buyer);

    return {
      status: 200,
      data: {
        message: 'Terminal Africa order marked as paid successfully',
        order: {
          _id: updatedOrder._id,
          order_id: updatedOrder.order_id,
          paid: updatedOrder.paid,
          paymentInfo: updatedOrder.paymentInfo
        }
      }
    };

  } catch (error) {
    console.error('Error in markOrderAsPaid service:', error);
    throw error;
  }
};

async function handleAlreadyPaidOrder(order, transactionId, paymentReference, verificationResult) {
  const searchCriteria = {
    buyer: order.buyer,
    paid: false,
    'paymentInfo.method': 'paystack',
    $or: []
  };

  if (paymentReference) {
    searchCriteria.$or.push({ 'paymentInfo.paymentReference': paymentReference });
  }

  if (transactionId) {
    searchCriteria.$or.push({ 'paymentInfo.transactionId': transactionId });
  }

  if (verificationResult && verificationResult.data && verificationResult.data.id) {
    searchCriteria.$or.push({ 'paymentInfo.transactionId': verificationResult.data.id });
  }

  if (searchCriteria.$or.length > 0) {
    const otherUnpaidOrders = await orderRepository.findUnpaidOrders(searchCriteria);

    if (otherUnpaidOrders.length > 0) {
      console.log(`Found ${otherUnpaidOrders.length} other unpaid Terminal Africa orders from the same buyer`);

      const updatePromises = otherUnpaidOrders.map(async (otherOrder) => {
        const updatedOtherOrder = await processOrderAsPaid(otherOrder, transactionId, paymentReference, verificationResult);

        // Cancel any scheduled job to mark this order as stale
        try {
          await cancelStaleJobForOrder(otherOrder._id);
          console.log(`Cancelled stale marking job for now-paid Terminal Africa order ${otherOrder.order_id}`);
        } catch (jobError) {
          console.error(`Error cancelling stale job for order ${otherOrder.order_id}:`, jobError);
        }

        // Send order confirmation email
        const buyer = await Buyer.findById(otherOrder.buyer);
        if (buyer && buyer.email) {
          try {
            await sendOrderConfirmationEmail(buyer, updatedOtherOrder);
          } catch (emailError) {
            console.error(`Error sending order confirmation email for order ${otherOrder.order_id}:`, emailError);
          }
        }

        // Send Slack notification for the paid order
        await sendSlackNotificationForPaidOrder(updatedOtherOrder, buyer);

        return updatedOtherOrder;
      });

      const updatedOtherOrders = await Promise.all(updatePromises);

      return {
        message: `Original order already paid. ${updatedOtherOrders.length} related Terminal Africa orders marked as paid.`,
        orders: updatedOtherOrders.map(o => ({
          orderId: o._id,
          order_id: o.order_id,
          paid: o.paid
        }))
      };
    }
  }

  return { message: 'Order is already marked as paid' };
}

async function processOrderAsPaid(order, transactionId, paymentReference, verificationResult) {
  // Mark notifications as sent
  order.notificationsSent = true;

  // Mark order as paid
  order.paid = true;
  order.paymentInfo.status = 'paid';
  order.paymentInfo.transactionId = transactionId || verificationResult?.data?.id;
  order.paymentInfo.paymentReference = paymentReference || order.paymentInfo.paymentReference;
  order.paymentInfo.paidAt = new Date();

  // Check if this is a hybrid payment (wallet + Paystack)
  const isHybridPayment = order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;

  if (isHybridPayment) {
    console.log(`Confirming hybrid payment for Terminal Africa order ${order.order_id}`, {
      totalAmount: order.totalAmount,
      walletAmountUsed: order.paymentInfo.walletAmountUsed,
      paystackAmount: order.totalAmount - order.paymentInfo.walletAmountUsed
    });
  }

  // Update product stock verification
  await updateProductStockForPaidOrder(order);

  // Cancel the stale job for this order
  await cancelStaleJobForOrder(order._id);

  // Save the updated order
  return await order.save();
}

async function cancelStaleJobForOrder(orderId) {
  try {
    await agenda.cancel({
      name: 'mark_terminal_orders_stale',
      'data.orderId': orderId.toString()
    });
    console.log(`Cancelled stale job for Terminal Africa order ${orderId}`);
  } catch (jobErr) {
    console.error('Error cancelling stale job:', jobErr);
  }
}
