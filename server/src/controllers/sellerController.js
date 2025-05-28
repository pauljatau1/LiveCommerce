const Seller = require('../models/Seller');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
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
const Stream = require('../models/Stream');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const notificationController = require('./notificationController');
const Transaction = require('../models/Transaction');
const Return = require('../models/Return');
const BankChangeRequest = require('../models/BankChangeRequest');
const Admin = require('../models/Admin');
const mixpanel = require('../config/mixpanel');


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
    const { firstName, lastName, email, password, phoneNumber, storeName } = req.body;

    // Basic input validation
    if (!firstName || !lastName || !email || !password || !phoneNumber || !storeName) {
      return res.status(400).json({ 
        message: 'First name, last name, email, password, phone number, and store name are required.' 
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
        from: 'Auqli Nigeria <support@auqli.com>',
        subject: 'Verify Your Email - Auqli',
        text: `Hi ${existingSeller.firstName}, please verify your email with this OTP: ${otp}`,
        html: `
          <div style="background-color: #1a1a1a; color: #ffffff; padding: 10px; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto;">
    <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
    <h1 style="color: #4CAF50; margin-bottom: 20px;">Welcome to Auqli Nigeria — Let’s Get You Selling</h1>
    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hi ${existingSeller.firstName},</p>
    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 30px;">Welcome to Auqli Nigeria — the future of live selling. Your account is live and you're just a few steps away from listing products and going live with your audience.</p>

    <div style="background-color: #333333; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 30px;">
      <span style="font-size: 32px; letter-spacing: 5px; color: #4CAF50; font-weight: bold;">${otp}</span>
    </div>
    <p style="font-size: 14px; color: #999999;">This OTP will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>

    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Start by:</p>
    <ul style="list-style: none; padding: 0; margin: 0;">
      <li style="margin-bottom: 12px; padding: 8px; border-radius: 4px; background-color: #242424;">
        <div style="display: flex; align-items: center;">
          <span style="color: #4CAF50; margin-right: 10px; font-size: 18px;">✓</span>
          <span>Completing your seller profile</span>
        </div>
      </li>
      <li style="margin-bottom: 12px; padding: 8px; border-radius: 4px; background-color: #242424;">
        <div style="display: flex; align-items: center;">
          <span style="color: #4CAF50; margin-right: 10px; font-size: 18px;">✓</span>
          <span>Uploading your first product</span>
        </div>
      </li>
      <li style="padding: 8px; border-radius: 4px; background-color: #242424;">
        <div style="display: flex; align-items: center;">
          <span style="color: #4CAF50; margin-right: 10px; font-size: 18px;">✓</span>
          <span>Exploring live selling tools</span>
        </div>
      </li>
    </ul>

    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Need help? Visit our Help Center at <a href="http://help.auqli.live" style="color: #4CAF50; text-decoration: none;">help.auqli.live</a> or contact <a href="mailto:support@auqli.com" style="color: #4CAF50; text-decoration: none;">support@auqli.com</a>.</p>

    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Join our seller community:</p>
    <ul style="list-style: none; padding: 0; margin: 0;">
      <li style="margin-bottom: 12px; padding: 8px; border-radius: 4px; background-color: #242424;">
        <div style="display: flex; align-items: center;">
          <span style="color: #4CAF50; margin-right: 10px; font-size: 18px;">💬</span>
          <span>WhatsApp Channel</span>
        </div>
      </li>
      <li style="margin-bottom: 12px; padding: 8px; border-radius: 4px; background-color: #242424;">
        <div style="display: flex; align-items: center;">
          <span style="color: #4CAF50; margin-right: 10px; font-size: 18px;">📢</span>
          <span>Telegram Group</span>
        </div>
      </li>
      <li style="padding: 8px; border-radius: 4px; background-color: #242424;">
        <div style="display: flex; align-items: center;">
          <span style="color: #4CAF50; margin-right: 10px; font-size: 18px;">📱</span>
          <span>Instagram | Twitter | Facebook</span>
        </div>
      </li>
    </ul>

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
      storeName,
      otp,
      agoraUid // Add the generated UID
    });

    await newSeller.save();

    // Generate JWT token for new seller
    const token = generateToken(newSeller._id);

    // Send welcome email with OTP
    const msg = {
      to: email,
      from: 'Joseph From Auqli <support@auqli.com>',
      subject: 'Welcome to Auqli!',
      text: `Hi ${firstName}, welcome to Auqli! Please verify your email with this OTP: ${otp}`,
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 10px; font-family: Arial, sans-serif;">
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
      to: ['admin@auqli.com'],
      from: 'Auqli Admin <support@auqli.com>',
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

    // track seller login event on mixpanel
    mixpanel.track('seller_login', {
      sellerId: seller._id,
      sellerName: seller.firstName + " " + seller.lastName,
      email: seller.email
    });
    
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
      from: 'Joseph From Auqli <support@auqli.com>',
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
    // Get only necessary fields using projection
    const seller = await Seller.findById(req.user.id)
      .select({
        firstName: 1,
        lastName: 1,
        email: 1,
        phoneNumber: 1,
        isVerified: 1,
        emailVerified: 1,
        isFeatured: 1,
        isDisabled: 1,
        walletBalance: 1,
        storeVisits: 1,
        createdAt: 1,
        accountType: 1,
        businessName: 1,
        businessType: 1,
        isProfileComplete: 1,
        businessEmail: 1,
        businessNumber: 1,
        businessAddress: 1,
        sellerAddress: 1,
        warehouseDetails: 1,
        bankDetails: 1,
        shippingOptions: 1,
        storeAvatar: 1,
        storeBanner: 1,
        hasFilledAddress: 1,
        hasFilledBankDetails: 1,
        hasFilledBusinessAddress: 1,
        hasFilledCategoryDetails: 1,
        hasFilledVerificationDocuments: 1,
        hasFilledWarehouseAddress: 1,
        isNewSeller: 1,
        onboardingProcess: 1,
        notificationPreferences: 1,
        aboutStore: 1,
        storeName: 1,
        stats: 1,
        campaignStats: 1,
        cancelledStreamCount: 1,
        lastStreamCancellation: 1,
        agoraUid: 1,
        followers: 1,
        following: 1,
        operatingHours: 1,
        specialDates: 1,
        timezone: 1,
        storePolicy: 1,
        accountPending: 1,
        offersStorePickup: 1, // Add this line to include offersStorePickup
      })
      .lean();

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Get counts
    const [orderCount, streamCount, categoriesCount, followingCount] = await Promise.all([
      Order.countDocuments({ seller: req.user.id }),
      Stream.countDocuments({ seller: req.user.id }),
      Seller.findById(req.user.id).select('categories').then(s => s.categories.length),
      Buyer.countDocuments({ 'followers.sellerId': req.user.id })
    ]);

    // Add the count fields to the response
    const sellerProfile = {
      ...seller,
      followersCount: seller.followers?.length || 0,
      followingCount: followingCount,
      totalOrders: orderCount,
      streamCount: streamCount,
      categoriesCount: categoriesCount,
      // Add current store status
      storeStatus: {
        isCurrentlyOpen: seller.isCurrentlyOpen?.(),
        currentSchedule: getCurrentSchedule(seller)
      }
    };

    // Remove the full arrays from the response
    delete sellerProfile.followers;
    delete sellerProfile.following;

    res.json(sellerProfile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching seller profile', error: error.message });
  }
};


// Helper function to get current schedule
const getCurrentSchedule = (seller) => {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  
  // Check for special dates first
  const specialDate = seller.specialDates?.find(d => 
    new Date(d.date).toDateString() === now.toDateString()
  );

  if (specialDate) {
    return {
      type: 'special',
      isOpen: specialDate.isOpen,
      openTime: specialDate.openTime,
      closeTime: specialDate.closeTime,
      note: specialDate.note
    };
  }

  // Return regular hours
  const regularHours = seller.operatingHours?.[today];
  return {
    type: 'regular',
    day: today,
    isOpen: regularHours?.isOpen || false,
    openTime: regularHours?.openTime,
    closeTime: regularHours?.closeTime
  };
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

    if (!files || !files.certificateOfIncorporation) {
      return res.status(400).json({ 
        message: 'Certificate of Incorporation is required' 
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
      Bucket: process.env.CDN_S3_BUCKET,
      Key: `verification/${req.user.id}/company/${uuidv4()}-${certFile.originalname}`,
      Body: certFile.buffer,
      ContentType: certFile.mimetype,
    };
    const certUpload = await s3.upload(certParams).promise();
    documents.push({
      documentType: 'certificateOfIncorporation',
      fileUrl: `https://` + process.env.CDN_URL + `/${certUpload.Key}`,
      public_id: certUpload.Key
    });

    // Upload Business Tax ID if provided
    if (files.businessTaxId) {
      const taxFile = files.businessTaxId[0];
      const taxParams = {
        Bucket: process.env.CDN_S3_BUCKET,
        Key: `verification/${req.user.id}/company/${uuidv4()}-${taxFile.originalname}`,
        Body: taxFile.buffer,
        ContentType: taxFile.mimetype,
      };
      const taxUpload = await s3.upload(taxParams).promise();
      documents.push({
        documentType: 'businessTaxId',
        fileUrl: `https://` + process.env.CDN_URL + `/${taxUpload.Key}`,
        public_id: taxUpload.Key
      });
    }

    seller.verificationDocuments = {
      type: 'company',
      documents: documents
    };
    
    // Set verification documents as filled
    seller.hasFilledVerificationDocuments = true;
    
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

    if (!files || !files.governmentId || !files.proofOfAddress) {
      return res.status(400).json({ 
        message: 'Government ID and Proof of Address are required' 
      });
    }

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const documents = [];
    
    // Upload Individual Tax ID if provided
    if (files.individualTaxId) {
      const taxFile = files.individualTaxId[0];
      const taxParams = {
        Bucket: process.env.CDN_S3_BUCKET,
        Key: `verification/${req.user.id}/individual/${uuidv4()}-${taxFile.originalname}`,
        Body: taxFile.buffer,
        ContentType: taxFile.mimetype,
      };
      const taxUpload = await s3.upload(taxParams).promise();
      documents.push({
        documentType: 'individualTaxId',
        fileUrl: `https://` + process.env.CDN_URL + `/${taxUpload.Key}`, 
        public_id: taxUpload.Key
      });
    }

    // Upload Government ID
    const govFile = files.governmentId[0];
    const govParams = {
      Bucket: process.env.CDN_S3_BUCKET,
      Key: `verification/${req.user.id}/individual/${uuidv4()}-${govFile.originalname}`,
      Body: govFile.buffer,
      ContentType: govFile.mimetype,
    };
    const govUpload = await s3.upload(govParams).promise();
    documents.push({
      documentType: 'governmentId',
      fileUrl: `https://` + process.env.CDN_URL + `/${govUpload.Key}`,
      public_id: govUpload.Key
    });

    // Upload Proof of Address
    const addressFile = files.proofOfAddress[0];
    const addressParams = {
      Bucket: process.env.CDN_S3_BUCKET,
      Key: `verification/${req.user.id}/individual/${uuidv4()}-${addressFile.originalname}`,
      Body: addressFile.buffer,
      ContentType: addressFile.mimetype,
    };
    const addressUpload = await s3.upload(addressParams).promise();
    documents.push({
      documentType: 'proofOfAddress',
      fileUrl: `https://` + process.env.CDN_URL + `/${addressUpload.Key}`,
      public_id: addressUpload.Key
    });

    seller.verificationDocuments = {
      type: 'individual',
      documents: documents
    };
    
    // Set verification documents as filled
    seller.hasFilledVerificationDocuments = true;
    
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
      Bucket: process.env.CDN_S3_BUCKET,
      Key: `${uuidv4()}-${avatarFile.originalname}`,
      Body: avatarFile.buffer,
      ContentType: avatarFile.mimetype,
     
    };
    const data = await s3.upload(params).promise();

    seller.storeAvatar = {
      url: `https://` + process.env.CDN_URL + `/${data.Key}`,
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
      Bucket: process.env.CDN_S3_BUCKET,
      Key: `${uuidv4()}-${bannerFile.originalname}`,
      Body: bannerFile.buffer,
      ContentType: bannerFile.mimetype,
     
    };
    const data = await s3.upload(params).promise();

    seller.storeBanner = {
      url: `https://` + process.env.CDN_URL + `/${data.Key}`,
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

    // // Validate required fields
    // if (!businessName || !businessType || !taxInformation) {
    //   return res.status(400).json({ 
    //     message: 'Business name, business type, and tax information are all required' 
    //   });
    // }

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

    // If seller already has bank details, they need to use the change request process
    if (seller.bankDetails && seller.bankDetails.accountNumber) {
      return res.status(400).json({ 
        message: 'Bank details already exist. Please use the bank change request process to update your details.' 
      });
    }

    seller.bankDetails = bankDetails;
    seller.hasFilledBankDetails = !!bankDetails;
    const updatedSeller = await seller.save();

    res.json({ message: 'Bank details added successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add bank details', error: error.message });
  }
};

