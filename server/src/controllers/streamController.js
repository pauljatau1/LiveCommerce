const Stream = require('../models/Stream');
const agoraService = require('../services/agoraService');
const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
const Product = require('../models/Product');
const { s3 } = require('../config/awsConfig');
const jwtDecode = require('jwt-decode');
const Seller = require('../models/Seller');
const { RtcRole } = require('agora-access-token');
const Buyer = require('../modules/buyer/models/buyer.model');
const { saveToken, getToken } = require('../../Firebase');
const { Expo } = require('expo-server-sdk');
const mongoose = require('mongoose');
const orderController = require('./orderController');
const mixpanel = require('../config/mixpanel');
const { generateStreamLink } = require('../utils/helpers');

const expo = new Expo();


exports.createStream = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subCategory,
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
          Bucket: process.env.CDN_S3_BUCKET,
          Key: fileKey,
          Body: buffer,
          ContentType: coverImage.contentType || 'image/jpeg'
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        imageData = {
          url: 'https://' + process.env.CDN_URL + "/" + fileKey,
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
            Bucket: process.env.CDN_S3_BUCKET,
            Key: fileKey,
            Body: buffer,
            ContentType: processedVideo.contentType || 'video/mp4',
          };

          const uploadResult = await s3.upload(params).promise();
          videoData = {
            url: 'https://' + process.env.CDN_URL + "/" + fileKey,
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
      subCategory,
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

    stream.streamLink = generateStreamLink(stream._id,stream.type)

    await stream.save();

    const populatedStream = await Stream.findById(stream._id)
      .populate('seller', 'storeName businessName storeAvatar rating')
      .populate('products.product', 'name description images price');

    // Initialize stream-specific notification room if socket.io is available
    if (req.app && req.app.get('io')) {
      const io = req.app.get('io');
      const streamRoom = `stream_notifications_${stream._id.toString()}`;
      console.log(`Initialized stream notification room: ${streamRoom}`);

      // Create initialization notification for room to ensure it exists in Socket.IO's room registry
      const initNotification = {
        id: Date.now().toString(),
        type: 'room_init',
        content: 'Stream notification room initialized',
        data: {
          streamId: stream._id.toString(),
          streamType: stream.type,
          status: 'scheduled'
        },
        timestamp: new Date()
      };

      io.to(streamRoom).emit('stream_room_initialized', initNotification);
    }

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
    
    // Check if the stream has already ended
    if (stream.status === 'ended') {
      return res.status(400).json({ 
        message: 'This stream has already ended',
        error: 'Cannot restart an ended stream'
      });
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

    // Send WebSocket notification if IO is available
    if (req.app && req.app.get('io')) {
      const io = req.app.get('io');
      // Add timestamp for the WebSocket payload
      notificationObj.timestamp = new Date();

      // Define the stream-specific room name
      const streamRoom = `stream_notifications_${stream._id.toString()}`;

      io.to(streamRoom).emit('stream_notification', notificationObj);
    }


    try {
      // Create a new chat interaction document
      await Stream.findByIdAndUpdate(
        stream._id,
        { $push: { chatInteractions: notificationObj } }
      );

      // Send push notifications to all followers
      if (seller.followers && seller.followers.length > 0) {
        // Track which followers have been notified about this stream
        // to prevent duplicate notifications
        const followerNotifications = [];
        
        // Keep track of followers who have already been notified via subscription
        const alreadyNotifiedBuyerIds = stream.subscribers ? 
          stream.subscribers
            .filter(sub => sub.notified)
            .map(sub => sub.buyer.toString()) : 
          [];
        
        for (const follower of seller.followers) {
          // Skip if this follower has already been notified as a subscriber
          if (alreadyNotifiedBuyerIds.includes(follower.buyerId.toString())) {
            continue;
          }
          
          // Get the user's push token
          const userToken = await getToken(follower.buyerId);
          if (userToken) {
            followerNotifications.push({
              to: userToken.token,
              title: `${seller.storeName} Started a Live ${stream.type === 'auction' ? 'Auction' : 'Show'}`,
              body: `${seller.storeName} has started a live ${stream.type === 'auction' ? 'auction' : 'show'}. Join now!`,
              data: {
                streamId: stream._id.toString(),
                streamType: stream.type,
                sellerId: seller._id.toString(),
                action: 'open_stream'
              }
            });
          }
        }
        
        // Send notifications to followers
        if (followerNotifications.length > 0) {
          await expo.sendPushNotificationsAsync(followerNotifications);
          console.log(`Sent push notifications to ${followerNotifications.length} followers`);
        }
      }

      // After updating the stream to 'live' status
      // Add this code to notify subscribers
      if (stream.subscribers && stream.subscribers.length > 0) {
        const notificationController = require('./notificationController');
        const Buyer = mongoose.model('Buyer');

        // Get seller details for the notification
        const seller = await Seller.findById(stream.seller);
        const storeName = seller.storeName || seller.businessName || 'Seller';

        // Prepare notification data
        const notificationData = {
          streamId: stream._id.toString(),
          streamTitle: stream.title,
          storeName: storeName,
          streamType: stream.type,
          scheduledStartTime: stream.scheduledStartTime,
          actualStartTime: stream.actualStartTime
        };

        // Process each subscriber
        for (const subscriber of stream.subscribers) {
          if (!subscriber.notified) {
            try {
              // Get the buyer details
              const buyer = await Buyer.findById(subscriber.buyer);

              if (buyer) {
                // Create in-app notification for the buyer
                await notificationController.createBuyerNotification(
                  buyer._id,
                  'stream_start',
                  notificationData
                );

                // Send email notification
                // Create a custom notification object for the email
                const emailNotification = {
                  type: 'stream_start',
                  title: `${storeName} has started a live ${stream.type === 'auction' ? 'auction' : 'show'}`,
                  message: `${storeName} has started a live ${stream.type === 'auction' ? 'auction' : 'show'}: "${stream.title}". Join now!`,
                  data: notificationData
                };

                await notificationController.sendEmailToBuyer(buyer, emailNotification);

                // Mark the subscriber as notified
                await Stream.updateOne(
                  {
                    _id: stream._id,
                    "subscribers.buyer": subscriber.buyer
                  },
                  {
                    $set: { "subscribers.$.notified": true }
                  }
                );
              }
            } catch (notificationError) {
              console.error(`Error notifying subscriber ${subscriber.buyer}:`, notificationError);
              // Continue with other subscribers even if one fails
            }
          }
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
    console.log(`[RESTBID] 1. Received bid request via REST API:`, {
      streamId: req.body.streamId,
      productId: req.body.productId,
      bidAmount: req.body.bidAmount,
      userId: req.user.id
    });

    const { streamId, productId, bidAmount } = req.body;
    const buyerId = req.user.id;

    if (!streamId || !productId || !bidAmount) {
      console.error('[RESTBID] 2. FAILED: Missing required bid data');
      return res.status(400).json({ message: 'Stream ID, Product ID, and Bid Amount are required' });
    }

    console.log(`[RESTBID] 3. Processing bid with validated data`, {
      streamId,
      productId,
      bidAmount,
      buyerId
    });

    // Verify user is a buyer
    if (req.user.role !== 'Buyer') {
      console.log('[RESTBID] 4. FAILED: User is not a buyer', {
        userId: req.user.id,
        userRole: req.user.role
      });
      return res.status(403).json({ message: 'Only buyers can place bids' });
    }

    console.log('[RESTBID] 5. User role validated as Buyer');

    // Get buyer details including shipping address
    console.log('[RESTBID] 6. Retrieving buyer details for ID:', buyerId);
    const Buyer = mongoose.model('Buyer');
    const buyer = await Buyer.findById(buyerId).select('firstName lastName username profileImage wallet shippingAddresses');

    if (!buyer) {
      console.error('[RESTBID] 7. FAILED: Buyer not found in database');
      return res.status(404).json({ message: 'Buyer not found' });
    }

    console.log('[RESTBID] 8. Buyer details retrieved successfully', {
      buyerId: buyer._id,
      name: `${buyer.firstName} ${buyer.lastName}`,
      hasShippingAddresses: buyer.shippingAddresses && buyer.shippingAddresses.length > 0,
      walletBalance: buyer.wallet?.balance
    });

    // Check if buyer has shipping address
    if (!buyer.shippingAddresses || buyer.shippingAddresses.length === 0) {
      console.error('[RESTBID] 9. FAILED: Buyer has no shipping addresses');
      return res.status(400).json({ message: 'Please add a shipping address to your profile before bidding' });
    }

    // Find the stream and populate the seller information for shipping cost calculation
    console.log('[RESTBID] 10. Retrieving stream data for ID:', streamId);
    const stream = await Stream.findById(streamId).populate('seller', 'storeName storeAvatar warehouseDetails businessAddress');

    if (!stream) {
      console.error('[RESTBID] 11. FAILED: Stream not found');
      return res.status(404).json({ message: 'Stream not found' });
    }

    console.log('[RESTBID] 12. Stream data retrieved successfully', {
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

    console.log('[RESTBID] 13. Calculated available wallet balance', {
      totalBalance: buyer.wallet.balance,
      onHoldAmount: buyer.wallet.onHoldAmount || 0,
      availableBalance,
      walletToUse
    });

    // Get seller details for delivery cost calculation
    const sellerInfo = stream.seller;
    console.log('[RESTBID] 14. Retrieved seller info for shipping calculation', {
      sellerId: sellerInfo._id,
      sellerName: sellerInfo.storeName
    });

    // Find the product in the stream's products array
    console.log('[RESTBID] 15. Looking for product in stream products array with ID:', productId);
    const productIndex = stream.products.findIndex(p =>
      p.product && p.product.productId && p.product.productId.toString() === productId
    );

    if (productIndex === -1) {
      console.error('[RESTBID] 16. FAILED: Product not found in stream products');
      return res.status(404).json({ message: 'Product not found in stream' });
    }

    const product = stream.products[productIndex];
    const productDetails = product.product;

    console.log('[RESTBID] 17. Found product in stream', {
      productIndex,
      productName: productDetails.name,
      currentBid: product.currentBid,
      minBid: product.minBid,
      maxBid: product.maxBid,
      bidStatus: product.bidStatus
    });

    // Fetch the full product details to get the weight
    console.log('[RESTBID] 18. Fetching full product details from database');
    const Product = mongoose.model('Product');
    const fullProductDetails = await Product.findById(productDetails.productId);

    if (!fullProductDetails) {
      console.warn('[RESTBID] 19. WARNING: Could not retrieve full product details, using default weight');
    } else {
      console.log('[RESTBID] 20. Full product details retrieved', {
        productId: fullProductDetails._id,
        name: fullProductDetails.name,
        weight: fullProductDetails.weight || 1
      });
    }

    // Calculate shipping fee
    console.log('[RESTBID] 21. Preparing shipping fee calculation payload');
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

    console.log('[RESTBID] 22. Shipping details prepared', {
      buyerState: shippingDetails.state,
      pickupState: payload[0].pickUpState,
      weight: payload[0].weight
    });

    // Get delivery cost
    let shippingFee = 0;
    try {
      console.log('[RESTBID] 23. Calculating shipping fee with delivery service');
      // Use the orderController's getDeliveryCost logic directly
      const orderController = require('./orderController');
      const costResponse = await orderController.calculateDeliveryCostInternal(shippingDetails);
      shippingFee = costResponse.totalCost || 0;
      console.log('[RESTBID] 24. Shipping fee calculated', {
        shippingFee,
        response: costResponse
      });
    } catch (error) {
      console.error('[RESTBID] 25. Error calculating shipping fee:', error);
      // Default to 0 if calculation fails, but let bid continue
    }

    // Check if buyer has enough funds
    console.log('[RESTBID] 26. Checking if buyer has sufficient funds', {
      bidAmount,
      shippingFee,
      totalRequired: bidAmount + shippingFee,
      available: walletToUse
    });

    if (bidAmount + shippingFee > walletToUse) {
      console.error('[RESTBID] 27. FAILED: Insufficient funds in wallet');
      return res.status(400).json({
        message: 'Insufficient funds in your wallet. Please top up your wallet.',
        details: {
          bidAmount,
          shippingFee,
          totalRequired: bidAmount + shippingFee,
          available: walletToUse
        }
      });
    }

    // Check if stream type is auction
    if (stream.type !== 'auction') {
      console.error('[RESTBID] 28. FAILED: Stream type is not auction', { type: stream.type });
      return res.status(400).json({ message: 'Stream type must be auction to place a bid' });
    }

    // Check if stream is live
    if (stream.status !== 'live') {
      console.error('[RESTBID] 29. FAILED: Stream is not live', { status: stream.status });
      return res.status(400).json({ message: 'Stream must be live to place a bid' });
    }

    // Check if bidding is active for this product
    if (product.bidStatus !== 'active') {
      console.error('[RESTBID] 30. FAILED: Bidding not active for product', { bidStatus: product.bidStatus });
      return res.status(400).json({ message: 'Bidding is not currently active for this product' });
    }

    // Validate bid amount
    if (bidAmount < product.minBid) {
      console.error('[RESTBID] 31. FAILED: Bid amount below minimum', { bidAmount, minBid: product.minBid });
      return res.status(400).json({ message: `Bid amount must be at least ${product.minBid}` });
    }

    // Check if bid is higher than current bid
    if (product.currentBid > 0 && bidAmount <= product.currentBid) {
      console.error('[RESTBID] 32. FAILED: Bid not higher than current bid', { bidAmount, currentBid: product.currentBid });
      return res.status(400).json({ message: `Bid amount must be higher than current bid of ${product.currentBid}` });
    }

    console.log('[RESTBID] 33. All validation checks passed, preparing to place bid');

    // Add new bid to the bids array
    const newBid = {
      buyer: buyerId,
      product: productId,
      amount: bidAmount,
      timestamp: new Date()
    };

    stream.bids.push(newBid);
    console.log('[RESTBID] 34. Added new bid to stream bids array');

    // Update product's currentBid and currentBidder with full buyer details
    stream.products[productIndex].currentBid = bidAmount;
    stream.products[productIndex].currentBidder = {
      _id: buyer._id,
      firstName: buyer.firstName,
      lastName: buyer.lastName,
      username: buyer.username,
      profileImage: buyer.profileImage
    };
    console.log('[RESTBID] 35. Updated product current bid and bidder information');

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

    // Check if bidding should end (reached maxBid)
    console.log('[RESTBID] 36. Checking if bid amount reached max bid', { bidAmount, maxBid: product.maxBid });
    if (bidAmount >= product.maxBid) {
      console.log('[RESTBID] 37. Bid has reached or exceeded max bid, marking as winner');
      stream.products[productIndex].bidStatus = 'completed';
      stream.products[productIndex].bidWinner = {
        buyer: {
          _id: buyer._id,
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          username: buyer.username,
          profileImage: buyer.profileImage
        },
        bidAmount: bidAmount,
        winningTime: new Date()
      };

      // Create bid winner notification
      const winnerNotification = {
        id: Date.now().toString(),
        type: 'auction_winner',
        user: buyer.username || buyer.firstName || 'Buyer',
        avatar: buyer.profileImage?.url || '',
        content: `won the auction for ${formattedProductName} with a bid of ₦${bidAmount.toLocaleString()}`,
        data: {
          message: `won the auction for ${formattedProductName} with a bid of ₦${bidAmount.toLocaleString()}`,
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
      stream.chatInteractions.push(winnerNotification);
      console.log('[RESTBID] 38. Added winner notification to stream chat interactions');

      // Save the stream
      console.log('[RESTBID] 39. Saving stream with updated bid information');
      await stream.save();
      console.log('[RESTBID] 40. Stream saved successfully');

      console.log('[RESTBID] 41. Sending winning bid response to client');
      return res.status(200).json({
        success: true,
        message: 'Bid placed successfully and auction won',
        bid: newBid,
        product: stream.products[productIndex],
        isWinner: true
      });
    }

    // Create bid notification for regular bids
    console.log('[RESTBID] 42. Creating regular bid notification');
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
    stream.chatInteractions.push(bidNotification);
    console.log('[RESTBID] 43. Added bid notification to stream chat interactions');

    // Save the stream
    console.log('[RESTBID] 44. Saving stream with updated bid information');
    await stream.save();
    console.log('[RESTBID] 45. Stream saved successfully');

    console.log('[RESTBID] 46. Sending successful bid response to client');
    return res.status(200).json({
      success: true,
      message: 'Bid placed successfully',
      bid: newBid,
      product: stream.products[productIndex]
    });
  } catch (error) {
    console.error('[RESTBID] ERROR: Failed to place bid:', error);
    return res.status(500).json({ message: 'Failed to place bid: ' + error.message });
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
      .select('seller title description coverImage category tags products status channelName agoraToken scheduledStartTime actualStartTime endTime streamLink viewers type bids createdAt updatedAt');

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
    // First check if the stream exists (regardless of status)
    let stream = await Stream.findOne({
      _id: req.params.streamId
    });

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Now check the stream status
    if (stream.status === 'scheduled') {
      // Populate the stream with the same fields as in getStreamsByStatus
      const populatedStream = await Stream.findById(stream._id)
        .populate('seller', 'storeName businessName storeAvatar rating')
        .populate('products.product', 'name description images price')
        .lean();
      
      // Add subscribersCount to stream
      const streamWithSubscriberCount = {
        ...populatedStream,
        subscribersCount: populatedStream.subscribers ? populatedStream.subscribers.length : 0,
        viewerCount: populatedStream.viewers ? populatedStream.viewers.length : 0
      };
      
      return res.status(500).json({ 
        message: 'Stream has not started yet',
        stream: streamWithSubscriberCount
      });
    }

    if (stream.status === 'ended') {
      return res.status(500).json({ message: 'Stream has already ended' });
    }

    if (stream.status !== 'live') {
      return res.status(500).json({ message: `Cannot join stream with status: ${stream.status}` });
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
      .populate('seller', 'storeName businessName storeAvatar rating followers')
      .populate('products.product', 'name description images price stock sku variants')
      .populate('products.currentBidder', 'firstName lastName username email')
      .populate('viewers', 'firstName lastName username avatarUrl')
      .lean(); // Convert to plain JavaScript object

    // Get all viewers with detailed information
    const detailedViewers = await Buyer.find(
      { _id: { $in: stream.viewers } }
    ).select('_id firstName lastName username profileImage avatarUrl').lean();

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
        viewerCount: stream.viewers.length, // Now this will be correct
        viewers: detailedViewers
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

        // Create a stream-specific room name
        const streamRoom = `stream_notifications_${stream._id.toString()}`;

        // Emit to stream-specific room
        io.to(streamRoom).emit('viewer_joined_stream', notificationObj);
      }
    } catch (error) {
      console.error('Failed to save chat interaction:', error);
      // Continue even if saving the chat interaction fails
    }

    // Remove sensitive fields
    const { __v, ...streamData } = stream;
    
    // Get total product count before limiting
    const totalProductCount = stream.products.length;
    
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
        products: stream.products.slice(0, 70).map(product => ({
          ...product,
          currentBid: product.currentBid,
          minBid: product.minBid,
          maxBid: product.maxBid,
          currentBidder: product.currentBidder
        })),
        totalProductCount, // Add the total count so client knows if there are more
        viewers: detailedViewers,
        sellerFollowers: stream.seller.followers.length
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

    console.log('token generation requirements', stream.channelName, seller.agoraUid, RtcRole.PUBLISHER)

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

        // Create a stream-specific room name
        const streamRoom = `stream_notifications_${stream._id.toString()}`;

        // Emit to stream-specific room
        io.to(streamRoom).emit('seller_rejoined_stream', notificationObj);
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
        const expirationTime = new Date(stream.scheduledStartTime.getTime());
        if (now > expirationTime) {
          needsUpdate = true;
        }
      } else if (stream.status === 'live' && stream.actualStartTime && !stream.endTime) {
        const expirationTime = new Date(stream.actualStartTime.getTime());
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
      subCategory,
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
          Bucket: process.env.CDN_S3_BUCKET,
          Key: fileKey,
          Body: buffer,
          ContentType: coverImage.contentType || 'image/jpeg'
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        imageData = {
          url: 'https://' + process.env.CDN_URL + "/" + fileKey,
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
            Bucket: process.env.CDN_S3_BUCKET,
            Key: fileKey,
            Body: buffer,
            ContentType: processedVideo.contentType || 'video/mp4',
          };

          const uploadResult = await s3.upload(params).promise();
          videoData = {
            url: 'https://' + process.env.CDN_URL + "/" + fileKey,
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

    // Get all seller's active products with full details (limited to 30, sorted newest first)
    const sellerProducts = await Product.find({
      seller: req.user.id,
      status: 'active',
      visibility: 'visible'
    })
    .sort({ createdAt: -1 }) // Sort by creation date, newest first
    .select('_id name description category images price sku stock');

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
      subCategory,
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

    stream.streamLink = generateStreamLink(stream._id,stream.type)
    
    await stream.save();

    const populatedStream = await Stream.findById(stream._id)
      .populate('seller', 'storeName businessName storeAvatar rating')
      .populate('products.product', 'name description images price');

    // Initialize stream-specific notification room if socket.io is available
    if (req.app && req.app.get('io')) {
      const io = req.app.get('io');
      const streamRoom = `stream_notifications_${stream._id.toString()}`;
      console.log(`Initialized stream notification room: ${streamRoom}`);

      // Create initialization notification for room to ensure it exists in Socket.IO's room registry
      const initNotification = {
        id: Date.now().toString(),
        type: 'room_init',
        content: 'Stream notification room initialized',
        data: {
          streamId: stream._id.toString(),
          streamType: stream.type,
          status: 'scheduled'
        },
        timestamp: new Date()
      };

      io.to(streamRoom).emit('stream_room_initialized', initNotification);
    }

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

    if (status) {
      if (['scheduled', 'live', 'ended'].includes(status)) {
        query.status = status;
        
        // Add additional check for scheduled streams to ensure scheduled time hasn't passed
        if (status === 'scheduled') {
          query.scheduledStartTime = { $gt: new Date() }; // Only include streams whose scheduled time is in the future
        }
      } else if (status === 'live_upcoming') {
        // For live_upcoming, get both live streams and scheduled streams with future start time
        query.status = { $in: ['live', 'scheduled'] };
        
        // Add a filter to make sure scheduled streams have a future start time
        query.$or = [
          { status: 'live' },
          { 
            status: 'scheduled',
            scheduledStartTime: { $gt: new Date() }
          }
        ];
      }
    }

    if (type && ['auction', 'open_show'].includes(type)) {
      query.type = type;
    }

    const streams = await Stream.find(query)
      .populate('seller', 'storeName businessName storeAvatar rating')
      .populate('products.product', 'name description images price')
      .select('seller title description coverImage category tags products status channelName scheduledStartTime actualStartTime endTime viewers type bids createdAt updatedAt subscribers')
      .sort({ scheduledStartTime: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Add subscribersCount to each stream with proper typing
    const streamsWithSubscriberCount = streams.map(stream => {
      // Convert to plain object first
      const streamObj = stream.toObject();

      // Add the subscribers count property
      return {
        ...streamObj,
        subscribersCount: streamObj.subscribers ? streamObj.subscribers.length : 0
      };
    });

    const total = await Stream.countDocuments(query);

    res.json({
      streams: streamsWithSubscriberCount,
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

    if (status) {
      if (['scheduled', 'live', 'ended'].includes(status)) {
        query.status = status;
        
        // Add additional check for scheduled streams to ensure scheduled time hasn't passed
        if (status === 'scheduled') {
          query.scheduledStartTime = { $gt: new Date() }; // Only include streams whose scheduled time is in the future
        }
      } else if (status === 'live_upcoming') {
        // For live_upcoming, get both live streams and scheduled streams with future start time
        query.status = { $in: ['live', 'scheduled'] };
        
        // Add a filter to make sure scheduled streams have a future start time
        query.$or = [
          { status: 'live' },
          { 
            status: 'scheduled',
            scheduledStartTime: { $gt: new Date() }
          }
        ];
      }
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

    if (status) {
      if (['scheduled', 'live', 'ended'].includes(status)) {
        query.status = status;
        
        // Add additional check for scheduled streams to ensure scheduled time hasn't passed
        if (status === 'scheduled') {
          query.scheduledStartTime = { $gt: new Date() }; // Only include streams whose scheduled time is in the future
        }
      } else if (status === 'live_upcoming') {
        // For live_upcoming, get both live streams and scheduled streams with future start time
        query.status = { $in: ['live', 'scheduled'] };
        
        // Add a filter to make sure scheduled streams have a future start time
        query.$or = [
          { status: 'live' },
          { 
            status: 'scheduled',
            scheduledStartTime: { $gt: new Date() }
          }
        ];
      }
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

    // Build query for streams from featured seller
    const query = {
      seller: { $in: featuredSellerIds }
    };

    if (status) {
      if (['scheduled', 'live', 'ended'].includes(status)) {
        query.status = status;
        
        // Add additional check for scheduled streams to ensure scheduled time hasn't passed
        if (status === 'scheduled') {
          query.scheduledStartTime = { $gt: new Date() }; // Only include streams whose scheduled time is in the future
        }
      } else if (status === 'live_upcoming') {
        // For live_upcoming, create a $or query to get both live streams and scheduled streams with future start time
        query.$or = [
          { status: 'live' },
          { 
            status: 'scheduled',
            scheduledStartTime: { $gt: new Date() }
          }
        ];
      }
    }

    if (type && ['auction', 'open_show'].includes(type)) {
      query.type = type;
    }

    // Find streams from featured sellers
    const streams = await Stream.find(query)
      .populate('seller', 'storeName businessName storeAvatar rating isFeatured businessAddress')
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
      
      // Add additional check for scheduled streams to ensure scheduled time hasn't passed
      if (status === 'scheduled') {
        query.scheduledStartTime = { $gt: new Date() }; // Only include streams whose scheduled time is in the future
      }
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
      
      // Add additional check for scheduled streams to ensure scheduled time hasn't passed
      if (status === 'scheduled') {
        query.scheduledStartTime = { $gt: new Date() }; // Only include streams whose scheduled time is in the future
      }
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

    // Get all viewers with detailed information
    const detailedViewers = await Buyer.find(
      { _id: { $in: stream.viewers } }
    ).select('_id firstName lastName username profileImage avatarUrl').lean();


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
        totalLeft: totalLeft, // Total viewers who left
        viewers: detailedViewers
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

        // Create a stream-specific room name
        const streamRoom = `stream_notifications_${stream._id.toString()}`;

        // Emit to stream-specific room
        io.to(streamRoom).emit('viewer_left_stream', notificationObj);
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

    // track viewer left stream event on mixpanel
    mixpanel.track('viewer_left_stream', {
      streamId: stream._id,
      viewerId: req.user.id,
      viewerName: buyer.firstName + " " + buyer.lastName,
      viewerCount: activeViewerCount,
      leftAt: new Date().toISOString()
    });

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

        // Create a stream-specific room name
        const streamRoom = `stream_notifications_${stream._id.toString()}`;

        // Emit to stream-specific room
        io.to(streamRoom).emit('seller_left_stream', notificationObj);
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

    console.log('[ACTIVATE_BID] 1. Received request to activate product bidding', {
      streamId,
      productId,
      sellerId: req.user.id
    });

    // Validate required fields
    if (!streamId || !productId) {
      console.error('[ACTIVATE_BID] 2. FAILED: Missing streamId or productId');
      return res.status(400).json({
        message: 'Stream ID and Product ID are required'
      });
    }

    // Find the stream and check if it's an auction
    console.log('[ACTIVATE_BID] 3. Finding stream');
    const stream = await Stream.findById(streamId)
      .populate('seller', 'storeName storeAvatar')
      .populate('products.currentBidder', 'firstName lastName username');

    if (!stream) {
      console.error('[ACTIVATE_BID] 4. FAILED: Stream not found');
      return res.status(404).json({ message: 'Stream not found' });
    }

    console.log('[ACTIVATE_BID] 5. Stream found', {
      streamId: stream._id,
      title: stream.title
    });

    // Check if stream type is auction
    if (stream.type !== 'auction') {
      console.error('[ACTIVATE_BID] 6. FAILED: Stream type is not auction', { type: stream.type });
      return res.status(400).json({ message: 'Stream type must be auction to activate product bidding' });
    }

    // Check if stream is live
    if (stream.status !== 'live') {
      console.error('[ACTIVATE_BID] 7. FAILED: Stream is not live', { status: stream.status });
      return res.status(400).json({ message: 'Stream must be live to activate product bidding' });
    }

    // Find the product in the stream's products array
    console.log('[ACTIVATE_BID] 8. Looking for product in stream products array');
    const productIndex = stream.products.findIndex(p =>
      p.product && p.product.productId.toString() === productId
    );

    if (productIndex === -1) {
      console.error('[ACTIVATE_BID] 9. FAILED: Product not found in stream');
      return res.status(404).json({ message: 'Product not found in stream' });
    }

    console.log('[ACTIVATE_BID] 10. Found product in stream', {
      productIndex,
      productName: stream.products[productIndex].product.name
    });

    // Update product's bidStatus to active
    stream.products[productIndex].bidStatus = 'active';
    console.log('[ACTIVATE_BID] 11. Updated product bidStatus to active');

    // Set other products to 'ended' if any are 'active'
    stream.products.forEach((product, index) => {
      if (index !== productIndex && (product.bidStatus === 'active' || product.bidStatus === 'ongoing')) {
        console.log('[ACTIVATE_BID] 12. Setting other active/ongoing product to ended', {
          productName: product.product.name,
          previousStatus: product.bidStatus
        });
        product.bidStatus = 'ended';
      }
    });

    await stream.save();
    console.log('[ACTIVATE_BID] 13. Stream saved successfully');

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
    const formattedProductName = formatProductName(stream.products[productIndex].product.name);

    // Create notification object for WebSocket
    const notificationObj = {
      id: Date.now().toString(),
      type: 'auction_start',
      user: stream.seller.storeName || 'Host',
      avatar: stream.seller.storeAvatar?.url || '',
      content: `Bidding started for ${formattedProductName}`,
      data: {
        message: `Bidding started for ${formattedProductName}`,
        streamId: stream._id.toString(),
        sellerId: stream.seller._id.toString(),
        storeName: stream.seller.storeName || 'Unknown Store',
        product: stream.products[productIndex]
      },
      timestamp: new Date()
    };

    // Send WebSocket notification
    console.log('[ACTIVATE_BID] 14. Broadcasting start notification to subscribers');
    const io = req.app.get('io');

    // Create a stream-specific room name
    const streamRoom = `stream_notifications_${stream._id.toString()}`;

    // Emit to stream-specific room
    io.to(streamRoom).emit('stream_notification', notificationObj);

    // Add the notification to stream chat interactions
    stream.chatInteractions.push(notificationObj);
    await stream.save();

    // Set up a 30-second timer using Agenda
    console.log('[ACTIVATE_BID] 15. Setting up 30-second timer with Agenda');

    // Get the agenda instance
    const { agenda } = require('../config/agenda');

    // Create a unique job ID for this bid timer
    const jobId = `bid_timer_${stream._id}_${productId}_${Date.now()}`;

    // Schedule the job to run immediately
    await agenda.schedule('now', 'bid_timer', {
      streamId: stream._id.toString(),
      productId,
      sellerId: stream.seller._id.toString(),
      jobId,
      activeProductIndex: productIndex,
      productName: stream.products[productIndex].product.name || 'Product'
    });

    console.log('[ACTIVATE_BID] 16. Agenda job scheduled successfully', { jobId });

    // Return the updated product information with timer details
    return res.status(200).json({
      message: 'Product bidding activated successfully',
      product: stream.products[productIndex],
      timerDetails: {
        duration: 30,
        jobId
      }
    });
  } catch (error) {
    console.error('[ACTIVATE_BID] ERROR: Failed to activate product bidding:', error);
    return res.status(500).json({
      message: 'Failed to activate product bidding',
      error: error.message
    });
  }
};

exports.endProductBidding = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { productId, sellerId } = req.body;

    console.log('[END_BID] 1. Received request to end product bidding', {
      streamId,
      productId,
      sellerId
    });

    if (!streamId || !productId) {
      console.error('[END_BID] 2. FAILED: Missing streamId or productId');
      return res.status(400).json({ message: 'Stream ID and Product ID are required' });
    }

    console.log('[END_BID] 3. Retrieving stream data');
    // Get the stream by stream ID and populate necessary fields
    const stream = await Stream.findById(streamId)
      .populate('seller', 'storeName storeAvatar warehouseDetails businessAddress')
      .populate('products.currentBidder', 'firstName lastName username profileImage');

    if (!stream) {
      console.error('[END_BID] 4. FAILED: Stream not found');
      return res.status(404).json({ message: 'Stream not found' });
    }

    console.log('[END_BID] 5. Stream found', {
      streamId: stream._id,
      title: stream.title,
      sellerName: stream.seller?.storeName
    });

    // Check if stream type is auction
    if (stream.type !== 'auction') {
      console.error('[END_BID] 6. FAILED: Stream type is not auction', { type: stream.type });
      return res.status(400).json({ message: 'Stream type must be auction to end product bidding' });
    }

    // Find the product in the stream's products array
    console.log('[END_BID] 7. Looking for product in stream products array with ID:', productId);
    const productIndex = stream.products.findIndex(p =>
      (p.product._id && p.product._id.toString() === productId) ||
      (p.product.productId && p.product.productId.toString() === productId) ||
      (p.product && p.product.toString() === productId)
    );

    if (productIndex === -1) {
      console.error('[END_BID] 8. FAILED: Product not found in stream');
      return res.status(404).json({ message: 'Product not found in stream' });
    }

    const product = stream.products[productIndex];
    console.log('[END_BID] 9. Found product in stream', {
      productIndex,
      productName: product.product.name,
      currentBid: product.currentBid,
      bidStatus: product.bidStatus
    });

    // Check if bidStatus is active
    if (product.bidStatus !== 'active') {
      console.error('[END_BID] 10. FAILED: Product bidding is not active', { bidStatus: product.bidStatus });
      return res.status(400).json({ message: 'Product bidding is not active' });
    }

    // Update product's bidStatus to ongoing (not ended as it's in process of being finalized)
    stream.products[productIndex].bidStatus = 'ongoing';
    console.log('[END_BID] 11. Updated product bidStatus to ongoing');

    // Set winner if there is a current bidder
    if (stream.products[productIndex].currentBidder) {
      console.log('[END_BID] 12. Setting bid winner', {
        buyer: stream.products[productIndex].currentBidder._id,
        bidAmount: stream.products[productIndex].currentBid
      });

      stream.products[productIndex].bidWinner = {
        buyer: {
          _id: stream.products[productIndex].currentBidder._id,
          firstName: stream.products[productIndex].currentBidder.firstName,
          lastName: stream.products[productIndex].currentBidder.lastName,
          username: stream.products[productIndex].currentBidder.username,
          profileImage: stream.products[productIndex].currentBidder.profileImage
        },
        bidAmount: stream.products[productIndex].currentBid,
        winningTime: new Date()
      };

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

      // Create bid winner notification
      const winnerNotification = {
        id: Date.now().toString(),
        type: 'auction_winner',
        user: stream.seller.storeName || 'Host',
        avatar: stream.seller.storeAvatar?.url || '',
        content: `${stream.products[productIndex].currentBidder.username || stream.products[productIndex].currentBidder.firstName} won the auction for ${formattedProductName} with a bid of ₦${stream.products[productIndex].currentBid.toLocaleString()}`,
        data: {
          message: `${stream.products[productIndex].currentBidder.username || stream.products[productIndex].currentBidder.firstName} won the auction for ${formattedProductName} with a bid of ₦${stream.products[productIndex].currentBid.toLocaleString()}`,
          streamId: stream._id.toString(),
          sellerId: stream.seller._id.toString(),
          storeName: stream.seller.storeName || 'Unknown Store',
          product: stream.products[productIndex],
          bidWinner: {
            buyer: {
              _id: stream.products[productIndex].currentBidder._id,
              firstName: stream.products[productIndex].currentBidder.firstName,
              lastName: stream.products[productIndex].currentBidder.lastName,
              username: stream.products[productIndex].currentBidder.username,
              profileImage: stream.products[productIndex].currentBidder.profileImage
            },
            bidAmount: stream.products[productIndex].currentBid,
            timestamp: new Date()
          }
        },
        timestamp: new Date()
      };

      // Broadcast to all subscribers of stream notifications
      if (req.app && req.app.get('io')) {
        const io = req.app.get('io');

        // Create a stream-specific room name
        const streamRoom = `stream_notifications_${stream._id.toString()}`;

        // Emit to stream-specific room
        io.to(streamRoom).emit('stream_notification', winnerNotification);
      }
      // Add the notification to stream chat interactions
      stream.chatInteractions.push(winnerNotification);
      console.log('[END_BID] 13. Added winner notification to stream chat interactions');

      // Create an order for the auction winner - START OF ORDER CREATION
      console.log('[END_BID] 14. Creating order for auction winner');

      try {
        // Fetch full product details
        console.log('[END_BID] 15. Fetching full product details');
        const Product = mongoose.model('Product');
        // Get productId from the stream product
        const productIdToFetch = product.product.productId || product.product._id;
        const fullProductDetails = await Product.findById(productIdToFetch).populate('seller');

        if (!fullProductDetails) {
          console.error('[END_BID] 16. FAILED: Could not retrieve full product details');
          throw new Error('Product details not found');
        }

        console.log('[END_BID] 17. Full product details retrieved', {
          productId: fullProductDetails._id,
          name: fullProductDetails.name,
          weight: fullProductDetails.weight || 1
        });

        // Fetch buyer details
        console.log('[END_BID] 18. Fetching buyer details');
        const Buyer = mongoose.model('Buyer');
        const buyerId = stream.products[productIndex].currentBidder._id;
        const buyer = await Buyer.findById(buyerId).select('firstName lastName email phoneNumber wallet shippingAddresses');

        if (!buyer) {
          console.error('[END_BID] 19. FAILED: Buyer not found');
          throw new Error('Buyer not found');
        }

        if (!buyer.shippingAddresses || buyer.shippingAddresses.length === 0) {
          console.error('[END_BID] 20. FAILED: Buyer has no shipping addresses');
          throw new Error('Buyer has no shipping addresses');
        }

        console.log('[END_BID] 21. Buyer details retrieved', {
          buyerId: buyer._id,
          name: `${buyer.firstName} ${buyer.lastName}`,
          hasShippingAddresses: buyer.shippingAddresses?.length > 0
        });

        // Prepare shipping address
        const selectedAddress = {
          recipientName: `${buyer.firstName} ${buyer.lastName}`,
          recipientEmail: buyer.email,
          recipientPhone: buyer.phoneNumber?.replaceAll("-", "")?.length > 14 ?
            buyer.phoneNumber.replaceAll("-", "").replace("0", "") :
            buyer.phoneNumber.replaceAll("-", ""),
          recipientAddress: buyer.shippingAddresses[0].addressLine1,
          recipientState: buyer.shippingAddresses[0].state,
        };

        console.log('[END_BID] 22. Prepared shipping address', selectedAddress);

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

        console.log('[END_BID] 23. Prepared seller pickup address', pickupAddress);

        // Calculate shipping fee
        console.log('[END_BID] 24. Calculating shipping fee');
        const payload = [
          {
            pickUpState: pickupAddress.pickUpState,
            weight: fullProductDetails.weight || 1,
            sellerId: seller._id,
          },
        ];

        // Prepare shipping details
        const shippingDetails = {
          state: selectedAddress.recipientState,
          pickupLocations: payload,
        };

        console.log('[END_BID] 25. Prepared shipping details', {
          buyerState: shippingDetails.state,
          pickupState: payload[0].pickUpState,
          weight: payload[0].weight
        });

        // Calculate delivery cost
        let shippingFee = 0;
        try {
          console.log('[END_BID] 26. Calculating delivery cost');
          // Use the global orderController import
          const costResponse = await orderController.calculateDeliveryCostInternal(shippingDetails);
          shippingFee = costResponse.totalCost || 0;
          console.log('[END_BID] 27. Shipping fee calculated', {
            shippingFee,
            response: costResponse
          });
        } catch (error) {
          console.error('[END_BID] 28. Error calculating shipping fee:', error);
          // Default to 0 if calculation fails, but continue with order creation
          shippingFee = 0;
        }

        // Prepare order data
        const orderData = {
          items: [
            {
              productId: fullProductDetails._id,
              quantity: 1,
              price: stream.products[productIndex].currentBid,
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

        console.log('[END_BID] 29. Prepared order data', orderData);

        // Create the order
        console.log('[END_BID] 30. Creating order using order controller');

        // Create mock request and response objects for the createOrder function
        const mockReq = {
          body: orderData,
          user: {
            id: buyerId
          },
          get: (name) => name === 'host' ? 'auqli.com' : null,
          app: req.app // Pass the app instance for notifications
        };

        let orderResult = null;
        const mockRes = {
          status: function (code) {
            this.statusCode = code;
            return this;
          },
          json: function (data) {
            orderResult = data;
            console.log(`[END_BID] 31. Order creation response received with status: ${this.statusCode}`,
              data.success === false ? { error: data.message } : { orderId: data.orders?.[0]?.orderId });
            return this;
          }
        };

        // Call the createOrder function using the global orderController import
        await orderController.createOrder(mockReq, mockRes);

        // Update stream product with order information
        if (orderResult && orderResult.success !== false && orderResult.liveShowOrders && orderResult.liveShowOrders.length > 0) {
          console.log('[END_BID] 32. Order created successfully', {
            orderId: orderResult.liveShowOrders[0].orderId,
            orderTotal: orderResult.totals.grandTotal
          });

          // Update stream product to mark order as created and set bid status to ongoing
          stream.products[productIndex].orderCreated = true;
          stream.products[productIndex].orderId = orderResult.liveShowOrders[0].orderId;
          stream.products[productIndex].bidStatus = 'ongoing';

          // Add order to stream's orders array
          const orders = orderResult.liveShowOrders;
          console.log('[END_BID] 32a. Order created successfully', orders);

          // Add each order individually to the stream's orders array
          // (instead of pushing the entire array as one element)
          if (Array.isArray(orders)) {
            for (const order of orders) {
              stream.orders.push(order);
            }
          } else {
            console.error('[END_BID] 32b. Expected orders to be an array but got:', typeof orders);
          }

          console.log('[END_BID] 32c. Added order to stream\'s orders array', {
            streamOrdersCount: stream.orders.length,
            latestOrderId: orders[0].orderId
          });

          await stream.save();

          // Emit socket notification about order creation
          const io = req.app.get('io');

          // Create a stream-specific room name
          const streamRoom = `stream_notifications_${stream._id.toString()}`;

          // Get winning bidder ID
          const winningBidderId = stream.products[productIndex].currentBidder._id.toString();
          console.log(`[END_BID] Winning bidder ID: ${winningBidderId}`);

          // Find all sockets in the stream room and send notification only to the winning bidder
          const sockets = await io.in(streamRoom).fetchSockets();
          console.log(`[END_BID] Found ${sockets.length} sockets in room ${streamRoom}`);

          let winnerSocketFound = false;

          // Loop through all sockets in the room to find the winning bidder
          for (const socket of sockets) {
            // Check if this socket belongs to the winning bidder
            if (socket.user && socket.user.id === winningBidderId) {
              console.log(`[END_BID] Found winning bidder's socket: ${socket.id}`);

              // Send order confirmation only to this socket
              io.to(socket.id).emit('auction_order_created', {
                success: true,
                message: 'Order created for auction win',
                orderId: orderResult.orders[0].orderId,
                streamId: stream._id,
                orderDetails: orderResult.orders[0],
                productName: fullProductDetails.name,
                amount: stream.products[productIndex].currentBid,
                shippingFee: shippingFee,
                total: stream.products[productIndex].currentBid + shippingFee
              });

              winnerSocketFound = true;
              console.log(`[END_BID] Order confirmation sent to winning bidder's socket ID: ${socket.id}`);
              break;
            }
          }

          // track live auction order event on mixpanel
          mixpanel.track('live_auction_order', {
            streamId: stream._id,
            buyerId: winningBidderId,
            productId: fullProductDetails._id,
            productName: fullProductDetails.name,
            buyerName: buyer.firstName + " " + buyer.lastName,
            buyerUsername: buyer.username,
            orderId: orderResult.orders[0].orderId,
            orderTotal: orderResult.totals.grandTotal,
            orderDate: orderResult.orders[0].createdAt,
          });

          if (!winnerSocketFound) {
            console.log(`[END_BID] Warning: Winning bidder (${winningBidderId}) not found in room ${streamRoom}`);
          }
        } else {
          console.error('[END_BID] 32. Failed to create order',
            orderResult?.message || 'Unknown error');

          // Set bid status back to ongoing even if order creation failed
          stream.products[productIndex].bidStatus = 'ongoing';
          await stream.save();

          // Emit error notification to buyer
          const io = req.app.get('io');

          // Create a stream-specific room name
          const streamRoom = `stream_notifications_${stream._id.toString()}`;

          // Emit to stream-specific room
          io.to(streamRoom).emit('auction_order_error', {
            success: false,
            message: 'Failed to create order for auction win',
            error: orderResult?.message || 'Unknown error occurred during order creation',
            productName: fullProductDetails.name,
          });
        }
      } catch (orderError) {
        console.error('[END_BID] ERROR: Failed to create order:', orderError);

        // Set bid status to ongoing even if there was an error
        stream.products[productIndex].bidStatus = 'ongoing';
        await stream.save();

        // Try to notify buyer of error if we have the buyerId
        if (stream.products[productIndex].currentBidder?._id) {
          const buyerId = stream.products[productIndex].currentBidder._id;
          const io = req.app.get('io');

          // Create a stream-specific room name
          const streamRoom = `stream_notifications_${stream._id.toString()}`;

          // Emit to stream-specific room
          io.to(streamRoom).emit('auction_order_error', {
            success: false,
            message: 'Error processing auction order',
            error: orderError.message || 'Unknown error occurred',
            productName: product.product.name || 'Unknown product'
          });
        }
      }
    } else {
      // No bidder, just end the bidding
      console.log('[END_BID] 12. No current bidder, ending bidding without creating order');
      stream.products[productIndex].bidStatus = 'ongoing';
    }

    // Save the stream with the updated product information
    console.log('[END_BID] 33. Saving stream with updated bid information');
    await stream.save();
    console.log('[END_BID] 34. Stream saved successfully');

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
    const formattedProductName = formatProductName(stream.products[productIndex].product.name);

    // Create notification object for WebSocket
    const notificationObj = {
      id: Date.now().toString(),
      type: 'auction_end',
      user: stream.seller.storeName || 'Host',
      avatar: stream.seller.storeAvatar?.url || '',
      content: `Bidding ended for ${formattedProductName}`,
      data: {
        message: `Bidding ended for ${formattedProductName}`,
        streamId: stream._id.toString(),
        sellerId: stream.seller._id.toString(),
        storeName: stream.seller.storeName || 'Unknown Store',
        product: stream.products[productIndex],
        orders: stream.orders
      },
      timestamp: new Date()
    };

    // Send WebSocket notification
    console.log('[END_BID] 35. Broadcasting end notification to subscribers');
    const io = req.app.get('io');

    // Create a stream-specific room name
    const streamRoom = `stream_notifications_${stream._id.toString()}`;

    // Emit to stream-specific room
    io.to(streamRoom).emit('stream_notification', notificationObj);

    // Add the notification to stream chat interactions
    stream.chatInteractions.push(notificationObj);
    await stream.save();

    console.log('[END_BID] 36. Successfully ended bidding for product');
    // Return the updated product information
    return res.status(200).json({
      message: 'Product bidding ended successfully',
      product: stream.products[productIndex]
    });
  } catch (error) {
    console.error('[END_BID] ERROR: Failed to end product bidding:', error);
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
      
      // Add additional check for scheduled streams to ensure scheduled time hasn't passed
      if (status === 'scheduled') {
        searchQuery.scheduledStartTime = { $gt: new Date() }; // Only include streams whose scheduled time is in the future
      }
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

/**
 * Subscribe a buyer to notifications for when a stream starts
 * @route POST /api/streams/:streamId/subscribe
 * @access Private (Buyer only)
 */
exports.subscribeToStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const buyerId = req.user.id;

    // Find the stream
    const stream = await Stream.findById(streamId)
      .populate('seller', 'storeName businessName storeAvatar');

    if (!stream) {
      return res.status(404).json({
        message: 'Stream not found'
      });
    }

    // Check if the stream is in scheduled status
    if (stream.status !== 'scheduled') {
      return res.status(400).json({
        message: 'You can only subscribe to upcoming streams that have not started yet'
      });
    }

    // Check if buyer is already subscribed
    const alreadySubscribed = stream.subscribers &&
      stream.subscribers.some(subscriber =>
        subscriber.buyer.toString() === buyerId.toString());

    if (alreadySubscribed) {
      return res.status(400).json({
        message: 'You are already subscribed to this stream'
      });
    }

    // Add buyer to subscribers list
    await Stream.findByIdAndUpdate(streamId, {
      $push: {
        subscribers: {
          buyer: buyerId,
          subscribedAt: new Date(),
          notified: false
        }
      }
    });

    // Return success response
    res.status(200).json({
      message: 'You will be notified when this stream goes live',
      streamId: stream._id,
      streamTitle: stream.title,
      scheduledStartTime: stream.scheduledStartTime
    });

  } catch (error) {
    console.error('Subscribe to stream error:', error);
    res.status(500).json({
      message: 'Failed to subscribe to stream',
      error: error.message
    });
  }
};

/**
 * Unsubscribe a buyer from notifications for a stream
 * @route POST /api/streams/:streamId/unsubscribe
 * @access Private (Buyer only)
 */
exports.unsubscribeFromStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const buyerId = req.user.id;

    // Find the stream
    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        message: 'Stream not found'
      });
    }

    // Check if buyer is subscribed
    const isSubscribed = stream.subscribers &&
      stream.subscribers.some(subscriber =>
        subscriber.buyer.toString() === buyerId.toString());

    if (!isSubscribed) {
      return res.status(404).json({
        message: 'You are not subscribed to this stream'
      });
    }

    // Remove buyer from subscribers list
    await Stream.findByIdAndUpdate(streamId, {
      $pull: {
        subscribers: {
          buyer: buyerId
        }
      }
    });

    // Return success response
    res.status(200).json({
      message: 'You have unsubscribed from notifications for this stream',
      streamId: stream._id
    });

  } catch (error) {
    console.error('Unsubscribe from stream error:', error);
    res.status(500).json({
      message: 'Failed to unsubscribe from stream',
      error: error.message
    });
  }
};

/**
 * Get related streams based on a given stream ID
 * @route GET /api/streams/:streamId/related
 * @access Public
 */
exports.getRelatedStreams = async (req, res) => {
  try {
    const { streamId } = req.params;
    const {
      status,
      limit = 10,
      page = 1,
      excludeSeller = false
    } = req.query;

    // Parse pagination parameters
    const parsedLimit = Math.min(parseInt(limit) || 10, 20);
    const parsedPage = parseInt(page) || 1;
    const skip = (parsedPage - 1) * parsedLimit;

    // Find the source stream to get its category and tags
    const sourceStream = await Stream.findById(streamId)
      .select('title category tags seller type');

    if (!sourceStream) {
      return res.status(404).json({
        message: 'Stream not found'
      });
    }

    // Convert streamId to ObjectId to ensure proper comparison
    const sourceObjectId = new mongoose.Types.ObjectId(streamId);

    // Build query to find related streams
    const query = {
      _id: { $ne: sourceObjectId } // Exclude the source stream using ObjectId
    };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Exclude streams from the same seller if requested
    if (excludeSeller === 'true' || excludeSeller === true) {
      query.seller = { $ne: sourceStream.seller };
    }

    // Match based on category and tags first (highest relevance)
    const categoryTagsQuery = {
      ...query,
      category: sourceStream.category,
      tags: { $in: sourceStream.tags }
    };

    // Match based on category only (medium relevance)
    const categoryQuery = {
      ...query,
      category: sourceStream.category
    };

    // Match based on tags only (lower relevance)
    const tagsQuery = {
      ...query,
      tags: { $in: sourceStream.tags }
    };

    // Count total related streams for pagination
    const [categoryTagsCount, categoryCount, tagsCount, totalCount] = await Promise.all([
      Stream.countDocuments(categoryTagsQuery),
      Stream.countDocuments(categoryQuery),
      Stream.countDocuments(tagsQuery),
      Stream.countDocuments(query)
    ]);

    // First try to find streams with both matching category and some matching tags
    const categoryAndTagMatch = await Stream.find(categoryTagsQuery)
      .populate('seller', 'storeName businessName storeAvatar')
      .populate('products.product', 'name description images price')
      .populate('viewers')
      .sort({ createdAt: -1 })
      .lean();

    // Next, find streams with matching category
    const categoryMatch = await Stream.find({
      ...categoryQuery,
      _id: {
        $nin: [
          ...categoryAndTagMatch.map(stream => stream._id),
          sourceObjectId // Make sure to exclude source stream here too
        ]
      }
    })
      .populate('seller', 'storeName businessName storeAvatar')
      .populate('products.product', 'name description images price')
      .populate('viewers')
      .sort({ createdAt: -1 })
      .lean();

    // Next, find streams with matching tags
    const tagMatch = await Stream.find({
      ...tagsQuery,
      _id: {
        $nin: [
          ...categoryAndTagMatch.map(stream => stream._id),
          ...categoryMatch.map(stream => stream._id),
          sourceObjectId // Make sure to exclude source stream here too
        ]
      }
    })
      .populate('seller', 'storeName businessName storeAvatar')
      .populate('products.product', 'name description images price')
      .populate('viewers')
      .sort({ createdAt: -1 })
      .lean();

    // Lastly, find any remaining streams
    const existingIds = [
      ...categoryAndTagMatch.map(stream => stream._id),
      ...categoryMatch.map(stream => stream._id),
      ...tagMatch.map(stream => stream._id),
      sourceObjectId // Make sure to exclude source stream here too
    ];

    const newestStreams = await Stream.find({
      ...query,
      _id: { $nin: existingIds }
    })
      .populate('seller', 'storeName businessName storeAvatar')
      .populate('products.product', 'name description images price')
      .populate('viewers')
      .sort({ createdAt: -1 })
      .lean();

    // Double check: filter out the source stream ID from all results
    const filteredResults = [
      ...categoryAndTagMatch,
      ...categoryMatch,
      ...tagMatch,
      ...newestStreams
    ].filter(stream => stream._id.toString() !== streamId);

    // If we didn't find any related streams and the status is 'live',
    // it's better to return an empty array than potentially showing the source stream
    if (filteredResults.length === 0) {
      return res.json({
        streams: [],
        sourceStream: {
          _id: sourceStream._id,
          title: sourceStream.title,
          category: sourceStream.category,
          tags: sourceStream.tags,
          type: sourceStream.type
        },
        pagination: {
          total: 0,
          pages: 0,
          currentPage: parsedPage,
          hasMore: false
        }
      });
    }

    // Apply pagination to the combined results
    const paginatedResults = filteredResults.slice(skip, skip + parsedLimit);

    // Add viewerCount to each stream
    const streamsWithViewerCount = paginatedResults.map(stream => {
      // Convert to plain object if not already
      const streamObj = typeof stream.toObject === 'function' ? stream.toObject() : stream;
      streamObj.viewerCount = stream.viewers ? stream.viewers.length : 0;
      streamObj.isLive = stream.status === 'live';
      return streamObj;
    });

    // Calculate total number of related streams
    const total = filteredResults.length;

    // Return the related streams along with source stream info and pagination
    res.json({
      streams: streamsWithViewerCount,
      sourceStream: {
        _id: sourceStream._id,
        title: sourceStream.title,
        category: sourceStream.category,
        tags: sourceStream.tags,
        type: sourceStream.type
      },
      pagination: {
        total,
        pages: Math.ceil(total / parsedLimit),
        currentPage: parsedPage,
        hasMore: parsedPage * parsedLimit < total
      }
    });

  } catch (error) {
    console.error('Get related streams error:', error);
    res.status(500).json({
      message: 'Failed to get related streams',
      error: error.message
    });
  }
};

/**
 * Get the next stream after a given stream ID
 * @route GET /api/streams/:streamId/next
 * @access Public
 */
exports.getNextStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { status } = req.query;

    // Find the current stream to get its scheduledStartTime
    const currentStream = await Stream.findById(streamId)
      .select('title scheduledStartTime category status');

    if (!currentStream) {
      return res.status(404).json({
        message: 'Stream not found'
      });
    }

    // Build query to find the next stream
    const query = {
      _id: { $ne: streamId } // Exclude the current stream
    };

    // Add status filter if provided, defaulting to scheduled and live
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['scheduled', 'live'] };
    }

    // If the current stream has a scheduledStartTime, find the next one chronologically
    let nextStream;
    if (currentStream.scheduledStartTime) {
      // Find the next stream that starts after the current one
      nextStream = await Stream.findOne({
        ...query,
        scheduledStartTime: { $gt: currentStream.scheduledStartTime }
      })
        .populate('seller', 'storeName businessName storeAvatar')
        .populate('products.product', 'name description images price')
        .populate('viewers')
        .sort({ scheduledStartTime: 1 }) // Get the soonest one
        .lean();
    }

    // If no next stream found with later start time, or if current stream has no start time,
    // find any upcoming scheduled or live stream
    if (!nextStream) {
      nextStream = await Stream.findOne(query)
        .populate('seller', 'storeName businessName storeAvatar')
        .populate('products.product', 'name description images price')
        .populate('viewers')
        .sort({ scheduledStartTime: 1 }) // Get the soonest one
        .lean();
    }

    if (!nextStream) {
      return res.status(404).json({
        message: 'No next stream found',
        currentStream: {
          _id: currentStream._id,
          title: currentStream.title,
          scheduledStartTime: currentStream.scheduledStartTime,
          category: currentStream.category,
          status: currentStream.status
        }
      });
    }

    // Add viewerCount to the next stream
    const nextStreamWithViewerCount = {
      ...nextStream,
      viewerCount: nextStream.viewers ? nextStream.viewers.length : 0,
      isLive: nextStream.status === 'live'
    };

    // Return the next stream along with basic info about current stream
    res.json({
      nextStream: nextStreamWithViewerCount,
      currentStream: {
        _id: currentStream._id,
        title: currentStream.title,
        scheduledStartTime: currentStream.scheduledStartTime,
        category: currentStream.category,
        status: currentStream.status
      }
    });

  } catch (error) {
    console.error('Get next stream error:', error);
    res.status(500).json({
      message: 'Failed to get next stream',
      error: error.message
    });
  }
};

/**
 * Check if a buyer is subscribed to a stream
 * @route GET /api/streams/:streamId/is-subscribed
 * @access Private (Buyer only)
 */
exports.isSubscribedToStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const buyerId = req.user.id;

    if (!streamId) {
      return res.status(400).json({
        message: 'Stream ID is required',
        error: 'Missing streamId parameter'
      });
    }

    // Find the stream
    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        message: 'Stream not found',
        error: 'Invalid stream ID provided'
      });
    }

    // Check if buyer is subscribed
    const isSubscribed = stream.subscribers &&
      stream.subscribers.some(subscriber =>
        subscriber.buyer.toString() === buyerId.toString());

    // Return subscription status
    res.status(200).json({
      isSubscribed: isSubscribed || false
    });

  } catch (error) {
    console.error('Check stream subscription error:', error);
    res.status(500).json({
      message: 'Failed to check subscription status, stream not found',

    });
  }
};

