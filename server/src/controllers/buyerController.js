const Buyer = require('../models/Buyer');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const { v4: uuidv4 } = require('uuid');
const s3 = require('../config/awsConfig');
const notificationController = require('../controllers/notificationController');
const crypto = require('crypto');
const Order = require('../models/Order');
const Seller = require('../models/Seller')
const Product = require('../models/Product');

sgMail.setApiKey('SG.REDACTED');

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id, role: 'Buyer' }, process.env.JWT_SECRET, { expiresIn: '2w' });
};

// Helper function to generate OTP (4-digit)
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// Helper function to generate reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Register a new buyer
exports.register = async (req, res) => {
  const { firstName, lastName, username, email, country, phoneNumber, password } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !username || !email || !phoneNumber || !password) {
    return res.status(400).json({ 
      message: 'Missing required fields',
      details: {
        firstName: !firstName ? 'First name is required' : null,
        lastName: !lastName ? 'Last name is required' : null,
        username: !username ? 'Username is required' : null,
        email: !email ? 'Email is required' : null,
        phoneNumber: !phoneNumber ? 'Phone number is required' : null,
        password: !password ? 'Password is required' : null
      }
    });
  }

  try {
    // Check if email exists
    const existingEmail = await Buyer.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    // Check if username exists
    const existingUsername = await Buyer.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: 'Username is already taken' });
    }

    const otp = generateOTP();
    const newBuyer = new Buyer({ 
      firstName, 
      lastName, 
      username, 
      email, 
      country, 
      phoneNumber, 
      password, 
      otp 
    });

    await newBuyer.save();
    const token = generateToken(newBuyer._id);

    const msg = {
      to: email,
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'Welcome to Auqli!',
      text: `Hi ${firstName}, welcome to Auqli! Your OTP is ${otp}. Please use this OTP to verify your email.`,
      html: `<strong>Hi ${firstName}, welcome to Auqli! Your OTP is ${otp}. Please use this OTP to verify your email.</strong>`,
    };

    try {
      await sgMail.send(msg);
    } catch (sendError) {
      console.error('SendGrid error:', sendError);
      return res.status(500).json({ 
        message: 'Account created but failed to send verification email',
        error: sendError.message 
      });
    }

    res.status(201).json({ user: newBuyer, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Failed to register buyer', 
      error: error.message 
    });
  }
};

// Login a buyer
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const buyer = await Buyer.findOne({ email });
    if (!buyer || !(await buyer.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // if (!buyer.emailVerified) {
    //   return res.status(403).json({ message: 'Email not yet verified.' });
    // }

    const token = generateToken(buyer._id);
    res.json({ user: buyer, token });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};


exports.checkToken = async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(403).json({ message: "A token is required for authentication" });

  try {
    const decodedUserData = jwt.verify(token, process.env.JWT_SECRET);
    const newToken = generateToken(decodedUserData.id);
    res.json({ message: "Token is valid", token: newToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token has expired. Please sign in again." });
    }
    return res.status(401).json({ message: "Invalid Token" });
  }
};


// Get buyer profile
exports.getProfile = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id).select('-password');
    if (!buyer) return res.status(404).json({ message: 'Buyer not found.' });

    // Add role information
    const profile = {
      ...buyer.toObject(),
      role: 'Buyer'
    };

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve profile', error: error.message });
  }
};

