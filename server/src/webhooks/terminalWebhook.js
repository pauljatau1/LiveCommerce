const { agenda } = require('../config/agenda');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Order = require('../models/Order');
const sgMail = require('@sendgrid/mail');
const {
  getShipmentCreatedEmailTemplate,
  getShipmentInTransitEmailTemplate,
  getShipmentDeliveredEmailTemplate,
  getShipmentCancelledEmailTemplate
} = require('../templates/shipmentEmailTemplates');

// Helper function to verify Terminal webhook signature (for simulation)
exports.verifyTerminalWebhookSignature = (signature, secretKey, body) => {
  try {
    const manualHashSignature = crypto
      .createHmac('sha512', secretKey)
      .update(JSON.stringify(body))
      .digest('hex');
    
    const requestValid = signature === manualHashSignature;
    const validMessage = requestValid ? 'Webhook request is valid' : 'Invalid webhook request received';
    
    return {
      status: requestValid,
      message: validMessage
    };
  } catch (error) {
    console.log('An error occurred verifying webhook signature:', error);
    return {
      status: false,
      message: 'Unable to verify request'
    };
  }
};

// Simulation handler for Terminal Africa webhooks (separate from existing webhook system)
const handleTerminalWebhook = async (req, res, webhookData) => {
  try {
    console.log('--- Terminal Webhook Handler Start ---');
    console.log('Received webhook payload:', JSON.stringify(webhookData, null, 2));
    const { event, data } = webhookData;
    if (!event || !data) {
      console.error('[ERROR] Invalid webhook data: missing event or data');
      if (res && typeof res.status === 'function') {
        return res.status(400).json({
          status: false,
          message: 'Invalid webhook data: missing event or data'
        });
      }
      return;

      
    }

    // For simulation: acknowledge receipt immediately
    if (res && typeof res.status === 'function') {
      res.status(200).json({
        status: true,
        message: 'Terminal webhook processed successfully (simulateTerminalWebhook2)'
      });
    }

    // All business logic below runs asynchronously after response
    (async () => {
      try {
        // Extract tracking number from data.extras.tracking_number
        const trackingNumber = data?.extras?.tracking_number || data?.tracking_number;
        console.log('[INFO] Extracted tracking number:', trackingNumber);
        if (!trackingNumber) {
          console.error('[ERROR] Tracking number not found in webhook data');
          return;
        }

        // Find the order by tracking number
        const Order = mongoose.model('Order');
        console.log('[INFO] Looking up order with shipping.tracking.number =', trackingNumber);
        const order = await Order.findOne({ 'shipping.tracking.number': trackingNumber });
        if (!order) {
          console.error('[ERROR] Order not found for tracking number:', trackingNumber);
          return;
        }
        console.log('[SUCCESS] Found order:', order.order_id);

        // Normalize event name (support dash and underscore)
        const normalizedEvent = event.replace(/-/g, '_');
        console.log('[INFO] Normalized event:', normalizedEvent);

        // Prepare update data
        const updateData = {
          'shipping.lastUpdated': new Date(),
          'shipping.tracking.status': data.status || normalizedEvent,
          'shipping.tracking.lastUpdate': new Date(),
        };
        if (trackingNumber) {
          updateData['shipping.tracking.number'] = trackingNumber;
        }
        if (data.carrier || data?.metadata?.selected_rate?.carrier_name) {
          updateData['shipping.carrier.name'] = data.carrier || data?.metadata?.selected_rate?.carrier_name;
        }
        console.log('[INFO] Update data prepared:', JSON.stringify(updateData, null, 2));

        // Add tracking history entry
        const historyEntry = {
          status: data.status || normalizedEvent,
          timestamp: new Date(),
          location: data?.metadata?.selected_rate?.delivery_address?.city || data?.events?.[0]?.location || 'Unknown',
          description: data?.events?.[data?.events?.length - 1]?.description || data.description || `Terminal webhook: ${event}`
        };
        console.log('[INFO] Tracking history entry:', JSON.stringify(historyEntry, null, 2));

        // Event-specific updates
        switch (normalizedEvent) {
          case 'shipment_created':
            updateData['shipping.status'] = 'pending';
            updateData['status'] = 'pending';
            console.log('[EVENT] shipment.created: Setting status to pending');
            break;
          case 'shipment_updated':
            updateData['shipping.status'] = 'picked-up';
            updateData['status'] = 'shipped';
            updateData['shipping.pickedUpAt'] = new Date();
            console.log('[EVENT] shipment.updated: Setting status to picked-up/shipped');
            break;
          case 'shipment_in_transit':
            updateData['shipping.status'] = 'in-transit';
            updateData['status'] = 'shipped';
            updateData['shipping.inTransitAt'] = new Date();
            console.log('[EVENT] shipment.in-transit: Setting status to in-transit/shipped');
            break;
          case 'shipment_delivered':
            updateData['shipping.status'] = 'delivered';
            updateData['status'] = 'delivered';
            updateData['shipping.deliveredAt'] = new Date();
            console.log('[EVENT] shipment.delivered: Setting status to delivered');
            // Schedule the order closure job for 1 day after delivery
            try {
              console.log(`[SCHEDULE] Scheduling order closure for order ${order.order_id} in 1 day.`);
              await agenda.schedule('in 1 day', 'closeOrder', { orderId: order._id.toString() });
              console.log(`[SCHEDULE] Job scheduled successfully for order ${order.order_id}`);
            } catch (scheduleError) {
              console.error(`[SCHEDULE ERROR] Error scheduling closeOrder job for order ${order.order_id}:`, scheduleError);
            }
            break;
          case 'shipment_cancelled':
            updateData['shipping.status'] = 'cancelled';
            updateData['status'] = 'cancelled';
            updateData['shipping.cancelledAt'] = new Date();
            console.log('[EVENT] shipment.cancelled: Setting status to cancelled');
            break;
          default:
            console.log('[EVENT] Unhandled event type, only updating tracking info');
            break;
        }

        // Update the order
        console.log('[DB] Updating order with:', JSON.stringify(updateData, null, 2));
        await order.updateOne({
          $set: updateData,
          $push: {
            'shipping.tracking.history': historyEntry
          }
        });
        console.log('[DB] Order updated successfully');

        // Update items status for certain events
        if ([
          'shipment_in_transit',
          'shipment_delivered',
          'shipment_cancelled'
        ].includes(normalizedEvent)) {
          let itemStatus = null;
          if (normalizedEvent === 'shipment_in_transit') itemStatus = 'in-transit';
          if (normalizedEvent === 'shipment_delivered') itemStatus = 'delivered';
          if (normalizedEvent === 'shipment_cancelled') itemStatus = 'cancelled';
          if (itemStatus) {
            console.log(`[DB] Updating all items status to: ${itemStatus}`);
            await order.updateOne({
              $set: {
                'items.$[].status': itemStatus
              },
              $push: {
                'items.$[].statusHistory': {
                  status: itemStatus,
                  timestamp: new Date(),
                  note: data?.events?.[data?.events?.length - 1]?.description || `Status updated via Terminal webhook: ${event}`
                }
              }
            });
            console.log('[DB] Items status updated successfully');
          }
        }

        // Send notifications
        console.log('[NOTIFY] Sending notifications for event:', normalizedEvent);
        await sendNotificationsForTerminalEvent(order, normalizedEvent, {
          ...data,
          tracking_number: trackingNumber,
          carrier: data.carrier || data?.metadata?.selected_rate?.carrier_name
        });
        console.log('[NOTIFY] Notifications sent');

        console.log('--- Terminal Webhook Handler End ---');
      } catch (error) {
        console.error('[FATAL ERROR] Error processing simulated Terminal webhook:', error);
      }
    })();
  } catch (error) {
    console.error('[FATAL ERROR] Error processing simulated Terminal webhook:', error);
    if (res && typeof res.status === 'function') {
      return res.status(500).json({
        status: false,
        message: 'Internal server error',
        error: error.message
      });
    }
    throw error;
  }
};

