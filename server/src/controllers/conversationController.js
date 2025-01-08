const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userModel = req.user.role;

    const conversations = await Conversation.find({
      'participants': {
        $elemMatch: { id: userId, model: userModel }
      }
    })
    .sort({ updatedAt: -1 })
    .populate('participants.id', 'firstName lastName storeName avatarUrl')
    .lean();

    // Add last message preview and unread count
    const conversationsWithDetails = conversations.map(conv => {
      return {
        ...conv,
        unreadCount: conv.unreadCount.get(userId.toString()) || 0,
        otherParticipant: conv.participants.find(
          p => p.id._id.toString() !== userId.toString()
        )
      };
    });

    res.json(conversationsWithDetails);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get conversations', error: error.message });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId)
      .populate('participants.id', 'firstName lastName storeName avatarUrl');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

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

    res.json(conversation);
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