// Update buyer profile
exports.updateProfile = async (req, res) => {
  const { firstName, lastName, country, phoneNumber, shippingAddresses, bio } = req.body;

  try {
    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found.' });
    }

    // Update fields if provided
    if (firstName) buyer.firstName = firstName;
    if (lastName) buyer.lastName = lastName;
    if (country) buyer.country = country;
    if (phoneNumber) buyer.phoneNumber = phoneNumber;
    if (bio) buyer.bio = bio;

    // Update shipping addresses if provided
    if (shippingAddresses) {
      buyer.shippingAddresses = shippingAddresses.map(address => ({
        ...address,
        country: address.country || buyer.country,
      }));
    }

    const updatedBuyer = await buyer.save();
    res.json({ message: 'Profile updated successfully', buyer: updatedBuyer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// Upload buyer profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    const avatarFile = req.file;
    const buyer = await Buyer.findById(req.user.id);

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    let data;
    if (avatarFile) {
      const params = {
        Bucket: 'auqli-uploads',
        Key: `${uuidv4()}-${avatarFile.originalname}`,
        Body: avatarFile.buffer,
        ContentType: avatarFile.mimetype,
      };
      data = await s3.upload(params).promise();
    } else {
      data = {
        Location: 'https://res.cloudinary.com/dljgzevaj/image/upload/v1730579531/user-account-management-logo-user-icon-11562867145a56rus2zwu_cgs18m.png',
        Key: 'default-profile-image',
      };
    }

    buyer.profileImage = {
      url: data.Location,
      public_id: data.Key,
    };

    const updatedBuyer = await buyer.save();

    res.json({ message: 'Profile image uploaded successfully', buyer: updatedBuyer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload profile image', error: error.message });
  }
};




exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

  try {
    const buyer = await Buyer.findOne({ email });
    if (!buyer) return res.status(404).json({ message: 'Buyer not found.' });

    if (buyer.otp === otp) {
      buyer.emailVerified = true;
      buyer.otp = undefined; // Clear the OTP after verification
      await buyer.save();
      return res.json({ message: 'Email verified successfully.' });
    } else {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
};

exports.resendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const buyer = await Buyer.findOne({ email });
    if (!buyer) return res.status(404).json({ message: 'Buyer not found.' });

    const otp = generateOTP();
    buyer.otp = otp;
    await buyer.save();

    const msg = {
      to: email,
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'Your OTP Code',
      text: `Hi, your OTP is ${otp}. Please use this OTP to verify your email.`,
      html: `<strong>Hi, your OTP is ${otp}. Please use this OTP to verify your email.</strong>`,
    };

    try {
      await sgMail.send(msg);
    } catch (sendError) {
      console.error('SendGrid error:', sendError);
      return res.status(500).json({ message: 'Failed to send verification email', error: sendError.message });
    }

    res.json({ message: 'OTP resent successfully.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
};


exports.updateSelectedCategories = async (req, res) => {
  const { selectedCategories } = req.body;

  try {
    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found.' });
    }

    buyer.selectedCategories = selectedCategories.map(category => ({
      name: category.name,
      subCategories: category.subCategories.map(subCategory => ({
        name: subCategory.name,
      })),
    }));

    const updatedBuyer = await buyer.save();
    res.json({ message: 'Selected categories updated successfully', buyer: updatedBuyer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update selected categories', error: error.message });
  }
};


exports.sendPhoneOTP = async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }

  try {
    const buyer = await Buyer.findOne({ phoneNumber });
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found.' });
    }

    const otp = generateOTP();
    buyer.otp = otp;
    await buyer.save();

    const message = `Your OTP is ${otp}. Please use this OTP to verify your phone number.`;

    const response = await axios.post(
      'https://apisms.beem.africa/v1/send',
      {
        source_addr: source_addr,
        schedule_time: '',
        encoding: 0,
        message: message,
        recipients: [
          {
            recipient_id: 1,
            dest_addr: phoneNumber,
          },
        ],
      },
      {
        headers: {
          'Content-Type': content_type,
          Authorization: 'Basic ' + btoa(api_key + ':' + secret_key),
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      }
    );

    if (response.data.successful) {
      res.json({ message: 'OTP sent successfully.' });
    } else {
      res.status(500).json({ message: 'Failed to send OTP', error: response.data.message });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
    console.log(error)
  }
};

exports.verifyPhoneOTP = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    return res.status(400).json({ message: 'Phone number and OTP are required.' });
  }

  try {
    const buyer = await Buyer.findOne({ phoneNumber });
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found.' });
    }

    if (buyer.otp === otp) {
      buyer.phoneVerified = true;
      buyer.otp = undefined; // Clear the OTP after verification
      await buyer.save();
      return res.json({ message: 'Phone number verified successfully.' });
    } else {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
};





// Forgot password - send reset email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const buyer = await Buyer.findOne({ email });
    if (!buyer) {
      return res.status(404).json({ message: 'No account with that email exists.' });
    }

    // Generate reset token and expiry
    const resetToken = generateResetToken();
    buyer.resetPasswordToken = resetToken;
    buyer.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await buyer.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const msg = {
      to: email,
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'Password Reset Request',
      text: `You requested a password reset. Please click on the following link to reset your password: ${resetUrl}. If you didn't request this, please ignore this email.`,
      html: `
        <p>You requested a password reset.</p>
        <p>Please click on the following link to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    await sgMail.send(msg);
    res.json({ message: 'Password reset email sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process password reset', error: error.message });
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  try {
    const buyer = await Buyer.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!buyer) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    // Update password and clear reset token fields
    buyer.password = newPassword;
    buyer.resetPasswordToken = undefined;
    buyer.resetPasswordExpires = undefined;
    await buyer.save();

    // Send confirmation email
    const msg = {
      to: buyer.email,
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'Password Reset Successful',
      text: 'Your password has been successfully reset.',
      html: '<strong>Your password has been successfully reset.</strong>',
    };

    await sgMail.send(msg);
    res.json({ message: 'Password reset successful.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};

// Get buyer's orders with filtering
exports.getOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = { buyer: req.user.id };
    
    // Apply filters
    if (status) {
      query['items.status'] = status;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('items.product', 'name images price')
      .populate('items.seller', 'storeName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      buyer: req.user.id
    })
    .populate('items.product')
    .populate('items.seller', 'storeName email phoneNumber');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order details', error: error.message });
  }
};

// Get buyer's purchase analytics
exports.getPurchaseAnalytics = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id });
    
    const analytics = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      ordersByStatus: {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        returned: 0
      },
      recentOrders: await Order.find({ buyer: req.user.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('items.product', 'name images price')
    };

    // Count orders by status
    orders.forEach(order => {
      order.items.forEach(item => {
        analytics.ordersByStatus[item.status]++;
      });
    });

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

// Get all addresses
exports.getAddresses = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id)
      .select('shippingAddresses');
      
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Return complete address objects
    res.json(buyer.shippingAddresses);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve addresses', 
      error: error.message 
    });
  }
};

// Add new address
exports.addAddress = async (req, res) => {
  try {
    const { 
      addressType, 
      country, 
      state, 
      city, 
      addressLine1, 
      addressLine2, 
      zipCode 
    } = req.body;

    // Validate required fields
    if (!addressType || !country || !state || !city || !addressLine1 || !zipCode) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['addressType', 'country', 'state', 'city', 'addressLine1', 'zipCode']
      });
    }

    // Validate address type
    const validAddressTypes = ['home', 'work', 'other'];
    if (!validAddressTypes.includes(addressType)) {
      return res.status(400).json({
        message: 'Invalid address type',
        validTypes: validAddressTypes
      });
    }

    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Check if address type already exists
    const existingAddressType = buyer.shippingAddresses.find(
      addr => addr.addressType === addressType
    );

    if (existingAddressType) {
      return res.status(400).json({
        message: `Address type '${addressType}' already exists. Please use a different type or update the existing address.`
      });
    }

    const newAddress = {
      addressType,
      country,
      state,
      city,
      addressLine1,
      addressLine2,
      zipCode
    };

    // Add new address to the array
    buyer.shippingAddresses = [...buyer.shippingAddresses, newAddress];

    // Save the updated buyer document
    const updatedBuyer = await buyer.save();

    // Return the newly added address
    const addedAddress = updatedBuyer.shippingAddresses[updatedBuyer.shippingAddresses.length - 1];

    res.status(201).json({
      message: 'Address added successfully',
      address: addedAddress
    });
  } catch (error) {
    console.error('Add address error:', error); // Add this for debugging
    res.status(500).json({
      message: 'Failed to add address',
      error: error.message
    });
  }
};

// Update address
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    const addressIndex = buyer.shippingAddresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const updates = req.body;

    // If address type is being changed, check for duplicates
    if (updates.addressType && 
        updates.addressType !== buyer.shippingAddresses[addressIndex].addressType) {
      const existingAddressType = buyer.shippingAddresses.find(
        addr => addr.addressType === updates.addressType
      );

      if (existingAddressType) {
        return res.status(400).json({
          message: `Address type '${updates.addressType}' already exists`
        });
      }
    }

    // Validate address type if it's being updated
    if (updates.addressType && !['home', 'work', 'other'].includes(updates.addressType)) {
      return res.status(400).json({
        message: 'Invalid address type',
        validTypes: ['home', 'work', 'other']
      });
    }

    const updatedAddress = {
      ...buyer.shippingAddresses[addressIndex].toObject(),
      ...updates
    };

    buyer.shippingAddresses[addressIndex] = updatedAddress;
    await buyer.save();

    res.json({
      message: 'Address updated successfully',
      address: updatedAddress
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update address',
      error: error.message
    });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    const addressIndex = buyer.shippingAddresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }

    buyer.shippingAddresses.splice(addressIndex, 1);
    await buyer.save();

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to delete address', 
      error: error.message 
    });
  }
};

// Follow a seller
exports.followSeller = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { sellerId } = req.params;

    const [buyer, seller] = await Promise.all([
      Buyer.findById(buyerId),
      Seller.findById(sellerId)
    ]);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Initialize followers array if it doesn't exist
    if (!seller.followers) {
      seller.followers = [];
    }

    // Check if already following
    const isAlreadyFollowing = seller.followers.some(
      follower => follower.buyerId && follower.buyerId.toString() === buyerId
    );

    if (isAlreadyFollowing) {
      return res.status(400).json({ message: 'Already following this seller' });
    }

    // Get buyer's main address
    const mainAddress = buyer.shippingAddresses && buyer.shippingAddresses.length > 0 
      ? buyer.shippingAddresses[0] 
      : null;

    // Add to seller's followers list
    seller.followers.push({
      buyerId: buyer._id,
      firstName: buyer.firstName,
      lastName: buyer.lastName,
      email: buyer.email,
      followDate: new Date(),
      totalOrders: 0,
      mainAddress: mainAddress
    });

    await seller.save();

    // Add to buyer's activity feed
    if (!buyer.activityFeed) {
      buyer.activityFeed = [];
    }

    buyer.activityFeed.push({
      type: 'follow',
      content: `Started following ${seller.storeName || seller.businessName}`,
      reference: seller._id,
      referenceModel: 'Seller',
      createdAt: new Date()
    });

    await buyer.save();

    res.json({ 
      message: 'Successfully followed seller',
      followData: seller.followers[seller.followers.length - 1]
    });
  } catch (error) {
    console.error('Follow seller error:', error); 
    res.status(500).json({ 
      message: 'Failed to follow seller', 
      error: error.message 
    });
  }
};

// Unfollow a seller
exports.unfollowSeller = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { sellerId } = req.params;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Remove from followers list
    seller.followers = seller.followers.filter(
      follower => follower.buyerId.toString() !== buyerId
    );

    await seller.save();

    res.json({ message: 'Successfully unfollowed seller' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to unfollow seller', 
      error: error.message 
    });
  }
};

// Get list of sellers that the buyer follows
exports.getFollowedSellers = async (req, res) => {
  try {
    const buyerId = req.user.id;
    
    const sellers = await Seller.find({
      'followers.buyerId': buyerId
    }).select('storeName businessName aboutStore followers');

    const followedSellers = sellers.map(seller => ({
      sellerId: seller._id,
      storeName: seller.storeName,
      businessName: seller.businessName,
      aboutStore: seller.aboutStore,
      followDate: seller.followers.find(f => f.buyerId.toString() === buyerId).followDate
    }));

    res.json(followedSellers);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get followed sellers', 
      error: error.message 
    });
  }
};

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { productId } = req.body;

    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is already in wishlist
    const isProductInWishlist = buyer.wishlist.some(
      item => item.product.toString() === productId
    );

    if (isProductInWishlist) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    // Add to wishlist
    buyer.wishlist.push({
      product: productId,
      addedAt: new Date()
    });

    await buyer.save();

    res.json({ 
      message: 'Product added to wishlist successfully',
      wishlist: buyer.wishlist 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to add product to wishlist', 
      error: error.message 
    });
  }
};

// Get wishlist
exports.getWishlist = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const buyer = await Buyer.findById(buyerId)
      .populate({
        path: 'wishlist.product',
        select: 'name description price images category brand stock',
        populate: {
          path: 'seller',
          select: 'storeName businessName'
        }
      });

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    res.json(buyer.wishlist);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get wishlist', 
      error: error.message 
    });
  }
};

// Remove from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { productId } = req.params;

    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Remove product from wishlist
    buyer.wishlist = buyer.wishlist.filter(
      item => item.product.toString() !== productId
    );

    await buyer.save();

    res.json({ 
      message: 'Product removed from wishlist successfully',
      wishlist: buyer.wishlist 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to remove product from wishlist', 
      error: error.message 
    });
  }
};

exports.uploadIdentityDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No identity document uploaded' });
    }

    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Delete old document from S3 if it exists
    if (buyer.identityDocument && buyer.identityDocument.public_id) {
      await s3.deleteObject({
        Bucket: 'auqli-uploads',
        Key: buyer.identityDocument.public_id
      }).promise();
    }

    // Upload new document to S3
    const key = `verification/buyers/${req.user.id}/identity-${Date.now()}-${req.file.originalname}`;
    const uploadResult = await s3.upload({
      Bucket: 'auqli-uploads',
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    }).promise();

    // Update buyer document
    buyer.identityDocument = {
      url: uploadResult.Location,
      public_id: key,
      uploadedAt: new Date(),
      status: 'pending'
    };
    buyer.isIdentityVerified = false; // Reset verification status
    await buyer.save();

    res.json({ 
      message: 'Identity document uploaded successfully',
      document: buyer.identityDocument
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to upload identity document', 
      error: error.message 
    });
  }
};

