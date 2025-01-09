const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log('User connected:', socket.user.id);

    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    socket.on('new_message', async ({ conversationId, message }) => {
      try {
        const conversation = await Conversation.findById(conversationId)
          .populate('participants.id');

        // Emit to all participants except sender
        conversation.participants.forEach(participant => {
          if (participant.id.toString() !== socket.user.id) {
            io.to(participant.id.toString()).emit('receive_message', message);
          }
        });
      } catch (error) {
        console.error('Socket message error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.id);
    });
  });

  return io;
}

module.exports = initializeSocket; 