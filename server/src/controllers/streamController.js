const Stream = require('../models/Stream');
const agoraService = require('../services/agoraService');
const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
const Product = require('../models/Product');
const { s3 } = require('../config/awsConfig');
const jwtDecode = require('jwt-decode');
const Seller = require('../models/Seller');
const { RtcRole } = require('agora-access-token');
const Buyer = require('../models/Buyer');
const { saveToken, getToken } = require('../../Firebase');
const { Expo } = require('expo-server-sdk');
const mongoose = require('mongoose');

const expo = new Expo();


exports.createStream = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      tags,
      scheduledStartTime,
      video,
      coverImage
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        message: 'Title, description, and category are required'
      });
    }

    // Validate scheduledStartTime format
    if (!scheduledStartTime) {
      return res.status(400).json({
        message: 'Scheduled start time is required'
      });
    }

    // Check if scheduledStartTime is a valid date
    const startDate = new Date(scheduledStartTime);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid date and time format for scheduled start time'
      });
    }

    // No need to parse tags and products as they should now be objects/arrays directly
    const parsedTags = tags || [];

    // Parse products array
    const products = req.body.products || [];
    if (!Array.isArray(products)) {
      return res.status(400).json({
        message: 'Invalid products format. Expected array'
      });
    }

    // Fetch complete product details from the database for each product
    // This ensures we have rich, complete data regardless of what the frontend sends
    const productsWithFullDetails = await Promise.all(
      products.map(async (p) => {
        // Get the productId from the frontend data
        const productId = p.product?.productId;
        
        if (!productId) {
          return p; // If no productId, return as is
        }
        
        // Fetch complete product details from database
        const completeProduct = await Product.findById(productId).select(
          '_id name description category images price sku stock variants'
        );
        
        if (!completeProduct) {
          return p; // If product not found, return as is
        }
        
        // Return the product with complete details from database
        return {
          ...p,
          product: {
            productId: completeProduct._id,
            name: completeProduct.name,
            category: completeProduct.category,
            images: completeProduct.images,
            sku: completeProduct.sku,
            quantity: completeProduct.stock || 0,
            price: completeProduct.price,
            description: completeProduct.description,
            variants: completeProduct.variants
          }
        };
      })
    );

    // Upload cover image to AWS S3
    let imageData = {};
    if (coverImage && coverImage.data) {
      try {
        const buffer = Buffer.from(coverImage.data, 'base64');
        const fileKey = `stream-covers/${uuidv4()}.${coverImage.contentType ? coverImage.contentType.split('/')[1] || 'jpg' : 'jpg'}`;
        const uploadParams = {
          Bucket: 'auqli-uploads',
          Key: fileKey,
          Body: buffer,
          ContentType: coverImage.contentType || 'image/jpeg'
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        imageData = {
          url: uploadResult.Location,
          key: fileKey
        };
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          message: 'Failed to upload cover image',
          error: uploadError.message
        });
      }
    }

    // Handle video upload
    let videoData = {};
    if (video) {
      try {
        // Handle video data properly whether it comes from FormData or JSON
        let processedVideo = video;
        
        // Only try to parse if it's a string that looks like JSON (starts with { or [)
        if (typeof video === 'string' && (video.trim().startsWith('{') || video.trim().startsWith('['))) {
          try {
            processedVideo = JSON.parse(video);
          } catch (parseError) {
            // If parsing fails, use original value
            console.log('Warning: Failed to parse video data as JSON, using as is');
            processedVideo = video;
          }
        }
        
        // Now handle the video data
        if (processedVideo && processedVideo.data) {
          const buffer = Buffer.from(processedVideo.data, 'base64');
          const fileKey = `stream-videos/${uuidv4()}.mp4`;
          const params = {
            Bucket: 'auqli-uploads',
            Key: fileKey,
            Body: buffer,
            ContentType: processedVideo.contentType || 'video/mp4',
          };
          
          const uploadResult = await s3.upload(params).promise();
          videoData = {
            url: uploadResult.Location,
            key: fileKey
          };
        }
      } catch (videoError) {
        console.error('Video upload error:', videoError);
        return res.status(500).json({
          message: 'Failed to upload video',
          error: videoError.message
        });
      }
    }

    // Generate unique channel name
    const channelName = `stream_${uuidv4()}`;

    // Generate Agora token
    const seller = await Seller.findById(req.user.id).select('agoraUid');
    const token = agoraService.generateToken(channelName, seller.agoraUid);
    console.log('create stream uid', seller.agoraUid);

    const stream = new Stream({
      seller: req.user.id,
      title,
      description,
      coverImage: imageData,
      video: videoData,
      category,
      tags: parsedTags,
      products: productsWithFullDetails.map(p => ({
        product: p.product,
        minBid: p.minBid,
        maxBid: p.maxBid
      })),
      channelName,
      agoraToken: token,
      agoraUid: seller.agoraUid,
      scheduledStartTime: startDate,
      type: 'auction',
      status: 'scheduled'
    });

    await stream.save();

    const populatedStream = await Stream.findById(stream._id)
      .populate('seller', 'storeName businessName storeAvatar rating')
      .populate('products.product', 'name description images price');


    res.status(201).json({
      message: 'Stream created successfully',
      stream: populatedStream
    });
  } catch (error) {
    console.error('Create stream error:', error);
    res.status(500).json({
      message: 'Failed to create stream',
      error: error.message || 'Internal server error'
    });
  }
};