// Request bank account change
exports.requestBankAccountChange = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Check if there's already a pending request
    const existingRequest = await BankChangeRequest.findOne({
      seller: sellerId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: "You already have a pending bank change request" 
      });
    }

    // Validate proof document
    if (!req.file) {
      return res.status(400).json({ 
        message: "Proof document is required" 
      });
    }

    // Parse the newBankDetails from JSON string
    let newBankDetails;
    try {
      newBankDetails = JSON.parse(req.body.newBankDetails);
    } catch (error) {
      return res.status(400).json({ 
        message: "Invalid bank details format" 
      });
    }

    // Upload proof document to S3
    const fileKey = `bank-change-proofs/${uuidv4()}-${req.file.originalname}`;
    const uploadParams = {
      Bucket: process.env.CDN_S3_BUCKET,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    // Create bank change request
    const bankChangeRequest = new BankChangeRequest({
      seller: sellerId,
      currentBankDetails: seller.bankDetails,
      newBankDetails: newBankDetails,
      proofDocument: {
        url: `https://` + process.env.CDN_URL + `/${uploadResult.Key}`,
        public_id: uploadResult.Key
      }
    });

    await bankChangeRequest.save();

    // Send email notifications
    const adminEmails = await Admin.find().distinct('email');
    
    // Email to admin
    const adminEmailMsg = {
      to: adminEmails,
      from: 'Auqli Admin <support@auqli.com>',
      subject: 'New Bank Account Change Request',
      html: `
        <h2>New Bank Account Change Request</h2>
        <p>A seller has submitted a request to change their bank account details.</p>
        <p>Seller: ${seller.firstName} ${seller.lastName} (${seller.email})</p>
        <p>Store: ${seller.storeName}</p>
        <p>Please review the request in the admin dashboard.</p>
      `
    };

    // Email to seller
    const sellerEmailMsg = {
      to: seller.email,
      from: 'Auqli Admin <support@auqli.com>',
      subject: 'Bank Account Change Request Submitted',
      html: `
        <h2>Bank Account Change Request Submitted</h2>
        <p>Your request to change bank account details has been submitted successfully.</p>
        <p>Our admin team will review your request and notify you of the decision.</p>
        <p>You can check the status of your request in your seller dashboard.</p>
      `
    };

    // Send both emails
    await Promise.all([
      sgMail.send(adminEmailMsg),
      sgMail.send(sellerEmailMsg)
    ]);

    res.status(200).json({
      message: "Bank change request submitted successfully"
    });

  } catch (error) {
    console.error('Error in requestBankAccountChange:', error);
    res.status(500).json({
      message: "Failed to submit bank account change request",
      error: error.message
    });
  }
};

