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
const sgMail = require('../config/sendgrid');
const notificationController = require('./notificationController');

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
              Bucket: process.env.CDN_S3_BUCKET,
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

// Define reaction types constant
const REACTION_TYPES = {
  like: { emoji: "👍", label: "Like" },
  love: { emoji: "❤️", label: "Love" },
  haha: { emoji: "😂", label: "Haha" },
  wow: { emoji: "😮", label: "Wow" },
  sad: { emoji: "😢", label: "Sad" },
  angry: { emoji: "😡", label: "Angry" }
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
        Bucket: process.env.CDN_S3_BUCKET,
        Key: `posts/${uuidv4()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      const uploadResult = await s3.upload(params).promise();
      images.push({
        url: `https://` + process.env.CDN_URL + `/${uploadResult.Key}`,
        public_id: uploadResult.Key
      });
    }

    // Handle videos
    const videoFiles = mediaFiles.filter(file => file.mimetype.startsWith('video/'));
    for (let file of videoFiles) {
      const videoParams = {
        Bucket: process.env.CDN_S3_BUCKET,
        Key: `posts/videos/${uuidv4()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      const videoUpload = await s3.upload(videoParams).promise();

      videos.push({
        url: `https://` + process.env.CDN_URL + `/${videoUpload.Key}`,
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

    // Validate reaction type
    if (!REACTION_TYPES[type]) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get user information with profile image
    const UserModel = mongoose.model(userModel);
    const user = await UserModel.findById(userId)
      .select('firstName lastName storeName businessName profileImage storeAvatar username');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the appropriate profile image based on user type
    const profileImageUrl = userModel === 'Seller' 
      ? user.storeAvatar?.url || user.profileImage?.url
      : user.profileImage?.url;

    // Create the user reaction object
    const userReactionData = {
      userId,
      userModel,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: { url: profileImageUrl },
      storeName: userModel === 'Seller' ? user.storeName : undefined,
      username: userModel === 'Buyer' ? user.username : undefined
    };

    // Check if user already reacted
    const existingReactionIndex = post.reactions.findIndex(
      reaction => 
        reaction.user.userId.toString() === userId.toString() && 
        reaction.user.userModel === userModel
    );

    let isNewReaction = false;
    
    if (existingReactionIndex > -1) {
      const existingReaction = post.reactions[existingReactionIndex];
      
      // If same reaction type, remove it (toggle off)
      if (existingReaction.type === type) {
        post.reactions.splice(existingReactionIndex, 1);
      } else {
        // If different reaction type, update it
        post.reactions[existingReactionIndex] = {
          type,
          emoji: REACTION_TYPES[type].emoji,
          user: userReactionData,
          createdAt: new Date()
        };
        isNewReaction = true;
      }
    } else {
      // Add new reaction with emoji
      post.reactions.push({
        type,
        emoji: REACTION_TYPES[type].emoji,
        user: userReactionData,
        createdAt: new Date()
      });
      isNewReaction = true;
    }

    await post.save();

    // Send notification to post author if it's a new reaction and author is a buyer
    if (isNewReaction && post.author.userModel === 'Buyer' && post.author.userId.toString() !== userId.toString()) {
      try {
        const userName = userModel === 'Seller' ? user.storeName : `${user.firstName} ${user.lastName}`;
        
        await notificationController.createBuyerNotification(
          post.author.userId,
          'post_reaction',
          {
            postId: post._id,
            postTitle: post.title.substring(0, 30) + (post.title.length > 30 ? '...' : ''),
            userName,
            userImage: profileImageUrl,
            reactionType: REACTION_TYPES[type].label
          }
        );
      } catch (notificationError) {
        console.error('Error sending reaction notification:', notificationError);
        // Continue execution even if notification fails
      }
    }

    // Return updated reaction counts
    res.json({
      message: 'Reaction updated successfully',
      reactionCounts: post.stats.reactions,
      userReaction: existingReactionIndex > -1 && post.reactions[existingReactionIndex]?.type === type 
        ? null 
        : type
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      message: 'Failed to update reaction',
      error: error.message
    });
  }
};

