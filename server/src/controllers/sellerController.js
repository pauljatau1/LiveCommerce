const Seller = require('../models/Seller');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('SG.REDACTED');
const Category = require('../models/Category');
const { s3 } = require('../config/awsConfig')
const { v4: uuidv4 } = require('uuid');

const Order = require('../models/Order');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');
const Buyer = require('../models/Buyer');
const Withdrawal = require('../models/Withdrawal');
const Campaign = require('../models/Campaign');

// Add this helper function at the top of the file
const generateUniqueAgoraUid = async () => {
  let attempts = 0;
  let agoraUid;
  let exists;
  
  do {
    // Generate UID between 100000 and 4294967295
    agoraUid = Math.floor(100000 + Math.random() * (4294967295 - 100000));
    exists = await Seller.findOne({ agoraUid });
    attempts++;
  } while (exists && attempts < 5);

  if (exists) {
    throw new Error('Failed to generate unique Agora UID after 5 attempts');
  }

  return agoraUid;
};

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
        message: 'First name, last name, email, password, and phone number are required..' 
      });
    }

    // First check if email exists and its verification status
    const existingSeller = await Seller.findOne({ email });

    if (existingSeller) {
      // If email exists and is verified, return error
      if (existingSeller.emailVerified) {
        return res.status(409).json({ 
          message: 'Email is already in use.',
        });
      }

      // If email exists but not verified, generate new OTP and update
      const otp = generateOTP();
      existingSeller.otp = otp;
      await existingSeller.save();

      console.log('existing email', email)

      // Send verification email with new OTP
      const msg = {
        to: email,
        from: 'Joseph From Auqli <joseph@auqli.com>',
        subject: 'Verify Your Email - Auqli',
        text: `Hi ${existingSeller.firstName}, please verify your email with this OTP: ${otp}`,
        html: `
          <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto;">
              <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
              <h1 style="color: #4CAF50; margin-bottom: 20px;">Email Verification Required</h1>
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hi ${existingSeller.firstName},</p>
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 30px;">Welcome to Auqli! To complete your registration, please verify your email using the OTP below:</p>
              <div style="background-color: #333333; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 30px;">
                <span style="font-size: 32px; letter-spacing: 5px; color: #4CAF50; font-weight: bold;">${otp}</span>
              </div>
              <p style="font-size: 14px; color: #999999;">This OTP will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>
              <hr style="border: 1px solid #333333; margin: 30px 0;">
              <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
            </div>
          </div>
        `
      };

      try {
        await sgMail.send(msg);
        return res.status(200).json({
          message: 'Please verify your email with the OTP sent to your email address',
          email: existingSeller.email,
          user: existingSeller
        });
      } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Failed to send verification email', error: error.message });
      }
    }

    // Generate unique Agora UID before creating new seller
    const agoraUid = await generateUniqueAgoraUid();

    // If email doesn't exist, proceed with new registration
    const otp = generateOTP();
    const newSeller = new Seller({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      otp,
      agoraUid // Add the generated UID
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
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 20px;">Welcome to Auqli!</h1>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hi ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Thank you for joining Auqli! We're excited to have you on board. To get started, please verify your email using the OTP below:</p>
            <div style="background-color: #333333; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 30px;">
              <span style="font-size: 32px; letter-spacing: 5px; color: #4CAF50; font-weight: bold;">${otp}</span>
            </div>
            <div style="background-color: #333333; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
              <h3 style="color: #4CAF50; margin-bottom: 15px;">Next Steps:</h3>
              <ul style="color: #ffffff; margin-bottom: 0;">
                <li style="margin-bottom: 10px;">Verify your email using the OTP above</li>
                <li style="margin-bottom: 10px;">Complete your seller profile</li>
                <li style="margin-bottom: 10px;">Set up your store</li>
                <li>Start selling your products</li>
              </ul>
            </div>
            <p style="font-size: 14px; color: #999999;">This OTP will expire in 10 minutes. If you didn't create an account with Auqli, please ignore this email.</p>
            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);

    // After successful seller creation and welcome email
    const adminMsg = {
      to: ['bolu@auqli.com', 'joseph@auqli.com', 'dan@auqli.com'],
      from: 'Auqli Admin <joseph@auqli.com>',
      subject: 'New Seller Registration - Auqli',
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 20px;">New Seller Registration</h1>
            <p style="font-size: 16px; line-height: 1.5;">A new seller has registered on Auqli:</p>
            <div style="background-color: #333333; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
              <p style="margin: 5px 0;">Name: ${firstName} ${lastName}</p>
              <p style="margin: 5px 0;">Email: ${email}</p>
              <p style="margin: 5px 0;">Phone: ${phoneNumber}</p>
            </div>
            <p style="font-size: 14px;">Please check the admin dashboard for more details.</p>
            <a href="https://admin.auqli.live/" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Login</a>
            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // Send both welcome email to seller and notification to admins
    await Promise.all([
      sgMail.send(msg),
      sgMail.send(adminMsg)
    ]);

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
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 20px;">Your New OTP</h1>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hi there,</p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">You requested a new OTP. Please use the code below to verify your email:</p>
            <div style="background-color: #333333; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 30px;">
              <span style="font-size: 32px; letter-spacing: 5px; color: #4CAF50; font-weight: bold;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #999999;">This OTP will expire in 10 minutes. If you didn't request this OTP, please ignore this email.</p>
            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
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

    // Update completion flags
    seller.hasFilledBusinessAddress = !!seller.businessAddress;
    seller.hasFilledVerificationDocuments = !!seller.verificationDocuments.documents.length;

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

    // Update completion flags
    seller.hasFilledBusinessAddress = !!businessAddress;

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

    // Update seller with warehouse and shipping details
    seller.shippingOptions = shippingOptions;
    seller.warehouseDetails = warehouseDetails;

    // Update completion flags
    seller.hasFilledWarehouseAddress = !!warehouseDetails;

    await seller.save();

    res.json({
      message: 'Shipping and warehouse information added successfully',
      seller: {
        shippingOptions: seller.shippingOptions,
        warehouseDetails: seller.warehouseDetails
      }
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

    // Update completion flags
    seller.hasFilledBankDetails = !!bankDetails;

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

    // Update completion flags
    seller.hasFilledCategoryDetails = categories.length > 0;

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

    // Update completion flags
    seller.hasFilledAddress = !!warehouseAddress;

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
      // Limit to top 4
      { $limit: 4 },
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

    // Update completion flags
    seller.hasFilledAddress = !!sellerAddress;

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

// Forgot password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found.' });
    }

    // Generate a 4-digit reset code
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    seller.resetPasswordCode = resetCode;
    seller.resetPasswordExpires = Date.now() + 3600000; // Code valid for 1 hour
    await seller.save();

    // Send email with reset code
    const msg = {
      to: email,
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'Reset Your Password - Auqli',
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 20px;">Password Reset Code</h1>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hi ${seller.firstName},</p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 30px;">You requested to reset your password. Use the code below to complete the process:</p>
            <div style="background-color: #333333; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 30px;">
              <span style="font-size: 32px; letter-spacing: 5px; color: #4CAF50; font-weight: bold;">${resetCode}</span>
            </div>
            <p style="font-size: 14px; color: #999999;">This code will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);
    res.json({ message: 'Password reset code sent successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send password reset code', error: error.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Email, code, and new password are required.' });
  }

  try {
    const seller = await Seller.findOne({ 
      email, 
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!seller) {
      return res.status(404).json({ message: 'Invalid or expired reset code.' });
    }

    // Update password and clear reset fields
    seller.password = newPassword;
    seller.resetPasswordCode = undefined;
    seller.resetPasswordExpires = undefined;
    await seller.save();

    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};

// Update seller's onboarding process
exports.updateOnboardingProcess = async (req, res) => {
  try {
    const { onboardingProcess } = req.body;

    // Find and update seller
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Update the onboarding process
    seller.onboardingProcess = onboardingProcess;
    await seller.save();

    res.json({ 
      message: 'Onboarding process updated successfully',
      onboardingProcess: seller.onboardingProcess 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update onboarding process', 
      error: error.message 
    });
  }
};

// Get seller's onboarding process
exports.getOnboardingProcess = async (req, res) => {
  try {
    // Find seller
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.json({ 
      onboardingProcess: seller.onboardingProcess 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve onboarding process', 
      error: error.message 
    });
  }
};

// Add to sellerController.js - For store verification status changes
async function sendStoreVerificationEmail(seller, status) {
  const sellerMsg = {
    to: seller.email,
    from: 'Joseph From Auqli <joseph@auqli.com>',
    subject: `Store Verification Status - ${status}`,
    html: `
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto;">
          <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; margin-bottom: 20px;">Store Verification Update</h1>
          <p style="font-size: 16px; line-height: 1.5;">Your store verification status has been updated to: ${status}</p>
          ${status === 'VERIFIED' ? 
            '<p style="font-size: 16px; line-height: 1.5;">Congratulations! You can now start selling on Auqli.</p>' : 
            '<p style="font-size: 16px; line-height: 1.5;">Please check your dashboard for more details.</p>'
          }
          <hr style="border: 1px solid #333333; margin: 30px 0;">
          <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
        </div>
      </div>
    `
  };

  const adminMsg = {
    to: 'bolu@auqli.com',
    from: 'Joseph From Auqli <joseph@auqli.com>',
    subject: `Store Verification Status Update - ${seller.storeName}`,
    html: `
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto;">
          <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; margin-bottom: 20px;">Store Verification Status Update</h1>
          <p style="font-size: 16px; line-height: 1.5;">Store: ${seller.storeName}</p>
          <p style="font-size: 16px; line-height: 1.5;">New Status: ${status}</p>
          <p style="font-size: 16px; line-height: 1.5;">Seller: ${seller.firstName} ${seller.lastName}</p>
          <hr style="border: 1px solid #333333; margin: 30px 0;">
          <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
        </div>
      </div>
    `
  };

  await Promise.all([
    sgMail.send(sellerMsg),
    sgMail.send(adminMsg)
  ]);
}

exports.updateStoreVerification = async (req, res) => {
  try {
    // ... existing verification update code ...
    
    await sendStoreVerificationEmail(seller, newStatus);
    
    res.json({ message: 'Store verification status updated successfully', seller });
  } catch (error) {
    // ... error handling ...
  }
};

// Get seller's followers
exports.getFollowers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const seller = await Seller.findById(req.user.id);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = seller.followers.length;

    // Get paginated followers
    const followers = seller.followers.slice(startIndex, endIndex);

    // Get additional order information for each follower
    const followersWithDetails = await Promise.all(
      followers.map(async (follower) => {
        // Get all orders from this follower with this seller
        const orders = await Order.find({
          buyer: follower.buyerId,
          'items.seller': seller._id
        });

        // Calculate total amount spent
        const totalSpent = orders.reduce((sum, order) => {
          // Sum up only the items from this seller in each order
          const sellerItems = order.items.filter(item => 
            item.seller.toString() === seller._id.toString()
          );
          return sum + sellerItems.reduce((itemSum, item) => 
            itemSum + (item.price * item.quantity), 0
          );
        }, 0);

        return {
          ...follower.toObject(),
          totalOrders: orders.length,
          totalSpent: totalSpent,
          name: `${follower.firstName} ${follower.lastName}`,
          followedAt: follower.followDate // For consistency in naming
        };
      })
    );

    res.json({
      followers: followersWithDetails,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        hasMore: endIndex < total
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve followers', 
      error: error.message 
    });
  }
};

// Get detailed buyer information
exports.getBuyerDetails = async (req, res) => {
  try {
    const { buyerId } = req.params;
    const sellerId = req.user.id;

    // Get buyer information
    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Get all orders for this buyer with this seller
    const orders = await Order.find({
      buyer: buyerId,
      seller: sellerId
    })
    .populate('items.product', 'name images price')
    .sort({ createdAt: -1 });

    if (orders.length === 0) {
      return res.status(403).json({ message: 'Buyer has not ordered from this seller' });
    }

    // Get recent 5 orders with details
    const recentOrders = await Order.find({
      buyer: buyerId,
      seller: sellerId
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('items.product', 'name images price');

    // Calculate order statistics
    const orderStats = {
      general: {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        averageOrderValue: orders.length > 0 
          ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length 
          : 0
      },
      withSeller: {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        averageOrderValue: orders.length > 0 
          ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length 
          : 0
      }
    };

    // Get top purchases - Modified to handle null products
    const productPurchases = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!item.product) return; // Skip if product is null
        
        const productId = item.product._id.toString();
        if (!productPurchases[productId]) {
          productPurchases[productId] = {
            productId,
            name: item.product.name || 'Product Unavailable',
            quantity: 0,
            totalSpent: 0,
            seller: {
              id: sellerId,
              name: order.seller?.storeName || 'Unknown Store'
            }
          };
        }
        productPurchases[productId].quantity += item.quantity;
        productPurchases[productId].totalSpent += item.price * item.quantity;
      });
    });

    const topPurchases = Object.values(productPurchases)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    res.json({
      buyerInfo: {
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        email: buyer.email,
        joinDate: buyer.createdAt
      },
      orderStats,
      shippingAddresses: buyer.shippingAddresses,
      activityFeed: buyer.activityFeed,
      topPurchases,
      recentOrders: recentOrders.map(order => ({
        _id: order._id,

        orderNumber: order.order_id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          product: item.product ? {
            name: item.product.name,
            images: item.product.images,
            price: item.price
          } : {
            name: 'Product Unavailable',
            images: [],
            price: item.price
          },
          quantity: item.quantity
        }))
      })),
      hasOrderedFromSeller: true
    });

  } catch (error) {
    console.error('Error getting buyer details:', error);
    res.status(500).json({ 
      message: 'Failed to get buyer details', 
      error: error.message 
    });
  }
};

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Update only the password reset fields
    const updateResult = await Seller.updateOne(
      { _id: seller._id },
      {
        $set: {
          passwordResetToken: hashedToken,
          passwordResetExpires: Date.now() + 3600000 // 1 hour
        }
      }
    );

    if (!updateResult.modifiedCount) {
      throw new Error('Failed to update seller with reset token');
    }

    // Send email with reset link
    const msg = {
      to: email,
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'Reset Your Auqli Password',
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 20px;">Reset Your Password</h1>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hi there,</p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 14px; color: #999999;">This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);

    res.json({
      message: 'Password reset link sent successfully',
      valid: true
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      message: 'Failed to process password reset request',
      error: error.message
    });
  }
};

