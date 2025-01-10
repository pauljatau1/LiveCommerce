const Post = require('../models/Post');
const { s3 } = require('../config/awsConfig');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Seller = require('../models/Seller');
const Buyer = require('../models/Buyer');

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { title, body } = req.body;
    const userId = req.user.id;
    const userModel = req.user.role;

    // Handle image uploads
    let imagesData = [];
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const params = {
          Bucket: 'auqli-uploads',
          Key: `posts/${uuidv4()}-${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const uploadResult = await s3.upload(params).promise();
        imagesData.push({
          url: uploadResult.Location,
          public_id: uploadResult.Key
        });
      }
    }

    const post = new Post({
      title,
      body,
      images: imagesData,
      author: {
        userId,
        userModel
      }
    });

    await post.save();

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create post',
      error: error.message
    });
  }
};

// Add reaction to post
exports.addReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const { type } = req.body;
    const userId = req.user.id;
    const userModel = req.user.role;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Remove existing reaction from same user if exists
    post.reactions = post.reactions.filter(
      reaction => !(reaction.user.userId.equals(userId) && 
                   reaction.user.userModel === userModel)
    );

    // Add new reaction
    post.reactions.push({
      type,
      user: {
        userId,
        userModel
      }
    });

    await post.save();

    res.json({
      message: 'Reaction added successfully',
      reactions: post.reactions
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to add reaction',
      error: error.message
    });
  }
};

// Add comment to post
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const userModel = req.user.role;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      content,
      author: {
        userId,
        userModel
      }
    });

    await post.save();

    res.json({
      message: 'Comment added successfully',
      comment: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

// Get all posts with pagination
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Post.countDocuments();

    res.json({
      posts,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch posts',
      error: error.message
    });
  }
};

// Get posts from followers and followed sellers
exports.getSellerFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const sellerId = req.user.id;

    // Get the seller's followers and followed sellers
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Get IDs of followers (buyers)
    const followerIds = seller.followers.map(follower => follower.buyerId);

    // Find posts from followers and the seller's own posts
    const posts = await Post.find({
      $or: [
        // Posts from followers (buyers)
        {
          'author.userId': { $in: followerIds },
          'author.userModel': 'Buyer'
        },
        // Posts from the seller themselves
        {
          'author.userId': sellerId,
          'author.userModel': 'Seller'
        }
      ]
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({
      path: 'author.userId',
      select: 'firstName lastName storeName businessName profileImage storeAvatar',
      model: function(doc) {
        return mongoose.model(doc.author.userModel);
      }
    })
    .populate({
      path: 'comments.author.userId',
      select: 'firstName lastName storeName businessName profileImage storeAvatar',
      model: function(doc) {
        return mongoose.model(doc.comments.author.userModel);
      }
    });

    // Get total count for pagination
    const count = await Post.countDocuments({
      $or: [
        {
          'author.userId': { $in: followerIds },
          'author.userModel': 'Buyer'
        },
        {
          'author.userId': sellerId,
          'author.userModel': 'Seller'
        }
      ]
    });

    res.json({
      posts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalPosts: count
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch seller feed',
      error: error.message
    });
  }
};

// Get buyer's feed
exports.getBuyerFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const buyerId = req.user.id;

    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Get followed sellers' IDs from buyer's activity
    const followedSellers = await Seller.find({
      'followers.buyerId': buyerId
    }).select('_id');
    const sellerIds = followedSellers.map(seller => seller._id);

    // Find posts from followed sellers and public posts from other buyers
    const posts = await Post.find({
      $or: [
        // Posts from followed sellers
        {
          'author.userId': { $in: sellerIds },
          'author.userModel': 'Seller'
        },
        // Public posts from buyers
        {
          'author.userModel': 'Buyer',
          visibility: 'public'
        }
      ]
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({
      path: 'author.userId',
      select: 'firstName lastName storeName businessName profileImage storeAvatar',
      model: function(doc) {
        return mongoose.model(doc.author.userModel);
      }
    });

    const count = await Post.countDocuments({
      $or: [
        {
          'author.userId': { $in: sellerIds },
          'author.userModel': 'Seller'
        },
        {
          'author.userModel': 'Buyer',
          visibility: 'public'
        }
      ]
    });

    res.json({
      posts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalPosts: count
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch buyer feed',
      error: error.message
    });
  }
};

// Get user's posts
exports.getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.params.userId;
    const userModel = req.params.userType;

    const posts = await Post.find({
      'author.userId': userId,
      'author.userModel': userModel
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({
      path: 'author.userId',
      select: 'firstName lastName storeName businessName profileImage storeAvatar',
      model: userModel
    });

    const count = await Post.countDocuments({
      'author.userId': userId,
      'author.userModel': userModel
    });

    res.json({
      posts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalPosts: count
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch user posts',
      error: error.message
    });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, body, category, tags, visibility } = req.body;
    const userId = req.user.id;
    const userModel = req.user.role;

    const post = await Post.findOne({
      _id: postId,
      'author.userId': userId,
      'author.userModel': userModel
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found or unauthorized' });
    }

    // Handle new images if any
    let imagesData = post.images;
    if (req.files && req.files.length > 0) {
      imagesData = [];
      for (let file of req.files) {
        const params = {
          Bucket: 'auqli-uploads',
          Key: `posts/${uuidv4()}-${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const uploadResult = await s3.upload(params).promise();
        imagesData.push({
          url: uploadResult.Location,
          public_id: uploadResult.Key
        });
      }
    }

    post.title = title || post.title;
    post.body = body || post.body;
    post.category = category || post.category;
    post.tags = tags || post.tags;
    post.visibility = visibility || post.visibility;
    post.images = imagesData;
    post.updatedAt = Date.now();

    await post.save();

    res.json({
      message: 'Post updated successfully',
      post
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to update post',
      error: error.message
    });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const userModel = req.user.role;

    const post = await Post.findOneAndDelete({
      _id: postId,
      'author.userId': userId,
      'author.userModel': userModel
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found or unauthorized' });
    }

    // Delete images from S3 if they exist
    if (post.images && post.images.length > 0) {
      for (let image of post.images) {
        const params = {
          Bucket: 'auqli-uploads',
          Key: image.public_id
        };
        await s3.deleteObject(params).promise();
      }
    }

    res.json({ message: 'Post deleted successfully' });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete post',
      error: error.message
    });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;
    const userModel = req.user.role;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is comment author or post author
    if (!(
      (comment.author.userId.equals(userId) && comment.author.userModel === userModel) ||
      (post.author.userId.equals(userId) && post.author.userModel === userModel)
    )) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }

    comment.remove();
    await post.save();

    res.json({ message: 'Comment deleted successfully' });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete comment',
      error: error.message
    });
  }
}; 