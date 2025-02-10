const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: ["*","http://localhost:5173", "http://localhost:5173/","https://seller.auqli.live/", "https://seller.auqli.live"],
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Authorization", "Content-Type"]
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
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
          if (participant.id._id.toString() !== socket.user.id) {
          console.log(socket.user.id+" sent message "+message.content+" to "+participant.id._id);

            io.to(participant.id._id.toString()).emit('receive_message', message);
          }
        });
      } catch (error) {
        console.error('Socket message error:', error);
      }
    });

    // Add new stream monitoring events
    socket.on('join_stream_monitor', (data) => {
      socket.join(`stream_${data.streamId}`);
      console.log(`Monitoring stream: ${data.channelName}`);
    });

    socket.on('stream_connection_update', (data) => {
      console.log(`Stream ${data.channelName}: ${data.prevState} → ${data.curState}`);
      
      // Broadcast to all clients monitoring this stream
      io.to(`stream_${data.streamId}`).emit('connection_state', data);
    });

    socket.on('leave_stream_monitor', (data) => {
      socket.leave(`stream_${data.streamId}`);
      console.log(`Stopped monitoring stream: ${data.streamId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.id);
    });
  });

  return io;
}

function getIO() {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

module.exports = { initializeSocket, getIO }; 