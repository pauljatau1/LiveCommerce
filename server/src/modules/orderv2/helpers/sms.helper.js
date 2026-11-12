/**
 * SMS Notification Helper for Orders
 *
 * This helper module provides SMS notification functionality for order-related events
 * using the Termii API. It sends SMS notifications to buyers and sellers when orders
 * are paid, ensuring that failures don't affect the normal order flow.
 *
 * Features:
 * - Non-blocking SMS sending (failures don't affect order processing)
 * - Sends notifications to both buyer and seller if phone numbers are available
 * - Uses Termii API for reliable SMS delivery
 * - Comprehensive error handling and logging
 * - Professional message formatting
 *
 * @module smsHelper
 */

const termiiAPI = require('../../../config/termii');
const Buyer = require('../../../models/Buyer');
const Seller = require('../../../models/Seller');
const { generateOTP } = require('../../../utils/helpers');

/**
 * Formats phone number for Termii API.
 * 
 * Termii API requires phone numbers in international format without the + sign.
 * This function removes the + prefix if present to ensure proper API formatting.
 *
 * @param {string} phoneNumber - Phone number in international format (e.g., +23490126727)
 * @returns {string|null} Phone number formatted for Termii API (e.g., 23490126727) or null if invalid
 */
function formatPhoneNumberForTermii(phoneNumber) {
  if (!phoneNumber) {
    return null;
  }
  
  // Remove + prefix if present, as Termii API requires phone numbers without +
  const formatted = require('../../../utils/phone').internationalPhone(phoneNumber).replace(/^\+/, '');
  
  // Basic validation: should be numeric and have reasonable length
  if (!/^\d{10,15}$/.test(formatted)) {
    return null;
  }
  
  return formatted;
}

/**
 * Sends an SMS message using Termii API.
 * 
 * This function handles the SMS sending process using Termii API.
 * It's designed to be non-blocking and will not throw errors that affect
 * the calling function.
 *
 * @param {string} phoneNumber - The recipient's phone number (international format)
 * @param {string} message - The SMS message content
 * @returns {Promise<boolean>} True if SMS sent successfully, false otherwise
 */
async function sendSMS(phoneNumber, message) {
  try {
    // Step 1: Format phone number for Termii API
    const formattedPhoneNumber = formatPhoneNumberForTermii(phoneNumber);
    
    if (!formattedPhoneNumber) {
      console.warn(`Invalid phone number format for SMS: ${phoneNumber}`);
      return false;
    }

    // Step 2: Prepare Termii API request payload
    // Using generic channel for order notifications
    const payload = {
      api_key: process.env.TERMII_API_KEY,
      to: formattedPhoneNumber,
      from: process.env.TERMII_SENDER_ID || 'Auqli',
      sms: message,
      type: 'plain',
      channel: 'generic'
    };

    // Step 3: Send SMS via Termii API
    const response = await termiiAPI.post('/api/sms/send', payload);

    // Step 4: Verify successful response from Termii API
    if (response.data && response.data.code === 'ok') {
      console.log(`✅ SMS sent successfully to ${phoneNumber}`);
      return true;
    } else {
      console.error(`Failed to send SMS to ${phoneNumber}: Invalid response from Termii API`, response.data);
      return false;
    }
  } catch (error) {
    // Log error but don't throw - SMS failures should not affect order processing
    console.error(`Error sending SMS to ${phoneNumber}:`, error.response?.data || error.message);
    return false;
  }
}

/**
 * Constructs SMS message for buyer order confirmation.
 *
 * This function creates a professional SMS message for buyers when their order is paid.
 *
 * @param {Object} order - The order object
 * @param {string} order.order_id - The order ID
 * @param {number} order.totalAmount - The total order amount
 * @returns {string} Formatted SMS message for buyer
 */
function getBuyerOrderConfirmationMessage(order) {
  const formattedAmount = order.totalAmount.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0
  });
  
  return `Your Auqli order #${order.order_id} has been confirmed! Amount: ${formattedAmount}. We'll notify you when it ships. Thank you for shopping with Auqli!`;
}

/**
 * Constructs SMS message for seller new order notification.
 *
 * This function creates a professional SMS message for sellers when they receive a new paid order.
 *
 * @param {Object} order - The order object
 * @param {string} order.order_id - The order ID
 * @param {number} order.totalAmount - The total order amount
 * @param {string} buyerName - The buyer's name
 * @returns {string} Formatted SMS message for seller
 */