/**
 * Get all orders for a specific stream
 * @route GET /api/streams/:streamId/orders
 * @access Public
 */
exports.getStreamOrders = async (req, res) => {
  try {
    const { streamId } = req.params;

    // Find the stream by ID
    const stream = await Stream.findById(streamId)
      .populate({
        path: 'orders.buyer',
        select: 'firstName lastName username profileImage'
      });

    if (!stream) {
      return res.status(404).json({
        message: 'Stream not found'
      });
    }

    // Return the orders
    res.status(200).json({
      message: 'Stream orders retrieved successfully',
      orders: stream.orders
    });
  } catch (error) {
    console.error('Error fetching stream orders:', error);
    res.status(500).json({
      message: 'Failed to fetch stream orders',
      error: error.message
    });
  }
};

/**
 * Renew Agora token for a stream
 * @route GET /api/streams/:streamId/renew-token
 * @access Private
 */
exports.renewAgoraToken = async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find stream by ID
    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }

    // Determine role based on user type
    let tokenRole, tokenUid;

    if (userRole === 'Seller') {
      // For sellers, use their agoraUid and Publisher role
      const seller = await Seller.findById(userId).select('agoraUid');

      if (!seller || !seller.agoraUid) {
        return res.status(400).json({
          success: false,
          message: 'Seller Agora UID not found'
        });
      }

      tokenRole = RtcRole.PUBLISHER;
      tokenUid = seller.agoraUid;
    } else if (userRole === 'Buyer') {
      // For buyers, create a deterministic but unique uid based on user ID and stream ID
      const userIdNum = parseInt(userId.substring(0, 8), 16);
      const streamIdNum = parseInt(stream._id.toString().substring(0, 8), 16);
      // Combine and constrain to be within Agora's allowed range
      tokenUid = ((userIdNum ^ streamIdNum) % 999000) + 1000;
      tokenRole = RtcRole.SUBSCRIBER;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Invalid user role for token renewal'
      });
    }

    // Generate fresh token
    const freshToken = agoraService.generateToken(
      stream.channelName,
      tokenUid,
      tokenRole
    );

    // Return the new token
    res.status(200).json({
      success: true,
      token: freshToken,
      tokenExpiration: Date.now() + (tokenRole === RtcRole.PUBLISHER ? 3600 : 14400) * 1000,
      uid: tokenUid,
      role: tokenRole === RtcRole.PUBLISHER ? 'publisher' : 'subscriber',
      channelName: stream.channelName
    });

  } catch (error) {
    console.error('Renew Agora token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew Agora token',
      error: error.message
    });
  }
};

