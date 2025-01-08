const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { s3 } = require('../config/awsConfig');
const mongoose = require('mongoose');
const Product = require('../models/Product');

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

    const messages = await Message.find({ conversation: conversationId })
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
      .sort({ createdAt: 1 });

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
        ...message.toObject(),
        sender: senderInfo,
        recipient: recipientInfo
      };
    });

    res.json(formattedMessages);
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

    res.status(201).json({ message });
  } catch (error) {
    console.error('Product message error:', error);
    res.status(500).json({ 
      message: 'Failed to send product message', 
      error: error.message 
    });
  }
}; 