function getSellerOrderNotificationMessage(order, buyerName) {
  const formattedAmount = order.totalAmount.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0
  });
  
  return `New Paid order on Auqli! Order #${order.order_id} from ${buyerName}. Amount: ${formattedAmount}. Please prepare items for shipping. Check your seller dashboard for details.`;
}

/**
 * Sends order confirmation SMS to buyer.
 * 
 * This function sends an SMS notification to the buyer when their order is paid.
 * It's designed to be non-blocking and will not affect order processing if it fails.
 *
 * @param {Object} order - The order object
 * @param {Object} buyer - The buyer object (must have phoneNumber field)
 * @returns {Promise<{success: boolean, error?: string}>} Result object with success status
 */
async function sendBuyerOrderConfirmationSMS(order, buyer) {
  // Check if buyer has a phone number
  if (!buyer || !buyer.phoneNumber) {
    console.log(`Skipping buyer SMS for order ${order.order_id}: No phone number available`);
    return { success: false, error: 'No phone number available' };
  }

  // Construct the SMS message
  const message = getBuyerOrderConfirmationMessage(order);

  // Send SMS (non-blocking - failures won't affect order processing)
  const success = await sendSMS(buyer.phoneNumber, message);
  
  return {
    success: success,
    error: success ? undefined : 'Failed to send SMS'
  };
}

/**
 * Sends new order notification SMS to seller.
 * 
 * This function sends an SMS notification to the seller when they receive a new paid order.
 * It's designed to be non-blocking and will not affect order processing if it fails.
 *
 * @param {Object} order - The order object
 * @param {Object} seller - The seller object (must have phoneNumber field)
 * @param {string} buyerName - The buyer's name for the notification
 * @returns {Promise<{success: boolean, error?: string}>} Result object with success status
 */
async function sendSellerOrderNotificationSMS(order, seller, buyerName) {
  // Check if seller has a phone number
  if (!seller || !seller.phoneNumber) {
    console.log(`Skipping seller SMS for order ${order.order_id}: No phone number available`);
    return { success: false, error: 'No phone number available' };
  }

  // Construct the SMS message
  const message = getSellerOrderNotificationMessage(order, buyerName);

  // Send SMS (non-blocking - failures won't affect order processing)
  const success = await sendSMS(seller.phoneNumber, message);
  
  return {
    success: success,
    error: success ? undefined : 'Failed to send SMS'
  };
}

/**
 * Generates and stores payment OTP for an order.
 *
 * This function generates a 4-digit OTP, sets expiration (10 minutes),
 * and saves it to the order document.
 *
 * @param {Object} order - The order object (Mongoose document)
 * @returns {string} The generated OTP code
 */
function generateAndStorePaymentOTP(order) {
  // Generate 4-digit OTP
  const otp = generateOTP();
  
  // Set expiration to 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
  // Store OTP and expiration in order
  order.paymentOTP = otp;
  order.paymentOTPExpires = expiresAt;
  
  return otp;
}

/**
 * Sends order payment confirmation SMS to both buyer and seller.
 * 
 * This is the main function that orchestrates sending SMS notifications to both
 * buyer and seller when an order is paid. It's designed to be completely
 * non-blocking and will not throw errors that affect order processing.
 *
 * Usage:
 * - Call this function after an order is marked as paid
 * - Pass the order object (Mongoose document) and optionally the buyer/seller objects
 * - If buyer/seller objects are not provided, they will be fetched from the database
 * - SMS sending status is tracked in order.smsStatus
 * - SMS sending failures are logged but don't affect the return value
 *
 * @param {Object} order - The order object (Mongoose document, must have order_id, totalAmount, buyer, seller)
 * @param {Object} [buyer] - Optional buyer object (if not provided, will be fetched)
 * @param {Object} [seller] - Optional seller object (if not provided, will be fetched)
 * @returns {Promise<{buyerSMS: {success: boolean, error?: string}, sellerSMS: {success: boolean, error?: string}}>} 
 *   Object with SMS sending status for both buyer and seller
 */
