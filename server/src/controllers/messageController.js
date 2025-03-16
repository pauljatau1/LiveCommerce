const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { s3 } = require('../config/awsConfig');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { createNotification, createBuyerNotification } = require('./notificationController');
const Order = require('../models/Order');
const { saveToken, getToken } = require('../../Firebase');
const { Expo } = require('expo-server-sdk');

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

    // Send push notification to sender
    const userToken = await getToken(senderId);
    if (userToken) {
      await expo.sendPushNotificationsAsync([{
        to: userToken.token,
        title: `New Message`,
        body: `You have a new message`
      }]);
    }

    res.status(201).json({ message });
  } catch (error) {
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
        Bucket: 'auqli-uploads',
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      }).promise();

      console.log('S3 upload result:', uploadResult);

      return {
        url: `https://auqli-uploads.s3.amazonaws.com/${key}`,
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

    // Create notification
    await createMessageNotifications(savedMessage);

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
    
    console.log('Getting messages for conversation:', {
      conversationId,
      userId,
      userRole: req.user.role
    });
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // If no page is specified, get the last 20 messages
    const totalMessages = await Message.countDocuments({ conversation: conversationId });
    console.log('Total messages in conversation:', totalMessages);
    
    const totalPages = Math.ceil(totalMessages / limit);
    
    // If no page specified, calculate the last page
    const effectivePage = !req.query.page ? totalPages : page;
    
    console.log('Pagination details:', {
      page,
      limit,
      totalPages,
      effectivePage
    });
    
    // Debug: Check all message types in this conversation
    const messageTypesInConversation = await Message.distinct('messageType', { conversation: conversationId });
    console.log('All message types in conversation:', messageTypesInConversation);

    // Debug: Count of each message type
    const messageCounts = await Message.aggregate([
      { $match: { conversation: new mongoose.Types.ObjectId(conversationId) } },
      { $group: { _id: '$messageType', count: { $sum: 1 } } }
    ]);
    console.log('Message type counts:', messageCounts);

    // Explicitly set up the query to ensure we get all message types
    const query = {
      conversation: conversationId
    };

    // Always start from the beginning for first page
    const skipCount = (page - 1) * limit;

    console.log('Skip and limit:', { skipCount, limit, page });

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
      .sort({ createdAt: -1 }) // Sort oldest first
      .skip(skipCount)
      .limit(limit)
      .lean();

    // Add debug logging for the actual messages being returned
    console.log('Retrieved messages count:', messages.length);
    console.log('First message timestamp:', messages[0]?.createdAt);
    console.log('Last message timestamp:', messages[messages.length - 1]?.createdAt);
    console.log('Message types in this batch:', messages.map(m => m.messageType));

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
        currentPage: effectivePage,
        totalPages,
        totalMessages,
        hasMore: effectivePage < totalPages,
        hasPrevious: effectivePage > 1
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

    // Create notification
    await createMessageNotifications(message);

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

    // Create notification
    await createMessageNotifications(message);

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