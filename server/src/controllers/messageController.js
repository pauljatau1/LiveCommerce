const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { s3 } = require('../config/awsConfig');
const mongoose = require('mongoose');

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
    const { recipientId, recipientModel, messageType, content } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No media files provided' });
    }

    const mediaFiles = await Promise.all(files.map(async (file) => {
      const key = `messages/${Date.now()}-${file.originalname}`;
      await s3.upload({
        Bucket: 'auqli-uploads',
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      }).promise();

      return {
        url: `https://auqli-uploads.s3.amazonaws.com/${key}`,
        public_id: key,
        fileType: file.mimetype,
        fileName: file.originalname,
        fileSize: file.size
      };
    }));

    // Find or create conversation (similar to sendTextMessage)
    // Create message with media
    // Update conversation
    // Similar logic to sendTextMessage but with media array

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send media message', error: error.message });
  }
};

// Get messages in a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
}; 