exports.startStream = async (req, res) => {
  try {
    // Check for existing live streams
    const existingStreams = await Stream.find({
      seller: req.user.id,
      status: 'live',
      _id: { $ne: req.params.streamId } // Exclude current stream
    });

    let cancelledStreams = [];
    if (existingStreams.length > 0) {
      // Update existing streams
      await Stream.updateMany(
        { _id: { $in: existingStreams.map(s => s._id) } },
        {
          $set: {
            status: 'cancelled',
            endTime: new Date(),
            cancelledStream: true
          }
        }
      );
      cancelledStreams = existingStreams.map(s => s.title);

      // Update seller's cancelledStreamCount and lastStreamCancellation
      await Seller.updateOne(
        { _id: req.user.id },
        {
          $inc: { cancelledStreamCount: existingStreams.length },
          $set: { lastStreamCancellation: new Date() }
        }
      );
    }

    // Proceed with starting new stream
    const stream = await Stream.findOne({
      _id: req.params.streamId,
      seller: req.user.id
    }).populate('seller');

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Get seller with store name and followers
    const seller = await Seller.findById(req.user.id).select('agoraUid storeName followers');
    const freshToken = agoraService.generateToken(stream.channelName, seller.agoraUid, RtcRole.PUBLISHER);
    console.log('start stream uid', seller.agoraUid);

    stream.status = 'live';
    stream.actualStartTime = new Date();
    stream.agoraUid = seller.agoraUid;
    stream.agoraToken = freshToken;
    
    // Save stream first with basic updates
    await stream.save();
    
    // Create notification object
    const notificationObj = {
      id: Date.now().toString(),
      type: 'start',
      user: seller.storeName || 'Host',
      avatar: stream.seller.storeAvatar?.url || '',
      content: 'Host started stream',
      data: {
        message: 'Host started stream',
        streamId: stream._id.toString(),
        sellerId: req.user.id.toString(),
        storeName: seller.storeName || 'Unknown Store',
        title: stream.title
      }
      // timestamp will be added automatically by the schema default
    };
    
    try {
      // Create a new chat interaction document
      await Stream.findByIdAndUpdate(
        stream._id,
        { $push: { chatInteractions: notificationObj } }
      );
      
      // Send WebSocket notification if IO is available
      if (req.app && req.app.get('io')) {
        const io = req.app.get('io');
        // Add timestamp for the WebSocket payload
        notificationObj.timestamp = new Date();
        io.to('stream_notifications').emit('stream_notification', notificationObj);
      }

      // Send push notifications to all followers
      if (seller.followers && seller.followers.length > 0) {
        const notifications = await Promise.all(
          seller.followers.map(async (follower) => {
            const userToken = await getToken(follower.buyerId);
            if (userToken) {
              return {
                to: userToken.token,
                title: `${seller.storeName} Started a Live ${stream.type === 'auction' ? 'Auction' : 'Show'}`,
                body: `${seller.storeName} has started a live ${stream.type === 'auction' ? 'auction' : 'show'}. Join now!`
              };
            }
            return null;
          })
        );

        // Filter out null values and send notifications
        const validNotifications = notifications.filter(notification => notification !== null);
        if (validNotifications.length > 0) {
          await expo.sendPushNotificationsAsync(validNotifications);
        }
      }

    } catch (error) {
      console.error('Failed to save chat interaction or send notifications:', error);
      // Continue with the response even if saving the chat interaction fails
    }

    res.json({
      message: 'Stream started successfully',
      warning: existingStreams.length > 0 ?
        `Cancelled ${existingStreams.length} active stream(s): ${cancelledStreams.join(', ')}` : null,
      stream: {
        agoraToken: freshToken
      }
    });

  } catch (error) {
    console.error('Start stream error:', error);
    res.status(500).json({
      message: 'Failed to start stream',
      error: error.message
    });
  }
};

exports.placeBid = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { productId, bidAmount } = req.body;
    const buyerId = req.user.id;

    // Validate required fields
    if (!streamId || !productId || !bidAmount) {
      return res.status(400).json({
        message: 'Stream ID, Product ID, and Bid Amount are required'
      });
    }

    // Find the stream
    const stream = await Stream.findById(streamId)
      .populate('seller', 'storeName storeAvatar')
      .populate('products.currentBidder', 'firstName lastName username profileImage');

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Check if stream type is auction
    if (stream.type !== 'auction') {
      return res.status(400).json({ message: 'Stream type must be auction to place a bid' });
    }

    // Check if stream is live
    if (stream.status !== 'live') {
      return res.status(400).json({ message: 'Stream must be live to place a bid' });
    }

    // Find the product in the stream's products array
    const productIndex = stream.products.findIndex(p => 
      p.product && p.product.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in stream' });
    }

    const product = stream.products[productIndex];

    // Check if bidding is active for this product
    if (product.bidStatus !== 'active') {
      return res.status(400).json({ message: 'Bidding is not currently active for this product' });
    }

    // Validate bid amount
    if (bidAmount < product.minBid) {
      return res.status(400).json({
        message: `Bid amount must be at least ${product.minBid}`
      });
    }

    // Check if bid is higher than current bid
    if (product.currentBid > 0 && bidAmount <= product.currentBid) {
      return res.status(400).json({
        message: `Bid amount must be higher than current bid of ${product.currentBid}`
      });
    }

    // Get buyer details
    const Buyer = mongoose.model('Buyer');
    const buyer = await Buyer.findById(buyerId).select('firstName lastName username profileImage wallet');

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Add new bid to the bids array
    const newBid = {
      buyer: buyerId,
      product: productId,
      amount: bidAmount,
      timestamp: new Date()
    };

    stream.bids.push(newBid);

    // Update product's currentBid and currentBidder
    stream.products[productIndex].currentBid = bidAmount;
    stream.products[productIndex].currentBidder = buyerId;

    // Check if bidding should end (reached maxBid)
    if (bidAmount >= product.maxBid) {
      stream.products[productIndex].bidStatus = 'ended';
      stream.products[productIndex].bidWinner = {
        buyer: buyerId,
        bidAmount: bidAmount,
        winningTime: new Date()
      };

      // Create bid winner notification
      const winnerNotification = {
        id: Date.now().toString(),
        type: 'auction_winner',
        user: stream.seller.storeName || 'Host',
        avatar: stream.seller.storeAvatar?.url || '',
        content: `${buyer.firstName || 'Buyer'} won the auction for ${product.product.name || 'a product'} with a bid of ${bidAmount}`,
        data: {
          message: `${buyer.firstName || 'Buyer'} won the auction for ${product.product.name || 'a product'} with a bid of ${bidAmount}`,
          streamId: stream._id.toString(),
          sellerId: stream.seller._id.toString(),
          storeName: stream.seller.storeName || 'Unknown Store',
          product: stream.products[productIndex],
          winner: {
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
        }
      };

      // Add the notification to stream chat interactions
      stream.chatInteractions.push(winnerNotification);
      
      // Save the stream
      await stream.save();
      
      // Send WebSocket notification
      req.app.get('io').to('stream_notifications').emit('stream_notification', winnerNotification);

      return res.status(200).json({
        message: 'Bid placed successfully and auction won',
        bid: newBid,
        product: stream.products[productIndex],
        isWinner: true
      });
    }

    // Create bid notification
    const bidNotification = {
      id: Date.now().toString(),
      type: 'new_bid',
      user: buyer.firstName || buyer.username || 'Buyer',
      avatar: buyer.profileImage?.url || '',
      content: `${buyer.firstName || 'Someone'} placed a bid of ${bidAmount} on ${product.product.name || 'a product'}`,
      data: {
        message: `${buyer.firstName || 'Someone'} placed a bid of ${bidAmount} on ${product.product.name || 'a product'}`,
        streamId: stream._id.toString(),
        buyerId: buyer._id.toString(),
        buyerName: buyer.firstName + " " + buyer.lastName,
        product: stream.products[productIndex],
        bidAmount: bidAmount,
        timestamp: new Date()
      }
    };

    // Add the notification to stream chat interactions
    stream.chatInteractions.push(bidNotification);
    
    // Save the stream
    await stream.save();
    
    // Send WebSocket notification
    req.app.get('io').to('stream_notifications').emit('stream_notification', bidNotification);

    return res.status(200).json({
      message: 'Bid placed successfully',
      bid: newBid,
      product: stream.products[productIndex]
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    return res.status(500).json({
      message: 'Failed to place bid',
      error: error.message
    });
  }
};

exports.endStream = async (req, res) => {
  try {
    const stream = await Stream.findOne({
      _id: req.params.streamId,
      seller: req.user.id,
      status: 'live'
    });

    if (!stream) {
      return res.status(404).json({ message: 'Active stream not found' });
    }

    stream.status = 'ended';
    stream.endTime = new Date();
    await stream.save();

    // Notify connected clients that the stream has ended
    req.io.to(stream.channelName).emit('streamEnded', {
      streamId: stream._id,
      message: 'Stream has ended'
    });

    res.json({
      message: 'Stream ended successfully',
      stream
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to end stream',
      error: error.message
    });
  }
};

exports.getActiveStreams = async (req, res) => {
  try {
    const activeStreams = await Stream.find({ status: 'live' })
      .populate('seller', 'storeName businessName storeAvatar rating')
      .populate('products.product', 'name description images price')
      .sort({ actualStartTime: -1 });

    res.json(activeStreams);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch active streams',
      error: error.message
    });
  }
};

