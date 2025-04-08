const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { s3 } = require('../config/awsConfig');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { createNotification, createBuyerNotification } = require('./notificationController');
const Order = require('../models/Order');
const { saveToken, getToken } = require('../../Firebase');
const { Expo } = require('expo-server-sdk');
const sgMail = require('@sendgrid/mail');
const { agenda } = require('../config/agenda');

const expo = new Expo();

// Helper function to create message preview
const createMessagePreview = (content, messageType) => {
  if (messageType === 'text') {
    return content.length > 50 ? `${content.substring(0, 47)}...` : content;
  } else if (messageType === 'product') {
    return 'Shared a product';
  } else {
    return `Sent ${messageType}`;
  }
};

// Helper function to check if we should send an email notification to seller
// about new messages (respecting 5-minute cooldown)
const shouldSendSellerNotification = async (sellerId) => {
  const Seller = require('../models/Seller');
  const seller = await Seller.findById(sellerId);
  
  if (!seller) return false;
  
  // If no notification has been sent yet, or it's been more than 5 minutes since the last one
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  if (!seller.messageNotifications.lastSentAt || 
      seller.messageNotifications.lastSentAt < fiveMinutesAgo) {
    return true;
  }
  
  return false;
};

// Helper function to send email notification to seller about new message(s)
const sendSellerMessageNotification = async (sellerId, buyerName, messagePreview, conversationId) => {
  try {
    const Seller = require('../models/Seller');
    
    // Find the seller
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      console.error('Seller not found for message notification:', sellerId);
      return;
    }
    
    // Check notification preferences if the seller has opted out of email notifications
    if (seller.notificationPreferences && seller.notificationPreferences.emailNotifications === false) {
      console.log(`Seller ${sellerId} has opted out of email notifications`);
      return;
    }
    
    // Check if we should send an email notification (respecting 5-minute cooldown)
    const shouldSend = await shouldSendSellerNotification(sellerId);
    
    // Track this conversation as having new messages
    if (!seller.messageNotifications.conversationsWithNewMessages.includes(conversationId)) {
      seller.messageNotifications.pendingCount += 1;
      seller.messageNotifications.conversationsWithNewMessages.push(conversationId);
      await seller.save();
    }
    
    // If we shouldn't send an email now, just update the counter and exit
    if (!shouldSend) {
      console.log(`Skipping message notification email for seller ${sellerId} due to cooldown`);
      return;
    }
    
    // Set up SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Get conversation count for message
    const conversationCount = seller.messageNotifications.conversationsWithNewMessages.length;
    
    // Build email content
    let emailSubject = `New message from ${buyerName} - Auqli`;
    let emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You have a new message!</h2>
        <p>Dear ${seller.firstName},</p>
        <p>${buyerName} has sent you a message: "${messagePreview}"</p>
        <p>Please log in to your Auqli account to respond.</p>
        <p><a href="${process.env.FRONTEND_URL}/dashboard/messages/${conversationId}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">View Messages</a></p>
        <p>Best regards,<br>The Auqli Team</p>
      </div>
    `;
    
    // If there are multiple conversations with new messages, adjust the email content
    if (conversationCount > 1) {
      emailSubject = `You have ${conversationCount} conversations with new messages - Auqli`;
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You have new messages!</h2>
          <p>Dear ${seller.firstName},</p>
          <p>You have ${conversationCount} conversations with new messages on Auqli.</p>
          <p>Please log in to your Auqli account to respond to your customers.</p>
          <p><a href="${process.env.FRONTEND_URL}/dashboard/messages" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">View All Messages</a></p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `;
    }
    
    // Send the email
    const msg = {
      to: seller.email,
      from: 'Auqli Messages <support@auqli.com>',
      subject: emailSubject,
      html: emailContent
    };
    
    await sgMail.send(msg);
    console.log(`Message notification email sent to seller ${sellerId}`);
    
    // Update the seller's notification status
    seller.messageNotifications.lastSentAt = new Date();
    seller.messageNotifications.pendingCount = 0;
    seller.messageNotifications.conversationsWithNewMessages = [];
    await seller.save();
    
  } catch (error) {
    console.error('Error sending seller message notification:', error);
    // Don't throw the error to prevent message sending from failing
  }
};

