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
        p => p.id && p.id._id && p.id._id.toString() !== userId
      );
      const currentUserParticipant = conversation.participants.find(
        p => p.id && p.id._id && p.id._id.toString() === userId
      );

      // Check if otherParticipant exists and has valid data
      if (!otherParticipant || !otherParticipant.id) {
        return {
          _id: conversation._id,
          participant: {
            id: null,
            model: null,
            name: 'Unknown User',
            avatar: null,
            location: { country: null, city: null },
            verified: false,
            isOnline: false,
            lastActive: null
          },
          lastMessage: conversation.lastMessage,
          unreadCount: conversation.unreadCount.get(userId.toString()) || 0,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          settings: {
            isBlocked: false,
            isMuted: false
          }
        };
      }

      const participantInfo = {
        id: otherParticipant.id._id,
        model: otherParticipant.model,
        name: otherParticipant.model === 'Buyer' 
          ? `${otherParticipant.id.firstName || ''} ${otherParticipant.id.lastName || ''}`.trim() || 'Unknown User'
          : otherParticipant.id.storeName || otherParticipant.id.businessName || 'Unknown Business',
        avatar: otherParticipant.model === 'Buyer' 
          ? otherParticipant.id.profileImage?.url || null
          : otherParticipant.id.storeAvatar?.url || null,
        location: {
          country: otherParticipant.id.country || null,
          city: otherParticipant.id.city || null
        },
        verified: otherParticipant.model === 'Buyer' 
          ? !!otherParticipant.id.emailVerified
          : !!otherParticipant.id.isVerified,
        isOnline: otherParticipant.isOnline || false,
        lastActive: otherParticipant.lastActive || null
      };

      // Get chat settings
      const settings = {
        isBlocked: otherParticipant.settings?.isBlocked || false,
        isMuted: currentUserParticipant.settings?.isMuted || false,
        blockedBy: otherParticipant.settings?.blockedBy || null,
        mutedBy: currentUserParticipant.settings?.mutedBy || null
      };

      return {
        _id: conversation._id,
        participant: participantInfo,
        lastMessage: conversation.lastMessage,
        unreadCount: conversation.unreadCount.get(userId.toString()) || 0,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        settings
      };
    });

    // Filter out any null values that might have occurred during mapping
    const validConversations = formattedConversations.filter(conv => conv !== null);

    const total = await Conversation.countDocuments({
      'participants': {
        $elemMatch: { id: userId, model: userModel }
      }
    });

    res.json({
      conversations: validConversations,
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
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Get conversation with populated participants
    const conversation = await Conversation.findById(conversationId)
      .populate({
        path: 'participants.id',
        refPath: 'participants.model',
        select: 'firstName lastName profileImage storeName storeAvatar businessName country city emailVerified isVerified'
      });

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

    // Get current user's participant object and other participant's object
    const currentUserParticipant = conversation.participants.find(
      p => p.id._id.toString() === userId
    );
    const otherParticipant = conversation.participants.find(
      p => p.id._id.toString() !== userId
    );

    // Format conversation with participant status and settings
    const formattedConversation = {
      ...conversation.toObject(),
      participants: conversation.participants.map(participant => ({
        ...participant.toObject(),
        id: {
          ...participant.id.toObject(),
          isOnline: participant.isOnline || false,
          lastActive: participant.lastActive || null
        }
      })),
      settings: {
        isBlocked: otherParticipant.settings?.isBlocked || false,
        isMuted: currentUserParticipant.settings?.isMuted || false,
        blockedBy: otherParticipant.settings?.blockedBy || null,
        mutedBy: currentUserParticipant.settings?.mutedBy || null
      }
    };

    // Return both conversation details and messages
    res.json({
      conversation: formattedConversation,
      messages: messages.map(message => ({
        ...message.toObject(),
        sender: {
          ...message.sender,
          isOnline: conversation.participants.find(
            p => p.id._id.toString() === message.sender.id.toString()
          )?.isOnline || false,
          lastActive: conversation.participants.find(
            p => p.id._id.toString() === message.sender.id.toString()
          )?.lastActive || null
        }
      }))
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

exports.blockUser = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Find the other participant
    const otherParticipant = conversation.participants.find(
      p => p.id.toString() !== userId
    );

    if (!otherParticipant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Update the other participant's settings
    otherParticipant.settings = {
      ...otherParticipant.settings,
      isBlocked: true,
      blockedBy: userId
    };

    await conversation.save();

    res.json({ 
      message: 'User blocked successfully',
      settings: {
        isBlocked: true,
        isMuted: conversation.participants.find(p => p.id.toString() === userId)?.settings?.isMuted || false
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to block user', error: error.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Find the other participant
    const otherParticipant = conversation.participants.find(
      p => p.id.toString() !== userId
    );

    if (!otherParticipant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Update the other participant's settings
    otherParticipant.settings = {
      ...otherParticipant.settings,
      isBlocked: false,
      blockedBy: null
    };

    await conversation.save();

    res.json({ 
      message: 'User unblocked successfully',
      settings: {
        isBlocked: false,
        isMuted: conversation.participants.find(p => p.id.toString() === userId)?.settings?.isMuted || false
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unblock user', error: error.message });
  }
};

exports.muteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Find current user's participant object
    const currentUserParticipant = conversation.participants.find(
      p => p.id.toString() === userId
    );

    if (!currentUserParticipant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Update the current user's settings
    currentUserParticipant.settings = {
      ...currentUserParticipant.settings,
      isMuted: true,
      mutedBy: userId
    };

    await conversation.save();

    res.json({ 
      message: 'Conversation muted successfully',
      settings: {
        isBlocked: conversation.participants.find(p => p.id.toString() !== userId)?.settings?.isBlocked || false,
        isMuted: true
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mute conversation', error: error.message });
  }
};

exports.unmuteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Find current user's participant object
    const currentUserParticipant = conversation.participants.find(
      p => p.id.toString() === userId
    );

    if (!currentUserParticipant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Update the current user's settings
    currentUserParticipant.settings = {
      ...currentUserParticipant.settings,
      isMuted: false,
      mutedBy: null
    };

    await conversation.save();

    res.json({ 
      message: 'Conversation unmuted successfully',
      settings: {
        isBlocked: conversation.participants.find(p => p.id.toString() !== userId)?.settings?.isBlocked || false,
        isMuted: false
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unmute conversation', error: error.message });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const userModel = req.user.role;

    // Find all conversations where the current user is a participant
    const conversations = await Conversation.find({
      'participants': {
        $elemMatch: { id: userId, model: userModel }
      }
    })
    .populate({
      path: 'participants.id',
      refPath: 'participants.model',
      select: 'firstName lastName profileImage storeName storeAvatar businessName'
    });

    // Extract blocked users from conversations
    const blockedUsers = [];
    conversations.forEach(conversation => {
      const otherParticipant = conversation.participants.find(
        p => p.id._id.toString() !== userId
      );

      if (otherParticipant?.settings?.isBlocked && otherParticipant?.settings?.blockedBy?.toString() === userId) {
        const userData = {
          id: otherParticipant.id._id,
          userType: otherParticipant.model,
          conversationId: conversation._id
        };

        // Set name and profile image based on user type
        if (otherParticipant.model === 'Buyer') {
          userData.name = `${otherParticipant.id.firstName} ${otherParticipant.id.lastName}`.trim();
          userData.profileImage = otherParticipant.id.profileImage?.url || null;
        } else {
          userData.name = otherParticipant.id.storeName || otherParticipant.id.businessName;
          userData.profileImage = otherParticipant.id.storeAvatar?.url || null;
        }

        blockedUsers.push(userData);
      }
    });

    res.json({ blockedUsers });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve blocked users', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = exports; 