async function sendOrderPaymentConfirmationSMS(order, buyer = null, seller = null) {
  const smsStatus = {
    buyerSMS: { success: false },
    sellerSMS: { success: false }
  };

  try {
    // Step 1: Fetch buyer if not provided
    let buyerData = buyer;
    if (!buyerData && order.buyer) {
      try {
        buyerData = await Buyer.findById(order.buyer).select('phoneNumber firstName lastName');
      } catch (error) {
        console.error(`Error fetching buyer for SMS notification (order ${order.order_id}):`, error.message);
        smsStatus.buyerSMS.error = `Error fetching buyer: ${error.message}`;
      }
    }

    // Step 2: Fetch seller if not provided
    let sellerData = seller;
    if (!sellerData && order.seller) {
      try {
        sellerData = await Seller.findById(order.seller).select('phoneNumber firstName lastName businessName storeName');
      } catch (error) {
        console.error(`Error fetching seller for SMS notification (order ${order.order_id}):`, error.message);
        smsStatus.sellerSMS.error = `Error fetching seller: ${error.message}`;
      }
    }

    // Step 3: Send SMS to buyer (non-blocking)
    if (buyerData) {
      try {
        const buyerResult = await sendBuyerOrderConfirmationSMS(order, buyerData);
        smsStatus.buyerSMS = {
          success: buyerResult.success,
          sentAt: buyerResult.success ? new Date() : undefined,
          error: buyerResult.error
        };
        
        if (buyerResult.success) {
          console.log(`✅ Buyer SMS sent successfully for order ${order.order_id}`);
        } else {
          console.error(`❌ Failed to send buyer SMS for order ${order.order_id}: ${buyerResult.error}`);
        }
      } catch (error) {
        console.error(`Error sending buyer SMS for order ${order.order_id}:`, error.message);
        smsStatus.buyerSMS.error = error.message;
      }
    } else {
      smsStatus.buyerSMS.error = 'Buyer not found or no phone number available';
      console.log(`Skipping buyer SMS for order ${order.order_id}: Buyer not found or no phone number`);
    }

    // Step 4: Send SMS to seller (non-blocking)
    if (sellerData) {
      try {
        const buyerName = buyerData 
          ? `${buyerData.firstName || ''} ${buyerData.lastName || ''}`.trim() || 'Customer'
          : 'Customer';
        
        const sellerResult = await sendSellerOrderNotificationSMS(order, sellerData, buyerName);
        smsStatus.sellerSMS = {
          success: sellerResult.success,
          sentAt: sellerResult.success ? new Date() : undefined,
          error: sellerResult.error
        };
        
        if (sellerResult.success) {
          console.log(`✅ Seller SMS sent successfully for order ${order.order_id}`);
        } else {
          console.error(`❌ Failed to send seller SMS for order ${order.order_id}: ${sellerResult.error}`);
        }
      } catch (error) {
        console.error(`Error sending seller SMS for order ${order.order_id}:`, error.message);
        smsStatus.sellerSMS.error = error.message;
      }
    } else {
      smsStatus.sellerSMS.error = 'Seller not found or no phone number available';
      console.log(`Skipping seller SMS for order ${order.order_id}: Seller not found or no phone number`);
    }

    // Step 5: Update order with SMS status
    order.smsStatus = smsStatus;
    await order.save();

    console.log(`📱 SMS notification attempts completed for order ${order.order_id}. Buyer: ${smsStatus.buyerSMS.success ? '✅' : '❌'}, Seller: ${smsStatus.sellerSMS.success ? '✅' : '❌'}`);

  } catch (error) {
    // Log error but don't throw - SMS failures should never affect order processing
    console.error(`Error in sendOrderPaymentConfirmationSMS for order ${order.order_id}:`, error.message);
    
    // Update order with error status if possible
    try {
      order.smsStatus = smsStatus;
      await order.save();
    } catch (saveError) {
      console.error(`Error saving SMS status for order ${order.order_id}:`, saveError.message);
    }
  }

  return smsStatus;
}

/**
 * Constructs SMS message for buyer order cancellation notification.
 *
 * This function creates a professional SMS message for buyers when their order is cancelled.
 *
 * @param {Object} order - The order object
 * @param {string} order.order_id - The order ID
 * @param {string} reason - The cancellation reason
 * @param {boolean} hasRefund - Whether a refund will be processed
 * @returns {string} Formatted SMS message for buyer
 */
function getBuyerCancellationMessage(order, reason, hasRefund) {
  let message = `Your Auqli order #${order.order_id} has been cancelled.`;
  
  if (reason) {
    message += ` Reason: ${reason}.`;
  }
  
  if (hasRefund) {
    message += ` A refund will be processed. Thank you for your understanding.`;
  } else {
    message += ` Thank you for shopping with Auqli!`;
  }
  
  return message;
}