// Get bank change request status
exports.getBankChangeRequestStatus = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const pendingRequest = await BankChangeRequest.findOne({
      seller: sellerId,
      status: 'pending'
    }).select('requestDate newBankDetails status');

    res.json({
      success: true,
      pendingRequest
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to get bank change request status', 
      error: error.message 
    });
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
    seller.warehouseAddress &&
    seller.storeName
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
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const currentDate = new Date();
    const currentWeekStart = new Date(currentDate);
    currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay()); // Start of current week (Sunday)
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(currentWeekStart.getDate() - 7); // Start of last week

    // Get current week statistics
    const lastWeekVisits = seller.lastWeekStats?.storeVisits || 0;
    const currentWeekVisits = seller.weeklyStats?.storeVisits || 0;

    // Get total orders from Order model
    const totalOrders = await Order.countDocuments({ 'items.seller': seller._id });
    const currentWeekOrders = await Order.countDocuments({
      'items.seller': seller._id,
      createdAt: {
        $gte: currentWeekStart,
        $lt: currentDate
      }
    });
    const lastWeekOrders = await Order.countDocuments({
      'items.seller': seller._id,
      createdAt: {
        $gte: lastWeekStart,
        $lt: currentWeekStart
      }
    });

    // Find all unique buyers who have placed orders with this seller
    const buyersWithOrders = await Order.distinct('buyer', { 'items.seller': seller._id });
    
    // Count only customers/followers who have at least one order
    const totalCustomers = seller.followers.filter(follower => 
      follower.buyerId && buyersWithOrders.some(buyerId => 
        buyerId && buyerId.toString() === follower.buyerId.toString())
    ).length;

    // Get current week's new followers who have orders
    const currentWeekCustomers = seller.followers.filter(follower => {
      if (!follower.buyerId || !follower.followDate) return false;
      const followDate = new Date(follower.followDate);
      return followDate >= currentWeekStart && 
              followDate <= currentDate &&
              buyersWithOrders.some(buyerId => 
                buyerId && buyerId.toString() === follower.buyerId.toString());
    }).length;

    // Get last week's new followers who have orders
    const lastWeekCustomers = seller.followers.filter(follower => {
      if (!follower.buyerId || !follower.followDate) return false;
      const followDate = new Date(follower.followDate);
      return followDate >= lastWeekStart && 
              followDate < currentWeekStart &&
              buyersWithOrders.some(buyerId => 
                buyerId && buyerId.toString() === follower.buyerId.toString());
    }).length;

    // Calculate conversion rates
    const storeVisits = seller.storeVisits || 0;
    const currentConversionRate = storeVisits > 0 ? 
      (totalOrders / storeVisits) * 100 : 0;
    
    const lastWeekConversionRate = lastWeekVisits > 0 ? 
      (lastWeekOrders / lastWeekVisits) * 100 : 0;

    // Calculate percentage changes
    const calculatePositiveChange = (current, previous) => {
      if (!previous || previous === 0) return {'value': current, 'type': 'number'};
      if (!current || current === 0) return {'value': current, 'type': 'number'};
      const change = ((current - previous) / previous) * 100;
      return {'value': change.toFixed(2), 'type': 'percentage'};
    };

    const visitsChange = calculatePositiveChange(currentWeekVisits, lastWeekVisits);
    const ordersChange = calculatePositiveChange(currentWeekOrders, lastWeekOrders);
    const customersChange = calculatePositiveChange(currentWeekCustomers, lastWeekCustomers);
    const walletChange = calculatePositiveChange(
      seller.walletBalance, 
      seller.lastWeekStats?.walletBalance || 0
    );
    const conversionChange = calculatePositiveChange(currentConversionRate, lastWeekConversionRate);

    const statistics = {
      walletBalance: {
        amount: seller.walletBalance,
        currency: "NGN",
        change: walletChange
      },
      storeVisits: {
        count: storeVisits,
        change: visitsChange
      },
      totalOrders: {
        count: totalOrders,
        change: ordersChange
      },
      conversionRate: {
        percentage: parseFloat(currentConversionRate.toFixed(2)),
        change: conversionChange
      },
      newCustomers: {
        count: totalCustomers,
        change: customersChange
      }
    };

    res.json(statistics);
  } catch (error) {
    console.error('Error in getStatistics:', error);
    res.status(500).json({
      message: 'Failed to retrieve statistics',
      error: error.message
    });
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
      from: 'Joseph From Auqli <support@auqli.com>',
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
    from: 'Joseph From Auqli <support@auqli.com>',
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
    from: 'Joseph From Auqli <support@auqli.com>',
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

        // Get buyer details including profile image
        const buyer = await Buyer.findById(follower.buyerId);

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
          followedAt: follower.followDate,
          profileImageUrl: buyer?.profileImage?.url || null // Add profile image URL
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

    // Get buyer information with relevant fields
    const buyer = await Buyer.findById(buyerId).select(
      'firstName lastName email phoneNumber country profileImage createdAt shippingAddresses isIdentityVerified preferredLanguage preferredCurrency'
    );
    
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Get all orders for this buyer with this seller
    const orders = await Order.find({
      buyer: buyerId,
      seller: sellerId
    })
    .populate('items.product', 'name images price category')
    .sort({ createdAt: -1 });

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
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: orders.length > 0 
        ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length 
        : 0,
      firstOrderDate: orders.length > 0 ? orders[orders.length - 1].createdAt : null,
      lastOrderDate: orders.length > 0 ? orders[0].createdAt : null,
      orderFrequency: orders.length > 0 
        ? (orders.length / ((new Date() - new Date(orders[orders.length - 1].createdAt)) / (1000 * 60 * 60 * 24 * 30))).toFixed(2) + ' orders/month'
        : '0 orders/month'
    };

    // Get purchase categories distribution
    const categoryPurchases = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!item.product || !item.product.category) return; // Skip if product or category is null
        
        const category = item.product.category;
        if (!categoryPurchases[category]) {
          categoryPurchases[category] = {
            category,
            quantity: 0,
            totalSpent: 0
          };
        }
        categoryPurchases[category].quantity += item.quantity;
        categoryPurchases[category].totalSpent += item.price * item.quantity;
      });
    });

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

    // Calculate payment methods distribution
    const paymentMethods = {};
    orders.forEach(order => {
      const method = order.paymentInfo?.method || 'unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = {
          method,
          count: 0,
          totalAmount: 0
        };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].totalAmount += order.totalAmount;
    });

    // Get order status distribution
    const orderStatusDistribution = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const status = item.status || 'unknown';
        if (!orderStatusDistribution[status]) {
          orderStatusDistribution[status] = 0;
        }
        orderStatusDistribution[status] += 1;
      });
    });

    const response = {
      buyerInfo: {
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        email: buyer.email,
        phoneNumber: buyer.phoneNumber,
        country: buyer.country,
        joinDate: buyer.createdAt,
        profileImageUrl: buyer.profileImage?.url || null,
        isIdentityVerified: buyer.isIdentityVerified,
        preferredLanguage: buyer.preferredLanguage,
        preferredCurrency: buyer.preferredCurrency,
        accountAge: `${Math.floor((new Date() - new Date(buyer.createdAt)) / (1000 * 60 * 60 * 24))} days`
      },
      orderStats,
      purchaseInsights: {
        topCategories: Object.values(categoryPurchases)
          .sort((a, b) => b.totalSpent - a.totalSpent),
        paymentMethods: Object.values(paymentMethods),
        orderStatusDistribution
      },
      shippingAddresses: buyer.shippingAddresses,
      topPurchases,
      recentOrders: recentOrders.map(order => ({
        _id: order._id,
        orderNumber: order.order_id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        paymentMethod: order.paymentInfo?.method || 'unknown',
        isCashOnDelivery: order.paymentInfo?.isCashOnDelivery || false,
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
          quantity: item.quantity,
          status: item.status
        }))
      })),
      hasOrderedFromSeller: orders.length > 0
    };

    res.json(response);

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
      from: 'Joseph From Auqli <support@auqli.com>',
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
      from: 'Joseph From Auqli <support@auqli.com>',
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

    // Validate bank details
    if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName || !bankDetails.bankIdentifierCode) {
      return res.status(400).json({ message: 'All bank details are required (bankName, accountNumber, accountName, bankIdentifierCode)' });
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
      from: 'Auqli Admin <support@auqli.com>',
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

// Get seller analytics
exports.getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { period = 'month', startDate, endDate } = req.query;
    
    // Find the seller
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    // Set date range based on period
    let dateFilter = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (period === 'week') {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      dateFilter = { $gte: oneWeekAgo };
    } else if (period === 'month') {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { $gte: oneMonthAgo };
    } else if (period === 'year') {
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      dateFilter = { $gte: oneYearAgo };
    }
    
    // Get orders data
    const Order = mongoose.model('Order');
    const orders = await Order.find({ 
      seller: sellerId,
      createdAt: dateFilter
    }).populate('buyer', 'firstName lastName email');
    
    // Get products data with ACTUAL views
    const Product = mongoose.model('Product');
    const products = await Product.find({ 
      seller: sellerId
    }).sort({ createdAt: -1 });
    
    // Get streams data with more details
    const Stream = mongoose.model('Stream');
    const streams = await Stream.find({
      seller: sellerId,
      createdAt: dateFilter
    }).populate({
      path: 'viewers',
      select: 'firstName lastName'
    });
    
    // Calculate order statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const fulfilledOrders = orders.filter(order => !order.isOpen).length;
    const pendingOrders = orders.filter(order => order.isOpen).length;
    
    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;
    
    // Get unique buyers
    const uniqueBuyers = [...new Set(orders.map(order => order.buyer?._id?.toString()))].filter(Boolean).length;
    
    // Calculate customer retention
    const customerIds = orders.map(order => order.buyer?._id?.toString()).filter(Boolean);
    const buyerFrequency = {};
    customerIds.forEach(id => {
      buyerFrequency[id] = (buyerFrequency[id] || 0) + 1;
    });
    
    const repeatCustomers = Object.values(buyerFrequency).filter(count => count > 1).length;
    const repeatCustomerRate = uniqueBuyers > 0 ? (repeatCustomers / uniqueBuyers * 100).toFixed(2) : 0;
    
    // Get top products with actual view counts
    const topProducts = products.slice(0, 10).map(product => ({
      _id: product._id,
      name: product.name,
      sold: product.stats?.soldCount || 0,
      views: product.stats?.views || 0,
      stock: product.stockQuantity,
      price: product.price,
      imageUrl: product.images && product.images.length > 0 ? product.images[0].url : null,
      lastUpdated: product.updatedAt
    }));
    
    // Get most sold products
    const mostSoldProducts = [...products]
      .sort((a, b) => (b.stats?.soldCount || 0) - (a.stats?.soldCount || 0))
      .slice(0, 5)
      .map(product => ({
        _id: product._id,
        name: product.name,
        sold: product.stats?.soldCount || 0,
        views: product.stats?.views || 0,
        price: product.price,
        imageUrl: product.images && product.images.length > 0 ? product.images[0].url : null
      }));
    
    // Get most viewed products
    const mostViewedProducts = [...products]
      .sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0))
      .slice(0, 5)
      .map(product => ({
        _id: product._id,
        name: product.name,
        views: product.stats?.views || 0,
        sold: product.stats?.soldCount || 0,
        price: product.price,
        imageUrl: product.images && product.images.length > 0 ? product.images[0].url : null
      }));
    
    // Get low stock products
    const lowStockProducts = products
      .filter(p => p.stockQuantity < (p.lowStockAlert || 5) && p.stockQuantity > 0)
      .map(product => ({
        _id: product._id,
        name: product.name,
        stock: product.stockQuantity,
        lowStockThreshold: product.lowStockAlert || 5,
        sold: product.stats?.soldCount || 0,
        views: product.stats?.views || 0,
        price: product.price,
        imageUrl: product.images && product.images.length > 0 ? product.images[0].url : null
      }));
    
    // Get stream analytics with richer data
    const totalStreams = streams.length;
    const liveStreams = streams.filter(stream => stream.status === 'live').length;
    const endedStreams = streams.filter(stream => stream.status === 'ended').length;
    const scheduledStreams = streams.filter(stream => stream.status === 'scheduled').length;
    
    const totalStreamViewers = streams.reduce((sum, stream) => sum + (stream.viewers?.length || 0), 0);
    const averageViewersPerStream = totalStreams > 0 ? (totalStreamViewers / totalStreams).toFixed(2) : 0;
    
    // Get recent streams with viewer data
    const recentStreams = streams
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(stream => ({
        _id: stream._id,
        title: stream.title,
        status: stream.status,
        scheduledStartTime: stream.scheduledStartTime,
        actualStartTime: stream.actualStartTime,
        endTime: stream.endTime,
        viewerCount: stream.viewers?.length || 0,
        productCount: stream.products?.length || 0,
        bidCount: stream.bids?.length || 0,
        orderCount: stream.orders?.length || 0
      }));
    
    // Get top performing streams
    const topPerformingStreams = [...streams]
      .sort((a, b) => (b.viewers?.length || 0) - (a.viewers?.length || 0))
      .slice(0, 3)
      .map(stream => ({
        _id: stream._id,
        title: stream.title,
        viewerCount: stream.viewers?.length || 0,
        orderCount: stream.orders?.length || 0,
        scheduledStartTime: stream.scheduledStartTime
      }));
    
    // Calculate revenue by date for chart data
    const revenueByDate = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + order.totalAmount;
    });
    
    const chartData = Object.keys(revenueByDate).sort().map(date => ({
      date,
      revenue: revenueByDate[date]
    }));
    
    // Orders by channel
    const ordersByChannel = orders.reduce((acc, order) => {
      const channel = order.channel || 'marketplace';
      acc[channel] = (acc[channel] || 0) + 1;
      return acc;
    }, {});
    
    // Revenue by channel
    const revenueByChannel = orders.reduce((acc, order) => {
      const channel = order.channel || 'marketplace';
      acc[channel] = (acc[channel] || 0) + order.totalAmount;
      return acc;
    }, {});
    
    // Get recent orders with enhanced data
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(order => ({
        _id: order._id,
        order_id: order.order_id,
        buyerName: order.buyer ? `${order.buyer.firstName} ${order.buyer.lastName}` : 'Unknown',
        totalAmount: order.totalAmount,
        date: order.createdAt,
        status: order.isOpen ? 'Open' : 'Closed',
        items: order.items.length,
        channel: order.channel || 'marketplace',
        shippingStatus: order.shipping?.tracking?.status || 'pending'
      }));
    
    // Get followers info (but omit unnecessary details)
    const followersCount = seller.followers?.length || 0;
    const recentFollowers = seller.followers
      ?.filter(follower => follower.firstName && follower.lastName) // Filter out incomplete records
      ?.slice(0, 5)
      ?.map(follower => ({
        _id: follower.buyerId,
        name: `${follower.firstName} ${follower.lastName}`,
        email: follower.email,
        followDate: follower.followDate,
        orderCount: follower.totalOrders || 0
      })) || [];
    
    // Get store visit data
    const storeVisits = seller.storeVisits || 0;
    
    // Use properly formatted monthly stats
    const storeVisitsByMonth = {};
    if (seller.monthlyStats && seller.monthlyStats.storeVisits) {
      Object.entries(seller.monthlyStats.storeVisits).forEach(([key, value]) => {
        // Convert keys like '2025-3' to proper month names
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthName = date.toLocaleString('default', { month: 'long' });
        storeVisitsByMonth[`${monthName} ${year}`] = value;
      });
    }
    
    // Generate insights and recommendations
    const insights = [];
    const recommendations = [];
    
    // Revenue insights
    if (totalOrders > 0) {
      insights.push(`Your average order value is ₦${parseFloat(averageOrderValue).toLocaleString()}.`);
      
      // Check if there's a significant portion of liveshows vs marketplace
      const liveshowOrders = ordersByChannel['liveshow'] || 0;
      const liveshowPercentage = (liveshowOrders / totalOrders) * 100;
      
      if (liveshowPercentage > 30) {
        insights.push(`${liveshowPercentage.toFixed(0)}% of your orders come from live shows.`);
        recommendations.push("Your live shows are performing well. Consider increasing the frequency of your streams.");
      } else if (liveStreams > 0 || endedStreams > 0) {
        recommendations.push("Consider featuring more products in your live streams to increase conversions.");
      }
    }
    
    // Customer insights
    if (uniqueBuyers > 0) {
      insights.push(`You have a ${repeatCustomerRate}% repeat customer rate.`);
      
      if (parseFloat(repeatCustomerRate) < 30) {
        recommendations.push("Your repeat customer rate is relatively low. Consider implementing a loyalty program or sending follow-up emails.");
      } else if (parseFloat(repeatCustomerRate) > 60) {
        insights.push("You have a strong loyal customer base!");
        recommendations.push("Leverage your loyal customers by introducing referral bonuses or exclusive products.");
      }
    }
    
    // Product insights
    if (lowStockProducts.length > 0) {
      insights.push(`You have ${lowStockProducts.length} products with low stock (below their threshold).`);
      recommendations.push("Restock your low inventory items soon to avoid missed sales opportunities.");
    }
    
    // Check for products with zero sales
    if (products.length > 0) {
      const productsWithZeroSales = products.filter(p => !p.stats?.soldCount || p.stats.soldCount === 0).length;
      const percentageZeroSales = (productsWithZeroSales / products.length) * 100;
      
      if (percentageZeroSales > 30) {
        insights.push(`${percentageZeroSales.toFixed(0)}% of your products have no sales.`);
        recommendations.push("Consider updating your product listings or running promotions for items that aren't selling.");
      }
      
      // Add insights for products with high views but low sales
      const productsWithViewsButNoSales = products.filter(p => 
        (p.stats?.views || 0) > 10 && (!p.stats?.soldCount || p.stats.soldCount === 0)
      ).length;
      
      if (productsWithViewsButNoSales > 0) {
        insights.push(`You have ${productsWithViewsButNoSales} products with significant views but no sales.`);
        recommendations.push("Review pricing or product details for items that get views but don't convert to sales.");
      }
    }
    
    // Stream insights
    if (totalStreams > 0) {
      insights.push(`Your streams average ${averageViewersPerStream} viewers per session.`);
      
      if (parseFloat(averageViewersPerStream) < 5) {
        recommendations.push("Promote your upcoming streams more actively to increase viewership.");
      }
      
      const conversionRate = streams.reduce((sum, stream) => {
        const viewers = stream.viewers?.length || 0;
        const orders = stream.orders?.length || 0;
        return viewers > 0 ? sum + (orders / viewers) : sum;
      }, 0) / totalStreams;
      
      if (conversionRate > 0) {
        insights.push(`Your stream-to-sale conversion rate is ${(conversionRate * 100).toFixed(1)}%.`);
        
        if (conversionRate < 0.05) {
          recommendations.push("Try more engaging sales techniques during your streams to improve conversion.");
        } else if (conversionRate > 0.2) {
          insights.push("Your stream conversion rate is excellent!");
        }
      }
    }
    
    // Prepare final response with enhanced data
    const analytics = {
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        uniqueBuyers,
        totalProducts: products.length,
        totalStreams,
        storeVisits,
        walletBalance: seller.walletBalance || 0,
        followersCount,
        ratingsAverage: seller.stats?.averageRating || 0,
        totalReviews: seller.stats?.totalReviews || 0
      },
      insights,
      recommendations,
      ordersData: {
        fulfilledOrders,
        pendingOrders,
        repeatCustomerRate,
        recentOrders,
        ordersByChannel,
        revenueByChannel
      },
      productsData: {
        topProducts,
        mostSoldProducts,
        mostViewedProducts,
        lowStockProducts,
        outOfStockCount: products.filter(p => p.stockQuantity === 0).length,
        totalProductsSold: products.reduce((sum, product) => sum + (product.stats?.soldCount || 0), 0),
        totalProductViews: products.reduce((sum, product) => sum + (product.stats?.views || 0), 0)
      },
      streamsData: {
        liveStreams,
        endedStreams,
        scheduledStreams,
        averageViewersPerStream,
        totalStreamViewers,
        recentStreams,
        topPerformingStreams,
        cancelledStreams: seller.cancelledStreamCount || 0
      },
      followersData: {
        totalFollowers: followersCount,
        recentFollowers
      },
      chartData,
      ratingsDistribution: seller.stats?.ratingDistribution || {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      },
      storeVisitsByMonth: Object.entries(storeVisitsByMonth).map(([month, count]) => ({
        month,
        count
      }))
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching seller analytics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch analytics', 
      error: error.message 
    });
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
      case 'recent':
      default:
        sortedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReviews = sortedReviews.slice(startIndex, endIndex);

    // Calculate total pages
    const totalReviews = seller.reviews.length;
    const totalPages = Math.ceil(totalReviews / limit);

    res.json({
      reviews: paginatedReviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReviews,
        hasMore: endIndex < totalReviews
      },
      stats: seller.stats
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

// Reply to a review
exports.replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;
    const sellerId = req.user.id;

    // Validate input
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Find the review
    const review = seller.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Add or update reply
    review.reply = {
      content: content.trim(),
      createdAt: review.reply ? review.reply.createdAt : new Date(),
      updatedAt: new Date()
    };

    await seller.save();

    // If this is a new reply (not an update), send notification to buyer
    if (!review.reply.createdAt) {
      // Assuming you have a notification system
      try {
        await notificationController.createNotification({
          recipient: 'buyer',
          buyer: review.buyer,
          type: 'review_reply',
          title: 'Seller replied to your review',
          message: `${seller.storeName || seller.businessName} has replied to your review`,
          data: {
            sellerId: seller._id,
            reviewId: review._id
          }
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    }

    res.json({
      message: 'Reply added successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add reply', error: error.message });
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

exports.getAllReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      type = 'all',
      sortBy = 'newest' 
    } = req.query;

    // Validate seller exists
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Build aggregation pipeline
    const matchSeller = { $match: { seller: new mongoose.Types.ObjectId(sellerId) } };
    
    // Get reviews from different sources based on type
    const [productReviews, postComments, storeReviews] = await Promise.all([
      type === 'all' || type === 'product' ? 
        Product.aggregate([
          matchSeller,
          { $unwind: '$reviews' },
          { $replaceRoot: { newRoot: {
            $mergeObjects: [
              '$reviews',
              { 
                type: 'product',
                source: {
                  type: 'product',
                  id: '$_id',
                  name: '$name',
                  image: { $arrayElemAt: ['$images.url', 0] }
                }
              }
            ]
          }}}
        ]) : [],

      type === 'all' || type === 'post' ?
        Post.aggregate([
          { $match: { 'author.userId': new mongoose.Types.ObjectId(sellerId) } },
          { $unwind: '$comments' },
          { $replaceRoot: { newRoot: {
            $mergeObjects: [
              '$comments',
              {
                type: 'post',
                source: {
                  type: 'post',
                  id: '$_id',
                  name: '$title',
                  image: { $arrayElemAt: ['$media.url', 0] }
                }
              }
            ]
          }}}
        ]) : [],

      type === 'all' || type === 'store' ?
        Seller.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(sellerId) } },
          { $unwind: '$reviews' },
          { $replaceRoot: { newRoot: {
            $mergeObjects: [
              '$reviews',
              { type: 'store' }
            ]
          }}}
        ]) : []
    ]);

    // Get blip comments (separate query due to nested structure)
    let blipComments = [];
    if (type === 'all' || type === 'blip') {
      const products = await Product.find({ seller: sellerId });
      for (const product of products) {
        if (product.blips && product.blips.length > 0) {
          for (const blip of product.blips) {
            if (blip.comments && blip.comments.length > 0) {
              const formattedComments = blip.comments.map(comment => ({
                ...comment.toObject(),
                type: 'blip',
                source: {
                  type: 'blip',
                  id: blip._id,
                  name: `${product.name} - Blip`,
                  image: blip.thumbnail || blip.url
                }
              }));
              blipComments.push(...formattedComments);
            }
          }
        }
      }
    }

    // Combine all reviews
    let allReviews = [
      ...productReviews,
      ...blipComments,
      ...postComments,
      ...storeReviews
    ];

    // Sort reviews
    switch (sortBy) {
      case 'oldest':
        allReviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'rating':
        allReviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default: // newest
        allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Calculate stats
    const stats = {
      averageRating: calculateAverageRating(allReviews),
      totalReviews: allReviews.length,
      reviewsByType: {
        product: productReviews.length,
        blip: blipComments.length,
        post: postComments.length,
        store: storeReviews.length
      }
    };

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReviews = allReviews.slice(startIndex, endIndex);

    res.json({
      reviews: paginatedReviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allReviews.length / limit),
        totalReviews: allReviews.length
      },
      stats
    });

  } catch (error) {
    console.error('Error in getAllReviews:', error);
    res.status(500).json({
      message: 'Failed to retrieve reviews',
      error: error.message
    });
  }
};

