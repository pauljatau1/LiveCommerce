const Seller = require('../models/Seller');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

// Helper function for JWT generation
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

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
    let avatarData = { url: 'https://res.cloudinary.com/dljgzevaj/image/upload/v1730579311/shop_d4qhf0.jpg', public_id: 'avatars/r918vmwdsmdrdvdgz1na' };
    if (avatar) {
      const uploadResult = await cloudinary.uploader.upload(avatar, { folder: 'avatars' });
      avatarData = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
    }

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
    });

    await newSeller.save();

    // Generate JWT token
    const token = generateToken(newSeller._id);

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
  const { avatar, addresses, phoneNumber, zipCode, withdrawMethod, aboutShop, tags, shippingMethods } = req.body;

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
    if (aboutShop) seller.aboutShop = aboutShop;
    if (tags) seller.tags = tags;
    if (shippingMethods) seller.shippingMethods = shippingMethods;

    const updatedSeller = await seller.save();

    res.json({ message: 'Profile updated successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};
