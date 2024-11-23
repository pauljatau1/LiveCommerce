const Seller = require('../models/Seller');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('SG.REDACTED');
const Category = require('../models/Category');

// Helper function for JWT generation
const generateToken = (id) => {
  return jwt.sign({ id, role: 'Seller' }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Helper function to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register a new seller
exports.register = async (req, res) => {
  const { firstName, lastName, email, password, phoneNumber } = req.body;

  // Basic input validation
  if (!firstName || !lastName || !email || !password || !phoneNumber) {
    return res.status(400).json({ message: 'First name, last name, email, password, and phone number are required.' });
  }

  try {
    // Check for duplicate email
    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(409).json({ message: 'Email is already in use.' });
    }

    const otp = generateOTP();
    const newSeller = new Seller({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
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
      text: `Hi ${firstName}, welcome to our auqli! Your OTP is ${otp}. Please use this OTP to verify your email.`,
      html: `<strong>Hi ${firstName}, welcome to auqli! Your OTP is ${otp}. Please use this OTP to verify your email.</strong>`,
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

    const profile = {
      ...seller.toObject(),
      role: 'Seller'
    };

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve profile', error: error.message });
  }
};

// Update seller profile
exports.updateProfile = async (req, res) => {
  const {
    businessName,
    businessAddress,
    accountType,
    verificationDocuments,
    bankDetails,
    categories,
    shippingOptions,
    warehouseAddress,
    storeName,
    aboutStore,
    storeAvatar,
    storeBanner
  } = req.body;

  try {
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Update store avatar if provided
    if (storeAvatar) {
      if (seller.storeAvatar.public_id) {
        await cloudinary.uploader.destroy(seller.storeAvatar.public_id);
      }
      const uploadResult = await cloudinary.uploader.upload(storeAvatar, { folder: 'avatars' });
      seller.storeAvatar = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
    }

    // Update store banner if provided
    if (storeBanner) {
      if (seller.storeBanner.public_id) {
        await cloudinary.uploader.destroy(seller.storeBanner.public_id);
      }
      const uploadResult = await cloudinary.uploader.upload(storeBanner, { folder: 'banners' });
      seller.storeBanner = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
    }

    // Update other fields if provided
    if (businessName) seller.businessName = businessName;
    if (businessAddress) seller.businessAddress = businessAddress;
    if (accountType) seller.accountType = accountType;
    if (verificationDocuments) seller.verificationDocuments = verificationDocuments;
    if (bankDetails) seller.bankDetails = bankDetails;
    if (categories) seller.categories = categories;
    if (shippingOptions) seller.shippingOptions = shippingOptions;
    if (warehouseAddress) seller.warehouseAddress = warehouseAddress;
    if (storeName) seller.storeName = storeName;
    if (aboutStore) seller.aboutStore = aboutStore;

    // Set isVerified to false if accountType is business
    if (accountType === 'business') {
      seller.isVerified = false;
    }

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