/**
 * Constructs SMS message for seller order cancellation notification.
 *
 * This function creates a professional SMS message for sellers when an order is cancelled.
 *
 * @param {Object} order - The order object
 * @param {string} order.order_id - The order ID
 * @param {string} buyerName - The buyer's name
 * @param {string} reason - The cancellation reason
 * @returns {string} Formatted SMS message for seller
 */
function getSellerCancellationMessage(order, buyerName, reason) {
  let message = `Order #${order.order_id} from ${buyerName} has been cancelled.`;
  
  if (reason) {
    message += ` Reason: ${reason}.`;
  }
  
  message += ` Product stock has been restored. Check your dashboard for details.`;
  
  return message;
}

/**
 * Sends order cancellation SMS to buyer.
 * 
 * This function sends an SMS notification to the buyer when their order is cancelled.
 * It's designed to be non-blocking and will not affect order processing if it fails.
 *
 * @param {Object} order - The order object
 * @param {Object} buyer - The buyer object (must have phoneNumber field)
 * @param {string} reason - The cancellation reason
 * @param {boolean} hasRefund - Whether a refund will be processed
 * @returns {Promise<boolean>} True if SMS sent successfully, false otherwise
 */
async function sendBuyerCancellationSMS(order, buyer, reason, hasRefund) {
  // Check if buyer has a phone number
  if (!buyer || !buyer.phoneNumber) {
    console.log(`Skipping buyer cancellation SMS for order ${order.order_id}: No phone number available`);
    return false;
  }

  // Construct the SMS message
  const message = getBuyerCancellationMessage(order, reason, hasRefund);

  // Send SMS (non-blocking - failures won't affect order processing)
  return await sendSMS(buyer.phoneNumber, message);
}

/**
 * Sends order cancellation SMS to seller.
 * 
 * This function sends an SMS notification to the seller when an order is cancelled.
 * It's designed to be non-blocking and will not affect order processing if it fails.
 *
 * @param {Object} order - The order object
 * @param {Object} seller - The seller object (must have phoneNumber field)
 * @param {string} buyerName - The buyer's name for the notification
 * @param {string} reason - The cancellation reason
 * @returns {Promise<boolean>} True if SMS sent successfully, false otherwise
 */
async function sendSellerCancellationSMS(order, seller, buyerName, reason) {
  // Check if seller has a phone number
  if (!seller || !seller.phoneNumber) {
    console.log(`Skipping seller cancellation SMS for order ${order.order_id}: No phone number available`);
    return false;
  }

  // Construct the SMS message
  const message = getSellerCancellationMessage(order, buyerName, reason);

  // Send SMS (non-blocking - failures won't affect order processing)
  return await sendSMS(seller.phoneNumber, message);
}

/**
 * Sends order cancellation SMS to both buyer and seller.
 * 
 * This is the main function that orchestrates sending SMS notifications to both
 * buyer and seller when an order is cancelled. It's designed to be completely non-blocking
 * and will not throw errors that affect order processing.
 *
 * @param {Object} order - The order object (must have order_id, buyer, seller)
 * @param {string} reason - The cancellation reason
 * @param {boolean} hasRefund - Whether a refund will be processed
 * @param {Object} [buyer] - Optional buyer object (if not provided, will be fetched)
 * @param {Object} [seller] - Optional seller object (if not provided, will be fetched)
 * @returns {Promise<void>} Resolves when SMS sending attempts are complete (regardless of success/failure)
 */
