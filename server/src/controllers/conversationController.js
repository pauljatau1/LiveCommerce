const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userModel = req.user.role;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const conversations = await Conversation.find({
      'participants': {
        $elemMatch: { id: userId, model: userModel }
      }
    })
    .populate({
      path: 'participants.id',
      refPath: 'participants.model',
      select: 'firstName lastName profileImage storeName storeAvatar businessName country city emailVerified isVerified'
    })
    .sort({ 'lastMessage.createdAt': -1 })
    .skip((page - 1) * limit)
    .limit(limit);

    // Transform conversations to include formatted participant info
    const formattedConversations = conversations.map(conversation => {
      const otherParticipant = conversation.participants.find(
        p => p.id._id.toString() !== userId
      );

      const participantInfo = otherParticipant.id ? {
        id: otherParticipant.id._id,
        model: otherParticipant.model,
        name: otherParticipant.model === 'Buyer' 
          ? `${otherParticipant.id.firstName} ${otherParticipant.id.lastName}`
          : otherParticipant.id.storeName || otherParticipant.id.businessName,
        avatar: otherParticipant.model === 'Buyer' 
          ? otherParticipant.id.profileImage?.url
          : otherParticipant.id.storeAvatar?.url,
        location: {
          country: otherParticipant.id.country,
          city: otherParticipant.id.city
        },
        verified: otherParticipant.model === 'Buyer' 
          ? otherParticipant.id.emailVerified
          : otherParticipant.id.isVerified
      } : otherParticipant;

      return {
        _id: conversation._id,
        participant: participantInfo,
        lastMessage: conversation.lastMessage,
        unreadCount: conversation.unreadCount.get(userId.toString()) || 0,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      };
    });

    const total = await Conversation.countDocuments({
      'participants': {
        $elemMatch: { id: userId, model: userModel }
      }
    });

    res.json({
      conversations: formattedConversations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalConversations: total,
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve conversations', 
      error: error.message 
    });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Get conversation with populated participants
    const conversation = await Conversation.findById(conversationId)
      .populate('participants.id', 'firstName lastName storeName avatarUrl');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Get all messages for this conversation
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 }); // Sort by oldest first

    // Reset unread count for this user
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        'recipient.id': userId,
        isRead: false
      },
      { isRead: true }
    );

    // Return both conversation details and messages
    res.json({
      conversation: conversation.toObject(),
      messages
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get conversation', error: error.message });
  }
};

exports.markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    await Message.updateMany(
      {
        conversation: conversationId,
        'recipient.id': userId,
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: 'Conversation marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark conversation as read', error: error.message });
  }
}; 