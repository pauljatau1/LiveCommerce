const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { socketUserFromHandshake, registerGuestSocket } = require('./guestSocket');
const chatSafety = require('../services/chatSafety');
const { hideComment, registerUnhide, suggestNotes } = require('./chatSafetySocket');
const Conversation = require('../models/Conversation');
const Stream = require('../models/Stream');
const streamBids = require('../services/streamBidService');
const auctionOrders = require('../services/auctionOrderService');
const { originCheck } = require('../config/cors');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const mixpanel = require('../config/mixpanel');

// Store active users
const activeUsers = new Map();
// Store active auction watchers
const auctionWatchers = new Map();

// Store the io instance to be reused across modules
let ioInstance = null;

function initializeSocket(server) {
  console.log('Initializing socket server...');
  const io = socketIO(server, {
    cors: {
      origin: originCheck, // ALLOWED_ORIGINS, see config/cors.js
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Authorization", "Content-Type"]
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Save the io instance
  ioInstance = io;

  // Create a public namespace that doesn't require authentication
  const publicIO = io.of('/public');

  // Set up dedicated namespaces 
  const streamNotifications = io.of('/stream_notifications');
  const auctionBidding = io.of('/stream_auction_bidding');

  // Set up public auction events that don't require authentication
  publicIO.on('connection', async (socket) => {
    console.log('New public socket connection:', {
      socketId: socket.id
    });

    // Public access to auction lists
    socket.on('join_auction_lists', async () => {
      try {
        socket.join('auction_lists');
        console.log(`Public user joined auction lists room`);

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
          .populate({
            path: 'auction.bids.buyer',
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
      console.log(`Public user left auction lists room`);
    });

    // Join to watch a specific auction product details (read-only)
    socket.on('join_auction_details', async (productId) => {
      try {
        socket.join(`auction_details_${productId}`);
        console.log(`Public user joined auction details room for product ${productId}`);

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
      console.log(`Public user left auction details room for product ${productId}`);
    });
  });

  // Add debug log for authentication middleware for the main namespace
  io.use(async (socket, next) => {
    console.log('Socket authentication attempt:', {
      hasToken: !!socket.handshake.auth.token,
      socketId: socket.id
    });

    try {
      // A token makes a signed-in user; { guest: true } without one makes a watch-only guest
      const decoded = await socketUserFromHandshake(socket.handshake);
      if (!decoded) {
        console.log('Authentication failed: No token provided');
        return next(new Error('Authentication error'));
      }
      socket.user = decoded;
      console.log('Socket authenticated successfully:', {
        userId: decoded.id,
        role: decoded.role,
        socketId: socket.id
      });
      next();
    } catch (err) {
      console.log('Authentication failed:', err.message);
      next(new Error('Authentication error'));
    }
  });

  // Connection handler for authenticated connections
  io.on('connection', async (socket) => {
    if (socket.user?.id) socket.join(String(socket.user.id));
    socket.use(async (_packet,next) => { try { await require('../services/auth/sessions').assertSession(socket.user); next(); } catch(e) { socket.emit('session_expired',{message:'Your password changed. Please sign in again.'}); socket.disconnect(true); } });
    // Guests only watch: they get the subscribe handlers and nothing else
    if (socket.user?.guest) {
      registerGuestSocket(socket);
      return;
    }
    console.log('New socket connection:', {
      socketId: socket.id,
      userId: socket.user.id,
      userRole: socket.user.role
    });
    
    // If this is a seller, cancel any pending stream end jobs
    if (socket.user.role === 'Seller') {
      const canceledCount = await cancelPendingStreamEndJobs(socket.user.id);
      if (canceledCount > 0) {
        console.log(`[SOCKET] Seller ${socket.user.id} reconnected - canceled ${canceledCount} pending stream end jobs`);
      }
    }

    // Add user to active users
    activeUsers.set(socket.user.id, {
      socketId: socket.id,
      userId: socket.user.id,
      userModel: socket.user.role,
      lastActive: new Date()
    });

    // Update user's online status in all their conversations
    await Conversation.updateMany(
      {
        'participants': {
          $elemMatch: {
            id: socket.user.id,
            model: socket.user.role
          }
        }
      },
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
      if (String(userId) !== String(socket.user?.id)) return;
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    // AUCTION SPECIFIC EVENTS

    // Join an auction room to receive updates
    socket.on('join_auction', async (productId) => {
      console.log('User joining auction room:', {
        socketId: socket.id,
        userId: socket.user.id,
        productId
      });

      try {
        socket.join(`auction_${productId}`);

        // Log room members
        const room = io.sockets.adapter.rooms.get(`auction_${productId}`);
        console.log('Current auction room members:', {
          productId,
          memberCount: room ? room.size : 0
        });

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
          .populate({
            path: 'auction.winner.buyer',
            select: 'firstName lastName profileImage'
          })
          .populate({
            path: 'seller',
            select: '_id firstName lastName businessName email phoneNumber storeName storeAvatar storeBanner aboutStore stats isVerified createdAt'
          })
          .select('name description price category subCategory brand images blips stock shippingInfo returnPolicy stats sku upc condition tags colors size material weight dimensions shippingWeight shippingDimensions taxClass taxRate warranty minimumPurchaseQuantity vendor metaDescription metaKeywords reviews logistics warehouseLocation status createdAt updatedAt inventory variants pricing shipping seo visibility analytics auction');

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
            description: product.description,
            price: product.price,
            category: product.category,
            subCategory: product.subCategory,
            brand: product.brand,
            images: product.images,
            blips: product.blips,
            stock: product.stock,
            shippingInfo: product.shippingInfo,
            returnPolicy: product.returnPolicy,
            stats: product.stats,
            sku: product.sku,
            upc: product.upc,
            condition: product.condition,
            tags: product.tags,
            colors: product.colors,
            size: product.size,
            material: product.material,
            weight: product.weight,
            dimensions: product.dimensions,
            shippingWeight: product.shippingWeight,
            shippingDimensions: product.shippingDimensions,
            taxClass: product.taxClass,
            taxRate: product.taxRate,
            warranty: product.warranty,
            minimumPurchaseQuantity: product.minimumPurchaseQuantity,
            vendor: product.vendor,
            metaDescription: product.metaDescription,
            metaKeywords: product.metaKeywords,
            reviews: product.reviews,
            logistics: product.logistics,
            warehouseLocation: product.warehouseLocation,
            status: product.auction.status,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            inventory: product.inventory,
            variants: product.variants,
            pricing: product.pricing,
            shipping: product.shipping,
            seo: product.seo,
            visibility: product.visibility,
            analytics: product.analytics,
            seller: product.seller,
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
                lastName: product.auction.winner.buyer.lastName,
                profileImage: product.auction.winner.buyer.profileImage
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
        console.error('Error joining auction room:', {
          socketId: socket.id,
          userId: socket.user.id,
          productId,
          error: error.message
        });
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
      console.log('Received bid placement request:', {
        socketId: socket.id,
        userId: socket.user.id,
        userRole: socket.user.role,
        productId: data.productId,
        amount: data.amount
      });

      try {
        const { productId, amount } = data;
        const buyerId = socket.user.id;

        // Validate user is a buyer
        if (socket.user.role?.toLowerCase() !== 'buyer') {
          console.log('Bid rejected: User is not a buyer', {
            socketId: socket.id,
            userRole: socket.user.role
          });
          socket.emit('bid_error', { message: 'Only buyers can place bids' });
          return;
        }

        // Find the product
        const product = await Product.findById(productId);
        console.log('Found product for bid:', {
          productFound: !!product,
          productId,
          productStatus: product?.status,
          auctionStatus: product?.auction?.status
        });

        if (!product) {
          console.log('Bid rejected: Product not found', { productId });
          socket.emit('bid_error', { message: 'Product not found' });
          return;
        }

        if (product.status !== 'offline_auction') {
          console.log('Bid rejected: Not an auction product', {
            productId,
            productStatus: product.status
          });
          socket.emit('bid_error', { message: 'This product is not an auction item' });
          return;
        }

        // Check auction timing
        const now = new Date();
        console.log('Checking auction timing:', {
          productId,
          currentTime: now,
          auctionStart: product.auction.startDate,
          auctionEnd: product.auction.endDate,
          auctionStatus: product.auction.status
        });

        if (now < product.auction.startDate) {
          console.log('Bid rejected: Auction not started', {
            productId,
            startDate: product.auction.startDate
          });
          socket.emit('bid_error', { message: 'Auction has not started yet' });
          return;
        }

        if (now > product.auction.endDate) {
          console.log('Bid rejected: Auction ended', {
            productId,
            endDate: product.auction.endDate
          });
          socket.emit('bid_error', { message: 'Auction has ended' });
          return;
        }

        // Check bid amount
        console.log('Validating bid amount:', {
          productId,
          bidAmount: amount,
          minBid: product.auction.minBid,
          currentHighestBid: product.auction.currentHighestBid?.amount
        });

        if (amount < product.auction.minBid) {
          console.log('Bid rejected: Below minimum bid', {
            productId,
            bidAmount: amount,
            minBid: product.auction.minBid
          });
          socket.emit('bid_error', {
            message: `Bid amount must be at least ${product.auction.minBid}`
          });
          return;
        }

        if (product.auction.currentHighestBid.amount && amount <= product.auction.currentHighestBid.amount) {
          console.log('Bid rejected: Not higher than current bid', {
            productId,
            bidAmount: amount,
            currentHighestBid: product.auction.currentHighestBid.amount
          });
          socket.emit('bid_error', {
            message: `Bid amount must be higher than current highest bid of ${product.auction.currentHighestBid.amount}`
          });
          return;
        }

        // Process valid bid
        console.log('Processing valid bid:', {
          productId,
          buyerId,
          amount
        });

        // Convert buyerId to ObjectId
        const buyerObjectId = new mongoose.Types.ObjectId(buyerId);

        // Update previous highest bid
        if (product.auction.currentHighestBid.buyer) {
          console.log('Updating previous highest bid:', {
            productId,
            previousBuyerId: product.auction.currentHighestBid.buyer
          });
        }

        // Save new bid
        const previousBidsCount = product.auction.bids.length;
        const newBid = {
          buyer: buyerObjectId,
          amount: amount,
          status: 'active'
        };
        product.auction.bids.push(newBid);
        product.auction.currentHighestBid = {
          amount: amount,
          buyer: buyerObjectId
        };

        // Check if we should end the auction (max bid reached and endOnMaxBid is true)
        if (product.auction.endOnMaxBid && amount >= product.auction.maxBid) {
          console.log('Max bid reached, ending auction:', {
            productId: product._id,
            maxBid: product.auction.maxBid,
            bidAmount: amount
          });

          // Set auction status to ended
          product.auction.status = 'ended';
          product.auction.winner = {
            buyer: buyerObjectId,
            bidAmount: amount,
            winningDate: new Date()
          };
          newBid.status = 'won';

          // Update all other bids to 'lost'
          product.auction.bids.forEach(bid => {
            if (bid.buyer && bid.buyer.toString() !== buyerObjectId.toString()) {
              bid.status = 'lost';
            }
          });

          // Save the changes first
          await product.save();

          // Verify the save was successful
          const verifyProduct = await Product.findById(productId);
          console.log('Verifying auction end:', {
            productId: product._id,
            savedStatus: verifyProduct.auction.status,
            expectedStatus: 'ended'
          });

          if (verifyProduct.auction.status !== 'ended') {
            console.error('Failed to update auction status to ended');
            throw new Error('Failed to update auction status');
          }

          // Schedule order creation
          try {
            const agenda = require('../config/agenda').agenda;
            await agenda.now('create-auction-winner-order', { productId: product._id });
            console.log('Scheduled auction winner order creation for max bid:', product._id);
          } catch (scheduleError) {
            console.error('Failed to schedule auction winner order creation:', {
              productId: product._id,
              error: scheduleError.message
            });
          }
        }

        await product.save();

        // Reload the product with populated buyer details
        const updatedProduct = await Product.findById(productId)
          .populate({
            path: 'auction.bids.buyer',
            select: 'firstName lastName profileImage'
          })
          .populate({
            path: 'auction.currentHighestBid.buyer',
            select: 'firstName lastName profileImage'
          })
          .populate({
            path: 'auction.winner.buyer',
            select: 'firstName lastName profileImage'
          });

        console.log('Bid saved successfully:', {
          productId,
          newBidsCount: updatedProduct.auction.bids.length,
          previousBidsCount
        });

        // Get buyer details for the response
        const buyer = await Buyer.findById(buyerId).select('firstName lastName profileImage');

        // Check if this is a winning bid that ended the auction
        const auctionEnded = updatedProduct.auction.status === 'ended';

        // Prepare bid notification data
        const bidData = {
          productId: updatedProduct._id,
          bid: {
            _id: updatedProduct?.auction?.bids[updatedProduct?.auction?.bids?.length - 1]?._id,
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
          bidsCount: updatedProduct?.auction?.bids?.length,
          auctionStatus: updatedProduct?.auction?.status,
          auctionEnded: auctionEnded,
          winner: auctionEnded && updatedProduct?.auction?.winner ? {
            buyer: updatedProduct.auction.winner.buyer ? {
              _id: updatedProduct.auction.winner.buyer._id,
              firstName: updatedProduct.auction.winner.buyer.firstName,
              lastName: updatedProduct.auction.winner.buyer.lastName,
              profileImage: updatedProduct.auction.winner.buyer.profileImage
            } : null,
            bidAmount: updatedProduct.auction.winner.bidAmount,
            winningDate: updatedProduct.auction.winner.winningDate
          } : null
        };

        // Emit updates
        console.log('Broadcasting bid updates to rooms:', {
          productId,
          auctionRoom: `auction_${productId}`,
          bidData: bidData
        });

        io.to(`auction_${productId}`).emit('bid_update', bidData);

        // If auction has ended, emit the auction_ended event to both namespaces
        if (auctionEnded && updatedProduct?.auction?.winner) {
          const auctionEndedData = {
            productId: updatedProduct._id,
            winner: bidData.winner
          };

          // Emit to authenticated namespace
          io.to(`auction_${productId}`).emit('auction_ended', auctionEndedData);

          // Emit to public namespace
          publicIO.to(`auction_details_${productId}`).emit('auction_ended', auctionEndedData);
        }

        // Create list update data that will be sent to both authenticated and public namespaces
        const listUpdateData = {
          productId: updatedProduct._id,
          name: updatedProduct.name,
          currentHighestBid: {
            amount: amount,
            buyer: {
              _id: buyer._id,
              firstName: buyer.firstName,
              lastName: buyer.lastName,
              profileImage: buyer.profileImage
            }
          },
          bidsCount: updatedProduct?.auction?.bids?.length,
          status: updatedProduct?.auction?.status,
          timeRemaining: updatedProduct?.auction?.status === 'ongoing' ? updatedProduct?.auction?.endDate - now : 0
        };

        // Send to authenticated namespace
        io.to('auction_lists').emit('auction_list_update', listUpdateData);

        // Send to public namespace
        publicIO.to('auction_lists').emit('auction_list_update', listUpdateData);

        // Create details update data
        const detailsUpdateData = {
          productId: updatedProduct._id,
          currentHighestBid: {
            amount: amount,
            buyer: {
              _id: buyer._id,
              firstName: buyer.firstName,
              lastName: buyer.lastName,
              profileImage: buyer.profileImage
            }
          },
          bidsCount: updatedProduct?.auction?.bids?.length,
          status: updatedProduct?.auction?.status,
          timeRemaining: updatedProduct?.auction?.status === 'ongoing' ? updatedProduct?.auction?.endDate - now : 0
        };

        // Send to authenticated namespace
        io.to(`auction_details_${productId}`).emit('auction_details_update', detailsUpdateData);

        // Send to public namespace
        publicIO.to(`auction_details_${productId}`).emit('auction_details_update', detailsUpdateData);

        // Confirm to bidder
        console.log('Sending confirmation to bidder:', {
          socketId: socket.id,
          buyerId
        });
        socket.emit('bid_placed', {
          success: true,
          message: 'Bid placed successfully',
          ...bidData
        });

      } catch (error) {
        console.error('Error processing bid:', {
          socketId: socket.id,
          userId: socket.user.id,
          productId: data.productId,
          error: error.message,
          stack: error.stack
        });
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
            console.log(socket.user.id + " sent message " + message.content + " to " + participant.id._id);
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
          {
            'participants': {
              $elemMatch: {
                id: socket.user.id,
                model: socket.user.role
              }
            }
          },
          {
            $set: {
              'participants.$.lastActive': new Date()
            }
          }
        );
      }
    });

    socket.on('disconnect', async () => {
      console.log('Socket disconnected:', {
        socketId: socket.id,
        userId: socket.user?.id,
        reason: socket.disconnectReason
      });
      
      // If this is a seller, schedule timeouts for any active streams
      if (socket.user && socket.user.role === 'Seller') {
        await scheduleStreamEndTimeout(socket.user.id);
      }

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
        {
          'participants': {
            $elemMatch: {
              id: socket.user.id,
              model: socket.user.role
            }
          }
        },
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
    socket.on('stream_notification_subscribe', (data) => {
      // Check if streamId is provided
      if (data && data.streamId) {
        const roomName = `stream_notifications_${data.streamId}`;
        socket.join(roomName);
        console.log(`User ${socket.user.id} subscribed to notifications for stream ${data.streamId}`);
      } else {
        // Send error instead of joining general room
        socket.emit('stream_notification_error', { 
          error: 'Missing streamId parameter', 
          message: 'StreamId is required to subscribe to stream notifications' 
        });
        console.log(`User ${socket.user.id} attempted to subscribe to stream notifications without providing streamId`);
      }
    });

    // The host can show a message that chat safety hid
    registerUnhide({ io, socket, Stream });

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
        let userRole = socket.user.role; // Default to buyer if role not specified

        if (userRole === 'Seller') {
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

          // The host can't post phone numbers, account numbers or links either
          if (chatSafety.check(data.content).hide) {
            socket.emit('chat_hidden_self', { streamId: data.streamId, message: 'Phone numbers, account numbers and links stay out of chat. Buyers pay in the app.' });
            return;
          }

          // Store in database
          await Stream.findByIdAndUpdate(
            data.streamId,
            { $push: { chatInteractions: notificationObj } }
          );

          // Add timestamp for the WebSocket payload
          notificationObj.timestamp = new Date();

          // Broadcast to stream-specific room
          const streamRoom = `stream_notifications_${data.streamId}`;
          io.to(streamRoom).emit('stream_notification', notificationObj);
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
            user: userDetails.username || userDetails.firstName || 'Viewer',
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

          // Phone numbers, account numbers and links are hidden (the host can undo)
          const safety = chatSafety.check(data.content);
          if (safety.hide) {
            await hideComment({ io, socket, Stream, stream, comment: notificationObj, kind: safety.kind });
            return;
          }

          // Store in database
          await Stream.findByIdAndUpdate(
            data.streamId,
            { $push: { chatInteractions: notificationObj } }
          );

          // Add timestamp for the WebSocket payload
          notificationObj.timestamp = new Date();

          // Repeated questions → a suggestion for the host's show notes
          suggestNotes({ io, stream, askerId: socket.user.id, text: data.content }).catch((e) => console.error('[show-notes] suggestion', e.message));

          // track user comments in mixpanel
          mixpanel.track('stream_comment', {
            streamId: data.streamId,
            buyerId: socket.user.id,
            buyerName: userDetails.firstName + " " + userDetails.lastName,
            buyerUsername: userDetails.username,
            engagementType: 'comment',
            comment: data.content,
            commentTime: new Date().toISOString()
          });

          // Broadcast to stream-specific room
          const streamRoom = `stream_notifications_${data.streamId}`;
          io.to(streamRoom).emit('stream_notification', notificationObj);
        }

      } catch (error) {
        console.error('Error handling stream comment:', error);
      }
    });

    // Handler for stream likes
    socket.on('stream_like', async (data) => {
      try {
        console.log(`Received like from ${socket.user.id} for stream ${data.streamId}`);

        // Ensure streamId is provided
        if (!data.streamId) {
          console.error('Missing streamId in stream_like event');
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
        let userRole = socket.user.role; // Default to buyer if role not specified

        if (userRole === 'Seller') {
          userDetails = await Seller.findById(socket.user.id).select('storeName storeAvatar');

          if (!userDetails) {
            console.error(`Seller not found: ${socket.user.id}`);
            return;
          }

          // Create notification object
          const notificationObj = {
            id: Date.now().toString(),
            type: 'stream_like',
            user: userDetails.storeName || 'Host',
            avatar: userDetails.storeAvatar?.url || '',
            content: `${userDetails.storeName || 'Host'} Sent A Like`,
            data: {
              message: `${userDetails.storeName || 'Host'} Sent A Like`,
              sellerId: socket.user.id,
              sellerName: userDetails.storeName || 'Host',
              streamId: data.streamId,
              isHost: true
            }
          };

          // Store in database - store likes in the likes array, not chatInteractions
          await Stream.findByIdAndUpdate(
            data.streamId,
            { $push: { likes: notificationObj } }
          );

          // Add timestamp for the WebSocket payload
          notificationObj.timestamp = new Date();

          // Broadcast to stream-specific room
          const streamRoom = `stream_notifications_${data.streamId}`;
          io.to(streamRoom).emit('stream_notification', notificationObj);
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
            type: 'stream_like',
            user: userDetails.username || userDetails.firstName || 'Viewer',
            avatar: userDetails.profileImage?.url || userDetails.avatarUrl || '',
            content: `${userDetails.username || userDetails.firstName || 'Viewer'} Sent A Like`,
            data: {
              message: `${userDetails.username || userDetails.firstName || 'Viewer'} Sent A Like`,
              buyerId: socket.user.id,
              buyerName: userDetails.firstName + " " + userDetails.lastName,
              buyerUsername: userDetails.username,
              streamId: data.streamId,
              isHost: false
            }
          };

          // Store in database - store likes in the likes array, not chatInteractions
          await Stream.findByIdAndUpdate(
            data.streamId,
            { $push: { likes: notificationObj } }
          );

          // Add timestamp for the WebSocket payload
          notificationObj.timestamp = new Date();

          // track user likes in mixpanel
          mixpanel.track('stream_like', {
            streamId: data.streamId,
            buyerId: socket.user.id,
            buyerName: userDetails.firstName + " " + userDetails.lastName,
            buyerUsername: userDetails.username,
            engagementType: 'like',
            likeTime: new Date().toISOString()
          });

          // Broadcast to stream-specific room
          const streamRoom = `stream_notifications_${data.streamId}`;
          io.to(streamRoom).emit('stream_notification', notificationObj);
        }

      } catch (error) {
        console.error('Error handling stream like:', error);
      }
    });

    // Handler for live announcements (Host only)
    socket.on('stream_announcement', async (data) => {
      try {
        console.log(`Received announcement from ${socket.user.id} for stream ${data.streamId}`);

        // Ensure streamId is provided
        if (!data.streamId) {
          console.error('Missing streamId in stream_announcement event');
          return;
        }

        // Ensure content is provided
        if (!data.content || data.content.trim() === '') {
          console.error('Missing or empty content in stream_announcement event');
          socket.emit('announcement_error', { message: 'Announcement content is required' });
          return;
        }

        // Find the stream
        const stream = await Stream.findById(data.streamId);
        if (!stream) {
          console.error(`Stream not found: ${data.streamId}`);
          socket.emit('announcement_error', { message: 'Stream not found' });
          return;
        }

        // Validate user is a seller and owns this stream
        if (socket.user.role !== 'Seller') {
          console.error(`Only sellers can make announcements: ${socket.user.id}`);
          socket.emit('announcement_error', { message: 'Only stream hosts can make announcements' });
          return;
        }

        // Check if the seller owns this stream
        if (stream.seller.toString() !== socket.user.id) {
          console.error(`Seller ${socket.user.id} does not own stream ${data.streamId}`);
          socket.emit('announcement_error', { message: 'You can only make announcements on your own streams' });
          return;
        }

        // Get seller details
        const userDetails = await Seller.findById(socket.user.id).select('storeName storeAvatar');

        if (!userDetails) {
          console.error(`Seller not found: ${socket.user.id}`);
          socket.emit('announcement_error', { message: 'Seller not found' });
          return;
        }

        // First, set all existing announcements to current: false
        await Stream.findByIdAndUpdate(
          data.streamId,
          { $set: { 'liveAnnouncements.$[].current': false } }
        );

        // Create new announcement object
        const announcementObj = {
          id: Date.now().toString(),
          content: data.content.trim(),
          current: true,
          sellerId: socket.user.id,
          sellerName: userDetails.storeName || 'Host',
          type: 'announcement',
          user: userDetails.storeName || 'Host',
          avatar: userDetails.storeAvatar?.url || '',
          content: data.content.trim(),
          data: {
            message: data.content.trim(),
            sellerId: socket.user.id,
            sellerName: userDetails.storeName || 'Host',
            streamId: data.streamId,
            isHost: true,
            announcementId: Date.now().toString(),
            current: true
          },
          timestamp: new Date()
        };

        // Add the new announcement to the stream
        await Stream.findByIdAndUpdate(
          data.streamId,
          { $push: { liveAnnouncements: announcementObj } }
        );

        console.log(`Announcement created for stream ${data.streamId}: ${data.content}`);

        // Create notification object for socket broadcast
        const notificationObj = {
          id: announcementObj.id,
          type: 'announcement',
          user: userDetails.storeName || 'Host',
          avatar: userDetails.storeAvatar?.url || '',
          content: data.content.trim(),
          data: {
            message: data.content.trim(),
            sellerId: socket.user.id,
            sellerName: userDetails.storeName || 'Host',
            streamId: data.streamId,
            isHost: true,
            announcementId: announcementObj.id,
            current: true
          },
          timestamp: new Date()
        };

        // Broadcast to stream-specific room
        const streamRoom = `stream_notifications_${data.streamId}`;
        io.to(streamRoom).emit('stream_notification', notificationObj);

        // Send confirmation to the sender
        socket.emit('announcement_sent', {
          success: true,
          message: 'Announcement sent successfully',
          announcement: announcementObj
        });

        console.log(`Announcement broadcasted to room: ${streamRoom}`);

      } catch (error) {
        console.error('Error handling stream announcement:', error);
        socket.emit('announcement_error', { message: 'Failed to send announcement' });
      }
    });

    // Handler for product bidding actions in stream
    socket.on('product_bidding_update', async (data) => {
      try {
        // Ensure streamId and productId are provided
        if (!data.streamId || !data.productId) {
          console.error('Missing streamId or productId in product_bidding_update event');
          return;
        }

        // Find the stream
        const stream = await Stream.findById(data.streamId)
          .populate('seller', 'storeName storeAvatar')
          .populate('products.product', 'name images');

        if (!stream) {
          console.error(`Stream not found: ${data.streamId}`);
          return;
        }

        // Find the product
        const productIndex = stream.products.findIndex(p =>
          p.product._id && p.product._id.toString() === data.productId ||
          p.product && p.product.toString() === data.productId
        );

        if (productIndex === -1) {
          console.error(`Product not found in stream: ${data.productId}`);
          return;
        }

        const product = stream.products[productIndex];

        // Log the product bidding update
        console.log(`Product bidding update for ${product.product.name || 'a product'} in stream ${data.streamId}`);
        console.log(`Status: ${product.bidStatus}, Current bid: ${product.currentBid}`);

        // Create an update notification if requested
        if (data.createNotification && data.notificationType) {
          // Default content based on notification type
          let content = 'Product bidding updated';

          if (data.notificationType === 'auction_start') {
            content = `Bidding started for ${product.product.name || 'a product'}`;
          } else if (data.notificationType === 'auction_end') {
            content = `Bidding ended for ${product.product.name || 'a product'}`;
          } else if (data.notificationType === 'new_bid') {
            content = `New bid for ${product.product.name || 'a product'}: $${product.currentBid}`;
          }

          // Create notification object
          const notificationObj = {
            id: Date.now().toString(),
            type: data.notificationType,
            user: stream.seller.storeName || 'Host',
            avatar: stream.seller.storeAvatar?.url || '',
            content: data.content || content,
            data: {
              message: data.content || content,
              streamId: stream._id.toString(),
              sellerId: stream.seller._id.toString(),
              storeName: stream.seller.storeName || 'Unknown Store',
              product: product
            },
            timestamp: new Date()
          };

          // Broadcast to stream-specific room
          const streamRoom = `stream_notifications_${data.streamId}`;
          io.to(streamRoom).emit('stream_notification', notificationObj);
        }
      } catch (error) {
        console.error('Error handling product bidding update:', error);
      }
    });

    // Handler for real-time auction bids
    socket.on('stream_place_bid', async (data) => {
      try {
        console.log(`[BID] 1. Received bid request from user ${socket.user.id}:`, {
          streamId: data.streamId,
          productId: data.productId,
          bidAmount: data.bidAmount
        });

        // Ensure required data is provided
        if (!data.streamId || !data.productId || !data.bidAmount) {
          console.error('[BID] 2. FAILED: Missing required bid data');
          socket.emit('bid_error', { message: 'Stream ID, Product ID, and Bid Amount are required' });
          return;
        }

        const streamId = data.streamId;
        const productId = data.productId;
        const bidAmount = data.bidAmount;
        const buyerId = socket.user.id;

        console.log(`[BID] 3. Processing bid with validated data`, {
          streamId,
          productId,
          bidAmount,
          buyerId
        });

        // Validate user is a buyer (more lenient check)
        const userRole = socket.user.role; // Default to buyer if role not specified
        if (userRole !== 'Buyer') {
          console.log('[BID] 4. FAILED: User role validation', {
            socketId: socket.id,
            userRole: userRole
          });
          socket.emit('bid_error', { message: 'Only buyers can place bids' });
          return;
        }

        console.log('[BID] 5. User role validated as Buyer');

        // Get buyer details including shipping address
        console.log('[BID] 6. Retrieving buyer details for ID:', buyerId);
        const Buyer = mongoose.model('Buyer');
        const buyer = await Buyer.findById(buyerId).select('firstName lastName username email phoneNumber profileImage wallet shippingAddresses');

        if (!buyer) {
          console.error('[BID] 7. FAILED: Buyer not found in database');
          socket.emit('bid_error', { message: 'Buyer not found' });
          return;
        }

        console.log('[BID] 8. Buyer details retrieved successfully', {
          buyerId: buyer._id,
          name: `${buyer.firstName} ${buyer.lastName}`,
          hasShippingAddresses: buyer.shippingAddresses && buyer.shippingAddresses.length > 0,
          walletBalance: buyer.wallet?.balance
        });

        // Check if buyer has shipping address
        if (!buyer.shippingAddresses || buyer.shippingAddresses.length === 0) {
          console.error('[BID] 9. FAILED: Buyer has no shipping addresses');
          socket.emit('bid_error', { message: 'Please add a shipping address to your profile before bidding' });
          return;
        }

        // Find the stream
        console.log('[BID] 10. Retrieving stream data for ID:', streamId);
        const stream = await Stream.findById(streamId).populate('seller', 'storeName storeAvatar warehouseDetails businessAddress sellerAddress');

        if (!stream) {
          console.error('[BID] 11. FAILED: Stream not found');
          socket.emit('bid_error', { message: 'Stream not found' });
          return;
        }

        if (!require('../services/serviceArea').allowBid(socket, buyer, stream.seller)) return;

        console.log('[BID] 12. Stream data retrieved successfully', {
          streamId: stream._id,
          title: stream.title,
          sellerName: stream.seller?.storeName,
          status: stream.status,
          type: stream.type,
          productCount: stream.products?.length
        });

        // Get available balance from wallet
        const availableBalance = buyer.wallet.balance - (buyer.wallet.onHoldAmount || 0);
        const balance = buyer.wallet.balance;
        const walletToUse = availableBalance > 0 ? availableBalance : balance;

        console.log('[BID] 13. Calculated available wallet balance', {
          totalBalance: buyer.wallet.balance,
          onHoldAmount: buyer.wallet.onHoldAmount || 0,
          availableBalance,
          walletToUse
        });

        // Get seller details for delivery cost calculation
        const sellerInfo = stream.seller;
        console.log('[BID] 14. Retrieved seller info for shipping calculation', {
          sellerId: sellerInfo._id,
          sellerName: sellerInfo.storeName
        });

        // Find the product in the stream's products array
        console.log('[BID] 15. Looking for product in stream products array with ID:', productId);
        const productIndex = stream.products.findIndex(p =>
          p.product && p.product.productId && p.product.productId.toString() === productId
        );

        if (productIndex === -1) {
          console.error('[BID] 16. FAILED: Product not found in stream products');
          socket.emit('bid_error', { message: 'Product not found in stream' });
          return;
        }

        const product = stream.products[productIndex];
        const productDetails = product.product;

        // Bids move in steps (₦500 under ₦10k, ₦1,000 under ₦50k, ₦2,500 above)
        const { minimumNextBid } = require('../services/streamBidService');
        const minimum = minimumNextBid(product);
        if (product.bidStatus === 'active' && Number(bidAmount) < minimum) {
          socket.emit('bid_error', { message: `Bid at least ₦${minimum.toLocaleString('en-NG')}.`, details: { minimum } });
          return;
        }

        console.log('[BID] 17. Found product in stream', {
          productIndex,
          productName: productDetails.name,
          currentBid: product.currentBid,
          minBid: product.minBid,
          maxBid: product.maxBid,
          bidStatus: product.bidStatus
        });

        // Fetch the full product details to get the weight
        console.log('[BID] 18. Fetching full product details from database');
        const Product = mongoose.model('Product');
        const fullProductDetails = await Product.findById(productDetails.productId);

        if (!fullProductDetails) {
          console.warn('[BID] 19. WARNING: Could not retrieve full product details, using default weight');
        } else {
          console.log('[BID] 20. Full product details retrieved', {
            productId: fullProductDetails._id,
            name: fullProductDetails.name,
            weight: fullProductDetails.weight || 1
          });
        }

        // Calculate shipping fee
        console.log('[BID] 21. Preparing shipping fee calculation payload');
        const payload = [
          {
            pickUpState:
              sellerInfo?.warehouseDetails?.state ||
              sellerInfo?.warehouseDetails?.address?.state ||
              sellerInfo?.warehouse?.address?.state ||
              sellerInfo?.contactInformation?.sellerAddress?.state ||
              sellerInfo?.addresses?.sellerAddress?.state ||
              sellerInfo?.addresses?.warehouseAddress?.state ||
              sellerInfo?.businessAddress?.state,
            weight: fullProductDetails?.weight || 1, // Use weight from full product details
            sellerId: sellerInfo?._id,
          },
        ];

        // Prepare shipping details
        const shippingDetails = {
          state: buyer?.shippingAddresses[0]?.state,
          pickupLocations: payload,
        };

        console.log('[BID] 22. Shipping details prepared', {
          buyerState: shippingDetails.state,
          pickupState: payload[0].pickUpState,
          weight: payload[0].weight
        });

        // Delivery is paid once per show (deposit held on the buyer's first item,
        // settled with a Shipbubble quote when the show ends). The bid also
        // holds the deposit if this would be their first item in the show.
        // The deposit is a real Shipbubble quote to the buyer's saved address.
        // If it can't be priced (no address, host's address unfinished), say why.
        let shippingFee = 0;
        try {
          shippingFee = await require('../services/deliveryService').depositFor(stream._id, buyer._id, productId);
        } catch (depositError) {
          const plain = depositError.status ? depositError.message : "Couldn't price delivery right now. Try again in a moment.";
          socket.emit('bid_error', { message: plain, code: depositError.code === 'out_of_area' ? 'out_of_area' : depositError.code==='courier_phone'?'courier_phone': /add your delivery address|phone number/i.test(plain) ? 'no_address' : 'delivery_quote' });
          return;
        }

        // Funds are checked and reserved atomically by streamBids.placeBid below

        // Check if stream type is auction
        if (stream.type !== 'auction') {
          console.error('[BID] 28. FAILED: Stream type is not auction', { type: stream.type });
          socket.emit('bid_error', { message: 'Stream type must be auction to place a bid' });
          return;
        }

        // Check if stream is live
        if (stream.status !== 'live') {
          console.error('[BID] 29. FAILED: Stream is not live', { status: stream.status });
          socket.emit('bid_error', { message: 'Stream must be live to place a bid' });
          return;
        }

        // Check if bidding is active for this product
        if (product.bidStatus !== 'active') {
          console.error('[BID] 30. FAILED: Bidding not active for product', { bidStatus: product.bidStatus });
          socket.emit('bid_error', { message: 'Bidding is now closed for this product' });
          return;
        }

        // Validate bid amount
        if (bidAmount < product.minBid) {
          console.error('[BID] 31. FAILED: Bid amount below minimum', { bidAmount, minBid: product.minBid });
          socket.emit('bid_error', { message: `Bid amount must be at least ${product.minBid}` });
          return;
        }

        // Check if bid is higher than current bid
        if (product.currentBid > 0 && bidAmount <= product.currentBid) {
          console.error('[BID] 32. FAILED: Bid not higher than current bid', { bidAmount, currentBid: product.currentBid });
          socket.emit('bid_error', { message: `Bid amount must be higher than current bid of ${product.currentBid}` });
          return;
        }

        console.log('[BID] 33. All validation checks passed, preparing to place bid');

        // Helper function to format product name to max 3 words
        const formatProductName = (name) => {
          if (!name) return 'a product';

          // Split by spaces and take first 3 words
          const words = name.split(' ');
          const truncatedName = words.slice(0, 3).join(' ');

          // Add ellipsis if there were more than 3 words
          return words.length > 3 ? `${truncatedName}...` : truncatedName;
        };

        // Format the product name
        const formattedProductName = formatProductName(product.product.name);

        // Write the bid only if it is still the highest, and move the wallet hold
        // (bid + delivery fee) to this bidder; the previous leader's hold is released.
        const bidResult = await streamBids.placeBid({
          streamId,
          productId,
          buyer,
          bidAmount,
          shippingFee,
          maxBid: product.maxBid,
          expectedRun: data.expectedRun,
        });

        if (!bidResult.ok) {
          if (bidResult.reason === 'insufficient_funds') {
            socket.emit('bid_error', {
              message: 'Insufficient funds in your wallet. Please top up your wallet.',
              details: { bidAmount, shippingFee, totalRequired: bidAmount + shippingFee }
            });
          } else if (bidResult.reason === 'outbid') {
            socket.emit('bid_error', {
              message: `Bid amount must be higher than current bid of ${bidResult.currentBid}`
            });
          } else {
            socket.emit('bid_error', { message: 'Bidding is now closed for this product' });
          }
          return;
        }

        const newBid = bidResult.bid;
        stream.products.set(productIndex, bidResult.product);

        // Check if bidding should end (reached maxBid)
        console.log('[BID] 36. Checking if bid amount reached max bid', { bidAmount, maxBid: product.maxBid });
        if (bidResult.isWinner) {
          // Create bid winner notification
          const winnerNotification = {
            id: Date.now().toString(),
            type: 'auction_winner',
            user: buyer.username || buyer.firstName || 'Buyer',
            avatar: buyer.profileImage?.url || '',
            content: `won the auction for ${formattedProductName} with a bid of ₦${bidAmount.toLocaleString()} higher than the max bid`,
            data: {
              message: `won the auction for ${formattedProductName} with a bid of ₦${bidAmount.toLocaleString()} higher than the max bid`,
              streamId: stream._id.toString(),
              sellerId: stream.seller._id.toString(),
              storeName: stream.seller.storeName || 'Unknown Store',
              product: stream.products[productIndex],
              bidWinner: {
                buyer: {
                  _id: buyer._id,
                  firstName: buyer.firstName,
                  lastName: buyer.lastName,
                  username: buyer.username,
                  profileImage: buyer.profileImage
                },
                bidAmount: bidAmount,
                timestamp: new Date()
              }
            },
            timestamp: new Date()
          };

          // Add the notification to stream chat interactions
          await Stream.updateOne({ _id: stream._id }, { $push: { chatInteractions: winnerNotification } });
          console.log('[BID] 38. Added winner notification to stream chat interactions');


          // Broadcast to all subscribers
          console.log('[BID] 41. Broadcasting winner notification to subscribers');
          const streamRoom = `stream_notifications_${stream._id.toString()}`;
          io.to(streamRoom).emit('stream_notification', winnerNotification);

          try {
            // Fetch full product details
            console.log('[BID] 42. Fetching full product details for order creation');
            // Get productId from the stream product
            const productIdToFetch = product.product.productId;
            const fullProductDetails = await Product.findById(productIdToFetch).populate('seller');

            if (!fullProductDetails) {
              console.error('[BID] 43. FAILED: Could not retrieve full product details');
              throw new Error('Product details not found');
            }

            console.log('[BID] 44. Full product details retrieved', {
              productId: fullProductDetails._id,
              name: fullProductDetails.name,
              weight: fullProductDetails.weight || 1
            });

            // Buyer details are already fetched above

            if (!buyer.shippingAddresses || buyer.shippingAddresses.length === 0) {
              console.error('[BID] 45. FAILED: Buyer has no shipping addresses');
              throw new Error('Buyer has no shipping addresses');
            }

            // Prepare shipping address
            const selectedAddress = {
              recipientName: `${buyer.firstName} ${buyer.lastName}`,
              recipientEmail: buyer.email,
              recipientPhone: require('../utils/phone').normalisePhone(buyer.phoneNumber) || '', // buyers may not have a phone yet
              recipientAddress: buyer.shippingAddresses[0].addressLine1,
              recipientState: buyer.shippingAddresses[0].state,
            };

            console.log('[BID] 46. Prepared shipping address', selectedAddress);

            // Prepare seller pickup address
            const seller = fullProductDetails.seller;
            const pickupAddress = {
              senderName: `${seller.firstName} ${seller.lastName}`,
              senderEmail: seller.businessEmail || seller.email,
              senderPhone: seller.phoneNumber,
              senderAddress: seller.warehouseDetails?.address?.addressLine1 ||
                seller.businessAddress?.addressLine1 ||
                seller.sellerAddress?.addressLine1,
              pickUpState: seller.warehouseDetails?.address?.state ||
                seller.businessAddress?.state ||
                seller.sellerAddress?.state,
            };

            console.log('[BID] 47. Prepared seller pickup address', pickupAddress);

            // Use shipping fee already calculated above (shippingFee variable)
            console.log('[BID] 48. Using previously calculated shipping fee:', shippingFee);

            // Prepare order data
            const orderData = {
              items: [
                {
                  productId: fullProductDetails._id,
                  quantity: 1,
                  price: bidAmount,
                  weight: fullProductDetails.weight?.toFixed(0) * 1 || 1,
                  seller: {
                    sellerId: seller._id,
                    senderInfo: pickupAddress,
                    shippingFee: shippingFee,
                    parcelInfo: {
                      itemDescription: fullProductDetails?.name?.slice(0, 199),
                    },
                  },
                  specifications: {
                    color: fullProductDetails.colors?.length > 0 ? fullProductDetails.colors[0] : "",
                    size: fullProductDetails.fashion_sizes?.length > 0 ? fullProductDetails.fashion_sizes[0] : "",
                    material: fullProductDetails.fashion_material || "",
                  },
                },
              ],
              shippingAddress: selectedAddress,
              paymentMethod: "Auqli Wallet",
              isItemCod: false,
              shippingFee: shippingFee,
              additionalDetails: "Please handle with care",
              paidFromWallet: true,
              channel: "auction"
            };

            console.log('[BID] 49. Prepared order data', orderData);

            // Create the order
            console.log('[BID] 50. Creating order using order controller');
            // Charge the winner's wallet hold and create the paid order in one transaction
            const orderResult = await auctionOrders.createAuctionOrder({
              streamId: stream._id,
              productId,
              buyerId: buyer._id,
              bidAmount,
              shippingFee: 0, // delivery is charged per show, not per item
            });
            console.log('[BID] 51. Auction order result', orderResult.success ? { orderId: orderResult.orders[0].orderId } : { error: orderResult.message });

            // Update stream product with order information
            if (orderResult && orderResult.success !== false && orderResult.orders && orderResult.orders.length > 0) {
              console.log('[BID] 52. Order created successfully', {
                orderId: orderResult.orders[0].orderId,
                orderTotal: orderResult.totals.grandTotal
              });

              // The order service already recorded the order on the stream; close bidding
              await Stream.updateOne(
                { _id: stream._id, 'products.product.productId': streamBids.productIdMatch(productId) },
                { $set: { 'products.$.bidStatus': 'ended' } }
              );
              stream.products[productIndex].orderCreated = true;
              stream.products[productIndex].orderId = orderResult.orders[0].orderId;
              stream.products[productIndex].bidStatus = 'ended';

              // track live show order event on mixpanel
              mixpanel.track('live_auction_order', {
                streamId: stream._id,
                buyerId: buyer._id,
                productId: fullProductDetails._id,
                productName: fullProductDetails.name,
                buyerName: buyer.firstName + " " + buyer.lastName,
                buyerUsername: buyer.username,
                orderId: orderResult.orders[0].orderId,
                orderTotal: orderResult.totals.grandTotal,
                orderDate: orderResult.orders[0].createdAt,
              });

              // Create a stream-specific room name
              const streamRoom = `stream_notifications_${stream._id.toString()}`;

              // Send general winner notification to all subscribers
              io.to(streamRoom).emit('stream_notification', winnerNotification);
              
              // Since we're already in the socket handler for the winning bidder,
              // we can just use socket.emit to send directly to this socket
              console.log(`[BID] 52b. Sending order confirmation directly to the winning bidder's socket ID: ${socket.id}`);
              
              // Send order confirmation only to the current socket (winning bidder)
              socket.emit('auction_order_created', {
                success: true,
                message: 'Order created for your winning bid',
                orderId: orderResult.orders[0].orderId,
                streamId: stream._id,
                orderDetails: orderResult.orders[0],
                productName: fullProductDetails.name,
                amount: stream.products[productIndex].currentBid,
                shippingFee: 0, // delivery is settled once per show
                total: stream.products[productIndex].currentBid
              });
              
              console.log(`[BID] 52c. Order confirmation sent to winning bidder: ${buyer._id.toString()}, Socket ID: ${socket.id}`);
            } else {
              console.error('[BID] 52. Failed to create order',
                orderResult?.message || 'Unknown error');

              // Emit error notification to buyer
              const streamRoom = `stream_notifications_${stream._id.toString()}`;
              io.to(streamRoom).emit('auction_order_error', {
                success: false,
                message: 'Failed to create order for auction win',
                error: orderResult?.message || 'Unknown error occurred during order creation',
                productName: fullProductDetails.name,
              });
            }
          } catch (orderError) {
            console.error('[BID] ERROR: Failed to create order:', orderError);
            // Never leave the winner's money held for an order that wasn't made
            await streamBids.releaseProductHold(stream._id, productId).catch(() => {});

            // Create a stream-specific room name
            const streamRoom = `stream_notifications_${stream._id.toString()}`;

            // Try to notify buyer of error
            io.to(streamRoom).emit('auction_order_error', {
              success: false,
              message: 'Error processing auction order',
              error: orderError.message || 'Unknown error occurred',
              productName: product.product.name || 'Unknown product'
            });
          }

          // Send success message to bidder
          console.log('[BID] 53. Sending success response to bidder (auction won)');
          socket.emit('bid_placed', {
            success: true,
            message: 'Bid placed successfully and auction won',
            bid: newBid,
            product: stream.products[productIndex],
            isWinner: true
          });

          return;
        }

        // Create bid notification for regular bids
        console.log('[BID] 43. Creating regular bid notification');
        const bidNotification = {
          id: Date.now().toString(),
          type: 'new_bid',
          user: buyer.username || buyer.firstName || 'Buyer',
          avatar: buyer.profileImage?.url || '',
          content: `placed a bid of ₦${bidAmount.toLocaleString()} on ${formattedProductName}`,
          data: {
            message: `placed a bid of ₦${bidAmount.toLocaleString()} on ${formattedProductName}`,
            streamId: stream._id.toString(),
            buyerId: buyer._id.toString(),
            buyerName: buyer.firstName + " " + buyer.lastName,
            product: stream.products[productIndex],
            bidAmount: bidAmount,
            currentBidder: {
              _id: buyer._id,
              firstName: buyer.firstName,
              lastName: buyer.lastName,
              username: buyer.username,
              profileImage: buyer.profileImage
            },
            timestamp: new Date()
          },
          timestamp: new Date()
        };

        // Add the notification to stream chat interactions
        await Stream.updateOne({ _id: stream._id }, { $push: { chatInteractions: bidNotification } });
        console.log('[BID] 44. Added bid notification to stream chat interactions');


        // Broadcast to all subscribers
        console.log('[BID] 47. Broadcasting bid notification to subscribers');
        const streamRoom = `stream_notifications_${stream._id.toString()}`;
        io.to(streamRoom).emit('stream_notification', bidNotification);

        // Send success message to bidder
        console.log('[BID] 48. Sending success response to bidder');
        socket.emit('bid_placed', {
          success: true,
          message: 'Bid placed successfully',
          bid: newBid,
          product: stream.products[productIndex]
        });

      } catch (error) {
        console.error('[BID] ERROR: Failed to process bid via socket:', error);
        socket.emit('bid_error', { message: 'Failed to place bid: ' + error.message });
      }
    });

    // Join auction bidding room
    socket.on('join_auction_bidding', (streamId) => {
      socket.join('stream_auction_bidding');
      console.log(`User ${socket.user.id} joined auction bidding room for stream ${streamId}`);
    });

    // Leave auction bidding room
    socket.on('leave_auction_bidding', () => {
      socket.leave('stream_auction_bidding');
      console.log(`User ${socket.user.id} left auction bidding room`);
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
          {
            'participants': {
              $elemMatch: {
                id: userId,
                model: userData.userModel
              }
            }
          },
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

// Add function to get the io instance
function getIO() {
  if (!ioInstance) {
    console.error('Socket.io has not been initialized yet!');
  }
  return ioInstance;
}

// Function to handle stream timeout for a disconnected seller
async function scheduleStreamEndTimeout(sellerId) {
  try {
    // Find all active streams for this seller
    const Stream = require('../models/Stream');
    const activeStreams = await Stream.find({
      seller: sellerId,
      status: 'live'
    });
    
    if (!activeStreams || activeStreams.length === 0) {
      return false;
    }
    
    console.log(`[SOCKET] Seller ${sellerId} disconnected with ${activeStreams.length} active stream(s)`);
    
    // Get the agenda instance
    const { agenda } = require('../config/agenda');
    
    // Schedule a job to end each active stream after 2 hours
    for (const stream of activeStreams) {
      // Check if there's already a pending job for this stream
      const existingJobs = await agenda.jobs({
        name: 'stream_auto_end',
        'data.streamId': stream._id.toString(),
        nextRunAt: { $ne: null }
      });
      
      // Skip if there's already a job scheduled for this stream
      if (existingJobs && existingJobs.length > 0) {
        console.log(`[SOCKET] Stream timeout job already exists for streamId: ${stream._id}, skipping`);
        continue;
      }
      
      // Create a unique job ID for this stream timeout
      const jobId = `stream_end_${stream._id}_${Date.now()}`;
      
      // Schedule the job to run 2 hours from now
      await agenda.schedule('in 2 hours', 'stream_auto_end', {
        streamId: stream._id.toString(),
        sellerId: sellerId,
        jobId,
        reason: 'Seller disconnected'
      });
      
      console.log(`[SOCKET] Scheduled stream timeout job ${jobId} for streamId: ${stream._id} (Seller disconnected)`);
    }
    
    return true;
  } catch (error) {
    console.error('[SOCKET] Error scheduling stream timeout:', error);
    return false;
  }
}

// Function to cancel pending stream end jobs for a seller
async function cancelPendingStreamEndJobs(sellerId) {
  try {
    // Find all active streams for this seller
    const Stream = require('../models/Stream');
    const activeStreams = await Stream.find({
      seller: sellerId,
      status: 'live'
    });
    
    if (!activeStreams || activeStreams.length === 0) {
      return 0;
    }
    
    // Get the agenda instance
    const { agenda } = require('../config/agenda');
    
    let canceledCount = 0;
    
    // Cancel jobs for each active stream
    for (const stream of activeStreams) {
      const jobs = await agenda.jobs({
        name: 'stream_auto_end',
        'data.streamId': stream._id.toString()
      });
      
      if (jobs && jobs.length > 0) {
        for (const job of jobs) {
          await job.remove();
          canceledCount++;
          console.log(`[SOCKET] Cancelled stream timeout job for streamId: ${stream._id} (Seller reconnected)`);
        }
      }
    }
    
    if (canceledCount > 0) {
      console.log(`[SOCKET] Cancelled ${canceledCount} pending stream end jobs for seller ${sellerId}`);
    }
    
    return canceledCount;
  } catch (error) {
    console.error('[SOCKET] Error cancelling pending stream end jobs:', error);
    return 0;
  }
}

// Export both functions
module.exports = {
  initializeSocket,
  getIO,
  getActiveUsers: () => activeUsers
}; 