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
    enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
    required: true 
  },
  emoji: { type: String},
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
    },
    createdAt: { type: Date, default: Date.now }
  }],
  taggedSellers: [{
    sellerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Seller'
    },
    storeName: String,
    taggedAt: { type: Date, default: Date.now }
  }],
  taggedProducts: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product'
    },
    name: String,
    taggedAt: { type: Date, default: Date.now }
  }],
  replies: [
    {
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
        },
        createdAt: { type: Date, default: Date.now }
      }],
      taggedSellers: [{
        sellerId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'Seller'
        },
        storeName: String,
        taggedAt: { type: Date, default: Date.now }
      }],
      taggedProducts: [{
        productId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'Product'
        },
        name: String,
        taggedAt: { type: Date, default: Date.now }
      }],
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

const reportSchema = new mongoose.Schema({
  reporter: {
    userId: { 
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'reporter.userModel'
    },
    userModel: { 
      type: String, 
      enum: ['Buyer', 'Seller'], 
      required: true 
    },
    firstName: String,
    lastName: String
  },
  reason: { 
    type: String, 
    required: true,
    enum: [
      'inappropriate_content',
      'spam',
      'harassment',
      'hate_speech',
      'misinformation',
      'copyright_violation',
      'other'
    ]
  },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  author: authorSchema,
  images: [{
    url: { type: String },
    public_id: { type: String }
  }],
  videos: [{
    url: { type: String },
    public_id: { type: String }
  }],
  products: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product'
    },
    taggedAt: { type: Date, default: Date.now }
  }],
  taggedSellers: [{
    sellerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Seller'
    },
    taggedAt: { type: Date, default: Date.now }
  }],
  tags: [{ type: String }],
  visibility: {
    type: String,
    enum: ['public', 'private', 'draft'],
    default: 'public'
  },
  reactions: [reactionSchema],
  comments: [commentSchema],
  reports: [reportSchema],
  stats: {
    reactions: {
      like: { type: Number, default: 0 },
      love: { type: Number, default: 0 },
      haha: { type: Number, default: 0 },
      wow: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
      angry: { type: Number, default: 0 }
    },
    viewCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update stats when reactions change
postSchema.pre('save', function(next) {
  if (this.isModified('reactions')) {
    // Reset all reaction counts
    Object.keys(this.stats.reactions).forEach(type => {
      this.stats.reactions[type] = this.reactions.filter(r => r.type === type).length;
    });
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

// Add a pre-save middleware to validate tags
postSchema.pre('save', async function(next) {
  try {
    // Validate tagged products exist
    if (this.products && this.products.length > 0) {
      const productIds = this.products.map(tag => tag.productId);
      const products = await mongoose.model('Product').find({ _id: { $in: productIds } });
      if (products.length !== productIds.length) {
        throw new Error('One or more tagged products do not exist');
      }
    }

    // Validate tagged sellers exist
    if (this.taggedSellers && this.taggedSellers.length > 0) {
      const sellerIds = this.taggedSellers.map(tag => tag.sellerId);
      const sellers = await mongoose.model('Seller').find({ _id: { $in: sellerIds } });
      if (sellers.length !== sellerIds.length) {
        throw new Error('One or more tagged sellers do not exist');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Post', postSchema); 