// Helper function to create message notifications
const createMessageNotifications = async (message, senderName, recipientName) => {
  try {
    const messagePreview = createMessagePreview(message.content, message.messageType);
    
    // Populate sender information if not already populated
    let sender;
    if (message.sender.model === 'Buyer') {
      const Buyer = require('../models/Buyer');
      sender = await Buyer.findById(message.sender.id);
      senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Unknown User';
    } else {
      const Seller = require('../models/Seller');
      sender = await Seller.findById(message.sender.id);
      senderName = sender ? (sender.businessName || sender.storeName) : 'Unknown Seller';
    }
    
    // Create notification based on recipient type
    if (message.recipient.model === 'Seller') {
      await createNotification(message.recipient.id, 'buyer_message', {
        buyerName: senderName,
        messagePreview,
        conversationId: message.conversation
      });
      
      // If the sender is a buyer and recipient is a seller, send email notification to seller
      if (message.sender.model === 'Buyer') {
        await sendSellerMessageNotification(
          message.recipient.id, 
          senderName,
          messagePreview,
          message.conversation
        );
      }
    } else {
      await createBuyerNotification(message.recipient.id, 'seller_message', {
        sellerName: senderName,
        messagePreview,
        conversationId: message.conversation
      });
    }
  } catch (error) {
    console.error('Error creating message notification:', error);
    // Don't throw error to prevent message sending from failing
  }
};