// Add comment to post
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, taggedSellers, taggedProducts } = req.body;
    const userId = req.user.id;
    const userModel = req.user.role;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get user information with profile image
    const UserModel = mongoose.model(userModel);
    const user = await UserModel.findById(userId)
      .select('firstName lastName storeName businessName profileImage storeAvatar username');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the appropriate profile image based on user type
    const profileImageUrl = userModel === 'Seller' 
      ? user.storeAvatar?.url || user.profileImage?.url
      : user.profileImage?.url;

    // Process tagged sellers
    let processedTaggedSellers = [];
    if (taggedSellers && taggedSellers.length > 0) {
      // Fetch seller details for each tagged seller
      const sellerIds = Array.isArray(taggedSellers) 
        ? taggedSellers 
        : JSON.parse(taggedSellers);
      
      const sellers = await Seller.find({ _id: { $in: sellerIds } })
        .select('_id storeName');
      
      processedTaggedSellers = sellers.map(seller => ({
        sellerId: seller._id,
        storeName: seller.storeName,
        taggedAt: new Date()
      }));
    }

    // Process tagged products
    let processedTaggedProducts = [];
    if (taggedProducts && taggedProducts.length > 0) {
      // Fetch product details for each tagged product
      const productIds = Array.isArray(taggedProducts) 
        ? taggedProducts 
        : JSON.parse(taggedProducts);
      
      const products = await Product.find({ _id: { $in: productIds } })
        .select('_id name');
      
      processedTaggedProducts = products.map(product => ({
        productId: product._id,
        name: product.name,
        taggedAt: new Date()
      }));
    }

    // Add comment with user details including profile image
    const newComment = {
      content,
      author: {
        userId,
        userModel,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: { url: profileImageUrl },
        storeName: userModel === 'Seller' ? user.storeName : undefined,
        username: userModel === 'Buyer' ? user.username : undefined
      },
      taggedSellers: processedTaggedSellers,
      taggedProducts: processedTaggedProducts,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    // Send notification to post author if the author is a buyer and not the commenter
    if (post.author.userModel === 'Buyer' && post.author.userId.toString() !== userId.toString()) {
      try {
        const userName = userModel === 'Seller' ? user.storeName : `${user.firstName} ${user.lastName}`;
        // Create a comment preview (truncate if too long)
        const commentPreview = content.length > 50 ? content.substring(0, 47) + '...' : content;
        
        await notificationController.createBuyerNotification(
          post.author.userId,
          'post_comment',
          {
            postId: post._id,
            postTitle: post.title.substring(0, 30) + (post.title.length > 30 ? '...' : ''),
            userName,
            userImage: profileImageUrl,
            commentId: post.comments[post.comments.length - 1]._id,
            commentPreview
          }
        );
      } catch (notificationError) {
        console.error('Error sending comment notification:', notificationError);
        // Continue execution even if notification fails
      }
    }

    res.json({
      message: 'Comment added successfully',
      comment: {
        ...newComment,
        author: {
          id: userId,
          name: userModel === 'Seller' ? user.storeName : 
                `${user.firstName} ${user.lastName}`,
          image: profileImageUrl || null,
          type: userModel
        }
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
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

    const post = await Post.findById(postId)
      .populate({
        path: 'comments.author.userId',
        select: 'firstName lastName storeName businessName profileImage storeAvatar username',
        refPath: 'comments.author.userModel'
      })
      .populate({
        path: 'comments.replies.author.userId',
        select: 'firstName lastName storeName businessName profileImage storeAvatar username',
        refPath: 'comments.replies.author.userModel'
      })
      .populate({
        path: 'comments.taggedSellers.sellerId',
        select: 'storeName businessName storeAvatar',
        model: 'Seller'
      })
      .populate({
        path: 'comments.taggedProducts.productId',
        select: 'name images price',
        model: 'Product'
      })
      .populate({
        path: 'comments.replies.taggedSellers.sellerId',
        select: 'storeName businessName storeAvatar',
        model: 'Seller'
      })
      .populate({
        path: 'comments.replies.taggedProducts.productId',
        select: 'name images price',
        model: 'Product'
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const comments = post.comments.slice(startIndex, endIndex);

    const enhancedComments = comments.map(comment => {
      // Get the appropriate profile image based on user type
      const profileImageUrl = comment.author.userModel === 'Seller' 
        ? comment.author.userId?.storeAvatar?.url || comment.author.userId?.profileImage?.url
        : comment.author.userId?.profileImage?.url;

      // Format tagged sellers
      const formattedTaggedSellers = comment.taggedSellers?.map(tag => ({
        id: tag.sellerId._id,
        storeName: tag.sellerId.storeName || tag.storeName,
        businessName: tag.sellerId.businessName,
        image: tag.sellerId.storeAvatar?.url || null,
        taggedAt: tag.taggedAt
      })) || [];

      // Format tagged products
      const formattedTaggedProducts = comment.taggedProducts?.map(tag => ({
        id: tag.productId._id,
        name: tag.productId.name || tag.name,
        image: tag.productId.images?.[0]?.url || null,
        price: tag.productId.price,
        taggedAt: tag.taggedAt
      })) || [];

      // Process replies
      const enhancedReplies = comment.replies.map(reply => {
        const replyProfileImageUrl = reply.author.userModel === 'Seller' 
          ? reply.author.userId?.storeAvatar?.url || reply.author.userId?.profileImage?.url
          : reply.author.userId?.profileImage?.url;

        // Format reply tagged sellers
        const replyFormattedTaggedSellers = reply.taggedSellers?.map(tag => ({
          id: tag.sellerId._id,
          storeName: tag.sellerId.storeName || tag.storeName,
          businessName: tag.sellerId.businessName,
          image: tag.sellerId.storeAvatar?.url || null,
          taggedAt: tag.taggedAt
        })) || [];

        // Format reply tagged products
        const replyFormattedTaggedProducts = reply.taggedProducts?.map(tag => ({
          id: tag.productId._id,
          name: tag.productId.name || tag.name,
          image: tag.productId.images?.[0]?.url || null,
          price: tag.productId.price,
          taggedAt: tag.taggedAt
        })) || [];

        return {
          id: reply._id,
          content: reply.content,
          createdAt: reply.createdAt,
          author: {
            id: reply.author.userId?._id || reply.author.userId,
            name: reply.author.userId?.storeName || 
                  reply.author.userId?.username || 
                  `${reply.author.userId?.firstName || reply.author.firstName} ${reply.author.userId?.lastName || reply.author.lastName}`,
            image: replyProfileImageUrl || null,
            type: reply.author.userModel
          },
          likes: reply.likes?.length || 0,
          taggedSellers: replyFormattedTaggedSellers,
          taggedProducts: replyFormattedTaggedProducts
        };
      });

      return {
        id: comment._id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: {
          id: comment.author.userId._id,
          name: comment.author.userId?.storeName || 
                comment.author.userId?.username || 
                `${comment.author.userId?.firstName} ${comment.author.userId?.lastName}`,
          image: profileImageUrl || null,
          type: comment.author.userModel
        },
        likes: comment.likes?.length || 0,
        replies: enhancedReplies,
        repliesCount: comment.replies?.length || 0,
        taggedSellers: formattedTaggedSellers,
        taggedProducts: formattedTaggedProducts
      };
    });

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

    const post = await Post.findById(postId)
      .populate({
        path: 'reactions.user.userId',
        select: 'firstName lastName storeName businessName profileImage storeAvatar username',
        refPath: 'reactions.user.userModel'
      });

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

    const enhancedReactions = paginatedReactions.map(reaction => {
      // Get the appropriate profile image based on user type
      const profileImageUrl = reaction.user.userModel === 'Seller' 
        ? reaction.user.userId?.storeAvatar?.url || reaction.user.userId?.profileImage?.url
        : reaction.user.userId?.profileImage?.url;

      return {
        id: reaction._id,
        type: reaction.type,
        emoji: reaction.emoji,
        label: REACTION_TYPES[reaction.type].label,
        createdAt: reaction.createdAt,
        user: {
          id: reaction.user.userId._id,
          name: reaction.user.storeName || 
                reaction.user.username || 
                `${reaction.user.firstName} ${reaction.user.lastName}`,
          image: profileImageUrl || null,
          type: reaction.user.userModel
        }
      };
    });

    res.json({
      reactions: enhancedReactions,
      totalReactions: reactions.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(reactions.length / limit),
      reactionCounts: post.stats.reactions
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
      .populate('products.productId', 'name price images category brand')
      .populate({
        path: 'author.userId',
        select: 'firstName lastName storeName businessName profileImage storeAvatar bio country',
        refPath: 'author.userModel'
      });

    const enhancedPosts = await Promise.all(posts.map(async post => {
      const enhancedTaggedSellers = await enhanceTaggedSellers(post.taggedSellers);
      
      // Get the appropriate profile image based on user type
      const profileImageUrl = post.author.userModel === 'Seller' 
        ? post.author.userId?.storeAvatar?.url || post.author.userId?.profileImage?.url
        : post.author.userId?.profileImage?.url;
      
      return {
        ...post.toObject(),
        author: {
          id: post.author.userId?._id,
          name: post.author.userId?.storeName || 
                post.author.userId?.username || 
                `${post.author.userId?.firstName} ${post.author.userId?.lastName}`,
          image: profileImageUrl || null,
          bio: post.author.userId?.bio || null,
          country: post.author.userId?.country,
          type: post.author.userModel,
          businessName: post.author.userId?.businessName || null,
          username: post.author.userId?.username || null
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
          Bucket: process.env.CDN_S3_BUCKET,
          Key: `posts/${uuidv4()}-${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const uploadResult = await s3.upload(params).promise();
        imagesData.push({
          url: `https://` + process.env.CDN_URL + `/${uploadResult.Key}`,
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
          Bucket: process.env.CDN_S3_BUCKET,
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

// Like or unlike a comment
exports.likeComment = async (req, res) => {
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

    // Check if user has already liked the comment
    const likeIndex = comment.likes.findIndex(
      like => like.userId.toString() === userId && like.userModel === userModel
    );

    if (likeIndex === -1) {
      // User hasn't liked the comment yet, add like
      comment.likes.push({
        userId,
        userModel,
        createdAt: new Date()
      });
      await post.save();
      return res.json({ 
        message: 'Comment liked successfully',
        liked: true,
        likesCount: comment.likes.length
      });
    } else {
      // User already liked the comment, remove like
      comment.likes.splice(likeIndex, 1);
      await post.save();
      return res.json({ 
        message: 'Comment unliked successfully',
        liked: false,
        likesCount: comment.likes.length
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Failed to like/unlike comment',
      error: error.message
    });
  }
};

// Reply to a comment
exports.replyToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content, taggedSellers, taggedProducts } = req.body;
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

    // Get user information with profile image
    const UserModel = mongoose.model(userModel);
    const user = await UserModel.findById(userId)
      .select('firstName lastName storeName businessName profileImage storeAvatar username');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the appropriate profile image based on user type
    const profileImageUrl = userModel === 'Seller' 
      ? user.storeAvatar?.url || user.profileImage?.url
      : user.profileImage?.url;

    // Process tagged sellers
    let processedTaggedSellers = [];
    if (taggedSellers && taggedSellers.length > 0) {
      // Fetch seller details for each tagged seller
      const sellerIds = Array.isArray(taggedSellers) 
        ? taggedSellers 
        : JSON.parse(taggedSellers);
      
      const sellers = await Seller.find({ _id: { $in: sellerIds } })
        .select('_id storeName');
      
      processedTaggedSellers = sellers.map(seller => ({
        sellerId: seller._id,
        storeName: seller.storeName,
        taggedAt: new Date()
      }));
    }

    // Process tagged products
    let processedTaggedProducts = [];
    if (taggedProducts && taggedProducts.length > 0) {
      // Fetch product details for each tagged product
      const productIds = Array.isArray(taggedProducts) 
        ? taggedProducts 
        : JSON.parse(taggedProducts);
      
      const products = await Product.find({ _id: { $in: productIds } })
        .select('_id name');
      
      processedTaggedProducts = products.map(product => ({
        productId: product._id,
        name: product.name,
        taggedAt: new Date()
      }));
    }

    // Create new reply
    const newReply = {
      content,
      author: {
        userId,
        userModel,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: { url: profileImageUrl },
        storeName: userModel === 'Seller' ? user.storeName : undefined,
        username: userModel === 'Buyer' ? user.username : undefined
      },
      taggedSellers: processedTaggedSellers,
      taggedProducts: processedTaggedProducts,
      createdAt: new Date()
    };

    // Add reply to comment
    comment.replies.push(newReply);
    await post.save();

    // Send notification to the comment author (if not the same as the replier)
    // Only send notification if the comment author is a buyer
    if (comment.author.userModel === 'Buyer' && 
        !(comment.author.userId.toString() === userId && comment.author.userModel === userModel)) {
      try {
        const userName = userModel === 'Seller' ? user.storeName : `${user.firstName} ${user.lastName}`;
        // Create a reply preview (truncate if too long)
        const replyPreview = content.length > 50 ? content.substring(0, 47) + '...' : content;
        
        await notificationController.createBuyerNotification(
          comment.author.userId,
          'post_comment_reply',
          {
            postId: post._id,
            commentId: comment._id,
            replyId: comment.replies[comment.replies.length - 1]._id,
            postTitle: post.title.substring(0, 30) + (post.title.length > 30 ? '...' : ''),
            userName,
            userImage: profileImageUrl,
            replyPreview
          }
        );
      } catch (notificationError) {
        console.error('Error sending comment reply notification:', notificationError);
        // Continue execution even if notification fails
      }
    }

    // Send notification to post author as well (if different from comment author and reply author)
    if (post.author.userModel === 'Buyer' && 
        !(post.author.userId.toString() === userId && post.author.userModel === userModel) &&
        !(post.author.userId.toString() === comment.author.userId.toString() && 
          post.author.userModel === comment.author.userModel)) {
      try {
        const userName = userModel === 'Seller' ? user.storeName : `${user.firstName} ${user.lastName}`;
        // Create a reply preview (truncate if too long)
        const replyPreview = content.length > 50 ? content.substring(0, 47) + '...' : content;
        
        await notificationController.createBuyerNotification(
          post.author.userId,
          'post_comment_reply',
          {
            postId: post._id,
            commentId: comment._id,
            replyId: comment.replies[comment.replies.length - 1]._id,
            postTitle: post.title.substring(0, 30) + (post.title.length > 30 ? '...' : ''),
            userName,
            userImage: profileImageUrl,
            replyPreview
          }
        );
      } catch (notificationError) {
        console.error('Error sending comment reply notification to post author:', notificationError);
        // Continue execution even if notification fails
      }
    }

    res.json({
      message: 'Reply added successfully',
      reply: {
        ...newReply,
        author: {
          id: userId,
          name: userModel === 'Seller' ? user.storeName : 
                `${user.firstName} ${user.lastName}`,
          image: profileImageUrl || null,
          type: userModel
        },
        likes: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to add reply',
      error: error.message
    });
  }
};

// Like or unlike a reply
exports.likeReply = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.params;
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

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    // Check if user has already liked the reply
    const likeIndex = reply.likes.findIndex(
      like => like.userId.toString() === userId && like.userModel === userModel
    );

    if (likeIndex === -1) {
      // User hasn't liked the reply yet, add like
      reply.likes.push({
        userId,
        userModel,
        createdAt: new Date()
      });
      await post.save();
      return res.json({ 
        message: 'Reply liked successfully',
        liked: true,
        likesCount: reply.likes.length
      });
    } else {
      // User already liked the reply, remove like
      reply.likes.splice(likeIndex, 1);
      await post.save();
      return res.json({ 
        message: 'Reply unliked successfully',
        liked: false,
        likesCount: reply.likes.length
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Failed to like/unlike reply',
      error: error.message
    });
  }
};

// Delete a reply
exports.deleteReply = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.params;
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

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    // Check if user is reply author, comment author, or post author
    const isReplyAuthor = reply.author.userId.equals(userId) && reply.author.userModel === userModel;
    const isCommentAuthor = comment.author.userId.equals(userId) && comment.author.userModel === userModel;
    const isPostAuthor = post.author.userId.equals(userId) && post.author.userModel === userModel;
    
    if (!(isReplyAuthor || isCommentAuthor || isPostAuthor)) {
      return res.status(403).json({ message: 'Unauthorized to delete this reply' });
    }

    reply.remove();
    await post.save();

    res.json({ message: 'Reply deleted successfully' });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete reply',
      error: error.message
    });
  }
};

exports.getTrendingPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, period = 'week' } = req.query;

    // Calculate date threshold based on period
    const dateThreshold = new Date();
    switch (period) {
      case 'day':
        dateThreshold.setDate(dateThreshold.getDate() - 1);
        break;
      case 'month':
        dateThreshold.setMonth(dateThreshold.getMonth() - 1);
        break;
      default: // week
        dateThreshold.setDate(dateThreshold.getDate() - 7);
    }

    // Find trending posts with proper population
    const posts = await Post.find({
      visibility: 'public',
      createdAt: { $gte: dateThreshold }
    })
      .sort({
        'stats.likeCount': -1,
        'stats.viewCount': -1,
        'stats.shareCount': -1,
        createdAt: -1
      })
      .skip((page - 1) * limit)
      .limit(limit * 1)
      .populate({
        path: 'author.userId',
        select: 'firstName lastName storeName businessName profileImage bio country',
        refPath: 'author.userModel'
      })
      .populate('products.productId', 'name price images category brand')
      .populate({
        path: 'taggedSellers.sellerId',
        select: 'firstName lastName storeName businessName profileImage stats storeAvatar',
        model: 'Seller'
      });

    // Enhance posts with formatted data
    const enhancedPosts = posts.map(post => {
      // Safely handle tagged sellers with complete information
      const enhancedTaggedSellers = post.taggedSellers?.map(tag => ({
        sellerId: tag.sellerId?._id,
        _id: tag._id,
        taggedAt: tag.taggedAt,
        firstName: tag.sellerId?.firstName,
        lastName: tag.sellerId?.lastName,
        storeName: tag.sellerId?.storeName,
        businessName: tag.sellerId?.businessName,
        rating: tag.sellerId?.stats?.averageRating || 0,
        totalReviews: tag.sellerId?.stats?.totalReviews || 0,
        storeAvatar: tag.sellerId?.storeAvatar?.url || tag.sellerId?.profileImage?.url,
        fullName: `${tag.sellerId?.firstName} ${tag.sellerId?.lastName}`
      })) || [];

      // Safely handle products
      const enhancedProducts = post.products?.map(product => ({
        id: product.productId?._id || null,
        name: product.productId?.name || null,
        price: product.productId?.price || null,
        images: product.productId?.images || [],
        category: product.productId?.category || null,
        brand: product.productId?.brand || null
      })) || [];

      return {
        ...post.toObject(),
        products: enhancedProducts,
        author: {
          id: post.author.userId?._id,
          name: post.author.userId?.storeName || 
                `${post.author.userId?.firstName} ${post.author.userId?.lastName}`,
          image: post.author.userId?.profileImage?.url || null,
          bio: post.author.userId?.bio || null,
          country: post.author.userId?.country,
          type: post.author.userModel,
          businessName: post.author.userId?.businessName || null,
          username: post.author.userId?.username || null
        },
        taggedSellers: enhancedTaggedSellers
      };
    });

    const count = await Post.countDocuments({
      visibility: 'public',
      createdAt: { $gte: dateThreshold }
    });

    res.json({
      posts: enhancedPosts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalPosts: count
    });

  } catch (error) {
    console.error('Error in getTrendingPosts:', error);
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

// Search posts
exports.searchPosts = async (req, res) => {
  try {
    const { 
      q = '', 
      category, 
      seller, 
      page = 1, 
      limit = 10,
      sortBy = 'recent'
    } = req.query;

    // Build search query
    const searchQuery = {
      visibility: 'public',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { body: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ]
    };

    // Add category filter if provided
    if (category) {
      searchQuery['products.productId'] = {
        $in: await Product.find({ category }).select('_id')
      };
    }

    // Add seller filter if provided
    if (seller) {
      searchQuery['author.userId'] = seller;
      searchQuery['author.userModel'] = 'Seller';
    }

    // Determine sort order
    const sortOptions = sortBy === 'popular' 
      ? { 'stats.viewCount': -1, 'stats.reactions.like': -1 }
      : { createdAt: -1 };

    // Execute search query with pagination
    const posts = await Post.find(searchQuery)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit * 1)
      .populate({
        path: 'author.userId',
        select: 'firstName lastName storeName businessName profileImage storeAvatar bio country',
        refPath: 'author.userModel'
      })
      .populate('products.productId', 'name price images category brand');

    // Enhance posts with formatted data
    const enhancedPosts = await Promise.all(posts.map(async post => {
      const enhancedTaggedSellers = await enhanceTaggedSellers(post.taggedSellers);
      
      // Get the appropriate profile image based on user type
      const profileImageUrl = post.author.userModel === 'Seller' 
        ? post.author.userId?.storeAvatar?.url || post.author.userId?.profileImage?.url
        : post.author.userId?.profileImage?.url;
      
      return {
        ...post.toObject(),
        author: {
          id: post.author.userId?._id,
          name: post.author.userId?.storeName || 
                post.author.userId?.username || 
                `${post.author.userId?.firstName} ${post.author.userId?.lastName}`,
          image: profileImageUrl || null,
          bio: post.author.userId?.bio || null,
          country: post.author.userId?.country,
          type: post.author.userModel,
          businessName: post.author.userId?.businessName || null,
          username: post.author.userId?.username || null
        },
        taggedSellers: enhancedTaggedSellers
      };
    }));

    // Get total count for pagination
    const count = await Post.countDocuments(searchQuery);

    res.json({
      posts: enhancedPosts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalPosts: count
    });

  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({
      message: 'Failed to search posts',
      error: error.message
    });
  }
};

// Delete multiple posts for a user
exports.deleteBatchPosts = async (req, res) => {
  try {
    const { userType, userId } = req.params;
    const { postIds } = req.body;
    
    // Verify user authorization
    if (req.user.id !== userId || req.user.role !== userType) {
      return res.status(401).json({ message: 'Unauthorized to delete these posts' });
    }

    // Find all posts that match the criteria
    const posts = await Post.find({
      _id: { $in: postIds },
      'author.userId': userId,
      'author.userModel': userType
    });

    if (!posts.length) {
      return res.status(404).json({ message: 'No posts found' });
    }

    // Collect all image public_ids for S3 deletion
    const imagePublicIds = posts.reduce((acc, post) => {
      const postImageIds = post.images.map(img => img.public_id);
      return [...acc, ...postImageIds];
    }, []);

    // Delete images from S3
    if (imagePublicIds.length > 0) {
      const deletePromises = imagePublicIds.map(public_id => {
        const params = {
          Bucket: process.env.CDN_S3_BUCKET,
          Key: public_id
        };
        return s3.deleteObject(params).promise();
      });
      await Promise.all(deletePromises);
    }

    // Delete all matching posts
    await Post.deleteMany({
      _id: { $in: postIds },
      'author.userId': userId,
      'author.userModel': userType
    });

    res.json({
      message: 'Posts deleted successfully',
      deletedCount: posts.length
    });

  } catch (error) {
    console.error('Delete batch posts error:', error);
    res.status(500).json({
      message: 'Failed to delete posts',
      error: error.message
    });
  }
};

// Update multiple posts for a user
exports.updateBatchPosts = async (req, res) => {
  try {
    const { userType, userId } = req.params;
    const { updates } = req.body;

    // Verify user authorization
    if (req.user.id !== userId || req.user.role !== userType) {
      return res.status(401).json({ message: 'Unauthorized to update these posts' });
    }

    const updateResults = await Promise.all(
      updates.map(async update => {
        try {
          const post = await Post.findOne({
            _id: update.postId,
            'author.userId': userId,
            'author.userModel': userType
          });

          if (!post) {
            return {
              postId: update.postId,
              success: false,
              message: 'Post not found'
            };
          }

          // Update only provided fields
          if (update.title) post.title = update.title;
          if (update.body) post.body = update.body;
          if (update.visibility) post.visibility = update.visibility;
          if (update.tags) post.tags = update.tags;
          
          post.updatedAt = Date.now();
          await post.save();

          return {
            postId: update.postId,
            success: true,
            message: 'Post updated successfully'
          };
        } catch (error) {
          return {
            postId: update.postId,
            success: false,
            message: error.message
          };
        }
      })
    );

    const successCount = updateResults.filter(result => result.success).length;

    res.json({
      message: `Updated ${successCount} out of ${updates.length} posts`,
      results: updateResults
    });

  } catch (error) {
    console.error('Update batch posts error:', error);
    res.status(500).json({
      message: 'Failed to update posts',
      error: error.message
    });
  }
};

// Report a post
exports.reportPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user.id;
    const userModel = req.user.role;

    // Validate input
    if (!reason || !description) {
      return res.status(400).json({
        message: 'Missing required fields',
        details: {
          reason: !reason ? 'Reason is required' : null,
          description: !description ? 'Description is required' : null
        }
      });
    }

    // Find post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get reporter information
    const UserModel = mongoose.model(userModel);
    const reporter = await UserModel.findById(userId);
    if (!reporter) {
      return res.status(404).json({ message: 'Reporter not found' });
    }

    // Check if user has already reported this post
    const existingReport = post.reports.find(
      report => 
        report.reporter.userId.toString() === userId.toString() &&
        report.reporter.userModel === userModel
    );

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this post' });
    }

    // Add report
    post.reports.push({
      reporter: {
        userId,
        userModel,
        firstName: reporter.firstName,
        lastName: reporter.lastName
      },
      reason,
      description
    });

    await post.save();

    // Send email notification
    const msg = {
      to: ['support@auqli.com', 'bolu@auqli.com'],
      from: 'Joseph From Auqli <support@auqli.com>',
      subject: 'New Post Report',
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #ff4444; margin-bottom: 20px;">New Post Report</h1>
            
            <div style="background-color: #333333; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #ffffff; margin-bottom: 15px;">Report Details</h3>
              
              <p style="margin: 10px 0;"><strong>Reporter:</strong><br>
                Name: ${reporter.firstName} ${reporter.lastName}<br>
                ID: ${reporter._id}<br>
                Type: ${userModel}
              </p>

              <p style="margin: 10px 0;"><strong>Post Details:</strong><br>
                Post ID: ${post._id}<br>
                Author: ${post.author.firstName} ${post.author.lastName}<br>
                Title: ${post.title}
              </p>

              <p style="margin: 10px 0;"><strong>Report Reason:</strong><br>
                ${reason}
              </p>

              <p style="margin: 10px 0;"><strong>Description:</strong><br>
                ${description}
              </p>
            </div>

            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);

    res.status(201).json({
      message: 'Post reported successfully',
      report: post.reports[post.reports.length - 1]
    });

  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({
      message: 'Failed to report post',
      error: error.message
    });
  }
};

// Like a post
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
        emoji: REACTION_TYPES['like'].emoji,
        user: {
          userId,
          userModel,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
          storeName: userModel === 'Seller' ? user.storeName : undefined,
          username: userModel === 'Buyer' ? user.username : undefined
        },
        createdAt: new Date()
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

    // Check if already has a reaction
    const existingReactionIndex = post.reactions.findIndex(
      reaction => 
        reaction.user.userId.toString() === userId.toString() && 
        reaction.user.userModel === userModel
    );

    if (existingReactionIndex > -1) {
      // If the existing reaction is not 'angry', change it to 'angry'
      if (post.reactions[existingReactionIndex].type !== 'angry') {
        post.reactions[existingReactionIndex].type = 'angry';
        post.reactions[existingReactionIndex].emoji = REACTION_TYPES['angry'].emoji;
      } else {
        // If it's already 'angry', remove it
        post.reactions.splice(existingReactionIndex, 1);
      }
    } else {
      // Add new 'angry' reaction
      post.reactions.push({
        type: 'angry',
        emoji: REACTION_TYPES['angry'].emoji,
        user: {
          userId,
          userModel,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
          storeName: userModel === 'Seller' ? user.storeName : undefined,
          username: userModel === 'Buyer' ? user.username : undefined
        },
        createdAt: new Date()
      });
    }

    await post.save();

    res.json({
      message: 'Reaction updated successfully',
      reactionCounts: post.stats.reactions
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update reaction',
      error: error.message
    });
  }
};

