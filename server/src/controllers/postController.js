const Post = require('../models/Post');
const Buyer = require('../models/Buyer');
const cloudinary = require('cloudinary').v2;

// Create a new post
exports.createPost = async (req, res) => {
  const { title, description, media } = req.body;
  const buyerId = req.user.id;

  if (!title || !description || !media || media.length === 0) {
    return res.status(400).json({ message: 'Title, description, and media are required.' });
  }

  try {
    let mediaLinks = [];
    for (let file of media) {
      const uploadResult = await cloudinary.uploader.upload(file, { folder: 'posts' });
      mediaLinks.push({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
    }

    const newPost = new Post({
      buyerId,
      title,
      description,
      media: mediaLinks,
    });

    await newPost.save();
    const buyer = await Buyer.findById(buyerId);
    buyer.posts.push(newPost._id);
    await buyer.save();

    res.status(201).json({ post: newPost });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
};

// Get all posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('buyerId', 'username').populate('comments.buyerId', 'username');
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve posts', error: error.message });
  }
};

// Get a single post
exports.getPost = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId).populate('buyerId', 'username').populate('comments.buyerId', 'username');
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve post', error: error.message });
  }
};

// Get a particular user's posts
exports.getUserPosts = async (req, res) => {
  const { userId } = req.params;

  try {
    const posts = await Post.find({ buyerId: userId }).populate('buyerId', 'username').populate('comments.buyerId', 'username');
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve user posts', error: error.message });
  }
};

// Update a post
exports.updatePost = async (req, res) => {
  const { postId } = req.params;
  const { title, description, media } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    if (post.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to update this post.' });
    }

    if (title) post.title = title;
    if (description) post.description = description;

    if (media && media.length > 0) {
      // Delete old media from Cloudinary
      await Promise.all(post.media.map(async (mediaItem) => {
        await cloudinary.uploader.destroy(mediaItem.public_id);
      }));

      let mediaLinks = [];
      for (let file of media) {
        const uploadResult = await cloudinary.uploader.upload(file, { folder: 'posts' });
        mediaLinks.push({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
      }
      post.media = mediaLinks;
    }

    await post.save();
    res.json({ message: 'Post updated successfully.', post });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update post', error: error.message });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    if (post.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this post.' });
    }

    // Delete media from Cloudinary
    await Promise.all(post.media.map(async (mediaItem) => {
      await cloudinary.uploader.destroy(mediaItem.public_id);
    }));

    await post.remove();
    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete post', error: error.message });
  }
};

// Like a post
exports.likePost = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already liked this post.' });
    }

    post.likes.push(req.user.id);
    await post.save();

    res.json({ message: 'Post liked successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to like post', error: error.message });
  }
};

// Unlike a post
exports.unlikePost = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    if (!post.likes.includes(req.user.id)) {
      return res.status(400).json({ message: 'You have not liked this post.' });
    }

    post.likes.pull(req.user.id);
    await post.save();

    res.json({ message: 'Post unliked successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unlike post', error: error.message });
  }
};

// Comment on a post
exports.commentPost = async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Comment content is required.' });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const newComment = {
      buyerId: req.user.id,
      content,
    };

    post.comments.push(newComment);
    await post.save();

    res.json({ message: 'Comment added successfully.', comment: newComment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

// Delete a comment from a post
exports.deleteComment = async (req, res) => {
  const { postId, commentId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    if (comment.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this comment.' });
    }

    comment.remove();
    await post.save();

    res.json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
};
