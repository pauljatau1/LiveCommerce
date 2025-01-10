const mongoose = require('mongoose');

// Author information schema to store denormalized data
const authorSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'author.userModel'
  },
  userModel: { 
    type: String, 
    enum: ['Seller', 'Buyer'], 
    required: true 
  },
  // Common fields for both Seller and Buyer
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  profileImage: {
    url: String,
    public_id: String
  },
  country: String,
  bio: String,
  // Seller-specific fields
  storeName: String,
  businessName: String,
  // Buyer-specific fields
  username: String
});

const reactionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['like', 'dislike', 'love', 'laugh', 'sad', 'angry'],
    required: true 
  },
  user: {
    userId: { 
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'user.userModel'
    },
    userModel: { 
      type: String, 
      enum: ['Buyer', 'Seller'], 
      required: true 
    },
    firstName: String,
    lastName: String,
    profileImage: {
      url: String,
      public_id: String
    },
    storeName: String,
    username: String
  },
  createdAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: {
    userId: { 
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'author.userModel'
    },
    userModel: { 
      type: String, 
      enum: ['Buyer', 'Seller'], 
      required: true 
    },
    firstName: String,
    lastName: String,
    profileImage: {
      url: String,
      public_id: String
    },
    storeName: String,
    username: String
  },
  likes: [{ 
    userId: { 
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'likes.userModel'
    },
    userModel: { 
      type: String, 
      enum: ['Buyer', 'Seller'] 
    }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  author: authorSchema, // Using the authorSchema instead of just reference
  images: [{
    url: { type: String },
    public_id: { type: String }
  }],
  videos: [{
    url: { type: String },
    public_id: { type: String },
    thumbnail: { type: String },
    duration: { type: Number }
  }],
  products: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product' 
    },
    addedAt: { type: Date, default: Date.now }
  }],
  tags: [{ type: String }],
  visibility: {
    type: String,
    enum: ['public', 'private', 'draft'],
    default: 'public'
  },
  reactions: [reactionSchema],
  comments: [commentSchema],
  stats: {
    likeCount: { type: Number, default: 0 },
    dislikeCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update stats when reactions change
postSchema.pre('save', function(next) {
  if (this.isModified('reactions')) {
    const likes = this.reactions.filter(r => r.type === 'like').length;
    const dislikes = this.reactions.filter(r => r.type === 'dislike').length;
    this.stats.likeCount = likes;
    this.stats.dislikeCount = dislikes;
  }
  next();
});

// Pre-save middleware to update author information
postSchema.pre('save', async function(next) {
  try {
    if (this.isNew || this.isModified('author.userId')) {
      const UserModel = mongoose.model(this.author.userModel);
      const user = await UserModel.findById(this.author.userId);
      
      if (!user) {
        throw new Error('Author not found');
      }

      // Update common fields
      this.author.firstName = user.firstName;
      this.author.lastName = user.lastName;
      this.author.profileImage = user.profileImage;
      this.author.country = user.country;
      this.author.bio = user.bio;

      // Update model-specific fields
      if (this.author.userModel === 'Seller') {
        this.author.storeName = user.storeName;
        this.author.businessName = user.businessName;
      } else {
        this.author.username = user.username;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Post', postSchema); 