exports.getStreamDetails = async (req, res) => {
  console.log(`[DEBUG] getStreamDetails called with streamId: ${req.params.streamId}`);
  try {
    let stream = await Stream.findById(req.params.streamId)
      .populate('seller', 'storeName businessName storeAvatar rating')
      .populate('products.product', 'name description images price')
      .populate('products.currentBidder', 'firstName lastName username')
      .populate('viewers', 'firstName lastName username')
      .select('seller title description coverImage category tags products status channelName agoraToken scheduledStartTime actualStartTime endTime viewers type bids createdAt updatedAt');

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Calculate expiration times
    const now = new Date();
    const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

    if (stream.status === 'scheduled' && stream.scheduledStartTime) {
      const expirationTime = new Date(stream.scheduledStartTime.getTime() + ONE_HOUR);
      if (now > expirationTime) {
        stream.status = 'expired';
        await stream.save();
      }
    }
    res.json(stream);
  } catch (error) {
    console.error(`[DEBUG] Error in getStreamDetails:`, error);
    res.status(500).json({
      message: 'Failed to fetch stream details',
      error: error.message
    });
  }
};

exports.joinStream = async (req, res) => {
  try {
    // First check if the stream exists and is live
    let stream = await Stream.findOne({
      _id: req.params.streamId,
      status: 'live'
    });

    if (!stream) {
      return res.status(404).json({ message: 'Active stream not found' });
    }

    // Fetch complete buyer details
    const buyer = await Buyer.findById(req.user.id).select('firstName lastName username avatarUrl profileImage');
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Generate appropriate UID for viewer
    // Create a deterministic but unique value based on user ID and stream ID
    const userIdNum = parseInt(req.user.id.substring(0, 8), 16);
    const streamIdNum = parseInt(stream._id.toString().substring(0, 8), 16);
    // Combine and constrain to be within Agora's allowed range
    const tokenUid = ((userIdNum ^ streamIdNum) % 999000) + 1000;

    const token = agoraService.generateToken(
      stream.channelName,
      tokenUid, 
      RtcRole.SUBSCRIBER
    );
    
    // Send push notification if token exists
    const userToken = await getToken(req.user.id);
    if (userToken) {
      await expo.sendPushNotificationsAsync([{
        to: userToken.token,
        title: `Live Show Activity`,
        body: `You have successfully joined a stream created by ${stream.seller.storeName || 'the seller'}`
      }]);
    }

    // Add user to viewers if not already there and remove from departedViewers if they rejoin
    // Important: Update database first before continuing
    if (!stream.viewers.includes(req.user.id)) {
      await Stream.updateOne(
        { _id: req.params.streamId },
        { 
          $addToSet: { viewers: req.user.id },
          $pull: { departedViewers: { buyer: req.user.id } } 
        }
      );
    }

    // IMPORTANT: Fetch the updated stream with complete data AFTER we've updated the viewers array
    // This ensures we have the correct viewerCount that includes the new viewer
    stream = await Stream.findOne({
      _id: req.params.streamId,
      status: 'live'
    })
    .populate('seller', 'storeName businessName storeAvatar rating')
    .populate('products.product', 'name description images price stock sku variants')
    .populate('products.currentBidder', 'firstName lastName username email')
    .populate('viewers', 'firstName lastName username avatarUrl')
    .populate('bids.buyer', 'firstName lastName username')
    .populate('bids.product', 'name price')
    .lean(); // Convert to plain JavaScript object

    // Get all viewers with detailed information
    const detailedViewers = await Buyer.find(
      { _id: { $in: stream.viewers } }
    ).select('_id firstName lastName username profileImage avatarUrl').lean();

    // Send notification to stream channel
    req.io?.to(stream.channelName).emit('viewerJoined', {
      streamId: stream._id,
      viewer: req.user.id,
      viewerName: buyer.firstName + " " + buyer.lastName
    });

    // Create notification object for chat interactions
    const notificationObj = {
      id: Date.now().toString(),
      type: 'join',
      user: buyer.username || buyer.firstName || 'Viewer',
      avatar: buyer.profileImage?.url || buyer.avatarUrl || '',
      content: `viewer joined room`,
      data: {
        message: `${buyer.username || buyer.firstName} joined room`,
        buyerId: req.user.id.toString(),
        buyerName: buyer.firstName + " " + buyer.lastName,
        buyerUsername: buyer.username,
        buyerAvatar: buyer.profileImage?.url || buyer.avatarUrl || '',
        streamId: stream._id.toString(),
        sellerName: stream.seller?.storeName || stream.seller?.businessName,
        sellerId: stream.seller?._id.toString(),
        viewerCount: stream.viewers.length // Now this will be correct
      }
    };
    
    try {
      // Add the notification to the stream's chat interactions
      await Stream.findByIdAndUpdate(
        stream._id,
        { $push: { chatInteractions: notificationObj } }
      );
      
      // Broadcast to all subscribers of stream notifications
      if (req.app && req.app.get('io')) {
        const io = req.app.get('io');
        // Add timestamp for the WebSocket payload
        notificationObj.timestamp = new Date();
        io.to('stream_notifications').emit('viewer_joined_stream', notificationObj);
      }
    } catch (error) {
      console.error('Failed to save chat interaction:', error);
      // Continue even if saving the chat interaction fails
    }

    // Remove sensitive fields
    const { __v, ...streamData } = stream;
    
    res.json({
      message: 'Successfully joined stream',
      channelName: stream.channelName,
      token,
      uid: tokenUid,
      role: RtcRole.SUBSCRIBER,
      tokenExpiration: Date.now() + (14400) * 1000,
      stream: {
        ...streamData,
        viewerCount: stream.viewers.length, // This now includes the newly joined viewer
        isLive: stream.status === 'live',
        products: stream.products.map(product => ({
          ...product,
          currentBid: product.currentBid,
          minBid: product.minBid,
          maxBid: product.maxBid,
          currentBidder: product.currentBidder
        })),
        viewers: detailedViewers
      }
    });
  } catch (error) {
    console.error('Join stream error:', error);
    res.status(500).json({
      message: 'Failed to join stream',
      error: error.message
    });
  }
};