async function sendOrderCancellationSMS(order, reason, hasRefund = false, buyer = null, seller = null) {
  try {
    // Step 1: Fetch buyer if not provided
    let buyerData = buyer;
    if (!buyerData && order.buyer) {
      try {
        buyerData = await Buyer.findById(order.buyer).select('phoneNumber firstName lastName');
      } catch (error) {
        console.error(`Error fetching buyer for cancellation SMS (order ${order.order_id}):`, error.message);
      }
    }

    // Step 2: Fetch seller if not provided
    let sellerData = seller;
    if (!sellerData && order.seller) {
      try {
        sellerData = await Seller.findById(order.seller).select('phoneNumber firstName lastName businessName storeName');
      } catch (error) {
        console.error(`Error fetching seller for cancellation SMS (order ${order.order_id}):`, error.message);
      }
    }

    // Step 3: Send SMS to buyer (non-blocking)
    if (buyerData) {
      sendBuyerCancellationSMS(order, buyerData, reason, hasRefund).catch(error => {
        console.error(`Error sending buyer cancellation SMS for order ${order.order_id}:`, error.message);
      });
    }

    // Step 4: Send SMS to seller (non-blocking)
    if (sellerData) {
      const buyerName = buyerData 
        ? `${buyerData.firstName || ''} ${buyerData.lastName || ''}`.trim() || 'Customer'
        : 'Customer';
      
      sendSellerCancellationSMS(order, sellerData, buyerName, reason).catch(error => {
        console.error(`Error sending seller cancellation SMS for order ${order.order_id}:`, error.message);
      });
    }

    console.log(`Cancellation SMS notification attempts initiated for order ${order.order_id}`);
  } catch (error) {
    // Log error but don't throw - SMS failures should never affect order processing
    console.error(`Error in sendOrderCancellationSMS for order ${order.order_id}:`, error.message);
  }
}

/**
 * Constructs SMS message for buyer order delivery notification.
 *
 * This function creates a professional SMS message for buyers when their order is delivered.
 *
 * @param {Object} order - The order object
 * @param {string} order.order_id - The order ID
 * @returns {string} Formatted SMS message for buyer
 */
function getBuyerDeliveryMessage(order) {
  return `Great news! Your Auqli order #${order.order_id} has been delivered. We hope you enjoy your purchase! Thank you for shopping with Auqli.`;
}

/**
 * Constructs SMS message for seller order delivery notification.
 *
 * This function creates a professional SMS message for sellers when an order is delivered.
 *
 * @param {Object} order - The order object
 * @param {string} order.order_id - The order ID
 * @param {string} buyerName - The buyer's name
 * @returns {string} Formatted SMS message for seller
 */
function getSellerDeliveryMessage(order, buyerName) {
  return `Order #${order.order_id} from ${buyerName} has been delivered successfully! Payment will be processed. Thank you for selling on Auqli!`;
}

/**
 * Sends order delivery SMS to buyer.
 * 
 * This function sends an SMS notification to the buyer when their order is delivered.
 * It's designed to be non-blocking and will not affect order processing if it fails.
 *
 * @param {Object} order - The order object
 * @param {Object} buyer - The buyer object (must have phoneNumber field)
 * @returns {Promise<boolean>} True if SMS sent successfully, false otherwise
 */
async function sendBuyerDeliverySMS(order, buyer) {
  // Check if buyer has a phone number
  if (!buyer || !buyer.phoneNumber) {
    console.log(`Skipping buyer delivery SMS for order ${order.order_id}: No phone number available`);
    return false;
  }

  // Construct the SMS message
  const message = getBuyerDeliveryMessage(order);

  // Send SMS (non-blocking - failures won't affect order processing)
  return await sendSMS(buyer.phoneNumber, message);
}

/**
 * Sends order delivery SMS to seller.
 * 
 * This function sends an SMS notification to the seller when an order is delivered.
 * It's designed to be non-blocking and will not affect order processing if it fails.
 *
 * @param {Object} order - The order object
 * @param {Object} seller - The seller object (must have phoneNumber field)
 * @param {string} buyerName - The buyer's name for the notification
 * @returns {Promise<boolean>} True if SMS sent successfully, false otherwise
 */
async function sendSellerDeliverySMS(order, seller, buyerName) {
  // Check if seller has a phone number
  if (!seller || !seller.phoneNumber) {
    console.log(`Skipping seller delivery SMS for order ${order.order_id}: No phone number available`);
    return false;
  }

  // Construct the SMS message
  const message = getSellerDeliveryMessage(order, buyerName);

  // Send SMS (non-blocking - failures won't affect order processing)
  return await sendSMS(seller.phoneNumber, message);
}

/**
 * Sends order delivery SMS to both buyer and seller.
 * 
 * This is the main function that orchestrates sending SMS notifications to both
 * buyer and seller when an order is delivered. It's designed to be completely non-blocking
 * and will not throw errors that affect order processing.
 *
 * @param {Object} order - The order object (must have order_id, buyer, seller)
 * @param {Object} [buyer] - Optional buyer object (if not provided, will be fetched)
 * @param {Object} [seller] - Optional seller object (if not provided, will be fetched)
 * @returns {Promise<void>} Resolves when SMS sending attempts are complete (regardless of success/failure)
 */