/**
 * Get streams by category and subcategory
 * @route GET /api/streams/category/:category/subcategory/:subcategory
 * @access Public
 */
exports.getStreamsByCategoryAndSubcategory = async (req, res) => {
  try {
    const { category, subcategory } = req.params;
    const { status, type, page = 1, limit = 10, sortByViews } = req.query;

    // Build query with case-insensitive category and subcategory matching
    const query = {
      category: { $regex: new RegExp(`^${category}$`, 'i') },  // Case-insensitive exact match
      subCategory: { $regex: new RegExp(`^${subcategory}$`, 'i') }  // Case-insensitive exact match
    };

    if (status && ['scheduled', 'live', 'ended'].includes(status)) {
      query.status = status;
      
      // Add additional check for scheduled streams to ensure scheduled time hasn't passed
      if (status === 'scheduled') {
        query.scheduledStartTime = { $gt: new Date() }; // Only include streams whose scheduled time is in the future
      }
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
    console.error('Get streams by category and subcategory error:', error);
    res.status(500).json({
      message: 'Failed to fetch streams by category and subcategory',
      error: error.message
    });
  }
};

/**
 * Get products of a specific stream with pagination
 */
exports.getStreamProducts = async (req, res) => {
  try {
    const { streamId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify that the stream exists
    const stream = await Stream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        status: false,
        message: 'Stream not found'
      });
    }

    // Get total count for pagination
    const totalProducts = stream.products.length;
    
    // Extract the paginated subset of products
    const paginatedProducts = stream.products.slice(skip, skip + limit);

    // Format the products for response
    const formattedProducts = paginatedProducts.map(product => {
      return {
        _id: product._id,
        productDetails: product.product,
        bidInfo: {
          minBid: product.minBid,
          maxBid: product.maxBid,
          currentBid: product.currentBid,
          currentBidder: product.currentBidder,
          bidStatus: product.bidStatus
        },
        winner: product.bidWinner ? {
          buyer: product.bidWinner.buyer,
          bidAmount: product.bidWinner.bidAmount,
          winningTime: product.bidWinner.winningTime
        } : null,
        orderInfo: {
          orderCreated: product.orderCreated,
          orderId: product.orderId
        }
      };
    });

    res.json({
      status: true,
      products: formattedProducts,
      pagination: {
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching stream products:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch stream products',
      error: error.message
    });
  }
};