// Verify reset token
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const seller = await Seller.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!seller) {
      return res.status(400).json({
        message: 'Invalid or expired reset token',
        valid: false
      });
    }

    res.json({
      message: 'Token is valid',
      valid: true
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      message: 'Failed to verify reset token',
      error: error.message
    });
  }
};

// Reset password with token
exports.resetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: 'Token and new password are required'
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const seller = await Seller.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!seller) {
      return res.status(404).json({
        message: 'Invalid or expired reset token'
      });
    }

    // Update only password and reset token fields
    const updateResult = await Seller.updateOne(
      { _id: seller._id },
      {
        $set: {
          password: await bcrypt.hash(newPassword, 10)
        },
        $unset: {
          passwordResetToken: 1,
          passwordResetExpires: 1
        }
      }
    );

    if (!updateResult.modifiedCount) {
      throw new Error('Failed to update password');
    }

    // Send confirmation email
    const msg = {
      to: seller.email,
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'Your Auqli Password Has Been Reset',
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 20px;">Password Reset Successful</h1>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hi ${seller.firstName},</p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your password has been successfully reset. You can now log in with your new password.</p>
            <p style="font-size: 14px; color: #999999;">If you didn't make this change, please contact our support team immediately.</p>
            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);

    res.json({
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

// Get seller's top 3 most sold products
exports.getTopSoldProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const topProducts = await Product.find({ seller: sellerId })
      .sort({ 'stats.soldCount': -1 })
      .limit(3)
      .select('name description price images stats.soldCount category brand');

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve top sold products', 
      error: error.message 
    });
  }
};