// Update order based on Terminal event (for simulation)
const updateOrderForTerminalEvent = async (order, event, data) => {
  try {
    console.log(`🔄 Updating order ${order.order_id} for Terminal event: ${event}`);
    
    const updateData = {
      'shipping.lastUpdated': new Date(),
      'shipping.status': data.status,
      'shipping.tracking.status': data.status,
      'shipping.tracking.lastUpdate': new Date()
    };

    // Update tracking information if available
    if (data.tracking_number) {
      updateData['shipping.tracking.number'] = data.tracking_number;
    }

    // Update carrier information if available
    if (data.carrier) {
      updateData['shipping.carrier.name'] = data.carrier;
    }

    // Add tracking history entry
    const historyEntry = {
      status: data.status,
      timestamp: new Date(),
      location: data.recipient?.city || 'Unknown',
      description: data.description || `Terminal webhook: ${event}`
    };

    // Event-specific updates
    switch (event) {
      case 'packaging.created':
        updateData['shipping.status'] = 'picked-up';
        updateData['shipping.tracking.status'] = 'picked-up';
        updateData['shipping.pickedUpAt'] = new Date();
        break;
        
      case 'shipment.in-transit' || 'shipment.in_transit':
        updateData['status'] = 'shipped';
        updateData['shipping.status'] = 'in-transit';
        updateData['shipping.tracking.status'] = 'in-transit';
        updateData['shipping.inTransitAt'] = new Date();
        break;
        
      case 'shipment.out-for-delivery' || 'shipment.out_for_delivery':
        updateData['shipping.status'] = 'out-for-delivery';
        updateData['shipping.tracking.status'] = 'out-for-delivery';
        updateData['shipping.outForDeliveryAt'] = new Date();
        break;
        
      case 'shipment.delivered':
        updateData['status'] = 'delivered';
        updateData['shipping.status'] = 'delivered';
        updateData['shipping.tracking.status'] = 'delivered';
        updateData['shipping.deliveredAt'] = new Date();
        // Schedule the order closure job for 1 day after delivery
        try {
          console.log(`Scheduling order closure for order ${order.order_id} in 1 day.`);
          await agenda.schedule('in 1 day', 'closeOrder', { orderId: order._id.toString() });
          console.log(`✅ Job scheduled successfully for order ${order.order_id}`);
        } catch (scheduleError) {
          console.error(`❌ Error scheduling closeOrder job for order ${order.order_id}:`, scheduleError);
        }

        break;
        
      case 'shipment.cancelled':
        updateData['shipping.status'] = 'cancelled';
        updateData['shipping.tracking.status'] = 'cancelled';
        updateData['shipping.cancelledAt'] = new Date();
        break;
        
      default:
        console.log('Unknown Terminal event:', event);
        break;
    }

    console.log('Update data being applied:', updateData);

    // First update the main order fields
    await order.updateOne({
      $set: updateData,
      $push: {
        'shipping.tracking.history': historyEntry
      }
    });

    // Update items status for specific events (separate operation)
    if (['shipment.in-transit', 'shipment.delivered'].includes(event)) {
      const itemStatus = event === 'shipment.delivered' ? 'delivered' : 'in-transit';
      
      console.log(`🎯 Updating all items status to: ${itemStatus}`);
      
      // Update each item's status
      await order.updateOne({
        $set: {
          'items.$[].status': itemStatus
        },
        $push: {
          'items.$[].statusHistory': {
            status: itemStatus,
            timestamp: new Date(),
            note: data.description || `Status updated via Terminal webhook: ${event}`
          }
        }
      });
    }

    console.log(`✅ Order ${order.order_id} updated successfully for Terminal event: ${event}`);
  } catch (error) {
    console.error(`❌ Error updating order ${order.order_id} for Terminal event:`, error);
    throw error;
  }
};