// Helper function to calculate average rating
function calculateAverageRating(reviews) {
  const ratedReviews = reviews.filter(review => review.rating);
  if (ratedReviews.length === 0) return 0;
  
  const sum = ratedReviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / ratedReviews.length).toFixed(1);
}

// Follow a buyer
exports.followBuyer = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { buyerId } = req.params;

    const [buyer, seller] = await Promise.all([
      Buyer.findById(buyerId),
      Seller.findById(sellerId)
    ]);

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Initialize followers array if it doesn't exist
    if (!buyer.followers) {
      buyer.followers = [];
    }

    // Check if already following
    const isAlreadyFollowing = buyer.followers.some(
      follower => follower.sellerId && follower.sellerId.toString() === sellerId
    );

    if (isAlreadyFollowing) {
      return res.status(400).json({ message: 'Already following this buyer' });
    }

    // Add to buyer's followers list
    buyer.followers.push({
      sellerId: seller._id,
      storeName: seller.storeName,
      businessName: seller.businessName,
      followDate: new Date(),
      lastInteraction: new Date()
    });

    await buyer.save();

    // Create notification for buyer using createBuyerNotification
    await notificationController.createBuyerNotification(
      buyerId,
      'new_follower',
      {
        sellerId: seller._id,
        sellerName: seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`,
        followDate: new Date()
      }
    );

    res.json({
      message: 'Successfully followed buyer',
      followData: buyer.followers[buyer.followers.length - 1]
    });
  } catch (error) {
    console.error('Follow buyer error:', error);
    res.status(500).json({
      message: 'Failed to follow buyer',
      error: error.message
    });
  }
};

// Unfollow a buyer
exports.unfollowBuyer = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { buyerId } = req.params;

    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Remove from followers list
    buyer.followers = buyer.followers.filter(
      follower => follower.sellerId.toString() !== sellerId
    );

    await buyer.save();

    res.json({ message: 'Successfully unfollowed buyer' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to unfollow buyer',
      error: error.message
    });
  }
};

// Get list of buyers that the seller follows
exports.getFollowedBuyers = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const buyers = await Buyer.find({
      'followers.sellerId': sellerId
    }).select('firstName lastName email followers');

    const followedBuyers = buyers.map(buyer => {
      const followerData = buyer.followers.find(f => f.sellerId.toString() === sellerId);
      return {
        buyerId: buyer._id,
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        email: buyer.email,
        followDate: followerData.followDate,
        lastInteraction: followerData.lastInteraction
      };
    });

    res.json(followedBuyers);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get followed buyers',
      error: error.message
    });
  }
};

// Get seller's transactions
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const sellerId = req.user.id;

    // Get seller for wallet balance
    const seller = await Seller.findById(sellerId).select('walletBalance');
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Get total count for pagination
    const totalTransactions = await Transaction.countDocuments({ seller: sellerId });
    const totalPages = Math.ceil(totalTransactions / limit);

    // Get transactions with order details
    const transactions = await Transaction.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'orderId',
        select: 'items totalAmount order_id',
        populate: {
          path: 'items.product',
          select: 'name category'
        }
      });

    // Process transactions to include detailed information
    const processedTransactions = await Promise.all(transactions.map(async (transaction) => {
      const orderDetails = transaction.orderId ? {
        items: transaction.orderId.items.map(item => ({
          productName: item.product?.name || 'Product Unavailable',
          quantity: item.quantity,
          price: item.price,
          category: item.product?.category,
          platformFee: transaction.metadata?.categoryFee || 0
        })),
        totalAmount: transaction.orderId.totalAmount
      } : null;

      let description = transaction.description;
      let platformFee = 0;
      let processingFee = 0;
      let netAmount = transaction.amount;
      let deductions = 0;

      switch (transaction.type) {
        case 'platform_fee':
          const categoryFee = transaction.metadata?.categoryFee || 0;
          const categoryName = transaction.metadata?.categoryName || 'Unknown';
          description = `Platform fee for order #${transaction.orderId?.order_id} (${categoryFee}% for ${categoryName})`;
          deductions = transaction.amount;
          netAmount = -transaction.amount;
          break;

        case 'processing_fee':
          description = `Payment processing fee for order #${transaction.orderId?.order_id} (1.5%)`;
          deductions = transaction.amount;
          netAmount = -transaction.amount;
          break;

        case 'order_payment':
          // Get associated fees for this order
          const relatedFees = await Transaction.find({
            orderId: transaction.orderId?._id,
            seller: transaction.seller,
            type: { $in: ['platform_fee', 'processing_fee'] }
          });

          // Calculate fees
          platformFee = relatedFees
            .filter(fee => fee.type === 'platform_fee')
            .reduce((sum, fee) => sum + fee.amount, 0);

          processingFee = relatedFees
            .filter(fee => fee.type === 'processing_fee')
            .reduce((sum, fee) => sum + fee.amount, 0);

          deductions = platformFee + processingFee;
          netAmount = transaction.amount - deductions;
          
          description = `Payment received for order #${transaction.orderId?.order_id} (${transaction.amount.toLocaleString()} - ${deductions.toLocaleString()} in fees = ${netAmount.toLocaleString()})`;
          break;

        case 'withdrawal':
          netAmount = -transaction.amount;
          break;
      }

      return {
        _id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        deductions,
        netAmount,
        orderId: transaction.orderId?.order_id,
        description,
        status: transaction.status,
        createdAt: transaction.createdAt,
        orderDetails,
        metadata: transaction.metadata,
        breakdown: transaction.type === 'order_payment' ? {
          grossAmount: transaction.amount,
          platformFee,
          processingFee,
          totalDeductions: deductions,
          netAmount
        } : null
      };
    }));



    // Calculate summary with more detailed breakdown
    const summary = await calculateTransactionSummary(sellerId);

    res.json({
      transactions: processedTransactions,
      summary: {
        ...summary,
        currentBalance: seller.walletBalance,
        breakdown: {
          grossEarnings: summary.totalEarnings,
          platformFees: summary.totalPlatformFees,
          processingFees: summary.totalProcessingFees,
          totalDeductions: summary.totalPlatformFees + summary.totalProcessingFees,
          netEarnings: summary.totalEarnings - (summary.totalPlatformFees + summary.totalProcessingFees),
          totalWithdrawals: summary.totalWithdrawals
        }
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTransactions
      }
    });

  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ message: 'Failed to get transactions', error: error.message });
  }
};