exports.joinStreamSeller = async (req, res) => {
  try {
    const stream = await Stream.findOne({
      _id: req.params.streamId,
      seller: req.user.id,
      status: 'live'
    })
    .populate('seller', 'storeName businessName storeAvatar rating')
    .populate('products.product', 'name description images price stock sku variants')
    .populate('products.currentBidder', 'firstName lastName username email')
    .populate('viewers', 'firstName lastName username avatarUrl')
    .populate('bids.buyer', 'firstName lastName username')
    .populate('bids.product', 'name price')
    .lean(); // Convert to plain JavaScript object

    if (!stream) {
      return res.status(404).json({ message: 'Active stream not found or you do not have permission' });
    }

    // For sellers, use their agoraUid
    const seller = await Seller.findById(req.user.id).select('agoraUid');
    if (!seller || !seller.agoraUid) {
      return res.status(400).json({ message: 'Seller Agora UID not found' });
    }

    const token = agoraService.generateToken(
      stream.channelName,
      seller.agoraUid, 
      RtcRole.PUBLISHER
    );

    // Create notification object for chat interactions
    const notificationObj = {
      id: Date.now().toString(),
      type: 'join',
      user: stream.seller.storeName || 'Host',
      avatar: stream.seller.storeAvatar?.url || '',
      content: 'Host rejoined room',
      data: {
        message: 'Host rejoined room',
        sellerId: req.user.id.toString(),
        streamId: stream._id.toString(),
        sellerName: stream.seller.storeName || stream.seller.businessName
      }
      // timestamp will be added automatically by the schema default
    };
    
    try {
      // Add the notification to the stream's chat interactions
      await Stream.findByIdAndUpdate(
        stream._id,
        { $push: { chatInteractions: notificationObj } }
      );
      
      // Broadcast a notification that the seller has rejoined their stream
      if (req.app && req.app.get('io')) {
        const io = req.app.get('io');
        // Add timestamp for the WebSocket payload
        notificationObj.timestamp = new Date();
        io.to('stream_notifications').emit('seller_rejoined_stream', notificationObj);
      }
    } catch (error) {
      console.error('Failed to save chat interaction:', error);
      // Continue even if saving the chat interaction fails
    }

    console.log('agoraUid (seller)', seller.agoraUid);
    console.log('token', token);

    // Remove sensitive fields
    const { __v, ...streamData } = stream;
    
    // Get all viewers with detailed information
    const detailedViewers = await Buyer.find(
      { _id: { $in: stream.viewers.map(v => v._id) } }
    ).select('_id firstName lastName username profileImage avatarUrl').lean();
    
    res.json({
      message: 'Successfully joined stream as seller',
      channelName: stream.channelName,
      token,
      uid: seller.agoraUid,
      role: RtcRole.PUBLISHER,
      tokenExpiration: Date.now() + (3600) * 1000,
      stream: {
        ...streamData,
        viewerCount: stream.viewers.length,
        isLive: stream.status === 'live',
        products: stream.products.map(product => ({
          ...product,
          currentBid: product.currentBid,
          minBid: product.minBid,
          maxBid: product.maxBid
        })),
        viewers: detailedViewers.map(viewer => ({
          _id: viewer._id,
          firstName: viewer.firstName,
          lastName: viewer.lastName,
          username: viewer.username,
          profileImage: viewer.profileImage,
          avatarUrl: viewer.avatarUrl
        }))
      }
    });
  } catch (error) {
    console.error('Join stream as seller error:', error);
    res.status(500).json({
      message: 'Failed to join stream as seller',
      error: error.message
    });
  }
};

exports.getSellerStreams = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { seller: sellerId };
    if (status && ['scheduled', 'live', 'ended'].includes(status)) {
      query.status = status;
    }

    // Execute query with pagination
    const streams = await Stream.find(query)
      .populate('seller', 'storeName businessName storeAvatar rating')
      .populate('products.product', 'name description images price')
      .populate('products.currentBidder', 'firstName lastName username')
      .sort({ scheduledStartTime: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Check and update expiration status for each stream
    const ONE_HOUR = 60 * 60 * 1000;
    const now = new Date();

    for (const stream of streams) {
      let needsUpdate = false;
      const update = { status: 'expired' };

      if (stream.status === 'scheduled' && stream.scheduledStartTime) {
        const expirationTime = new Date(stream.scheduledStartTime.getTime() + ONE_HOUR);
        if (now > expirationTime) {
          needsUpdate = true;
        }
      } else if (stream.status === 'live' && stream.actualStartTime && !stream.endTime) {
        const expirationTime = new Date(stream.actualStartTime.getTime() + ONE_HOUR);
        if (now > expirationTime) {
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await Stream.updateOne(
          { _id: stream._id },
          { $set: update },
          { runValidators: false }  // Bypass validation for status updates
        );
      }
    }

    // Get total count for pagination
    const total = await Stream.countDocuments(query);

    res.json({
      streams,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch seller streams',
      error: error.message
    });
  }
};

exports.createOpenLiveShow = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      tags,
      scheduledStartTime,
      video,
      coverImage
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        message: 'Title, description, and category are required'
      });
    }

    // Validate scheduledStartTime format
    if (!scheduledStartTime) {
      return res.status(400).json({
        message: 'Scheduled start time is required'
      });
    }

    // Check if scheduledStartTime is a valid date
    const startDate = new Date(scheduledStartTime);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid date and time format for scheduled start time'
      });
    }

    // No need to parse tags as they should now be arrays directly
    const parsedTags = tags || [];

    // Upload cover image to AWS S3
    let imageData = {};
    if (coverImage && coverImage.data) {
      try {
        const buffer = Buffer.from(coverImage.data, 'base64');
        const fileKey = `stream-covers/${uuidv4()}.${coverImage.contentType ? coverImage.contentType.split('/')[1] || 'jpg' : 'jpg'}`;
        const uploadParams = {
          Bucket: 'auqli-uploads',
          Key: fileKey,
          Body: buffer,
          ContentType: coverImage.contentType || 'image/jpeg'
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        imageData = {
          url: uploadResult.Location,
          key: fileKey
        };
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          message: 'Failed to upload cover image',
          error: uploadError.message
        });
      }
    }

    // Handle video upload
    let videoData = {};
    if (video) {
      try {
        // Handle video data properly whether it comes from FormData or JSON
        let processedVideo = video;
        
        // Only try to parse if it's a string that looks like JSON (starts with { or [)
        if (typeof video === 'string' && (video.trim().startsWith('{') || video.trim().startsWith('['))) {
          try {
            processedVideo = JSON.parse(video);
          } catch (parseError) {
            // If parsing fails, use original value
            console.log('Warning: Failed to parse video data as JSON, using as is');
            processedVideo = video;
          }
        }
        
        // Now handle the video data
        if (processedVideo && processedVideo.data) {
          const buffer = Buffer.from(processedVideo.data, 'base64');
          const fileKey = `stream-videos/${uuidv4()}.mp4`;
          const params = {
            Bucket: 'auqli-uploads',
            Key: fileKey,
            Body: buffer,
            ContentType: processedVideo.contentType || 'video/mp4',
          };
          
          const uploadResult = await s3.upload(params).promise();
          videoData = {
            url: uploadResult.Location,
            key: fileKey
          };
        }
      } catch (videoError) {
        console.error('Video upload error:', videoError);
        return res.status(500).json({
          message: 'Failed to upload video',
          error: videoError.message
        });
      }
    }

    // Generate unique channel name
    const channelName = `openshow_${uuidv4()}`;

    // Generate Agora token
    const token = agoraService.generateToken(channelName, req.user.agoraUid);

    // Get all seller's active products with full details
    const sellerProducts = await Product.find({
      seller: req.user.id,
      status: 'active',
      visibility: 'visible'
    }).select('_id name description category images price sku stock');

    if (sellerProducts.length === 0) {
      return res.status(400).json({
        message: 'No active products found for this seller'
      });
    }

    const stream = new Stream({
      seller: req.user.id,
      title,
      description,
      coverImage: imageData,
      video: videoData,
      category,
      tags: parsedTags,
      products: sellerProducts.map(p => ({
        product: {
          productId: p._id,
          name: p.name,
          category: p.category,
          images: p.images,
          sku: p.sku,
          quantity: p.stock || 0,
          price: p.price
        }
        // For open shows, we don't include minBid and maxBid
      })),
      channelName,
      agoraToken: token,
      scheduledStartTime: startDate,
      type: 'open_show',
      status: 'scheduled'
    });

    await stream.save();

    const populatedStream = await Stream.findById(stream._id)
      .populate('seller', 'storeName businessName storeAvatar rating')
      .populate('products.product', 'name description images price');


    res.status(201).json({
      message: 'Open live show created successfully',
      stream: populatedStream
    });
  } catch (error) {
    console.error('Create open live show error:', error);
    res.status(500).json({
      message: 'Failed to create open live show',
      error: error.message || 'Internal server error'
    });
  }
};

