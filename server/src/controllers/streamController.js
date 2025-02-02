const Stream = require('../models/Stream');
const agoraService = require('../services/agoraService');
const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
const Product = require('../models/Product');
const { s3 } = require('../config/awsConfig');
const jwtDecode = require('jwt-decode');
const Seller = require('../models/Seller');

exports.createStream = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      tags,
      scheduledStartTime
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        message: 'Title, description, and category are required'
      });
    }

    // Parse tags if they're provided as a string
    const parsedTags = tags ? (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags) : [];

    // Parse products array
    let products;
    try {
      products = typeof req.body.products === 'string' ?
        JSON.parse(req.body.products) : req.body.products;

      if (!Array.isArray(products)) {
        products = [products]; // Convert single object to array
      }
    } catch (error) {
      return res.status(400).json({
        message: 'Invalid products format. Expected JSON array',
        error: error.message
      });
    }

    // Upload cover image to AWS S3
    let imageData = {};
    if (req.file) {
      try {
        const fileKey = `stream-covers/${uuidv4()}-${req.file.originalname}`;
        const uploadParams = {
          Bucket: 'auqli-uploads',
          Key: fileKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype
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

    // Generate unique channel name
    const channelName = `stream_${uuidv4()}`;

    // Generate Agora token
    const token = agoraService.generateToken(channelName, req.user.id);

    const stream = new Stream({
      seller: req.user.id,
      title,
      description,
      coverImage: imageData,
      category,
      tags: parsedTags,
      products: products.map(p => ({
        product: p.productId,
        minBid: p.minBid,
        maxBid: p.maxBid
      })),
      channelName,
      agoraToken: token,
      scheduledStartTime: new Date(scheduledStartTime),
      type: 'auction',
      status: 'scheduled'
    });

    await stream.save();

    const populatedStream = await Stream.findById(stream._id)
      .populate('seller', 'storeName businessName avatarUrl rating')
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
    });

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    const freshToken = agoraService.generateToken(stream.channelName, req.user.id);
    stream.status = 'live';
    stream.actualStartTime = new Date();
    stream.agoraToken = freshToken;
    await stream.save();

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
    const { streamId, productId, bidAmount } = req.body;

    const stream = await Stream.findOne({
      _id: streamId,
      status: 'live',
      type: 'auction', // Ensure stream is an auction type
      'products.product': productId
    });

    if (!stream) {
      return res.status(404).json({
        message: 'Stream not found or is not an active auction stream'
      });
    }

    // Check if stream is auction type
    if (stream.type !== 'auction') {
      return res.status(400).json({
        message: 'Bids can only be placed on auction streams'
      });
    }

    const productIndex = stream.products.findIndex(
      p => p.product.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({
        message: 'Product not found in this auction'
      });
    }

    // Validate bid amount against min/max limits
    if (bidAmount < stream.products[productIndex].minBid) {
      return res.status(400).json({
        message: `Bid amount must be at least ${stream.products[productIndex].minBid}`
      });
    }

    if (bidAmount > stream.products[productIndex].maxBid) {
      return res.status(400).json({
        message: `Bid amount cannot exceed ${stream.products[productIndex].maxBid}`
      });
    }

    // Check if bid is higher than current bid
    if (stream.products[productIndex].currentBid &&
      bidAmount <= stream.products[productIndex].currentBid) {
      return res.status(400).json({
        message: `Bid amount must be higher than current bid of ${stream.products[productIndex].currentBid}`
      });
    }

    // Prevent seller from bidding on their own auction
    if (stream.seller.toString() === req.user.id) {
      return res.status(403).json({
        message: 'Sellers cannot bid on their own auctions'
      });
    }

    // Update product's current bid and bidder
    stream.products[productIndex].currentBid = bidAmount;
    stream.products[productIndex].currentBidder = req.user.id;

    // Add to bid history
    stream.bids.push({
      buyer: req.user.id,
      product: productId,
      amount: bidAmount
    });

    await stream.save();

    // Emit socket event for real-time updates
    req.io.to(streamId).emit('newBid', {
      productId,
      currentBid: bidAmount,
      currentBidder: req.user.id
    });

    res.json({
      message: 'Bid placed successfully',
      currentBid: bidAmount,
      productId: productId,
      streamId: streamId
    });
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({
      message: 'Failed to place bid',
      error: error.message || 'Internal server error'
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
      .populate('seller', 'storeName businessName avatarUrl rating')
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
  try {
    let stream = await Stream.findById(req.params.streamId)
      .populate('seller', 'storeName businessName avatarUrl rating')
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
    res.status(500).json({
      message: 'Failed to fetch stream details',
      error: error.message
    });
  }
};

exports.joinStream = async (req, res) => {
  try {
    const stream = await Stream.findOne({
      _id: req.params.streamId,
      status: 'live'
    });

    if (!stream) {
      return res.status(404).json({ message: 'Active stream not found' });
    }

    // Generate viewer token for Agora
    const token = agoraService.generateToken(stream.channelName, req.user.id);

    // Add viewer to stream if not already present
    if (!stream.viewers.includes(req.user.id)) {
      stream.viewers.push(req.user.id);
      await stream.save();
    }

    // Notify others that a new viewer has joined
    req.io.to(stream.channelName).emit('viewerJoined', {
      streamId: stream._id,
      viewer: req.user.id
    });

    res.json({
      message: 'Successfully joined stream',
      channelName: stream.channelName,
      token,
      stream: {
        id: stream._id,
        title: stream.title,
        seller: stream.seller,
        products: stream.products
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to join stream',
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
      .populate('seller', 'storeName businessName avatarUrl rating')
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
      } else if (stream.status === 'live' && stream.actualStartTime && !stream.endTime ) {
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
      scheduledStartTime
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        message: 'Title, description, and category are required'
      });
    }

    // Parse tags if they're provided as a string
    const parsedTags = tags ? (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags) : [];

    // Upload cover image to AWS S3
    let imageData = {};
    if (req.file) {
      try {
        const fileKey = `stream-covers/${uuidv4()}-${req.file.originalname}`;
        const uploadParams = {
          Bucket: 'auqli-uploads',
          Key: fileKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype
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

    // Generate unique channel name
    const channelName = `openshow_${uuidv4()}`;

    // Generate Agora token
    const token = agoraService.generateToken(channelName, req.user.id);

    // Get all seller's active products
    const sellerProducts = await Product.find({
      seller: req.user.id,
      status: 'active',
      visibility: 'visible'
    }).select('_id price');

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
      category,
      tags: parsedTags,
      products: sellerProducts.map(p => ({
        product: p._id,
        // For open shows, we don't include minBid and maxBid
      })),
      channelName,
      agoraToken: token,
      scheduledStartTime: new Date(scheduledStartTime),
      type: 'open_show',
      status: 'scheduled'
    });

    await stream.save();

    const populatedStream = await Stream.findById(stream._id)
      .populate('seller', 'storeName businessName avatarUrl rating')
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
      .populate('seller', 'storeName businessName avatarUrl rating')
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
      .populate('seller', 'storeName businessName avatarUrl rating')
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