// Send Terminal event emails to buyer and seller
const sendTerminalEventEmails = async (buyer, seller, order, event, data) => {
  const sgMail = require('@sendgrid/mail');
  
  // Ensure SendGrid API key is set
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('Cannot send email: SendGrid API key is not configured');
    return;
  }
  sgMail.setApiKey(apiKey);

  try {
    console.log(`📧 Preparing ${event} emails for order ${order.order_id}`);

    // Get email content based on event type
    const emailContent = getTerminalEventEmailContent(event, order, data, buyer, seller);
    
    if (!emailContent) {
      console.log(`No email template defined for event: ${event}`);
      return;
    }

    // Send email to buyer
    const buyerMsg = {
      to: buyer.email,
      from: 'Auqli <support@auqli.com>',
      subject: emailContent.buyer.subject,
      html: emailContent.buyer.html
    };

    console.log(`📧 Sending ${event} email to buyer: ${buyer.email}`);
    await sgMail.send(buyerMsg);
    console.log(`✅ ${event} email sent to buyer successfully`);

    // Send email to seller for certain events
    if (emailContent.seller) {
      const sellerMsg = {
        to: seller.email,
        from: 'Auqli Seller <support@auqli.com>',
        subject: emailContent.seller.subject,
        html: emailContent.seller.html
      };

      console.log(`📧 Sending ${event} email to seller: ${seller.email}`);
      await sgMail.send(sellerMsg);
      console.log(`✅ ${event} email sent to seller successfully`);
    }

  } catch (error) {
    console.error(`❌ Error sending ${event} emails:`, error);
    throw error;
  }
};

