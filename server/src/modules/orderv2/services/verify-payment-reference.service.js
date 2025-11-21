// services/orderService.js
const orderRepository = require('../repositories/order.repository');
const { verifyPaystackTransaction, updateProductStockForPaidOrder, sendOrderConfirmationEmail, sendSlackNotificationForPaidOrder } = require('../helpers/order.helper');
const { sendOrderPaymentConfirmationSMS } = require('../helpers/sms.helper');
const Buyer = require('../../../models/Buyer');
const Seller = require('../../../models/Seller');

exports.verifyPaymentByReference = async (reference, orderId) => {
  try {
    if (!reference) {
      return { status: 400, data: { message: 'Payment reference is required' } };
    }

    // Verify with Paystack
    const verificationResult = await verifyPaystackTransaction(reference);

    if (!verificationResult.success) {
      return { status: 400, data: { message: 'Payment verification failed', details: verificationResult.error } };
    }

    // If orderId is provided, mark the order as paid
    if (orderId) {
      const order = await orderRepository.findOrderById(orderId);

      if (!order) {
        return { status: 404, data: { message: 'Order not found' } };
      }

      if (order.paymentInfo.method === 'paystack' && !order.paid) {
        // Mark order as paid
        order.paid = true;
        order.paymentInfo.status = 'paid';
        order.paymentInfo.transactionId = verificationResult.data.id;
        order.paymentInfo.paymentReference = reference;
        order.paymentInfo.paidAt = new Date();

        // Update product stock verification
        await updateProductStockForPaidOrder(order);

        // Check if this is a hybrid payment (wallet + Paystack)
        const isHybridPayment = order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;

        if (isHybridPayment) {
          console.log(`Confirming hybrid payment for Terminal Africa order ${order.order_id}`, {
            totalAmount: order.totalAmount,
            walletAmountUsed: order.paymentInfo.walletAmountUsed,
            paystackAmount: order.totalAmount - order.paymentInfo.walletAmountUsed
          });
        }

        const updatedOrder = await order.save();

        // Get the buyer for notification and send Slack email
        const buyer = await Buyer.findById(order.buyer);

        // Send Slack notification for the paid order
        if (buyer) {
          await sendSlackNotificationForPaidOrder(updatedOrder, buyer);
        }

        // Mark notifications as sent
        order.notificationsSent = true;
        await order.save();

        // Send order confirmation email
        if (buyer && buyer.email) {
          try {
            await sendOrderConfirmationEmail(buyer, updatedOrder);
          } catch (emailError) {
            console.error('Error sending order confirmation email:', emailError);
          }
        }

        // Send SMS notifications to buyer and seller with OTP (non-blocking)
        // This will not affect order processing if SMS sending fails
        let smsStatus = { buyerSMS: { success: false }, sellerSMS: { success: false } };
        try {
          const seller = await Seller.findById(order.seller).select('phoneNumber firstName lastName businessName storeName');
          smsStatus = await sendOrderPaymentConfirmationSMS(updatedOrder, buyer, seller);
          
          // Reload order to get updated SMS status and OTP
          const orderWithSMS = await orderRepository.findOrderById(updatedOrder._id);
          if (orderWithSMS) {
            updatedOrder = orderWithSMS;
          }
        } catch (smsError) {
          // Log error but don't throw - SMS failures should not affect order processing
          console.error(`Error sending SMS notifications for order ${order.order_id}:`, smsError);
        }

        return {
          status: 200,
          data: {
            message: 'Payment verified and Terminal Africa order marked as paid',
            order: {
              _id: updatedOrder._id,
              order_id: updatedOrder.order_id,
              paid: updatedOrder.paid,
              paymentInfo: updatedOrder.paymentInfo,
              smsStatus: updatedOrder.smsStatus || smsStatus
            },
            verificationDetails: verificationResult.data
          }
        };
      } else {
        return {
          status: 200,
          data: {
            message: 'Payment verified but order is already paid or not a Paystack order',
            verificationDetails: verificationResult.data
          }
        };
      }
    }

    // If no orderId or order already paid, just return verification result
    return {
      status: 200,
      data: {
        message: 'Payment verification successful',
        verificationDetails: verificationResult.data
      }
    };
  } catch (error) {
    console.error('Error in verifyPaymentByReference service:', error);
    throw error;
  }
};
