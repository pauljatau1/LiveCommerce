const Buyer = require('../models/Buyer');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const { v4: uuidv4 } = require('uuid');
const { s3 } = require('../config/awsConfig');
const notificationController = require('../controllers/notificationController');
const crypto = require('crypto');
const Order = require('../models/Order');
const Seller = require('../models/Seller')
const Product = require('../models/Product');
const Post = require('../models/Post');
const Stream = require('../models/Stream');
const { saveToken, getToken } = require('../../Firebase');
const { Expo } = require('expo-server-sdk');
// Import required AWS SDK modules for SNS (Simple Notification Service)
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
sgMail.setApiKey('SG.REDACTED');
// Load environment variables from a .env file
require('dotenv').config();

const expo = new Expo();

// Initialize Paystack
const axios = require('axios');
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || "sk_test_REDACTED";
const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${paystackSecretKey}`,
    'Content-Type': 'application/json'
  }
});

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

// Helper function to generate OTP
const generatePhoneOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate 4-digit OTP
const generateResetOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Register a new buyer
exports.register = async (req, res) => {
  const { firstName, lastName, username, email, country, phoneNumber, password, expoPushToken } = req.body;

  // Validate required fields (remove expoPushToken from required check)
  if (!firstName || !lastName || !username || !email || !phoneNumber || !password) {
    return res.status(400).json({
      message: 'Missing required fields',
      details: {
        firstName: !firstName ? 'First name is required' : null,
        lastName: !lastName ? 'Last name is required' : null,
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
      otp,
      expoPushToken // This will be undefined if not provided, which is fine
    });

    await newBuyer.save();

    // Only save token if provided
    if (expoPushToken) {
      await saveToken(newBuyer._id, expoPushToken);
    }

    const token = generateToken(newBuyer._id);

    const msg = {
      to: email,
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'Welcome to Auqli! Verify Your Account',
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 20px;">Welcome to Auqli, ${firstName}!</h1>
            <p style="font-size: 16px; line-height: 1.5;">Thank you for joining our community. We're excited to have you on board!</p>
            
            <div style="background-color: #333333; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #4CAF50; margin-bottom: 15px;">Your Verification Code</h3>
              <p style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; margin: 20px 0; color: #4CAF50;">${otp}</p>
              <p style="font-size: 14px; color: #999999;">Please enter this code to verify your email address and activate your account.</p>
            </div>

            <div style="margin: 30px 0;">
              <h3 style="color: #4CAF50; margin-bottom: 15px;">What's Next?</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 10px; display: flex; align-items: center;">
                  <span style="color: #4CAF50; margin-right: 10px;">✓</span> Verify your email using the code above
                </li>
                <li style="margin-bottom: 10px; display: flex; align-items: center;">
                  <span style="color: #4CAF50; margin-right: 10px;">✓</span> Complete your profile
                </li>
                <li style="margin-bottom: 10px; display: flex; align-items: center;">
                  <span style="color: #4CAF50; margin-right: 10px;">✓</span> Start exploring products
                </li>
              </ul>
            </div>

            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
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
  const { email, password, expoPushToken, googleToken } = req.body;
  if (googleToken) {
    return await googleLoginMobile(req.body, res)
  }
  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required.',
      details: {
        email: !email ? 'Email is required' : null,
        password: !password ? 'Password is required' : null
      }
    });
  }

  try {
    const buyer = await Buyer.findOne({ email });
    if (!buyer || !(await buyer.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Only save token if provided
    if (expoPushToken) {
      await saveToken(buyer._id, expoPushToken);
    }

    const userToken = await getToken(buyer._id);
    if (userToken) {
      await expo.sendPushNotificationsAsync([{
        to: userToken.token,
        title: `Welcome to Auqli`,
        body: `You have successfully logged in to your account`
      }]);
    }

    const token = generateToken(buyer._id);
    res.json({ user: buyer, token });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

async function googleLoginMobile(data, res) {
  const { email, googleToken, expoPushToken } = data
  try {
    const buyer = await Buyer.findOne({ email });
    if (!buyer) {
      return await googleRegisterMobile(data, res)
    }

    if (!(await buyer.comparePassword(googleToken))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Only save token if provided
    if (expoPushToken) {
      await saveToken(buyer._id, expoPushToken);
    }

    const token = generateToken(buyer._id);
    res.json({ user: buyer, token });
  } catch (error) {
    res.status(500).json({ message: 'google Login failed', error: error.message });
  }
}

async function googleRegisterMobile(data, res) {
  const { firstName, lastName, username, email, country, phoneNumber, googleToken, profileImage, expoPushToken } = data
  const otp = generateOTP();
  try {
    const newBuyer = new Buyer({
      firstName,
      lastName,
      username,
      email,
      country,
      phoneNumber,
      password: googleToken,
      otp,
      expoPushToken // This will be undefined if not provided, which is fine
    });

    if (profileImage) {
      newBuyer.profileImage = {
        url: profileImage,
        public_id: profileImage,
      };
    }


    await newBuyer.save();

    // Only save token if provided
    if (expoPushToken) {
      await saveToken(newBuyer._id, expoPushToken);
    }
    const token = generateToken(newBuyer._id);
    res.status(201).json({ user: newBuyer, token });
  }
  catch (error) {
    res.status(500).json({ message: 'google register Login failed', error: error.message });
  }

}


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
    // First get the buyer with basic info and notification preferences
    const buyer = await Buyer.findById(req.user.id)
      .select({
        firstName: 1,
        lastName: 1,
        username: 1,
        email: 1,
        country: 1,
        phoneNumber: 1,
        profileImage: 1,
        shippingAddresses: 1,
        emailVerified: 1,
        phoneVerified: 1,
        isDisabled: 1,
        isNew: 1,
        createdAt: 1,
        isIdentityVerified: 1,
        preferredCurrency: 1,
        preferredLanguage: 1,
        role: 1,
        wallet: 1,
        bio: 1,
        notificationPreferences: {
          orderUpdates: 1,
          liveShows: 1,
          messages: 1,
          communityActivity: 1,
          promotionsAndSales: 1
        }
      })
      .lean();

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Get counts in parallel using the activityFeed to count following
    const [followersCount, followingCount, postsCount] = await Promise.all([
      Buyer.findById(req.user.id).select('followers').then(b => b.followers?.length || 0),
      Buyer.findById(req.user.id)
        .select('activityFeed')
        .then(b => b.activityFeed?.filter(activity =>
          activity.type === 'follow' &&
          activity.referenceModel === 'Seller'
        ).length || 0),
      Post.countDocuments({ 'author.userId': req.user.id, 'author.userModel': 'Buyer' })
    ]);

    // Add the counts and profile picture URL to the response
    const enhancedBuyer = {
      ...buyer,
      followersCount,
      followingCount,
      postsCount,
      profilePictureUrl: buyer.profileImage?.url || null,
      bio: buyer.bio || null  // Explicitly include bio in the response
    };

    res.json(enhancedBuyer);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching buyer profile',
      error: error.message
    });
  }
};

// Update buyer profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      country,
      phoneNumber,
      bio,
      notificationPreferences,
      preferredLanguage,
      preferredCurrency
    } = req.body;

    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Check if username is being changed and verify uniqueness
    if (username && username !== buyer.username) {
      const existingUsername = await Buyer.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      buyer.username = username;
    }

    // Update fields if provided
    if (firstName) buyer.firstName = firstName;
    if (lastName) buyer.lastName = lastName;
    if (country) buyer.country = country;
    if (phoneNumber) buyer.phoneNumber = phoneNumber;
    if (bio !== undefined) buyer.bio = bio; // Changed to handle empty string case
    if (notificationPreferences) {
      buyer.notificationPreferences = {
        ...buyer.notificationPreferences,
        ...notificationPreferences
      };
    }
    if (preferredLanguage) buyer.preferredLanguage = preferredLanguage;
    if (preferredCurrency) buyer.preferredCurrency = preferredCurrency;

    const updatedBuyer = await buyer.save();

    res.json({
      message: 'Profile updated successfully',
      buyer: {
        firstName: updatedBuyer.firstName,
        lastName: updatedBuyer.lastName,
        username: updatedBuyer.username,
        email: updatedBuyer.email,
        country: updatedBuyer.country,
        phoneNumber: updatedBuyer.phoneNumber,
        bio: updatedBuyer.bio,
        notificationPreferences: updatedBuyer.notificationPreferences,
        preferredLanguage: updatedBuyer.preferredLanguage,
        preferredCurrency: updatedBuyer.preferredCurrency
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update profile',
      error: error.message
    });
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
      subject: 'Your New Verification Code - Auqli',
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 20px;">New Verification Code</h1>
            <p style="font-size: 16px; line-height: 1.5;">You requested a new verification code. Here it is:</p>
            
            <div style="background-color: #333333; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #4CAF50; margin-bottom: 15px;">Your New Code</h3>
              <p style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; margin: 20px 0; color: #4CAF50;">${otp}</p>
              <p style="font-size: 14px; color: #999999;">This code will expire in 10 minutes.</p>
            </div>

            <p style="font-size: 14px; line-height: 1.5; color: #999999;">If you didn't request this code, please ignore this email or contact our support team if you have concerns.</p>

            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
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



// Get buyer's orders with filtering
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate('items.product', 'name images price')
      .populate('items.seller', 'storeName')
      .sort({ createdAt: -1 });
    res.json({
      orders,
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

    // Create notification for seller
    await notificationController.createNotification(sellerId, 'new_follower', {
      buyerId: buyerId,
      buyerName: `${buyer.firstName} ${buyer.lastName}`,
      followDate: new Date()
    });

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

// Send OTP to phone number
exports.sendPhoneOTP = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { phoneNumber } = req.body;

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        message: 'Invalid phone number format. Please include country code (e.g., +1234567890)'
      });
    }

    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Generate OTP
    const phoneOTP = generatePhoneOTP();

    // Store OTP and its expiry in buyer document
    buyer.phoneVerification = {
      otp: phoneOTP,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP valid for 10 minutes
      attempts: 0
    };
    await buyer.save();

    // Send SMS via AWS SNS
    // Asynchronous function to send an SMS message using AWS SNS
    async function sendSMSMessage(sns, params) {
      // Create a new PublishCommand with the specified parameters
      const command = new PublishCommand(params);

      // Send the SMS message using the SNS client and the created command
      const message = await sns.send(command);

      // Return the result of the message sending operation
      return message;
    }


    // Main asynchronous function (IIFE) to send an SMS message
    (async () => {
      // Define parameters for the SMS message
      const params = {
        Message: `Your Auqli verification code is: ${phoneOTP}. Valid for 10 minutes.`, // Generate a 6-digit OTP code
        PhoneNumber: phoneNumber, // Recipient's phone number from environment variables
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            'DataType': 'String',
            'StringValue': 'AUQLI'
          }
        }
      };

      // Create an SNS client with the specified configuration
      const sns = new SNSClient({
        region: process.env.AWS_REGION, // AWS region from environment variables
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID, // AWS access key from environment variables
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY // AWS secret key from environment variables
        }
      });

      // Send the SMS message using the defined SNS client and parameters
      const response = await sendSMSMessage(sns, params);
      console.log('sms response', response);
    })();

    res.json({
      message: 'OTP sent successfully',
      validFor: '10 minutes'
    });


  } catch (error) {
    console.error('Send phone OTP error:', error);
    res.status(500).json({
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

// Verify phone OTP
exports.verifyPhoneOTP = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { otp } = req.body;

    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Check if there's an ongoing verification
    if (!buyer.phoneVerification || !buyer.phoneVerification.otp) {
      return res.status(400).json({
        message: 'No verification in progress. Please request a new OTP.'
      });
    }

    // Check if OTP has expired
    if (new Date() > new Date(buyer.phoneVerification.expiresAt)) {
      buyer.phoneVerification = undefined;
      await buyer.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts
    if (buyer.phoneVerification.attempts >= 3) {
      buyer.phoneVerification = undefined;
      await buyer.save();
      return res.status(400).json({
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (buyer.phoneVerification.otp !== otp) {
      buyer.phoneVerification.attempts += 1;
      await buyer.save();
      return res.status(400).json({
        message: 'Invalid OTP',
        remainingAttempts: 3 - buyer.phoneVerification.attempts
      });
    }

    // OTP is valid - update verification status
    buyer.phoneVerified = true;
    buyer.phoneVerification = undefined; // Clear verification data
    await buyer.save();

    res.json({
      message: 'Phone number verified successfully',
      phoneVerified: true
    });

  } catch (error) {
    console.error('Verify phone OTP error:', error);
    res.status(500).json({
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
};

// Get buyer details
exports.getBuyerDetails = async (req, res) => {
  try {
    // Find buyer and populate essential fields
    const buyer = await Buyer.findById(req.user.id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate({
        path: 'selectedCategories',
        select: 'name subCategories'
      });

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Get buyer's latest 5 orders with populated data
    const recentOrders = await Order.find({ buyer: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'items.product',
        select: 'name images price description'
      })
      .populate({
        path: 'seller',
        select: 'storeName businessName'
      })
      .select('orderNumber totalAmount status createdAt items delivery_address shipping paymentInfo');

    // Get unique product IDs from all orders
    const allOrderedProductIds = await Order.find({
      buyer: req.user.id,
      'paymentInfo.status': 'completed'
    })
      .distinct('items.product');

    // Get latest 3 unique products purchased
    const recentProducts = await Product.find({
      _id: { $in: allOrderedProductIds }
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('seller', 'storeName businessName')
      .select('name images price description category');

    // Format shipping addresses with additional details
    const formattedAddresses = buyer.shippingAddresses.map(address => ({
      id: address._id,
      type: address.addressType,
      fullName: `${address.firstName} ${address.lastName}`,
      fullAddress: `${address.addressLine1}${address.addressLine2 ? `, ${address.addressLine2}` : ''}`,
      city: address.city,
      state: address.state,
      country: address.country,
      zipCode: address.zipCode,
      isDefault: address.isDefault || false,
      lastUsed: address.lastUsed,
      phoneNumber: address.phoneNumber,
      email: address.email,
      coordinates: address.coordinates || null
    }));

    // Prepare response object
    const response = {
      personalInfo: {
        id: buyer._id,
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        email: buyer.email,
        phoneNumber: buyer.phoneNumber,
        profileImage: buyer.profileImage,
        country: buyer.country,
        joinedDate: buyer.createdAt,
        isVerified: buyer.isIdentityVerified,
        bio: buyer.bio
      },
      addresses: formattedAddresses,
      preferences: {
        selectedCategories: buyer.selectedCategories,
        notifications: buyer.notificationPreferences,
        currency: buyer.preferredCurrency || 'NGN',
        language: buyer.preferredLanguage || 'en'
      },
      orderStats: {
        totalOrders: await Order.countDocuments({ buyer: req.user.id }),
        recentOrders: recentOrders.map(order => ({
          orderId: order._id,
          orderNumber: order.orderNumber,
          date: order.createdAt,
          total: order.totalAmount,
          status: order.status,
          items: order.items.map(item => ({
            product: {
              id: item.product._id,
              name: item.product.name,
              image: item.product.images[0],
              price: item.price
            },
            quantity: item.quantity,
            status: item.status
          })),
          shipping: {
            method: order.shipping.method,
            address: order.delivery_address,
            status: order.shipping.status
          },
          payment: {
            method: order.paymentInfo.method,
            status: order.paymentInfo.status
          }
        }))
      },
      recentlyPurchased: recentProducts.map(product => ({
        id: product._id,
        name: product.name,
        image: product.images[0],
        price: product.price,
        category: product.category,
        seller: product.seller
      })),
      wishlistCount: buyer.wishlist ? buyer.wishlist.length : 0
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getBuyerDetails:', error);
    res.status(500).json({
      message: 'Failed to retrieve buyer details',
      error: error.message
    });
  }
};

exports.getSellerProfile = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await Seller.findById(sellerId)
      .select('-password -bankDetails -otp -emailVerified -walletBalance -phoneNumber')
      .populate('reviews')
      .lean();

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Get counts using Promise.all for better performance
    const [orders, streamCount, followingCount, reviews] = await Promise.all([
      Order.find({ seller: sellerId }),
      Stream.countDocuments({ seller: sellerId }),
      Buyer.countDocuments({ 'followers.sellerId': sellerId }),
      Order.aggregate([
        { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'reviews',
            localField: 'items.product',
            foreignField: 'product',
            as: 'productReviews'
          }
        },
        { $unwind: '$productReviews' },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$productReviews.rating' }
          }
        }
      ])
    ]);

    // Calculate delivered orders count
    const soldItemsCount = orders.reduce((count, order) => {
      const deliveredItems = order.items.filter(item =>
        order.shipping?.tracking?.status === 'delivered'
      ).length;
      return count + deliveredItems;
    }, 0);

    // Calculate review statistics
    const reviewStats = {
      averageRating: seller.stats?.averageRating || 0,
      totalReviews: seller.stats?.totalReviews || 0,
      ratingDistribution: seller.stats?.ratingDistribution || {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      },
      verifiedPurchaseCount: seller.reviews?.filter(r => r.isVerifiedPurchase)?.length || 0
    };

    const sellerProfile = {
      personalInfo: {
        firstName: seller.firstName,
        lastName: seller.lastName,
      },
      storeInfo: {
        storeName: seller.storeName,
        aboutStore: seller.aboutStore,
        storeAvatar: seller.storeAvatar,
        storeBanner: seller.storeBanner,
        isVerified: seller.isVerified,
        isFeatured: seller.isFeatured,
        joinedDate: seller.createdAt,
        bio: seller.aboutStore,
        isFollowing: seller.followers?.some(
          follower => follower.buyerId?.toString() === req.user.id
        ) || false,
        socialMedia: {
          instagram: seller.socialMedia?.instagram || null,
          facebook: seller.socialMedia?.facebook || null,
          tiktok: seller.socialMedia?.tiktok || null
        }
      },
      businessInfo: {
        businessName: seller.businessName,
        businessType: seller.businessType,
        categories: seller.categories,
        addresses: {
          business: seller.businessAddress,
          warehouse: seller.warehouseDetails,
          seller: seller.sellerAddress
        }
      },
      storePolicies: {
        delivery: {
          processingTime: seller.storePolicy?.processingTime || null,
          deliveryTimes: seller.storePolicy?.deliveryTimes || null,
          freeShippingPolicy: seller.storePolicy?.freeShippingPolicy || null,
          allowsCod: seller.storePolicy?.allowsCod || true, // Add this line
        },
        returns: {
          returnWindow: seller.storePolicy?.returnWindow || 14,
          returnCondition: seller.storePolicy?.returnCondition || null,
          returnShipping: seller.storePolicy?.returnShipping || null,
          nonRefundableItems: seller.storePolicy?.nonRefundableItems || [],
        },
        refunds: {
          refundPolicy: seller.storePolicy?.refundPolicy || null,
          refundMethod: seller.storePolicy?.refundMethod || null,
          lostOrDamagedPolicy: seller.storePolicy?.lostOrDamagedPolicy || null,
        },
        exchange: {
          exchangePolicy: seller.storePolicy?.exchangePolicy || null,
        }
      },
      stats: {
        followersCount: seller.followers?.length || 0,
        followingCount: followingCount,
        totalOrders: orders.length,
        totalStreams: streamCount,
        soldItems: soldItemsCount,
      },
      reviews: {
        averageRating: parseFloat(reviewStats.averageRating),
        totalReviews: reviewStats.totalReviews,
        ratingDistribution: reviewStats.ratingDistribution,
      }
    };

    // Increment store visits
    await Seller.findByIdAndUpdate(sellerId, { $inc: { storeVisits: 1 } });

    res.json(sellerProfile);

  } catch (error) {
    console.error('Error fetching seller profile:', error);
    res.status(500).json({
      message: 'Failed to fetch seller profile',
      error: error.message
    });
  }
};

exports.getSelectedCategories = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id)
      .select('selectedCategories')
      .populate({
        path: 'selectedCategories',
        select: 'name subCategories'
      });

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    res.json({
      categories: buyer.selectedCategories.map(category => ({
        name: category.name,
        subCategories: category.subCategories.map(sub => ({
          name: sub.name
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching selected categories:', error);
    res.status(500).json({
      message: 'Failed to fetch selected categories',
      error: error.message
    });
  }
};


// Verify buyer's identity
exports.verifyIdentity = async (req, res) => {
  try {
    const { buyerId } = req.params;
    const { note } = req.body;

    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Update verification status
    buyer.isIdentityVerified = true;
    buyer.identityDocument.status = 'verified';
    if (note) {
      buyer.identityVerificationNote = note;
    }

    await buyer.save();

    // Send email notification to buyer
    const msg = {
      to: buyer.email,
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'Identity Verification Approved - Auqli',
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 20px;">Identity Verification Approved</h1>
            <p style="font-size: 16px; line-height: 1.5;">Great news! Your identity has been verified successfully. You now have full access to all features on Auqli.</p>
            
            <div style="background-color: #333333; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #4CAF50; margin-bottom: 15px;">What's Next?</h3>
              <p style="font-size: 14px; color: #ffffff;">You can now enjoy all the benefits of being a verified user on our platform.</p>
            </div>

            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
    } catch (sendError) {
      console.error('SendGrid error:', sendError);
      // Continue with the response even if email fails
    }

    res.json({
      message: 'Identity verified successfully',
      buyer: {
        id: buyer._id,
        isIdentityVerified: buyer.isIdentityVerified,
        identityDocument: buyer.identityDocument,
        verificationNote: buyer.identityVerificationNote
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to verify identity',
      error: error.message
    });
  }
};



// Get buyer's followers
exports.getFollowers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const buyer = await Buyer.findById(req.user.id)
      .populate({
        path: 'followers.sellerId',
        select: 'firstName lastName storeName businessName profileImage storeAvatar'
      });

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = buyer.followers.length;

    // Get paginated followers
    const followers = buyer.followers.slice(startIndex, endIndex);

    // Format followers data
    const formattedFollowers = followers.map(follower => ({
      id: follower.sellerId._id,
      type: 'seller',
      name: `${follower.sellerId.firstName} ${follower.sellerId.lastName}`,
      storeName: follower.sellerId.storeName || follower.sellerId.businessName,
      profileImage: follower.sellerId.storeAvatar?.url || follower.sellerId.profileImage?.url,
      followDate: follower.followDate
    }));

    res.json({
      followers: formattedFollowers,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: parseInt(page),
        hasMore: endIndex < total
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve followers',
      error: error.message
    });
  }
};

// Get users the buyer follows
exports.getFollowing = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const buyerId = req.user.id;

    // Find sellers that this buyer follows
    const sellers = await Seller.find({
      'followers.buyerId': buyerId
    }).select('_id firstName lastName storeName businessName storeAvatar profileImage followers');

    // Find buyers that this buyer follows
    const buyers = await Buyer.find({
      'followers.buyerId': buyerId
    }).select('_id firstName lastName profileImage followers');

    // Combine and format following data
    let following = [
      ...sellers.map(seller => {
        const followerData = seller.followers.find(f => f.buyerId?.toString() === buyerId);
        return {
          id: seller._id,
          type: 'seller',
          name: `${seller.firstName} ${seller.lastName}`,
          storeName: seller.storeName || seller.businessName,
          profileImage: seller.storeAvatar?.url || seller.profileImage?.url,
          followDate: followerData?.followDate
        };
      }).filter(f => f.followDate), // Filter out any undefined followDates
      ...buyers.map(buyer => {
        const followerData = buyer.followers.find(f => f.buyerId?.toString() === buyerId);
        return {
          id: buyer._id,
          type: 'buyer',
          name: `${buyer.firstName} ${buyer.lastName}`,
          storeName: null,
          profileImage: buyer.profileImage?.url,
          followDate: followerData?.followDate
        };
      }).filter(f => f.followDate) // Filter out any undefined followDates
    ];

    // Sort by follow date
    following.sort((a, b) => new Date(b.followDate) - new Date(a.followDate));

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = following.length;
    following = following.slice(startIndex, endIndex);

    res.json({
      following,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: parseInt(page),
        hasMore: endIndex < total
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve following list',
      error: error.message
    });
  }
};

// Review a seller's store
exports.reviewSeller = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { sellerId } = req.params;
    const { rating, comment } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Find seller
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Check if buyer has already reviewed this seller
    const existingReview = seller.reviews.find(
      review => review.buyer.toString() === buyerId
    );

    // if (existingReview) {
    //   return res.status(400).json({ message: 'You have already reviewed this seller' });
    // }

    // Get buyer details
    const buyer = await Buyer.findById(buyerId);

    // Create new review
    const review = {
      buyer: buyerId,
      rating,
      comment,
      buyerName: `${buyer.firstName} ${buyer.lastName}`,
      buyerImage: buyer.profileImage?.url,
      createdAt: new Date(),
      isVerifiedPurchase: await hasVerifiedPurchase(buyerId, sellerId)
    };

    // Add review to seller's reviews array
    seller.reviews.push(review);

    // Update seller's rating statistics
    updateSellerRatingStats(seller);

    await seller.save();

    // // Create notification for seller
    // await notificationController.createSellerNotification(
    //   sellerId,
    //   'new_review',
    //   {
    //     buyerId,
    //     buyerName: `${buyer.firstName} ${buyer.lastName}`,
    //     rating,
    //     reviewId: review._id
    //   }
    // );

    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Error in reviewSeller:', error);
    res.status(500).json({
      message: 'Failed to submit review',
      error: error.message
    });
  }
};

// Get all reviews for a seller
exports.getSellerReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;

    const seller = await Seller.findById(sellerId)
      .select('reviews stats.averageRating stats.totalReviews stats.ratingDistribution');

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Sort reviews based on query parameter
    let sortedReviews = [...seller.reviews];
    switch (sort) {
      case 'rating-high':
        sortedReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating-low':
        sortedReviews.sort((a, b) => a.rating - b.rating);
        break;
      default: // recent
        sortedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReviews = sortedReviews.slice(startIndex, endIndex);

    // Populate buyer details for paginated reviews
    const populatedReviews = await Promise.all(
      paginatedReviews.map(async (review) => {
        const buyer = await Buyer.findById(review.buyer)
          .select('firstName lastName profileImage');
        return {
          ...review.toObject(),
          buyer: {
            id: buyer._id,
            name: `${buyer.firstName} ${buyer.lastName}`,
            image: buyer.profileImage?.url
          }
        };
      })
    );

    res.json({
      reviews: populatedReviews,
      stats: {
        averageRating: seller.stats.averageRating,
        totalReviews: seller.stats.totalReviews,
        ratingDistribution: seller.stats.ratingDistribution,
        verifiedPurchaseCount: seller.reviews.filter(r => r.isVerifiedPurchase).length
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(seller.reviews.length / limit),
        totalReviews: seller.reviews.length
      }
    });
  } catch (error) {
    console.error('Error in getSellerReviews:', error);
    res.status(500).json({
      message: 'Failed to retrieve seller reviews',
      error: error.message
    });
  }
};

// Helper function to check if buyer has made a verified purchase from seller
async function hasVerifiedPurchase(buyerId, sellerId) {
  const completedOrder = await Order.findOne({
    buyer: buyerId,
    seller: sellerId,
    'paymentInfo.status': 'completed',
    'shipping.status': 'delivered'
  });
  return !!completedOrder;
}

// Helper function to update seller rating statistics
function updateSellerRatingStats(seller) {
  const ratings = seller.reviews.map(review => review.rating);
  const totalRatings = ratings.length;

  // Calculate average rating
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  seller.stats.averageRating = totalRatings > 0 ? (sum / totalRatings).toFixed(1) : 0;
  seller.stats.totalReviews = totalRatings;

  // Update rating distribution
  seller.stats.ratingDistribution = {
    1: ratings.filter(r => r === 1).length,
    2: ratings.filter(r => r === 2).length,
    3: ratings.filter(r => r === 3).length,
    4: ratings.filter(r => r === 4).length,
    5: ratings.filter(r => r === 5).length
  };
}

// Get notification preferences
exports.getNotificationPreferences = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id)
      .select('notificationPreferences');

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    res.json({
      message: 'Notification preferences retrieved successfully',
      preferences: buyer.notificationPreferences
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve notification preferences',
      error: error.message
    });
  }
};

// Update notification preferences
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const { preferences } = req.body;

    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Deep merge the existing preferences with the new ones
    buyer.notificationPreferences = {
      ...buyer.notificationPreferences,
      ...preferences,
      orderUpdates: {
        ...buyer.notificationPreferences.orderUpdates,
        ...(preferences.orderUpdates || {})
      },
      liveShows: {
        ...buyer.notificationPreferences.liveShows,
        ...(preferences.liveShows || {})
      },
      messages: {
        ...buyer.notificationPreferences.messages,
        ...(preferences.messages || {})
      },
      communityActivity: {
        ...buyer.notificationPreferences.communityActivity,
        ...(preferences.communityActivity || {})
      },
      promotionsAndSales: {
        ...buyer.notificationPreferences.promotionsAndSales,
        ...(preferences.promotionsAndSales || {})
      }
    };

    await buyer.save();

    res.json({
      message: 'Notification preferences updated successfully',
      preferences: buyer.notificationPreferences
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update notification preferences',
      error: error.message
    });
  }
};

// Forgot password - send OTP
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const buyer = await Buyer.findOne({ email });
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Generate and save OTP
    const resetOTP = generateResetOTP();
    buyer.resetPasswordOTP = resetOTP;
    buyer.resetPasswordOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await buyer.save();

    // Send email with OTP
    const msg = {
      to: email,
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'Password Reset Code - Auqli',
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 20px;">Password Reset Code</h1>
            <p style="font-size: 16px; line-height: 1.5;">You requested to reset your password. Here's your verification code:</p>
            
            <div style="background-color: #333333; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #4CAF50; margin-bottom: 15px;">Your Reset Code</h3>
              <p style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; margin: 20px 0; color: #4CAF50;">${resetOTP}</p>
              <p style="font-size: 14px; color: #999999;">This code will expire in 10 minutes.</p>
            </div>

            <p style="font-size: 14px; line-height: 1.5; color: #999999;">If you didn't request this code, please ignore this email or contact our support team if you have concerns.</p>

            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);

    res.json({
      message: 'Password reset code sent successfully',
      validFor: '10 minutes'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      message: 'Failed to process password reset request',
      error: error.message
    });
  }
};

// Reset password with OTP
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      message: 'Email, OTP, and new password are required'
    });
  }

  try {
    const buyer = await Buyer.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() }
    });

    if (!buyer) {
      return res.status(400).json({
        message: 'Invalid or expired reset code'
      });
    }

    // Update password and clear reset fields
    buyer.password = newPassword;
    buyer.resetPasswordOTP = undefined;
    buyer.resetPasswordOTPExpires = undefined;
    await buyer.save();

    res.json({
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

// Request account deletion (sends OTP)
exports.requestAccountDeletion = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Generate deletion OTP
    const deletionOTP = generateOTP(); // Assuming you have this helper function
    buyer.accountDeletion = {
      otp: deletionOTP,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
      attempts: 0
    };
    await buyer.save();

    // Send email with OTP
    const msg = {
      to: buyer.email,
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'Account Deletion Request - Auqli',
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #ff4444; margin-bottom: 20px;">Account Deletion Request</h1>
            <p style="font-size: 16px; line-height: 1.5;">We received a request to delete your Auqli account. To confirm this action, please use the verification code below:</p>
            
            <div style="background-color: #333333; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #ff4444; margin-bottom: 15px;">Verification Code</h3>
              <p style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; margin: 20px 0; color: #ff4444;">${deletionOTP}</p>
              <p style="font-size: 14px; color: #999999;">This code will expire in 10 minutes.</p>
            </div>

            <p style="font-size: 16px; line-height: 1.5; color: #ff4444; font-weight: bold;">Warning: This action cannot be undone. All your data will be permanently deleted.</p>
            
            <p style="font-size: 14px; line-height: 1.5; color: #999999;">If you didn't request this deletion, please ignore this email and secure your account.</p>

            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);

    res.json({
      message: 'Account deletion verification code sent to your email',
      validFor: '10 minutes'
    });

  } catch (error) {
    console.error('Request account deletion error:', error);
    res.status(500).json({
      message: 'Failed to process account deletion request',
      error: error.message
    });
  }
};

// Confirm and execute account deletion
exports.confirmAccountDeletion = async (req, res) => {
  try {
    const { otp } = req.body;
    const buyer = await Buyer.findById(req.user.id);

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Verify OTP
    if (!buyer.accountDeletion || !buyer.accountDeletion.otp) {
      return res.status(400).json({
        message: 'No deletion request found. Please request account deletion first.'
      });
    }

    if (new Date() > buyer.accountDeletion.expiresAt) {
      return res.status(400).json({
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    if (buyer.accountDeletion.attempts >= 5) {
      return res.status(400).json({
        message: 'Too many failed attempts. Please request a new verification code.'
      });
    }

    if (buyer.accountDeletion.otp !== otp) {
      buyer.accountDeletion.attempts += 1;
      await buyer.save();
      return res.status(400).json({
        message: 'Invalid verification code',
        remainingAttempts: 3 - buyer.accountDeletion.attempts
      });
    }

    // Send confirmation email before deletion
    const msg = {
      to: buyer.email,
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'Account Deleted Successfully - Auqli',
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #ff4444; margin-bottom: 20px;">Account Deleted</h1>
            <p style="font-size: 16px; line-height: 1.5;">Your Auqli account has been successfully deleted. We're sorry to see you go.</p>
            
            <p style="font-size: 14px; line-height: 1.5; margin-top: 20px;">If you change your mind, you can always create a new account in the future.</p>

            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);

    // Delete the buyer account
    await Buyer.findByIdAndDelete(req.user.id);

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Confirm account deletion error:', error);
    res.status(500).json({
      message: 'Failed to delete account',
      error: error.message
    });
  }
};

exports.handleGoogleCallback = async (req, res) => {
  try {
    const buyer = req.user;
    const token = generateToken(buyer._id);

    // If this is a mobile app callback, you might want to redirect to a deep link
    if (req.query.state) {
      const state = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
      if (state.expoPushToken) {
        await saveToken(buyer._id, state.expoPushToken);
      }
    }

    // For web clients
    res.json({
      token,
      user: {
        _id: buyer._id,
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        email: buyer.email,
        profileImage: buyer.profileImage,
        emailVerified: buyer.emailVerified
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Authentication failed',
      error: error.message
    });
  }
};

exports.reportUser = async (req, res) => {
  try {
    const { userId, userType, reason, description } = req.body;
    const reporterId = req.user.id;

    // Validate input
    if (!userId || !userType || !reason || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Find reporter
    const reporter = await Buyer.findById(reporterId);
    if (!reporter) {
      return res.status(404).json({ message: 'Reporter not found' });
    }

    // Find reported user
    let reportedUser;
    if (userType === 'seller') {
      reportedUser = await Seller.findById(userId);
    } else {
      reportedUser = await Buyer.findById(userId);
    }

    if (!reportedUser) {
      return res.status(404).json({ message: 'Reported user not found' });
    }

    // Add report to reporter's reports array
    reporter.reports.push({
      reportedUser: {
        userId,
        userType
      },
      reason,
      description
    });

    await reporter.save();

    // Send email notification
    const msg = {
      to: ['support@auqli.com', 'bolu@auqli.com'],
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: `New User Report - ${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #ff4444; margin-bottom: 20px;">New User Report</h1>
            
            <div style="background-color: #333333; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #ffffff; margin-bottom: 15px;">Report Details</h3>
              
              <p style="margin: 10px 0;"><strong>Reporter:</strong><br>
                Name: ${reporter.firstName} ${reporter.lastName}<br>
                ID: ${reporter._id}<br>
                Email: ${reporter.email}
              </p>

              <p style="margin: 10px 0;"><strong>Reported User:</strong><br>
                Name: ${reportedUser.firstName} ${reportedUser.lastName}<br>
                ID: ${reportedUser._id}<br>
                Type: ${userType}<br>
                ${userType === 'seller' ? `Store Name: ${reportedUser.storeName || 'N/A'}` : ''}
              </p>

              <p style="margin: 10px 0;"><strong>Reason:</strong><br>
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
      message: 'Report submitted successfully',
      report: reporter.reports[reporter.reports.length - 1]
    });

  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({
      message: 'Failed to submit report',
      error: error.message
    });
  }
};

