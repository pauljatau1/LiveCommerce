const Stream = require('../models/Stream');
const agoraService = require('../services/agoraService');
const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');

exports.createStream = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      tags,
      products,
      scheduledStartTime
    } = req.body;
    const coverImage = req.file;

    // Upload cover image if provided
    let imageData = {};
    if (coverImage) {
      const uploadResult = await cloudinary.uploader.upload(coverImage.path);
      imageData = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      };
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
      tags,
      products: products.map(p => ({
        product: p.productId,
        minBid: p.minBid,
        maxBid: p.maxBid
      })),
      channelName,
      agoraToken: token,
      scheduledStartTime
    });

    await stream.save();
    
    res.status(201).json({
      message: 'Stream created successfully',
      stream: await stream.populate('products.product')
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create stream',
      error: error.message
    });
  }
};

exports.startStream = async (req, res) => {
  try {
    const stream = await Stream.findOne({
      _id: req.params.streamId,
      seller: req.user.id
    });

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    stream.status = 'live';
    stream.actualStartTime = new Date();
    await stream.save();

    res.json({
      message: 'Stream started successfully',
      stream
    });
  } catch (error) {
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
      'products.product': productId
    });

    if (!stream) {
      return res.status(404).json({ message: 'Stream or product not found' });
    }

    const productIndex = stream.products.findIndex(
      p => p.product.toString() === productId
    );

    if (bidAmount < stream.products[productIndex].minBid) {
      return res.status(400).json({ message: 'Bid amount below minimum' });
    }

    if (bidAmount > stream.products[productIndex].maxBid) {
      return res.status(400).json({ message: 'Bid amount above maximum' });
    }

    if (bidAmount <= stream.products[productIndex].currentBid) {
      return res.status(400).json({ message: 'Bid amount must be higher than current bid' });
    }

    stream.products[productIndex].currentBid = bidAmount;
    stream.products[productIndex].currentBidder = req.user.id;
    
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
      currentBid: bidAmount
    });
  } catch (error) {
    res.status(500).json({
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
    const stream = await Stream.findById(req.params.streamId)
      .populate('seller', 'storeName businessName avatarUrl rating')
      .populate('products.product', 'name description images price')
      .populate('products.currentBidder', 'firstName lastName username')
      .populate('viewers', 'firstName lastName username');

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
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