// Create withdrawal request
exports.createWithdrawalRequest = async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;
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
      bankDetails,
      notes: [{
        content: 'Withdrawal request created',
        addedBy: 'seller'
      }]
    });

    await withdrawal.save();

    // Send email notification
    const emailMsg = {
      to: seller.email,
      from: 'Auqli Admin <joseph@auqli.com>',
      subject: 'Withdrawal Request Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Withdrawal Request Received</h2>
          <p>Dear ${seller.firstName},</p>
          <p>Your withdrawal request for ${amount} has been received and is being processed.</p>
          <p>Reference: ${withdrawal.reference}</p>
          <p>Status: Pending</p>
          <p>We will notify you once the status changes.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    await sgMail.send(emailMsg);

    res.json({ 
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

// Get withdrawal requests
exports.getWithdrawalRequests = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ seller: req.user.id })
      .sort({ requestDate: -1 });

    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch withdrawal requests', 
      error: error.message 
    });
  }
};

exports.getAnalyticsMetrics = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const seller = await Seller.findById(sellerId);
    
    // Get date ranges
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    // Get all orders
    const allOrders = await Order.find({
      seller: sellerId
    }).populate('items.product');

    const paidOrders = allOrders.filter(order => order.paid);

    // Category Performance Analysis
    const categoryPerformance = {};
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.product?.category) {
          if (!categoryPerformance[item.product.category]) {
            categoryPerformance[item.product.category] = {
              soldCount: 0,
              revenue: 0,
              orderCount: 0
            };
          }
          categoryPerformance[item.product.category].soldCount += item.quantity;
          categoryPerformance[item.product.category].revenue += (item.price * item.quantity);
          categoryPerformance[item.product.category].orderCount += 1;
        }
      });
    });

    // Top Products Analysis
    const productPerformance = {};
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productPerformance[item.product?._id]) {
          productPerformance[item.product?._id] = {
            name: item.product?.name,
            soldCount: 0,
            revenue: 0,
            orderCount: 0
          };
        }
        productPerformance[item.product?._id].soldCount += item.quantity;
        productPerformance[item.product?._id].revenue += (item.price * item.quantity);
        productPerformance[item.product?._id].orderCount += 1;
      });
    });

    // Calculate revenue metrics
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const lastMonthOrders = paidOrders.filter(order => order.createdAt >= lastMonth);
    const previousMonthOrders = paidOrders.filter(
      order => order.createdAt >= twoMonthsAgo && order.createdAt < lastMonth
    );
    const lastYearOrders = paidOrders.filter(order => order.createdAt >= lastYear);
    
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const previousMonthRevenue = previousMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const revenueGrowth = previousMonthRevenue ? 
      ((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

    // Customer Analysis
    const uniqueCustomers = new Set(paidOrders.map(order => order.buyer.toString()));
    const returningCustomers = seller.customers.filter(customer => customer.totalOrders > 1);
    const customerRetentionRate = uniqueCustomers.size ? 
      (returningCustomers.length / uniqueCustomers.size) * 100 : 0;

    // Store Performance
    const storeVisits = seller.storeVisits || 0;
    const conversionRate = storeVisits ? 
      (paidOrders.length / storeVisits) * 100 : 0;

    const analyticsData = {
      revenue: {
        total: totalRevenue,
        lastMonth: lastMonthRevenue,
        growth: revenueGrowth,
        yearToDate: lastYearOrders.reduce((sum, order) => sum + order.totalAmount, 0)
      },
      orders: {
        total: allOrders.length,
        completed: paidOrders.filter(order => order.status === 'delivered').length,
        pending: allOrders.filter(order => order.status === 'pending').length,
        cancelled: allOrders.filter(order => order.status === 'cancelled').length,
        lastMonth: lastMonthOrders.length,
        averageOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0
      },
      categories: {
        performance: Object.entries(categoryPerformance)
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .map(([category, data]) => ({
            category,
            ...data,
            averageOrderValue: data.orderCount > 0 ? data.revenue / data.orderCount : 0
          }))
      },
      products: {
        topSelling: Object.entries(productPerformance)
          .sort((a, b) => b[1].soldCount - a[1].soldCount)
          .slice(0, 5)
          .map(([id, data]) => ({
            id,
            ...data
          })),
        totalActive: await Product.countDocuments({ 
          seller: sellerId, 
          status: 'active' 
        })
      },
      customers: {
        total: uniqueCustomers.size,
        returning: returningCustomers.length,
        retentionRate: customerRetentionRate,
        averageLifetimeValue: uniqueCustomers.size > 0 ? 
          totalRevenue / uniqueCustomers.size : 0
      },
      storeMetrics: {
        visits: storeVisits,
        conversionRate,
        averageOrderValue: paidOrders.length > 0 ? 
          totalRevenue / paidOrders.length : 0
      },
      insights: [
        {
          metric: 'Revenue Growth',
          value: revenueGrowth,
          trend: revenueGrowth >= 0 ? 'up' : 'down',
          percentageChange: Math.abs(revenueGrowth),
          recommendation: revenueGrowth < 0 ? 
            'Consider running promotions or reviewing pricing strategy' : 
            'Keep up the good work and consider expanding your product line'
        },
        {
          metric: 'Customer Retention',
          value: customerRetentionRate,
          trend: customerRetentionRate >= 70 ? 'up' : 'down',
          percentageChange: customerRetentionRate,
          recommendation: customerRetentionRate < 70 ? 
            'Focus on customer engagement and loyalty programs' : 
            'Maintain excellent customer service and consider referral programs'
        },
        {
          metric: 'Store Conversion',
          value: conversionRate,
          trend: conversionRate >= 2 ? 'up' : 'down',
          percentageChange: conversionRate,
          recommendation: conversionRate < 2 ? 
            'Review product descriptions and pricing strategy' : 
            'Consider expanding marketing efforts to increase traffic'
        }
      ],
      trends: {
        monthOverMonth: {
          revenue: revenueGrowth,
          orders: lastMonthOrders.length - previousMonthOrders.length,
          customers: lastMonthOrders.filter(order => 
            !previousMonthOrders.find(po => po.buyer.toString() === order.buyer.toString())
          ).length
        }
      }
    };

    res.json(analyticsData);

  } catch (error) {
    console.error('Error getting analytics metrics:', error);
    res.status(500).json({
      message: 'Failed to retrieve analytics metrics',
      error: error.message
    });
  }
};

