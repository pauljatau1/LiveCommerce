const Buyer = require('../models/Buyer');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('SG.REDACTED');

// Helper function to generate JWT
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper function to upload avatar to Cloudinary
const uploadAvatar = async (image, folder) => {
  if (!image) {
    return {
      url: 'https://res.cloudinary.com/dljgzevaj/image/upload/v1730579531/user-account-management-logo-user-icon-11562867145a56rus2zwu_cgs18m.png',
      public_id: 'avatars/r918vmwdsmdrdvdgz1na',
    };
  }
  const uploadResult = await cloudinary.uploader.upload(image, { folder });
  return { url: uploadResult.secure_url, public_id: uploadResult.public_id };
};

// Register a new buyer
exports.register = async (req, res) => {
  const { firstName, lastName, username, email, country, phoneNumber, password, profileImage } = req.body;

  if (!firstName || !lastName || !username || !email || !phoneNumber || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const existingBuyer = await Buyer.findOne({ email });
    if (existingBuyer) return res.status(409).json({ message: 'Email is already in use.' });

    const avatarData = await uploadAvatar(profileImage, 'profileImages');
    const otp = generateOTP();
    const newBuyer = new Buyer({ firstName, lastName, username, email, country, phoneNumber, password, profileImage: avatarData, otp });

    await newBuyer.save();
    const token = generateToken(newBuyer._id);

    // Send email with OTP
    const msg = {
      to: email,
      from: 'Joseph From Auqli <joseph@auqli.com>', // Ensure this email is verified in SendGrid
      subject: 'Welcome to Auqli!',
      text: `Hi ${firstName}, welcome to Auqli! Your OTP is ${otp}. Please use this OTP to verify your email.`,
      html: `<strong>Hi ${firstName}, welcome to Auqli! Your OTP is ${otp}. Please use this OTP to verify your email.</strong>`,
    };

    try {
      await sgMail.send(msg);
    } catch (sendError) {
      console.error('SendGrid error:', sendError);
      return res.status(500).json({ message: 'Failed to send verification email', error: sendError.message });
    }

    res.status(201).json({ user: newBuyer, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to register buyer', error: error.message });
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

    if (!buyer.emailVerified) {
      return res.status(403).json({ message: 'Email not yet verified.' });
    }

    const token = generateToken(buyer._id);
    res.json({ user: buyer, token });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Get buyer profile
exports.getProfile = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id).select('-password');
    if (!buyer) return res.status(404).json({ message: 'Buyer not found.' });
    res.json(buyer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve profile', error: error.message });
  }
};

// Update buyer profile
exports.updateProfile = async (req, res) => {
  const { firstName, lastName, country, phoneNumber, profileImage, shippingAddresses, bio } = req.body;

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

    // Handle profile image update
    if (profileImage) {
      if (buyer.profileImage.public_id) {
        await cloudinary.uploader.destroy(buyer.profileImage.public_id);
      }
      const avatarData = await uploadAvatar(profileImage, 'profileImages');
      buyer.profileImage = avatarData;
    }

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

// Update selected categories
exports.updateSelectedCategories = async (req, res) => {
  const { selectedCategories } = req.body;

  try {
    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found.' });
    }

    buyer.selectedCategories = selectedCategories;
    const updatedBuyer = await buyer.save();
    res.json({ message: 'Selected categories updated successfully', buyer: updatedBuyer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update selected categories', error: error.message });
  }
};


// Follow a seller
exports.followSeller = async (req, res) => {
  const { sellerId } = req.body;

  try {
    const buyer = await Buyer.findById(req.user.id);
    const seller = await Seller.findById(sellerId);

    if (!buyer || !seller) {
      return res.status(404).json({ message: 'Buyer or Seller not found.' });
    }

    if (buyer.following.some(follow => follow.sellerId.toString() === sellerId)) {
      return res.status(400).json({ message: 'Already following this seller.' });
    }

    buyer.following.push({ sellerId, name: seller.name });
    seller.followers.push({ buyerId: buyer._id, name: `${buyer.firstName} ${buyer.lastName}` });

    await buyer.save();
    await seller.save();

    res.json({ message: 'Successfully followed the seller.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to follow seller', error: error.message });
  }
};

// Unfollow a seller
exports.unfollowSeller = async (req, res) => {
  const { sellerId } = req.body;

  try {
    const buyer = await Buyer.findById(req.user.id);
    const seller = await Seller.findById(sellerId);

    if (!buyer || !seller) {
      return res.status(404).json({ message: 'Buyer or Seller not found.' });
    }

    if (!buyer.following.some(follow => follow.sellerId.toString() === sellerId)) {
      return res.status(400).json({ message: 'Not following this seller.' });
    }

    buyer.following.pull({ sellerId });
    seller.followers.pull({ buyerId: buyer._id });

    await buyer.save();
    await seller.save();

    res.json({ message: 'Successfully unfollowed the seller.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unfollow seller', error: error.message });
  }
};