exports.getStreamsByStatus = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status && ['scheduled', 'live', 'ended'].includes(status)) {
      query.status = status;
    }

    if (type && ['auction', 'open_show'].includes(type)) {
      query.type = type;
    }

    const streams = await Stream.find(query)
      .populate('seller', 'storeName businessName storeAvatar rating')
      .populate('products.product', 'name description images price')
      .select('seller title description coverImage category tags products status channelName scheduledStartTime actualStartTime endTime viewers type bids createdAt updatedAt')
      .sort({ scheduledStartTime: -1, createdAt: -1 })
      .skip((page - 1) * limit)

      .limit(parseInt(limit));

    const total = await Stream.countDocuments(query);

    res.json({
      streams,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch streams',
      error: error.message
    });
  }
};

exports.getSellerStreamsByStatus = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status, type, page = 1, limit = 10 } = req.query;

    const query = { seller: sellerId };

    if (status && ['scheduled', 'live', 'ended'].includes(status)) {
      query.status = status;
    }

    if (type && ['auction', 'open_show'].includes(type)) {
      query.type = type;
    }

    const streams = await Stream.find(query)
      .populate('seller', 'storeName businessName storeAvatar rating')
      .populate('products.product', 'name description images price')
      .select('seller title description coverImage category tags products status channelName scheduledStartTime actualStartTime endTime viewers type bids createdAt updatedAt')
      .sort({ scheduledStartTime: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));


    const total = await Stream.countDocuments(query);

    res.json({
      streams,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch seller streams',
      error: error.message
    });
  }
};

exports.getStreamWithRefreshedToken = async (req, res) => {
  try {
    const stream = await Stream.findOne({
      _id: req.params.streamId,
      status: 'live'
    })
    .populate('seller', 'storeName businessName storeAvatar rating')
    .populate('products.product', 'name description images price stock sku variants')
    .populate('products.currentBidder', 'firstName lastName username email')
    .populate('viewers', 'firstName lastName username avatarUrl')
    .populate('bids.buyer', 'firstName lastName username')
    .populate('bids.product', 'name price')
    .lean(); // Convert to plain JavaScript object

    if (!stream) {
      return res.status(404).json({ message: 'Active stream not found' });
    }

    // Remove sensitive fields
    const { __v, ...streamData } = stream;
    
    // Generate new token
    const token = agoraService.generateToken(
      stream.channelName,
      req.user.agoraUid,
      RtcRole.SUBSCRIBER
    );

    res.json({
      message: 'Stream details with refreshed token',
      channelName: stream.channelName,
      token,
      tokenExpiration: Date.now() + 3600 * 1000,
      stream: {
        ...streamData,
        viewerCount: stream.viewers.length,
        isLive: stream.status === 'live',
        products: stream.products.map(product => ({
          ...product,
          currentBid: product.currentBid,
          minBid: product.minBid,
          maxBid: product.maxBid
        }))
      }
    });

  } catch (error) {
    console.error('Refresh stream token error:', error);
    res.status(500).json({
      message: 'Failed to refresh stream token',
      error: error.message
    });
  }
};