// Validate time format (HH:mm)
const isValidTimeFormat = (time) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

async function calculateTransactionSummary(sellerId) {
  const [orderPayments, platformFees, processingFees, withdrawals] = await Promise.all([
    Transaction.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId), type: 'order_payment' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId), type: 'platform_fee' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId), type: 'processing_fee' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId), type: 'withdrawal' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  return {
    totalEarnings: orderPayments[0]?.total || 0,
    totalPlatformFees: platformFees[0]?.total || 0,
    totalProcessingFees: processingFees[0]?.total || 0,
    totalWithdrawals: withdrawals[0]?.total || 0
  };
}

// Update operating hours
exports.updateOperatingHours = async (req, res) => {
  try {
    const { operatingHours, timezone } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Validate time formats
    for (const day in operatingHours) {
      const { openTime, closeTime, isOpen } = operatingHours[day];
      
      if (isOpen && (!isValidTimeFormat(openTime) || !isValidTimeFormat(closeTime))) {
        return res.status(400).json({ 
          message: `Invalid time format for ${day}. Use HH:mm format (e.g., 09:00)` 
        });
      }
    }

    seller.operatingHours = operatingHours;
    if (timezone) seller.timezone = timezone;

    await seller.save();

    res.json({ 
      message: 'Operating hours updated successfully', 
      operatingHours: seller.operatingHours,
      timezone: seller.timezone 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update operating hours', 
      error: error.message 
    });
  }
};

