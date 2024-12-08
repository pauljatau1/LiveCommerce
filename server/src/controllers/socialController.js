const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const Post = require('../models/Post');
const notificationController = require('./notificationController');

// Helper function to get user model based on type
const getUserModel = (userType) => {
  return userType === 'Buyer' ? Buyer : Seller;
};

// Helper function to create activity
const createActivity = async (user, type, content, reference, referenceModel) => {
  user.activityFeed.push({
    type,
    content,
    reference,
    referenceModel,
    createdAt: new Date()
  });
  await user.save();
};

exports.followUser = async (req, res) => {
  const { userId } = req.params;
  const { userType } = req.query;
  const followerId = req.user.id;
  const followerType = req.user.role;

  try {
    // Validate user type
    if (!['Buyer', 'Seller'].includes(userType)) {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    // Get appropriate models
    const TargetModel = getUserModel(userType);
    const FollowerModel = getUserModel(followerType);

    // Find both users
    const [targetUser, follower] = await Promise.all([
      TargetModel.findById(userId),
      FollowerModel.findById(followerId)
    ]);

    if (!targetUser || !follower) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    if (follower.following.some(f => f.userId.toString() === userId)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Update follower's following list
    follower.following.push({
      userId: targetUser._id,
      userType,
      name: userType === 'Buyer' ? 
        `${targetUser.firstName} ${targetUser.lastName}` : 
        targetUser.storeName
    });

    // Update target's followers list
    targetUser.followers.push({
      userId: follower._id,
      userType: followerType,
      name: followerType === 'Buyer' ? 
        `${follower.firstName} ${follower.lastName}` : 
        follower.storeName
    });

    // Create activity records
    await createActivity(
      follower,
      'follow',
      `Started following ${userType === 'Buyer' ? 'buyer' : 'seller'} ${targetUser.firstName}`,
      targetUser._id,
      userType
    );

    // Save changes
    await Promise.all([follower.save(), targetUser.save()]);

    // Create notification
    await notificationController.createNotification(
      targetUser,
      'new_follower',
      'New Follower',
      `${follower.firstName} ${follower.lastName} started following you`,
      { userId: follower._id, userType: followerType }
    );

    res.json({ 
      message: 'Successfully followed user',
      following: follower.following[follower.following.length - 1]
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to follow user', error: error.message });
  }
};

exports.unfollowUser = async (req, res) => {
  const { userId } = req.params;
  const { userType } = req.query;
  const followerId = req.user.id;
  const followerType = req.user.role;

  try {
    // Validate user type
    if (!['Buyer', 'Seller'].includes(userType)) {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    // Get appropriate models
    const TargetModel = getUserModel(userType);
    const FollowerModel = getUserModel(followerType);

    // Find both users
    const [targetUser, follower] = await Promise.all([
      TargetModel.findById(userId),
      FollowerModel.findById(followerId)
    ]);

    if (!targetUser || !follower) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if actually following
    const followingIndex = follower.following.findIndex(f => f.userId.toString() === userId);
    if (followingIndex === -1) {
      return res.status(400).json({ message: 'Not following this user' });
    }

    // Remove from follower's following list
    follower.following.pull(follower.following[followingIndex]._id);

    // Remove from target's followers list
    const followerIndex = targetUser.followers.findIndex(
      f => f.userId.toString() === followerId
    );
    if (followerIndex !== -1) {
      targetUser.followers.pull(targetUser.followers[followerIndex]._id);
    }

    // Create activity record for unfollow
    await createActivity(
      follower,
      'follow',
      `Unfollowed ${userType === 'Buyer' ? 'buyer' : 'seller'} ${targetUser.firstName}`,
      targetUser._id,
      userType
    );

    // Save changes
    await Promise.all([follower.save(), targetUser.save()]);

    // Create notification for unfollow (optional)
    await notificationController.createNotification(
      targetUser,
      'unfollow',
      'Lost Follower',
      `${follower.firstName} ${follower.lastName} unfollowed you`,
      { userId: follower._id, userType: followerType }
    );

    res.json({ 
      message: 'Successfully unfollowed user',
      unfollowedUser: {
        userId: targetUser._id,
        userType,
        name: userType === 'Buyer' ? 
          `${targetUser.firstName} ${targetUser.lastName}` : 
          targetUser.storeName
      }
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to unfollow user', 
      error: error.message 
    });
  }
};

exports.getFeed = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user.id;
  const userType = req.user.role;

  try {
    const UserModel = getUserModel(userType);
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get IDs of followed users
    const followedIds = user.following.map(f => f.userId);

    // Get posts from followed users
    const posts = await Post.find({
      creatorId: { $in: followedIds }
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('creatorId', 'firstName lastName storeName')
    .populate('comments.creatorId', 'firstName lastName storeName');

    // Get activities from followed users
    const activities = await Promise.all(
      followedIds.map(async (id) => {
        const userModel = getUserModel(user.following.find(f => f.userId.equals(id)).userType);
        const followedUser = await userModel.findById(id);
        return followedUser ? followedUser.activityFeed : [];
      })
    );

    // Combine and sort feed items
    const feedItems = [...posts, ...activities.flat()]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    res.json({
      feed: feedItems,
      page: parseInt(page),
      hasMore: feedItems.length === parseInt(limit)
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to get feed', error: error.message });
  }
};

// Add helper function to get user display name
const getUserDisplayName = (user, userType) => {
  return userType === 'Buyer' ? 
    `${user.firstName} ${user.lastName}` : 
    user.storeName;
};

// Get user's followers
exports.getFollowers = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const userType = req.query.userType || req.user.role;
  const { page = 1, limit = 10 } = req.query;

  try {
    const UserModel = getUserModel(userType);
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Populate followers with detailed information
    const populatedUser = await UserModel.findById(userId)
      .populate({
        path: 'followers.userId',
        select: 'firstName lastName storeName storeAvatar email',
        options: {
          skip: (page - 1) * limit,
          limit: parseInt(limit)
        }
      });

    const totalFollowers = user.followers.length;
    const followers = populatedUser.followers.map(follower => ({
      id: follower.userId._id,
      name: follower.userType === 'Buyer' ? 
        `${follower.userId.firstName} ${follower.userId.lastName}` : 
        follower.userId.storeName,
      avatar: follower.userType === 'Seller' ? follower.userId.storeAvatar : null,
      email: follower.userId.email,
      userType: follower.userType,
      followedAt: follower.followedAt
    }));

    res.json({
      followers,
      pagination: {
        total: totalFollowers,
        page: parseInt(page),
        pages: Math.ceil(totalFollowers / limit),
        hasMore: page * limit < totalFollowers
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to get followers', error: error.message });
  }
};

// Get user's following list
exports.getFollowing = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const userType = req.query.userType || req.user.role;
  const { page = 1, limit = 10 } = req.query;

  try {
    const UserModel = getUserModel(userType);
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Populate following with detailed information
    const populatedUser = await UserModel.findById(userId)
      .populate({
        path: 'following.userId',
        select: 'firstName lastName storeName storeAvatar email',
        options: {
          skip: (page - 1) * limit,
          limit: parseInt(limit)
        }
      });

    const totalFollowing = user.following.length;
    const following = populatedUser.following.map(follow => ({
      id: follow.userId._id,
      name: follow.userType === 'Buyer' ? 
        `${follow.userId.firstName} ${follow.userId.lastName}` : 
        follow.userId.storeName,
      avatar: follow.userType === 'Seller' ? follow.userId.storeAvatar : null,
      email: follow.userId.email,
      userType: follow.userType,
      followedAt: follow.followedAt
    }));

    res.json({
      following,
      pagination: {
        total: totalFollowing,
        page: parseInt(page),
        pages: Math.ceil(totalFollowing / limit),
        hasMore: page * limit < totalFollowing
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to get following list', error: error.message });
  }
};

// Get follower suggestions
exports.getFollowerSuggestions = async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.role;
  const { limit = 10 } = req.query;

  try {
    const UserModel = getUserModel(userType);
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get IDs of users already following
    const followingIds = user.following.map(f => f.userId);

    // Find potential followers based on various criteria
    const suggestions = await UserModel.find({
      _id: { $nin: [...followingIds, userId] },
      // Add additional filtering criteria based on your requirements
      // For example, same category interests, location, etc.
    })
    .select('firstName lastName storeName storeAvatar email')
    .limit(parseInt(limit));

    const formattedSuggestions = suggestions.map(suggestion => ({
      id: suggestion._id,
      name: userType === 'Buyer' ? 
        `${suggestion.firstName} ${suggestion.lastName}` : 
        suggestion.storeName,
      avatar: userType === 'Seller' ? suggestion.storeAvatar : null,
      email: suggestion.email,
      userType: suggestion.constructor.modelName
    }));

    res.json({ suggestions: formattedSuggestions });

  } catch (error) {
    res.status(500).json({ message: 'Failed to get suggestions', error: error.message });
  }
};