exports.getPopularStreams = async (req, res) => {
  console.log(`[DEBUG] getPopularStreams called`);
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status && ['scheduled', 'live', 'ended'].includes(status)) {
      query.status = status;
    }

    if (type && ['auction', 'open_show'].includes(type)) {
      query.type = type;
    }

    // Find streams and sort by viewer count (descending)
    const streams = await Stream.find(query)
      .populate('seller', 'storeName businessName storeAvatar rating')
      .populate('products.product', 'name description images price')
      .select('seller title description coverImage category tags products status channelName scheduledStartTime actualStartTime endTime viewers type bids createdAt updatedAt')
      // Sort by number of viewers (descending)
      .sort({ 'viewers.length': -1, actualStartTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Add viewerCount to each stream
    const streamsWithViewerCount = streams.map(stream => {
      const streamObj = stream.toObject();
      streamObj.viewerCount = stream.viewers ? stream.viewers.length : 0;
      return streamObj;
    });

    const total = await Stream.countDocuments(query);

    res.json({
      streams: streamsWithViewerCount,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error(`[DEBUG] Error in getPopularStreams:`, error);
    res.status(500).json({
      message: 'Failed to fetch popular streams',
      error: error.message
    });
  }
};

exports.getSpotlightStreams = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    // First, get all featured sellers
    const featuredSellers = await Seller.find({ isFeatured: true }).select('_id');
    const featuredSellerIds = featuredSellers.map(seller => seller._id);
    
    if (featuredSellerIds.length === 0) {
      return res.json({
        streams: [],
        pagination: {
          total: 0,
          pages: 0,
          currentPage: parseInt(page),
          hasMore: false
        }
      });
    }

    // Build query for streams from featured sellers
    const query = {
      seller: { $in: featuredSellerIds }
    };

    if (status && ['scheduled', 'live', 'ended'].includes(status)) {
      query.status = status;
    }

    if (type && ['auction', 'open_show'].includes(type)) {
      query.type = type;
    }

    // Find streams from featured sellers
    const streams = await Stream.find(query)
      .populate('seller', 'storeName businessName storeAvatar rating isFeatured')
      .populate('products.product', 'name description images price')
      .select('seller title description coverImage category tags products status channelName scheduledStartTime actualStartTime endTime viewers type bids createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Add viewerCount to each stream
    const streamsWithViewerCount = streams.map(stream => {
      const streamObj = stream.toObject();
      streamObj.viewerCount = stream.viewers ? stream.viewers.length : 0;
      return streamObj;
    });

    const total = await Stream.countDocuments(query);

    res.json({
      streams: streamsWithViewerCount,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('Get spotlight streams error:', error);
    res.status(500).json({
      message: 'Failed to fetch spotlight streams',
      error: error.message
    });
  }
};

exports.getStreamsFromFavoriteSellers = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    // Get the current buyer
    const buyer = await Buyer.findById(req.user.id).select('followers');
    
    if (!buyer || !buyer.followers || buyer.followers.length === 0) {
      return res.json({
        streams: [],
        pagination: {
          total: 0,
          pages: 0,
          currentPage: parseInt(page),
          hasMore: false
        }
      });
    }

    // Extract seller IDs from the buyer's followers
    const followedSellerIds = buyer.followers.map(follower => follower.sellerId);
    
    // Build query for streams from followed sellers
    const query = {
      seller: { $in: followedSellerIds }
    };

    if (status && ['scheduled', 'live', 'ended'].includes(status)) {
      query.status = status;
    }

    if (type && ['auction', 'open_show'].includes(type)) {
      query.type = type;
    }

    // Find streams from followed sellers
    const streams = await Stream.find(query)
      .populate('seller', 'storeName businessName storeAvatar rating')
      .populate('products.product', 'name description images price')
      .select('seller title description coverImage category tags products status channelName scheduledStartTime actualStartTime endTime viewers type bids createdAt updatedAt')
      .sort({ scheduledStartTime: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Add viewerCount to each stream
    const streamsWithViewerCount = streams.map(stream => {
      const streamObj = stream.toObject();
      streamObj.viewerCount = stream.viewers ? stream.viewers.length : 0;
      return streamObj;
    });

    const total = await Stream.countDocuments(query);

    res.json({
      streams: streamsWithViewerCount,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('Get streams from favorite sellers error:', error);
    res.status(500).json({
      message: 'Failed to fetch streams from favorite sellers',
      error: error.message
    });
  }
};

exports.getStreamsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { status, type, page = 1, limit = 10, sortByViews } = req.query;
    
    // Build query with case-insensitive category matching
    const query = { 
      category: { $regex: new RegExp(`^${category}$`, 'i') }  // '^' and '$' ensure exact match, 'i' flag makes it case-insensitive
    };

    if (status && ['scheduled', 'live', 'ended'].includes(status)) {
      query.status = status;
    }

    if (type && ['auction', 'open_show'].includes(type)) {
      query.type = type;
    }

    // Build aggregation pipeline
    const aggregationPipeline = [
      { $match: query },
      {
        $addFields: {
          viewerCount: { $size: "$viewers" }
        }
      }
    ];

    // Add sort stage based on sortByViews parameter
    if (sortByViews) {
      aggregationPipeline.push({
        $sort: {
          viewerCount: sortByViews === 'asc' ? 1 : -1,
          scheduledStartTime: -1,
          createdAt: -1
        }
      });
    } else {
      aggregationPipeline.push({
        $sort: {
          scheduledStartTime: -1,
          createdAt: -1
        }
      });
    }

    // Add pagination
    aggregationPipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    );

    // Execute aggregation and populate references
    const streams = await Stream.aggregate(aggregationPipeline)
      .exec()
      .then(async streams => {
        // Populate the references after aggregation
        return await Stream.populate(streams, [
          { path: 'seller', select: 'storeName businessName storeAvatar rating' },
          { path: 'products.product', select: 'name description images price' }
        ]);
      });

    // Get total count for pagination
    const total = await Stream.countDocuments(query);

    res.json({
      streams: streams.map(stream => ({
        ...stream,
        viewerCount: stream.viewers ? stream.viewers.length : 0
      })),
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('Get streams by category error:', error);
    res.status(500).json({
      message: 'Failed to fetch streams by category',
      error: error.message
    });
  }
};

exports.getChatInteractions = async (req, res) => {
  try {
    const { streamId } = req.params;
    
    // Find the stream with the given ID
    const stream = await Stream.findById(streamId);
    
    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }
    
    // Sort chat interactions by timestamp (newest first)
    const chatInteractions = stream.chatInteractions || [];
    
    // Optional: limit the number of chat interactions returned
    // const limit = parseInt(req.query.limit) || 100;
    // chatInteractions = chatInteractions.slice(-limit);

    res.json({
      success: true,
      chatInteractions
    });
  } catch (error) {
    console.error('Error getting chat interactions:', error);
    res.status(500).json({
      message: 'Failed to get chat interactions',
      error: error.message
    });
  }
};

exports.leaveStream = async (req, res) => {
  try {
    let stream = await Stream.findOne({
      _id: req.params.streamId,
      status: 'live'
    });

    if (!stream) {
      return res.status(404).json({ message: 'Active stream not found' });
    }

    // Fetch buyer details
    const buyer = await Buyer.findById(req.user.id).select('firstName lastName username avatarUrl profileImage');
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // First add to departedViewers array for analytics purposes
    await Stream.findByIdAndUpdate(
      stream._id,
      { 
        $push: { 
          departedViewers: {
            buyer: req.user.id,
            timestamp: new Date()
          }
        }
      }
    );
    
    // Then remove the user from the viewers array
    await Stream.findByIdAndUpdate(
      stream._id,
      { 
        $pull: { viewers: req.user.id }
      }
    );

    // Get fresh stream data after both updates
    stream = await Stream.findById(stream._id)
      .populate('seller', 'storeName businessName')
      .populate('viewers')
      .populate('departedViewers.buyer')
      .lean();

    // Calculate accurate active viewer count
    const activeViewerCount = stream.viewers.length;
    const totalJoined = activeViewerCount + stream.departedViewers.length;
    const totalLeft = stream.departedViewers.length;

    // Create notification object with accurate viewer count
    const notificationObj = {
      id: Date.now().toString(),
      type: 'leave',
      user: buyer.username || buyer.firstName || 'Viewer',
      avatar: buyer.profileImage?.url || buyer.avatarUrl || '',
      content: `viewer left room`,
      data: {
        message: `${buyer.username || buyer.firstName} left room`,
        buyerId: req.user.id.toString(),
        buyerName: buyer.firstName + " " + buyer.lastName,
        buyerUsername: buyer.username,
        buyerAvatar: buyer.profileImage?.url || buyer.avatarUrl || '',
        streamId: stream._id.toString(),
        sellerName: stream.seller?.storeName || stream.seller?.businessName,
        sellerId: stream.seller?._id.toString(),
        viewerCount: activeViewerCount, // Current active viewers
        totalJoined: totalJoined, // Total viewers including those who left
        totalLeft: totalLeft // Total viewers who left
      }
    };

    try {
      // Update the notificationData in the departedViewers entry and add to chat interactions
      await Stream.findByIdAndUpdate(
        stream._id,
        { 
          $push: { chatInteractions: notificationObj },
          $set: { 
            "departedViewers.$[elem].notificationData": notificationObj 
          }
        },
        {
          arrayFilters: [{ "elem.buyer": req.user.id }]
        }
      );
      
      // Broadcast to all subscribers of stream notifications
      if (req.app && req.app.get('io')) {
        const io = req.app.get('io');
        // Add timestamp for the WebSocket payload
        notificationObj.timestamp = new Date();
        io.to('stream_notifications').emit('viewer_left_stream', notificationObj);
      }

      // Send notification to stream channel
      req.io?.to(stream.channelName).emit('viewerLeft', {
        streamId: stream._id,
        viewer: req.user.id,
        viewerName: buyer.firstName + " " + buyer.lastName,
        viewerCount: activeViewerCount, // Include accurate count in socket event
        totalJoined: totalJoined,
        totalLeft: totalLeft
      });
    } catch (error) {
      console.error('Failed to save chat interaction or send notification:', error);
      // Continue even if saving the chat interaction fails
    }

    res.json({
      message: 'Successfully left stream',
      streamId: stream._id,
      viewerCount: activeViewerCount,
      analytics: {
        totalJoined: totalJoined,
        totalLeft: totalLeft,
        retentionRate: totalJoined > 0 
          ? Math.round(((totalJoined - totalLeft) / totalJoined) * 100)
          : 0
      }
    });

  } catch (error) {
    console.error('Leave stream error:', error);
    res.status(500).json({
      message: 'Failed to leave stream',
      error: error.message
    });
  }
};

exports.leaveStreamSeller = async (req, res) => {
  try {
    const stream = await Stream.findOne({
      _id: req.params.streamId,
      seller: req.user.id,
      status: 'live'
    }).populate('seller', 'storeName businessName storeAvatar');

    if (!stream) {
      return res.status(404).json({ message: 'Active stream not found or you do not have permission' });
    }

    // Create notification object
    const notificationObj = {
      id: Date.now().toString(),
      type: 'leave',
      user: stream.seller.storeName || 'Host',
      avatar: stream.seller.storeAvatar?.url || '',
      content: 'Host left room',
      data: {
        message: 'Host left room',
        sellerId: req.user.id.toString(),
        streamId: stream._id.toString(),
        sellerName: stream.seller.storeName || stream.seller.businessName
      }
    };

    try {
      // Add the notification to the stream's chat interactions
      await Stream.findByIdAndUpdate(
        stream._id,
        { $push: { chatInteractions: notificationObj } }
      );
      
      // Broadcast a notification that the seller has left their stream
      if (req.app && req.app.get('io')) {
        const io = req.app.get('io');
        // Add timestamp for the WebSocket payload
        notificationObj.timestamp = new Date();
        io.to('stream_notifications').emit('seller_left_stream', notificationObj);
      }

      // Send notification to stream channel
      req.io?.to(stream.channelName).emit('sellerLeft', {
        streamId: stream._id,
        sellerId: req.user.id,
        sellerName: stream.seller.storeName || stream.seller.businessName
      });
    } catch (error) {
      console.error('Failed to save chat interaction or send notification:', error);
      // Continue even if saving the chat interaction fails
    }

    res.json({
      message: 'Successfully left stream as seller',
      streamId: stream._id
    });

  } catch (error) {
    console.error('Leave stream as seller error:', error);
    res.status(500).json({
      message: 'Failed to leave stream as seller',
      error: error.message
    });
  }
};

exports.activateProductBidding = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { productId } = req.body;

    // Validate required fields
    if (!streamId || !productId) {
      return res.status(400).json({
        message: 'Stream ID and Product ID are required'
      });
    }

    // Find the stream and check if it's an auction
    const stream = await Stream.findById(streamId)
      .populate('seller', 'storeName storeAvatar')
      .populate('products.currentBidder', 'firstName lastName username');

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Check if stream type is auction
    if (stream.type !== 'auction') {
      return res.status(400).json({ message: 'Stream type must be auction to activate product bidding' });
    }

    // Check if stream is live
    if (stream.status !== 'live') {
      return res.status(400).json({ message: 'Stream must be live to activate product bidding' });
    }

    // Find the product in the stream's products array
    const productIndex = stream.products.findIndex(p => 
      p.product && p.product.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in stream' });
    }

    // Update product's bidStatus to active
    stream.products[productIndex].bidStatus = 'active';
    
    // Set other products to 'ended' if any are 'active'
    stream.products.forEach((product, index) => {
      if (index !== productIndex && product.bidStatus === 'active') {
        product.bidStatus = 'ended';
      }
    });

    await stream.save();

    // Create notification object for WebSocket
    const notificationObj = {
      id: Date.now().toString(),
      type: 'auction_start',
      user: stream.seller.storeName || 'Host',
      avatar: stream.seller.storeAvatar?.url || '',
      content: `Bidding started for ${stream.products[productIndex].product.name || 'a product'}`,
      data: {
        message: `Bidding started for ${stream.products[productIndex].product.name || 'a product'}`,
        streamId: stream._id.toString(),
        sellerId: stream.seller._id.toString(),
        storeName: stream.seller.storeName || 'Unknown Store',
        product: stream.products[productIndex]
      }
      // timestamp will be added automatically by the schema default
    };

    // Send WebSocket notification
    req.app.get('io').to('stream_notifications').emit('stream_notification', notificationObj);

    // Add the notification to stream chat interactions
    stream.chatInteractions.push(notificationObj);
    await stream.save();

    // Return the updated product information
    return res.status(200).json({
      message: 'Product bidding activated successfully',
      product: stream.products[productIndex]
    });
  } catch (error) {
    console.error('Error activating product bidding:', error);
    return res.status(500).json({
      message: 'Failed to activate product bidding',
      error: error.message
    });
  }
};

exports.endProductBidding = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { productId } = req.body;

    // Validate required fields
    if (!streamId || !productId) {
      return res.status(400).json({
        message: 'Stream ID and Product ID are required'
      });
    }

    // Find the stream
    const stream = await Stream.findById(streamId)
      .populate('seller', 'storeName storeAvatar')
      .populate('products.currentBidder', 'firstName lastName username');

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Check if stream type is auction
    if (stream.type !== 'auction') {
      return res.status(400).json({ message: 'Stream type must be auction to end product bidding' });
    }

    // Find the product in the stream's products array
    const productIndex = stream.products.findIndex(p => 
      p.product._id && p.product._id.toString() === productId ||
      p.product && p.product.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in stream' });
    }

    // Check if bidStatus is active
    if (stream.products[productIndex].bidStatus !== 'active') {
      return res.status(400).json({ message: 'Product bidding is not active' });
    }

    // Update product's bidStatus to ended
    stream.products[productIndex].bidStatus = 'ended';
    
    // Set winner if there is a current bidder
    if (stream.products[productIndex].currentBidder) {
      stream.products[productIndex].bidWinner = {
        buyer: stream.products[productIndex].currentBidder,
        bidAmount: stream.products[productIndex].currentBid,
        winningTime: new Date()
      };
    }

    await stream.save();

    // Create notification object for WebSocket
    const notificationObj = {
      id: Date.now().toString(),
      type: 'auction_end',
      user: stream.seller.storeName || 'Host',
      avatar: stream.seller.storeAvatar?.url || '',
      content: `Bidding ended for ${stream.products[productIndex].product.name || 'a product'}`,
      data: {
        message: `Bidding ended for ${stream.products[productIndex].product.name || 'a product'}`,
        streamId: stream._id.toString(),
        sellerId: stream.seller._id.toString(),
        storeName: stream.seller.storeName || 'Unknown Store',
        product: stream.products[productIndex]
      }
      // timestamp will be added automatically by the schema default
    };

    // Send WebSocket notification
    req.app.get('io').to('stream_notifications').emit('stream_notification', notificationObj);

    // Add the notification to stream chat interactions
    stream.chatInteractions.push(notificationObj);
    await stream.save();

    // Return the updated product information
    return res.status(200).json({
      message: 'Product bidding ended successfully',
      product: stream.products[productIndex]
    });
  } catch (error) {
    console.error('Error ending product bidding:', error);
    return res.status(500).json({
      message: 'Failed to end product bidding',
      error: error.message
    });
  }
};

