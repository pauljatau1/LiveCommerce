const Buyer = require('../models/Buyer');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const { v4: uuidv4 } = require('uuid');
const s3 = require('../config/awsConfig');

sgMail.setApiKey('SG.REDACTED');

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id, role: 'Buyer' }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register a new buyer
exports.register = async (req, res) => {
  const { firstName, lastName, username, email, country, phoneNumber, password } = req.body;

  if (!firstName || !lastName || !username || !email || !phoneNumber || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const existingBuyer = await Buyer.findOne({ email });
    if (existingBuyer) return res.status(409).json({ message: 'Email is already in use.' });

    const otp = generateOTP();
    const newBuyer = new Buyer({ firstName, lastName, username, email, country, phoneNumber, password, otp });

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

    // if (!buyer.emailVerified) {
    //   return res.status(403).json({ message: 'Email not yet verified.' });
    // }

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

