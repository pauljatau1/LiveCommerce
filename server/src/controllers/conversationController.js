const Conversation = require('../models/Conversation');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');

exports.getConversations = async (req, res) => {
    const userId = req.user.id;
    const userModel = req.user.model;
  
    try {
      const conversations = await Conversation.find({
        participants: { $elemMatch: { userId, userModel } },
      }).populate('lastMessage').sort({ updatedAt: -1 });
  
      const populatedConversations = await Promise.all(conversations.map(async (conversation) => {
        const populatedParticipants = await Promise.all(conversation.participants.map(async (participant) => {
          const user = participant.userModel === 'Buyer'
            ? await Buyer.findById(participant.userId).select('firstName lastName profileImage')
            : await Seller.findById(participant.userId).select('name avatar');
  
          return {
            ...participant.toObject(),
            user: {
              ...user.toObject(),
              model: participant.userModel,
            },
          };
        }));
  
        return {
          ...conversation.toObject(),
          participants: populatedParticipants,
        };
      }));
  
      res.json({ conversations: populatedConversations });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch conversations', error: error.message });
    }
  };
  

exports.getConversation = async (req, res) => {
    const { conversationId } = req.params;
  
    try {
      const conversation = await Conversation.findById(conversationId).populate('lastMessage');
      if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  
      const populatedParticipants = await Promise.all(conversation.participants.map(async (participant) => {
        const user = participant.userModel === 'Buyer'
          ? await Buyer.findById(participant.userId).select('firstName lastName profileImage')
          : await Seller.findById(participant.userId).select('name avatar');
  
        return {
          ...participant.toObject(),
          user: {
            ...user.toObject(),
            model: participant.userModel,
          },
        };
      }));
  
      const populatedConversation = {
        ...conversation.toObject(),
        participants: populatedParticipants,
      };
  
      res.json({ conversation: populatedConversation });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch conversation', error: error.message });
    }
  };
  