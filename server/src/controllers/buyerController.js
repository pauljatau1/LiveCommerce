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
// Import required AWS SDK modules for SNS (Simple Notification Service)
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
sgMail.setApiKey('SG.REDACTED');
// Load environment variables from a .env file
require('dotenv').config();

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
        // username: !username ? 'Username is required' : null,
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
      subject: 'Password Reset Request - Auqli',
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 20px;">Reset Your Password</h1>
            <p style="font-size: 16px; line-height: 1.5;">We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>

            <div style="background-color: #333333; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #4CAF50; margin-bottom: 15px;">Important Security Notice</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 10px; color: #999999;">• This link will expire in 1 hour</li>
                <li style="margin-bottom: 10px; color: #999999;">• If you didn't request this reset, please ignore this email</li>
                <li style="margin-bottom: 10px; color: #999999;">• Never share your password reset link with anyone</li>
              </ul>
            </div>

            <p style="font-size: 14px; color: #999999;">Alternatively, you can copy and paste this link into your browser:</p>
            <p style="font-size: 14px; color: #4CAF50; word-break: break-all;">${resetUrl}</p>

            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
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
      subject: 'Password Reset Successful - Auqli',
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 20px;">Password Reset Successful!</h1>
            <p style="font-size: 16px; line-height: 1.5;">Your password has been successfully reset.</p>
            
            <div style="background-color: #333333; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #4CAF50; margin-bottom: 15px;">What's Next?</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 10px; display: flex; align-items: center;">
                  <span style="color: #4CAF50; margin-right: 10px;">✓</span> You can now log in with your new password
                </li>
                <li style="margin-bottom: 10px; display: flex; align-items: center;">
                  <span style="color: #4CAF50; margin-right: 10px;">✓</span> Review your account security settings
                </li>
                <li style="margin-bottom: 10px; display: flex; align-items: center;">
                  <span style="color: #4CAF50; margin-right: 10px;">⚠</span> If you didn't make this change, please contact support immediately
                </li>
              </ul>
            </div>

            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
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

