const Seller = require('../models/Seller');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('SG.REDACTED');
const Category = require('../models/Category');
const s3 = require('../config/awsConfig')
const { v4: uuidv4 } = require('uuid');
const Withdrawal = require('../models/Withdrawal');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const Product = require('../models/Product');

// Helper function for JWT generation
const generateToken = (id) => {
  return jwt.sign({ id, role: 'Seller' }, process.env.JWT_SECRET, { expiresIn: '2w' });
};


// Helper function to generate OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// Register a new seller
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    // Basic input validation
    if (!firstName || !lastName || !email || !password || !phoneNumber) {
      return res.status(400).json({ 
        message: 'First name, last name, email, password, and phone number are required.' 
      });
    }

    // First check if email exists and its verification status
    const existingSeller = await Seller.findOne({ email });

    if (existingSeller) {
      // If email exists and is verified, return error
      if (existingSeller.emailVerified) {
        return res.status(409).json({ 
          message: 'Email is already in use.' 
        });
      }

      // If email exists but not verified, generate new OTP and update
      const otp = generateOTP();
      existingSeller.otp = otp;
      await existingSeller.save();

      // Send verification email with new OTP
      const msg = {
        to: email,
        from: 'Joseph From Auqli <joseph@auqli.com>',
        subject: 'Verify Your Email - Auqli',
        text: `Hi ${existingSeller.firstName}, please verify your email with this OTP: ${otp}`,
        html: `<strong>Hi ${existingSeller.firstName}, please verify your email with this OTP: ${otp}</strong>`,
      };

      await sgMail.send(msg);

      return res.status(200).json({
        message: 'Please verify your email with the OTP sent to your email address',
        email: existingSeller.email
      });
    }

    // If email doesn't exist, proceed with new registration
    const otp = generateOTP();
    const newSeller = new Seller({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      otp
    });

    await newSeller.save();

    // Generate JWT token for new seller
    const token = generateToken(newSeller._id);

    // Send welcome email with OTP
    const msg = {
      to: email,
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'Welcome to Auqli!',
      text: `Hi ${firstName}, welcome to Auqli! Please verify your email with this OTP: ${otp}`,
      html: `<strong>Hi ${firstName}, welcome to Auqli! Please verify your email with this OTP: ${otp}</strong>`,
    };

    await sgMail.send(msg);

    res.status(201).json({ 
      message: 'Registration successful. Please verify your email.',
      user: newSeller, 
      token 
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Registration failed', 
      error: error.message 
    });
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
exports.uploadCompanyVerification = async (req, res) => {
  try {
    const files = req.files;

    if (!files || !files.certificateOfIncorporation || !files.businessTaxId) {
      return res.status(400).json({ 
        message: 'Both Certificate of Incorporation and Business Tax ID are required' 
      });
    }

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const documents = [];
    
    // Upload Certificate of Incorporation
    const certFile = files.certificateOfIncorporation[0];
    const certParams = {
      Bucket: 'auqli-uploads',
      Key: `verification/${req.user.id}/company/${uuidv4()}-${certFile.originalname}`,
      Body: certFile.buffer,
      ContentType: certFile.mimetype,
    };
    const certUpload = await s3.upload(certParams).promise();
    documents.push({
      documentType: 'certificateOfIncorporation',
      fileUrl: certUpload.Location,
      public_id: certUpload.Key
    });

    // Upload Business Tax ID
    const taxFile = files.businessTaxId[0];
    const taxParams = {
      Bucket: 'auqli-uploads',
      Key: `verification/${req.user.id}/company/${uuidv4()}-${taxFile.originalname}`,
      Body: taxFile.buffer,
      ContentType: taxFile.mimetype,
    };
    const taxUpload = await s3.upload(taxParams).promise();
    documents.push({
      documentType: 'businessTaxId',
      fileUrl: taxUpload.Location,
      public_id: taxUpload.Key
    });

    seller.verificationDocuments = {
      type: 'company',
      documents: documents
    };
    
    await seller.save();

    res.json({ 
      message: 'Company verification documents uploaded successfully', 
      documents: seller.verificationDocuments 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to upload verification documents', 
      error: error.message 
    });
  }
};