/**
 * Get current live announcement for a stream
 * @route GET /api/streams/:streamId/current-announcement
 * @access Private
 */
exports.getCurrentAnnouncement = async (req, res) => {
  try {
    const { streamId } = req.params;

    if (!streamId) {
      return res.status(400).json({
        success: false,
        message: 'Stream ID is required'
      });
    }

    // Find the stream and get its live announcements
    const stream = await Stream.findById(streamId)
      .select('liveAnnouncements')
      .lean();

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }

    // Find the current announcement (the one with current: true)
    const currentAnnouncement = stream.liveAnnouncements?.find(announcement => announcement.current === true);

    // Return response
    res.status(200).json({
      success: true,
      hasAnnouncement: !!currentAnnouncement,
      announcement: currentAnnouncement || null
    });

  } catch (error) {
    console.error('Get current announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current announcement',
      error: error.message
    });
  }
};

exports.rescheduleExpiredStream = async (req, res) => {
  try {
    const { streamId, newScheduledStartTime } = req.body;

    // Validate required fields
    if (!streamId || !newScheduledStartTime) {
      return res.status(400).json({
        message: 'Stream ID and new scheduled start time are required'
      });
    }

    // Validate newScheduledStartTime format
    const newStartDate = new Date(newScheduledStartTime);
    if (isNaN(newStartDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid date and time format for new scheduled start time'
      });
    }

    // Ensure new scheduled time is in the future
    const now = new Date();
    if (newStartDate <= now) {
      return res.status(400).json({
        message: 'New scheduled start time must be in the future'
      });
    }

    // Find the stream and ensure it belongs to the current seller
    const stream = await Stream.findOne({
      _id: streamId,
      seller: req.user.id
    }).populate('seller', 'storeName businessName storeAvatar rating');

    if (!stream) {
      return res.status(404).json({
        message: 'Stream not found or you do not have permission to modify this stream'
      });
    }

    // Validate that the stream status is "expired"
    if (stream.status !== 'expired') {
      return res.status(400).json({
        message: `Cannot reschedule stream. Stream status is "${stream.status}" but must be "expired" to reschedule`
      });
    }

    // Update the stream with new scheduled time and reset status to scheduled
    stream.scheduledStartTime = newStartDate;
    stream.status = 'scheduled';
    
    // Clear any end time if it was set during expiration
    if (stream.endTime) {
      stream.endTime = undefined;
    }

    await stream.save();

    // Populate the updated stream for response
    const updatedStream = await Stream.findById(stream._id)
      .populate('seller', 'storeName businessName storeAvatar rating')
      .populate('products.product', 'name description images price');

    res.json({
      message: 'Stream rescheduled successfully',
      stream: updatedStream
    });

  } catch (error) {
    console.error('Reschedule expired stream error:', error);
    res.status(500).json({
      message: 'Failed to reschedule stream',
      error: error.message || 'Internal server error'
    });
  }
};