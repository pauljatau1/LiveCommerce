const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { S3 } = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

exports.sendTextMessage = async (req, res) => {
  try {
    const { recipientId, recipientModel, content } = req.body;
    const senderId = req.user.id;
    const senderModel = req.user.model;

    // Find or create conversation
    let conversation = await findOrCreateConversation(senderId, senderModel, recipientId, recipientModel);

    // Create message
    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      senderModel,
      recipientModel,
      content,
      messageType: 'text'
    });

    // Update conversation
    await updateConversation(conversation._id, message._id, recipientId);

    // Populate and return message
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName name profileImage avatar')
      .populate('recipient', 'firstName lastName name profileImage avatar');

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

exports.sendMediaMessage = async (req, res) => {
  try {
    const { recipientId, recipientModel, content, messageType } = req.body;
    const mediaFiles = req.files;
    const senderId = req.user.id;
    const senderModel = req.user.model;

    if (!mediaFiles || mediaFiles.length === 0) {
      return res.status(400).json({ message: 'No media files provided' });
    }

    // Upload media files to S3
    const uploadedMedia = await Promise.all(mediaFiles.map(async (file) => {
      const params = {
        Bucket: 'auqli-uploads',
        Key: `messages/${uuidv4()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      const data = await s3.upload(params).promise();
      return {
        url: data.Location,
        public_id: data.Key,
        fileType: file.mimetype,
        fileName: file.originalname,
        fileSize: file.size
      };
    }));

    // Find or create conversation
    let conversation = await findOrCreateConversation(senderId, senderModel, recipientId, recipientModel);

    // Create message with media
    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      senderModel,
      recipientModel,
      content,
      messageType,
      media: uploadedMedia
    });

    // Update conversation
    await updateConversation(conversation._id, message._id, recipientId);

    // Populate and return message
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName name profileImage avatar')
      .populate('recipient', 'firstName lastName name profileImage avatar');

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send media message', error: error.message });
  }
};

exports.markMessagesAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user.id;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ message: 'Invalid message IDs provided' });
    }

    // Mark messages as read
    const messages = await Message.find({
      _id: { $in: messageIds },
      recipient: userId,
      read: false
    });

    if (!messages.length) {
      return res.status(200).json({ message: 'No unread messages found' });
    }

    // Update messages
    const updateResult = await Message.updateMany(
      {
        _id: { $in: messageIds },
        recipient: userId,
        read: false
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    );

    // Get unique conversation IDs from the messages
    const conversationIds = [...new Set(messages.map(msg => msg.conversationId))];

    // Reset unread counts for these conversations
    await Promise.all(conversationIds.map(async (conversationId) => {
      await Conversation.updateOne(
        { 
          _id: conversationId,
          'unreadCounts.userId': userId 
        },
        { 
          $set: { 'unreadCounts.$.count': 0 }
        }
      );
    }));

    res.json({ 
      message: 'Messages marked as read',
      updatedCount: updateResult.modifiedCount
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to mark messages as read', 
      error: error.message 
    });
  }
};

// Add utility functions for message status management
exports.markMessageDelivered = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      recipient: userId,
      deliveredAt: null
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or already delivered' });
    }

    message.deliveredAt = new Date();
    await message.save();

    res.json({ message: 'Message marked as delivered' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to mark message as delivered', 
      error: error.message 
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.countDocuments({
      recipient: userId,
      read: false
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get unread count', 
      error: error.message 
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const {
      page = 1,
      limit = 50,
      before = Date.now(),
      messageType
    } = req.query;

    // Verify conversation access
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': userId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Build query
    const query = {
      conversationId,
      timestamp: { $lt: new Date(before) }
    };

    if (messageType) {
      query.messageType = messageType;
    }

    // Get messages with pagination
    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'firstName lastName name profileImage avatar storeName')
      .populate('recipient', 'firstName lastName name profileImage avatar storeName');

    // Get total count for pagination
    const totalMessages = await Message.countDocuments(query);

    // Mark messages as delivered if recipient is requesting
    const undeliveredMessages = messages.filter(
      msg => 
        msg.recipient._id.toString() === userId && 
        !msg.deliveredAt
    );

    if (undeliveredMessages.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: undeliveredMessages.map(msg => msg._id) }
        },
        {
          $set: { deliveredAt: new Date() }
        }
      );
    }

    // Format messages for response
    const formattedMessages = messages.map(message => ({
      _id: message._id,
      content: message.content,
      messageType: message.messageType,
      media: message.media,
      timestamp: message.timestamp,
      read: message.read,
      readAt: message.readAt,
      deliveredAt: message.deliveredAt,
      sender: formatUser(message.sender, message.senderModel),
      recipient: formatUser(message.recipient, message.recipientModel)
    }));

    res.json({
      messages: formattedMessages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
        hasMore: totalMessages > page * limit
      }
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch messages', 
      error: error.message 
    });
  }
};

// Helper function to format user data based on model type
function formatUser(user, modelType) {
  if (modelType === 'Buyer') {
    return {
      _id: user._id,
      type: 'Buyer',
      name: `${user.firstName} ${user.lastName}`,
      image: user.profileImage
    };
  } else {
    return {
      _id: user._id,
      type: 'Seller',
      name: user.storeName || user.name,
      image: user.avatar
    };
  }
}

// // Add to Message model to track conversation
// const messageSchema = new mongoose.Schema({
//   // ... existing fields ...
  
// });

// Helper functions
async function findOrCreateConversation(senderId, senderModel, recipientId, recipientModel) {
  let conversation = await Conversation.findOne({
    'participants': {
      $all: [
        { $elemMatch: { userId: senderId, userModel: senderModel } },
        { $elemMatch: { userId: recipientId, userModel: recipientModel } }
      ]
    }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [
        { userId: senderId, userModel: senderModel },
        { userId: recipientId, userModel: recipientModel }
      ],
      unreadCounts: [
        { userId: recipientId, count: 1 },
        { userId: senderId, count: 0 }
      ]
    });
  } else {
    // Update unread count for recipient
    await Conversation.updateOne(
      { _id: conversation._id, 'unreadCounts.userId': recipientId },
      { $inc: { 'unreadCounts.$.count': 1 } }
    );
  }

  return conversation;
}

async function updateConversation(conversationId, messageId, recipientId) {
  await Conversation.updateOne(
    { _id: conversationId },
    { 
      $set: { 
        lastMessage: messageId,
        updatedAt: new Date()
      }
    }
  );
}