// Generate unique payment reference
const generatePaymentReference = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAY-${timestamp}-${random}`;
};

// Get wallet balance
exports.getWalletBalance = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    res.status(200).json({
      balance: buyer.wallet.balance,
      currency: buyer.wallet.currency
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      message: 'Failed to get wallet balance',
      error: error.message
    });
  }
};

// Initiate wallet top-up - Removed: Now handled on the frontend directly with Paystack

// Send wallet top-up confirmation email
exports.sendWalletTopUpEmail = async (buyer, transaction) => {
  const formattedAmount = transaction.amount.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  });
  
  const formattedBalance = buyer.wallet.balance.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  });
  
  const formattedDate = new Date(transaction.createdAt).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const msg = {
    to: buyer.email,
    from: {
      email: 'support@auqli.com',
      name: 'Auqli Support'
    },
    subject: 'Wallet Top-Up Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://auqli.com/logo.png" alt="Auqli Logo" style="max-width: 150px;">
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
          <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Wallet Top-Up Confirmation</h2>
          
          <p style="font-size: 16px; color: #555; margin-bottom: 15px;">Hello ${buyer.firstName},</p>
          
          <p style="font-size: 16px; color: #555; margin-bottom: 15px;">Your wallet has been successfully topped up with ${formattedAmount}.</p>
          
          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Transaction Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #777; width: 40%;">Amount:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #777;">Transaction ID:</td>
                <td style="padding: 8px 0; color: #333;">${transaction.paymentReference}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #777;">Date & Time:</td>
                <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #777;">Status:</td>
                <td style="padding: 8px 0; color: #333;">
                  <span style="color: #4CAF50; font-weight: bold;">Completed</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #777;">Current Balance:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">${formattedBalance}</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 16px; color: #555; margin-bottom: 15px;">You can now use your wallet balance to make purchases on Auqli.</p>
          
        
          
      
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #777; font-size: 14px;">
          <p>© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          <p>
            <a href="https://auqli.live/terms" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Terms of Service</a> | 
            <a href="https://auqli.live/privacy" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
          </p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('Wallet top-up confirmation email sent to:', buyer.email);
    return true;
  } catch (error) {
    console.error('Error sending wallet top-up confirmation email:', error);
    return false;
  }
};

// Verify and complete wallet top-up
exports.verifyWalletTopUp = async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({ message: 'Payment reference is required' });
    }

    // Verify with Paystack
    const verificationResponse = await paystack.get(`/transaction/verify/${reference}`);
    
    // Fix: Paystack returns status as boolean (true) not string ("success")
    if (!verificationResponse.data.status || verificationResponse.data.data.status !== 'success') {
      return res.status(400).json({ 
        message: 'Payment verification failed', 
        error: verificationResponse.data 
      });
    }

    const paymentData = verificationResponse.data.data;
    const metadata = paymentData.metadata;
    
    // For frontend-initiated payments, metadata might not have transactionType
    // So we'll check if buyerId exists and assume it's a wallet top-up
    if (!metadata || !metadata.buyerId) {
      return res.status(400).json({ message: 'Invalid payment metadata. Missing buyerId.' });
    }

    const buyerId = metadata.buyerId;
    const buyer = await Buyer.findById(buyerId);
    
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Check if transaction is already completed
    const existingTransaction = buyer.wallet.transactions.find(
      t => t.paymentReference === reference
    );

    if (existingTransaction) {
      if (existingTransaction.status === 'completed') {
        return res.status(200).json({
          message: 'Payment already processed',
          transaction: existingTransaction,
          currentBalance: buyer.wallet.balance
        });
      } else if (existingTransaction.status === 'pending') {
        // Update the existing transaction
        existingTransaction.status = 'completed';
        
        // Update wallet balance
        buyer.wallet.balance += existingTransaction.amount;
        
        await buyer.save();
        
        // Send confirmation email
        exports.sendWalletTopUpEmail(buyer, existingTransaction);
        
        return res.status(200).json({
          message: 'Wallet topped up successfully',
          transaction: existingTransaction,
          newBalance: buyer.wallet.balance
        });
      }
    }

    // If no transaction found, create a new one
    const amount = paymentData.amount / 100; // Convert from kobo to naira
    
    const newTransaction = {
      type: 'credit',
      amount,
      paymentReference: reference,
      description: metadata.description || 'Wallet top up via Paystack',
      status: 'completed',
      createdAt: new Date()
    };

    buyer.wallet.transactions.push(newTransaction);
    buyer.wallet.balance += amount;
    
    await buyer.save();
    
    // Send confirmation email
    exports.sendWalletTopUpEmail(buyer, newTransaction);
    
    return res.status(200).json({
      message: 'Wallet topped up successfully',
      transaction: newTransaction,
      newBalance: buyer.wallet.balance
    });
  } catch (error) {
    console.error('Verify wallet top-up error:', error);
    res.status(500).json({
      message: 'Failed to verify wallet top-up',
      error: error.response?.data || error.message
    });
  }
};

// Handle Paystack webhook for wallet top-up - Removed: Now consolidated in orderController.handlePaystackWebhook

// Legacy direct top-up method (for admin use or testing)
exports.topUpWallet = async (req, res) => {
  try {
    const { amount, description = 'Wallet top up', bypassPaystack = false, paymentReference } = req.body;

    // Only allow bypass for admin users or in development environment
    if (bypassPaystack && (!req.user.isAdmin && process.env.NODE_ENV !== 'development')) {
      return res.status(403).json({
        message: 'Direct wallet top-up is not allowed'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: 'Invalid amount. Amount must be greater than 0.'
      });
    }

    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Check if this is a fallback verification with an existing payment reference
    if (paymentReference) {
      // Check if transaction with this reference already exists
      const existingTransaction = buyer.wallet.transactions.find(
        t => t.paymentReference === paymentReference
      );

      if (existingTransaction) {
        if (existingTransaction.status === 'completed') {
          return res.status(200).json({
            message: 'Payment already processed',
            transaction: existingTransaction,
            newBalance: buyer.wallet.balance
          });
        } else if (existingTransaction.status === 'pending') {
          // Update the existing transaction
          existingTransaction.status = 'completed';
          buyer.wallet.balance += existingTransaction.amount;
          
          await buyer.save();
          
          // Send confirmation email
          exports.sendWalletTopUpEmail(buyer, existingTransaction);
          
          return res.status(200).json({
            message: 'Wallet topped up successfully',
            transaction: existingTransaction,
            newBalance: buyer.wallet.balance
          });
        }
      }
    }

    const transaction = {
      type: 'credit',
      amount,
      paymentReference: paymentReference || generatePaymentReference(),
      description: description + (bypassPaystack ? ' (Direct)' : ''),
      status: 'completed',
      createdAt: new Date()
    };

    // Add transaction to history and update balance
    buyer.wallet.transactions.push(transaction);
    buyer.wallet.balance += amount;

    await buyer.save();

    // Send confirmation email
    exports.sendWalletTopUpEmail(buyer, transaction);

    res.status(200).json({
      message: 'Wallet topped up successfully',
      transaction,
      newBalance: buyer.wallet.balance
    });
  } catch (error) {
    console.error('Top up wallet error:', error);
    res.status(500).json({
      message: 'Failed to top up wallet',
      error: error.message
    });
  }
};

// Get wallet transactions
exports.getWalletTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      startDate,
      endDate
    } = req.query;

    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Build filter
    let filter = {};
    if (type) {
      filter.type = type;
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Get total count for pagination
    const total = buyer.wallet.transactions.filter(t => {
      if (type && t.type !== type) return false;
      if (startDate && new Date(t.createdAt) < new Date(startDate)) return false;
      if (endDate && new Date(t.createdAt) > new Date(endDate)) return false;
      return true;
    }).length;

    // Get paginated transactions
    const transactions = buyer.wallet.transactions
      .filter(t => {
        if (type && t.type !== type) return false;
        if (startDate && new Date(t.createdAt) < new Date(startDate)) return false;
        if (endDate && new Date(t.createdAt) > new Date(endDate)) return false;
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice((page - 1) * limit, page * limit);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      transactions,
      pagination: {
        total,
        pages: totalPages,
        current: parseInt(page),
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({
      message: 'Failed to get wallet transactions',
      error: error.message
    });
  }
};

// Get sellers that can be followed
exports.getSellersToFollow = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category = '', 
      sort = 'rating' 
    } = req.query;

    // Build base query
    let query = { isDisabled: false };

    // Add search filter if provided
    if (search) {
      query.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter if provided
    if (category) {
      query['categories.name'] = { $regex: category, $options: 'i' };
    }

    // If authenticated, exclude sellers the buyer is already following
    if (req.user?.id) {
      const buyer = await Buyer.findById(req.user.id);
      if (buyer) {
        const followedSellerIds = await Seller.find({
          'followers.buyerId': req.user.id
        }).distinct('_id');
        
        if (followedSellerIds.length > 0) {
          query._id = { $nin: followedSellerIds };
        }
      }
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'rating':
        sortOptions = { 'stats.averageRating': -1 };
        break;
      case 'followers':
        // Using $size of followers array for sorting
        sortOptions = { 'followers': -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { 'stats.averageRating': -1 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const [sellers, total] = await Promise.all([
      Seller.find(query)
        .select(`
          storeName businessName aboutStore storeAvatar 
          categories stats followers isVerified isFeatured 
          createdAt
        `)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Seller.countDocuments(query)
    ]);

    // Transform seller data
    const transformedSellers = sellers.map(seller => ({
      _id: seller._id,
      storeName: seller.storeName || seller.businessName || "Shop", // Default to "Shop" if no name available
      businessName: seller.businessName,
      aboutStore: seller.aboutStore,
      storeAvatar: seller.storeAvatar,
      categories: seller.categories,
      stats: {
        averageRating: seller.stats?.averageRating || 0,
        totalReviews: seller.stats?.totalReviews || 0
      },
      followerCount: seller.followers?.length || 0,
      isVerified: seller.isVerified,
      isFeatured: seller.isFeatured,
      createdAt: seller.createdAt
    }));

    // Return response with pagination
    res.json({
      sellers: transformedSellers,
      pagination: {
        total,
        pages: Math.ceil(total / parseInt(limit)),
        current: parseInt(page),
        hasMore: skip + transformedSellers.length < total
      }
    });

  } catch (error) {
    console.error('Error in getSellersToFollow:', error);
    res.status(500).json({
      message: 'Failed to retrieve sellers',
      error: error.message
    });
  }
};

/**
 * Get public profile information for a buyer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getPublicProfile = async (req, res) => {
  try {
    const { buyerId } = req.params;
    console.log('Fetching profile for buyerId:', buyerId);

    // First, get the post count directly from the Post model
    const postCount = await Post.countDocuments({
      'author.userId': buyerId,
      'author.userModel': 'Buyer',
      visibility: 'public'
    });
    console.log('Direct post count from Post collection:', postCount);

    // Find the buyer and populate necessary fields
    const buyer = await Buyer.findById(buyerId)
      .select([
        'firstName',
        'lastName',
        'username',
        'profileImage',
        'bio',
        'country',
        'createdAt',
        'isIdentityVerified',
        'selectedCategories',
        'activityFeed',
        'posts',
        'followers',
        'following'
      ])
      .populate([
        {
          path: 'activityFeed',
          options: { 
            sort: { createdAt: -1 },
            limit: 10
          }
        },
        {
          path: 'posts',
          match: { visibility: 'public' }
        }
      ]);

    if (!buyer) {
      console.log('Buyer not found');
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    console.log('Raw buyer data:', {
      activityFeedLength: buyer.activityFeed?.length,
      postsLength: buyer.posts?.length,
      postsIds: buyer.posts?.map(p => p._id),
      followersLength: buyer.followers?.length,
      followingLength: buyer.following?.length
    });

    // Calculate total reviews from activity feed
    const totalReviews = buyer.activityFeed ? 
      buyer.activityFeed.filter(activity => {
        console.log('Activity type:', activity.type);
        return activity.type === 'product_review';
      }).length : 0;
    console.log('Total reviews:', totalReviews);

    // Calculate following count (number of follow activities)
    const totalFollowing = buyer.activityFeed ? 
      buyer.activityFeed.filter(activity => {
        console.log('Checking follow activity:', activity.type);
        return activity.type === 'follow';
      }).length : 0;
    console.log('Total following:', totalFollowing);

    // Calculate followers count
    const totalFollowers = buyer.followers ? buyer.followers.length : 0;
    console.log('Total followers:', totalFollowers);

    // Use the direct post count instead of the populated posts length
    const totalPosts = postCount;
    console.log('Total posts:', totalPosts);

    // Format the response
    const publicProfile = {
      basicInfo: {
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        username: buyer.username,
        profileImage: buyer.profileImage,
        bio: buyer.bio,
        country: buyer.country,
        joinedDate: buyer.createdAt,
        isIdentityVerified: buyer.isIdentityVerified
      },
      stats: {
        totalPosts,
        totalReviews,
        totalFollowers,
        totalFollowing
      },
      recentActivity: buyer.activityFeed?.map(activity => ({
        type: activity.type,
        content: activity.content,
        createdAt: activity.createdAt
      })) || [],
      selectedCategories: buyer.selectedCategories?.map(category => ({
        name: category.name,
        subCategories: category.subCategories?.map(sub => ({
          name: sub.name
        }))
      })) || []
    };

    console.log('Final stats:', publicProfile.stats);

    res.status(200).json({
      success: true,
      data: publicProfile
    });

  } catch (error) {
    console.error('Error in getPublicProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buyer profile',
      error: error.message
    });
  }
};