// Get email content for different Terminal events
const getTerminalEventEmailContent = (event, order, data, buyer, seller) => {
  const buyerName = `${buyer.firstName} ${buyer.lastName}`.trim();
  const sellerName = seller.businessName || `${seller.firstName} ${seller.lastName}`.trim();
  const orderId = order.order_id;
  const trackingNumber = data.tracking_number || order.shipping?.tracking?.number || 'N/A';
  const carrier = data.carrier || order.shipping?.carrier?.name || 'Carrier';
  
  // Base email styles
  const emailStyles = `
    <style>
      .email-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
      .header { text-align: center; margin-bottom: 20px; }
      .logo { width: 150px; }
      .title { color: #333; margin-top: 15px; }
      .info-box { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4CAF50; }
      .info-item { margin: 5px 0; }
      .info-label { color: #333; font-weight: bold; }
      .info-value { color: #555; }
      .status-delivered { color: #4CAF50; font-weight: bold; }
      .status-in-transit { color: #FF9800; font-weight: bold; }
      .status-picked-up { color: #2196F3; font-weight: bold; }
      .status-cancelled { color: #f44336; font-weight: bold; }
      .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 14px; text-align: center; }
      .btn { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 5px; }
    </style>
  `;

  switch (event) {
    case 'packaging.created':
    case 'packaging.updated':
      return {
        buyer: {
          subject: `📦 Your Order is Being Packaged - Order #${orderId}`,
          html: `
            ${emailStyles}
            <div class="email-container">
              <div class="header">
                <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" class="logo">
                <h2 class="title">Your Order is Being Packaged</h2>
              </div>
              
              <p>Hi ${buyerName},</p>
              <p>Great news! Your order is now being carefully packaged and prepared for shipment.</p>
              
              <div class="info-box">
                <div class="info-item"><span class="info-label">Order ID:</span> <span class="info-value">#${orderId}</span></div>
                <div class="info-item"><span class="info-label">Seller:</span> <span class="info-value">${sellerName}</span></div>
                <div class="info-item"><span class="info-label">Status:</span> <span class="status-picked-up">Being Packaged</span></div>
                <div class="info-item"><span class="info-label">Tracking Number:</span> <span class="info-value">${trackingNumber}</span></div>
              </div>
              
              <p>Your order will be ready for pickup by ${carrier} soon. We'll notify you once it's picked up and on its way!</p>
              
              <div class="footer">
                <p>Thank you for shopping with Auqli!</p>
                <p style="color: #999; font-size: 12px; margin-top: 15px;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
              </div>
            </div>
          `
        }
      };

    case 'shipment.created':
      return {
        buyer: {
          subject: `🚚 Pickup Scheduled for Your Order #${orderId}`,
          html: `
            ${emailStyles}
            <div class="email-container">
              <div class="header">
                <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" class="logo">
                <h2 class="title">Pickup Scheduled</h2>
              </div>
              
              <p>Hi ${buyerName},</p>
              <p>Your order has been packaged and is now ready for pickup by our delivery partner.</p>
              
              <div class="info-box">
                <div class="info-item"><span class="info-label">Order ID:</span> <span class="info-value">#${orderId}</span></div>
                <div class="info-item"><span class="info-label">Carrier:</span> <span class="info-value">${carrier}</span></div>
                <div class="info-item"><span class="info-label">Status:</span> <span class="status-picked-up">Ready for Pickup</span></div>
                <div class="info-item"><span class="info-label">Tracking Number:</span> <span class="info-value">${trackingNumber}</span></div>
              </div>
              
              <p>We'll update you as soon as your order is picked up and begins its journey to you!</p>
              
              <div class="footer">
                <p>Thank you for shopping with Auqli!</p>
                <p style="color: #999; font-size: 12px; margin-top: 15px;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
              </div>
            </div>
          `
        }
      };

    case 'shipment.updated':
      return {
        buyer: {
          subject: `📋 Your Order Has Been Picked Up - Order #${orderId}`,
          html: `
            ${emailStyles}
            <div class="email-container">
              <div class="header">
                <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" class="logo">
                <h2 class="title">Order Picked Up!</h2>
              </div>
              
              <p>Hi ${buyerName},</p>
              <p>Excellent! Your order has been picked up by ${carrier} and is now being processed for delivery.</p>
              
              <div class="info-box">
                <div class="info-item"><span class="info-label">Order ID:</span> <span class="info-value">#${orderId}</span></div>
                <div class="info-item"><span class="info-label">Carrier:</span> <span class="info-value">${carrier}</span></div>
                <div class="info-item"><span class="info-label">Status:</span> <span class="status-picked-up">Picked Up</span></div>
                <div class="info-item"><span class="info-label">Tracking Number:</span> <span class="info-value">${trackingNumber}</span></div>
                <div class="info-item"><span class="info-label">Pickup Time:</span> <span class="info-value">${new Date(data.pickup_date || new Date()).toLocaleString()}</span></div>
              </div>
              
              <p>Your order is now with ${carrier} and will be on its way to you soon. Keep an eye out for the next update!</p>
              
              <div class="footer">
                <p>Thank you for shopping with Auqli!</p>
                <p style="color: #999; font-size: 12px; margin-top: 15px;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
              </div>
            </div>
          `
        }
      };

    case 'shipment.in-transit':
      return {
        buyer: {
          subject: `🚛 Your Order is On The Way - Order #${orderId}`,
          html: `
            ${emailStyles}
            <div class="email-container">
              <div class="header">
                <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" class="logo">
                <h2 class="title">Your Order is On The Way!</h2>
              </div>
              
              <p>Hi ${buyerName},</p>
              <p>Your order is now in transit and on its way to you! 🚛</p>
              
              <div class="info-box">
                <div class="info-item"><span class="info-label">Order ID:</span> <span class="info-value">#${orderId}</span></div>
                <div class="info-item"><span class="info-label">Carrier:</span> <span class="info-value">${carrier}</span></div>
                <div class="info-item"><span class="info-label">Status:</span> <span class="status-in-transit">In Transit</span></div>
                <div class="info-item"><span class="info-label">Tracking Number:</span> <span class="info-value">${trackingNumber}</span></div>
                <div class="info-item"><span class="info-label">Estimated Delivery:</span> <span class="info-value">1-3 business days</span></div>
              </div>
              
              <p>Your package is making its way to your delivery address. We'll notify you as soon as it's delivered!</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="#" class="btn">Track Your Package</a>
              </div>
              
              <div class="footer">
                <p>Thank you for shopping with Auqli!</p>
                <p style="color: #999; font-size: 12px; margin-top: 15px;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
              </div>
            </div>
          `
        }
      };

    case 'shipment.delivered':
      return {
        buyer: {
          subject: `🎉 Your Order Has Been Delivered - Order #${orderId}`,
          html: `
            ${emailStyles}
            <div class="email-container">
              <div class="header">
                <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" class="logo">
                <h2 class="title">Order Delivered Successfully! 🎉</h2>
              </div>
              
              <p>Hi ${buyerName},</p>
              <p>Great news! Your order has been successfully delivered. We hope you love your purchase!</p>
              
              <div class="info-box">
                <div class="info-item"><span class="info-label">Order ID:</span> <span class="info-value">#${orderId}</span></div>
                <div class="info-item"><span class="info-label">Carrier:</span> <span class="info-value">${carrier}</span></div>
                <div class="info-item"><span class="info-label">Status:</span> <span class="status-delivered">Delivered</span></div>
                <div class="info-item"><span class="info-label">Tracking Number:</span> <span class="info-value">${trackingNumber}</span></div>
                <div class="info-item"><span class="info-label">Delivery Date:</span> <span class="info-value">${new Date(data.delivery_date || new Date()).toLocaleString()}</span></div>
              </div>
              
              <p>We'd love to hear about your experience! Please consider leaving a review for ${sellerName}.</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="#" class="btn">Leave a Review</a>
                <a href="#" class="btn" style="background-color: #333;">Shop Again</a>
              </div>
              
              <div class="footer">
                <p>Thank you for shopping with Auqli!</p>
                <p>If you have any issues with your order, please contact our support team.</p>
                <p style="color: #999; font-size: 12px; margin-top: 15px;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
              </div>
            </div>
          `
        },
        seller: {
          subject: `✅ Order #${orderId} Successfully Delivered`,
          html: `
            ${emailStyles}
            <div class="email-container">
              <div class="header">
                <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" class="logo">
                <h2 class="title">Order Delivered Successfully! ✅</h2>
              </div>
              
              <p>Hi ${sellerName},</p>
              <p>Great news! Your order has been successfully delivered to the customer.</p>
              
              <div class="info-box">
                <div class="info-item"><span class="info-label">Order ID:</span> <span class="info-value">#${orderId}</span></div>
                <div class="info-item"><span class="info-label">Customer:</span> <span class="info-value">${buyerName}</span></div>
                <div class="info-item"><span class="info-label">Carrier:</span> <span class="info-value">${carrier}</span></div>
                <div class="info-item"><span class="info-label">Status:</span> <span class="status-delivered">Delivered</span></div>
                <div class="info-item"><span class="info-label">Delivery Date:</span> <span class="info-value">${new Date(data.delivery_date || new Date()).toLocaleString()}</span></div>
              </div>
              
              <p>The order has been completed successfully. Funds will be released to your wallet according to our payment schedule.</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="https://seller.auqli.live/" class="btn">View Dashboard</a>
              </div>
              
              <div class="footer">
                <p>Thank you for selling with Auqli!</p>
                <p style="color: #999; font-size: 12px; margin-top: 15px;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
              </div>
            </div>
          `
        }
      };

    case 'shipment.cancelled':
      return {
        buyer: {
          subject: `❌ Order #${orderId} Shipment Cancelled`,
          html: `
            ${emailStyles}
            <div class="email-container">
              <div class="header">
                <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" class="logo">
                <h2 class="title">Shipment Cancelled</h2>
              </div>
              
              <p>Hi ${buyerName},</p>
              <p>We regret to inform you that the shipment for your order has been cancelled.</p>
              
              <div class="info-box">
                <div class="info-item"><span class="info-label">Order ID:</span> <span class="info-value">#${orderId}</span></div>
                <div class="info-item"><span class="info-label">Seller:</span> <span class="info-value">${sellerName}</span></div>
                <div class="info-item"><span class="info-label">Status:</span> <span class="status-cancelled">Cancelled</span></div>
                <div class="info-item"><span class="info-label">Cancellation Date:</span> <span class="info-value">${new Date().toLocaleString()}</span></div>
              </div>
              
              <p>A full refund will be processed automatically. Please contact our support team if you have any questions.</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="mailto:support@auqli.com" class="btn">Contact Support</a>
                <a href="#" class="btn" style="background-color: #333;">Browse Similar Items</a>
              </div>
              
              <div class="footer">
                <p>We apologize for any inconvenience caused.</p>
                <p style="color: #999; font-size: 12px; margin-top: 15px;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
              </div>
            </div>
          `
        },
        seller: {
          subject: `⚠️ Order #${orderId} Shipment Cancelled`,
          html: `
            ${emailStyles}
            <div class="email-container">
              <div class="header">
                <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" class="logo">
                <h2 class="title">Shipment Cancelled</h2>
              </div>
              
              <p>Hi ${sellerName},</p>
              <p>The shipment for order #${orderId} has been cancelled by the carrier.</p>
              
              <div class="info-box">
                <div class="info-item"><span class="info-label">Order ID:</span> <span class="info-value">#${orderId}</span></div>
                <div class="info-item"><span class="info-label">Customer:</span> <span class="info-value">${buyerName}</span></div>
                <div class="info-item"><span class="info-label">Status:</span> <span class="status-cancelled">Cancelled</span></div>
                <div class="info-item"><span class="info-label">Cancellation Date:</span> <span class="info-value">${new Date().toLocaleString()}</span></div>
              </div>
              
              <p>Please contact our support team to arrange alternative shipping or process a refund.</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="mailto:support@auqli.com" class="btn">Contact Support</a>
                <a href="https://seller.auqli.live/" class="btn" style="background-color: #333;">View Dashboard</a>
              </div>
              
              <div class="footer">
                <p>Our support team will help you resolve this issue.</p>
                <p style="color: #999; font-size: 12px; margin-top: 15px;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
              </div>
            </div>
          `
        }
      };

    default:
      return null;
  }
};

