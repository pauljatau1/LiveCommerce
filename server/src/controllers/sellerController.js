const Seller = require('../models/Seller');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('SG.REDACTED');
const Category = require('../models/Category');

// Helper function for JWT generation
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Helper function to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register a new seller
exports.register = async (req, res) => {
  const { name, email, password, avatar, addresses, phoneNumber, country, zipCode, type } = req.body;

  // Basic input validation
  if (!name || !email || !password || !phoneNumber) {
    return res.status(400).json({ message: 'Name, email, password, and phone number are required.' });
  }

  try {
    // Check for duplicate email
    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(409).json({ message: 'Email is already in use.' });
    }

    // Upload avatar if provided
    let avatarData = { url: 'https://res.cloudinary.com/dljgzevaj/image/upload/v1730579311/seller_d4qhf0.jpg', public_id: 'avatars/r918vmwdsmdrdvdgz1na' };
    if (avatar) {
      const uploadResult = await cloudinary.uploader.upload(avatar, { folder: 'avatars' });
      avatarData = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
    }

    const otp = generateOTP();
    const newSeller = new Seller({
      name,
      email,
      password,
      avatar: avatarData,
      addresses,
      phoneNumber,
      country,
      zipCode,
      type,
      otp,
    });

    await newSeller.save();

    // Generate JWT token
    const token = generateToken(newSeller._id);

    // Send email with OTP
    const msg = {
      to: email,
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'Welcome to Auqli!',
      text: `Hi ${name}, welcome to our auqli! Your OTP is ${otp}. Please use this OTP to verify your email.`,
      html: `<strong>Hi ${name}, welcome to auqli! Your OTP is ${otp}. Please use this OTP to verify your email.</strong>`,
    };

    await sgMail.send(msg);

    res.status(201).json({ user: newSeller, token });
  } catch (error) {
    res.status(500).json({ message: 'Failed to register seller', error: error.message });
  }
};

// Login a seller
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Basic input validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const seller = await Seller.findOne({ email });
    if (!seller || !(await seller.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = generateToken(seller._id);

    res.json({ user: seller, token });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Get seller profile
exports.getProfile = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user.id).select('-password');
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    res.json(seller);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve profile', error: error.message });
  }
};

// Update seller profile
exports.updateProfile = async (req, res) => {
  const { avatar, addresses, phoneNumber, zipCode, withdrawMethod, aboutSeller, tags, shippingMethods } = req.body;

  try {
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Update avatar if provided
    if (avatar) {
      if (seller.avatar.public_id) {
        await cloudinary.uploader.destroy(seller.avatar.public_id);
      }
      const uploadResult = await cloudinary.uploader.upload(avatar, { folder: 'avatars' });
      seller.avatar = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
    }

    // Update other fields if provided
    if (addresses) seller.addresses = addresses;
    if (phoneNumber) seller.phoneNumber = phoneNumber;
    if (zipCode) seller.zipCode = zipCode;
    if (withdrawMethod) seller.withdrawMethod = withdrawMethod;
    if (aboutSeller) seller.aboutSeller = aboutSeller;
    if (tags) seller.tags = tags;
    if (shippingMethods) seller.shippingMethods = shippingMethods;

    const updatedSeller = await seller.save();

    res.json({ message: 'Profile updated successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// Verify OTP and update emailVerified status
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

  try {
    const seller = await Seller.findOne({ email });
    if (!seller) return res.status(404).json({ message: 'Seller not found.' });

    if (seller.otp === otp) {
      seller.emailVerified = true;
      seller.otp = undefined; // Clear the OTP after verification
      await seller.save();
      return res.json({ message: 'Email verified successfully.' });
    } else {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
};

// Select categories for a seller
exports.selectCategories = async (req, res) => {
  const { categories } = req.body;

  try {
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Validate and update categories
    const categoryIds = categories.map(cat => cat.id);
    const validCategories = await Category.find({ _id: { $in: categoryIds } });

    if (validCategories.length !== categories.length) {
      return res.status(400).json({ message: 'Invalid category IDs provided' });
    }

    seller.categories = categories;
    await seller.save();

    res.json({ message: 'Categories selected successfully', seller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to select categories', error: error.message });
  }
};

// Update selected categories for a seller
exports.updateCategories = async (req, res) => {
  const { categories } = req.body;

  try {
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Validate and update categories
    const categoryIds = categories.map(cat => cat.id);
    const validCategories = await Category.find({ _id: { $in: categoryIds } });

    if (validCategories.length !== categories.length) {
      return res.status(400).json({ message: 'Invalid category IDs provided' });
    }

    seller.categories = categories;
    await seller.save();

    res.json({ message: 'Categories updated successfully', seller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update categories', error: error.message });
  }
}

exports.getFollowers = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found.' });
    }
    res.json(seller.followers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve followers', error: error.message });
  }
};

