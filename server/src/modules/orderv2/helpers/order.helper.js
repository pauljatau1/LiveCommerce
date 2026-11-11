const { sellerAppLink } = require('../../../utils/helpers');
const { formatAddressForTerminal: coreFormatAddressForTerminal } = require('../../../helpers/formatters');
const { formatAddress } = require('./address.helper');
const terminalAPI = require('../../../config/terminalAPI');
const Order = require('../models/order.model');
const Product = require('../../../models/Product');
const Seller = require('../../../models/Seller');
const Buyer = require('../../../models/Buyer');
const termiiEmailService = require('../../../services/termiiEmailService');
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

// Add logging interceptors to Paystack client
paystack.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`[Paystack API] REQUEST: ${config.method.toUpperCase()} ${fullUrl}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

paystack.interceptors.response.use(
  (response) => {
    const endTime = Date.now();
    const duration = (endTime - response.config.metadata.startTime) / 1000;
    const fullUrl = `${response.config.baseURL}${response.config.url}`;
    console.log(`[Paystack API] RESPONSE: ${response.config.method.toUpperCase()} ${fullUrl} | Duration: ${duration.toFixed(3)} seconds`);
    return response;
  },
  (error) => {
    if (error.config && error.config.metadata) {
      const endTime = Date.now();
      const duration = (endTime - error.config.metadata.startTime) / 1000;
      const fullUrl = `${error.config.baseURL}${error.config.url}`;
      console.log(`[Paystack API] ERROR: ${error.config.method.toUpperCase()} ${fullUrl} | Duration: ${duration.toFixed(3)} seconds | Status: ${error.response?.status || 'N/A'}`);
    }
    return Promise.reject(error);
  }
);


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

    await termiiEmailService.sendRawHTMLEmail({
      email: slackEmailMsg.to,
      subject: slackEmailMsg.subject,
      html: slackEmailMsg.html
    });
    console.log('✅ Slack notification sent for paid order:', order.order_id);
  } catch (error) {
    console.error('Error sending Slack notification for paid order:', error);
  }
};

exports.sendOrderConfirmationEmail = async (order, buyer) => {
  try {
    const seller = await Seller.findById(order.seller);
    const sellerName = seller ? (seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`) : 'Unknown Seller';

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7;">
          <span style="color: #1a1a2e; font-weight: 500;">${item.productName}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7; text-align: center; color: #64748b;">×${item.quantity}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7; text-align: right; color: #1a1a2e; font-weight: 600;">₦${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const emailMsg = {
      to: buyer.email,
      from: {
        email: 'support@auqli.com',
        name: 'Auqli'
      },
      subject: `Order Confirmed! #${order.order_id}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli" style="width: 120px; margin-bottom: 24px;">
            </div>
            
            <!-- Main Card -->
            <div style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
              
              <!-- Success Banner -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
                <div style="width: 64px; height: 64px; line-height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; text-align: center;">
                  <span style="font-size: 32px; vertical-align: middle;">✓</span>
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Order Confirmed!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px;">Thank you for shopping with us</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 32px 24px;">
                
                <!-- Greeting -->
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  Hi <strong>${buyer.firstName}</strong>,<br><br>
                  Great news! Your order has been confirmed and is being prepared for shipping.
                </p>
                
                <!-- Order Info Card -->
                <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Order Number</td>
                      <td style="padding: 8px 0; text-align: right; color: #1a1a2e; font-weight: 600; font-size: 14px;">#${order.order_id}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Seller</td>
                      <td style="padding: 8px 0; text-align: right; color: #1a1a2e; font-weight: 500; font-size: 14px;">${sellerName}</td>
                    </tr>
                    ${order.shipping?.tracking?.number ? `
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Tracking</td>
                      <td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: 600; font-size: 14px;">${order.shipping.tracking.number}</td>
                    </tr>
                    ` : ''}
                  </table>
                </div>
                
                <!-- Items Section -->
                <h3 style="color: #1a1a2e; font-size: 16px; font-weight: 600; margin: 0 0 16px; padding-bottom: 12px; border-bottom: 2px solid #10b981;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                  <thead>
                    <tr>
                      <th style="text-align: left; padding: 12px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                      <th style="text-align: center; padding: 12px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                      <th style="text-align: right; padding: 12px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" style="padding: 16px 0 0; text-align: right; color: #374151; font-weight: 600;">Total</td>
                      <td style="padding: 16px 0 0; text-align: right; color: #10b981; font-size: 20px; font-weight: 700;">₦${order.totalAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
                
                <!-- Next Steps -->
                <div style="background: #ecfdf5; border-radius: 12px; padding: 20px; border-left: 4px solid #10b981;">
                  <h4 style="color: #065f46; margin: 0 0 8px; font-size: 14px; font-weight: 600;">What's Next?</h4>
                  <p style="color: #047857; margin: 0; font-size: 14px; line-height: 1.5;">
                    We'll send you an email with tracking details once your order ships.
                  </p>
                </div>
                
              </div>
              
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 32px 20px;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px;">Need help? Contact us at <a href="mailto:support@auqli.com" style="color: #10b981; text-decoration: none;">support@auqli.com</a></p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
            </div>
            
          </div>
        </body>
        </html>
      `
    };

    await termiiEmailService.sendRawHTMLEmail({
      email: emailMsg.to,
      subject: emailMsg.subject,
      html: emailMsg.html
    });
    console.log('✅ Order confirmation email sent for order:', order.order_id);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
};