// Send notifications for Terminal events (for simulation)
const sendNotificationsForTerminalEvent = async (order, event, data) => {
  try {
    console.log(`📧 Sending notifications for Terminal event: ${event}, Order: ${order.order_id}`);
    
    const notificationController = require('../controllers/notificationController');
    
    // Get buyer and seller information
    const Buyer = mongoose.model('Buyer');
    const Seller = mongoose.model('Seller');
    
    console.log(`Looking up buyer ${order.buyer} and seller ${order.seller}`);
    
    const buyer = await Buyer.findById(order.buyer);
    const seller = await Seller.findById(order.seller);

    if (!buyer || !seller) {
      console.error('❌ Buyer or seller not found for order:', order.order_id);
      console.error('Buyer found:', !!buyer, 'Seller found:', !!seller);
      return;
    }

    console.log(`✅ Found buyer: ${buyer.firstName} ${buyer.lastName} (${buyer.email})`);
    console.log(`✅ Found seller: ${seller.businessName || seller.firstName} (${seller.email})`);

    // Determine notification type and data based on event
    let notificationType = 'order_status_update';
    let notificationData = {
      orderId: order._id,
      order_id: order.order_id,
      status: data.status,
      carrier: data.carrier,
      trackingNumber: data.tracking_number,
      description: data.description
    };

    switch (event) {
      case 'packaging.created':
      case 'packaging.updated':
        notificationType = 'order_status_update';
        notificationData.status = 'Being packaged';
        break;
        
      case 'shipment.created':
        notificationType = 'order_status_update';
        notificationData.status = 'Ready for pickup';
        break;
        
      case 'shipment.updated':
        notificationType = 'order_picked_up';
        notificationData.status = 'Picked up';
        break;
        
      case 'shipment.in-transit':
        notificationType = 'order_in_transit';
        notificationData.status = 'In transit';
        break;
        
      case 'shipment.delivered':
        notificationType = 'order_delivered';
        notificationData.status = 'Delivered';
        notificationData.deliveryDate = data.delivery_date;
        break;
        
      case 'shipment.cancelled':
        notificationType = 'order_cancelled';
        notificationData.status = 'Cancelled';
        break;
    }

    console.log(`📨 Creating buyer notification: type=${notificationType}, data=`, notificationData);

    // Send notification to buyer
    const buyerNotification = await notificationController.createBuyerNotification(
      buyer._id,
      notificationType,
      notificationData
    );

    console.log(`✅ Buyer notification created:`, buyerNotification._id);

    // Send notification to seller for certain events
    if (['shipment.delivered', 'shipment.cancelled'].includes(event)) {
      console.log(`📨 Creating seller notification: type=${notificationType}`);
      
      const sellerNotification = await notificationController.createNotification(
        seller._id,
        notificationType,
        notificationData
      );

      console.log(`✅ Seller notification created:`, sellerNotification._id);
    }

    // Send email notifications
    console.log(`📧 Sending email notifications for ${event}...`);
    
    try {
      // Send specific email based on event type
      await sendTerminalEventEmails(buyer, seller, order, event, data);
      console.log(`✅ Terminal event emails sent successfully`);
    } catch (emailError) {
      console.error('❌ Error sending Terminal event emails:', emailError);
    }

    console.log(`✅ All notifications sent for Terminal event: ${event}`);
  } catch (error) {
    console.error('❌ Error sending notifications for Terminal event:', error);
    throw error;
  }
};

