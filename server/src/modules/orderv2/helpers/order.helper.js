const { formatAddressForTerminal: coreFormatAddressForTerminal } = require('../../../helpers/formatters');
const { formatAddress } = require('./address.helper');
const terminalAPI = require('../../../config/terminalAPI');
const Order = require('../models/order.model');
const Product = require('../../../models/Product');
const Seller = require('../../../models/Seller');
const Buyer = require('../../buyer/models/buyer.model');
const sgMail = require('@sendgrid/mail');
const axios = require('axios');

// Initialize Paystack for Terminal Africa orders
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
const paystack = require('axios').create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${paystackSecretKey}`,
    'Content-Type': 'application/json'
  }
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Helper validation functions
exports.validateItems = (items) => {
  if (!items || items.length === 0) {
    return { valid: false, message: 'Items are required' };
  }
  return { valid: true };
};

exports.validateAddress = (address) => {
  if (!address) {
    return { valid: false, message: 'Shipping address is required' };
  }

  // Address may be in raw format (recipientAddress) or already formatted (line1)
  const hasLine1 = address.recipientAddress || address.line1;

  if (!hasLine1) {
    return { valid: false, message: 'Shipping address line1 is required' };
  }

  return { valid: true };
};

exports.formatAddressForTerminal = (address) => {
  const businessLogicFormattedAddress = formatAddress(address);
  return coreFormatAddressForTerminal(businessLogicFormattedAddress);
};

exports.determinePickupAddress = (seller, senderInfo) => {
  if (senderInfo.senderAddress) {
    const senderName = senderInfo.senderName || `${seller.firstName} ${seller.lastName}`.trim();
    return exports.formatAddressForTerminal({
      recipientName: senderName,
      recipientEmail: senderInfo.senderEmail || seller.email,
      recipientPhone: senderInfo.senderPhone || seller.phoneNumber,
      recipientAddress: senderInfo.senderAddress,
      recipientState: senderInfo.pickUpState || "Lagos",
      recipientCity: '',
      recipientZip: '',
      country: 'NG'
    });
  } else if (seller.sellerAddress?.addressLine1) {
    const sellerName = `${seller.firstName} ${seller.lastName}`.trim();
    return exports.formatAddressForTerminal({
      ...seller.sellerAddress,
      recipientName: sellerName,
      recipientEmail: seller.email,
      recipientPhone: seller.phoneNumber,
      country: 'NG'
    });
  } else if (seller.businessAddress?.addressLine1) {
    const sellerName = `${seller.firstName} ${seller.lastName}`.trim();
    return exports.formatAddressForTerminal({
      ...seller.businessAddress,
      recipientName: sellerName,
      recipientEmail: seller.email,
      recipientPhone: seller.phoneNumber,
      country: 'NG'
    });
  } else if (seller.warehouseDetails?.address?.addressLine1) {
    const sellerName = `${seller.firstName} ${seller.lastName}`.trim();
    return exports.formatAddressForTerminal({
      ...seller.warehouseDetails.address,
      recipientName: sellerName,
      recipientEmail: seller.email,
      recipientPhone: seller.phoneNumber || seller.warehouseDetails.contactNumber,
      country: 'NG'
    });
  } else if (seller.address) {
    const sellerName = `${seller.firstName} ${seller.lastName}`.trim();
    return exports.formatAddressForTerminal({
      recipientName: sellerName,
      recipientEmail: seller.email,
      recipientPhone: seller.phoneNumber,
      recipientAddress: seller.address,
      recipientState: seller.state || 'Lagos',
      recipientCity: '',
      recipientZip: seller.zipCode || seller.zip || '',
      country: 'NG'
    });
  } else {
    const sellerName = `${seller.firstName} ${seller.lastName}`.trim();
    return exports.formatAddressForTerminal({
      recipientName: sellerName,
      recipientEmail: seller.email,
      recipientPhone: seller.phoneNumber,
      recipientAddress: 'Address not provided',
      recipientState: 'Lagos',
      recipientCity: '',
      recipientZip: seller.zipCode || seller.zip || '',
      country: 'NG'
    });
  }
};

// Core payment and order functions - using the exact implementations from original controller
exports.verifyPaystackTransaction = async (reference) => {
  try {
    const response = await paystack.get(`/transaction/verify/${reference}`);
    return {
      success: response.data.status === true && response.data.data.status === 'success',
      data: response.data.data
    };
  } catch (error) {
    console.error('Error verifying Paystack transaction:', error);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

exports.updateProductStockForPaidOrder = async (order) => {
  try {
    console.log(`Updating product stock for paid Terminal Africa order: ${order.order_id}`);
    
    for (const item of order.items) {
      const productBefore = await Product.findById(item.product);
      
      if (!productBefore) {
        console.error(`Product not found for item in order ${order.order_id}:`, item.product);
        continue;
      }
      
      console.log(`Product ${item.product} before stock update:`, {
        currentStock: productBefore.stock,
        currentSoldCount: productBefore.stats.soldCount,
        itemQuantity: item.quantity
      });

      // Actually update the product stock and sold count
      const updateResult = await Product.findByIdAndUpdate(
        item.product,
        { 
          $inc: { 
            'stats.soldCount': item.quantity,
            'stock': -item.quantity,
            'inventory.quantity': -item.quantity 
          }
        },
        { new: true } // Return the updated document
      );

      console.log(`Product ${item.product} after stock update:`, {
        newStock: updateResult.stock,
        newSoldCount: updateResult.stats.soldCount,
        updateSuccessful: !!updateResult
      });
    }
    
    console.log(`✅ Product stock updated successfully for order: ${order.order_id}`);
    return true;
  } catch (error) {
    console.error(`Error updating product stock for order ${order.order_id}:`, error);
    return false;
  }
};

exports.sendSlackNotificationForPaidOrder = async (order, buyer, sellerName) => {
  try {
    const slackEmailMsg = {
      to: 'orders-aaaaqm2ugmdudvf4jsgf3koetm@auqli.slack.com',
      from: {
        email: 'support@auqli.com',
        name: 'Auqli Orders'
      },
      subject: 'New Paid Order, on Auqli',
      html: `
        <div style="background: #f6f8fa; font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(44,62,80,0.10);">
          <div style="background: #4CAF50; padding: 24px 0; text-align: center;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 120px; margin-bottom: 10px;">
            <h2 style="color: #fff; margin: 0; font-size: 26px; letter-spacing: 1px;">New Paid Order on Auqli</h2>
          </div>
          <div style="padding: 28px 32px 24px 32px; background: #fff;">
            <p style="font-size: 17px; color: #222; margin-bottom: 18px;">🎉 <strong>A new order has been paid on Auqli!</strong></p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
              <tr>
                <td style="padding: 8px 0; color: #555; font-weight: 500;">Order ID:</td>
                <td style="padding: 8px 0; color: #222; font-weight: 600;">${order.order_id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555; font-weight: 500;">Buyer:</td>
                <td style="padding: 8px 0; color: #222;">${buyer.firstName} ${buyer.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555; font-weight: 500;">Store:</td>
                <td style="padding: 8px 0; color: #222;">${sellerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555; font-weight: 500;">Payment Method:</td>
                <td style="padding: 8px 0; color: #222;">${order.paymentInfo.method}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555; font-weight: 500;">Amount:</td>
                <td style="padding: 8px 0; color: #4CAF50; font-weight: 700; font-size: 18px;">₦${order.totalAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555; font-weight: 500;">Time:</td>
                <td style="padding: 8px 0; color: #222;">${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</td>
              </tr>
            </table>
            <div style="margin-top: 18px; text-align: center;">
              <a href="https://admin.auqli.live/orders" style="display: inline-block; background: #4CAF50; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">View Order</a>
            </div>
          </div>
          <div style="background: #f6f8fa; color: #888; font-size: 13px; text-align: center; padding: 16px 0 10px 0;">
            <span>Auqli Orders &mdash; ${new Date().getFullYear()}</span>
          </div>
        </div>
      `
    };

    await sgMail.send(slackEmailMsg);
    console.log('✅ Slack notification sent for paid order:', order.order_id);
  } catch (error) {
    console.error('Error sending Slack notification for paid order:', error);
  }
};

exports.sendOrderConfirmationEmail = async (order, buyer) => {
  try {
    const seller = await Seller.findById(order.seller);
    const sellerName = seller ? (seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`) : 'Unknown Seller';
    
    const emailMsg = {
      to: buyer.email,
      from: {
        email: 'support@auqli.com',
        name: 'Auqli Orders'
      },
      subject: `Your Auqli Order is Confirmed! #${order.order_id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; text-align: center;">
          <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 20px;">
          <h2>Your Order is Confirmed!</h2>
          <p>Hi ${buyer.firstName},</p>
          <p>Thank you for your purchase! We've received your order #${order.order_id} and are getting it ready.</p>
          
          <div style="text-align: left; margin-top: 20px;">
            <p><strong>Order ID:</strong> ${order.order_id}</p>
            <p><strong>Seller:</strong> ${sellerName}</p>
           
            <p><strong>Items:</strong></p>
            <ul>
              ${order.items.map(item => `<li>${item.productName} (Qty: ${item.quantity})</li>`).join('')}
            </ul>
            ${order.shipping?.tracking?.number ? `<p><strong>Tracking Number:</strong> ${order.shipping.tracking.number}</p>` : ''}
          </div>

          <p style="margin-top: 20px;">We'll notify you when your order has shipped.</p>
          <br>
          <p>Thanks,</p>
          <p><strong>The Auqli Team</strong></p>
        </div>
      `
    };

    await sgMail.send(emailMsg);
    console.log('✅ Order confirmation email sent for order:', order.order_id);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
};

exports.sendSellerOrderNotificationEmail = async (order, seller) => {
  try {
    const buyer = await Buyer.findById(order.buyer);
    const emailMsg = {
      to: seller.email,
      from: {
        email: 'support@auqli.com',
        name: 'Auqli Orders'
      },
      subject: `You've Received a New Order! #${order.order_id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; text-align: center;">
          <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 20px;">
          <h2>You've Got a New Order!</h2>
          <p>Hi ${seller.businessName || seller.firstName},</p>
          <p>Great news! An item from your store has been sold on Auqli.</p>

          <div style="text-align: left; margin-top: 20px;">
            <p><strong>Order ID:</strong> ${order.order_id}</p>
            <p><strong>Buyer:</strong> ${buyer.firstName} ${buyer.lastName}</p>
            <p><strong>Items:</strong></p>
            <ul>
              ${order.items.map(item => `<li>${item.productName} (Qty: ${item.quantity})</li>`).join('')}
            </ul>
           
          </div>

          <p style="margin-top: 20px;">Please prepare the items for shipping. You can view the full order details in your seller dashboard.</p>
          <br>
          <p>Thanks,</p>
          <p><strong>The Auqli Team</strong></p>
        </div>
      `
    };

    await sgMail.send(emailMsg);
    console.log('✅ New order notification email sent to seller for order:', order.order_id);
  } catch (error) {
    console.error('Error sending new order notification email to seller:', error);
  }
};

exports.sendShipmentFailureEmail = async (order, buyer, reason) => {
  try {
    const emailMsg = {
      to: buyer.email,
      from: {
        email: 'support@auqli.com',
        name: 'Auqli Support'
      },
      subject: `Action Required: Shipment Issue with Your Auqli Order #${order.order_id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; text-align: center;">
          <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 20px;">
          <h2>Shipment Arrangement Failed</h2>
          <p>Hi ${buyer.firstName},</p>
          <p>We're sorry, but we encountered an issue while arranging the shipment for your order #${order.order_id}.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <div style="text-align: left; margin-top: 20px;">
            <p><strong>The amount of ₦${order.totalAmount.toLocaleString()} for this order has been refunded to your Auqli wallet.</strong></p>
            <p>You can use your wallet balance for future purchases.</p>
          </div>
          <p style="margin-top: 20px;">If you have any questions or need to update your address for future orders, please contact our support team.</p>
          <br>
          <p>We apologize for any inconvenience.</p>
          <p>Thanks,</p>
          <p><strong>The Auqli Team.</strong></p>
        </div>
      `
    };

    await sgMail.send(emailMsg);
    console.log(`✅ Shipment failure email sent for order: ${order.order_id}`);
  } catch (error) {
    console.error('Error sending shipment failure email:', error);
  }
};


// Wallet top-up handler - from original function
exports.handleWalletTopUp = async (paymentData) => {
  const { reference, metadata } = paymentData;
  const buyerId = metadata.buyerId;
  
  const buyer = await Buyer.findById(buyerId);
  
  if (!buyer) {
    return { status: 200, data: { message: 'Buyer not found, but acknowledging webhook' } };
  }

  // Check if transaction is already completed
  const existingTransaction = buyer.wallet.transactions.find(
    t => t.paymentReference === reference
  );

  if (existingTransaction && existingTransaction.status === 'completed') {
    return { status: 200, data: { message: 'Payment already processed' } };
  }

  // If transaction exists but is pending, update it
  if (existingTransaction && existingTransaction.status === 'pending') {
    existingTransaction.status = 'completed';
    buyer.wallet.balance += existingTransaction.amount;
    await buyer.save();
    
    // Send confirmation email
    try {
      await sendSimpleTopUpEmail(buyer, existingTransaction);
    } catch (emailError) {
      console.error('Error sending wallet top-up email:', emailError);
    }
    
    return { status: 200, data: { message: 'Wallet topped up successfully via webhook' } };
  }

  // If no transaction found, create a new one
  const amount = paymentData.amount / 100;
  
  const newTransaction = {
    type: 'credit',
    amount,
    paymentReference: reference,
    description: metadata.description || 'Wallet top up via Paystack',
    status: 'completed',
    createdAt: new Date()
  };

  buyer.wallet.transactions.push(newTransaction);
  buyer.wallet.balance += amount;
  
  await buyer.save();
  
  // Send confirmation email
  try {
    await sendSimpleTopUpEmail(buyer, newTransaction);
  } catch (emailError) {
    console.error('Error sending wallet top-up email:', emailError);
  }
  
  return { status: 200, data: { message: 'Wallet topped up successfully via webhook' } };
};

// Failed payment handler - from original function
exports.handleFailedPayment = async (paymentData) => {
  const { reference, metadata } = paymentData;
  
  if (!metadata || !metadata.orderId) {
    return { status: 200, data: { message: 'No order metadata found in failed payment' } };
  }
  
  try {
    const order = await Order.findById(metadata.orderId);
  
    if (!order) {
      return { status: 200, data: { message: 'Order not found for failed payment' } };
    }
    
    // Check if this order has already been processed (paid or cancelled)
    if (order.paid || !order.isOpen) {
      return { status: 200, data: { message: 'Order already processed, ignoring failed payment' } };
    }
    
    console.log(`Processing failed payment for Terminal Africa order ${order.order_id}`, {
      reference,
      orderStatus: order.paymentInfo.status,
      isOpen: order.isOpen,
      paymentMethod: order.paymentInfo.method
    });
    
    // Check if this is a hybrid payment (wallet + Paystack)
    const isHybridPayment = order.paymentInfo && order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
    
    if (isHybridPayment) {
      console.log(`Failed payment was hybrid for Terminal Africa order ${order.order_id}`, {
        totalAmount: order.totalAmount,
        walletAmountUsed: order.paymentInfo.walletAmountUsed,
        paystackAmount: order.totalAmount - order.paymentInfo.walletAmountUsed
      });
      
      // If wallet was already used, we need to refund it
      if (order.paymentInfo.walletAmountUsed > 0) {
        const buyer = await Buyer.findById(order.buyer);
        
        if (buyer) {
          // Refund the wallet amount that was used
          const walletTransaction = {
            type: 'credit',
            amount: order.paymentInfo.walletAmountUsed,
            description: `Refund for failed Terminal Africa order ${order.order_id}`,
            status: 'completed',
            createdAt: new Date()
          };
          
          // Add transaction to wallet
          buyer.wallet.balance += order.paymentInfo.walletAmountUsed;
          buyer.wallet.transactions.push(walletTransaction);
          
          // Save buyer with updated wallet
          await buyer.save();
          
          console.log(`Refunded wallet amount for failed hybrid payment: ${order.paymentInfo.walletAmountUsed}`, {
            orderId: order._id,
            buyer: buyer._id,
            newWalletBalance: buyer.wallet.balance
          });
        } else {
          console.error(`Could not find buyer ${order.buyer} to refund wallet amount for failed Terminal Africa order ${order.order_id}`);
        }
      }
    }
    
    // Mark order as closed with appropriate reason
    order.isOpen = false;
    order.closedAt = new Date();
    order.closedBy = 'auto';
    order.closedReason = `Payment failed: ${paymentData.gateway_response || 'Unknown payment failure'}`;
    
    // Also update items status to cancelled
    order.items.forEach(item => {
      item.status = 'cancelled';
      if (!item.statusHistory) {
        item.statusHistory = [];
      }
      item.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: 'Payment failed'
      });
    });
    
    await order.save();
    
    // Notify the buyer about the failed payment
    const buyer = await Buyer.findById(order.buyer);
    
    if (buyer && buyer.email) {
      try {
        // Prepare email content
        let emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Failed</h2>
            <p>Dear ${buyer.firstName},</p>
            <p>Your payment for Terminal Africa order #${order.order_id} was not successful.</p>
            <p><strong>Reason:</strong> ${paymentData.gateway_response || 'Payment could not be processed'}</p>
            <p><strong>Order Details:</strong></p>
            <ul>
              <li>Order ID: ${order.order_id}</li>
              <li>Amount: ₦${order.totalAmount.toLocaleString()}</li>
            </ul>
        `;
        
        // Add wallet refund info if applicable
        if (isHybridPayment && order.paymentInfo.walletAmountUsed > 0) {
          emailContent += `
            <p><strong>Wallet Refund:</strong> Your wallet credit of ₦${order.paymentInfo.walletAmountUsed.toLocaleString()} used for this order has been refunded to your wallet.</p>
          `;
        }
        
        emailContent += `
            <p>If you would still like to purchase these items, please place a new order.</p>
            <p>If you believe this is an error, please contact our support team.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `;
        
        const failedPaymentEmail = {
          to: buyer.email,
          from: {
            email: 'support@auqli.com',
            name: 'Auqli Support'
          },
          subject: 'Payment Failed - Terminal Africa Order',
          html: emailContent
        };
        
        await sgMail.send(failedPaymentEmail);
        console.log('Failed payment notification email sent to buyer');
      } catch (emailError) {
        console.error('Error sending failed payment notification email:', emailError);
      }
    }
    
    return { status: 200, data: { message: 'Failed payment processed successfully' } };
  } catch (error) {
    console.error('Error processing failed payment:', error);
    return { status: 200, data: { message: 'Error processing failed payment, but acknowledging receipt' } };
  }
};

// Simple email function for wallet top-up - from original
async function sendSimpleTopUpEmail(buyer, transaction) {
  const formattedAmount = transaction.amount.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN'
  });
  
  const msg = {
    to: buyer.email,
    from: {
      email: 'support@auqli.com',
      name: 'Auqli Support'
    },
    subject: 'Wallet Top-Up Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Wallet Top-Up Confirmation</h2>
        <p>Hello ${buyer.firstName},</p>
        <p>Your wallet has been successfully topped up with ${formattedAmount}.</p>
        <p>Transaction ID: ${transaction.paymentReference}</p>
        <p>Current Balance: ${buyer.wallet.balance.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</p>
        <p>Thank you for using Auqli!</p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('Simple wallet top-up confirmation email sent to:', buyer.email);
    return true;
  } catch (error) {
    console.error('Error sending simple wallet top-up email:', error);
    return false;
  }
}

// Shipment arrangement helper (existing function)
const arrangeShipmentHelper = async (order, rateId, session = null) => {
  try {
    console.log(`Arranging pickup for order: ${order.order_id}, shipment: ${order.shipping?.shipment_id}, rate: ${rateId}`);

    // Call Terminal Africa API to arrange pickup
    const arrangePickupResponse = await terminalAPI.post('/shipments/pickup', {
      rate_id: rateId,
      shipment_id: order.shipping?.shipment_id,
      purchase_insurance: false
    });

    console.log('Terminal Africa Arrange Pickup Response:', {
      status: arrangePickupResponse.data.status,
      message: arrangePickupResponse.data.message
    });

    if (!arrangePickupResponse.data.status) {
      throw new Error(arrangePickupResponse.data.message || 'Failed to arrange shipment with Terminal Africa');
    }

    // Extract tracking information from the response
    const responseData = arrangePickupResponse.data.data;
    const extras = responseData.extras || {};

    // Update the order with tracking information
    if (extras.tracking_number) {
      order.shipping.tracking.number = extras.tracking_number;
    }

    if (extras.tracking_url) {
      order.shipping.tracking.url = extras.tracking_url;
    }

    // Update shipping documents
    if (!order.shipping.documents) {
      order.shipping.documents = {};
    }

    if (extras.shipping_label_url) {
      order.shipping.documents.shippingLabel = extras.shipping_label_url;
    }

    if (extras.commercial_invoice_url) {
      order.shipping.documents.commercialInvoice = extras.commercial_invoice_url;
    }

    // Update carrier tracking URL
    if (extras.carrier_tracking_url && order.shipping.carrier) {
      order.shipping.carrier.trackingUrl = extras.carrier_tracking_url;
    }

    // Update tracking status
    order.shipping.tracking.status = 'confirmed';
    order.shipping.tracking.lastUpdate = new Date();

    // Add to tracking history
    if (!order.shipping.tracking.history) {
      order.shipping.tracking.history = [];
    }

    // Add event to tracking history
    if (responseData.events && responseData.events.length > 0) {
      for (const event of responseData.events) {
        order.shipping.tracking.history.push({
          status: event.status,
          timestamp: new Date(event.created_at),
          location: event.location,
          description: event.description
        });
      }
    } else {
      // Add a default event if none provided
      order.shipping.tracking.history.push({
        status: 'confirmed',
        timestamp: new Date(),
        description: 'Shipment arranged'
      });
    }

    // Save the updated order
    if (session) {
      await order.save({ session });
    } else {
      await order.save();
    }

    return {
      success: true,
      tracking: {
        number: extras.tracking_number,
        url: extras.tracking_url,
        carrier_url: extras.carrier_tracking_url
      },
      documents: {
        shipping_label: extras.shipping_label_url,
        commercial_invoice: extras.commercial_invoice_url
      }
    };

  } catch (error) {
    console.error('Error in arrangeShipmentHelper:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// Attach utility helpers so they can be accessed via destructuring
arrangeShipmentHelper.validateItems = exports.validateItems;
arrangeShipmentHelper.validateAddress = exports.validateAddress;
arrangeShipmentHelper.formatAddressForTerminal = exports.formatAddressForTerminal;
arrangeShipmentHelper.determinePickupAddress = exports.determinePickupAddress;
arrangeShipmentHelper.verifyPaystackTransaction = exports.verifyPaystackTransaction;
arrangeShipmentHelper.sendSlackNotificationForPaidOrder = exports.sendSlackNotificationForPaidOrder;
arrangeShipmentHelper.sendOrderConfirmationEmail = exports.sendOrderConfirmationEmail;
arrangeShipmentHelper.sendSellerOrderNotificationEmail = exports.sendSellerOrderNotificationEmail;
arrangeShipmentHelper.sendShipmentFailureEmail = exports.sendShipmentFailureEmail;

module.exports = arrangeShipmentHelper;
  