exports.getStreamsForYou = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    // Get the current buyer with selected categories
    const buyer = await Buyer.findById(req.user.id).select('selectedCategories');
    
    if (!buyer || !buyer.selectedCategories || buyer.selectedCategories.length === 0) {
      return res.json({
        streams: [],
        pagination: {
          total: 0,
          pages: 0,
          currentPage: parseInt(page),
          hasMore: false
        }
      });
    }

    // Extract category names from the buyer's selected categories
    const categories = buyer.selectedCategories.map(category => category.name);
    
    // Build query for streams matching buyer's categories
    const query = {
      category: { $in: categories }
    };

    if (status && ['scheduled', 'live', 'ended'].includes(status)) {
      query.status = status;
    }

    if (type && ['auction', 'open_show'].includes(type)) {
      query.type = type;
    }

    // Find streams matching buyer's categories
    const streams = await Stream.find(query)
      .populate('seller', 'storeName businessName storeAvatar rating')
      .populate('products.product', 'name description images price')
      .select('seller title description coverImage category tags products status channelName scheduledStartTime actualStartTime endTime viewers type bids createdAt updatedAt')
      .sort({ scheduledStartTime: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Add viewerCount to each stream
    const streamsWithViewerCount = streams.map(stream => {
      const streamObj = stream.toObject();
      streamObj.viewerCount = stream.viewers ? stream.viewers.length : 0;
      return streamObj;
    });

    const total = await Stream.countDocuments(query);

    res.json({
      streams: streamsWithViewerCount,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('Get for you streams error:', error);
    res.status(500).json({
      message: 'Failed to fetch personalized streams',
      error: error.message
    });
  }
};

exports.searchStreams = async (req, res) => {
  try {
    const { query, category, status, type, page = 1, limit = 10 } = req.query;
    
    // Build search criteria
    const searchQuery = {};
    const aggregationPipeline = [];
    
    // Start with matching any existing filters
    if (category) {
      searchQuery.category = category;
    }
    
    if (status && ['scheduled', 'live', 'ended', 'expired'].includes(status)) {
      searchQuery.status = status;
    }
    
    if (type && ['auction', 'open_show'].includes(type)) {
      searchQuery.type = type;
    }
    
    // If we have filters, add them to the pipeline
    if (Object.keys(searchQuery).length > 0) {
      aggregationPipeline.push({ $match: searchQuery });
    }
    
    // Text search criteria for title, description
    if (query) {
      // First populate products to perform search on product data
      aggregationPipeline.push(
        { 
          $lookup: {
            from: 'products',
            localField: 'products.product',
            foreignField: '_id',
            as: 'populatedProducts'
          }
        },
        {
          $match: {
            $or: [
              { title: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { 'populatedProducts.name': { $regex: query, $options: 'i' } }
            ]
          }
        }
      );
    }
    
    // Add sorting 
    aggregationPipeline.push(
      { $sort: { scheduledStartTime: -1, createdAt: -1 } }
    );
    
    // Add count metadata for pagination
    aggregationPipeline.push(
      {
        $facet: {
          metadata: [{ $count: "total" }],
          streams: [
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) }
          ]
        }
      }
    );
    
    // Execute the aggregation pipeline
    const result = await Stream.aggregate(aggregationPipeline);
    
    // Extract metadata and streams
    const metadata = result[0].metadata[0] || { total: 0 };
    let streams = result[0].streams || [];
    
    // Now populate the seller and product details fully
    if (streams.length > 0) {
      streams = await Stream.populate(streams, [
        { path: 'seller', select: 'storeName businessName storeAvatar rating' },
        { path: 'products.product', select: 'name description images price' }
      ]);
    }
    
    // Add viewerCount to each stream
    const streamsWithViewerCount = streams.map(stream => {
      // Convert to plain object if not already
      const streamObj = typeof stream.toObject === 'function' ? stream.toObject() : stream;
      streamObj.viewerCount = stream.viewers ? stream.viewers.length : 0;
      streamObj.isLive = stream.status === 'live';
      return streamObj;
    });
    
    // Format response with pagination info
    res.json({
      streams: streamsWithViewerCount,
      pagination: {
        total: metadata.total,
        pages: Math.ceil(metadata.total / limit),
        currentPage: parseInt(page),
        hasMore: page * limit < metadata.total
      }
    });
  } catch (error) {
    console.error('Search streams error:', error);
    res.status(500).json({
      message: 'Failed to search streams',
      error: error.message
    });
  }
}; 