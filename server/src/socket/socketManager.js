const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');
const Stream = require('../models/Stream');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Store active users
const activeUsers = new Map();
// Store active auction watchers
const auctionWatchers = new Map();

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

    // AUCTION SPECIFIC EVENTS

    // Join auction lists room to receive updates about all auctions
    socket.on('join_auction_lists', async () => {
      try {
        socket.join('auction_lists');
        console.log(`User ${socket.user.id} joined auction lists room`);
        
        // Send initial data about active auctions
        const activeAuctions = await Product.find({
          status: 'offline_auction',
          'auction.status': { $in: ['scheduled', 'ongoing'] }
        })
        .select('_id name auction.status auction.startDate auction.endDate auction.minBid auction.currentHighestBid auction.bids')
        .populate({
          path: 'auction.currentHighestBid.buyer',
          select: 'firstName lastName profileImage'
        })
        .limit(20); // Limit to avoid large payloads
        
        // Format the data for the client
        const formattedAuctions = activeAuctions.map(auction => ({
          _id: auction._id,
          name: auction.name,
          status: auction.auction.status,
          startDate: auction.auction.startDate,
          endDate: auction.auction.endDate,
          minBid: auction.auction.minBid,
          bidsCount: auction?.auction?.bids?.length,
          currentHighestBid: auction.auction.currentHighestBid ? {
            amount: auction.auction.currentHighestBid.amount,
            buyer: auction.auction.currentHighestBid.buyer ? {
              _id: auction.auction.currentHighestBid.buyer._id,
              firstName: auction.auction.currentHighestBid.buyer.firstName,
              lastName: auction.auction.currentHighestBid.buyer.lastName,
              profileImage: auction.auction.currentHighestBid.buyer.profileImage
            } : null
          } : null,
          timeRemaining: auction.auction.status === 'scheduled' 
            ? auction.auction.startDate - new Date() 
            : auction.auction.endDate - new Date()
        }));
        
        socket.emit('auction_lists_data', {
          auctions: formattedAuctions
        });
        
      } catch (error) {
        console.error('Error joining auction lists room:', error);
        socket.emit('auction_error', { message: 'Failed to join auction lists room' });
      }
    });
    
    // Leave auction lists room
    socket.on('leave_auction_lists', () => {
      socket.leave('auction_lists');
      console.log(`User ${socket.user.id} left auction lists room`);
    });
    
    // Join to watch a specific auction product details
    socket.on('join_auction_details', async (productId) => {
      try {
        socket.join(`auction_details_${productId}`);
        console.log(`User ${socket.user.id} joined auction details room for product ${productId}`);
        
        // Get current auction data and send to the user
        const product = await Product.findById(productId)
          .populate({
            path: 'auction.currentHighestBid.buyer',
            select: 'firstName lastName profileImage'
          })
          .select('name auction status');
        
        if (product && product.status === 'offline_auction') {
          // Calculate time remaining
          const now = new Date();
          let timeRemaining = null;
          
          if (product.auction.status === 'scheduled') {
            timeRemaining = product.auction.startDate - now;
          } else if (product.auction.status === 'ongoing') {
            timeRemaining = product.auction.endDate - now;
          }
          
          // Send auction details to the user
          socket.emit('auction_details_data', {
            productId: product._id,
            name: product.name,
            status: product.auction.status,
            minBid: product.auction.minBid,
            maxBid: product.auction.maxBid,
            startDate: product.auction.startDate,
            endDate: product.auction.endDate,
            timeRemaining: timeRemaining,
            bidsCount: product?.auction?.bids?.length,
            currentHighestBid: product.auction.currentHighestBid ? {
              amount: product.auction.currentHighestBid.amount,
              buyer: product.auction.currentHighestBid.buyer ? {
                _id: product.auction.currentHighestBid.buyer._id,
                firstName: product.auction.currentHighestBid.buyer.firstName,
                lastName: product.auction.currentHighestBid.buyer.lastName,
                profileImage: product.auction.currentHighestBid.buyer.profileImage
              } : null
            } : null
          });
        }
      } catch (error) {
        console.error('Error joining auction details room:', error);
        socket.emit('auction_error', { message: 'Failed to join auction details room' });
      }
    });
    
    // Leave auction details room
    socket.on('leave_auction_details', (productId) => {
      socket.leave(`auction_details_${productId}`);
      console.log(`User ${socket.user.id} left auction details room for product ${productId}`);
    });

    // Join an auction room to receive updates
    socket.on('join_auction', async (productId) => {
      try {
        socket.join(`auction_${productId}`);
        console.log(`User ${socket.user.id} joined auction room for product ${productId}`);
        
        // Add user to auction watchers
        if (!auctionWatchers.has(productId)) {
          auctionWatchers.set(productId, new Set());
        }
        auctionWatchers.get(productId).add(socket.user.id);

        // Get current auction data and send to the user
        const product = await Product.findById(productId)
          .populate({
            path: 'auction.bids.buyer',
            select: 'firstName lastName profileImage'
          })
          .populate({
            path: 'auction.currentHighestBid.buyer',
            select: 'firstName lastName profileImage'
          })
          .select('name auction status');

        if (product && product.status === 'offline_auction') {
          // Calculate time remaining
          const now = new Date();
          let timeRemaining = null;
          let auctionState = product.auction.status;

          if (product.auction.status === 'scheduled') {
            timeRemaining = product.auction.startDate - now;
          } else if (product.auction.status === 'ongoing') {
            timeRemaining = product.auction.endDate - now;
          }

          // Format bids for the response
          const formattedBids = product.auction.bids.map(bid => ({
            _id: bid._id,
            buyer: bid.buyer ? {
              _id: bid.buyer._id,
              firstName: bid.buyer.firstName,
              lastName: bid.buyer.lastName,
              profileImage: bid.buyer.profileImage
            } : null,
            amount: bid.amount,
            status: bid.status,
            createdAt: bid.createdAt
          }));

          // Send initial auction data to the user
          socket.emit('auction_data', {
            productId: product._id,
            name: product.name,
            status: product.auction.status,
            minBid: product.auction.minBid,
            maxBid: product.auction.maxBid,
            endOnMaxBid: product.auction.endOnMaxBid,
            startDate: product.auction.startDate,
            endDate: product.auction.endDate,
            timeRemaining: timeRemaining,
            bids: formattedBids,
            bidsCount: formattedBids?.length,
            currentHighestBid: product.auction.currentHighestBid ? {
              amount: product.auction.currentHighestBid.amount,
              buyer: product.auction.currentHighestBid.buyer ? {
                _id: product.auction.currentHighestBid.buyer._id,
                firstName: product.auction.currentHighestBid.buyer.firstName,
                lastName: product.auction.currentHighestBid.buyer.lastName,
                profileImage: product.auction.currentHighestBid.buyer.profileImage
              } : null
            } : null,
            winner: product.auction.winner ? {
              buyer: product.auction.winner.buyer ? {
                _id: product.auction.winner.buyer._id,
                firstName: product.auction.winner.buyer.firstName,
                lastName: product.auction.winner.buyer.lastName
              } : null,
              bidAmount: product.auction.winner.bidAmount,
              winningDate: product.auction.winner.winningDate
            } : null,
            watchersCount: auctionWatchers.get(productId).size
          });

          // Notify other users in the room about the new watcher
          socket.to(`auction_${productId}`).emit('auction_watcher_joined', {
            watchersCount: auctionWatchers.get(productId).size
          });
        }
      } catch (error) {
        console.error('Error joining auction room:', error);
        socket.emit('auction_error', { message: 'Failed to join auction room' });
      }
    });

    // Leave an auction room
    socket.on('leave_auction', (productId) => {
      socket.leave(`auction_${productId}`);
      console.log(`User ${socket.user.id} left auction room for product ${productId}`);

      // Remove user from auction watchers
      if (auctionWatchers.has(productId)) {
        auctionWatchers.get(productId).delete(socket.user.id);
        
        // If there are still watchers, notify them about the count change
        if (auctionWatchers.get(productId).size > 0) {
          io.to(`auction_${productId}`).emit('auction_watcher_left', {
            watchersCount: auctionWatchers.get(productId).size
          });
        }
      }
    });

    // Place a bid via socket (real-time)
    socket.on('place_bid', async (data) => {
      try {
        const { productId, amount } = data;
        const buyerId = socket.user.id;

        // Validate user is a buyer
        if (socket.user.role !== 'buyer') {
          socket.emit('bid_error', { message: 'Only buyers can place bids' });
          return;
        }

        // Find the product
        const product = await Product.findById(productId);
        
        if (!product) {
          socket.emit('bid_error', { message: 'Product not found' });
          return;
        }

        if (product.status !== 'offline_auction') {
          socket.emit('bid_error', { message: 'This product is not an auction item' });
          return;
        }

        // Check if auction has started
        const now = new Date();
        if (now < product.auction.startDate) {
          socket.emit('bid_error', { message: 'Auction has not started yet' });
          return;
        }

        // Check if auction has ended
        if (now > product.auction.endDate) {
          socket.emit('bid_error', { message: 'Auction has ended' });
          return;
        }

        // Check minimum bid
        if (amount < product.auction.minBid) {
          socket.emit('bid_error', { 
            message: `Bid amount must be at least ${product.auction.minBid}` 
          });
          return;
        }

        // Check if bid is higher than current highest bid
        if (product.auction.currentHighestBid.amount && amount <= product.auction.currentHighestBid.amount) {
          socket.emit('bid_error', { 
            message: `Bid amount must be higher than current highest bid of ${product.auction.currentHighestBid.amount}` 
          });
          return;
        }

        // Convert buyerId to ObjectId properly
        const buyerObjectId = new mongoose.Types.ObjectId(buyerId);

        // Mark previous highest bid as outbid if it exists
        if (product.auction.currentHighestBid.buyer) {
          const previousHighestBid = product.auction.bids.find(
            bid => bid.buyer.toString() === product.auction.currentHighestBid.buyer.toString() && 
            bid.status === 'active'
          );
          if (previousHighestBid) {
            previousHighestBid.status = 'outbid';
          }
        }

        // Add new bid
        const newBid = {
          buyer: buyerObjectId,
          amount: amount,
          status: 'active'
        };

        product.auction.bids.push(newBid);

        // Update current highest bid
        product.auction.currentHighestBid = {
          amount: amount,
          buyer: buyerObjectId
        };

        // Check if auction should end (max bid reached and endOnMaxBid is true)
        let auctionEnded = false;
        if (product.auction.endOnMaxBid && amount >= product.auction.maxBid) {
          product.auction.status = 'ended';
          product.auction.winner = {
            buyer: buyerObjectId,
            bidAmount: amount,
            winningDate: now
          };
          auctionEnded = true;

          // Update all other bids to 'lost'
          product.auction.bids.forEach(bid => {
            if (bid.buyer.toString() !== buyerObjectId.toString()) {
              bid.status = 'lost';
            } else if (bid.amount === amount) {
              bid.status = 'won';
            }
          });
        }

        await product.save();

        // Get buyer details for the response
        const buyer = await Buyer.findById(buyerId).select('firstName lastName profileImage');

        // Prepare bid notification data
        const bidData = {
          productId: product._id,
          bid: {
            _id: product?.auction?.bids[product?.auction?.bids?.length - 1]?._id,
            amount: amount,
            status: 'active',
            createdAt: new Date(),
            buyer: {
              _id: buyer._id,
              firstName: buyer.firstName,
              lastName: buyer.lastName,
              profileImage: buyer.profileImage
            }
          },
          currentHighestBid: {
            amount: amount,
            buyer: {
              _id: buyer._id,
              firstName: buyer.firstName,
              lastName: buyer.lastName,
              profileImage: buyer.profileImage
            }
          },
          bidsCount: product?.auction?.bids?.length,
          auctionStatus: product?.auction?.status,
          auctionEnded: auctionEnded,
          winner: auctionEnded ? {
            buyer: {
              _id: buyer._id,
              firstName: buyer.firstName,
              lastName: buyer.lastName,
              profileImage: buyer.profileImage
            },
            bidAmount: amount,
            winningDate: now
          } : null
        };

        // Emit bid update to all users in the auction room
        io.to(`auction_${productId}`).emit('bid_update', bidData);

        // Also emit to auction lists room with minimal data
        io.to('auction_lists').emit('auction_list_update', {
          productId: product._id,
          name: product.name,
          currentHighestBid: {
            amount: amount,
            buyer: {
              _id: buyer._id,
              firstName: buyer.firstName,
              lastName: buyer.lastName
            }
          },
          bidsCount: product?.auction?.bids?.length,
          status: product?.auction?.status,
          timeRemaining: product?.auction?.status === 'ongoing' ? product?.auction?.endDate - now : 0
        });
        
        // Also emit to auction details room
        io.to(`auction_details_${productId}`).emit('auction_details_update', {
          productId: product._id,
          currentHighestBid: {
            amount: amount,
            buyer: {
              _id: buyer._id,
              firstName: buyer.firstName,
              lastName: buyer.lastName,
              profileImage: buyer.profileImage
            }
          },
          bidsCount: product?.auction?.bids?.length,
          status: product?.auction?.status,
          timeRemaining: product?.auction?.status === 'ongoing' ? product?.auction?.endDate - now : 0
        });

        // Send confirmation to the bidder
        socket.emit('bid_placed', { 
          success: true,
          message: 'Bid placed successfully',
          ...bidData
        });

      } catch (error) {
        console.error('Error placing bid:', error);
        socket.emit('bid_error', { message: 'Failed to place bid' });
      }
    });

    // Request auction timer update
    socket.on('request_auction_timer', async (productId) => {
      try {
        const product = await Product.findById(productId)
          .select('auction.status auction.startDate auction.endDate');
        
        if (!product) {
          socket.emit('auction_timer_error', { message: 'Product not found' });
          return;
        }

        const now = new Date();
        let timeRemaining = null;
        let auctionState = product.auction.status;

        if (product.auction.status === 'scheduled') {
          timeRemaining = product.auction.startDate - now;
          
          // Check if auction should start now
          if (timeRemaining <= 0) {
            // Update auction status to ongoing
            await Product.findByIdAndUpdate(productId, {
              'auction.status': 'ongoing'
            });
            auctionState = 'ongoing';
            timeRemaining = product.auction.endDate - now;
          }
        } else if (product.auction.status === 'ongoing') {
          timeRemaining = product.auction.endDate - now;
          
          // Check if auction should end now
          if (timeRemaining <= 0) {
            // End the auction
            const updatedProduct = await Product.findById(productId);
            await updatedProduct.endAuction(false, io);
            auctionState = 'ended';
            timeRemaining = 0;
          }
        } else {
          timeRemaining = 0;
        }

        // Send timer update to the requesting client
        socket.emit('auction_timer_update', {
          productId,
          timeRemaining,
          status: auctionState
        });

      } catch (error) {
        console.error('Error updating auction timer:', error);
        socket.emit('auction_timer_error', { message: 'Failed to update timer' });
      }
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

      // Remove user from all auction watchers
      for (const [productId, watchers] of auctionWatchers.entries()) {
        if (watchers.has(socket.user.id)) {
          watchers.delete(socket.user.id);
          
          // Notify remaining watchers about the count change
          if (watchers.size > 0) {
            io.to(`auction_${productId}`).emit('auction_watcher_left', {
              watchersCount: watchers.size
            });
          }
        }
      }

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

  // Periodic auction timer updates (every 10 seconds)
  setInterval(async () => {
    try {
      // Find all active auctions
      const activeAuctions = await Product.find({
        status: 'offline_auction',
        'auction.status': { $in: ['scheduled', 'ongoing'] }
      }).select('_id name auction');  // Include name and full auction object

      const now = new Date();

      for (const auction of activeAuctions) {
        let timeRemaining = null;
        let statusChanged = false;
        let newStatus = auction.auction?.status || 'ended';

        // Calculate time remaining and check if status needs to change
        if (auction.auction?.status === 'scheduled' && auction.auction?.startDate <= now) {
          // Auction should start
          await Product.findByIdAndUpdate(auction._id, {
            'auction.status': 'ongoing'
          });
          newStatus = 'ongoing';
          statusChanged = true;
          timeRemaining = auction.auction?.endDate - now;
        } else if (auction.auction?.status === 'scheduled') {
          timeRemaining = auction.auction?.startDate - now;
        } else if (auction.auction?.status === 'ongoing' && auction.auction?.endDate <= now) {
          // Auction should end
          const product = await Product.findById(auction._id);
          if (product) {
            await product.endAuction(false, io);
          }
          newStatus = 'ended';
          statusChanged = true;
          timeRemaining = 0;
        } else if (auction.auction?.status === 'ongoing') {
          timeRemaining = auction.auction?.endDate - now;
        }

        // Only emit updates if there are watchers for this auction
        if (auctionWatchers.has(auction._id.toString()) && auctionWatchers.get(auction._id.toString()).size > 0) {
          // Emit timer update to all users watching this auction
          io.to(`auction_${auction._id}`).emit('auction_timer_update', {
            productId: auction._id,
            timeRemaining,
            status: newStatus,
            statusChanged
          });

          // If status changed, emit additional status update
          if (statusChanged) {
            // Get more details if the auction ended
            if (newStatus === 'ended') {
              const updatedProduct = await Product.findById(auction._id)
                .populate({
                  path: 'auction.winner.buyer',
                  select: 'firstName lastName profileImage'
                });

              if (updatedProduct?.auction?.winner) {
                io.to(`auction_${auction._id}`).emit('auction_ended', {
                  productId: auction._id,
                  winner: {
                    buyer: {
                      _id: updatedProduct.auction.winner.buyer._id,
                      firstName: updatedProduct.auction.winner.buyer.firstName,
                      lastName: updatedProduct.auction.winner.buyer.lastName,
                      profileImage: updatedProduct.auction.winner.buyer.profileImage
                    },
                    bidAmount: updatedProduct.auction.winner.bidAmount,
                    winningDate: updatedProduct.auction.winner.winningDate
                  }
                });
              } else {
                io.to(`auction_${auction._id}`).emit('auction_ended', {
                  productId: auction._id,
                  winner: null
                });
              }
            } else if (newStatus === 'ongoing') {
              io.to(`auction_${auction._id}`).emit('auction_started', {
                productId: auction._id,
                startDate: now,
                endDate: auction.auction?.endDate
              });
            }
          }
        }
        
        // Also emit updates to auction lists room
        io.to('auction_lists').emit('auction_list_update', {
          productId: auction._id,
          name: auction.name || '',
          status: newStatus,
          timeRemaining,
          statusChanged,
          currentHighestBid: auction.auction?.currentHighestBid ? {
            amount: auction.auction.currentHighestBid.amount
          } : null,
          bidsCount: auction?.auction?.bids?.length || 0
        });
        
        // Also emit updates to auction details room
        io.to(`auction_details_${auction._id}`).emit('auction_details_update', {
          productId: auction._id,
          status: newStatus,
          timeRemaining,
          statusChanged
        });
        
        // If status changed, emit additional status update to auction lists and details
        if (statusChanged) {
          if (newStatus === 'ended') {
            const updatedProduct = await Product.findById(auction._id)
              .populate({
                path: 'auction.winner.buyer',
                select: 'firstName lastName profileImage'
              });
              
            const winnerData = updatedProduct?.auction?.winner ? {
              buyer: {
                _id: updatedProduct.auction.winner.buyer._id,
                firstName: updatedProduct.auction.winner.buyer.firstName,
                lastName: updatedProduct.auction.winner.buyer.lastName
              },
              bidAmount: updatedProduct.auction.winner.bidAmount,
              winningDate: updatedProduct.auction.winner.winningDate
            } : null;
            
            io.to('auction_lists').emit('auction_ended_list', {
              productId: auction._id,
              winner: winnerData
            });
            
            io.to(`auction_details_${auction._id}`).emit('auction_details_ended', {
              productId: auction._id,
              winner: winnerData
            });
          } else if (newStatus === 'ongoing') {
            io.to('auction_lists').emit('auction_started_list', {
              productId: auction._id,
              startDate: now,
              endDate: auction.auction?.endDate
            });
            
            io.to(`auction_details_${auction._id}`).emit('auction_details_started', {
              productId: auction._id,
              startDate: now,
              endDate: auction.auction?.endDate
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating auction timers:', error);
    }
  }, 10000); // Check every 10 seconds

  return io;
}

module.exports = initializeSocket; 