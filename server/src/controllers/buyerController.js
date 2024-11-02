const Buyer = require('../models/Buyer');
const jwt = require('jsonwebtoken');

// Register a new buyer
exports.register = async (req, res) => {
  const { firstName, lastName, username, email, country, phoneNumber, password, profileImage} = req.body;

  try {
    const newBuyer = new Buyer({
      firstName,
      lastName,
      username,
      email,
      country,
      phoneNumber,
      password,
      profileImage,
    });
    
    await newBuyer.save();

    // Generate JWT token
    const token = jwt.sign({ id: newBuyer._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return user and token
    res.status(201).json({ user: newBuyer, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login a buyer
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const buyer = await Buyer.findOne({ email });
    if (!buyer || !(await buyer.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: buyer._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return user and token
    res.json({ user: buyer, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get buyer profile
exports.getProfile = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id).select('-password'); // Exclude password from response
    res.json(buyer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update buyer profile
exports.updateProfile = async (req, res) => {
  const { firstName, lastName, country, phoneNumber, profileImage, shippingAddresses, bio } = req.body;

  try {
    const updatedBuyerData = {
      firstName,
      lastName,
      phoneNumber,
      profileImage,
      bio,
    };

    // Update country only if provided in request body
    if (country) {
      updatedBuyerData.country = country;
    }

    const updatedBuyer = await Buyer.findByIdAndUpdate(
      req.user.id,
      updatedBuyerData,
      { new: true } // Return the updated document
    ).select('-password'); // Exclude password from response

    if (!updatedBuyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Update shipping addresses separately if provided
    if (shippingAddresses) {
      const updatedAddresses = shippingAddresses.map(address => ({
        ...address,
        country: address.country || updatedBuyer.country // Default to current country if not provided
      }));

      updatedBuyer.shippingAddresses = updatedAddresses;
      await updatedBuyer.save(); // Save the updated addresses
    }

    res.json(updatedBuyer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};