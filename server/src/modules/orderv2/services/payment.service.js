// src/modules/orderv2/services/payment.service.js
const mongoose = require('mongoose');
const orderRepository = require('../repositories/order.repository');
const arrangeShipmentHelper = require('../helpers/order.helper');
const Product = require('../../../models/Product');
const Buyer = require('../../buyer/models/buyer.model');
const Seller = require('../../../models/Seller');

// Set this to true to enable free shipping promo, false to disable
const FREE_SHIPPING_PROMO = true;

exports.payForOrder = async (orderId, paymentDetails) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { method: paymentMethod, reference } = paymentDetails;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            throw new Error('Invalid order ID format');
        }

        const order = await orderRepository.findOrderById(orderId, session);
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.isStale) {
            throw new Error('This order has expired and can no longer be paid for. Please create a new order.');
        }

        if (order.status !== 'pending_payment') {
            throw new Error(`Order cannot be paid for in its current status: ${order.status}`);
        }

        if (order.paid) {
            throw new Error('Order has already been paid for.');
        }

        let paymentVerified = false;
        let amountPaid = 0;

        if (paymentMethod === 'wallet') {
            const buyer = await Buyer.findById(order.buyer).session(session);
            const debitAmount = calculateRefundAmount(order);
            if (!buyer || buyer.wallet.balance < debitAmount) {
                throw new Error('Insufficient wallet balance.');
            }
            buyer.wallet.balance -= debitAmount;
            buyer.wallet.transactions.push({
                type: 'debit',
                amount: debitAmount,
                description: `Payment for order ${order.order_id}`,
                status: 'completed',
                paymentReference: `wallet-${order.order_id}`
            });
            await buyer.save({ session });
            paymentVerified = true;
            amountPaid = debitAmount;
        } else if (paymentMethod === 'paystack') {
            if (!reference) {
                throw new Error('Paystack reference is required for payment.');
            }
            const verification = await arrangeShipmentHelper.verifyPaystackTransaction(reference);

            const amountPaidByCustomer = verification.data.amount / 100;

            // TEMPORARY: Bypassing amount check for free shipping promotion as requested.
            if (verification.success) {
                console.log(`TEMPORARY: Bypassing amount verification for order ${order.order_id}.`);
                paymentVerified = true;
                amountPaid = amountPaidByCustomer;
                order.paymentInfo.paymentReference = reference;
            } else {
                console.error('Paystack payment verification failed. Details:', { orderId: order.order_id });
                throw new Error('Paystack payment verification failed.');
            }
        } else {
            throw new Error('Invalid payment method.');
        }

        if (paymentVerified) {
            order.paid = true;
            order.paymentInfo.method = paymentMethod;
            order.paymentInfo.status = 'paid';
            order.paymentInfo.paidAt = new Date();
            order.status = 'processing';

            await updateProductStock(order.items, session);

            if (!order.isStorePickup && !order.isInternational) {
                const arrangementResult = await arrangeShipmentHelper(order, order.shipping.rate_id, session);
                if (!arrangementResult.success) {
                    console.error(`CRITICAL: Payment succeeded for order ${order.order_id} but shipment arrangement failed: ${arrangementResult.error}`);
                    
                    // Refund the amount to the buyer's wallet
                    await refundOrder(order, session);
                    
                    // Update order status to reflect failure
                    order.status = 'failed';
                    // Also set shipping tracking status to failed if tracking exists
                    if (order.shipping && order.shipping.tracking) {
                        order.shipping.tracking.status = 'failed';
                        // Optionally, add to tracking history
                        if (!order.shipping.tracking.history) {
                            order.shipping.tracking.history = [];
                        }
                        order.shipping.tracking.history.push({
                            status: 'failed',
                            timestamp: new Date(),
                            description: `Shipment arrangement failed after payment. Reason: ${arrangementResult.error}`
                        });
                    }
                    if (!order.statusHistory) {
                        order.statusHistory = [];
                    }
                    order.statusHistory.push({
                        status: 'failed',
                        note: `Shipment arrangement failed after payment. Amount refunded to wallet. Reason: ${arrangementResult.error}`
                    });

                    await order.save({ session });
                    await session.commitTransaction(); // Commit the refund and status change
                    session.endSession();

                    // Send notification email outside of the transaction
                    try {
                        const buyer = await Buyer.findById(order.buyer);
                        if (buyer) {
                            await arrangeShipmentHelper.sendShipmentFailureEmail(order, buyer, arrangementResult.error);
                        }
                    } catch (emailError) {
                        console.error(`Failed to send shipment failure email for order ${order.order_id}:`, emailError);
                    }

                    throw new Error(`Something went wrong. Please try again with a different carrier.`);
                }
            }
            
            await order.save({ session });
            await session.commitTransaction();
            session.endSession();

            // Send notifications
            try {
                const buyer = await Buyer.findById(order.buyer);
                const seller = await Seller.findById(order.seller);

                if (buyer && seller) {
                    const sellerName = seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`;
                    
                    await arrangeShipmentHelper.sendSlackNotificationForPaidOrder(order, buyer, sellerName);
                    await arrangeShipmentHelper.sendOrderConfirmationEmail(order, buyer);
                    await arrangeShipmentHelper.sendSellerOrderNotificationEmail(order, seller);
                }
            } catch (notificationError) {
                console.error(`Failed to send notifications for order ${order.order_id}:`, notificationError);
            }

            return {
                message: 'Payment successful and order is now being processed.',
                order_id: order.order_id,
                status: order.status,
                paid: order.paid
            };
        } else {
            throw new Error('Payment could not be verified.');
        }

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        throw error;
    }
};

// Helper to calculate refund amount (items total + shipping if paid)
function calculateRefundAmount(order) {
    const itemsTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (FREE_SHIPPING_PROMO) {
        return itemsTotal;
    }
    const shippingFee = order.shipping && order.shipping.fee && order.shipping.fee.amount > 0 ? order.shipping.fee.amount : 0;
    return itemsTotal + shippingFee;
}

async function refundOrder(order, session) {
    const buyer = await Buyer.findById(order.buyer).session(session);
    if (!buyer) {
        throw new Error('Buyer not found for refund.');
    }

    // Revert stock before refunding
    await revertProductStock(order.items, session);

    // Calculate correct refund amount (exclude shipping if free)
    const refundAmount = calculateRefundAmount(order);

    buyer.wallet.balance += refundAmount;
    buyer.wallet.transactions.push({
        type: 'credit',
        amount: refundAmount,
        description: `Refund for failed order ${order.order_id}`,
        status: 'completed',
        paymentReference: `refund-${order.order_id}`
    });

    await buyer.save({ session });
}

async function updateProductStock(items, session) {
  for (const item of items) {
    await Product.findByIdAndUpdate(
      item.product,
      {
        $inc: {
          'stats.soldCount': item.quantity,
          'stock': -item.quantity,
          'inventory.quantity': -item.quantity
        }
      },
      { new: true, session }
    );
  }
} 

async function revertProductStock(items, session) {
    for (const item of items) {
        await Product.findByIdAndUpdate(
            item.product,
            {
                $inc: {
                    'stats.soldCount': -item.quantity,
                    'stock': item.quantity,
                    'inventory.quantity': item.quantity
                }
            },
            { new: true, session }
        );
    }
} 