exports.uploadIndividualVerification = async (req, res) => {
  try {
    const files = req.files;

    if (!files || !files.individualTaxId || !files.governmentId || !files.proofOfAddress) {
      return res.status(400).json({ 
        message: 'Tax ID, Government ID, and Proof of Address are all required' 
      });
    }

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const documents = [];
    
    // Upload Individual Tax ID
    const taxFile = files.individualTaxId[0];
    const taxParams = {
      Bucket: 'auqli-uploads',
      Key: `verification/${req.user.id}/individual/${uuidv4()}-${taxFile.originalname}`,
      Body: taxFile.buffer,
      ContentType: taxFile.mimetype,
    };
    const taxUpload = await s3.upload(taxParams).promise();
    documents.push({
      documentType: 'individualTaxId',
      fileUrl: taxUpload.Location,
      public_id: taxUpload.Key
    });

    // Upload Government ID
    const govFile = files.governmentId[0];
    const govParams = {
      Bucket: 'auqli-uploads',
      Key: `verification/${req.user.id}/individual/${uuidv4()}-${govFile.originalname}`,
      Body: govFile.buffer,
      ContentType: govFile.mimetype,
    };
    const govUpload = await s3.upload(govParams).promise();
    documents.push({
      documentType: 'governmentId',
      fileUrl: govUpload.Location,
      public_id: govUpload.Key
    });

    // Upload Proof of Address
    const addressFile = files.proofOfAddress[0];
    const addressParams = {
      Bucket: 'auqli-uploads',
      Key: `verification/${req.user.id}/individual/${uuidv4()}-${addressFile.originalname}`,
      Body: addressFile.buffer,
      ContentType: addressFile.mimetype,
    };
    const addressUpload = await s3.upload(addressParams).promise();
    documents.push({
      documentType: 'proofOfAddress',
      fileUrl: addressUpload.Location,
      public_id: addressUpload.Key
    });

    seller.verificationDocuments = {
      type: 'individual',
      documents: documents
    };
    
    await seller.save();

    res.json({ 
      message: 'Individual verification documents uploaded successfully', 
      documents: seller.verificationDocuments 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to upload verification documents', 
      error: error.message 
    });
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


// Add business details
exports.addBusinessDetails = async (req, res) => {
  try {
    const { businessName, businessType, taxInformation } = req.body;

    // Validate required fields
    if (!businessName || !businessType || !taxInformation) {
      return res.status(400).json({ 
        message: 'Business name, business type, and tax information are all required' 
      });
    }

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.businessName = businessName;
    seller.businessType = businessType;
    seller.taxInformation = taxInformation;
    
    const updatedSeller = await seller.save();

    res.json({ 
      message: 'Business details added successfully', 
      seller: updatedSeller 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to add business details', 
      error: error.message 
    });
  }
};

// Add business information
exports.addBusinessInformation = async (req, res) => {
  try {
    const { businessEmail, businessNumber, businessAddress } = req.body;

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.businessEmail = businessEmail;
    seller.businessNumber = businessNumber;
    seller.businessAddress = businessAddress;
    
    const updatedSeller = await seller.save();

    res.json({ 
      message: 'Business information added successfully', 
      seller: updatedSeller 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to add business information', 
      error: error.message 
    });
  }
};

// Add shipping and warehouse information
exports.addShippingWarehouse = async (req, res) => {
  try {
    const { shippingOptions, warehouseDetails } = req.body;

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.shippingOptions = shippingOptions;
    seller.warehouseDetails = warehouseDetails;
    
    const updatedSeller = await seller.save();

    res.json({ 
      message: 'Shipping and warehouse information added successfully', 
      seller: updatedSeller 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to add shipping and warehouse information', 
      error: error.message 
    });
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

// Create withdrawal request
exports.createWithdrawalRequest = async (req, res) => {
  try {
    const { amount } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (amount > seller.walletBalance) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const withdrawal = new Withdrawal({
      seller: seller._id,
      amount,
      status: 'pending'
    });

    await withdrawal.save();

    // Add to seller's withdrawRequests
    seller.withdrawRequests.push(withdrawal._id);
    await seller.save();

    // Send email to admin
    const adminMsg = {
      to: process.env.ADMIN_EMAIL,
      from: 'Auqli Admin <admin@auqli.com>',
      subject: 'New Withdrawal Request',
      html: `
        <h3>New Withdrawal Request</h3>
        <p>Seller: ${seller.firstName} ${seller.lastName}</p>
        <p>Business Name: ${seller.businessName}</p>
        <p>Amount: $${amount}</p>
        <p>Bank Details:</p>
        <ul>
          <li>Bank Name: ${seller.bankDetails.bankName}</li>
          <li>Account Number: ${seller.bankDetails.accountNumber}</li>
          <li>Account Name: ${seller.bankDetails.accountName}</li>
        </ul>
      `
    };

    await sgMail.send(adminMsg);

    res.status(201).json({ 
      message: 'Withdrawal request created successfully', 
      withdrawal 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create withdrawal request', 
      error: error.message 
    });
  }
};

// Get seller's withdrawal requests
exports.getSellerWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ seller: req.user.id })
      .sort({ createdAt: -1 });

    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch withdrawal requests', 
      error: error.message 
    });
  }
};

// Admin: Get all withdrawal requests
exports.getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .populate('seller', 'firstName lastName businessName email bankDetails')
      .sort({ createdAt: -1 });

    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch withdrawal requests', 
      error: error.message 
    });
  }
};