async function sendOrderDeliverySMS(order, buyer = null, seller = null) {
  try {
    // Step 1: Fetch buyer if not provided
    let buyerData = buyer;
    if (!buyerData && order.buyer) {
      try {
        buyerData = await Buyer.findById(order.buyer).select('phoneNumber firstName lastName');
      } catch (error) {
        console.error(`Error fetching buyer for delivery SMS (order ${order.order_id}):`, error.message);
      }
    }

    // Step 2: Fetch seller if not provided
    let sellerData = seller;
    if (!sellerData && order.seller) {
      try {
        sellerData = await Seller.findById(order.seller).select('phoneNumber firstName lastName businessName storeName');
      } catch (error) {
        console.error(`Error fetching seller for delivery SMS (order ${order.order_id}):`, error.message);
      }
    }

    // Step 3: Send SMS to buyer (non-blocking)
    if (buyerData) {
      sendBuyerDeliverySMS(order, buyerData).catch(error => {
        console.error(`Error sending buyer delivery SMS for order ${order.order_id}:`, error.message);
      });
    }

    // Step 4: Send SMS to seller (non-blocking)
    if (sellerData) {
      const buyerName = buyerData 
        ? `${buyerData.firstName || ''} ${buyerData.lastName || ''}`.trim() || 'Customer'
        : 'Customer';
      
      sendSellerDeliverySMS(order, sellerData, buyerName).catch(error => {
        console.error(`Error sending seller delivery SMS for order ${order.order_id}:`, error.message);
      });
    }

    console.log(`Delivery SMS notification attempts initiated for order ${order.order_id}`);
  } catch (error) {
    // Log error but don't throw - SMS failures should never affect order processing
    console.error(`Error in sendOrderDeliverySMS for order ${order.order_id}:`, error.message);
  }
}

/**
 * Constructs SMS message for seller stream reminder notification.
 *
 * This function creates a professional SMS message for sellers reminding them
 * about their upcoming scheduled stream.
 *
 * @param {Object} stream - The stream object
 * @param {string} stream.title - The stream title
 * @param {Date} stream.scheduledStartTime - The scheduled start time
 * @returns {string} Formatted SMS message for seller
 */
function getSellerStreamReminderMessage(stream) {
  const startTime = new Date(stream.scheduledStartTime);
  const formattedTime = startTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return `Hi! Reminder: Your Auqli stream "${stream.title}" is scheduled to start in 2 hours (${formattedTime}). Get ready to go live!`;
}

/**
 * Constructs SMS message for buyer stream reminder notification.
 *
 * This function creates a professional SMS message for buyers reminding them
 * about an upcoming stream they're subscribed to.
 *
 * @param {Object} stream - The stream object
 * @param {string} stream.title - The stream title
 * @param {Object} seller - The seller object
 * @param {string} seller.storeName - The seller's store name
 * @param {Date} stream.scheduledStartTime - The scheduled start time
 * @returns {string} Formatted SMS message for buyer
 */
function getBuyerStreamReminderMessage(stream, seller) {
  const startTime = new Date(stream.scheduledStartTime);
  const formattedTime = startTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  const storeName = seller?.storeName || seller?.businessName || 'Your favorite seller';
  const streamType = stream.type === 'auction' ? 'auction' : 'show';
  
  return `Hi! Reminder: ${storeName}'s ${streamType} "${stream.title}" starts in 2 hours (${formattedTime}). Don't miss it!`;
}

/**
 * Sends stream reminder SMS to seller.
 * 
 * This function sends an SMS reminder to the seller about their upcoming stream.
 * It's designed to be non-blocking and will not affect stream processing if it fails.
 *
 * @param {Object} stream - The stream object
 * @param {Object} seller - The seller object (must have phoneNumber field)
 * @returns {Promise<boolean>} True if SMS sent successfully, false otherwise
 */
async function sendSellerStreamReminderSMS(stream, seller) {
  // Check if seller has a phone number
  if (!seller || !seller.phoneNumber) {
    console.log(`Skipping seller stream reminder SMS for stream ${stream._id}: No phone number available`);
    return false;
  }

  // Construct the SMS message
  const message = getSellerStreamReminderMessage(stream);

  // Send SMS (non-blocking - failures won't affect stream processing)
  return await sendSMS(seller.phoneNumber, message);
}

