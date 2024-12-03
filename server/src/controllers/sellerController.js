const Seller = require('../models/Seller');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('SG.REDACTED');
const Category = require('../models/Category');
const s3 = require('../config/awsConfig')
const { v4: uuidv4 } = require('uuid');

// Helper function for JWT generation
const generateToken = (id) => {
  return jwt.sign({ id, role: 'Seller' }, process.env.JWT_SECRET, { expiresIn: '2w' });
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
      text: `Hi ${firstName}, welcome to auqli! Your OTP is ${otp}. Please use this OTP to verify your email.`,
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

// Resend OTP
exports.resendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const seller = await Seller.findOne({ email });
    if (!seller) return res.status(404).json({ message: 'Seller not found.' });

    if (seller.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    const otp = generateOTP();
    seller.otp = otp;
    await seller.save();

    // Send email with OTP
    const msg = {
      to: email,
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'Your Auqli OTP',
      text: `Hi, your OTP is ${otp}. Please use this OTP to verify your email.`,
      html: `<strong>Hi, your OTP is ${otp}. Please use this OTP to verify your email.</strong>`,
    };

    await sgMail.send(msg);

    res.json({ message: 'OTP resent successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
};


exports.checkToken = async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(403).json({ message: "A token is required for authentication" });

  try {
    const decodedUserData = jwt.verify(token, process.env.JWT_SECRET);
    const newToken = generateToken(decodedUserData.id);
    res.json({ token: newToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token has expired. Please sign in again." });
    }
    return res.status(401).json({ message: "Invalid Token" });
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

// Update seller profile information
exports.updateProfileInfo = async (req, res) => {
  try {
    const {
      businessName,
      businessAddress,
      accountType,
      bankDetails,
      categories,
      shippingOptions,
      warehouseAddress,
      storeName,
      aboutStore,
    } = req.body;

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    Object.assign(seller, {
      businessName,
      businessAddress,
      accountType,
      bankDetails,
      categories,
      shippingOptions,
      warehouseAddress,
      storeName,
      aboutStore,
    });

    if (accountType === 'business') seller.isVerified = false;

    const updatedSeller = await seller.save();

    res.json({ message: 'Profile updated successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};


// Upload verification documents
exports.uploadVerificationDocuments = async (req, res) => {
  try {
    const verificationDocuments = req.files;

    if (!verificationDocuments || verificationDocuments.length === 0) {
      return res.status(400).json({ message: 'No verification documents uploaded' });
    }

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const uploadedDocuments = await Promise.all(
      verificationDocuments.map(async (file) => {
        const params = {
          Bucket: 'auqli-uploads',
          Key: `${uuidv4()}-${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
         
        };
        const data = await s3.upload(params).promise();
        return { type: file.fieldname, fileUrl: data.Location };
      })
    );

    seller.verificationDocuments = uploadedDocuments;
    const updatedSeller = await seller.save();

    res.json({ message: 'Verification documents uploaded successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload verification documents', error: error.message });
  }
};


// Upload store avatar
exports.uploadStoreAvatar = async (req, res) => {
  try {
    const avatarFile = req.file;

    if (!avatarFile) {
      return res.status(400).json({ message: 'No avatar file uploaded' });
    }

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const params = {
      Bucket: 'auqli-uploads',
      Key: `${uuidv4()}-${avatarFile.originalname}`,
      Body: avatarFile.buffer,
      ContentType: avatarFile.mimetype,
     
    };
    const data = await s3.upload(params).promise();

    seller.storeAvatar = {
      url: data.Location,
      public_id: data.Key,
    };

    const updatedSeller = await seller.save();

    res.json({ message: 'Store avatar uploaded successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload store avatar', error: error.message });
  }
};

// Upload store banner
exports.uploadStoreBanner = async (req, res) => {
  try {
    const bannerFile = req.file;

    if (!bannerFile) {
      return res.status(400).json({ message: 'No banner file uploaded' });
    }

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const params = {
      Bucket: 'auqli-uploads',
      Key: `${uuidv4()}-${bannerFile.originalname}`,
      Body: bannerFile.buffer,
      ContentType: bannerFile.mimetype,
     
    };
    const data = await s3.upload(params).promise();

    seller.storeBanner = {
      url: data.Location,
      public_id: data.Key,
    };

    const updatedSeller = await seller.save();

    res.json({ message: 'Store banner uploaded successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload store banner', error: error.message });
  }
};


// Select account type
exports.selectAccountType = async (req, res) => {
  try {
    const { accountType } = req.body;

    const lowerCaseAccountType = accountType ? accountType.toLowerCase() : null;

    const validAccountTypes = ['individual', 'business'];
    if (!lowerCaseAccountType || !validAccountTypes.includes(lowerCaseAccountType)) {
      return res.status(400).json({ message: 'Invalid account type. Must be either "individual" or "business"' });
    }

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.accountType = lowerCaseAccountType;
    seller.isProfileComplete = checkProfileCompletion(seller);
    const updatedSeller = await seller.save();

    res.json({ message: 'Account type selected successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to select account type', error: error.message });
  }
};


// Add business details and information
exports.addBusinessDetails = async (req, res) => {
  try {
    const { businessName, businessAddress } = req.body;

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.businessName = businessName;
    seller.businessAddress = businessAddress;
    seller.isProfileComplete = checkProfileCompletion(seller);
    const updatedSeller = await seller.save();

    res.json({ message: 'Business details added successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add business details', error: error.message });
  }
};

// Add bank details
exports.addBankDetails = async (req, res) => {
  try {
    const { bankDetails } = req.body;

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.bankDetails = bankDetails;
    seller.isProfileComplete = checkProfileCompletion(seller);
    const updatedSeller = await seller.save();

    res.json({ message: 'Bank details added successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add bank details', error: error.message });
  }
};

// Add categories
exports.addCategories = async (req, res) => {
  try {
    const { categories } = req.body;

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.categories = categories;
    seller.isProfileComplete = checkProfileCompletion(seller);
    const updatedSeller = await seller.save();

    res.json({ message: 'Categories added successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add categories', error: error.message });
  }
};

// Add address and shipping information
exports.addAddressShipping = async (req, res) => {
  try {
    const { shippingOptions, warehouseAddress } = req.body;

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.shippingOptions = shippingOptions;
    seller.warehouseAddress = warehouseAddress;
    seller.isProfileComplete = checkProfileCompletion(seller);
    const updatedSeller = await seller.save();

    res.json({ message: 'Address and shipping information added successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add address and shipping information', error: error.message });
  }
};

// Helper function to check if the profile is complete
const checkProfileCompletion = (seller) => {
  return (
    seller.accountType &&
    seller.businessName &&
    seller.businessAddress &&
    seller.bankDetails &&
    seller.categories.length > 0 &&
    seller.shippingOptions &&
    seller.warehouseAddress
  );
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

    seller.categories = categories.map(category => ({
      name: category.name,
      subCategories: category.subCategories.map(subCategory => ({
        name: subCategory.name,
      })),
    }));

    await seller.save();

    res.json({ message: 'Categories selected successfully', seller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to select categories', error: error.message });
  }
};


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

    seller.categories = categories.map(category => ({
      name: category.name,
      subCategories: category.subCategories.map(subCategory => ({
        name: subCategory.name,
      })),
    }));

    await seller.save();

    res.json({ message: 'Categories updated successfully', seller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update categories', error: error.message });
  }
};


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