// Get replies for a specific comment
exports.getCommentReplies = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Populate the replies with author and tagged entities information
    await Post.populate(comment, [
      {
        path: 'replies.author.userId',
        select: 'firstName lastName storeName businessName profileImage storeAvatar username',
        refPath: 'replies.author.userModel'
      },
      {
        path: 'replies.taggedSellers.sellerId',
        select: 'storeName businessName storeAvatar',
        model: 'Seller'
      },
      {
        path: 'replies.taggedProducts.productId',
        select: 'name images price',
        model: 'Product'
      }
    ]);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReplies = comment.replies.slice(startIndex, endIndex);

    // Format replies for response
    const formattedReplies = paginatedReplies.map(reply => {
      const replyProfileImageUrl = reply.author.userModel === 'Seller' 
        ? reply.author.userId?.storeAvatar?.url || reply.author.userId?.profileImage?.url
        : reply.author.userId?.profileImage?.url;

      // Format reply tagged sellers
      const replyFormattedTaggedSellers = reply.taggedSellers?.map(tag => ({
        id: tag.sellerId._id,
        storeName: tag.sellerId.storeName || tag.storeName,
        businessName: tag.sellerId.businessName,
        image: tag.sellerId.storeAvatar?.url || null,
        taggedAt: tag.taggedAt
      })) || [];

      // Format reply tagged products
      const replyFormattedTaggedProducts = reply.taggedProducts?.map(tag => ({
        id: tag.productId._id,
        name: tag.productId.name || tag.name,
        image: tag.productId.images?.[0]?.url || null,
        price: tag.productId.price,
        taggedAt: tag.taggedAt
      })) || [];

      return {
        id: reply._id,
        content: reply.content,
        createdAt: reply.createdAt,
        author: {
          id: reply.author.userId?._id || reply.author.userId,
          name: reply.author.userId?.storeName || 
                reply.author.userId?.username || 
                `${reply.author.userId?.firstName || reply.author.firstName} ${reply.author.userId?.lastName || reply.author.lastName}`,
          image: replyProfileImageUrl || null,
          type: reply.author.userModel
        },
        likes: reply.likes?.length || 0,
        taggedSellers: replyFormattedTaggedSellers,
        taggedProducts: replyFormattedTaggedProducts
      };
    });

    res.json({
      replies: formattedReplies,
      totalReplies: comment.replies.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(comment.replies.length / limit)
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch comment replies',
      error: error.message
    });
  }
}; 