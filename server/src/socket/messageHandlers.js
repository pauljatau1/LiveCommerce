const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

module.exports = (io) => {
  io.on('connection', (socket) => {
    // Join user to their personal room
    socket.on('join', (userId) => {
      socket.join(userId);
    });

    // Handle new messages
    socket.on('new_message', async (messageData) => {
      try {
        const { conversationId, message } = messageData;
        
        // Emit to all participants in the conversation
        const conversation = await Conversation.findById(conversationId);
        conversation.participants.forEach(participant => {
          io.to(participant.id.toString()).emit('receive_message', message);
        });
      } catch (error) {
        console.error('Socket error:', error);
      }
    });
  });
}; 