const Post = require('../models/Post');
const { s3 } = require('../config/awsConfig');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Seller = require('../models/Seller');
const Buyer = require('../models/Buyer');
const Product = require('../models/Product');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Helper function to generate video thumbnail
const generateVideoThumbnail = async (videoBuffer) => {
  try {
    // Create temporary files for video and thumbnail
    const tempVideoPath = path.join(os.tmpdir(), `${uuidv4()}.mp4`);
    const tempThumbnailPath = path.join(os.tmpdir(), `${uuidv4()}.jpg`);

    // Write video buffer to temporary file
    await fs.writeFile(tempVideoPath, videoBuffer);

    // Generate thumbnail
    return new Promise((resolve, reject) => {
      ffmpeg(tempVideoPath)
        .screenshots({
          timestamps: ['00:00:01'],
          filename: path.basename(tempThumbnailPath),
          folder: path.dirname(tempThumbnailPath),
          size: '320x240'
        })
        .on('end', async () => {
          try {
            // Read the thumbnail file
            const thumbnailBuffer = await fs.readFile(tempThumbnailPath);

            // Upload thumbnail to S3
            const thumbnailParams = {
              Bucket: 'auqli-uploads',
              Key: `posts/thumbnails/${uuidv4()}.jpg`,
              Body: thumbnailBuffer,
              ContentType: 'image/jpeg',
            };
            const thumbnailUpload = await s3.upload(thumbnailParams).promise();

            // Clean up temporary files
            await Promise.all([
              fs.unlink(tempVideoPath),
              fs.unlink(tempThumbnailPath)
            ]);

            resolve(thumbnailUpload.Location);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  } catch (error) {
    throw error;
  }
};

// Helper function to enhance tagged sellers info
const enhanceTaggedSellers = async (taggedSellers) => {
  const enhancedSellers = await Promise.all(taggedSellers.map(async (tag) => {
    const seller = await Seller.findById(tag.sellerId).select('firstName lastName storeName businessName stats storeAvatar');
    return {
      ...tag.toObject(),
      firstName: seller?.firstName,
      lastName: seller?.lastName,
      storeName: seller?.storeName,
      businessName: seller?.businessName,
      rating: seller?.stats?.averageRating || 0,
      totalReviews: seller?.stats?.totalReviews || 0,
      storeAvatar: seller?.storeAvatar?.url || null,
      fullName: seller ? `${seller.firstName} ${seller.lastName}` : null
    };
  }));
  return enhancedSellers;
};

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { title, body, tags, visibility } = req.body;
    const userId = req.user.id;
    const userModel = req.user.role;

    // Find the user
    const UserModel = mongoose.model(userModel);
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Process media files
    const mediaFiles = req.files || [];
    const images = [];
    const videos = [];

    // Handle images
    const imageFiles = mediaFiles.filter(file => file.mimetype.startsWith('image/'));
    for (let file of imageFiles) {
      const params = {
        Bucket: 'auqli-uploads',
        Key: `posts/${uuidv4()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      const uploadResult = await s3.upload(params).promise();
      images.push({
        url: uploadResult.Location,
        public_id: uploadResult.Key
      });
    }

    // Handle videos
    const videoFiles = mediaFiles.filter(file => file.mimetype.startsWith('video/'));
    for (let file of videoFiles) {
      const videoParams = {
        Bucket: 'auqli-uploads',
        Key: `posts/videos/${uuidv4()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      const videoUpload = await s3.upload(videoParams).promise();

      videos.push({
        url: videoUpload.Location,
        public_id: videoUpload.Key
      });
    }

    // Parse product IDs (handle both arrays and comma-separated strings)
    let productIds = [];
    if (req.body.productIds) {
      productIds = Array.isArray(req.body.productIds) 
        ? req.body.productIds 
        : req.body.productIds.split(',').map(id => id.trim());
    }

    // Format products array
    const products = productIds.map(productId => ({
      productId,
      taggedAt: new Date()
    }));

    // Parse tagged sellers (handle both arrays and JSON strings)
    let taggedSellers = [];
    if (req.body.taggedSellers) {
      const sellersData = typeof req.body.taggedSellers === 'string' 
        ? JSON.parse(req.body.taggedSellers) 
        : req.body.taggedSellers;

      taggedSellers = Array.isArray(sellersData) 
        ? sellersData.map(seller => ({ sellerId: seller.sellerId }))
        : [{ sellerId: sellersData.sellerId }];
    }

    // Parse tags
    const parsedTags = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : [];

    // Create new post
    const newPost = new Post({
      title,
      body,
      author: {
        userId: user._id,
        userModel,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        country: user.country,
        username: user.username,
        storeName: user.storeName,
        businessName: user.businessName
      },
      images,
      videos,
      products,
      taggedSellers,
      tags: parsedTags,
      visibility
    });

    await newPost.save();

    // Populate references for response
    const populatedPost = await Post.findById(newPost._id)
      .populate('products.productId', 'name images price')
      .populate('taggedSellers.sellerId', 'storeName businessName');

    res.status(201).json({
      message: 'Post created successfully',
      post: populatedPost
    });

  } catch (error) {
    console.error('Create post error:', error);
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

    // Get user information
    const UserModel = mongoose.model(userModel);
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove existing reaction from same user if exists
    post.reactions = post.reactions.filter(
      reaction => !(reaction.user.userId.equals(userId) && 
                   reaction.user.userModel === userModel)
    );

    // Add new reaction with user details
    post.reactions.push({
      type,
      user: {
        userId,
        userModel,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        storeName: userModel === 'Seller' ? user.storeName : undefined,
        username: userModel === 'Buyer' ? user.username : undefined
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

    // Get user information
    const UserModel = mongoose.model(userModel);
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add comment with user details
    const newComment = {
      content,
      author: {
        userId,
        userModel,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        storeName: userModel === 'Seller' ? user.storeName : undefined,
        username: userModel === 'Buyer' ? user.username : undefined
      },
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    res.json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

// Get comments for a post
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const comments = post.comments.slice(startIndex, endIndex);

    const enhancedComments = comments.map(comment => ({
      id: comment._id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.author.userId,
        name: comment.author.storeName || 
              comment.author.username || 
              `${comment.author.firstName} ${comment.author.lastName}`,
        image: comment.author.profileImage?.url || null,
        type: comment.author.userModel
      },
      likes: comment.likes?.length || 0
    }));

    res.json({
      comments: enhancedComments,
      totalComments: post.comments.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(post.comments.length / limit)
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
};

// Get reactions for a post
exports.getReactions = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10, type } = req.query;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    let reactions = post.reactions;
    if (type) {
      reactions = reactions.filter(reaction => reaction.type === type);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReactions = reactions.slice(startIndex, endIndex);

    const enhancedReactions = paginatedReactions.map(reaction => ({
      id: reaction._id,
      type: reaction.type,
      createdAt: reaction.createdAt,
      user: {
        id: reaction.user.userId,
        name: reaction.user.storeName || 
              reaction.user.username || 
              `${reaction.user.firstName} ${reaction.user.lastName}`,
        image: reaction.user.profileImage?.url || null,
        type: reaction.user.userModel
      }
    }));

    res.json({
      reactions: enhancedReactions,
      totalReactions: reactions.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(reactions.length / limit),
      reactionCounts: {
        like: reactions.filter(r => r.type === 'like').length,
        love: reactions.filter(r => r.type === 'love').length,
        laugh: reactions.filter(r => r.type === 'laugh').length,
        sad: reactions.filter(r => r.type === 'sad').length,
        angry: reactions.filter(r => r.type === 'angry').length
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch reactions',
      error: error.message
    });
  }
};

// Get all posts with enhanced author info
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, visibility = 'public' } = req.query;
    
    const posts = await Post.find({ visibility })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit * 1)
      .populate('products.productId', 'name price images category brand');

    const enhancedPosts = await Promise.all(posts.map(async post => {
      const enhancedTaggedSellers = await enhanceTaggedSellers(post.taggedSellers);
      
      return {
        ...post.toObject(),
        author: {
          id: post.author.userId,
          name: post.author.storeName || 
                post.author.username || 
                `${post.author.firstName} ${post.author.lastName}`,
          image: post.author.profileImage?.url || null,
          bio: post.author.bio || null,
          country: post.author.country,
          type: post.author.userModel,
          businessName: post.author.businessName || null,
          username: post.author.username || null
        },
        taggedSellers: enhancedTaggedSellers
      };
    }));

    const count = await Post.countDocuments({ visibility });

    res.json({
      posts: enhancedPosts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalPosts: count
    });
  } catch (error) {
    console.error('Error in getPosts:', error);
    res.status(500).json({
      message: 'Failed to fetch posts',
      error: error.message
    });
  }
};

// Get seller feed
exports.getSellerFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const sellerId = req.user.id;

    // Get seller's categories and interests
    const seller = await Seller.findById(sellerId).select('categories');
    const sellerCategories = seller.categories.map(cat => cat.name);

    // Find posts that match seller's interests
    const posts = await Post.find({
      visibility: 'public',
      $or: [
        { 'products.productId': { $in: await Product.find({ category: { $in: sellerCategories } }).select('_id') } },
        { tags: { $in: sellerCategories } }
      ]
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit * 1)
      .populate({
        path: 'author.userId',
        select: 'firstName lastName storeName businessName profileImage bio country',
        model: (doc) => doc.author.userModel
      })
      .populate('products.productId', 'name price images category brand');

    const enhancedPosts = posts.map(post => ({
      ...post.toObject(),
      author: {
        id: post.author.userId._id,
        name: post.author.userId.storeName || 
              `${post.author.userId.firstName} ${post.author.userId.lastName}`,
        image: post.author.userId.profileImage?.url || null,
        bio: post.author.userId.bio || null,
        country: post.author.userId.country,
        type: post.author.userModel
      }
    }));

    const count = await Post.countDocuments({
      visibility: 'public',
      $or: [
        { 'products.productId': { $in: await Product.find({ category: { $in: sellerCategories } }).select('_id') } },
        { tags: { $in: sellerCategories } }
      ]
    });

    res.json({
      posts: enhancedPosts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalPosts: count,
      isPersonalized: true
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch seller feed',
      error: error.message
    });
  }
};

// Get buyer feed
exports.getBuyerFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const buyerId = req.user.id;

    // Get buyer's selected categories and interests
    const buyer = await Buyer.findById(buyerId).select('selectedCategories');
    const buyerCategories = buyer.selectedCategories.map(cat => cat.name);

    // Find posts that match buyer's interests
    const posts = await Post.find({
      visibility: 'public',
      $or: [
        { 'products.productId': { $in: await Product.find({ category: { $in: buyerCategories } }).select('_id') } },
        { tags: { $in: buyerCategories } }
      ]
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit * 1)
      .populate({
        path: 'author.userId',
        select: 'firstName lastName storeName businessName profileImage bio country',
        model: (doc) => doc.author.userModel
      })
      .populate('products.productId', 'name price images category brand');

    const enhancedPosts = posts.map(post => ({
      ...post.toObject(),
      author: {
        id: post.author.userId._id,
        name: post.author.userId.storeName || 
              `${post.author.userId.firstName} ${post.author.userId.lastName}`,
        image: post.author.userId.profileImage?.url || null,
        bio: post.author.userId.bio || null,
        country: post.author.userId.country,
        type: post.author.userModel
      }
    }));

    const count = await Post.countDocuments({
      visibility: 'public',
      $or: [
        { 'products.productId': { $in: await Product.find({ category: { $in: buyerCategories } }).select('_id') } },
        { tags: { $in: buyerCategories } }
      ]
    });

    res.json({
      posts: enhancedPosts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalPosts: count,
      isPersonalized: true
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch buyer feed',
      error: error.message
    });
  }
};

// Get user's posts (can be either seller or buyer)
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, visibility = 'public' } = req.query;

    // First determine if the user is a seller or buyer
    let userModel = 'Seller';
    let user = await Seller.findById(userId);
    if (!user) {
      user = await Buyer.findById(userId);
      if (user) {
        userModel = 'Buyer';
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    const posts = await Post.find({
      'author.userId': userId,
      'author.userModel': userModel,
      visibility
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit * 1)
      .populate({
        path: 'author.userId',
        select: 'firstName lastName storeName businessName profileImage bio country',
        model: userModel
      })
      .populate('products.productId', 'name price images category brand');

    const enhancedPosts = posts.map(post => ({
      ...post.toObject(),
      author: {
        id: post.author.userId._id,
        name: post.author.userId.storeName || 
              `${post.author.userId.firstName} ${post.author.userId.lastName}`,
        image: post.author.userId.profileImage?.url || null,
        bio: post.author.userId.bio || null,
        country: post.author.userId.country,
        type: userModel
      },
      products: post.products?.map(product => ({
        id: product.productId?._id,
        name: product.productId?.name,
        price: product.productId?.price,
        images: product.productId?.images,
        category: product.productId?.category,
        brand: product.productId?.brand
      }))
    }));

    const count = await Post.countDocuments({
      'author.userId': userId,
      'author.userModel': userModel,
      visibility
    });

    res.json({
      posts: enhancedPosts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalPosts: count,
      authorInfo: {
        id: user._id,
        name: user.storeName || `${user.firstName} ${user.lastName}`,
        image: user.profileImage?.url || null,
        bio: user.bio || null,
        country: user.country,
        type: userModel
      }
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

// Like/Unlike a post
exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const userModel = req.user.role;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get user information
    const UserModel = mongoose.model(userModel);
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize reactions array if it doesn't exist
    if (!post.reactions) {
      post.reactions = [];
    }

    // Check if already liked
    const existingReactionIndex = post.reactions.findIndex(
      reaction => 
        reaction.user.userId.toString() === userId.toString() && 
        reaction.user.userModel === userModel
    );

    if (existingReactionIndex > -1) {
      // Remove existing reaction
      post.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add new reaction
      post.reactions.push({
        type: 'like',
        user: {
          userId,
          userModel,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
          storeName: userModel === 'Seller' ? user.storeName : undefined,
          username: userModel === 'Buyer' ? user.username : undefined
        }
      });
    }

    await post.save();

    res.json({
      message: existingReactionIndex > -1 ? 'Post unliked' : 'Post liked',
      likeCount: post.reactions.filter(r => r.type === 'like').length
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      message: 'Failed to like/unlike post',
      error: error.message
    });
  }
};

// Dislike a post
exports.dislikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const userModel = req.user.role;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if already disliked
    const alreadyDisliked = post.dislikes.some(dislike => 
      dislike.userId.equals(userId) && dislike.userModel === userModel
    );

    if (alreadyDisliked) {
      // Remove dislike
      post.dislikes = post.dislikes.filter(dislike => 
        !(dislike.userId.equals(userId) && dislike.userModel === userModel)
      );
    } else {
      // Remove from likes if exists
      post.likes = post.likes.filter(like => 
        !(like.userId.equals(userId) && like.userModel === userModel)
      );
      // Add dislike
      post.dislikes.push({ userId, userModel });
    }

    await post.save();

    res.json({
      message: alreadyDisliked ? 'Post undisliked' : 'Post disliked',
      likes: post.stats.likeCount,
      dislikes: post.stats.dislikeCount
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to dislike/undislike post',
      error: error.message
    });
  }
};

// Get trending posts
exports.getTrendingPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const posts = await Post.aggregate([
      { $match: { visibility: 'public' } },
      {
        $addFields: {
          safeReactions: { $ifNull: ['$reactions', []] },
          likeCount: {
            $size: {
              $filter: {
                input: { $ifNull: ['$reactions', []] },
                as: 'reaction',
                cond: { $eq: ['$$reaction.type', 'like'] }
              }
            }
          },
          commentCount: {
            $size: { $ifNull: ['$comments', []] }
          }
        }
      },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ['$likeCount', 2] },
              { $multiply: ['$commentCount', 3] },
              { $multiply: ['$stats.viewCount', 1] },
              { $multiply: ['$stats.shareCount', 3] }
            ]
          }
        }
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    // Populate products data
    await Post.populate(posts, {
      path: 'products.productId',
      select: 'name price images category brand'
    });

    const enhancedPosts = await Promise.all(posts.map(async post => {
      const enhancedTaggedSellers = await enhanceTaggedSellers(post.taggedSellers);
      
      return {
        ...post,
        taggedSellers: enhancedTaggedSellers,
        author: {
          id: post.author.userId,
          name: post.author.storeName || 
                post.author.username || 
                `${post.author.firstName} ${post.author.lastName}`,
          image: post.author.profileImage?.url || null,
          bio: post.author.bio || null,
          country: post.author.country,
          type: post.author.userModel
        },
        products: post.products?.map(product => ({
          id: product.productId?._id,
          name: product.productId?.name,
          price: product.productId?.price,
          images: product.productId?.images,
          category: product.productId?.category,
          brand: product.productId?.brand
        })),
        stats: {
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          viewCount: post.stats?.viewCount || 0,
          shareCount: post.stats?.shareCount || 0
        }
      };
    }));

    const count = await Post.countDocuments({ visibility: 'public' });

    res.json({
      posts: enhancedPosts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalPosts: count
    });
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({
      message: 'Failed to fetch trending posts',
      error: error.message
    });
  }
};

// Get new posts
exports.getNewPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const posts = await Post.find({ visibility: 'public' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('products.productId', 'name price images category brand');

    const enhancedPosts = await Promise.all(posts.map(async post => {
      const enhancedTaggedSellers = await enhanceTaggedSellers(post.taggedSellers);
      
      return {
        ...post.toObject(),
        taggedSellers: enhancedTaggedSellers,
        author: {
          id: post.author.userId,
          name: post.author.storeName || 
                post.author.username || 
                `${post.author.firstName} ${post.author.lastName}`,
          image: post.author.profileImage?.url || null,
          bio: post.author.bio || null,
          country: post.author.country,
          type: post.author.userModel
        },
        products: post.products?.map(product => ({
          id: product.productId?._id,
          name: product.productId?.name,
          price: product.productId?.price,
          images: product.productId?.images,
          category: product.productId?.category,
          brand: product.productId?.brand
        }))
      };
    }));

    const count = await Post.countDocuments({ visibility: 'public' });

    res.json({
      posts: enhancedPosts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalPosts: count
    });
  } catch (error) {
    console.error('Get new posts error:', error);
    res.status(500).json({
      message: 'Failed to fetch new posts',
      error: error.message
    });
  }
}; 