exports.sendSellerOrderNotificationEmail = async (order, seller) => {
  try {
    const buyer = await Buyer.findById(order.buyer);

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7;">
          <span style="color: #1a1a2e; font-weight: 500;">${item.productName}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7; text-align: center; color: #64748b;">×${item.quantity}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7; text-align: right; color: #1a1a2e; font-weight: 600;">₦${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const emailMsg = {
      to: seller.email,
      from: {
        email: 'support@auqli.com',
        name: 'Auqli'
      },
      subject: `New Order Received! #${order.order_id}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli" style="width: 120px; margin-bottom: 24px;">
            </div>
            
            <!-- Main Card -->
            <div style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
              
              <!-- Success Banner -->
              <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 32px 24px; text-align: center;">
                <div style="width: 64px; height: 64px; line-height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; text-align: center;">
                  <span style="font-size: 32px; vertical-align: middle;">🎉</span>
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">New Order Received!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px;">You've made a sale on Auqli</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 32px 24px;">
                
                <!-- Greeting -->
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  Hi <strong>${seller.businessName || seller.firstName}</strong>,<br><br>
                  Great news! A customer has placed an order for items from your store.
                </p>
                
                <!-- Order Info Card -->
                <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Order Number</td>
                      <td style="padding: 8px 0; text-align: right; color: #1a1a2e; font-weight: 600; font-size: 14px;">#${order.order_id}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Customer</td>
                      <td style="padding: 8px 0; text-align: right; color: #1a1a2e; font-weight: 500; font-size: 14px;">${buyer.firstName} ${buyer.lastName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Order Date</td>
                      <td style="padding: 8px 0; text-align: right; color: #1a1a2e; font-weight: 500; font-size: 14px;">${new Date().toLocaleDateString('en-NG', { dateStyle: 'medium' })}</td>
                    </tr>
                  </table>
                </div>
                
                <!-- Items Section -->
                <h3 style="color: #1a1a2e; font-size: 16px; font-weight: 600; margin: 0 0 16px; padding-bottom: 12px; border-bottom: 2px solid #8b5cf6;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                  <thead>
                    <tr>
                      <th style="text-align: left; padding: 12px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                      <th style="text-align: center; padding: 12px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                      <th style="text-align: right; padding: 12px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" style="padding: 16px 0 0; text-align: right; color: #374151; font-weight: 600;">Order Total</td>
                      <td style="padding: 16px 0 0; text-align: right; color: #8b5cf6; font-size: 20px; font-weight: 700;">₦${order.totalAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
                
                <!-- Action Required -->
                <div style="background: #faf5ff; border-radius: 12px; padding: 20px; border-left: 4px solid #8b5cf6;">
                  <h4 style="color: #6b21a8; margin: 0 0 8px; font-size: 14px; font-weight: 600;">📦 Action Required</h4>
                  <p style="color: #7c3aed; margin: 0; font-size: 14px; line-height: 1.5;">
                    Please prepare this order for shipping. Visit your seller dashboard for full order details and shipping instructions.
                  </p>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin-top: 24px;">
                  <a href="${sellerAppLink('orders')}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">View Order Details</a>
                </div>
                
              </div>
              
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 32px 20px;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px;">Need help? Contact us at <a href="mailto:support@auqli.com" style="color: #8b5cf6; text-decoration: none;">support@auqli.com</a></p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
            </div>
            
          </div>
        </body>
        </html>
      `
    };

    await termiiEmailService.sendRawHTMLEmail({
      email: emailMsg.to,
      subject: emailMsg.subject,
      html: emailMsg.html
    });
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
        name: 'Auqli'
      },
      subject: `Shipment Issue - Order #${order.order_id}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli" style="width: 120px; margin-bottom: 24px;">
            </div>
            
            <!-- Main Card -->
            <div style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
              
              <!-- Warning Banner -->
              <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px 24px; text-align: center;">
                <div style="width: 64px; height: 64px; line-height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; text-align: center;">
                  <span style="font-size: 32px; vertical-align: middle;">⚠️</span>
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Shipment Issue Detected</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px;">We need to let you know about your order</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 32px 24px;">
                
                <!-- Greeting -->
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  Hi <strong>${buyer.firstName}</strong>,<br><br>
                  We're sorry, but we encountered an issue while arranging the shipment for your order.
                </p>
                
                <!-- Issue Details -->
                <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #ef4444;">
                  <h4 style="color: #dc2626; margin: 0 0 8px; font-size: 14px; font-weight: 600;">Issue Details</h4>
                  <p style="color: #991b1b; margin: 0; font-size: 14px; line-height: 1.5;">${reason}</p>
                </div>
                
                <!-- Order Info -->
                <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Order Number</td>
                      <td style="padding: 8px 0; text-align: right; color: #1a1a2e; font-weight: 600; font-size: 14px;">#${order.order_id}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Status</td>
                      <td style="padding: 8px 0; text-align: right; color: #f97316; font-weight: 600; font-size: 14px;">Shipment Failed</td>
                    </tr>
                  </table>
                </div>
                
                <!-- Refund Notice -->
                <div style="background: #ecfdf5; border-radius: 12px; padding: 20px; border-left: 4px solid #10b981;">
                  <h4 style="color: #065f46; margin: 0 0 12px; font-size: 14px; font-weight: 600;">✓ Refund Processed</h4>
                  <p style="color: #047857; margin: 0 0 8px; font-size: 14px; line-height: 1.5;">
                    Your payment has been refunded to your Auqli wallet.
                  </p>
                  <p style="color: #10b981; margin: 0; font-size: 24px; font-weight: 700;">₦${order.totalAmount.toLocaleString()}</p>
                </div>
                
                <!-- Help Section -->
                <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0; text-align: center;">
                  Questions? Contact us at <a href="mailto:support@auqli.com" style="color: #f97316; text-decoration: none; font-weight: 500;">support@auqli.com</a>
                </p>
                
              </div>
              
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 32px 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
            </div>
            
          </div>
        </body>
        </html>
      `
    };

    await termiiEmailService.sendRawHTMLEmail({
      email: emailMsg.to,
      subject: emailMsg.subject,
      html: emailMsg.html
    });
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

        await termiiEmailService.sendRawHTMLEmail({
          email: failedPaymentEmail.to,
          subject: failedPaymentEmail.subject,
          html: failedPaymentEmail.html
        });
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
    await termiiEmailService.sendRawHTMLEmail({
      email: msg.to,
      subject: msg.subject,
      html: msg.html
    });
    console.log('Simple wallet top-up confirmation email sent to:', buyer.email);
    return true;
  } catch (error) {
    console.error('Error sending simple wallet top-up email:', error.message);
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