// Update store profile
exports.updateStoreProfile = async (req, res) => {
  try {
    const { storeName, aboutStore, categories } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Update store information
    if (storeName) seller.storeName = storeName;
    if (aboutStore) seller.aboutStore = aboutStore;
    if (categories) seller.categories = categories;

    // Update completion flags
    seller.hasFilledCategoryDetails = !!categories?.length;

    const updatedSeller = await seller.save();
    res.json({ message: 'Store profile updated successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update store profile', error: error.message });
  }
};

// Update warehouse details
exports.updateWarehouseDetails = async (req, res) => {
  try {
    const { warehouseDetails } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.warehouseDetails = warehouseDetails;
    seller.hasFilledWarehouseAddress = true;

    const updatedSeller = await seller.save();
    res.json({ message: 'Warehouse details updated successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update warehouse details', error: error.message });
  }
};

// Update business address
exports.updateBusinessAddress = async (req, res) => {
  try {
    const { businessAddress } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.businessAddress = businessAddress;
    seller.hasFilledBusinessAddress = true;

    const updatedSeller = await seller.save();
    res.json({ message: 'Business address updated successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update business address', error: error.message });
  }
};

// Update notification preferences
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const { emailNotifications, pushNotifications, notificationTypes } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.notificationPreferences = {
      emailNotifications,
      pushNotifications,
      notificationTypes
    };

    const updatedSeller = await seller.save();
    res.json({ message: 'Notification preferences updated successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification preferences', error: error.message });
  }
};