/**
 * Sends stream reminder SMS to buyer.
 * 
 * This function sends an SMS reminder to a buyer about an upcoming stream they're subscribed to.
 * It's designed to be non-blocking and will not affect stream processing if it fails.
 *
 * @param {Object} stream - The stream object
 * @param {Object} buyer - The buyer object (must have phoneNumber field)
 * @param {Object} seller - The seller object (for store name)
 * @returns {Promise<boolean>} True if SMS sent successfully, false otherwise
 */
async function sendBuyerStreamReminderSMS(stream, buyer, seller) {
  // Check if buyer has a phone number
  if (!buyer || !buyer.phoneNumber) {
    console.log(`Skipping buyer stream reminder SMS for stream ${stream._id}: No phone number available`);
    return false;
  }

  // Construct the SMS message
  const message = getBuyerStreamReminderMessage(stream, seller);

  // Send SMS (non-blocking - failures won't affect stream processing)
  return await sendSMS(buyer.phoneNumber, message);
}

/**
 * Sends stream reminder SMS to seller and all subscribed buyers.
 * 
 * This is the main function that orchestrates sending SMS reminders to the seller
 * and all subscribed buyers about an upcoming stream. It's designed to be completely
 * non-blocking and will not throw errors that affect stream processing.
 *
 * @param {string} streamId - The stream ID
 * @returns {Promise<void>} Resolves when SMS sending attempts are complete (regardless of success/failure)
 */
async function sendStreamReminderSMS(streamId) {
  try {
    const Stream = require('../../../models/Stream');
    const mongoose = require('mongoose');
    
    // Fetch the stream with populated seller and subscribers
    const stream = await Stream.findById(streamId)
      .populate('seller', 'phoneNumber storeName businessName')
      .populate('subscribers.buyer', 'phoneNumber firstName lastName')
      .lean();

    if (!stream) {
      console.error(`Stream not found for reminder SMS: ${streamId}`);
      return;
    }

    // Check if stream is still scheduled (not started, cancelled, or ended)
    if (stream.status !== 'scheduled') {
      console.log(`Skipping reminder SMS for stream ${streamId}: Stream status is ${stream.status}, not scheduled`);
      return;
    }

    // Check if scheduled time is still in the future
    const now = new Date();
    const scheduledTime = new Date(stream.scheduledStartTime);
    if (scheduledTime <= now) {
      console.log(`Skipping reminder SMS for stream ${streamId}: Scheduled time has passed`);
      return;
    }

    // Step 1: Send SMS to seller (non-blocking)
    if (stream.seller) {
      sendSellerStreamReminderSMS(stream, stream.seller).catch(error => {
        console.error(`Error sending seller reminder SMS for stream ${streamId}:`, error.message);
      });
    }

    // Step 2: Send SMS to all subscribed buyers (non-blocking)
    if (stream.subscribers && stream.subscribers.length > 0) {
      const Buyer = mongoose.model('Buyer');
      
      // Process each subscriber
      for (const subscriber of stream.subscribers) {
        if (subscriber.buyer) {
          // If buyer is already populated, use it; otherwise fetch it
          let buyer = subscriber.buyer;
          if (typeof buyer === 'string' || buyer._id) {
            try {
              buyer = await Buyer.findById(typeof buyer === 'string' ? buyer : buyer._id)
                .select('phoneNumber firstName lastName');
            } catch (error) {
              console.error(`Error fetching buyer for reminder SMS (stream ${streamId}):`, error.message);
              continue;
            }
          }

          if (buyer && buyer.phoneNumber) {
            sendBuyerStreamReminderSMS(stream, buyer, stream.seller).catch(error => {
              console.error(`Error sending buyer reminder SMS for stream ${streamId} (buyer ${buyer._id}):`, error.message);
            });
          }
        }
      }
    }

    console.log(`Stream reminder SMS notification attempts initiated for stream ${streamId}`);
  } catch (error) {
    // Log error but don't throw - SMS failures should never affect stream processing
    console.error(`Error in sendStreamReminderSMS for stream ${streamId}:`, error.message);
  }
}

module.exports = {
  sendOrderPaymentConfirmationSMS,
  sendBuyerOrderConfirmationSMS,
  sendSellerOrderNotificationSMS,
  sendOrderCancellationSMS,
  sendOrderDeliverySMS,
  sendStreamReminderSMS,
  sendSMS
};