// Add special dates
exports.addSpecialDates = async (req, res) => {
  try {
    const { specialDates } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Validate dates and times
    for (const dateInfo of specialDates) {
      const { date, isOpen, openTime, closeTime } = dateInfo;
      
      if (!date || typeof isOpen !== 'boolean') {
        return res.status(400).json({ 
          message: 'Each special date must include a valid date and isOpen status' 
        });
      }

      if (isOpen && openTime && closeTime) {
        if (!isValidTimeFormat(openTime) || !isValidTimeFormat(closeTime)) {
          return res.status(400).json({ 
            message: 'Invalid time format. Use HH:mm format (e.g., 09:00)' 
          });
        }
      }
    }

    // Add new special dates
    seller.specialDates = [
      ...seller.specialDates,
      ...specialDates.map(date => ({
        ...date,
        date: new Date(date.date)
      }))
    ];

    // Sort special dates by date
    seller.specialDates.sort((a, b) => a.date - b.date);

    await seller.save()

    res.json({ 
      message: 'Special dates added successfully', 
      specialDates: seller.specialDates 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to add special dates', 
      error: error.message 
    });
  }
};

// Update store policy
exports.updateStorePolicy = async (req, res) => {
  try {
    const { 
      deliveryTimes,
      freeShippingPolicy,
      lostOrDamagedPolicy,
      refundPolicy,
      processingTime,
      refundMethod,
      nonRefundableItems,
      returnWindow,
      returnCondition,
      returnShipping,
      exchangePolicy,
      allowsCod
    } = req.body;

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.storePolicy = {
      deliveryTimes,
      freeShippingPolicy,
      lostOrDamagedPolicy,
      refundPolicy,
      processingTime,
      refundMethod,
      nonRefundableItems,
      returnWindow,
      returnCondition,
      returnShipping,
      exchangePolicy,
      allowsCod
    };

    const updatedSeller = await seller.save();
    res.json({ message: 'Store policy updated successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update store policy', error: error.message });
  }
};