// Helper function to get notification title
const getNotificationTitle = (type) => {
  switch (type) {
    case 'order_status_update': return 'Order Status Update';
    case 'order_picked_up': return 'Order Picked Up';
    case 'order_in_transit': return 'Order In Transit';
    case 'order_delivered': return 'Order Delivered';
    case 'order_cancelled': return 'Order Cancelled';
    default: return 'Order Update';
  }
};

// Helper function to get notification message
const getNotificationMessage = (type, data) => {
  switch (type) {
    case 'order_status_update':
      return `Your order #${data.order_id} status has been updated to ${data.status}.`;
    case 'order_picked_up':
      return `Your order #${data.order_id} has been picked up and is being processed for delivery.`;
    case 'order_in_transit':
      return `Order #${data.order_id} is now in transit and on its way to the delivery address.`;
    case 'order_delivered':
      return `Your order #${data.order_id} has been successfully delivered.`;
    case 'order_cancelled':
      return `Order #${data.order_id} has been cancelled.`;
    default:
      return `Order #${data.order_id} has been updated.`;
  }
};

// Express route handler for Terminal webhooks (for simulation)
exports.handleTerminalWebhook = handleTerminalWebhook;
exports.handleTerminalWebhookRoute = async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-terminal-signature'];
    const secretKey = process.env.TERMINAL_SECRET_KEY;
    
    if (!signature || !secretKey) {
      return res.status(400).json({
        status: false,
        message: 'Missing webhook signature or secret key'
      });
    }

    const verification = verifyTerminalWebhookSignature(signature, secretKey, req.body);
    if (!verification.status) {
      return res.status(401).json({
        status: false,
        message: verification.message
      });
    }

    // Validate payload schema (must have event and data)
    const { event, data } = req.body;
    if (!event || !data) {
      return res.status(400).json({
        status: false,
        message: 'Invalid webhook payload: missing event or data'
      });
    }

    // Immediately acknowledge receipt to Terminal Africa
    res.sendStatus(200);

    // Process the webhook asynchronously (no await)
    handleTerminalWebhook(req, null, req.body)
      .catch((err) => {
        console.error('[WEBHOOK ASYNC ERROR]', err);
      });

  } catch (error) {
    console.error('Error in Terminal webhook route:', error);
    // Only return 500 for actual server errors (not business logic)
    res.status(500).json({
      status: false,
      message: 'Failed to process Terminal webhook',
      error: error.message
    });
  }
};

