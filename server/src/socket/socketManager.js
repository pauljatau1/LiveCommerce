const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');
const Stream = require('../models/Stream');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');

// Store active users
const activeUsers = new Map();

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: ["*","http://localhost:5173", "http://localhost:5173/","https://seller.auqli.live/", "https://seller.auqli.live", "http://localhost:5174/", "http://localhost:5174"],
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
  io.on('connection', async (socket) => {
    console.log('User connected:', socket.user.id);
    
    // Add user to active users
    activeUsers.set(socket.user.id, {
      socketId: socket.id,
      userId: socket.user.id,
      userModel: socket.user.role,
      lastActive: new Date()
    });

    // Update user's online status in all their conversations
    await Conversation.updateMany(
      { 'participants': { 
        $elemMatch: { 
          id: socket.user.id, 
          model: socket.user.role 
        } 
      }},
      { 
        $set: { 
          'participants.$.isOnline': true,
          'participants.$.lastActive': new Date()
        } 
      }
    );

    // Emit user online status to relevant conversations
    const userConversations = await Conversation.find({
      'participants': {
        $elemMatch: { 
          id: socket.user.id, 
          model: socket.user.role 
        }
      }
    });

    userConversations.forEach(conversation => {
      conversation.participants.forEach(participant => {
        if (participant.id.toString() !== socket.user.id) {
          io.to(participant.id.toString()).emit('user_status_change', {
            userId: socket.user.id,
            userModel: socket.user.role,
            isOnline: true,
            lastActive: new Date()
          });
        }
      });
    });

    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    socket.on('new_message', async ({ conversationId, message }) => {
      try {
        const conversation = await Conversation.findById(conversationId)
          .populate('participants.id');

        // Update last active timestamp
        await Conversation.updateOne(
          { 
            _id: conversationId,
            'participants.id': socket.user.id,
            'participants.model': socket.user.role
          },
          { 
            $set: { 
              'participants.$.lastActive': new Date()
            } 
          }
        );

        // Emit to all participants except sender
        conversation.participants.forEach(participant => {
          if (participant.id._id.toString() !== socket.user.id) {
            console.log(socket.user.id+" sent message "+message.content+" to "+participant.id._id);
            io.to(participant.id._id.toString()).emit('receive_message', {
              ...message,
              sender: {
                ...message.sender,
                isOnline: true,
                lastActive: new Date()
              }
            });
          }
        });
      } catch (error) {
        console.error('Socket message error:', error);
      }
    });

    // Handle user activity status
    socket.on('user_activity', async () => {
      const user = activeUsers.get(socket.user.id);
      if (user) {
        user.lastActive = new Date();
        await Conversation.updateMany(
          { 'participants': { 
            $elemMatch: { 
              id: socket.user.id, 
              model: socket.user.role 
            } 
          }},
          { 
            $set: { 
              'participants.$.lastActive': new Date()
            } 
          }
        );
      }
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.user.id);
      
      // Remove user from active users
      activeUsers.delete(socket.user.id);

      // Update user's offline status in conversations
      await Conversation.updateMany(
        { 'participants': { 
          $elemMatch: { 
            id: socket.user.id, 
            model: socket.user.role 
          } 
        }},
        { 
          $set: { 
            'participants.$.isOnline': false,
            'participants.$.lastActive': new Date()
          } 
        }
      );

      // Notify other users about status change
      const userConversations = await Conversation.find({
        'participants': {
          $elemMatch: { 
            id: socket.user.id, 
            model: socket.user.role 
          }
        }
      });

      userConversations.forEach(conversation => {
        conversation.participants.forEach(participant => {
          if (participant.id.toString() !== socket.user.id) {
            io.to(participant.id.toString()).emit('user_status_change', {
              userId: socket.user.id,
              userModel: socket.user.role,
              isOnline: false,
              lastActive: new Date()
            });
          }
        });
      });
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

    // Handler for stream notifications
    socket.on('stream_notification_subscribe', () => {
      socket.join('stream_notifications');
      console.log(`User ${socket.user.id} subscribed to stream notifications`);
    });

    // Handler for stream chat comments
    socket.on('stream_comment', async (data) => {
      try {
        console.log(`Received comment from ${socket.user.id} for stream ${data.streamId}`);
        
        // Ensure streamId is provided
        if (!data.streamId) {
          console.error('Missing streamId in stream_comment event');
          return;
        }

        // Find the stream
        const stream = await Stream.findById(data.streamId);
        if (!stream) {
          console.error(`Stream not found: ${data.streamId}`);
          return;
        }

        // Get user details based on role (buyer or seller)
        let userDetails;
        let userRole = socket.user.role || 'buyer'; // Default to buyer if role not specified

        if (userRole === 'seller') {
          userDetails = await Seller.findById(socket.user.id).select('storeName storeAvatar');
          
          if (!userDetails) {
            console.error(`Seller not found: ${socket.user.id}`);
            return;
          }

          // Create notification object
          const notificationObj = {
            id: Date.now().toString(),
            type: 'comment',
            user: userDetails.storeName || 'Host',
            avatar: userDetails.storeAvatar?.url || '',
            content: data.content,
            data: {
              message: data.content,
              sellerId: socket.user.id,
              sellerName: userDetails.storeName || 'Host',
              streamId: data.streamId,
              isHost: true
            }
          };

          // Store in database
          await Stream.findByIdAndUpdate(
            data.streamId,
            { $push: { chatInteractions: notificationObj } }
          );

          // Add timestamp for the WebSocket payload
          notificationObj.timestamp = new Date();
          
          // Broadcast to all subscribers
          io.to('stream_notifications').emit('stream_notification', notificationObj);
          
        } else {
          // Assume buyer
          userDetails = await Buyer.findById(socket.user.id).select('firstName lastName username profileImage avatarUrl');
          
          if (!userDetails) {
            console.error(`Buyer not found: ${socket.user.id}`);
            return;
          }

          // Create notification object
          const notificationObj = {
            id: Date.now().toString(),
            type: 'comment',
            user: userDetails.firstName || userDetails.username || 'Viewer',
            avatar: userDetails.profileImage?.url || userDetails.avatarUrl || '',
            content: data.content,
            data: {
              message: data.content,
              buyerId: socket.user.id,
              buyerName: userDetails.firstName + " " + userDetails.lastName,
              buyerUsername: userDetails.username,
              streamId: data.streamId,
              isHost: false
            }
          };

          // Store in database
          await Stream.findByIdAndUpdate(
            data.streamId,
            { $push: { chatInteractions: notificationObj } }
          );

          // Add timestamp for the WebSocket payload
          notificationObj.timestamp = new Date();
          
          // Broadcast to all subscribers
          io.to('stream_notifications').emit('stream_notification', notificationObj);
        }
        
      } catch (error) {
        console.error('Error handling stream comment:', error);
      }
    });

    socket.on('leave_stream_monitor', (data) => {
      socket.leave(`stream_${data.streamId}`);
      console.log(`Stopped monitoring stream: ${data.streamId}`);
    });
  });

  // Periodic cleanup of inactive users (5 minutes of inactivity)
  setInterval(async () => {
    const inactivityThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    
    for (const [userId, userData] of activeUsers.entries()) {
      if (userData.lastActive < inactivityThreshold) {
        activeUsers.delete(userId);
        
        // Update user's status in conversations
        await Conversation.updateMany(
          { 'participants': { 
            $elemMatch: { 
              id: userId, 
              model: userData.userModel 
            } 
          }},
          { 
            $set: { 
              'participants.$.isOnline': false,
              'participants.$.lastActive': userData.lastActive
            } 
          }
        );

        // Notify other users
        const userConversations = await Conversation.find({
          'participants': {
            $elemMatch: { 
              id: userId, 
              model: userData.userModel 
            }
          }
        });

        userConversations.forEach(conversation => {
          conversation.participants.forEach(participant => {
            if (participant.id.toString() !== userId) {
              io.to(participant.id.toString()).emit('user_status_change', {
                userId,
                userModel: userData.userModel,
                isOnline: false,
                lastActive: userData.lastActive
              });
            }
          });
        });
      }
    }
  }, 60000); // Check every minute

  return io;
}

module.exports = initializeSocket; 