// Get seller's reviews
exports.getSellerReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    const sellerId = req.user.id;

    const seller = await Seller.findById(sellerId)
      .populate({
        path: 'reviews.buyer',
        select: 'firstName lastName profileImage'
      });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Sort reviews based on query parameter
    let sortedReviews = [...seller.reviews];
    switch (sort) {
      case 'rating-high':
        sortedReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating-low':
        sortedReviews.sort((a, b) => a.rating - b.rating);
        break;
      default: // recent
        sortedReviews.sort((a, b) => b.createdAt - a.createdAt);
    }

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReviews = sortedReviews.slice(startIndex, endIndex);

    res.json({
      reviews: paginatedReviews,
      pagination: {
        total: seller.reviews.length,
        pages: Math.ceil(seller.reviews.length / limit),
        currentPage: page,
        hasMore: endIndex < seller.reviews.length
      }
    });

  } catch (error) {
    console.error('Error in getSellerReviews:', error);
    res.status(500).json({
      message: 'Failed to retrieve reviews',
      error: error.message
    });
  }
};

// Get seller's review statistics
exports.getReviewStats = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const stats = {
      averageRating: seller.stats.averageRating,
      totalReviews: seller.stats.totalReviews,
      ratingDistribution: seller.stats.ratingDistribution,
      verifiedPurchaseCount: seller.reviews.filter(review => review.isVerifiedPurchase).length
    };

    res.json(stats);

  } catch (error) {
    console.error('Error in getReviewStats:', error);
    res.status(500).json({
      message: 'Failed to retrieve review statistics',
      error: error.message
    });
  }
};