// Send text message
exports.sendTextMessage = async (req, res) => {
  try {
    const { recipientId, recipientModel, content } = req.body;
    const senderId = req.user.id;
    const senderModel = req.user.role;

    // Find or create conversation
    let conversation = await Conversation.findOne({
      'participants': {
        $all: [
          { $elemMatch: { id: senderId, model: senderModel } },
          { $elemMatch: { id: recipientId, model: recipientModel } }
        ]
      }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { id: senderId, model: senderModel },
          { id: recipientId, model: recipientModel }
        ]
      });
    }

    // Create message
    const message = new Message({
      conversation: conversation._id,
      sender: { id: senderId, model: senderModel },
      recipient: { id: recipientId, model: recipientModel },
      content,
      messageType: 'text'
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = {
      content,
      sender: { id: senderId, model: senderModel },
      messageType: 'text',
      createdAt: message.createdAt
    };
    
    // Increment unread count for recipient
    const recipientKey = `${recipientId.toString()}`;
    const currentCount = conversation.unreadCount.get(recipientKey) || 0;
    conversation.unreadCount.set(recipientKey, currentCount + 1);

    await conversation.save();

    // Create notification
    await createMessageNotifications(message);

    // Send push notification to recipient if they have a token
    try {
      const userToken = await getToken(recipientId);
      if (userToken && Expo.isExpoPushToken(userToken.token)) {
        // Get sender name for the notification title
        let senderName = 'New Message';
        
        if (senderModel === 'Seller') {
          const Seller = require('../models/Seller');
          const seller = await Seller.findById(senderId);
          if (seller) {
            senderName = seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`;
          }
        } else if (senderModel === 'Buyer') {
          const Buyer = require('../models/Buyer');
          const buyer = await Buyer.findById(senderId);
          if (buyer) {
            senderName = `${buyer.firstName} ${buyer.lastName}`;
          }
        }
        
        const pushMessage = {
          to: userToken.token,
          sound: 'default',
          title: `Message from ${senderName}`,
          body: content.length > 50 ? `${content.substring(0, 47)}...` : content,
          data: { 
            type: 'message',
            conversationId: conversation._id.toString(),
            senderId: senderId.toString(),
            senderModel
          },
        };

        await expo.sendPushNotificationsAsync([pushMessage]);
      }
    } catch (pushError) {
      // Log push notification error but don't fail the request
      console.error('Push notification error:', pushError);
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// Send media message
exports.sendMediaMessage = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Files received:', req.files);

    const { recipientId, recipientModel, messageType, content } = req.body;
    const senderId = req.user.id;
    const senderModel = req.user.role;
    const files = req.files;

    // Validate required fields
    if (!recipientId || !recipientModel || !messageType) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        received: { recipientId, recipientModel, messageType } 
      });
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ 
        message: 'No media files provided',
        filesReceived: files 
      });
    }

    // Upload files to S3
    const mediaFiles = await Promise.all(files.map(async (file) => {
      console.log('Processing file:', file.originalname);
      const key = `messages/${Date.now()}-${file.originalname}`;
      
      const uploadResult = await s3.upload({
        Bucket: process.env.CDN_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      }).promise();

      console.log('S3 upload result:', uploadResult);

      return {
        url: `https://` + process.env.CDN_URL + `/${key}`,
        public_id: key,
        fileType: file.mimetype,
        fileName: file.originalname,
        fileSize: file.size
      };
    }));

    // Find or create conversation
    let conversation = await Conversation.findOne({
      'participants': {
        $all: [
          { $elemMatch: { id: senderId, model: senderModel } },
          { $elemMatch: { id: recipientId, model: recipientModel } }
        ]
      }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { id: senderId, model: senderModel },
          { id: recipientId, model: recipientModel }
        ]
      });
      await conversation.save();
    }

    // Create and save the message
    const newMessage = new Message({
      conversation: conversation._id,
      sender: { id: senderId, model: senderModel },
      recipient: { id: recipientId, model: recipientModel },
      content: content || '',
      messageType,
      media: mediaFiles
    });

    const savedMessage = await newMessage.save();
    console.log('Saved message:', savedMessage);

    // Update conversation
    conversation.lastMessage = {
      content: content || `Sent ${messageType}`,
      sender: { id: senderId, model: senderModel },
      messageType,
      createdAt: savedMessage.createdAt
    };

    // Increment unread count for recipient
    const recipientKey = recipientId.toString();
    const currentCount = conversation.unreadCount.get(recipientKey) || 0;
    conversation.unreadCount.set(recipientKey, currentCount + 1);

    await conversation.save();

    // Create notification and send email notification if recipient is a seller and sender is a buyer
    await createMessageNotifications(savedMessage);

    // Send push notification to recipient if they have a token
    try {
      const userToken = await getToken(recipientId);
      if (userToken && Expo.isExpoPushToken(userToken.token)) {
        // Get sender name for the notification title
        let senderName = 'New Message';
        
        if (senderModel === 'Seller') {
          const Seller = require('../models/Seller');
          const seller = await Seller.findById(senderId);
          if (seller) {
            senderName = seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`;
          }
        } else if (senderModel === 'Buyer') {
          const Buyer = require('../models/Buyer');
          const buyer = await Buyer.findById(senderId);
          if (buyer) {
            senderName = `${buyer.firstName} ${buyer.lastName}`;
          }
        }

        const messagePreview = content || `Sent ${messageType}`;
        
        const pushMessage = {
          to: userToken.token,
          sound: 'default',
          title: `message from ${senderName}`,
          body: messagePreview.length > 50 ? `${messagePreview.substring(0, 47)}...` : messagePreview,
          data: { 
            type: 'message',
            conversationId: conversation._id.toString(),
            senderId: senderId.toString(),
            senderModel
          },
        };

        await expo.sendPushNotificationsAsync([pushMessage]);
      }
    } catch (pushError) {
      // Log push notification error but don't fail the request
      console.error('Push notification error:', pushError);
    }

    res.status(201).json({ 
      message: savedMessage, 
      mediaUrls: mediaFiles.map(file => file.url) 
    });
  } catch (error) {
    console.error('Media message error:', error);
    res.status(500).json({ 
      message: 'Failed to send media message', 
      error: error.message,
      stack: error.stack 
    });
  }
};

// Get messages in a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // Count total messages in conversation
    const totalMessages = await Message.countDocuments({ conversation: conversationId });
    const totalPages = Math.ceil(totalMessages / limit);
    
    // Calculate skip count for pagination
    const skipCount = (page - 1) * limit;
    
    // Query messages
    const query = { conversation: conversationId };
    const messages = await Message.find(query)
      .populate({
        path: 'sender.id',
        refPath: 'sender.model',
        select: 'firstName lastName profileImage storeName storeAvatar businessName country city emailVerified isVerified'
      })
      .populate({
        path: 'recipient.id',
        refPath: 'recipient.model',
        select: 'firstName lastName profileImage storeName storeAvatar businessName country city emailVerified isVerified'
      })
      .populate({
        path: 'product.id',
        model: 'Product',
        select: 'name price images description inventory.sku category'
      })
      .sort({ createdAt: -1 }) // Sort newest first for proper pagination
      .skip(skipCount)
      .limit(limit)
      .lean();

    // Transform messages to include formatted participant info
    const formattedMessages = messages.map(message => {
      const senderInfo = message.sender.id ? {
        id: message.sender.id._id,
        model: message.sender.model,
        name: message.sender.model === 'Buyer' 
          ? `${message.sender.id.firstName} ${message.sender.id.lastName}`
          : message.sender.id.storeName || message.sender.id.businessName,
        avatar: message.sender.model === 'Buyer' 
          ? message.sender.id.profileImage?.url
          : message.sender.id.storeAvatar?.url,
        location: {
          country: message.sender.id.country,
          city: message.sender.id.city
        },
        verified: message.sender.model === 'Buyer' 
          ? message.sender.id.emailVerified
          : message.sender.id.isVerified
      } : message.sender;

      const recipientInfo = message.recipient.id ? {
        id: message.recipient.id._id,
        model: message.recipient.model,
        name: message.recipient.model === 'Buyer' 
          ? `${message.recipient.id.firstName} ${message.recipient.id.lastName}`
          : message.recipient.id.storeName || message.recipient.id.businessName,
        avatar: message.recipient.model === 'Buyer' 
          ? message.recipient.id.profileImage?.url
          : message.recipient.id.storeAvatar?.url,
        location: {
          country: message.recipient.id.country,
          city: message.recipient.id.city
        },
        verified: message.recipient.model === 'Buyer' 
          ? message.recipient.id.emailVerified
          : message.recipient.id.isVerified
      } : message.recipient;

      return {
        ...message,
        sender: senderInfo,
        recipient: recipientInfo
      };
    });

    res.json({
      messages: formattedMessages,
      pagination: {
        currentPage: page,
        totalPages,
        totalMessages,
        hasMore: page < totalPages,
        hasPrevious: page > 1
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve messages', 
      error: error.message 
    });
  }
};

// Send product message
exports.sendProductMessage = async (req, res) => {
  try {
    const { recipientId, recipientModel, content, productId } = req.body;
    const senderId = req.user.id;
    const senderModel = req.user.role;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      'participants': {
        $all: [
          { $elemMatch: { id: senderId, model: senderModel } },
          { $elemMatch: { id: recipientId, model: recipientModel } }
        ]
      }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { id: senderId, model: senderModel },
          { id: recipientId, model: recipientModel }
        ]
      });
      await conversation.save();
    }

    // Create message with product info
    const message = new Message({
      conversation: conversation._id,
      sender: { id: senderId, model: senderModel },
      recipient: { id: recipientId, model: recipientModel },
      content: content || '',
      messageType: 'product',
      product: {
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0]?.url || '',
        description: product.description
      }
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = {
      content: content || `Shared product: ${product.name}`,
      sender: { id: senderId, model: senderModel },
      messageType: 'product',
      createdAt: message.createdAt
    };

    // Increment unread count for recipient
    const recipientKey = recipientId.toString();
    const currentCount = conversation.unreadCount.get(recipientKey) || 0;
    conversation.unreadCount.set(recipientKey, currentCount + 1);

    await conversation.save();

    // Create notification and send email notification if recipient is a seller and sender is a buyer
    await createMessageNotifications(message);

    // Send push notification to recipient if they have a token
    try {
      const userToken = await getToken(recipientId);
      if (userToken && Expo.isExpoPushToken(userToken.token)) {
        // Get sender name for the notification title
        let senderName = 'New Message';
        
        if (senderModel === 'Seller') {
          const Seller = require('../models/Seller');
          const seller = await Seller.findById(senderId);
          if (seller) {
            senderName = seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`;
          }
        } else if (senderModel === 'Buyer') {
          const Buyer = require('../models/Buyer');
          const buyer = await Buyer.findById(senderId);
          if (buyer) {
            senderName = `${buyer.firstName} ${buyer.lastName}`;
          }
        }
        
        const pushMessage = {
          to: userToken.token,
          sound: 'default',
          title: `message from ${senderName}`,
          body: `Shared product: ${product.name}`,
          data: { 
            type: 'message',
            conversationId: conversation._id.toString(),
            senderId: senderId.toString(),
            senderModel,
            productId: product._id.toString()
          },
        };

        await expo.sendPushNotificationsAsync([pushMessage]);
      }
    } catch (pushError) {
      // Log push notification error but don't fail the request
      console.error('Push notification error:', pushError);
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('Product message error:', error);
    res.status(500).json({ 
      message: 'Failed to send product message', 
      error: error.message 
    });
  }
};