/**
 * Toggle store pickup availability
 * @route PUT /api/seller/store-pickup
 * @access Private
 */
exports.toggleStorePickup = async (req, res) => {
  try {
    const { offersStorePickup } = req.body;

    if (typeof offersStorePickup !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'offersStorePickup must be a boolean value'
      });
    }

    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.offersStorePickup = offersStorePickup;
    await seller.save();

    return res.status(200).json({
      success: true,
      message: 'Store pickup setting updated successfully',
      offersStorePickup: seller.offersStorePickup
    });
  } catch (error) {
    console.error('Toggle store pickup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update store pickup setting',
      error: error.message
    });
  }
};

/**
 * Update seller's social media information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateSocialMedia = async (req, res) => {
  try {
    const { instagram, facebook, tiktok } = req.body;
    const sellerId = req.user.id;

    // Find the seller
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Update social media information
    seller.socialMedia = {
      instagram: instagram || seller.socialMedia?.instagram,
      facebook: facebook || seller.socialMedia?.facebook,
      tiktok: tiktok || seller.socialMedia?.tiktok
    };

    // Save the updated seller
    await seller.save();

    res.status(200).json({
      message: 'Social media information updated successfully',
      socialMedia: seller.socialMedia
    });
  } catch (error) {
    console.error('Error updating social media information:', error);
    res.status(500).json({ message: 'Error updating social media information', error: error.message });
  }
};

/**
 * Get all product reviews for a seller
 * @route GET /api/seller/:sellerId/product-reviews
 * @access Public
 */
exports.getAllProductReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    
    // Verify sellerId is valid and get seller information
    const Seller = require('../models/Seller');
    const seller = await Seller.findById(sellerId).select('firstName lastName businessName storeName storeAvatar');
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    // Get seller display information
    const sellerInfo = {
      _id: seller._id,
      name: seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`,
      avatar: seller.storeAvatar?.url || null
    };
    
    // Find all products by this seller
    const Product = require('../models/Product');
    
    // Get all products with reviews by this seller
    const products = await Product.find({ 
      seller: sellerId,
      'reviews.0': { $exists: true } // Only get products that have at least one review
    }).select('name price description images reviews');
    
    // Extract all reviews from all products with product info
    let allReviews = [];
    products.forEach(product => {
      const productInfo = {
        _id: product._id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.images && product.images.length > 0 ? product.images[0].url : null
      };
      
      product.reviews.forEach(review => {
        // Add enhanced reply with seller info
        const enhancedReply = review.reply ? {
          ...review.reply.toObject(),
          seller: sellerInfo
        } : null;
        
        allReviews.push({
          reviewId: review._id,
          product: productInfo,
          buyer: {
            _id: review.buyer,
            firstName: review.firstName,
            lastName: review.lastName
          },
          rating: review.rating,
          title: review.title, 
          comment: review.comment,
          images: review.images,
          createdAt: review.createdAt,
          reply: enhancedReply
        });
      });
    });
    
    // Apply sorting
    if (sort === 'recent') {
      allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'rating-high') {
      allReviews.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'rating-low') {
      allReviews.sort((a, b) => a.rating - b.rating);
    } else if (sort === 'replied') {
      allReviews.sort((a, b) => (b.reply?.content ? 1 : 0) - (a.reply?.content ? 1 : 0));
    } else if (sort === 'unreplied') {
      allReviews.sort((a, b) => (a.reply?.content ? 1 : 0) - (b.reply?.content ? 1 : 0));
    }
    
    // Apply pagination
    const totalReviews = allReviews.length;
    const totalPages = Math.ceil(totalReviews / limitNumber);
    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = pageNumber * limitNumber;
    const paginatedReviews = allReviews.slice(startIndex, endIndex);
    
    // Calculate stats
    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
      : 0;
    
    const ratingDistribution = {
      1: allReviews.filter(review => review.rating === 1).length,
      2: allReviews.filter(review => review.rating === 2).length,
      3: allReviews.filter(review => review.rating === 3).length,
      4: allReviews.filter(review => review.rating === 4).length,
      5: allReviews.filter(review => review.rating === 5).length
    };
    
    const repliedCount = allReviews.filter(review => review.reply && review.reply.content).length;
    
    res.json({
      sellerId,
      sellerInfo,
      reviews: paginatedReviews,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalReviews,
        hasMore: endIndex < totalReviews
      },
      stats: {
        averageRating,
        ratingDistribution,
        totalReviews,
        repliedCount,
        unrepliedCount: totalReviews - repliedCount
      }
    });
  } catch (error) {
    console.error('Error in getAllProductReviews:', error);
    res.status(500).json({ message: 'Failed to retrieve product reviews', error: error.message });
  }
};

/**
 * Get details of a specific review for a seller's product
 * @route GET /api/seller/product/:productId/review/:reviewId
 * @access Private (Seller only)
 */
exports.getSellerProductReviewDetails = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const sellerId = req.user.id;
    
    // Find the product and verify it belongs to this seller
    const Product = require('../models/Product');
    const product = await Product.findOne({ 
      _id: productId, 
      seller: sellerId 
    }).select('name price description images reviews seller');
    
    if (!product) {
      return res.status(404).json({ 
        message: 'Product not found or does not belong to you' 
      });
    }
    
    // Find the specific review
    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Get buyer details
    const Buyer = require('../models/Buyer');
    const buyer = await Buyer.findById(review.buyer)
      .select('firstName lastName profileImage');
    
    // Get seller details
    const Seller = require('../models/Seller');
    const seller = await Seller.findById(sellerId)
      .select('firstName lastName businessName storeName storeAvatar');
    
    const sellerInfo = {
      _id: seller._id,
      name: seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`,
      avatar: seller.storeAvatar?.url || null
    };
    
    // Format the response
    const reviewDetails = {
      reviewId: review._id,
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.images && product.images.length > 0 ? product.images[0].url : null
      },
      buyer: {
        _id: buyer?._id || review.buyer,
        firstName: buyer?.firstName || review.firstName || 'Anonymous',
        lastName: buyer?.lastName || review.lastName || 'User',
        profileImage: buyer?.profileImage?.url || null
      },
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images || [],
      purchasedVariant: review.purchasedVariant || {},
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      reply: review.reply ? {
        ...review.reply.toObject(),
        seller: sellerInfo
      } : null
    };
    
    res.json(reviewDetails);
  } catch (error) {
    console.error('Error in getSellerProductReviewDetails:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve review details', 
      error: error.message 
    });
  }
};

