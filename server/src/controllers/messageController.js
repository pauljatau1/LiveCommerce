const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');

exports.sendMessage = async (req, res) => {
    const { recipientId, recipientModel, content } = req.body;
    const senderId = req.user.id;
    const senderModel = req.user.role; 
  
    try {
      const message = new Message({
        sender: senderId,
        recipient: recipientId,
        senderModel,
        recipientModel,
        content,
      });
      await message.save();
  
      let conversation = await Conversation.findOne({
        participants: {
          $all: [
            { userId: senderId, userModel: senderModel },
            { userId: recipientId, userModel: recipientModel },
          ],
        },
      });
  
      if (!conversation) {
        conversation = new Conversation({
          participants: [
            { userId: senderId, userModel: senderModel },
            { userId: recipientId, userModel: recipientModel },
          ],
          lastMessage: message._id,
        });
      } else {
        conversation.lastMessage = message._id;
        conversation.unreadMessageCount += 1;
      }
  
      await conversation.save();
  
      // Add conversation to both users' conversation lists
      const sender = senderModel === 'Buyer' ? await Buyer.findById(senderId) : await Seller.findById(senderId);
      const recipient = recipientModel === 'Buyer' ? await Buyer.findById(recipientId) : await Seller.findById(recipientId);
  
      sender.conversations.push(conversation._id);
      recipient.conversations.push(conversation._id);
  
      await sender.save();
      await recipient.save();
  
      res.status(201).json({ message: 'Message sent successfully', message, conversation });
    } catch (error) {
      res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
  };
  

exports.getMessages = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userModel = req.user.role;
  
    try {
      const conversation = await Conversation.findById(conversationId).populate('participants lastMessage');
      if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  
      const messages = await Message.find({
        $or: [
          { sender: userId, recipient: conversation.participants.find(p => p.userId.toString() !== userId).userId },
          { sender: conversation.participants.find(p => p.userId.toString() !== userId).userId, recipient: userId },
        ],
      }).sort({ timestamp: 1 });
  
      const populatedMessages = await Promise.all(messages.map(async (message) => {
        const sender = message.senderModel === 'Buyer'
          ? await Buyer.findById(message.sender).select('firstName lastName profileImage')
          : await Seller.findById(message.sender).select('name avatar');
  
        const recipient = message.recipientModel === 'Buyer'
          ? await Buyer.findById(message.recipient).select('firstName lastName profileImage')
          : await Seller.findById(message.recipient).select('name avatar');
  
        return {
          ...message.toObject(),
          sender: {
            ...sender.toObject(),
            model: message.senderModel,
          },
          recipient: {
            ...recipient.toObject(),
            model: message.recipientModel,
          },
        };
      }));
  
      res.json({ messages: populatedMessages });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
    }
  };