// Send order message
exports.sendOrderMessage = async (req, res) => {
  try {
    const { recipientId, recipientModel, content, orderId } = req.body;
    const senderId = req.user.id;
    const senderModel = req.user.role;

    // Validate order exists and populate necessary fields
    const order = await Order.findById(orderId)
      .populate('items.product', 'name images price')
      .populate('shipping')
      .populate('delivery_address');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      'participants': {
        $all: [
          { $elemMatch: { id: senderId, model: senderModel } },
          { $elemMatch: { id: recipientId, model: recipientModel } }
        ]
      }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { id: senderId, model: senderModel },
          { id: recipientId, model: recipientModel }
        ]
      });
      await conversation.save();
    }

    // Format order items for the message
    const formattedItems = order.items.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      image: item.product.images[0]?.url || ''
    }));

    // Create message with order info
    const message = new Message({
      conversation: conversation._id,
      sender: { id: senderId, model: senderModel },
      recipient: { id: recipientId, model: recipientModel },
      content: content || '',
      messageType: 'order',
      order: {
        id: order._id,
        items: formattedItems,
        shippingFee: order.shipping?.fee?.amount || 0,
        totalAmount: order.totalAmount,
        tracking: {
          number: order.shipping?.tracking?.number,
          url: order.shipping?.tracking?.url,
          carrier: order.shipping?.carrier?.name,
          status: order.shipping?.tracking?.status
        },
        delivery_address: {
          first_name: order.delivery_address?.first_name,
          last_name: order.delivery_address?.last_name,
          email: order.delivery_address?.email,
          phone: order.delivery_address?.phone,
          line1: order.delivery_address?.line1,
          line2: order.delivery_address?.line2,
          city: order.delivery_address?.city,
          state: order.delivery_address?.state,
          country: order.delivery_address?.country,
          zip: order.delivery_address?.zip
        },
        status: order.status
      }
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = {
      content: content || `Shared order #${order._id}`,
      sender: { id: senderId, model: senderModel },
      messageType: 'order',
      createdAt: message.createdAt
    };

    // Increment unread count for recipient
    const recipientKey = recipientId.toString();
    const currentCount = conversation.unreadCount.get(recipientKey) || 0;
    conversation.unreadCount.set(recipientKey, currentCount + 1);

    await conversation.save();

    // Create notification and send email notification if recipient is a seller and sender is a buyer
    await createMessageNotifications(message);

    // Send push notification to recipient if they have a token
    try {
      const userToken = await getToken(recipientId);
      if (userToken && Expo.isExpoPushToken(userToken.token)) {
        // Get sender name for the notification title
        let senderName = 'New Message';
        
        if (senderModel === 'Seller') {
          const Seller = require('../models/Seller');
          const seller = await Seller.findById(senderId);
          if (seller) {
            senderName = seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`;
          }
        } else if (senderModel === 'Buyer') {
          const Buyer = require('../models/Buyer');
          const buyer = await Buyer.findById(senderId);
          if (buyer) {
            senderName = `${buyer.firstName} ${buyer.lastName}`;
          }
        }
        
        const pushMessage = {
          to: userToken.token,
          sound: 'default',
          title: `message from ${senderName}`,
          body: `Shared order #${order._id}`,
          data: { 
            type: 'message',
            conversationId: conversation._id.toString(),
            senderId: senderId.toString(),
            senderModel,
            orderId: order._id.toString()
          },
        };

        await expo.sendPushNotificationsAsync([pushMessage]);
      }
    } catch (pushError) {
      // Log push notification error but don't fail the request
      console.error('Push notification error:', pushError);
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('Order message error:', error);
    res.status(500).json({ 
      message: 'Failed to send order message', 
      error: error.message 
    });
  }
};

module.exports = exports; 