// Get campaign metrics
exports.getCampaignMetrics = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user.id)
      .select('campaignStats')
      .populate({
        path: 'campaigns',
        select: 'metrics status createdAt',
        options: { sort: { createdAt: -1 }, limit: 5 }
      });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Calculate engagement rates
    const metrics = {
      ...seller.campaignStats,
      recentCampaigns: seller.campaigns,
      engagementRate: seller.campaignStats.totalRecipients > 0 
        ? ((seller.campaignStats.totalOpens / seller.campaignStats.totalRecipients) * 100).toFixed(2)
        : 0,
      clickThroughRate: seller.campaignStats.totalOpens > 0
        ? ((seller.campaignStats.totalClicks / seller.campaignStats.totalOpens) * 100).toFixed(2)
        : 0
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve campaign metrics',
      error: error.message
    });
  }
};

// Get active followers for campaigns
exports.getActiveFollowers = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const { audienceType = 'all' } = req.query;
    let followers;

    switch (audienceType) {
      case 'active':
        followers = seller.followers.filter(f => 
          f.lastInteraction && 
          new Date(f.lastInteraction) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) &&
          !f.optedOut
        );
        break;
      case 'inactive':
        followers = seller.followers.filter(f => 
          (!f.lastInteraction || 
          new Date(f.lastInteraction) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) &&
          !f.optedOut
        );
        break;
      default:
        followers = seller.followers.filter(f => !f.optedOut);
    }

    res.json({
      totalFollowers: followers.length,
      followers: followers.map(f => ({
        id: f.buyerId,
        name: `${f.firstName} ${f.lastName}`,
        email: f.email,
        followDate: f.followDate,
        lastInteraction: f.lastInteraction
      }))
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve followers',
      error: error.message
    });
  }
};

// Update campaign related notification preferences
exports.updateCampaignPreferences = async (req, res) => {
  try {
    const { campaignMetrics } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.notificationPreferences.notificationTypes.campaignMetrics = campaignMetrics;
    await seller.save();

    res.json({
      message: 'Campaign preferences updated successfully',
      preferences: seller.notificationPreferences
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update campaign preferences',
      error: error.message
    });
  }
};