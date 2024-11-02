const Seller = require('../models/Seller');
const jwt = require('jsonwebtoken');

// Register a new seller
exports.register = async (req, res) => {
  const { name, email, password, avatar, addresses, phoneNumber, country, zipCode, type } = req.body;

  try {
    const newSeller = new Seller({
      name,
      email,
      password,
      avatar,
      addresses,
      phoneNumber,
      country,
      zipCode,
      type,
    });

    await newSeller.save();

    // Generate JWT token
    const token = jwt.sign({ id: newSeller._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return user and token
    res.status(201).json({ user: newSeller, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login a seller
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const seller = await Seller.findOne({ email });
    if (!seller || !(await seller.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: seller._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return user and token
    res.json({ user: seller, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get seller profile
exports.getProfile = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user.id).select('-password'); // Exclude password from response
    res.json(seller);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update seller profile
exports.updateProfile = async (req, res) => {
  const { avatar, addresses, phoneNumber, zipCode, withdrawMethod, aboutShop, tags, shippingMethods } = req.body;

  try {
    const updatedSellerData = {};

    if (avatar) updatedSellerData.avatar = avatar;
    
    if (addresses) updatedSellerData.addresses = addresses;
    
    if (phoneNumber) updatedSellerData.phoneNumber = phoneNumber;

    if (zipCode) updatedSellerData.zipCode = zipCode;

    if (withdrawMethod) updatedSellerData.withdrawMethod = withdrawMethod;

    if (aboutShop) updatedSellerData.aboutShop = aboutShop;

    if (tags) updatedSellerData.tags = tags;

    if (shippingMethods) updatedSellerData.shippingMethods = shippingMethods;

    const updatedSeller = await Seller.findByIdAndUpdate(
      req.user.id,
      updatedSellerData,
      { new: true } // Return the updated document
    ).select('-password'); // Exclude password from response

    if (!updatedSeller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.json(updatedSeller);
  } catch (error) {
     res.status(400).json({ error: error.message });
  }
};