// Admin: Update withdrawal status
exports.updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const withdrawal = await Withdrawal.findById(id)
      .populate('seller', 'firstName lastName email walletBalance');

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    withdrawal.status = status;
    if (status === 'completed') {
      withdrawal.completedAt = Date.now();
      
      // Deduct amount from seller's wallet
      const seller = withdrawal.seller;
      seller.walletBalance -= withdrawal.amount;
      await seller.save();

      // Send email to seller
      const sellerMsg = {
        to: seller.email,
        from: 'Auqli Admin <admin@auqli.com>',
        subject: 'Withdrawal Request Completed',
        html: `
          <h3>Withdrawal Request Completed</h3>
          <p>Your withdrawal request for $${withdrawal.amount} has been processed and sent to your bank account.</p>
          <p>New wallet balance: $${seller.walletBalance}</p>
        `
      };

      await sgMail.send(sellerMsg);
    }

    await withdrawal.save();

    res.json({ 
      message: 'Withdrawal status updated successfully', 
      withdrawal 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update withdrawal status', 
      error: error.message 
    });
  }
};

// Get seller's top 5 selling products
exports.getTopProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const topProducts = await Order.aggregate([
      // Match orders for this seller
      { $match: { seller: mongoose.Types.ObjectId(sellerId) } },
      // Unwind the items array
      { $unwind: '$items' },
      // Group by product and sum quantities
      { 
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      // Sort by quantity sold
      { $sort: { totalQuantity: -1 } },
      // Limit to top 5
      { $limit: 5 },
      // Lookup product details
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' }
    ]);

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve top products', error: error.message });
  }
};

// Get seller's statistics
exports.getStatistics = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const seller = await Seller.findById(sellerId);

    // Get all orders for this seller
    const orders = await Order.find({ seller: sellerId });

    // Calculate statistics
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const uniqueCustomers = seller.customers.length;
    const storeVisits = seller.storeVisits;
    
    // Calculate conversion rate (orders / store visits)
    const conversionRate = storeVisits ? (totalOrders / storeVisits * 100).toFixed(2) : 0;

    // Get current month's data
    const currentMonth = new Date().getMonth();
    const currentMonthOrders = orders.filter(order => 
      order.createdAt.getMonth() === currentMonth
    );
    const currentMonthSales = currentMonthOrders.reduce((sum, order) => 
      sum + order.totalPrice, 0
    );

    const statistics = {
      totalStoreVisits: storeVisits,
      totalSales,
      totalOrders,
      uniqueCustomers,
      conversionRate: `${conversionRate}%`,
      walletBalance: seller.walletBalance,
      currentMonth: {
        orders: currentMonthOrders.length,
        sales: currentMonthSales
      }
    };

    res.json(statistics);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve statistics', error: error.message });
  }
};

// Get seller's orders with filtering
exports.getOrders = async (req, res) => {
  try {
    const { 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const query = { 'items.seller': req.user.id };
    
    if (status) {
      query['items.status'] = status;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('buyer', 'firstName lastName email')
      .populate('items.product', 'name images price')
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

// Get seller's sales analytics
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { 'items.seller': req.user.id };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query);
    
    const analytics = {
      totalOrders: orders.length,
      totalRevenue: 0,
      ordersByStatus: {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        returned: 0
      },
      revenueByDay: {},
      topProducts: [],
      averageOrderValue: 0
    };

    // Calculate metrics
    orders.forEach(order => {
      const sellerItems = order.items.filter(
        item => item.seller.toString() === req.user.id
      );
      
      const orderRevenue = sellerItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      
      analytics.totalRevenue += orderRevenue;
      
      // Count by status
      sellerItems.forEach(item => {
        analytics.ordersByStatus[item.status]++;
      });

      // Group by day
      const day = order.createdAt.toISOString().split('T')[0];
      analytics.revenueByDay[day] = (analytics.revenueByDay[day] || 0) + orderRevenue;
    });

    // Calculate average order value
    analytics.averageOrderValue = analytics.totalRevenue / analytics.totalOrders;

    // Get top products
    analytics.topProducts = await Order.aggregate([
      { $match: query },
      { $unwind: '$items' },
      { $match: { 'items.seller': mongoose.Types.ObjectId(req.user.id) } },
      { $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    // Populate product details
    await Product.populate(analytics.topProducts, { path: '_id' });

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

// Get shipping label
exports.getShippingLabel = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const order = await Order.findById(orderId)
      .populate('buyer', 'firstName lastName')
      .populate('items.product', 'name weight dimensions');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const orderItem = order.items.id(itemId);
    if (!orderItem || orderItem.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to access this order item' });
    }

    // Generate shipping label (integrate with shipping provider's API)
    // This is a placeholder - implement actual shipping label generation
    const shippingLabel = {
      orderId,
      trackingNumber: `TN${Date.now()}`,
      labelUrl: 'https://shipping-label-url.com',
      // Add more shipping label details
    };

    res.json(shippingLabel);
  } catch (error) {
    res.status(500).json({ message: 'Error generating shipping label', error: error.message });
  }
};

exports.updateIndividualInformation = async (req, res) => {
  try {
    const { firstName, lastName, sellerAddress } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !sellerAddress) {
      return res.status(400).json({ 
        message: 'First name, last name, and address are required' 
      });
    }

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.firstName = firstName;
    seller.lastName = lastName;
    seller.sellerAddress = sellerAddress;
    
    const updatedSeller = await seller.save();

    res.json({ 
      message: 'Individual information updated successfully', 
      seller: updatedSeller 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update individual information', 
      error: error.message 
    });
  }
};