/**
 * Get details of a specific review for a product (public access)
 * @route GET /api/seller/public/product/:productId/review/:reviewId
 * @access Public
 */
exports.getPublicProductReviewDetails = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    
    // Find the product
    const Product = require('../models/Product');
    const product = await Product.findById(productId)
      .select('name price description images reviews seller');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Find the specific review
    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Get buyer details
    const Buyer = require('../models/Buyer');
    const buyer = await Buyer.findById(review.buyer)
      .select('firstName lastName profileImage');
    
    // Get seller details
    const Seller = require('../models/Seller');
    const seller = await Seller.findById(product.seller)
      .select('firstName lastName businessName storeName storeAvatar');
    
    const sellerInfo = {
      _id: seller._id,
      name: seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`,
      avatar: seller.storeAvatar?.url || null
    };
    
    // Format the response
    const reviewDetails = {
      reviewId: review._id,
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.images && product.images.length > 0 ? product.images[0].url : null
      },
      buyer: {
        _id: buyer?._id || review.buyer,
        firstName: buyer?.firstName || review.firstName || 'Anonymous',
        lastName: buyer?.lastName || review.lastName || 'User',
        profileImage: buyer?.profileImage?.url || null
      },
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images || [],
      purchasedVariant: review.purchasedVariant || {},
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      reply: review.reply ? {
        ...review.reply.toObject(),
        seller: sellerInfo
      } : null
    };
    
    res.json(reviewDetails);
  } catch (error) {
    console.error('Error in getPublicProductReviewDetails:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve review details', 
      error: error.message 
    });
  }
};

// Function to search sellers based on various criteria
exports.searchSellers = async (req, res) => {
  try {
    const { 
      query = '', 
      country, 
      category,
      page = 1, 
      limit = 10 
    } = req.query;

    console.log('Search Sellers - Auth Info:', { 
      userId: req.user?.id, 
      userRole: req.user?.role,
      isAuthenticated: !!req.user 
    });

    // Build search query
    const searchQuery = {
      isDisabled: false, // Only return active sellers
      isVerified: true,  // Only return verified sellers
    };

    // Search by name (first name, last name), business name, or store name
    if (query) {
      searchQuery.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { businessName: { $regex: query, $options: 'i' } },
        { storeName: { $regex: query, $options: 'i' } },
      ];
    }

    // Filter by country if provided
    if (country) {
      searchQuery.$or = [
        { 'sellerAddress.country': country },
        { 'businessAddress.country': country },
        { 'warehouseDetails.address.country': country }
      ];
    }

    // Filter by category if provided
    if (category) {
      searchQuery['categories.name'] = category;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if the user is authenticated (buyer) to determine if following
    const buyerId = req.user?.id;
    const isBuyer = req.user?.role === 'Buyer';
    
    console.log('Buyer authentication check:', { buyerId, isBuyer });

    // Find sellers matching criteria
    const sellers = await Seller.find(searchQuery)
      .select('firstName lastName businessName storeName storeAvatar socialMedia aboutStore businessAddress sellerAddress warehouseDetails.address categories followers')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log(`Found ${sellers.length} sellers matching criteria`);

    // Get total count for pagination
    const totalSellers = await Seller.countDocuments(searchQuery);
    
    // Get buyer document if authenticated
    let buyer = null;
    if (isBuyer && buyerId) {
      const Buyer = require('../models/Buyer');
      buyer = await Buyer.findById(buyerId).select('followers').lean();
      console.log('Buyer followers found:', buyer?.followers?.length || 0);
    }

    // Process sellers to add isFollowing property if user is authenticated
    const processedSellers = sellers.map(seller => {
      // Create a clean seller object with only necessary information
      const cleanSeller = {
        _id: seller._id,
        businessName: seller.businessName,
        storeName: seller.storeName,
        storeAvatar: seller.storeAvatar?.url || null,
        followerCount: seller.followers?.length || 0,
        // Default isFollowing to false
        isFollowing: false
      };

      // Update isFollowing if user is authenticated as a buyer
      if (isBuyer && buyerId && buyer) {
        const sellerId = seller._id.toString();
        
        // Method 1: Check if buyer is in seller's followers list
        let isFollowing = false;
        
        if (Array.isArray(seller.followers)) {
          isFollowing = seller.followers.some(follower => 
            follower.buyerId && follower.buyerId.toString() === buyerId
          );
          console.log(`Method 1 - Seller followers check for buyer ${buyerId}: ${isFollowing}`);
        }
        
        // Method 2: If not found, check if seller is in buyer's followed list
        if (!isFollowing && Array.isArray(buyer.followers)) {
          isFollowing = buyer.followers.some(followed => 
            followed.sellerId && followed.sellerId.toString() === sellerId
          );
          console.log(`Method 2 - Buyer followed check for seller ${sellerId}: ${isFollowing}`);
        }
        
        cleanSeller.isFollowing = isFollowing;
        console.log(`Final isFollowing for seller ${sellerId}: ${isFollowing}`);
      }

      return cleanSeller;
    });

    res.status(200).json({
      success: true,
      sellers: processedSellers,
      pagination: {
        total: totalSellers,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalSellers / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search sellers',
      error: error.message
    });
  }
};

/**
 * @desc   Toggle seller account pending status
 * @route  PUT /api/seller/account-pending
 * @access Private
 */
exports.toggleAccountPending = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (typeof status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Status must be a boolean value (true or false)'
      });
    }

    const seller = await Seller.findById(req.user.id);
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    seller.accountPending = status;
    await seller.save();

    // Send email notification to admin if seller has completed onboarding (status = true)
    if (status === true) {
      try {
        const adminMsg = {
          to: 'admin@auqli.com',
          from: 'Auqli Notifications <support@auqli.com>',
          subject: `Seller Onboarding Completed - ${seller.storeName || seller.firstName + ' ' + seller.lastName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>New Seller Onboarding Completed</h2>
              <p>A seller has just completed their onboarding process and is ready for review.</p>
              <p><strong>Seller Details:</strong></p>
              <ul>
                <li>Name: ${seller.firstName} ${seller.lastName}</li>
                <li>Store Name: ${seller.storeName || 'N/A'}</li>
                <li>Email: ${seller.email}</li>
                <li>Phone: ${seller.phoneNumber}</li>
                <li>Account Type: ${seller.accountType || 'N/A'}</li>
                <li>Business Name: ${seller.businessName || 'N/A'}</li>
              </ul>
              <p>Please review this account at your earliest convenience.</p>
              <p>Best regards,<br>Auqli Team</p>
            </div>
          `
        };
        
        await sgMail.send(adminMsg);
        console.log(`Onboarding completion notification email sent to admin for seller: ${seller._id}`);
      } catch (emailError) {
        console.error('Error sending onboarding notification email:', emailError);
        // Continue execution despite email error - don't block the API response
      }
    }

    return res.status(200).json({
      success: true,
      message: `Account pending status updated to ${status}`,
      accountPending: seller.accountPending
    });
  } catch (error) {
    console.error('Toggle account pending error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update account pending status',
      error: error.message
    });
  }
};

