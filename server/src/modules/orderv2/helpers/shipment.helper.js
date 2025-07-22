const Buyer = require('../../../models/Buyer');
const { sendShipmentFailureEmail } = require('../../../utils/emailService');

async function handleWalletRefund(order, session) {
  const isHybridPayment = order.paymentInfo && order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
  let walletRefunded = false;
  let walletRefundAmount = 0;

  if (isHybridPayment && order.paymentInfo.walletAmountUsed > 0) {
    try {
      console.log(`Processing wallet refund for hybrid payment in order ${order.order_id}`);
      
      const buyer = await Buyer.findById(order.buyer);
      
      if (buyer) {
        walletRefundAmount = order.paymentInfo.walletAmountUsed;
        const walletTransaction = {
          type: 'credit',
          amount: walletRefundAmount,
          description: `Refund for failed shipment of order #${order.order_id}`,
          status: 'completed'
        };

        buyer.wallet.balance += walletRefundAmount;
        buyer.wallet.transactions.push(walletTransaction);
        
        await buyer.save({ session });
        
        walletRefunded = true;
        console.log(`Successfully refunded wallet amount: ${walletRefundAmount}`);
      }
    } catch (refundError) {
      console.error(`Error refunding wallet amount for order ${order.order_id}:`, refundError);
    }
  }

  return { refunded: walletRefunded, amount: walletRefundAmount };
}

async function handleShipmentFailure(order, error) {
  if (order.paid) {
    const walletRefundResult = await handleWalletRefund(order);
    if (walletRefundResult.refunded) {
      console.log(`Refund of ${walletRefundResult.amount} processed for order ${order.order_id}`);
    }
  }

  try {
    await sendShipmentFailureEmail(order.buyer, order, error.message);
  } catch (emailError) {
    console.error(`Failed to send shipment failure email for order ${order.order_id}:`, emailError);
  }
}

module.exports = { handleShipmentFailure };
