const Admin = require('../models/Admin');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Category = require('../models/Category');
const MajorCategory = require('../models/MajorCategory');
const Banner = require('../models/Banner');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const Order = require('../models/Order');
const Announcement = require('../models/Annoucement');
const Withdrawal = require('../models/Withdrawal');
const Resource = require('../models/Resource');
const Transaction = require('../models/Transaction');
const BankChangeRequest = require('../models/BankChangeRequest');
const Stream = require('../models/Stream');
const Post = require('../models/Post');
const Campaign = require('../models/Campaign');
const Conversation = require('../models/Conversation');
const PlatformNotification = require('../models/PlatformNotification');
const { Expo } = require('expo-server-sdk');
const axios = require('axios');
const { createSafeAutomaticWithdrawal, getWithdrawalSafetyReport, sendNoBankDetailsEmails } = require('../utils/withdrawalSafety');

const sgMail = require('@sendgrid/mail');
const mongoose = require('mongoose');

// Initialize Expo SDK client
const expo = new Expo();

// Update Paystack configuration with logging
const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Add request interceptor with logging
paystack.interceptors.request.use((config) => {
  console.log('Paystack Request Config:', {
    url: config.url,
    method: config.method,
    authHeader: config.headers.Authorization?.substring(0, 15) + '...',
    baseURL: config.baseURL
  });

  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.error('Paystack Secret Key is missing');
    throw new Error('Invalid Paystack configuration: Key missing');
  }

  if (process.env.PAYSTACK_SECRET_KEY === 'scret') {
    console.error('Paystack Secret Key is set to default value');
    throw new Error('Invalid Paystack configuration: Default key detected');
  }

  return config;
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const { s3 } = require('../config/awsConfig');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../utils/emailService');
const termiiEmailService = require('../services/termiiEmailService');
const { sendAdminLoginNotificationEmail } = emailService;
const rateLimit = require('express-rate-limit');

// Create a map to track failed login attempts
const loginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the email is in the allowed list (this is also validated in the model)
    const ALLOWED_EMAILS = [
      'bolu@auqli.com',
      'support@auqli.com',
      'joseph@auqli.com',
      'paul@auqli.com',
      'matt@auqli.com',
      'melissa@auqli.com',
      'alex@commercejet.com',
      'matt@auqli.com'
    ];

    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'This email is not authorized to register as an admin.'
      });
    }

    // Check if admin with this email or username already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'An admin with this email or username already exists.'
      });
    }

    // Strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.'
      });
    }

    // Create and save the new admin
    const newAdmin = new Admin({
      username,
      email: email.toLowerCase(),
      password
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully!'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};


exports.login = async (req, res) => {
  const { username, password } = req.body || {};
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';

  try {
    // Basic input validation to prevent NoSQL injection via crafted JSON
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Reject suspicious values containing $ or dots which can be used in NoSQL operator injection
    const suspiciousPattern = /[$.]/;
    if (suspiciousPattern.test(username)) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if the IP is currently locked out
    const ipKey = `ip_${clientIP}`;
    const ipAttempts = loginAttempts.get(ipKey) || { count: 0, lockUntil: 0 };

    if (ipAttempts.lockUntil > Date.now()) {
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Please try again after ${Math.ceil((ipAttempts.lockUntil - Date.now()) / 60000)} minutes.`
      });
    }

    // Find the admin by username or email
    const normalizedUsername = username.trim();
    const normalizedEmail = normalizedUsername.toLowerCase();
    const admin = await Admin.findOne({
      $or: [
        { username: normalizedUsername },
        { email: normalizedEmail } // Allow login with email too
      ]
    });

    // If admin not found or password doesn't match
    if (!admin || !(await admin.comparePassword(password))) {
      // Update failed attempts for this IP
      ipAttempts.count += 1;

      if (ipAttempts.count >= MAX_FAILED_ATTEMPTS) {
        ipAttempts.lockUntil = Date.now() + LOCKOUT_TIME;
        loginAttempts.set(ipKey, ipAttempts);

        return res.status(429).json({
          success: false,
          message: `Too many failed login attempts. Your IP has been temporarily locked for ${LOCKOUT_TIME / 60000} minutes.`
        });
      }

      loginAttempts.set(ipKey, ipAttempts);

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        attemptsLeft: MAX_FAILED_ATTEMPTS - ipAttempts.count
      });
    }

    // Reset login attempts on successful login
    loginAttempts.delete(ipKey);

    // Update last login timestamp
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token with shorter expiration for security
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Prepare login notification metadata
    const loginMetadata = {
      ip: clientIP,
      userAgent: userAgent,
      timestamp: new Date()
    };

    console.log('Admin login successful for:', admin.username);
    console.log('SENDGRID_API_KEY configured:', !!process.env.SENDGRID_API_KEY);

    // Send the notification email asynchronously 
    try {
      console.log(`Attempting to send login notification to admin: ${admin.email}`);

      // This is now a fire-and-forget operation, don't await it
      sendAdminLoginNotificationEmail(admin.email, admin.username, loginMetadata)
        .then(success => {
          if (success) {
            console.log(`Login notification email successfully sent to ${admin.email}`);
          } else {
            console.error(`Could not send login notification email to ${admin.email}`);
          }
        })
        .catch(err => {
          console.error(`Error in login notification email promise:`, err);
        });
    } catch (emailError) {
      console.error('Exception when attempting to send login notification:', emailError);
      // Still continue with login process even if email fails
    }

    // Return success response
    res.json({
      success: true,
      token,
      username: admin.username,
      email: admin.email
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      error: error.message
    });
  }
};



exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    // Extract pagination parameters from query with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter object based on query parameters
    const filter = {};

    // Filter by name or email
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Filter by account status
    if (req.query.isDisabled !== undefined) {
      filter.isDisabled = req.query.isDisabled === 'true';
    }

    // Filter by verification status
    if (req.query.isVerified !== undefined) {
      filter.isVerified = req.query.isVerified === 'true';
    }

    // Filter by country
    if (req.query.country) {
      filter['address.country'] = { $regex: req.query.country, $options: 'i' };
    }

    // Determine sort options
    let sortOptions = { createdAt: -1 }; // Default: newest first

    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case 'name_asc':
          sortOptions = { firstName: 1, lastName: 1 };
          break;
        case 'name_desc':
          sortOptions = { firstName: -1, lastName: -1 };
          break;
        case 'oldest':
          sortOptions = { createdAt: 1 };
          break;
        case 'email':
          sortOptions = { email: 1 };
          break;
        default:
          sortOptions = { createdAt: -1 };
      }
    }

    // Count total number of users for pagination metadata
    const totalUsers = await Buyer.countDocuments(filter);

    // Get paginated users
    const users = await Buyer.find(filter)
      .select('-password -refreshToken')
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    // Return paginated response
    res.json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      usersPerPage: limit,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

exports.getAllSellers = async (req, res) => {
  try {
    // Extract pagination parameters from query with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter object based on query parameters
    const filter = {};

    // Filter by name (first name, last name), business name, or store name
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { businessName: { $regex: req.query.search, $options: 'i' } },
        { storeName: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Filter by verification status
    if (req.query.isVerified !== undefined) {
      filter.isVerified = req.query.isVerified === 'true';
    }

    // Filter by account status
    if (req.query.isDisabled !== undefined) {
      filter.isDisabled = req.query.isDisabled === 'true';
    }

    // Filter by country
    if (req.query.country) {
      filter.$or = [
        { 'sellerAddress.country': req.query.country },
        { 'businessAddress.country': req.query.country },
        { 'warehouseDetails.address.country': req.query.country }
      ];
    }

    // Filter by category
    if (req.query.category) {
      filter['categories.name'] = req.query.category;
    }

    // Determine sort options
    let sortOptions = { createdAt: -1 }; // Default: newest first

    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case 'name_asc':
          sortOptions = { firstName: 1, lastName: 1 };
          break;
        case 'name_desc':
          sortOptions = { firstName: -1, lastName: -1 };
          break;
        case 'oldest':
          sortOptions = { createdAt: 1 };
          break;
        case 'business_name':
          sortOptions = { businessName: 1 };
          break;
        case 'store_name':
          sortOptions = { storeName: 1 };
          break;
        default:
          sortOptions = { createdAt: -1 }; // newest first
      }
    }

    // Count total number of sellers for pagination metadata
    const totalSellers = await Seller.countDocuments(filter);

    // Get paginated sellers
    const sellers = await Seller.find(filter)
      .select('-password -refreshToken')
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    // Get product counts for each seller
    const Product = mongoose.model('Product');
    const sellersWithProductCount = await Promise.all(
      sellers.map(async (seller) => {
        const productCount = await Product.countDocuments({ seller: seller._id });
        const sellerObj = seller.toObject();
        sellerObj.productCount = productCount;
        return sellerObj;
      })
    );

    // Return paginated response
    res.json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalSellers / limit),
      totalSellers,
      sellersPerPage: limit,
      sellers: sellersWithProductCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sellers',
      error: error.message
    });
  }
};

exports.disableSeller = async (req, res) => {
  const { sellerId } = req.params;

  try {
    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      { isDisabled: true },
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Set all seller products to draft status
    let productStatusUpdate = null;
    try {
      const Product = require('../models/Product');
      const productUpdateResult = await Product.updateMany(
        { seller: sellerId, status: { $in: ['active', 'offline_auction'] } },
        { $set: { status: 'draft' } }
      );

      productStatusUpdate = {
        productsUpdated: productUpdateResult.modifiedCount,
        status: 'success'
      };

      console.log(`📦 Set ${productUpdateResult.modifiedCount} products to draft status for disabled seller ${seller.email}`);
    } catch (productError) {
      console.error(`❌ Error setting products to draft for seller ${seller.email}:`, productError);
      productStatusUpdate = {
        productsUpdated: 0,
        status: 'error',
        error: productError.message
      };
      // Don't fail the entire operation if product update fails
    }

    // Check if seller has wallet balance and create automatic withdrawal request safely
    let automaticWithdrawal = null;
    let withdrawalSafetyReport = null;

    if (seller.walletBalance > 0) {
      try {
        // Get comprehensive withdrawal safety report
        withdrawalSafetyReport = await getWithdrawalSafetyReport(seller._id);

        console.log(`Withdrawal safety report for ${seller.email}:`, {
          canWithdraw: withdrawalSafetyReport.withdrawalCalculation.canWithdraw,
          availableBalance: withdrawalSafetyReport.withdrawalCalculation.availableBalance,
          existingWithdrawals: withdrawalSafetyReport.existingWithdrawals.count,
          bankDetailsValid: withdrawalSafetyReport.bankDetails.isValid
        });

        // Only create withdrawal if it's safe to do so
        if (withdrawalSafetyReport.recommendations.shouldCreateWithdrawal) {
          const withdrawalResult = await createSafeAutomaticWithdrawal(
            seller._id,
            seller.bankDetails,
            'Automatic withdrawal request created due to account being disabled by admin'
          );

          if (withdrawalResult.success) {
            automaticWithdrawal = withdrawalResult.withdrawal;

            // Send email notification about automatic withdrawal
            const withdrawalEmailMsg = {
              to: seller.email,
              from: 'Auqli Admin <support@auqli.com>',
              subject: 'Automatic Withdrawal Request Created - Account Disabled',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Automatic Withdrawal Request Created</h2>
                  <p>Dear ${seller.firstName},</p>
                  <p>Your Auqli seller account has been disabled, and we have automatically created a withdrawal request for your remaining wallet balance.</p>
                  <p><strong>Withdrawal Details:</strong></p>
                  <ul>
                    <li><strong>Amount:</strong> ₦${automaticWithdrawal.amount.toLocaleString()}</li>
                    <li><strong>Reference:</strong> ${automaticWithdrawal.reference}</li>
                    <li><strong>Status:</strong> Pending</li>
                    <li><strong>Bank Details:</strong> ${seller.bankDetails?.bankName || 'Not provided'} - ${seller.bankDetails?.accountNumber || 'Not provided'}</li>
                  </ul>
                  <p>This withdrawal will be processed according to our standard withdrawal procedures. You will receive another email once the withdrawal is completed.</p>
                  <p>If you have any questions about this withdrawal, please contact our support team at support@auqli.com</p>
                  <p>Best regards,<br>Auqli Finance Team</p>
                </div>
              `
            };

            // Send emails asynchronously (non-blocking)
            sgMail.send(withdrawalEmailMsg).catch(emailError => {
              console.error(`❌ Error sending withdrawal email to ${seller.email}:`, emailError);
            });

            // Also send notification to admin about the automatic withdrawal
            const adminNotificationMsg = {
              to: 'support@auqli.com',
              from: 'Auqli System <support@auqli.com>',
              subject: 'Automatic Withdrawal Created for Disabled Seller',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Automatic Withdrawal Created</h2>
                  <p>A seller account has been disabled and an automatic withdrawal request has been created.</p>
                  <p><strong>Seller Details:</strong></p>
                  <ul>
                    <li><strong>Name:</strong> ${seller.firstName} ${seller.lastName}</li>
                    <li><strong>Email:</strong> ${seller.email}</li>
                    <li><strong>Business Name:</strong> ${seller.businessName || 'N/A'}</li>
                    <li><strong>Wallet Balance:</strong> ₦${seller.walletBalance.toLocaleString()}</li>
                  </ul>
                  <p><strong>Withdrawal Details:</strong></p>
                  <ul>
                    <li><strong>Amount:</strong> ₦${automaticWithdrawal.amount.toLocaleString()}</li>
                    <li><strong>Reference:</strong> ${automaticWithdrawal.reference}</li>
                    <li><strong>Bank Details:</strong> ${seller.bankDetails?.bankName || 'Not provided'} - ${seller.bankDetails?.accountNumber || 'Not provided'}</li>
                  </ul>
                  <p>Please process this withdrawal according to standard procedures.</p>
                </div>
              `
            };

            sgMail.send(adminNotificationMsg).catch(emailError => {
              console.error(`❌ Error sending admin notification email:`, emailError);
            });

            console.log(`✅ Automatic withdrawal created for disabled seller ${seller.email}: ₦${automaticWithdrawal.amount.toLocaleString()} (Ref: ${automaticWithdrawal.reference})`);
          } else if (withdrawalResult.requiresSupportContact) {
            // Handle case where seller has no bank details
            console.log(`📧 Sending no bank details emails for ${seller.email} (Balance: ₦${withdrawalResult.availableBalance.toLocaleString()})`);

            // Send no bank details emails asynchronously (non-blocking)
            sendNoBankDetailsEmails(
              withdrawalResult.seller,
              withdrawalResult.availableBalance,
              'Account disabled by admin'
            ).then(() => {
              console.log(`✅ No bank details emails sent for ${seller.email}`);
            }).catch(emailError => {
              console.error(`❌ Error sending no bank details emails for ${seller.email}:`, emailError);
            });
          } else {
            console.log(`⚠️ Automatic withdrawal skipped for ${seller.email}: ${withdrawalResult.reason}`);
            console.log(`   Details:`, withdrawalResult.details);
          }
        } else {
          console.log(`⚠️ Automatic withdrawal skipped for ${seller.email}: ${withdrawalSafetyReport.recommendations.reason}`);
          console.log(`   Safety report:`, {
            canWithdraw: withdrawalSafetyReport.withdrawalCalculation.canWithdraw,
            existingWithdrawals: withdrawalSafetyReport.existingWithdrawals.count,
            bankDetailsValid: withdrawalSafetyReport.bankDetails.isValid
          });

          // Send admin notification for invalid bank details case
          if (!withdrawalSafetyReport.bankDetails.isValid && withdrawalSafetyReport.withdrawalCalculation.canWithdraw) {
            const invalidBankDetailsAdminMsg = {
              to: 'bolu@auqli.com',
              from: 'Auqli System <support@auqli.com>',
              subject: `Action Required: Seller ${seller.firstName} ${seller.lastName} Has Invalid Bank Details`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>⚠️ Seller Disabled - Invalid Bank Details</h2>
                  <p>A seller account has been disabled but cannot receive automatic withdrawal due to invalid bank details.</p>
                  
                  <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">👤 Seller Information</h3>
                    <ul style="color: #495057; margin: 0; line-height: 1.6;">
                      <li><strong>Name:</strong> ${seller.firstName} ${seller.lastName}</li>
                      <li><strong>Email:</strong> ${seller.email}</li>
                      <li><strong>Business Name:</strong> ${seller.businessName || 'N/A'}</li>
                      <li><strong>Account Status:</strong> Disabled</li>
                      <li><strong>Reason:</strong> Account disabled by admin</li>
                    </ul>
                  </div>
                  
                  <div style="background-color: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #2d5a2d; margin: 0 0 15px 0; font-size: 18px;">💰 Available Balance</h3>
                    <p style="color: #2d5a2d; margin: 0; font-size: 24px; font-weight: bold;">
                      ₦${seller.walletBalance.toLocaleString()}
                    </p>
                  </div>
                  
                  <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #721c24; margin: 0 0 15px 0; font-size: 18px;">❌ Bank Details Issue</h3>
                    <p style="color: #721c24; margin: 0 0 15px 0; line-height: 1.6;">
                      The seller's bank details are invalid or incomplete.
                    </p>
                    <p style="color: #721c24; margin: 0; line-height: 1.6;">
                      <strong>Issue:</strong> ${withdrawalSafetyReport.bankDetails.message}
                    </p>
                  </div>
                  
                  <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #0c5460; margin: 0 0 15px 0; font-size: 18px;">📋 Required Action</h3>
                    <p style="color: #0c5460; margin: 0 0 15px 0; line-height: 1.6;">
                      Please contact the seller to collect valid bank details for withdrawal processing.
                    </p>
                    <ul style="color: #0c5460; margin: 0; line-height: 1.6;">
                      <li>Bank name</li>
                      <li>Account number</li>
                      <li>Account name (as it appears on bank statement)</li>
                      <li>Bank routing code or SWIFT code (if available)</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
                    <p style="color: #6c757d; margin: 0; font-size: 14px;">
                      <strong>Seller Contact:</strong> ${seller.email}<br>
                      <strong>System Generated:</strong> ${new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
              `
            };

            sgMail.send(invalidBankDetailsAdminMsg).catch(emailError => {
              console.error(`❌ Error sending invalid bank details admin notification:`, emailError);
            });

            console.log(`📧 Admin notification sent to bolu@auqli.com for invalid bank details: ${seller.email}`);
          }
        }
      } catch (withdrawalError) {
        console.error('❌ Error creating automatic withdrawal for disabled seller:', withdrawalError);
        // Don't fail the entire operation if withdrawal creation fails
      }
    }

    // Send notification emails
    const emailMsg = {
      to: seller.email,
      from: 'Auqli Admin <support@auqli.com>',
      subject: 'Important: Your Auqli Account Has Been Disabled',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Status Update</h2>
          <p>Dear ${seller.firstName},</p>
          <p>Your Auqli seller account has been temporarily disabled. This may be due to:</p>
          <ul>
            <li>Violation of our terms of service</li>
            <li>Suspicious activity detected</li>
            <li>Multiple customer complaints</li>
            <li>Non-compliance with seller policies</li>
          </ul>
          ${automaticWithdrawal ? `<p><strong>Note:</strong> An automatic withdrawal request has been created for your remaining wallet balance (₦${seller.walletBalance.toLocaleString()}). You will receive a separate email with withdrawal details.</p>` : ''}
          <p>If you believe this is an error or would like to appeal this decision, please contact our support team at support@auqli.com</p>
          <p>Best regards,<br>Auqli Trust & Safety Team</p>
        </div>
      `
    };

    // Send to business email if it exists
    if (seller.businessEmail) {
      const businessEmailMsg = {
        to: seller.businessEmail,
        from: 'Auqli Admin <support@auqli.com>',
        subject: 'Important: Business Account Status Update - Auqli',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Business Account Disabled</h2>
            <p>Dear ${seller.businessName || seller.firstName},</p>
            <p>This is to inform you that your business account on Auqli has been disabled.</p>
            <p>While your account is disabled:</p>
            <ul>
              <li>Your products will not be visible in the marketplace</li>
              <li>You cannot process new orders</li>
              <li>Access to seller dashboard is restricted</li>
            </ul>
            ${automaticWithdrawal ? `<p><strong>Note:</strong> An automatic withdrawal request has been created for your remaining wallet balance (₦${seller.walletBalance.toLocaleString()}). You will receive a separate email with withdrawal details.</p>` : ''}
            <p>For immediate assistance or to appeal this decision, please contact our business support team.</p>
            <p>Best regards,<br>Auqli Business Support Team</p>
          </div>
        `
      };
      await sgMail.send(businessEmailMsg);
    }

    await sgMail.send(emailMsg);

    res.json({
      success: true,
      message: 'Seller account disabled successfully',
      seller,
      productStatusUpdate,
      automaticWithdrawal: automaticWithdrawal ? {
        reference: automaticWithdrawal.reference,
        amount: automaticWithdrawal.amount,
        status: automaticWithdrawal.status
      } : null,
      withdrawalSafety: withdrawalSafetyReport ? {
        canWithdraw: withdrawalSafetyReport.withdrawalCalculation.canWithdraw,
        availableBalance: withdrawalSafetyReport.withdrawalCalculation.availableBalance,
        existingWithdrawals: withdrawalSafetyReport.existingWithdrawals.count,
        bankDetailsValid: withdrawalSafetyReport.bankDetails.isValid,
        recommendation: withdrawalSafetyReport.recommendations.reason
      } : null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to disable seller account',
      error: error.message
    });
  }
};

exports.disableBuyer = async (req, res) => {
  const { buyerId } = req.params;

  try {
    const buyer = await Buyer.findByIdAndUpdate(buyerId, { isDisabled: true }, { new: true });
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    res.json(buyer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.enableBuyer = async (req, res) => {
  const { buyerId } = req.params;

  try {
    const buyer = await Buyer.findByIdAndUpdate(buyerId, { isDisabled: false }, { new: true });
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    res.json(buyer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.enableSeller = async (req, res) => {
  const { sellerId } = req.params;

  try {
    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      { isDisabled: false },
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Send notification email
    const emailMsg = {
      to: seller.email,
      from: 'Auqli Admin <support@auqli.com>',
      subject: 'Good News! Your Auqli Account Has Been Reactivated 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Reactivated</h2>
          <p>Dear ${seller.firstName},</p>
          <p>We're pleased to inform you that your Auqli seller account has been reactivated. You now have full access to:</p>
          <ul>
            <li>List and manage products</li>
            <li>Process orders</li>
            <li>Access your seller dashboard</li>
            <li>Receive payments</li>
          </ul>
          
          <p>Thank you for your patience during this process.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send to business email if it exists
    if (seller.businessEmail) {
      const businessEmailMsg = {
        to: seller.businessEmail,
        from: 'Auqli Admin <support@auqli.com>',
        subject: 'Business Account Reactivated - Auqli',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Business Account Reactivated</h2>
            <p>Dear ${seller.businessName || seller.firstName},</p>
            <p>Your business account on Auqli has been reactivated with full functionality restored.</p>
            <p>You can now:</p>
            <ul>
              <li>Access all business features</li>
              <li>List and manage products</li>
              <li>Process customer orders</li>
              <li>Access business analytics</li>
            </ul>
            <p>Thank you for your continued partnership with Auqli.</p>
            <p>Best regards,<br>Auqli Business Team</p>
          </div>
        `
      };
      await sgMail.send(businessEmailMsg);
    }

    await sgMail.send(emailMsg);

    res.json({
      success: true,
      message: 'Seller account enabled successfully',
      seller
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to enable seller account',
      error: error.message
    });
  }
};



exports.getAllProducts = async (req, res) => {
  try {
    // Extract pagination parameters from query with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter object based on query parameters
    const filter = {};

    // Filter by product name (case-insensitive partial match)
    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: 'i' };
    }

    // Filter by category
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Filter by seller ID
    if (req.query.sellerId) {
      filter.seller = req.query.sellerId;
    }

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Count total number of products for pagination metadata
    const totalProducts = await Product.countDocuments(filter);

    // Get paginated products with populated seller information
    const products = await Product.find(filter)
      .populate('seller')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Return paginated response
    res.json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      productsPerPage: limit,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const imageFile = req.file;
    let subCategories = [];

    try {
      subCategories = JSON.parse(req.body.subCategories);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid subCategories format' });
    }

    if (!imageFile) {
      return res.status(400).json({ message: 'Category image is required' });
    }

    // Upload image to S3
    const imageKey = `categories/${uuidv4()}-${imageFile.originalname}`;
    const uploadParams = {
      Bucket: process.env.CDN_S3_BUCKET,
      Key: imageKey,
      Body: imageFile.buffer,
      ContentType: imageFile.mimetype,
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    const newCategory = new Category({
      name,
      image: {
        url: `https://` + process.env.CDN_URL + `/${uploadResult.Key}`,
        public_id: uploadResult.Key,
      },
      subCategories,
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create category', error: error.message });
  }
};



exports.getCategories = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get all categories
    const categories = await Category.find({}, null, { session });

    // Reset all category statistics
    await Category.updateMany({}, {
      $set: {
        'statistics.orders.pending': 0,
        'statistics.orders.completed': 0,
        'statistics.items.pending': 0,
        'statistics.items.sold': 0,
        'statistics.totalProducts': 0
      }
    }, { session });

    // Get all orders and their items
    const orders = await Order.find({})
      .populate({
        path: 'items.product',
        select: 'category'
      });

    // Get product counts per category
    const productCounts = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 }
        }
      }
    ]);

    // Create maps to store statistics
    const categoryStats = {};
    const productCountMap = productCounts.reduce((acc, item) => {
      acc[item._id] = item.totalProducts;
      return acc;
    }, {});

    // Process each order
    for (const order of orders) {
      for (const item of order.items) {
        if (!item.product || !item.product.category) continue;

        const category = item.product.category;

        if (!categoryStats[category]) {
          categoryStats[category] = {
            pending: { orders: 0, items: 0 },
            completed: { orders: 0, items: 0 }
          };
        }

        if (order.paid) {
          categoryStats[category].completed.orders++;
          categoryStats[category].completed.items += item.quantity;
        } else {
          categoryStats[category].pending.orders++;
          categoryStats[category].pending.items += item.quantity;
        }
      }
    }

    // Update each category with the calculated statistics
    for (const [categoryName, stats] of Object.entries(categoryStats)) {
      await Category.findOneAndUpdate(
        { name: categoryName },
        {
          $set: {
            'statistics.orders.pending': stats.pending.orders,
            'statistics.orders.completed': stats.completed.orders,
            'statistics.items.pending': stats.pending.items,
            'statistics.items.sold': stats.completed.items,
            'statistics.totalProducts': productCountMap[categoryName] || 0
          }
        },
        { session }
      );
    }

    // Update categories that might have products but no orders
    for (const [categoryName, totalProducts] of Object.entries(productCountMap)) {
      if (!categoryStats[categoryName]) {
        await Category.findOneAndUpdate(
          { name: categoryName },
          {
            $set: {
              'statistics.totalProducts': totalProducts
            }
          },
          { session }
        );
      }
    }

    await session.commitTransaction();

    // Get updated categories and sort them
    const updatedCategories = await Category.find().sort({
      'statistics.orders.completed': -1,
      'statistics.orders.pending': -1
    });

    res.json(updatedCategories);

  } catch (error) {
    await session.abortTransaction();
    console.error('Error in getCategories:', error);
    res.status(500).json({
      message: 'Failed to retrieve categories',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};


exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const imageFile = req.file;
    let subCategories = [];

    try {
      subCategories = JSON.parse(req.body.subCategories);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid subCategories format' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // If new image is uploaded, delete old image and upload new one
    if (imageFile) {
      // Delete old image from S3 if exists
      if (category.image?.public_id) {
        const deleteParams = {
          Bucket: process.env.CDN_S3_BUCKET,
          Key: category.image.public_id,
        };
        await s3.deleteObject(deleteParams).promise();
      }

      // Upload new image
      const imageKey = `categories/${uuidv4()}-${imageFile.originalname}`;
      const uploadParams = {
        Bucket: process.env.CDN_S3_BUCKET,
        Key: imageKey,
        Body: imageFile.buffer,
        ContentType: imageFile.mimetype,
      };

      const uploadResult = await s3.upload(uploadParams).promise();
      category.image = {
        url: `https://` + process.env.CDN_URL + `/${uploadResult.Key}`,
        public_id: uploadResult.Key,
      };
    }

    category.name = name;
    category.subCategories = subCategories;
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete image from S3 if exists
    if (category.image?.public_id) {
      const deleteParams = {
        Bucket: process.env.CDN_S3_BUCKET,
        Key: category.image.public_id,
      };
      await s3.deleteObject(deleteParams).promise();
    }

    // Draft and clear category fields for all products under this category
    await Product.updateMany(
      { category: category.name },
      {
        $set: {
          status: 'draft',
          category: '',
          subCategory: '',
          subSubCategory: '',
          updatedAt: new Date(),
        },
      }
    );

    // Use deleteOne() instead of remove()
    await Category.deleteOne({ _id: id });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete category', error: error.message });
  }
};

exports.getSubCategories = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category.subCategories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve subcategories', error: error.message });
  }
};



exports.markSellerAsFeatured = async (req, res) => {
  const { sellerId } = req.params;

  try {
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.isFeatured = !seller.isFeatured; // Toggle the isFeatured status
    await seller.save();

    res.json(seller);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.createBanner = async (req, res) => {
  try {
    const { title, description, category, callToActionLink } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ message: 'Banner image is required' });
    }

    // Find the category
    const categoryDoc = await Category.findOne({
      name: { $regex: new RegExp(category, 'i') }
    });
    if (!categoryDoc) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Upload image to S3
    const imageKey = `banners/${uuidv4()}-${imageFile.originalname}`;
    const uploadParams = {
      Bucket: process.env.CDN_S3_BUCKET,
      Key: imageKey,
      Body: imageFile.buffer,
      ContentType: imageFile.mimetype,
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    const newBanner = new Banner({
      title,
      description,
      mainImage: {
        url: `https://` + process.env.CDN_URL + `/${uploadResult.Key}`,
        public_id: uploadResult.Key
      },
      category: categoryDoc._id,
      callToActionLink,
    });

    await newBanner.save();
    const populatedBanner = await newBanner.populate('category');

    res.status(201).json({
      ...populatedBanner.toObject(),
      category: populatedBanner.category.name,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;
    const { title, description, category, callToActionLink } = req.body;
    const imageFile = req.file;

    const banner = await Banner.findById(bannerId);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Update category if provided
    if (category) {
      const categoryDoc = await Category.findOne({
        name: { $regex: new RegExp(category, 'i') }
      });
      if (!categoryDoc) {
        return res.status(404).json({ message: 'Category not found' });
      }
      banner.category = categoryDoc._id;
    }

    // Handle image update if provided
    if (imageFile) {
      // Delete old image from S3
      if (banner.mainImage?.public_id) {
        await s3.deleteObject({
          Bucket: process.env.CDN_S3_BUCKET,
          Key: banner.mainImage.public_id
        }).promise();
      }

      // Upload new image
      const imageKey = `banners/${uuidv4()}-${imageFile.originalname}`;
      const uploadResult = await s3.upload({
        Bucket: process.env.CDN_S3_BUCKET,
        Key: imageKey,
        Body: imageFile.buffer,
        ContentType: imageFile.mimetype,
      }).promise();

      banner.mainImage = {
        url: `https://` + process.env.CDN_URL + `/${uploadResult.Key}`,
        public_id: uploadResult.Key
      };
    }

    // Update other fields
    banner.title = title || banner.title;
    banner.description = description || banner.description;
    banner.callToActionLink = callToActionLink || banner.callToActionLink;

    await banner.save();
    const populatedBanner = await banner.populate('category');

    res.json({
      ...populatedBanner.toObject(),
      category: populatedBanner.category.name,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;
    const banner = await Banner.findById(bannerId);

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Delete image from S3
    if (banner.mainImage?.public_id) {
      await s3.deleteObject({
        Bucket: process.env.CDN_S3_BUCKET,
        Key: banner.mainImage.public_id
      }).promise();
    }

    await Banner.deleteOne({ _id: bannerId });
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().populate('category');

    // Transform the response to include the category name, handling null categories
    const responseBanners = banners.map(banner => ({
      ...banner.toObject(),
      category: banner.category ? banner.category.name : 'Unknown Category', // Handle null category
    }));

    res.json(responseBanners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBannersByCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const banners = await Banner.find({ category: categoryId }).populate('category');

    // Transform the response to include the category name
    const responseBanners = banners.map(banner => ({
      ...banner.toObject(),
      category: banner.category.name,
    }));

    res.json(responseBanners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get all orders for admin
exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'firstName lastName').populate('seller', 'name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve orders', error: error.message });
  }
};

// Update order status by admin
exports.updateOrderStatusAdmin = async (req, res) => {
  const { id } = req.params;
  const { status, deliveredAt } = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status || order.status;
    order.deliveredAt = deliveredAt || order.deliveredAt;

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
};

// Create a new announcement
exports.createAnnouncement = async (req, res) => {
  const { title, description } = req.body;

  try {
    const newAnnouncement = new Announcement({ title, description });
    await newAnnouncement.save();
    res.status(201).json({ message: 'Announcement created successfully!', announcement: newAnnouncement });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find();
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single announcement by ID
exports.getAnnouncement = async (req, res) => {
  const { announcementId } = req.params;

  try {
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update an announcement by ID
exports.updateAnnouncement = async (req, res) => {
  const { announcementId } = req.params;
  const { title, description } = req.body;

  try {
    const announcement = await Announcement.findByIdAndUpdate(announcementId, { title, description }, { new: true });
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete an announcement by ID
exports.deleteAnnouncement = async (req, res) => {
  const { announcementId } = req.params;

  try {
    const announcement = await Announcement.findByIdAndDelete(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify a seller's business account
exports.verifyBusinessAccount = async (req, res) => {
  const { sellerId } = req.params;

  try {
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.isVerified = true;
    await seller.save();

    // Send verification emails
    const personalEmailMsg = {
      to: seller.email,
      from: 'Auqli Nigeria <support@auqli.com>',
      subject: 'Your Auqli Account Has Been Verified! 🎉',
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hi ${seller.firstName},</h2>
      <p>Your seller account on Auqli Nigeria has been verified successfully.</p>
      <p>You can now:</p>
      <ul>
        <li>✅ List products on the marketplace</li>
        <li>✅ Access all seller tools</li>
        <li>✅ Process orders and receive payments</li>
        <li>✅ Go live with your audience</li>
      </ul>
      <p><a href="#" style="color: #4CAF50; text-decoration: none;">🔓 Login and Start Selling →</a></p>
      <p>For tips, visit <a href="http://help.auqli.live" style="color: #4CAF50; text-decoration: none;">help.auqli.live</a> or reach us at <a href="mailto:support@auqli.com" style="color: #4CAF50; text-decoration: none;">support@auqli.com</a></p>
      <p>Join our community and get support anytime:</p>
      <ul>
        <li>📢 <a href="#" style="color: #4CAF50; text-decoration: none;">Telegram Group</a></li>
        <li>💬 <a href="#" style="color: #4CAF50; text-decoration: none;">WhatsApp Channel</a></li>
        <li>📱 <a href="#" style="color: #4CAF50; text-decoration: none;">Instagram | Twitter | Facebook</a></li>
      </ul>
      <p>Let's go live.</p>
      <p>Best regards,<br>The Auqli Team</p>
    </div>
  `
    };

    // Send to business email if it exists
    if (seller.businessEmail) {
      const businessEmailMsg = {
        to: seller.businessEmail,
        from: 'Auqli Nigeria <support@auqli.com>',
        subject: 'Business Account Verification Confirmed - Auqli',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Business Account Verified</h2>
        <p>Dear ${seller.businessName || seller.firstName},</p>
        <p>Your business account on Auqli has been verified. Here's what this means for your business:</p>
        <ul>
          <li>Full access to seller dashboard</li>
          <li>Ability to process unlimited orders</li>
          <li>Access to business analytics</li>
          <li>Priority customer support</li>
        </ul>
        <p>Business Details:</p>
        <ul>
          <li>Business Name: ${seller.businessName}</li>
          <li>Account Type: ${seller.accountType}</li>
          <li>Verification Status: Verified</li>
        </ul>
        <p>You can now start managing your business through our platform.</p>
        <p>For tips, visit <a href="http://help.auqli.live" style="color: #4CAF50; text-decoration: none;">help.auqli.live</a> or reach us at <a href="mailto:support@auqli.com" style="color: #4CAF50; text-decoration: none;">support@auqli.com</a></p>
        <p>Join our community and get support anytime:</p>
        <ul>
          <li>📢 <a href="#" style="color: #4CAF50; text-decoration: none;">Telegram Group</a></li>
          <li>💬 <a href="#" style="color: #4CAF50; text-decoration: none;">WhatsApp Channel</a></li>
          <li>📱 <a href="#" style="color: #4CAF50; text-decoration: none;">Instagram | Twitter | Facebook</a></li>
        </ul>
        <p>Let's go live.</p>
        <p>Best regards,<br>Auqli Business Team</p>
      </div>
    `
      };
      await sgMail.send(businessEmailMsg);
    }


    await sgMail.send(personalEmailMsg);

    res.json({
      success: true,
      message: 'Account verified successfully',
      seller
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify account',
      error: error.message
    });
  }
};



// Get all orders with advanced filtering and search
// Get all possible order statuses for filter dropdowns
exports.getOrderStatusOptions = async (req, res) => {
  try {
    // Get all distinct item statuses
    const itemStatuses = await Order.distinct('items.status');

    // Get all distinct shipment tracking statuses
    const shipmentStatuses = await Order.distinct('shipping.tracking.status');

    // Get all distinct payment methods
    const paymentMethods = await Order.distinct('paymentInfo.method');

    res.json({
      itemStatuses,
      shipmentStatuses,
      paymentMethods,
      openClosedOptions: ['open', 'closed'],
      paymentStatusOptions: ['paid', 'unpaid'],
      staleOptions: ['stale', 'active']
    });
  } catch (error) {
    console.error('Error getting order status options:', error);
    res.status(500).json({
      message: 'Failed to retrieve order status options',
      error: error.message
    });
  }
};

// Get order statistics for admin dashboard
exports.getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get order counts by status
    const statusCounts = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get order counts by payment method
    const paymentMethodCounts = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentInfo.method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get order counts by day for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ordersByDay = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          ...dateFilter
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get counts for open vs closed orders
    const openClosedCounts = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$isOpen',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get counts for stale orders
    const staleCounts = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$isStale',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format the response
    const stats = {
      byStatus: statusCounts.reduce((acc, curr) => {
        acc[curr._id || 'unknown'] = curr.count;
        return acc;
      }, {}),
      byPaymentMethod: paymentMethodCounts.reduce((acc, curr) => {
        acc[curr._id || 'unknown'] = {
          count: curr.count,
          amount: curr.totalAmount
        };
        return acc;
      }, {}),
      byDay: ordersByDay.reduce((acc, curr) => {
        acc[curr._id] = {
          count: curr.count,
          revenue: curr.revenue
        };
        return acc;
      }, {}),
      openVsClosed: openClosedCounts.reduce((acc, curr) => {
        acc[curr._id ? 'open' : 'closed'] = curr.count;
        return acc;
      }, { open: 0, closed: 0 }),
      staleOrders: staleCounts.reduce((acc, curr) => {
        if (curr._id === true) acc.stale = curr.count;
        else acc.active = curr.count;
        return acc;
      }, { stale: 0, active: 0 })
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting order statistics:', error);
    res.status(500).json({
      message: 'Failed to retrieve order statistics',
      error: error.message
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      isStale,
      isOpen,
      paid,
      search,
      shipmentStatus,
      startDate,
      endDate,
      seller,
      paymentMethod,
      isCashOnDelivery
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query based on filters
    const query = {};

    // Filter by item status
    if (status) {
      query['items.status'] = status;
    }

    // Filter by stale orders
    if (isStale !== undefined) {
      query.isStale = isStale === 'true';
    }

    // Filter by open/closed orders
    if (isOpen !== undefined) {
      query.isOpen = isOpen === 'true';
    }

    // Filter by payment status
    if (paid !== undefined) {
      query.paid = paid === 'true';
    }

    // Filter by payment method
    if (paymentMethod) {
      query['paymentInfo.method'] = paymentMethod;
    }

    // Filter by cash on delivery
    if (isCashOnDelivery !== undefined) {
      query['paymentInfo.isCashOnDelivery'] = isCashOnDelivery === 'true';
    }

    // Filter by seller
    if (seller) {
      query.seller = seller;
    }

    // Filter by shipment status
    if (shipmentStatus) {
      query['shipping.tracking.status'] = shipmentStatus;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Search by order ID, buyer name, or product name
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { order_id: searchRegex },
        { 'buyerDetails.firstName': searchRegex },
        { 'buyerDetails.lastName': searchRegex },
        { 'items.productName': searchRegex }
      ];
    }

    const orders = await Order.find(query)
      .populate('buyer', 'firstName lastName email phoneNumber')
      .populate('seller', 'firstName lastName storeName email')
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    // Get available filter options for dropdowns
    const statusOptions = await Order.distinct('items.status');
    const shipmentStatusOptions = await Order.distinct('shipping.tracking.status');
    const paymentMethodOptions = await Order.distinct('paymentInfo.method');

    res.json({
      orders,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      filterOptions: {
        status: statusOptions,
        shipmentStatus: shipmentStatusOptions,
        paymentMethod: paymentMethodOptions
      }
    });

  } catch (error) {
    console.error('Error retrieving orders:', error);
    res.status(500).json({
      message: 'Failed to retrieve orders',
      error: error.message
    });
  }
};

// Get platform analytics
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const analytics = {
      orders: {
        total: 0,
        byStatus: {},
        byDay: {},
      },
      revenue: {
        total: 0,
        byDay: {},
        commission: 0
      },
      sellers: {
        total: await Seller.countDocuments(),
        active: 0,
        topPerformers: []
      },
      products: {
        total: await Product.countDocuments(),
        topSelling: []
      },
      disputes: {
        total: 0,
        open: 0,
        resolved: 0
      }
    };

    // Aggregate order data
    const orderStats = await Order.aggregate([
      { $match: { ...dateQuery, isStale: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    if (orderStats.length > 0) {
      analytics.orders.total = orderStats[0].totalOrders;
      analytics.revenue.total = orderStats[0].totalRevenue;
      analytics.revenue.commission = orderStats[0].totalRevenue * 0.1; // Assuming 10% commission
    }

    // Get order status distribution
    const statusStats = await Order.aggregate([
      { $match: { ...dateQuery, isStale: { $ne: true } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.status',
          count: { $sum: 1 }
        }
      }
    ]);

    statusStats.forEach(stat => {
      analytics.orders.byStatus[stat._id] = stat.count;
    });

    // Get top performing sellers
    analytics.sellers.topPerformers = await Order.aggregate([
      { $match: { ...dateQuery, isStale: { $ne: true } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.seller',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    await Seller.populate(analytics.sellers.topPerformers, {
      path: '_id',
      select: 'firstName lastName businessName email'
    });

    // Get top selling products
    analytics.products.topSelling = await Order.aggregate([
      { $match: { ...dateQuery, isStale: { $ne: true } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    await Product.populate(analytics.products.topSelling, {
      path: '_id',
      select: 'name price images'
    });

    // Get dispute statistics
    const disputeStats = await Order.aggregate([
      { $match: { 'dispute.status': { $exists: true } } },
      {
        $group: {
          _id: '$dispute.status',
          count: { $sum: 1 }
        }
      }
    ]);

    disputeStats.forEach(stat => {
      if (stat._id === 'opened') analytics.disputes.open = stat.count;
      if (stat._id === 'resolved') analytics.disputes.resolved = stat.count;
      analytics.disputes.total += stat.count;
    });

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching platform analytics', error: error.message });
  }
};

// Fraud detection and monitoring
exports.getFlaggedOrders = async (req, res) => {
  try {
    const flaggedOrders = await Order.find({
      $or: [
        { 'paymentInfo.status': 'failed' },
        {
          'paymentInfo.gateway_response': {
            $in: [
              'fraudulent',
              'suspicious',
              'declined',
              'timeout'
            ]
          }
        }, // Paystack specific responses
        { 'dispute.status': 'opened' },
        { 'refund.status': { $in: ['requested', 'approved'] } },
        { 'paymentInfo.attempts': { $gt: 3 } } // Multiple payment attempts
      ]
    })
      .populate('buyer', 'firstName lastName email phoneNumber')
      .populate('items.seller', 'firstName lastName businessName email')
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 });

    res.json(flaggedOrders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flagged orders', error: error.message });
  }
};

// Manual order intervention
exports.updateOrderManually = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { status, note, refundAmount } = req.body;

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status
    if (status) {
      order.items.forEach(item => {
        item.status = status;
        item.statusHistory.push({
          status,
          timestamp: new Date(),
          note: `Admin update: ${note || status}`
        });
      });
    }

    // Process refund if specified
    if (refundAmount) {
      // Process refund through Paystack
      const refundResponse = await paystack.post('/refund', {
        transaction: order.paymentInfo.reference,
        amount: Math.round(refundAmount * 100) // Amount in kobo
      });

      if (refundResponse.data.status) {
        order.refund = {
          status: 'processed',
          amount: refundAmount,
          processedAt: new Date(),
          processedBy: req.user.id,
          reference: refundResponse.data.data.reference
        };
      } else {
        throw new Error('Refund failed through Paystack');
      }
    }

    // Add admin note
    order.notes.push({
      type: 'admin',
      content: note || `Manual update by admin: ${status}`,
      createdAt: new Date()
    });

    await order.save({ session });
    await session.commitTransaction();

    res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error updating order', error: error.message });
  } finally {
    session.endSession();
  }
};

// Admin cancel order function
exports.adminCancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body || {};

    // Find order and populate necessary fields
    const order = await Order.findById(orderId)
      .populate('seller', 'email firstName lastName storeName')
      .populate('buyer', 'email firstName lastName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if the order is already cancelled
    if (order.shipping && order.shipping.tracking && order.shipping.tracking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order has already been cancelled'
      });
    }

    // Check if the order is from an auction
    if (order.channel && (order.channel.toLowerCase() === 'auction')) {
      return res.status(400).json({
        success: false,
        message: 'Orders created from auctions cannot be cancelled'
      });
    }

    // Only attempt to cancel with Fez if order has tracking number
    if (order.shipping && order.shipping.tracking && order.shipping.tracking.number) {
      try {
        // Get a fresh authentication token for Fez Delivery
        const getFezAuthToken = async () => {
          try {
            const FEZ_API_URL = process.env.FEZ_API_URL;
            const authUrl = `${FEZ_API_URL}/user/authenticate`;
            const authData = {
              user_id: process.env.FEZ_USER_ID,
              password: process.env.FEZ_PASSWORD
            };

            const response = await axios.post(authUrl, authData);

            if (response.data && response.data.status === 'Success' && response.data.authDetails) {
              return response.data.authDetails.authToken;
            } else {
              throw new Error('Failed to authenticate with Fez Delivery');
            }
          } catch (error) {
            console.error('Fez authentication error:', error.message);
            throw new Error(`Failed to authenticate with Fez Delivery: ${error.message}`);
          }
        };

        const authToken = await getFezAuthToken();
        console.log('Admin using fresh token for order cancellation:', authToken.substring(0, 10) + '...');

        // Cancel shipment with Fez Delivery
        const cancelResponse = await axios.delete(`${process.env.FEZ_API_URL}/order`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'secret-key': process.env.FEZ_SECRET_KEY,
            'Content-Type': 'application/json'
          },
          data: {
            orderNo: order.shipping.tracking.number
          }
        });

        if (cancelResponse.data && cancelResponse.data.status === 'Success') {
          console.log('Fez API cancellation successful:', cancelResponse.data.description);
        } else {
          console.log('Fez API cancellation failed:', cancelResponse.data);
          // Continue with local cancellation despite Fez API error
        }
      } catch (fezError) {
        console.log('Fez API error:', fezError.message);
        if (fezError.response) {
          console.log('Fez API error details:', fezError.response.data);
        }
        // Continue with local cancellation despite Fez API error
      }
    }

    // Create new tracking entry
    const newTrackingEntry = {
      status: 'cancelled',
      description: `Order cancelled by admin. Reason: ${reason || 'Admin cancellation'}`,
      timestamp: new Date()
    };

    // Update order shipping information
    const shippingUpdate = {
      $set: {
        'shipping.tracking.status': 'cancelled',
        'shipping.tracking.lastUpdate': new Date()
      },
      $push: {
        'shipping.tracking.history': newTrackingEntry
      }
    };

    // Update all items status to cancelled
    order.items.forEach(item => {
      item.status = 'cancelled';
      item.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: reason || 'Cancelled by admin'
      });
    });

    // Check if this is a hybrid payment (wallet + Paystack)
    const isHybridPayment = order.paymentInfo && order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
    let walletRefunded = false;
    let walletRefundAmount = 0;

    // Process wallet refund for hybrid payments if applicable
    if (isHybridPayment && order.paymentInfo.walletAmountUsed > 0) {
      try {
        const buyer = await Buyer.findById(order.buyer);

        if (buyer) {
          // Refund the wallet amount that was used
          walletRefundAmount = order.paymentInfo.walletAmountUsed;
          const walletTransaction = {
            type: 'credit',
            amount: walletRefundAmount,
            description: `Refund for admin cancelled order ${order.order_id}`,
            status: 'completed',
            createdAt: new Date()
          };

          // Add transaction to wallet
          buyer.wallet.balance += walletRefundAmount;
          buyer.wallet.transactions.push(walletTransaction);

          // Save buyer with updated wallet
          await buyer.save();

          walletRefunded = true;
          console.log(`Refunded wallet amount for admin cancelled order: ${walletRefundAmount}`, {
            orderId: order._id,
            buyer: buyer._id,
            newWalletBalance: buyer.wallet.balance
          });
        }
      } catch (refundError) {
        console.error(`Error refunding wallet amount for order ${order.order_id}:`, refundError);
        // Continue with order cancellation even if refund fails
      }
    }

    // Check if the order was paid and create a refund request if necessary
    if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
      console.log('Creating refund request for admin cancelled paid order:', order.order_id);

      shippingUpdate.$set['refundRequest.requested'] = true;
      shippingUpdate.$set['refundRequest.requestedAt'] = new Date();
      shippingUpdate.$set['refundRequest.requestedBy'] = 'admin';
      shippingUpdate.$set['refundRequest.reason'] = reason || 'Order cancelled by admin';
      shippingUpdate.$set['refundRequest.status'] = 'pending';
      shippingUpdate.$set['refundRequest.refundAmount'] = order.totalAmount;

      // Also update the order status to indicate it has a refund
      shippingUpdate.$set['orderStatus.hasRefund'] = true;
    }

    // Add admin note
    order.notes.push({
      type: 'admin',
      content: `Order cancelled by admin. Reason: ${reason || 'Admin cancellation'}`,
      createdAt: new Date()
    });

    // Save the order with all updates
    await order.save();

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      shippingUpdate,
      { new: true }
    ).populate('seller', 'email firstName lastName storeName')
      .populate('buyer', 'email firstName lastName');

    // Send cancellation emails
    let buyerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Cancellation Notice</h2>
        <p>Dear ${updatedOrder.buyer.firstName},</p>
        <p>Your order #${updatedOrder.order_id} has been cancelled by our admin team.</p>
        <p><strong>Order Details:</strong></p>
        <ul>
          <li>Order ID: ${updatedOrder.order_id}</li>
          <li>Seller: ${updatedOrder.seller.storeName}</li>
          <li>Cancellation Date: ${new Date().toLocaleDateString()}</li>
          ${reason ? `<li>Reason: ${reason}</li>` : ''}
        </ul>
    `;

    // Add refund information if applicable
    if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
      buyerEmailHtml += `
        <p><strong>Refund Information:</strong></p>
        <p>Since you've already paid for this order, a refund request has been automatically created. Our admin team will process your refund shortly.</p>
        <p>Refund status: Pending</p>
      `;
    }

    // Add wallet refund info if applicable
    if (walletRefunded) {
      buyerEmailHtml += `
        <p><strong>Wallet Refund:</strong> Your wallet credit of ₦${walletRefundAmount.toLocaleString()} used for this order has been refunded to your wallet.</p>
      `;
    }

    buyerEmailHtml += `
        <p>If you have any questions about this cancellation, please contact our support team.</p>
        <p>Best regards,<br>The Auqli Team</p>
      </div>
    `;

    const buyerEmail = {
      to: updatedOrder.buyer.email,
      from: 'Auqli Admin <support@auqli.com>',
      subject: 'Order Cancellation Notice - Auqli',
      html: buyerEmailHtml
    };

    const sellerEmail = {
      to: updatedOrder.seller.email,
      from: 'Auqli Admin <support@auqli.com>',
      subject: 'Order Cancellation Notification - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Cancellation Notification</h2>
          <p>Dear ${updatedOrder.seller.firstName},</p>
          <p>Order #${updatedOrder.order_id} from your store has been cancelled by our admin team.</p>
          <p><strong>Order Details:</strong></p>
          <ul>
            <li>Order ID: ${updatedOrder.order_id}</li>
            <li>Buyer: ${updatedOrder.buyer.firstName} ${updatedOrder.buyer.lastName}</li>
            <li>Cancellation Date: ${new Date().toLocaleDateString()}</li>
            ${reason ? `<li>Reason: ${reason}</li>` : ''}
          </ul>
          ${order.paid ? `<p>Since this was a paid order, a refund request has been automatically created for the buyer.</p>` : ''}
          ${walletRefunded ? `<p>The wallet amount used for this order (₦${walletRefundAmount.toLocaleString()}) has been refunded to the buyer's wallet.</p>` : ''}
          <p>If you have any questions about this cancellation, please contact our admin team.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send admin notification if refund is needed
    if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
      const admins = await Admin.find({});

      if (admins && admins.length > 0) {
        const adminEmails = admins.map(admin => admin.email).filter(Boolean);

        if (adminEmails.length > 0) {
          const adminEmail = {
            to: adminEmails,
            from: 'Auqli Refunds <support@auqli.com>',
            subject: `Refund Request Created - Admin Cancelled Order #${updatedOrder.order_id}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Refund Request Created</h2>
                <p>A new refund request has been created for an admin cancelled order.</p>
                <p><strong>Order Details:</strong></p>
                <ul>
                  <li>Order ID: ${updatedOrder.order_id}</li>
                  <li>Buyer: ${updatedOrder.buyer.firstName} ${updatedOrder.buyer.lastName}</li>
                  <li>Seller: ${updatedOrder.seller.storeName}</li>
                  <li>Amount: ₦${updatedOrder.totalAmount.toLocaleString()}</li>
                  <li>Payment Method: ${updatedOrder.paymentInfo?.method || 'Unknown'}</li>
                  <li>Reason: ${reason || 'Admin cancellation'}</li>
                  ${walletRefunded ? `<li>Note: Wallet payment of ₦${walletRefundAmount.toLocaleString()} was automatically refunded</li>` : ''}
                </ul>
                <p>Please process this refund request at your earliest convenience.</p>
              </div>
            `
          };

          try {
            await sgMail.send(adminEmail);
          } catch (emailError) {
            console.error('Error sending admin notification:', emailError);
          }
        }
      }
    }

    // Send emails to buyer and seller
    try {
      await Promise.all([
        sgMail.send(buyerEmail),
        sgMail.send(sellerEmail)
      ]);
    } catch (emailError) {
      console.error('Error sending cancellation emails:', emailError);
      // Continue processing even if email sending fails
    }

    // Create notifications
    const notificationController = require('./notificationController');
    const { createNotification } = notificationController;

    try {
      await Promise.all([
        createNotification(order.buyer._id, 'order_cancelled_admin', {
          orderId: order._id,
          order_id: order.order_id,
          sellerName: order.seller.storeName,
          reason: reason || 'Admin cancellation',
          walletRefunded: walletRefunded,
          walletRefundAmount: walletRefundAmount
        }),
        createNotification(order.seller._id, 'order_cancelled_admin', {
          orderId: order._id,
          order_id: order.order_id,
          buyerName: `${order.buyer.firstName} ${order.buyer.lastName}`,
          reason: reason || 'Admin cancellation',
          walletRefunded: walletRefunded
        })
      ]);
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Continue processing even if notification creation fails
    }

    // If order is paid, the refund request was already created above
    // For unpaid orders, close the order immediately
    if (!order.paid && !(order.paymentInfo && order.paymentInfo.method === 'wallet')) {
      await Order.findByIdAndUpdate(order._id, {
        isOpen: false,
        closedAt: new Date(),
        closedBy: 'admin',
        closedReason: reason || 'Order cancelled by admin'
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        _id: updatedOrder._id,
        order_id: updatedOrder.order_id,
        status: 'cancelled',
        isOpen: updatedOrder.isOpen,
        shipping: {
          tracking: updatedOrder.shipping?.tracking
        },
        refundRequest: updatedOrder.refundRequest,
        closedAt: updatedOrder.closedAt,
        closedBy: updatedOrder.closedBy,
        closedReason: updatedOrder.closedReason
      },
      walletRefunded: walletRefunded,
      walletRefundAmount: walletRefundAmount
    });

  } catch (error) {
    console.error('Error in admin cancel order:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

// Add method to verify Paystack transactions
exports.verifyPaystackTransaction = async (req, res) => {
  try {
    const { reference } = req.params;

    const verificationResponse = await paystack.get(`/transaction/verify/${reference}`);

    if (!verificationResponse.data.status) {
      return res.status(400).json({
        message: 'Transaction verification failed',
        data: verificationResponse.data
      });
    }

    const transactionData = verificationResponse.data.data;
    const order = await Order.findOne({ 'paymentInfo.reference': reference });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order payment status based on verification
    order.paymentInfo.status = transactionData.status === 'success' ? 'completed' : 'failed';
    order.paymentInfo.gateway_response = transactionData.gateway_response;
    order.paymentInfo.verifiedAt = new Date();

    await order.save();

    res.json({
      message: 'Transaction verified successfully',
      order
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error verifying transaction',
      error: error.message
    });
  }
};

// Add method to get Paystack transaction logs
exports.getPaystackTransactionLogs = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    let url = '/transaction';

    const params = new URLSearchParams();
    if (startDate) params.append('from', startDate);
    if (endDate) params.append('to', endDate);
    if (status) params.append('status', status);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await paystack.get(url);

    res.json(response.data.data);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching transaction logs',
      error: error.message
    });
  }
};

// Get all withdrawals
exports.getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .populate('seller', 'firstName lastName email storeName')
      .sort({ requestDate: -1 });

    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch withdrawals',
      error: error.message
    });
  }
};

// Update withdrawal status
exports.updateWithdrawalStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { withdrawalId } = req.params;
    const { status, note } = req.body;

    const withdrawal = await Withdrawal.findById(withdrawalId)
      .populate('seller')
      .session(session);

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    withdrawal.status = status;
    withdrawal.notes.push({
      content: note || `Status updated to ${status}`,
      addedBy: 'admin'
    });

    if (status === 'completed') {
      withdrawal.processedDate = new Date();

      // Create withdrawal transaction record
      await Transaction.create({
        seller: withdrawal.seller._id,
        type: 'withdrawal',
        amount: withdrawal.amount,
        status: 'completed',
        bankDetails: withdrawal.bankDetails,
        description: `Withdrawal to bank account ${withdrawal.bankDetails.accountNumber}`
      });

      // Update seller's wallet balance
      const seller = withdrawal.seller;
      seller.walletBalance -= withdrawal.amount;
      await seller.save({ session });
    }

    await withdrawal.save({ session });
    await session.commitTransaction();

    // Send email notification
    try {
      const emailMsg = {
        to: withdrawal.seller.email,
        from: 'Auqli <support@auqli.com>',
        subject: 'Withdrawal Request Update',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Withdrawal Request Update</h2>
            <p>Dear ${withdrawal.seller.firstName},</p>
            <p>Your withdrawal request (Ref: ${withdrawal.reference}) has been ${status}.</p>
            <p>Amount: ${withdrawal.amount}</p>
            ${note ? `<p>Note: ${note}</p>` : ''}
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `
      };

      await termiiEmailService.sendRawHTMLEmail({
        email: emailMsg.to,
        subject: emailMsg.subject,
        html: emailMsg.html,
        from: emailMsg.from
      });
    } catch (emailError) {
      console.error('Failed to send withdrawal update email:', emailError);
    }

    res.json({
      message: 'Withdrawal status updated successfully',
      withdrawal
    });
  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    // Only abort transaction if it hasn't been committed yet
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    res.status(500).json({
      message: 'Failed to update withdrawal status',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

exports.verifyBuyerIdentity = async (req, res) => {
  try {
    const { buyerId } = req.params;
    const { status, note } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    if (!buyer.identityDocument) {
      return res.status(400).json({ message: 'No identity document found for this buyer' });
    }

    // Update verification status
    buyer.identityDocument.status = status;
    buyer.isIdentityVerified = status === 'verified';
    buyer.identityVerificationNote = note;
    await buyer.save();

    // Send detailed email notification to buyer
    const emailMsg = {
      to: buyer.email,
      from: 'Auqli Admin <support@auqli.com>',
      subject: `Identity Verification ${status === 'verified' ? 'Approved' : 'Rejected'}`,
      html: `
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="width: 150px; margin-bottom: 30px;">
            
            <h1 style="color: ${status === 'verified' ? '#4CAF50' : '#ff4444'}; margin-bottom: 20px;">
              Identity Verification ${status === 'verified' ? 'Approved' : 'Rejected'}
            </h1>
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              Dear ${buyer.firstName},
            </p>
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              Your identity verification has been ${status}. 
              ${status === 'verified'
          ? 'You now have full access to all buyer features on Auqli.'
          : 'Please review the feedback below and submit a new verification if needed.'}
            </p>

            <div style="background-color: #333333; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
              <h3 style="color: #4CAF50; margin-bottom: 15px;">Verification Details:</h3>
              <ul style="color: #ffffff; margin-bottom: 0;">
                <li style="margin-bottom: 10px;">Status: ${status}</li>
                <li style="margin-bottom: 10px;">Document ID: ${buyer.identityDocument.public_id}</li>
                <li style="margin-bottom: 10px;">Verification Date: ${new Date().toLocaleDateString()}</li>
                ${note ? `<li style="margin-bottom: 10px;">Admin Note: ${note}</li>` : ''}
              </ul>
            </div>

            ${status === 'rejected' ? `
              <div style="background-color: #333333; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
                <h3 style="color: #ff4444; margin-bottom: 15px;">Next Steps:</h3>
                <ul style="color: #ffffff; margin-bottom: 0;">
                  <li style="margin-bottom: 10px;">Review the feedback provided above</li>
                  <li style="margin-bottom: 10px;">Ensure your document meets our requirements</li>
                  <li>Submit a new verification request when ready</li>
                </ul>
              </div>
            ` : ''}

            <p style="font-size: 14px; color: #999999;">
              If you have any questions, please contact our support team.
            </p>
            
            <hr style="border: 1px solid #333333; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">
              © ${new Date().getFullYear()} Auqli. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await sgMail.send(emailMsg);


    res.json({
      message: 'Identity verification status updated successfully',
      buyer: {
        id: buyer._id,
        status: buyer.identityDocument.status,
        isVerified: buyer.isIdentityVerified
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to update identity verification status',
      error: error.message
    });
  }
};

// Add a new method to get sub-subcategories
exports.getSubSubCategories = async (req, res) => {
  const { categoryId, subCategoryId } = req.params;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const subCategory = category.subCategories.id(subCategoryId);
    if (!subCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    res.json(subCategory.subSubCategories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve sub-subcategories', error: error.message });
  }
};

// Create a resource
exports.createResource = async (req, res) => {
  try {
    const { title, description, link, resourceType, category } = req.body;
    const mediaFile = req.files?.['media']?.[0];
    const bannerFile = req.files?.['banner']?.[0];

    if (resourceType === 'file' && !bannerFile) {
      return res.status(400).json({ message: 'Banner image is required for file resources' });
    }

    if (!resourceType || !['youtube', 'file'].includes(resourceType)) {
      return res.status(400).json({ message: 'Valid resource type is required (youtube or file)' });
    }

    if (!category || !['auqli_university', 'other'].includes(category)) {
      return res.status(400).json({ message: 'Valid category is required (auqli_university or other)' });
    }

    if (resourceType === 'youtube' && !link) {
      return res.status(400).json({ message: 'Link is required for YouTube resources' });
    }

    if (resourceType === 'file' && !mediaFile) {
      return res.status(400).json({ message: 'Media file is required for file resources' });
    }

    // Initialize resource data
    const resourceData = {
      title,
      description,
      resourceType,
      category,
      link
    };

    // Handle banner image if provided
    if (bannerFile) {
      const bannerKey = `resources/banners/${uuidv4()}-${bannerFile.originalname}`;
      const bannerParams = {
        Bucket: process.env.CDN_S3_BUCKET,
        Key: bannerKey,
        Body: bannerFile.buffer,
        ContentType: bannerFile.mimetype,
      };
      const bannerUpload = await s3.upload(bannerParams).promise();

      resourceData.banner = {
        url: bannerUpload.Location,
        public_id: bannerUpload.Key
      };
    } else if (resourceType === 'youtube') {
      // For YouTube resources without a banner, use a default placeholder
      resourceData.banner = {
        url: 'https://placehold.co/600x400?text=YouTube+Video',
        public_id: 'default-youtube-banner'
      };
    }

    // Handle media file if provided
    if (mediaFile) {
      const mediaKey = `resources/${uuidv4()}-${mediaFile.originalname}`;
      const mediaParams = {
        Bucket: process.env.CDN_S3_BUCKET,
        Key: mediaKey,
        Body: mediaFile.buffer,
        ContentType: mediaFile.mimetype,
      };
      const mediaUpload = await s3.upload(mediaParams).promise();

      // Determine media type
      const mediaType = mediaFile.mimetype.startsWith('image/') ? 'image' :
        mediaFile.mimetype.startsWith('video/') ? 'video' : 'file';

      resourceData.media = {
        type: mediaType,
        url: mediaUpload.Location,
        public_id: mediaUpload.Key
      };
    }

    const resource = new Resource(resourceData);
    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create resource', error: error.message });
  }
};

// Get all resources (admin)
exports.getAllResources = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { resourceType, category } = req.query;

    // Build filter object
    const filter = {};
    if (resourceType && ['youtube', 'file'].includes(resourceType)) {
      filter.resourceType = resourceType;
    }
    if (category && ['auqli_university', 'other'].includes(category)) {
      filter.category = category;
    }

    const resources = await Resource.find(filter).sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update resource
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, link, resourceType, category } = req.body;
    const mediaFile = req.files['media']?.[0];
    const bannerFile = req.files['banner']?.[0];

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Validate resource type if updating
    if (resourceType && !['youtube', 'file'].includes(resourceType)) {
      return res.status(400).json({ message: 'Valid resource type is required (youtube or file)' });
    }

    // Validate category if updating
    if (category && !['auqli_university', 'other'].includes(category)) {
      return res.status(400).json({ message: 'Valid category is required (auqli_university or other)' });
    }

    // Check if resource type changes from file to youtube and there's no link
    if (resourceType === 'youtube' && resource.resourceType !== 'youtube' && !link && !resource.link) {
      return res.status(400).json({ message: 'Link is required when changing resource type to YouTube' });
    }

    // Check if resource type changes from youtube to file and there's no media
    if (resourceType === 'file' && resource.resourceType !== 'file' && !mediaFile && !resource.media?.url) {
      return res.status(400).json({ message: 'Media file is required when changing resource type to file' });
    }

    // Handle media file update
    if (mediaFile) {
      // Delete old media from S3
      if (resource.media?.public_id) {
        await s3.deleteObject({
          Bucket: process.env.CDN_S3_BUCKET,
          Key: resource.media.public_id
        }).promise();
      }

      // Upload new media
      const mediaKey = `resources/${uuidv4()}-${mediaFile.originalname}`;
      const mediaUpload = await s3.upload({
        Bucket: process.env.CDN_S3_BUCKET,
        Key: mediaKey,
        Body: mediaFile.buffer,
        ContentType: mediaFile.mimetype,
      }).promise();

      const mediaType = mediaFile.mimetype.startsWith('image/') ? 'image' :
        mediaFile.mimetype.startsWith('video/') ? 'video' : 'file';

      resource.media = {
        type: mediaType,
        url: mediaUpload.Location,
        public_id: mediaUpload.Key
      };
    }

    // Handle banner update
    if (bannerFile) {
      // Delete old banner from S3
      if (resource.banner.public_id) {
        await s3.deleteObject({
          Bucket: process.env.CDN_S3_BUCKET,
          Key: resource.banner.public_id
        }).promise();
      }

      // Upload new banner
      const bannerKey = `resources/banners/${uuidv4()}-${bannerFile.originalname}`;
      const bannerUpload = await s3.upload({
        Bucket: process.env.CDN_S3_BUCKET,
        Key: bannerKey,
        Body: bannerFile.buffer,
        ContentType: bannerFile.mimetype,
      }).promise();

      resource.banner = {
        url: bannerUpload.Location,
        public_id: bannerUpload.Key
      };
    }

    resource.title = title || resource.title;
    resource.description = description || resource.description;
    resource.link = link || resource.link;
    if (resourceType) resource.resourceType = resourceType;
    if (category) resource.category = category;
    resource.updatedAt = Date.now();

    await resource.save();
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update resource', error: error.message });
  }
};

// Delete resource
exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Delete media from S3
    if (resource.media.public_id) {
      await s3.deleteObject({
        Bucket: process.env.CDN_S3_BUCKET,
        Key: resource.media.public_id
      }).promise();
    }

    // Delete banner from S3
    if (resource.banner.public_id) {
      await s3.deleteObject({
        Bucket: process.env.CDN_S3_BUCKET,
        Key: resource.banner.public_id
      }).promise();
    }

    await Resource.deleteOne({ _id: id });
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resource', error: error.message });
  }
};

exports.rejectBusinessAccount = async (req, res) => {
  const { sellerId } = req.params;
  const { reason, details } = req.body;

  try {
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Reset verification status and onboarding process
    seller.isVerified = false;
    seller.hasFilledVerificationDocuments = false;
    seller.onboardingProcess = 'rejected';

    // Set accountPending to false if it was true
    if (seller.accountPending) {
      seller.accountPending = false;
    }

    // Reset all onboarding progress flags
    seller.hasFilledAddress = false;
    seller.hasFilledWarehouseAddress = false;
    seller.hasFilledBankDetails = false;
    seller.hasFilledCategoryDetails = false;
    seller.hasFilledVerificationDocuments = false;
    seller.hasFilledBusinessAddress = false;

    // Clear existing verification documents
    if (seller.verificationDocuments && seller.verificationDocuments.documents) {
      seller.verificationDocuments.documents = [];
    }

    await seller.save();

    // Send rejection email to personal email
    const personalEmailMsg = {
      to: seller.email,
      from: 'Auqli Admin <support@auqli.com>',
      subject: 'Important: Your Auqli Business Account Application Status',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Verification Update</h2>
          <p>Dear ${seller.firstName},</p>
          <p>We have reviewed your business account application for Auqli. Unfortunately, we are unable to verify your account at this time.</p>
          
          <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Reason for Rejection:</h3>
            <p>${reason}</p>
            ${details ? `<p><strong>Additional Details:</strong> ${details}</p>` : ''}
          </div>

          <h3>Next Steps:</h3>
          <ul>
            <li>Review the rejection reason carefully</li>
            <li>Update your verification documents addressing the issues mentioned</li>
            <li>Resubmit your application through your seller dashboard</li>
          </ul>

          <p>If you need assistance or have any questions, please don't hesitate to contact our support team.</p>
          
          
          
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send to business email if it exists
    if (seller.businessEmail) {
      const businessEmailMsg = {
        to: seller.businessEmail,
        from: 'Auqli Admin <support@auqli.com>',
        subject: 'Business Account Verification Status - Action Required',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Business Account Verification Update</h2>
            <p>Dear ${seller.businessName || seller.firstName},</p>
            <p>Your business account verification for Auqli requires additional attention.</p>
            
            <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>Application Status: Not Verified</h3>
              <p><strong>Reason:</strong> ${reason}</p>
              ${details ? `<p><strong>Additional Information:</strong> ${details}</p>` : ''}
            </div>

            <h3>Required Actions:</h3>
            <ul>
              <li>Review and update your business documentation</li>
              <li>Ensure all submitted documents meet our verification requirements</li>
              <li>Resubmit your verification documents through the seller dashboard</li>
            </ul>

            <p>Business Details:</p>
            <ul>
              <li>Business Name: ${seller.businessName}</li>
              <li>Account Type: ${seller.accountType}</li>
              <li>Verification Status: Pending Resubmission</li>
            </ul>

            <p>For assistance with the verification process, please contact our business support team.</p>
            <p>Best regards,<br>Auqli Business Team</p>
          </div>
        `
      };
      await sgMail.send(businessEmailMsg);
    }

    await sgMail.send(personalEmailMsg);

    res.json({
      success: true,
      message: 'Account verification rejected successfully',
      seller
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject account verification',
      error: error.message
    });
  }
};

exports.updateCategoryPlatformFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { platformFee } = req.body;

    // Validate platform fee
    if (typeof platformFee !== 'number' || platformFee < 0) {
      return res.status(400).json({
        message: 'Platform fee must be a non-negative number'
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.platformFee = platformFee;
    await category.save();

    res.json({
      message: 'Platform fee updated successfully',
      category: {
        id: category._id,
        name: category.name,
        platformFee: category.platformFee
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update platform fee',
      error: error.message
    });
  }
};

// Verify bank account details
exports.verifyBankAccount = async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;

    const response = await paystack.get(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode || '044'}`);

    res.json({
      success: true,
      data: response.data.data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Could not verify account details',
      error: error.response?.data?.message || error.message
    });
  }
};

// Create transfer recipient
exports.createTransferRecipient = async (req, res) => {
  try {
    const { name, accountNumber, bankCode } = req.body;

    const response = await paystack.post('/transferrecipient', {
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN'
    });

    res.json({
      success: true,
      data: response.data.data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Could not create transfer recipient',
      error: error.response?.data?.message || error.message
    });
  }
};

// Initiate transfer for withdrawal
exports.initiateWithdrawalTransfer = async (req, res) => {
  console.log('Starting withdrawal transfer process...');
  const session = await mongoose.startSession();
  session.startTransaction();

  let withdrawal = null;

  try {
    console.log('Environment Check:', {
      nodeEnv: process.env.NODE_ENV,
      paystackKeyExists: !!process.env.PAYSTACK_SECRET_KEY
    });

    const { withdrawalId } = req.params;
    const { bankCode, accountNumber, accountName } = req.body;
    console.log('Processing withdrawal:', { withdrawalId, bankCode, accountNumber });

    withdrawal = await Withdrawal.findById(withdrawalId)
      .populate('seller')
      .session(session);

    if (!withdrawal) {
      throw new Error('Withdrawal request not found');
    }

    // Convert amount to kobo (Paystack uses kobo)
    const amountInKobo = Math.round(withdrawal.amount * 100);

    console.log('Amount calculation:', {
      amount: withdrawal.amount,
      amountInKobo: amountInKobo
    });

    try {
      // First verify the recipient's bank account
      const verifyAccount = await paystack.get(
        `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
      );

      console.log('Account verification:', {
        status: verifyAccount.data.status,
        accountName: verifyAccount.data.data.account_name
      });

      const recipientPayload = {
        type: 'nuban',
        name: verifyAccount.data.data.account_name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN'
      };
      console.log('Creating recipient with payload:', recipientPayload);

      const recipientResponse = await paystack.post('/transferrecipient', recipientPayload);
      console.log('Recipient created:', {
        recipientCode: recipientResponse.data.data.recipient_code,
        status: recipientResponse.data.status
      });

      const transferPayload = {
        source: 'balance',
        amount: amountInKobo,
        recipient: recipientResponse.data.data.recipient_code,
        reason: `Withdrawal payout - ${withdrawal.reference}`,
        currency: 'NGN'
      };
      console.log('Transfer payload:', transferPayload);

      const transferResponse = await paystack.post('/transfer', transferPayload);
      console.log('Transfer initiated:', {
        reference: transferResponse.data.data.reference,
        status: transferResponse.data.data.status,
        amount: transferResponse.data.data.amount / 100
      });

      withdrawal.status = 'processing';
      withdrawal.paymentInfo = {
        transferReference: transferResponse.data.data.reference,
        transferRecipientCode: recipientResponse.data.data.recipient_code,
        initiatedAt: new Date(),
        amount: withdrawal.amount,
        amountInKobo: amountInKobo,
        paystackStatus: transferResponse.data.data.status,
        lastChecked: new Date(),
        reference: transferResponse.data.data.reference
      };

      withdrawal.reference = transferResponse.data.data.reference;

      withdrawal.notes.push({
        content: `Transfer of ₦${withdrawal.amount.toLocaleString()} initiated to account ${withdrawal.bankDetails.accountNumber}`,
        addedBy: 'admin'
      });

      await withdrawal.save({ session });
      await session.commitTransaction();
      console.log('Transaction committed successfully');

      res.json({
        success: true,
        message: 'Transfer initiated successfully',
        data: {
          withdrawal,
          transfer: {
            reference: transferResponse.data.data.reference,
            amount: withdrawal.amount,
            status: transferResponse.data.status
          }
        }
      });

    } catch (paystackError) {
      console.error('Paystack Error Details:', {
        status: paystackError.response?.status,
        statusText: paystackError.response?.statusText,
        data: paystackError.response?.data,
        message: paystackError.message
      });

      // Handle specific Paystack errors
      const errorMessage = paystackError.response?.data?.message || paystackError.message;
      if (errorMessage.includes('balance is not enough')) {
        throw new Error(`Transfer failed: Insufficient Paystack balance for ₦${withdrawal.amount}. Please fund your Paystack account.`);
      } else if (errorMessage.includes('account number')) {
        throw new Error('Invalid bank account details. Please verify the account number and bank code.');
      } else {
        throw new Error(`Paystack error: ${errorMessage}`);
      }
    }

  } catch (error) {
    await session.abortTransaction();
    console.error('Transfer process error:', {
      message: error.message,
      type: error.name,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to initiate transfer',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Verify transfer status
exports.verifyTransferStatus = async (req, res) => {
  try {
    const { reference } = req.params;
    console.log('Verifying transfer status for reference:', reference);

    // Find withdrawal first
    const withdrawal = await Withdrawal.findOne({
      $or: [
        { 'paymentInfo.transferReference': reference },
        { reference: reference }
      ]
    });

    if (!withdrawal) {
      console.log('Withdrawal not found for reference:', reference);
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found',
        reference
      });
    }

    // Verify with Paystack
    const paystackResponse = await paystack.get(`/transfer/verify/${reference}`);
    const transferData = paystackResponse.data.data;

    console.log('Transfer status check:', {
      reference,
      status: transferData.status,
      currentWithdrawalStatus: withdrawal.status
    });

    // Handle different Paystack transfer statuses
    let newStatus;
    let message;

    switch (transferData.status) {
      case 'success':
        newStatus = 'completed';
        message = 'Transfer completed successfully';
        break;
      case 'failed':
        newStatus = 'failed';
        message = `Transfer failed: ${transferData.reason || 'No reason provided'}`;
        break;
      case 'otp':
        newStatus = 'processing';
        message = 'Transfer pending OTP verification';
        // Stop continuous polling for OTP status
        return res.json({
          success: true,
          data: {
            status: 'processing',
            message: 'Transfer requires OTP verification',
            requiresAction: true,
            withdrawal: {
              _id: withdrawal._id,
              status: 'processing',
              reference
            }
          }
        });
      case 'pending':
        newStatus = 'processing';
        message = 'Transfer is still processing';
        break;
      default:
        newStatus = withdrawal.status;
        message = `Transfer status: ${transferData.status}`;
    }

    // Only update if status has changed
    if (withdrawal.status !== newStatus) {
      withdrawal.status = newStatus;
      withdrawal.paymentInfo = {
        ...(withdrawal.paymentInfo || {}),
        transferReference: reference,
        lastChecked: new Date(),
        paystackStatus: transferData.status,
        statusDetails: transferData
      };

      withdrawal.notes.push({
        content: message,
        addedBy: 'system'
      });

      await withdrawal.save();

      // Send email notifications if status is final
      if (newStatus === 'completed' || newStatus === 'failed') {
        try {
          await sendStatusUpdateEmail(withdrawal);
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }
    }

    res.json({
      success: true,
      data: {
        status: newStatus,
        message,
        withdrawal: {
          _id: withdrawal._id,
          status: newStatus,
          reference,
          paymentInfo: withdrawal.paymentInfo
        },
        requiresAction: false
      }
    });

  } catch (error) {
    console.error('Transfer verification error:', {
      message: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to verify transfer status',
      error: error.message
    });
  }
};

// Add email notification function
async function sendStatusUpdateEmail(withdrawal) {
  const emailContent = {
    completed: {
      subject: 'Withdrawal Completed Successfully - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Withdrawal Completed</h2>
          <p>Dear ${withdrawal.seller.firstName},</p>
          <p>Your withdrawal request (Ref: ${withdrawal.reference}) has been completed successfully.</p>
          <p>Amount: ₦${withdrawal.amount.toLocaleString()}</p>
          <p>The funds have been transferred to your bank account.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    },
    failed: {
      subject: 'Withdrawal Transfer Failed - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Withdrawal Transfer Failed</h2>
          <p>Dear ${withdrawal.seller.firstName},</p>
          <p>We encountered an issue while processing your withdrawal (Ref: ${withdrawal.reference}).</p>
          <p>Our team has been notified and will investigate the issue.</p>
          <p>We will process your withdrawal as soon as possible.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    }
  };

  const template = emailContent[withdrawal.status];
  if (template) {
    await sgMail.send({
      to: withdrawal.seller.email,
      from: 'Auqli Admin <support@auqli.com>',
      subject: template.subject,
      html: template.html
    });
  }
}

// Also update the webhook handler to match the reference properly
exports.handlePaystackWebhook = async (req, res) => {
  // ... existing validation code ...

  try {
    const event = req.body;
    console.log('Received Paystack webhook:', {
      event: event.event,
      reference: event.data.reference
    });

    // Find withdrawal with more flexible matching
    const withdrawal = await Withdrawal.findOne({
      $or: [
        { 'paymentInfo.transferReference': event.data.reference },
        { reference: event.data.reference }
      ]
    });

    if (!withdrawal) {
      console.log('Withdrawal not found for webhook event:', event.data.reference);
      return res.sendStatus(200); // Still return 200 to acknowledge receipt
    }

    // ... rest of the webhook handling code ...
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

// Add new endpoint to finalize transfer
exports.finalizeTransfer = async (req, res) => {
  try {
    const { reference } = req.params;
    const { otp } = req.body; // Get OTP from request body
    console.log('Starting transfer finalization for reference:', reference);

    // Find withdrawal first
    const withdrawal = await Withdrawal.findOne({
      $or: [
        { 'paymentInfo.transferReference': reference },
        { reference: reference }
      ]
    }).populate('seller');

    if (!withdrawal) {
      console.log('Withdrawal not found for reference:', reference);
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found',
        reference
      });
    }

    // First get the transfer details to get the transfer_code
    const transferResponse = await paystack.get(`/transfer/verify/${reference}`);
    console.log('Transfer verification response:', {
      status: transferResponse.data.data.status,
      transfer_code: transferResponse.data.data.transfer_code,
      reference: transferResponse.data.data.reference
    });

    // Check if transfer is in OTP state
    if (transferResponse.data.data.status === 'otp') {
      const transfer_code = transferResponse.data.data.transfer_code;
      console.log('Attempting to finalize transfer with transfer_code:', transfer_code);

      try {
        const finalizeResponse = await paystack.post('/transfer/finalize_transfer', {
          transfer_code: transfer_code,
          otp
        });

        console.log('Finalize response:', {
          status: finalizeResponse.data.status,
          message: finalizeResponse.data.message,
          data: finalizeResponse.data.data
        });

        // Update withdrawal status
        withdrawal.status = 'processing';
        withdrawal.paymentInfo = {
          ...withdrawal.paymentInfo,
          lastChecked: new Date(),
          finalizeAttempted: true,
          finalizeResponse: finalizeResponse.data,
          transfer_code: transfer_code
        };

        await withdrawal.save();

        return res.json({
          success: true,
          message: 'Transfer finalized successfully',
          data: {
            status: finalizeResponse.data.data.status,
            reference,
            withdrawal: {
              _id: withdrawal._id,
              status: withdrawal.status
            }
          }
        });
      } catch (finalizeError) {
        console.error('Error in finalize request:', {
          message: finalizeError.message,
          response: finalizeError.response?.data
        });

        throw finalizeError;
      }
    } else {
      console.log('Transfer not in OTP state:', transferResponse.data.data.status);
      return res.json({
        success: false,
        message: `Transfer is not in OTP state (current status: ${transferResponse.data.data.status})`,
        data: {
          status: transferResponse.data.data.status,
          reference
        }
      });
    }

  } catch (error) {
    console.error('Error finalizing transfer:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to finalize transfer',
      error: error.response?.data?.message || error.message,
      details: {
        reference,
        errorType: error.name,
        paystackError: error.response?.data
      }
    });
  }
};

// Add this new function to recalculate category statistics
exports.recalculateCategoryStats = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get all categories
    const categories = await Category.find({}, null, { session });

    // Reset all category statistics
    await Category.updateMany({}, {
      $set: {
        'statistics.orders.pending': 0,
        'statistics.orders.completed': 0,
        'statistics.items.pending': 0,
        'statistics.items.sold': 0
      }
    }, { session });

    // Get all orders and their items
    const orders = await Order.find({})
      .populate({
        path: 'items.product',
        select: 'category'
      });

    // Create a map to store category statistics
    const categoryStats = {};

    // Process each order
    for (const order of orders) {
      for (const item of order.items) {
        if (!item.product || !item.product.category) continue;

        const category = item.product.category;

        if (!categoryStats[category]) {
          categoryStats[category] = {
            pending: { orders: 0, items: 0 },
            completed: { orders: 0, items: 0 }
          };
        }

        if (order.paid) {
          categoryStats[category].completed.orders++;
          categoryStats[category].completed.items += item.quantity;
        } else {
          categoryStats[category].pending.orders++;
          categoryStats[category].pending.items += item.quantity;
        }
      }
    }

    // Update each category with the calculated statistics
    for (const [categoryName, stats] of Object.entries(categoryStats)) {
      await Category.findOneAndUpdate(
        { name: categoryName },
        {
          $set: {
            'statistics.orders.pending': stats.pending.orders,
            'statistics.orders.completed': stats.completed.orders,
            'statistics.items.pending': stats.pending.items,
            'statistics.items.sold': stats.completed.items
          }
        },
        { session }
      );
    }

    await session.commitTransaction();

    // Get updated categories
    const updatedCategories = await Category.find().sort({
      'statistics.orders.completed': -1,
      'statistics.orders.pending': -1
    });

    res.json({
      message: 'Category statistics recalculated successfully',
      categories: updatedCategories
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error recalculating category statistics:', error);
    res.status(500).json({
      message: 'Failed to recalculate category statistics',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Get all bank account change requests
exports.getAllBankChangeRequests = async (req, res) => {
  try {
    const requests = await BankChangeRequest.find()
      .populate('seller', 'firstName lastName email businessName storeName')
      .sort({ requestDate: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch bank change requests',
      error: error.message
    });
  }
};

// Get bank change requests statistics
exports.getBankChangeRequestStats = async (req, res) => {
  try {
    const stats = await BankChangeRequest.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          approved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
            }
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const defaultStats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    const finalStats = stats.length > 0 ? stats[0] : defaultStats;
    delete finalStats._id;

    return res.json({
      success: true,
      data: finalStats
    });

  } catch (error) {
    console.error('Error getting bank change request stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get bank change request statistics',
      error: error.message
    });
  }
};

// Approve bank change request
exports.approveBankChangeRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const request = await BankChangeRequest.findById(id)
      .populate('seller')
      .session(session);

    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Bank change request not found' });
    }

    if (request.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'This request has already been processed' });
    }

    // Update seller's bank details
    const seller = request.seller;
    seller.bankDetails = request.newBankDetails;
    await seller.save({ session });

    // Update request status
    request.status = 'approved';
    request.processedDate = new Date();
    request.processedBy = req.user.id;
    await request.save({ session });

    // Send email notification to seller
    const emailMsg = {
      to: seller.email,
      from: 'Auqli Admin <support@auqli.com>',
      subject: 'Bank Account Change Request Approved',
      html: `
        <h2>Bank Account Change Request Approved</h2>
        <p>Dear ${seller.firstName},</p>
        <p>Your request to change your bank account details has been approved.</p>
        <p>Your bank details have been updated with the following information:</p>
        <ul>
          <li>Bank Name: ${request.newBankDetails.bankName}</li>
          <li>Account Name: ${request.newBankDetails.accountName}</li>
          <li>Account Number: ${request.newBankDetails.accountNumber}</li>
        </ul>
        <p>If you did not request this change, please contact our support team immediately.</p>
      `
    };

    await sgMail.send(emailMsg);
    await session.commitTransaction();

    res.json({
      message: 'Bank change request approved successfully',
      request
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: 'Failed to approve bank change request',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Reject bank change request
exports.rejectBankChangeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const request = await BankChangeRequest.findById(id)
      .populate('seller');

    if (!request) {
      return res.status(404).json({ message: 'Bank change request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been processed' });
    }

    // Update request status
    request.status = 'rejected';
    request.processedDate = new Date();
    request.processedBy = req.user.id;
    request.rejectionReason = rejectionReason;
    await request.save();

    // Send email notification to seller
    const emailMsg = {
      to: request.seller.email,
      from: 'Auqli Admin <support@auqli.com>',
      subject: 'Bank Account Change Request Rejected',
      html: `
        <h2>Bank Account Change Request Rejected</h2>
        <p>Dear ${request.seller.firstName},</p>
        <p>Your request to change your bank account details has been rejected.</p>
        <p>Reason: ${rejectionReason || 'No reason provided'}</p>
        <p>If you would like to submit a new request, please ensure you address the reason for rejection.</p>
      `
    };

    await sgMail.send(emailMsg);

    res.json({
      message: 'Bank change request rejected successfully',
      request
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to reject bank change request',
      error: error.message
    });
  }
};

// ... rest of the code ...

/**
 * Process a bank change request (approve or reject)
 */
exports.processBankChangeRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const requestId = req.params.id;
    const isApproval = req.path.endsWith('/approve');
    const { rejectionReason } = req.body;

    // Find the bank change request
    const request = await BankChangeRequest.findById(requestId)
      .populate('seller')
      .session(session);

    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Bank change request not found'
      });
    }

    if (request.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    if (isApproval) {
      // Update seller's bank details
      const seller = await Seller.findByIdAndUpdate(
        request.seller._id,
        { bankDetails: request.newBankDetails },
        { new: true, session }
      );

      if (!seller) {
        throw new Error('Failed to update seller bank details');
      }

      request.status = 'approved';
      request.processedAt = new Date();
      request.processedBy = req.user._id;
      await request.save({ session });

      // Send approval email to seller
      await sgMail.send({
        to: request.seller.email,
        from: process.env.SENDGRID_FROM_EMAIL || 'Auqli Admin <support@auqli.com>',
        subject: 'Bank Account Change Request Approved',
        html: `
          <h2>Bank Account Change Request Approved</h2>
          <p>Dear ${request.seller.firstName},</p>
          <p>Your request to change your bank account details has been approved.</p>
          <p>Your bank details have been updated with the following information:</p>
          <ul>
            <li>Bank Name: ${request.newBankDetails.bankName}</li>
            <li>Account Name: ${request.newBankDetails.accountName}</li>
            <li>Account Number: ${request.newBankDetails.accountNumber}</li>
          </ul>
          <p>If you did not request this change, please contact our support team immediately.</p>
        `
      });

    } else {
      // Rejection
      if (!rejectionReason) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      request.status = 'rejected';
      request.rejectionReason = rejectionReason;
      request.processedAt = new Date();
      request.processedBy = req.user._id;
      await request.save({ session });

      // Send rejection email to seller
      await sgMail.send({
        to: request.seller.email,
        from: process.env.SENDGRID_FROM_EMAIL || 'Auqli Admin <support@auqli.com>',
        subject: 'Bank Account Change Request Rejected',
        html: `
          <h2>Bank Account Change Request Rejected</h2>
          <p>Dear ${request.seller.firstName},</p>
          <p>Your request to change your bank account details has been rejected.</p>
          <p>Reason: ${rejectionReason}</p>
          <p>If you would like to submit a new request, please ensure you address the reason for rejection.</p>
        `
      });
    }

    await session.commitTransaction();

    return res.json({
      success: true,
      message: `Bank change request ${isApproval ? 'approved' : 'rejected'} successfully`,
      request: {
        id: request._id,
        status: request.status,
        processedAt: request.processedAt
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error processing bank change request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process bank change request',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Get bank change requests statistics
exports.getBankChangeRequestStats = async (req, res) => {
  try {
    const stats = await BankChangeRequest.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          approved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
            }
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const defaultStats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    const finalStats = stats.length > 0 ? stats[0] : defaultStats;
    delete finalStats._id;

    return res.json({
      success: true,
      data: finalStats
    });

  } catch (error) {
    console.error('Error getting bank change request stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get bank change request statistics',
      error: error.message
    });
  }
};

// Get financial transactions with filtering
exports.getFinancialTransactions = async (req, res) => {
  try {
    const {
      type,
      status,
      startDate,
      endDate,
      sellerId,
      reference,
      limit = 20,
      page = 1
    } = req.query;

    // Build query
    const query = {};

    // Filter by type
    if (type) {
      if (type === 'inflow') {
        query.type = { $in: ['order_payment', 'platform_fee', 'processing_fee'] };
      } else if (type === 'outflow') {
        query.type = 'withdrawal';
      }
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Filter by seller
    if (sellerId) {
      query.seller = sellerId;
    }

    // Filter by reference (orderId or withdrawal reference)
    if (reference) {
      const orders = await Order.find({ order_id: { $regex: reference, $options: 'i' } });
      const orderIds = orders.map(order => order._id);

      const withdrawals = await Withdrawal.find({ reference: { $regex: reference, $options: 'i' } });

      if (orderIds.length > 0) {
        query.orderId = { $in: orderIds };
      } else if (withdrawals.length > 0) {
        // For withdrawals, we need to map to the related transactions
        const withdrawalSellerIds = withdrawals.map(w => w.seller);
        const withdrawalReferences = withdrawals.map(w => w.reference);

        query.$or = [
          {
            seller: { $in: withdrawalSellerIds },
            type: 'withdrawal',
            description: { $regex: withdrawalReferences.join('|'), $options: 'i' }
          }
        ];
      } else {
        // If no matching orders or withdrawals, return empty results
        return res.json({
          success: true,
          data: {
            transactions: [],
            pagination: {
              total: 0,
              page: parseInt(page),
              limit: parseInt(limit),
              pages: 0
            }
          }
        });
      }
    }

    // Count total matching transactions
    const total = await Transaction.countDocuments(query);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pages = Math.ceil(total / parseInt(limit));

    // Get transactions with pagination and populate seller
    const transactions = await Transaction.find(query)
      .populate('seller', 'firstName lastName email storeName')
      .populate('orderId', 'order_id buyer')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Populate buyer information for relevant transactions
    const populatedTransactions = await Promise.all(transactions.map(async transaction => {
      let transactionObj = transaction.toObject();

      // Find associated buyer for order_payment transactions
      if (transaction.orderId) {
        const order = transaction.orderId;
        if (order.buyer) {
          const buyer = await Buyer.findById(order.buyer).select('firstName lastName email');
          if (buyer) {
            transactionObj.buyerInfo = {
              id: buyer._id,
              name: `${buyer.firstName} ${buyer.lastName}`,
              email: buyer.email
            };
          }
        }
      }

      return transactionObj;
    }));

    // Format transactions for the UI response
    const formattedTransactions = populatedTransactions.map(transaction => {
      // Determine type (inflow/outflow) and category
      let type = 'inflow';
      let category = 'other';

      if (transaction.type === 'withdrawal') {
        type = 'outflow';
        category = 'withdrawal';
      } else if (transaction.type === 'order_payment') {
        type = 'inflow';
        category = 'order';
      } else if (transaction.type === 'platform_fee' || transaction.type === 'processing_fee') {
        type = 'inflow';
        category = 'fee';
      }

      return {
        id: transaction._id,
        reference: transaction.orderId ? transaction.orderId.order_id :
          (transaction.reference || `TXN-${transaction._id.toString().slice(-8)}`),
        type,
        category,
        amount: transaction.amount,
        status: transaction.status,
        sender: type === 'inflow' ?
          (transaction.buyerInfo ? `${transaction.buyerInfo.name}` :
            (transaction.seller ? `${transaction.seller.firstName} ${transaction.seller.lastName}` : 'Unknown')) :
          'Auqli Platform',
        recipient: type === 'outflow' ?
          (transaction.seller ? `${transaction.seller.firstName} ${transaction.seller.lastName}` : 'Unknown') :
          'Auqli Platform',
        description: transaction.description,
        date: transaction.createdAt
      };
    });

    res.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages
        }
      }
    });
  } catch (error) {
    console.error('Error fetching financial transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial transactions',
      error: error.message
    });
  }
};

// Get financial summary
exports.getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date range filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate totals
    const inflowTransactions = await Transaction.aggregate([
      {
        $match: {
          ...dateFilter,
          type: { $in: ['order_payment', 'platform_fee', 'processing_fee'] },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          orderPayments: { $sum: { $cond: [{ $eq: ['$type', 'order_payment'] }, '$amount', 0] } },
          platformFees: { $sum: { $cond: [{ $eq: ['$type', 'platform_fee'] }, '$amount', 0] } },
          processingFees: { $sum: { $cond: [{ $eq: ['$type', 'processing_fee'] }, '$amount', 0] } }
        }
      }
    ]);

    const outflowTransactions = await Transaction.aggregate([
      {
        $match: {
          ...dateFilter,
          type: 'withdrawal',
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const pendingTransactions = await Transaction.aggregate([
      {
        $match: {
          ...dateFilter,
          status: 'pending'
        }
      },
      {
        $group: {
          _id: '$type',
          amount: { $sum: '$amount' }
        }
      }
    ]);

    // Format the response
    const totalInflow = inflowTransactions.length > 0 ? inflowTransactions[0].total : 0;
    const totalOutflow = outflowTransactions.length > 0 ? outflowTransactions[0].total : 0;
    const netBalance = totalInflow - totalOutflow;

    const pendingAmount = pendingTransactions.reduce((sum, item) => sum + item.amount, 0);

    // Additional breakdowns
    const revenueBreakdown = inflowTransactions.length > 0 ? {
      orderPayments: inflowTransactions[0].orderPayments || 0,
      platformFees: inflowTransactions[0].platformFees || 0,
      processingFees: inflowTransactions[0].processingFees || 0
    } : {
      orderPayments: 0,
      platformFees: 0,
      processingFees: 0
    };

    // Get pending withdrawals count
    const pendingWithdrawals = await Withdrawal.countDocuments({
      status: 'pending',
      ...(dateFilter.createdAt ? { requestDate: dateFilter.createdAt } : {})
    });

    res.json({
      success: true,
      data: {
        totalInflow,
        totalOutflow,
        netBalance,
        pendingAmount,
        revenueBreakdown,
        pendingWithdrawals
      }
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial summary',
      error: error.message
    });
  }
};

// Get transaction details
exports.getTransactionDetails = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId)
      .populate('seller', 'firstName lastName email storeName walletBalance')
      .populate('orderId', 'order_id buyer items totalAmount shipping paymentInfo');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // For order-related transactions, get buyer info
    let buyerInfo = null;
    if (transaction.orderId && transaction.orderId.buyer) {
      const buyer = await Buyer.findById(transaction.orderId.buyer)
        .select('firstName lastName email');

      if (buyer) {
        buyerInfo = {
          id: buyer._id,
          name: `${buyer.firstName} ${buyer.lastName}`,
          email: buyer.email
        };
      }
    }

    // Format the transaction for the response
    const formattedTransaction = {
      id: transaction._id,
      reference: transaction.orderId ? transaction.orderId.order_id :
        (transaction.reference || `TXN-${transaction._id.toString().slice(-8)}`),
      type: transaction.type === 'withdrawal' ? 'outflow' : 'inflow',
      category: transaction.type === 'order_payment' ? 'order' :
        (transaction.type === 'withdrawal' ? 'withdrawal' : 'fee'),
      amount: transaction.amount,
      status: transaction.status,
      date: transaction.createdAt,
      description: transaction.description,
      metadata: transaction.metadata || {},
      seller: transaction.seller ? {
        id: transaction.seller._id,
        name: `${transaction.seller.firstName} ${transaction.seller.lastName}`,
        email: transaction.seller.email,
        storeName: transaction.seller.storeName,
        walletBalance: transaction.seller.walletBalance
      } : null,
      order: transaction.orderId ? {
        id: transaction.orderId._id,
        reference: transaction.orderId.order_id,
        totalAmount: transaction.orderId.totalAmount,
        paymentMethod: transaction.orderId.paymentInfo?.method,
        paymentStatus: transaction.orderId.paymentInfo?.status
      } : null,
      buyer: buyerInfo,
      bankDetails: transaction.bankDetails
    };

    res.json({
      success: true,
      data: formattedTransaction
    });
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction details',
      error: error.message
    });
  }
};

// Get financial trends (monthly breakdown)
exports.getFinancialTrends = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    // Get monthly data for the specified year
    const startDate = new Date(parseInt(year), 0, 1); // January 1st
    const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59); // December 31st

    // Query for monthly revenue data
    const monthlyRevenue = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          type: { $in: ['order_payment', 'platform_fee', 'processing_fee'] },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            type: '$type'
          },
          amount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.month': 1 }
      }
    ]);

    // Query for monthly payouts data
    const monthlyPayouts = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          type: 'withdrawal',
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          amount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.month': 1 }
      }
    ]);

    // Format response data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize data arrays with zeros for all months
    const revenue = Array(12).fill(0);
    const platformFees = Array(12).fill(0);
    const processingFees = Array(12).fill(0);
    const payouts = Array(12).fill(0);

    // Fill in actual data
    monthlyRevenue.forEach(item => {
      const monthIndex = item._id.month - 1;
      if (item._id.type === 'order_payment') {
        revenue[monthIndex] = item.amount;
      } else if (item._id.type === 'platform_fee') {
        platformFees[monthIndex] = item.amount;
      } else if (item._id.type === 'processing_fee') {
        processingFees[monthIndex] = item.amount;
      }
    });

    monthlyPayouts.forEach(item => {
      const monthIndex = item._id.month - 1;
      payouts[monthIndex] = item.amount;
    });

    // Calculate net revenue (platform + processing fees)
    const netRevenue = platformFees.map((fee, index) => fee + processingFees[index]);

    res.json({
      success: true,
      data: {
        labels: monthNames,
        datasets: {
          revenue,
          platformFees,
          processingFees,
          netRevenue,
          payouts
        },
        year: parseInt(year)
      }
    });
  } catch (error) {
    console.error('Error fetching financial trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial trends',
      error: error.message
    });
  }
};

// Get seller financial summary
exports.getSellerFinancialSummary = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Verify seller exists
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Get seller's total revenue
    const revenue = await Transaction.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(sellerId),
          type: 'order_payment',
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get seller's total fees paid
    const fees = await Transaction.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(sellerId),
          type: { $in: ['platform_fee', 'processing_fee'] },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          amount: { $sum: '$amount' }
        }
      }
    ]);

    // Get seller's total withdrawals
    const withdrawals = await Transaction.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(sellerId),
          type: 'withdrawal',
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format the response
    const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;
    const totalSales = revenue.length > 0 ? revenue[0].count : 0;

    const platformFees = fees.find(f => f._id === 'platform_fee');
    const processingFees = fees.find(f => f._id === 'processing_fee');
    const totalFees = (platformFees ? platformFees.amount : 0) + (processingFees ? processingFees.amount : 0);

    const totalWithdrawals = withdrawals.length > 0 ? withdrawals[0].total : 0;
    const withdrawalCount = withdrawals.length > 0 ? withdrawals[0].count : 0;

    const netIncome = totalRevenue - totalFees;
    const currentBalance = seller.walletBalance || 0;

    res.json({
      success: true,
      data: {
        sellerId: seller._id,
        sellerName: `${seller.firstName} ${seller.lastName}`,
        storeName: seller.storeName,
        totalRevenue,
        totalSales,
        fees: {
          platformFees: platformFees ? platformFees.amount : 0,
          processingFees: processingFees ? processingFees.amount : 0,
          totalFees
        },
        netIncome,
        withdrawals: {
          total: totalWithdrawals,
          count: withdrawalCount
        },
        currentBalance
      }
    });
  } catch (error) {
    console.error('Error fetching seller financial summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller financial summary',
      error: error.message
    });
  }
};

// ... existing code ...

// Get all streams with filtering
exports.getAllStreams = async (req, res) => {
  try {
    const {
      status,
      sellerName,
      dateRange,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build query object
    const query = {};

    // Filter by status
    if (status && ['scheduled', 'live', 'ended', 'expired'].includes(status)) {
      query.status = status;
    }

    // Filter by date range
    if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
    }

    // Find sellers by name if provided
    if (sellerName) {
      const sellers = await Seller.find({
        $or: [
          { firstName: { $regex: sellerName, $options: 'i' } },
          { lastName: { $regex: sellerName, $options: 'i' } },
          { storeName: { $regex: sellerName, $options: 'i' } }
        ]
      }).select('_id');

      if (sellers.length > 0) {
        query.seller = { $in: sellers.map(seller => seller._id) };
      } else {
        // If no sellers match, return empty result
        return res.json({
          success: true,
          data: {
            streams: [],
            pagination: {
              total: 0,
              page: parseInt(page),
              limit: parseInt(limit),
              pages: 0
            }
          }
        });
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Determine sort order
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Count total matching streams
    const total = await Stream.countDocuments(query);
    const pages = Math.ceil(total / parseInt(limit));

    // Fetch streams with pagination and populate seller information
    const streams = await Stream.find(query)
      .populate('seller', 'firstName lastName email storeName')
      .populate('viewers', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Format response
    const formattedStreams = streams.map(stream => {
      return {
        id: stream._id,
        title: stream.title,
        description: stream.description,
        status: stream.status,
        type: stream.type,
        category: stream.category,
        seller: stream.seller ? {
          id: stream.seller._id,
          name: `${stream.seller.firstName} ${stream.seller.lastName}`,
          email: stream.seller.email,
          storeName: stream.seller.storeName
        } : null,
        productsCount: stream.products ? stream.products.length : 0,
        viewersCount: stream.viewers ? stream.viewers.length : 0,
        scheduledStartTime: stream.scheduledStartTime,
        actualStartTime: stream.actualStartTime,
        endTime: stream.endTime,
        duration: stream.actualStartTime && stream.endTime
          ? Math.round((new Date(stream.endTime) - new Date(stream.actualStartTime)) / 60000) // in minutes
          : null,
        createdAt: stream.createdAt,
        coverImageUrl: stream.coverImage ? stream.coverImage.url : null,
        bidCount: stream.bids ? stream.bids.length : 0,
        cancelled: stream.cancelledStream || false
      };
    });

    res.json({
      success: true,
      data: {
        streams: formattedStreams,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages
        }
      }
    });
  } catch (error) {
    console.error('Error fetching streams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch streams',
      error: error.message
    });
  }
};

// Get detailed stream information
exports.getStreamDetails = async (req, res) => {
  try {
    const { streamId } = req.params;

    const stream = await Stream.findById(streamId)
      .populate('seller', 'firstName lastName email storeName')
      .populate('viewers', 'firstName lastName email')
      .populate('bids.buyer', 'firstName lastName email')
      .populate('departedViewers.buyer', 'firstName lastName email');

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }

    // Format response
    const formattedStream = {
      id: stream._id,
      title: stream.title,
      description: stream.description,
      status: stream.status,
      type: stream.type,
      category: stream.category,
      seller: stream.seller ? {
        id: stream.seller._id,
        name: `${stream.seller.firstName} ${stream.seller.lastName}`,
        email: stream.seller.email,
        storeName: stream.seller.storeName
      } : null,
      products: stream.products ? stream.products.map(product => ({
        id: product._id,
        productData: product.product,
        minBid: product.minBid,
        maxBid: product.maxBid,
        currentBid: product.currentBid,
        currentBidder: product.currentBidder
      })) : [],
      viewers: stream.viewers ? stream.viewers.map(viewer => ({
        id: viewer._id,
        name: `${viewer.firstName} ${viewer.lastName}`,
        email: viewer.email
      })) : [],
      departedViewers: stream.departedViewers ? stream.departedViewers.map(record => ({
        viewer: {
          id: record.buyer?._id,
          name: record.buyer ? `${record.buyer.firstName} ${record.buyer.lastName}` : 'Unknown',
          email: record.buyer?.email
        },
        timestamp: record.timestamp
      })) : [],
      bids: stream.bids ? stream.bids.map(bid => ({
        bidder: {
          id: bid.buyer?._id,
          name: bid.buyer ? `${bid.buyer.firstName} ${bid.buyer.lastName}` : 'Unknown',
          email: bid.buyer?.email
        },
        product: bid.product,
        amount: bid.amount,
        timestamp: bid.timestamp
      })) : [],
      scheduledStartTime: stream.scheduledStartTime,
      actualStartTime: stream.actualStartTime,
      endTime: stream.endTime,
      duration: stream.actualStartTime && stream.endTime
        ? Math.round((new Date(stream.endTime) - new Date(stream.actualStartTime)) / 60000) // in minutes
        : null,
      createdAt: stream.createdAt,
      coverImage: stream.coverImage,
      video: stream.video,
      channelName: stream.channelName,
      cancelled: stream.cancelledStream || false,
      tags: stream.tags || [],
      chatInteractions: stream.chatInteractions || []
    };

    res.json({
      success: true,
      data: formattedStream
    });
  } catch (error) {
    console.error('Error fetching stream details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stream details',
      error: error.message
    });
  }
};

// Get stream analytics
exports.getStreamAnalytics = async (req, res) => {
  try {
    // Overall stream stats
    const totalStreams = await Stream.countDocuments();
    const liveStreams = await Stream.countDocuments({ status: 'live' });
    const completedStreams = await Stream.countDocuments({ status: 'ended' });
    const scheduledStreams = await Stream.countDocuments({ status: 'scheduled' });

    // Get streams with viewer data to calculate average viewers
    const streams = await Stream.find({ status: 'ended' });

    let totalViewers = 0;
    let totalDuration = 0;
    let totalBids = 0;

    streams.forEach(stream => {
      totalViewers += stream.viewers.length + (stream.departedViewers?.length || 0);

      // Calculate duration if both start and end times exist
      if (stream.actualStartTime && stream.endTime) {
        const duration = (new Date(stream.endTime) - new Date(stream.actualStartTime)) / 60000; // in minutes
        totalDuration += duration;
      }

      totalBids += stream.bids?.length || 0;
    });

    const averageViewers = streams.length > 0 ? Math.round(totalViewers / streams.length) : 0;
    const averageDuration = streams.length > 0 ? Math.round(totalDuration / streams.length) : 0;
    const averageBids = streams.length > 0 ? Math.round(totalBids / streams.length) : 0;

    // Category breakdown
    const categoryBreakdown = await Stream.aggregate([
      { $match: { status: { $in: ['live', 'ended'] } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Monthly stream counts (for the current year)
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const monthlyStreamCounts = await Stream.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Format monthly data for all months
    const monthlyData = Array(12).fill(0);
    monthlyStreamCounts.forEach(item => {
      const monthIndex = item._id - 1; // Convert 1-based month to 0-based index
      monthlyData[monthIndex] = item.count;
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalStreams,
          liveStreams,
          completedStreams,
          scheduledStreams,
          averageViewers,
          averageDuration,
          averageBids
        },
        categoryBreakdown: categoryBreakdown.map(category => ({
          category: category._id || 'Uncategorized',
          count: category.count
        })),
        monthlyTrends: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          data: monthlyData
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stream analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stream analytics',
      error: error.message
    });
  }
};

// ... existing code ...

const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');

exports.bulkUploadProducts = async (req, res) => {
  try {
    const { sellerId } = req.body;

    // Validate seller exists
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    // Create a readable stream from the uploaded file buffer
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const results = [];
    const errors = [];

    // Process the CSV file
    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('error', (error) => reject(error))
        .on('end', () => resolve());
    });

    if (!results.length) {
      return res.status(400).json({
        success: false,
        message: 'No product data found in the CSV file'
      });
    }

    // Validate CSV structure
    const requiredColumns = [
      'product name',
      'product main price'
    ];

    // Check if the first row has the required columns
    const firstRow = results[0];
    const missingColumns = requiredColumns.filter(col =>
      !Object.keys(firstRow).some(key => key.toLowerCase() === col.toLowerCase())
    );

    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `CSV file is missing required columns: ${missingColumns.join(', ')}`,
        availableColumns: Object.keys(firstRow)
      });
    }

    // Group rows by product name to handle variants
    const productGroups = {};

    for (const [index, productData] of results.entries()) {
      const productName = productData['product name'];

      if (!productName) {
        errors.push({
          row: index + 1,
          error: 'Product name is required'
        });
        continue;
      }

      if (!productGroups[productName]) {
        productGroups[productName] = {
          baseProduct: productData,
          variants: []
        };
      } else if (productData['is variant'] === 'true' || productData['is variant'] === 'yes' || productData['is variant'] === '1') {
        productGroups[productName].variants.push({
          data: productData,
          rowIndex: index + 1
        });
      } else {
        errors.push({
          row: index + 1,
          productName: productName,
          error: 'Duplicate product name without variant flag'
        });
      }
    }

    // Process each product group
    const createdProducts = [];

    for (const [productName, group] of Object.entries(productGroups)) {
      try {
        const baseProductData = group.baseProduct;

        // Skip rows with empty product name
        if (!baseProductData['product name']) {
          errors.push({
            row: results.indexOf(baseProductData) + 1,
            error: 'Product name is required'
          });
          continue;
        }

        // Map CSV fields to product model fields
        const parsedWeight = baseProductData['product weight'] ? parseFloat(baseProductData['product weight']) : 0;
        // Use default weight of 0.5 if weight is 0 or null
        const finalWeight = (!parsedWeight || parsedWeight === 0) ? 0.5 : parsedWeight;

        const parsedInventory = baseProductData['product inventory'] ? parseInt(baseProductData['product inventory']) : 1;
        const parsedPrice = baseProductData['product main price'] ? parseFloat(baseProductData['product main price']) : 0;

        if (isNaN(parsedPrice) || parsedPrice <= 0) {
          errors.push({
            row: results.indexOf(baseProductData) + 1,
            productName: baseProductData['product name'],
            error: 'Invalid price value'
          });
          continue;
        }

        // Check if upload status is 'active'
        if (baseProductData['upload status'] &&
          baseProductData['upload status'].toLowerCase() !== 'active') {
          errors.push({
            row: results.indexOf(baseProductData) + 1,
            productName: baseProductData['product name'],
            error: 'Skipped product with non-active upload status'
          });
          continue;
        }

        // Prepare variants array if any
        const variants = [];
        let totalStock = parsedInventory;

        // Process variants if they exist
        if (group.variants && group.variants.length > 0) {
          // Process main variants (e.g., Color)
          const variantsByType = {};

          for (const variantItem of group.variants) {
            const variantData = variantItem.data;
            const variantName = variantData['variant name']; // e.g., "Color"
            const variantValue = variantData['variant value']; // e.g., "Red"

            if (!variantName || !variantValue) {
              errors.push({
                row: variantItem.rowIndex,
                productName: productName,
                error: 'Variant name and value are required for variants'
              });
              continue;
            }

            const variantPrice = variantData['variant price'] ? parseFloat(variantData['variant price']) : parsedPrice;
            const variantStock = variantData['variant stock'] ? parseInt(variantData['variant stock']) : 1;
            const variantImage = variantData['variant image'] || baseProductData['product main image'] || 'https://static.vecteezy.com/system/resources/thumbnails/044/424/989/small/premium-quality-pure-white-product-package-box-with-natural-light-ultra-clear-digital-render-free-photo.jpeg';

            // Add to total stock
            totalStock += variantStock;

            // Create or update variant
            if (!variantsByType[variantName]) {
              variantsByType[variantName] = [];
            }

            // Check for sub-variants
            const subVariants = [];
            if (variantData['subvariant name'] && variantData['subvariant value']) {
              const subVariantName = variantData['subvariant name']; // e.g., "Size"
              const subVariantValue = variantData['subvariant value']; // e.g., "Small"
              const subVariantPrice = variantData['subvariant price'] ? parseFloat(variantData['subvariant price']) : variantPrice;
              const subVariantStock = variantData['subvariant stock'] ? parseInt(variantData['subvariant stock']) : variantStock;
              const subVariantImage = variantData['subvariant image'] || variantImage;

              // Check for sub-sub-variants
              const subSubVariants = [];
              if (variantData['subsubvariant name'] && variantData['subsubvariant value']) {
                const subSubVariantName = variantData['subsubvariant name']; // e.g., "Material"
                const subSubVariantValue = variantData['subsubvariant value']; // e.g., "Cotton"
                const subSubVariantPrice = variantData['subsubvariant price'] ? parseFloat(variantData['subsubvariant price']) : subVariantPrice;
                const subSubVariantStock = variantData['subsubvariant stock'] ? parseInt(variantData['subsubvariant stock']) : subVariantStock;
                const subSubVariantImage = variantData['subsubvariant image'] || subVariantImage;

                subSubVariants.push({
                  name: subSubVariantName,
                  value: subSubVariantValue,
                  price: subSubVariantPrice,
                  stock: subSubVariantStock,
                  images: [{
                    data: subSubVariantImage,
                    contentType: 'image/jpeg',
                    isDefault: true
                  }]
                });
              }

              subVariants.push({
                name: subVariantName,
                value: subVariantValue,
                price: subVariantPrice,
                stock: subVariantStock,
                images: [{
                  data: subVariantImage,
                  contentType: 'image/jpeg'
                }],
                subSubVariants: subSubVariants
              });
            }

            variantsByType[variantName].push({
              value: variantValue,
              price: variantPrice,
              totalStock: variantStock,
              images: [{
                data: variantImage,
                contentType: 'image/jpeg'
              }],
              subVariants: subVariants
            });
          }

          // Convert variantsByType to variants array
          for (const [variantName, variantValues] of Object.entries(variantsByType)) {
            for (const variantValue of variantValues) {
              variants.push({
                name: variantName,
                value: variantValue.value,
                price: variantValue.price,
                totalStock: variantValue.totalStock,
                images: variantValue.images,
                subVariants: variantValue.subVariants
              });
            }
          }
        }

        // Create the product with validated data
        const product = new Product({
          name: baseProductData['product name'],
          description: baseProductData['product description'] || `Description for ${baseProductData['product name']}`,
          price: parsedPrice,
          category: baseProductData['product main category'] || 'Other',
          subCategory: baseProductData['product subcategory'] || '',
          status: 'active',
          seller: sellerId,
          stock: totalStock,
          condition: baseProductData['product condition'] || 'New',
          images: [
            {
              url: baseProductData['product main image'] || 'https://static.vecteezy.com/system/resources/thumbnails/044/424/989/small/premium-quality-pure-white-product-package-box-with-natural-light-ultra-clear-digital-render-free-photo.jpeg'
            },
            ...[1, 2, 3, 4, 5].map(index => {
              const imageUrl = baseProductData[`product image ${index}`];
              return imageUrl ? { url: imageUrl.trim() } : null;
            }).filter(Boolean)
          ],
          weight: finalWeight,
          shipping: {
            freeShipping: false,
            shippingClass: 'standard'
          },
          inventory: {
            quantity: totalStock
          },
          variants: variants
        });

        await product.save();
        createdProducts.push({
          id: product._id,
          name: product.name,
          price: product.price,
          category: product.category,
          image: product.images[0]?.url,
          variantsCount: variants.length
        });
      } catch (error) {
        console.error('Error creating product:', error);
        errors.push({
          productName: productName,
          error: error.message
        });
      }
    }

    // Update seller's product count and send emails
    if (createdProducts.length > 0 || errors.length > 0) {
      try {
        if (createdProducts.length > 0) {
          await Seller.findByIdAndUpdate(sellerId, {
            $inc: { 'stats.totalProducts': createdProducts.length }
          });
        }

        // Send email notification to seller
        await sendBulkUploadEmail(seller, createdProducts, results.length, errors.length, errors);
      } catch (error) {
        console.error('Failed to update seller stats or send email:', error);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Successfully processed ${createdProducts.length} products with ${errors.length} errors`,
      results: {
        createdProducts,
        errors,
        totalProcessed: results.length
      }
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process bulk upload',
      error: error.message
    });
  }
};

// Helper function to send bulk upload email notification
async function sendBulkUploadEmail(seller, products, totalProcessed, errorsCount, errors = []) {
  try {
    // Get up to 5 products to display in the email
    const productsToDisplay = products.slice(0, 5);

    // Create product list HTML
    const productListHTML = productsToDisplay.map(product => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <img src="${product.image}" alt="${product.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${product.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${product.category}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">₦${product.price.toLocaleString()}</td>
      </tr>
    `).join('');

    // Create error list HTML (up to 10 errors)
    const errorsToDisplay = errors.slice(0, 10);
    const errorListHTML = errorsToDisplay.length > 0
      ? errorsToDisplay.map(error => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${error.row}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${error.productName || 'N/A'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${error.error}</td>
        </tr>
      `).join('')
      : '';

    // Error section for admin email
    const errorSection = errorsCount > 0
      ? `
        <h3 style="margin-top: 20px; color: #333;">Failed Products (${errorsCount} total)</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Row</th>
              <th style="padding: 10px; text-align: left;">Product Name</th>
              <th style="padding: 10px; text-align: left;">Error</th>
            </tr>
          </thead>
          <tbody>
            ${errorListHTML}
          </tbody>
        </table>
        ${errors.length > 10 ? `<p style="text-align: center; font-style: italic; margin-top: 10px;">And ${errors.length - 10} more errors...</p>` : ''}
      `
      : '';

    // Error note for seller email (without detailed errors)
    const sellerErrorNote = errorsCount > 0
      ? `
        <div style="background-color: #fff0f0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
          <p style="margin: 0; color: #c53030;"><strong>Note:</strong> Some products could not be uploaded due to errors. Please contact support for more details.</p>
        </div>
      `
      : '';

    // Email content for seller
    const sellerEmailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Bulk Product Upload Completed</h2>
        <p>Hello ${seller.firstName || seller.businessName},</p>
        <p>We're excited to inform you that a bulk product upload has been completed for your store by an administrator. Here's a summary:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Total products processed:</strong> ${totalProcessed}</p>
          <p><strong>Successfully uploaded:</strong> ${products.length}</p>
          <p><strong>Errors encountered:</strong> ${errorsCount}</p>
        </div>
        
        <h3 style="margin-top: 20px; color: #333;">Sample of Uploaded Products</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Image</th>
              <th style="padding: 10px; text-align: left;">Product Name</th>
              <th style="padding: 10px; text-align: left;">Category</th>
              <th style="padding: 10px; text-align: left;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${productListHTML}
          </tbody>
        </table>
        
        ${products.length > 5 ? `<p style="text-align: center; font-style: italic; margin-top: 10px;">And ${products.length - 5} more products...</p>` : ''}
        
        ${sellerErrorNote}
        
        <div style="background-color: #fff8e1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #7d6608;"><strong>Note:</strong> For any products where weight was not specified, a default weight of 0.5kg has been assigned to the product's weight field. You can update product weights in your store dashboard if needed.</p>
        </div>
        
        <p style="margin-top: 20px;">You can view and manage all your products in your seller dashboard.</p>
        
        <p style="margin-top: 30px;">Thank you for selling with Auqli!</p>
        <p>Best regards,<br>The Auqli Team</p>
      </div>
    `;

    // Email content for admin
    const adminEmailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Bulk Product Upload Report</h2>
        <p>A bulk product upload has been completed by an administrator for seller: ${seller.businessName || seller.firstName} ${seller.lastName || ''}.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Seller ID:</strong> ${seller._id}</p>
          <p><strong>Seller Email:</strong> ${seller.email}</p>
          <p><strong>Total products processed:</strong> ${totalProcessed}</p>
          <p><strong>Successfully uploaded:</strong> ${products.length}</p>
          <p><strong>Errors encountered:</strong> ${errorsCount}</p>
        </div>
        
        <h3 style="margin-top: 20px; color: #333;">Sample of Uploaded Products</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Image</th>
              <th style="padding: 10px; text-align: left;">Product Name</th>
              <th style="padding: 10px; text-align: left;">Category</th>
              <th style="padding: 10px; text-align: left;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${productListHTML}
          </tbody>
        </table>
        
        ${products.length > 5 ? `<p style="text-align: center; font-style: italic; margin-top: 10px;">And ${products.length - 5} more products...</p>` : ''}
        
        ${errorSection}
      </div>
    `;

    // Send the email to seller using SendGrid
    const sellerMsg = {
      to: seller.email,
      from: 'Auqli Support <support@auqli.com>',
      subject: 'Bulk Product Upload Completed - Auqli',
      html: sellerEmailHTML,
    };

    // Send the email to admin using SendGrid
    const adminMsg = {
      to: 'admin@auqli.com',
      from: 'Auqli Support <support@auqli.com>',
      subject: `Bulk Upload Report: ${seller.businessName || seller.firstName} (${products.length} success, ${errorsCount} errors)`,
      html: adminEmailHTML,
    };

    await Promise.all([
      sgMail.send(sellerMsg),
      sgMail.send(adminMsg)
    ]);

    console.log(`Bulk upload notification emails sent to ${seller.email} and admin@auqli.com`);

  } catch (error) {
    console.error('Error sending bulk upload email:', error);
    // Don't throw error to prevent API failure
  }
}

exports.downloadProductCsvTemplate = async (req, res) => {
  try {
    // Define the CSV header row with all the supported columns
    const headers = [
      'product name',
      'product main price',
      'product main image',
      'product image 1',
      'product image 2',
      'product image 3',
      'product image 4',
      'product image 5',
      'product description',
      'product weight',
      'product inventory',
      'product condition',
      'product main category',
      'product subcategory',
      'upload status',
      'is variant',
      'variant name',
      'variant value',
      'variant price',
      'variant stock',
      'variant image',
      'subvariant name',
      'subvariant value',
      'subvariant price',
      'subvariant stock',
      'subvariant image'
    ].join(',');

    // Create sample data rows
    const sampleRows = [
      // Sample 1: Fashion item
      [
        'Ocean Blue Shirt',
        '50',
        'https://burst.shopifycdn.com/photos/example1.jpg',
        'https://burst.shopifycdn.com/photos/example1-back.jpg',
        'https://burst.shopifycdn.com/photos/example1-detail.jpg',
        'https://burst.shopifycdn.com/photos/example1-side.jpg',
        'https://burst.shopifycdn.com/photos/example1-model.jpg',
        'https://burst.shopifycdn.com/photos/example1-closeup.jpg',
        'Ocean blue cotton shirt for women',
        '0.5',
        '10',
        'New',
        'Fashion',
        'Women Fashion',
        'active',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ].join(','),

      // Sample 2: Wearable Tech
      [
        'Yellow Wool Jumper',
        '80',
        'https://burst.shopifycdn.com/photos/example2.jpg',
        'https://burst.shopifycdn.com/photos/example2-side.jpg',
        'https://burst.shopifycdn.com/photos/example2-back.jpg',
        'https://burst.shopifycdn.com/photos/example2-detail.jpg',
        'https://burst.shopifycdn.com/photos/example2-model.jpg',
        '',
        'Knitted jumper in yellow color',
        '0.8',
        '5',
        'New',
        'Wearable Tech',
        'Smartwatches',
        'active',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ].join(','),

      // Add an empty row for users to fill in
      Array(headers.split(',').length).fill('').join(',')
    ];

    // Combine headers and sample rows
    const csvContent = [headers, ...sampleRows].join('\n');

    // Set response headers for CSV file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="product_upload_template.csv"');

    // Send the CSV content
    return res.status(200).send(csvContent);

  } catch (error) {
    console.error('Error generating CSV template:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate CSV template',
      error: error.message
    });
  }
};

exports.deleteBuyerAccount = async (req, res) => {
  const { buyerId } = req.params;

  try {
    // Find the buyer first to make sure they exist and to get their email
    const buyer = await Buyer.findById(buyerId);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    // Store buyer details for sending email
    const buyerEmail = buyer.email;
    const buyerName = `${buyer.firstName} ${buyer.lastName}`;

    // Delete the buyer account
    await Buyer.findByIdAndDelete(buyerId);

    // Send email notification to the buyer
    const emailMsg = {
      to: buyerEmail,
      from: 'Auqli Admin <support@auqli.com>',
      subject: 'Your Auqli Account Has Been Deleted',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Deletion Notification</h2>
          <p>Dear ${buyerName},</p>
          <p>We regret to inform you that your account on Auqli has been deleted by our administration team.</p>
          <p>This action may have been taken due to:</p>
          <ul>
            <li>Violation of our terms of service</li>
            <li>Account inactivity for an extended period</li>
            <li>Multiple community guideline violations</li>
            <li>At your request through customer support</li>
          </ul>
          <p>If you believe this was done in error or have any questions, please contact our support team at support@auqli.com</p>
          <p>Best regards,<br>Auqli Support Team</p>
        </div>
      `
    };

    await sgMail.send(emailMsg);

    // Send successful response
    res.status(200).json({
      success: true,
      message: 'Buyer account deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting buyer account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete buyer account',
      error: error.message
    });
  }
};

exports.getAllBuyerTransactions = async (req, res) => {
  try {
    const { startDate, endDate, type, page = 1, limit = 20 } = req.query;
    const queryPage = parseInt(page);
    const queryLimit = parseInt(limit);
    const skip = (queryPage - 1) * queryLimit;

    // Build filter
    const filter = {};

    // Date filter
    if (startDate || endDate) {
      filter['wallet.transactions.createdAt'] = {};
      if (startDate) {
        filter['wallet.transactions.createdAt'].$gte = new Date(startDate);
      }
      if (endDate) {
        filter['wallet.transactions.createdAt'].$lte = new Date(endDate);
      }
    }

    // Type filter
    if (type && type !== 'all') {
      filter['wallet.transactions.type'] = type;
    }

    // Aggregate to unwind transaction arrays and filter
    const aggregation = [
      {
        $match: {
          'wallet.transactions': { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$wallet.transactions' },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          username: 1,
          transaction: '$wallet.transactions'
        }
      }
    ];

    // Apply date filter if specified
    if (startDate || endDate) {
      let dateMatch = { $match: { 'transaction.createdAt': {} } };
      if (startDate) {
        dateMatch.$match['transaction.createdAt'].$gte = new Date(startDate);
      }
      if (endDate) {
        dateMatch.$match['transaction.createdAt'].$lte = new Date(endDate);
      }
      aggregation.push(dateMatch);
    }

    // Apply type filter if specified
    if (type && type !== 'all') {
      aggregation.push({
        $match: { 'transaction.type': type }
      });
    }

    // Count total documents for pagination
    const countPipeline = [...aggregation];
    countPipeline.push({ $count: 'total' });
    const countResult = await Buyer.aggregate(countPipeline);
    const totalTransactions = countResult.length > 0 ? countResult[0].total : 0;

    // Add sorting, pagination
    aggregation.push(
      { $sort: { 'transaction.createdAt': -1 } },
      { $skip: skip },
      { $limit: queryLimit }
    );

    // Execute query
    const transactions = await Buyer.aggregate(aggregation);

    // Format the response with pagination info
    res.json({
      success: true,
      data: transactions,
      pagination: {
        total: totalTransactions,
        page: queryPage,
        limit: queryLimit,
        pages: Math.ceil(totalTransactions / queryLimit)
      }
    });
  } catch (error) {
    console.error('Error fetching buyer transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buyer transactions',
      error: error.message
    });
  }
};

exports.getAllSellerTransactions = async (req, res) => {
  try {
    const { startDate, endDate, type, page = 1, limit = 20 } = req.query;
    const queryPage = parseInt(page);
    const queryLimit = parseInt(limit);
    const skip = (queryPage - 1) * queryLimit;

    // Build filter
    const filter = {};

    // Date filter
    if (startDate || endDate) {
      filter['wallet.transactions.createdAt'] = {};
      if (startDate) {
        filter['wallet.transactions.createdAt'].$gte = new Date(startDate);
      }
      if (endDate) {
        filter['wallet.transactions.createdAt'].$lte = new Date(endDate);
      }
    }

    // Type filter
    if (type && type !== 'all') {
      filter['wallet.transactions.type'] = type;
    }

    // Aggregate to unwind transaction arrays and filter
    const aggregation = [
      {
        $match: {
          'wallet.transactions': { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$wallet.transactions' },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          storeName: 1,
          email: 1,
          businessName: 1,
          businessEmail: 1,
          transaction: '$wallet.transactions'
        }
      }
    ];

    // Apply date filter if specified
    if (startDate || endDate) {
      let dateMatch = { $match: { 'transaction.createdAt': {} } };
      if (startDate) {
        dateMatch.$match['transaction.createdAt'].$gte = new Date(startDate);
      }
      if (endDate) {
        dateMatch.$match['transaction.createdAt'].$lte = new Date(endDate);
      }
      aggregation.push(dateMatch);
    }

    // Apply type filter if specified
    if (type && type !== 'all') {
      aggregation.push({
        $match: { 'transaction.type': type }
      });
    }

    // Count total documents for pagination
    const countPipeline = [...aggregation];
    countPipeline.push({ $count: 'total' });
    const countResult = await Seller.aggregate(countPipeline);
    const totalTransactions = countResult.length > 0 ? countResult[0].total : 0;

    // Add sorting, pagination
    aggregation.push(
      { $sort: { 'transaction.createdAt': -1 } },
      { $skip: skip },
      { $limit: queryLimit }
    );

    // Execute query
    const transactions = await Seller.aggregate(aggregation);

    // Format the response with pagination info
    res.json({
      success: true,
      data: transactions,
      pagination: {
        total: totalTransactions,
        page: queryPage,
        limit: queryLimit,
        pages: Math.ceil(totalTransactions / queryLimit)
      }
    });
  } catch (error) {
    console.error('Error fetching seller transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller transactions',
      error: error.message
    });
  }
};

// ... existing code ...

/**
 * Get detailed information about a specific seller including metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSellerDetails = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seller ID format'
      });
    }

    // Find the seller with all information
    const seller = await Seller.findById(sellerId).lean();

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Get additional metrics and counts
    const [
      ordersCount,
      postsCount,
      streamsCount,
      productsCount,
      transactions,
      campaignsCount,
      conversationsCount
    ] = await Promise.all([
      Order.countDocuments({ seller: sellerId }),
      Post.countDocuments({ 'author.userId': sellerId, 'author.userModel': 'Seller' }),
      Stream.countDocuments({ seller: sellerId }),
      Product.find({ seller: sellerId }).countDocuments(),
      Transaction.find({ seller: sellerId }).sort({ createdAt: -1 }).limit(10).lean(),
      Campaign.countDocuments({ seller: sellerId }),
      Conversation.countDocuments({ 'participants': { $elemMatch: { id: sellerId, model: 'Seller' } } })
    ]);

    // Get recent orders
    const recentOrders = await Order.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('buyer', 'firstName lastName email')
      .lean();

    // Get recent streams
    const recentStreams = await Stream.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get all campaigns with basic info
    const campaigns = await Campaign.find({ seller: sellerId })
      .select('title status stats createdAt scheduledFor')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Calculate total revenue and sales
    const revenue = await Order.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId), paid: true, isStale: { $ne: true } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Calculate sales by month (for the last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const salesByMonth = await Order.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
          paid: true,
          isStale: { $ne: true },
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSales: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get withdrawal history
    const withdrawals = await Withdrawal.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Format the response
    const sellerDetails = {
      seller,
      metrics: {
        ordersCount,
        postsCount,
        streamsCount,
        productsCount,
        campaignsCount,
        conversationsCount,
        followersCount: seller.followers ? seller.followers.length : 0,
        totalRevenue: revenue.length > 0 ? revenue[0].total : 0,
        walletBalance: seller.walletBalance || 0,
        averageRating: seller.stats?.averageRating || 0,
        totalReviews: seller.stats?.totalReviews || 0
      },
      recentActivity: {
        orders: recentOrders,
        streams: recentStreams,
        transactions,
        campaigns,
        withdrawals
      },
      analytics: {
        salesByMonth,
        storeVisits: seller.storeVisits || 0,
        monthlyStats: seller.monthlyStats || {}
      }
    };

    res.status(200).json({
      success: true,
      data: sellerDetails
    });
  } catch (error) {
    console.error('Error fetching seller details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller details',
      error: error.message
    });
  }
};

/**
 * Update seller information by admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateSellerInfo = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seller ID format'
      });
    }

    // Find the seller
    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Extract update fields from request body
    const {
      // Personal info
      firstName,
      lastName,
      email,
      phoneNumber,

      // Business info
      businessName,
      businessType,
      businessEmail,
      businessNumber,
      taxInformation,
      accountType,

      // Business address
      businessAddress,

      // Seller address
      sellerAddress,

      // Warehouse details
      warehouseDetails,

      // Bank details
      bankDetails,

      // Store details
      storeName,
      aboutStore,
      socialMedia,

      // Store settings
      operatingHours,
      timezone,
      storePolicy,
      offersStorePickup,

      // Status flags
      isVerified,
      isFeatured,
      isDisabled,
      accountPending
    } = req.body;

    // Update personal information
    if (firstName) seller.firstName = firstName;
    if (lastName) seller.lastName = lastName;
    if (email) seller.email = email;
    if (phoneNumber) seller.phoneNumber = phoneNumber;

    // Update business information
    if (businessName) seller.businessName = businessName;
    if (businessType) seller.businessType = businessType;
    if (businessEmail) seller.businessEmail = businessEmail;
    if (businessNumber) seller.businessNumber = businessNumber;
    if (taxInformation) seller.taxInformation = taxInformation;
    if (accountType) seller.accountType = accountType;

    // Update addresses
    if (businessAddress) seller.businessAddress = businessAddress;
    if (sellerAddress) seller.sellerAddress = sellerAddress;
    if (warehouseDetails) seller.warehouseDetails = warehouseDetails;

    // Update bank details
    if (bankDetails) seller.bankDetails = bankDetails;

    // Update store details
    if (storeName) seller.storeName = storeName;
    if (aboutStore) seller.aboutStore = aboutStore;
    if (socialMedia) seller.socialMedia = socialMedia;

    // Update store settings
    if (operatingHours) seller.operatingHours = operatingHours;
    if (timezone) seller.timezone = timezone;
    if (storePolicy) seller.storePolicy = storePolicy;
    if (offersStorePickup !== undefined) seller.offersStorePickup = offersStorePickup;

    // Update status flags
    if (isVerified !== undefined) seller.isVerified = isVerified;
    if (isFeatured !== undefined) seller.isFeatured = isFeatured;
    if (isDisabled !== undefined) seller.isDisabled = isDisabled;
    if (accountPending !== undefined) seller.accountPending = accountPending;

    // Update completion flags based on the provided information
    if (sellerAddress) seller.hasFilledAddress = true;
    if (warehouseDetails?.address) seller.hasFilledWarehouseAddress = true;
    if (bankDetails?.accountNumber && bankDetails?.bankName) seller.hasFilledBankDetails = true;
    if (businessAddress) seller.hasFilledBusinessAddress = true;

    // Save the updated seller
    const updatedSeller = await seller.save();

    // Create admin activity log for this update
    // (If you have an activity logging system)

    // Send notification to seller about the account update (optional)
    try {
      const emailMsg = {
        to: updatedSeller.email,
        from: 'Auqli Admin <support@auqli.com>',
        subject: 'Your Seller Account Has Been Updated',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Account Update</h2>
            <p>Dear ${updatedSeller.firstName},</p>
            <p>We're writing to inform you that an administrator has updated information on your seller account.</p>
            <p>If you have any questions or concerns about these changes, please contact our support team at support@auqli.com.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `
      };

      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send(emailMsg);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Continue execution despite email error
    }

    res.status(200).json({
      success: true,
      message: 'Seller information updated successfully',
      seller: updatedSeller
    });
  } catch (error) {
    console.error('Error updating seller information:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update seller information',
      error: error.message
    });
  }
};

/**
 * Revoke a seller's verification status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.revokeSellerVerification = async (req, res) => {
  const { sellerId } = req.params;

  try {
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Set verification status to false
    seller.isVerified = false;
    await seller.save();

    // Send notification emails
    const personalEmailMsg = {
      to: seller.email,
      from: 'Auqli Admin <support@auqli.com>',
      subject: 'Important: Verification Status Update - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verification Status Update</h2>
          <p>Dear ${seller.firstName},</p>
          <p>This is to inform you that your verification status on Auqli has been revoked. This change may affect some of your seller capabilities.</p>
          <p>If you have any questions or need clarification about this change, please contact our support team.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send to business email if it exists
    if (seller.businessEmail) {
      const businessEmailMsg = {
        to: seller.businessEmail,
        from: 'Auqli Admin <support@auqli.com>',
        subject: 'Important: Business Account Verification Status Update - Auqli',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Business Account Verification Update</h2>
            <p>Dear ${seller.businessName || seller.firstName},</p>
            <p>We're writing to inform you that your business account verification status on Auqli has been revoked.</p>
            <p>Business Details:</p>
            <ul>
              <li>Business Name: ${seller.businessName}</li>
              <li>Account Type: ${seller.accountType}</li>
              <li>Verification Status: Not Verified</li>
            </ul>
            <p>If you have any questions about this change or need assistance, please contact our business support team.</p>
            <p>Best regards,<br>Auqli Business Team</p>
          </div>
        `
      };
      await sgMail.send(businessEmailMsg);
    }

    await sgMail.send(personalEmailMsg);

    res.json({
      success: true,
      message: 'Seller verification revoked successfully',
      seller
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to revoke seller verification',
      error: error.message
    });
  }
};

/**
 * Mark a seller as international
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.markSellerAsInternational = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seller ID format'
      });
    }

    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // If seller is already marked as international, return success
    if (seller.isInternational) {
      return res.status(200).json({
        success: true,
        message: 'Seller is already marked as international',
        seller: {
          _id: seller._id,
          firstName: seller.firstName,
          lastName: seller.lastName,
          businessName: seller.businessName,
          email: seller.email,
          isInternational: seller.isInternational
        }
      });
    }

    // Update seller to international status
    seller.isInternational = true;
    await seller.save();

    // Send email notification
    const { sendInternationalSellerEmail } = require('../utils/emailService');
    await sendInternationalSellerEmail(seller);

    res.status(200).json({
      success: true,
      message: 'Seller has been marked as international successfully',
      seller: {
        _id: seller._id,
        firstName: seller.firstName,
        lastName: seller.lastName,
        businessName: seller.businessName,
        email: seller.email,
        isInternational: seller.isInternational
      }
    });

  } catch (error) {
    console.error('Error marking seller as international:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark seller as international',
      error: error.message
    });
  }
};

/**
 * Revoke a seller's international status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.revokeSellerInternationalStatus = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seller ID format'
      });
    }

    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // If seller is not marked as international, return message
    if (!seller.isInternational) {
      return res.status(200).json({
        success: true,
        message: 'Seller is not marked as international',
        seller: {
          _id: seller._id,
          firstName: seller.firstName,
          lastName: seller.lastName,
          businessName: seller.businessName,
          email: seller.email,
          isInternational: seller.isInternational
        }
      });
    }

    // Update seller to revoke international status
    seller.isInternational = false;
    await seller.save();

    res.status(200).json({
      success: true,
      message: 'Seller international status has been revoked successfully',
      seller: {
        _id: seller._id,
        firstName: seller.firstName,
        lastName: seller.lastName,
        businessName: seller.businessName,
        email: seller.email,
        isInternational: seller.isInternational
      }
    });

  } catch (error) {
    console.error('Error revoking seller international status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke seller international status',
      error: error.message
    });
  }
};

/**
 * Delete/Cancel a Fez delivery order
 * This allows admins to manually cancel a Fez shipment by providing the order number
 */
exports.deleteFezOrder = async (req, res) => {
  try {
    const { orderNo } = req.params;

    if (!orderNo) {
      return res.status(400).json({
        success: false,
        message: 'Fez order number is required'
      });
    }

    console.log(`🚫 Admin attempting to cancel Fez order: ${orderNo}`);

    // Get a fresh authentication token for Fez Delivery
    const axios = require('axios');
    const FEZ_API_URL = process.env.FEZ_API_URL;

    // Function to get Fez auth token
    const getFezAuthToken = async () => {
      try {
        const authUrl = `${FEZ_API_URL}/user/authenticate`;
        const authData = {
          user_id: process.env.FEZ_USER_ID,
          password: process.env.FEZ_PASSWORD
        };

        const response = await axios.post(authUrl, authData);

        if (response.data && response.data.status === 'Success' && response.data.authDetails) {
          return response.data.authDetails.authToken;
        } else {
          throw new Error('Failed to authenticate with Fez Delivery');
        }
      } catch (error) {
        console.error('Fez authentication error:', error.message);
        throw new Error(`Failed to authenticate with Fez Delivery: ${error.message}`);
      }
    };

    const authToken = await getFezAuthToken();
    console.log('Using fresh token for Fez order cancellation:', authToken.substring(0, 10) + '...');

    let cancellationSuccessful = false;
    let responseData = null;

    // Try the DELETE endpoint first
    try {
      console.log(`Attempting to cancel Fez order using DELETE method: ${orderNo}`);

      const deleteResponse = await axios.delete(`${FEZ_API_URL}/order`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'secret-key': process.env.FEZ_SECRET_KEY,
          'Content-Type': 'application/json'
        },
        data: {
          orderNo: orderNo
        }
      });

      if (deleteResponse.data && deleteResponse.data.status === 'Success') {
        console.log('Fez order cancellation successful using DELETE method:', deleteResponse.data);
        cancellationSuccessful = true;
        responseData = deleteResponse.data;
      } else {
        console.log('Fez order cancellation using DELETE method failed:', deleteResponse.data);
      }
    } catch (deleteError) {
      console.log('Error during DELETE method cancellation:', deleteError.message);
      if (deleteError.response) {
        console.log('DELETE Error response data:', deleteError.response.data);
      }
    }

    // If DELETE method failed, try the POST endpoint
    if (!cancellationSuccessful) {
      try {
        console.log(`Attempting to cancel Fez order using POST method: ${orderNo}`);

        const postResponse = await axios.post(
          `${FEZ_API_URL}/order/cancel/${orderNo}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'secret-key': process.env.FEZ_SECRET_KEY,
              'Content-Type': 'application/json'
            }
          }
        );

        if (postResponse.data && postResponse.data.status === 'Success') {
          console.log('Fez order cancellation successful using POST method:', postResponse.data);
          cancellationSuccessful = true;
          responseData = postResponse.data;
        } else {
          console.log('Fez order cancellation using POST method failed:', postResponse.data);
        }
      } catch (postError) {
        console.log('Error during POST method cancellation:', postError.message);
        if (postError.response) {
          console.log('POST Error response data:', postError.response.data);
        }
      }
    }

    // Look for any orders in our system with this Fez order number
    const Order = require('../models/Order');
    const orders = await Order.find({
      $or: [
        { 'shipping.tracking.number': orderNo },
        { 'shipping.fez_order_number': orderNo },
        { 'shipping.shipment_id': orderNo }
      ]
    });

    // Also check for any return shipments with this order number
    const Return = require('../models/Return');
    const returns = await Return.find({
      'returnShipment.shipment_id': orderNo
    });

    // Update our database for found orders
    if (orders.length > 0) {
      for (const order of orders) {
        // Create new tracking entry
        const newTrackingEntry = {
          status: 'cancelled',
          description: `Shipment cancelled by admin`,
          timestamp: new Date()
        };

        // Update order shipping information
        await Order.findByIdAndUpdate(
          order._id,
          {
            $set: {
              'shipping.tracking.status': 'cancelled',
              'shipping.tracking.lastUpdate': new Date()
            },
            $push: {
              'shipping.tracking.history': newTrackingEntry
            }
          }
        );

        console.log(`Updated order ${order.order_id} with cancelled shipping status`);
      }
    }

    // Update return shipments if found
    if (returns.length > 0) {
      for (const returnDoc of returns) {
        await Return.findByIdAndUpdate(
          returnDoc._id,
          {
            $set: {
              'returnShipment.tracking.status': 'cancelled',
              'returnShipment.tracking.lastUpdate': new Date()
            },
            $push: {
              'returnShipment.tracking.history': {
                status: 'cancelled',
                timestamp: new Date(),
                description: 'Return shipment cancelled by admin'
              },
              'timeline': {
                status: 'RETURN_CANCELLED',
                date: new Date(),
                note: 'Return shipment cancelled by admin',
                updatedBy: 'admin'
              }
            }
          }
        );

        console.log(`Updated return request ${returnDoc._id} with cancelled shipping status`);
      }
    }

    if (cancellationSuccessful) {
      return res.status(200).json({
        success: true,
        message: 'Fez order cancelled successfully',
        data: responseData,
        affectedOrders: orders.map(o => ({ id: o._id, order_id: o.order_id })),
        affectedReturns: returns.map(r => ({ id: r._id }))
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Failed to cancel Fez order. The order might not exist or has already been cancelled.',
        affectedOrders: orders.map(o => ({ id: o._id, order_id: o.order_id })),
        affectedReturns: returns.map(r => ({ id: r._id }))
      });
    }

  } catch (error) {
    console.error('Error cancelling Fez order:', error);
    return res.status(500).json({
      success: false,
      message: 'Error cancelling Fez order',
      error: error.message
    });
  }
};

// Bulk update product conditions for a seller
exports.bulkUpdateProductCondition = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { condition } = req.body;

    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seller ID format'
      });
    }

    // Check if seller exists
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Validate condition
    if (!condition || typeof condition !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid condition value is required'
      });
    }

    // Normalize condition value (case-insensitive)
    const validConditions = ['new', 'fairly-used'];
    const normalizedCondition = condition.toLowerCase();

    if (!validConditions.includes(normalizedCondition)) {
      return res.status(400).json({
        success: false,
        message: 'Condition must be either "New" or "Fairly-Used"'
      });
    }

    // Format condition with proper capitalization
    const formattedCondition = normalizedCondition === 'new' ? 'New' : 'Fairly-Used';

    // Update all products for this seller
    const updateResult = await Product.updateMany(
      { seller: sellerId },
      { $set: { condition: formattedCondition } }
    );

    // Send email notification to seller
    const products = await Product.find({ seller: sellerId }).select('name');
    await sendBulkConditionUpdateEmail(seller, formattedCondition, products.length);

    return res.status(200).json({
      success: true,
      message: `Successfully updated condition to "${formattedCondition}" for all products`,
      updatedCount: updateResult.modifiedCount,
      totalProducts: updateResult.matchedCount
    });
  } catch (error) {
    console.error('Bulk update product condition error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update product conditions',
      error: error.message
    });
  }
};

// Email function for bulk condition update
async function sendBulkConditionUpdateEmail(seller, condition, totalProducts) {
  try {
    const subject = `Product Condition Update - ${seller.storeName || seller.businessName || 'Your Store'}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Product Condition Update</h2>
        <p>Hello ${seller.firstName || 'Seller'},</p>
        <p>We're writing to inform you that an admin has updated the condition of all your products to <strong>${condition}</strong>.</p>
        <p><strong>Total products affected:</strong> ${totalProducts}</p>
        <p>If you believe this change was made in error, please contact our support team.</p>
        <p>Thank you for selling on our platform!</p>
        <p>Best regards,<br>The Admin Team</p>
      </div>
    `;

    await emailService.sendEmail(seller.email, subject, emailHtml);
    console.log(`Bulk condition update email sent to seller ${seller._id}`);
  } catch (error) {
    console.error('Error sending bulk condition update email:', error);
    // Don't throw error, just log it - we don't want to fail the API response if just the email fails
  }
}

exports.searchProducts = async (req, res) => {
  try {
    // Extract pagination parameters from query with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Extract search parameters from query
    const {
      query,
      minPrice,
      maxPrice,
      category,
      subCategory,
      sellerId,
      status,
      sortBy,
      sortOrder
    } = req.query;

    // Build search filter
    const filter = {};

    // Search in name, description, or SKU if query is provided
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { 'inventory.sku': { $regex: query, $options: 'i' } }
      ];
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    // Category filters
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;

    // Seller filter
    if (sellerId) filter.seller = sellerId;

    // Status filter
    if (status) filter.status = status;

    // Build sort options
    let sort = { createdAt: -1 }; // Default sort by newest

    if (sortBy) {
      sort = {};
      const order = sortOrder === 'asc' ? 1 : -1;

      // Map frontend sort fields to MongoDB fields
      switch (sortBy) {
        case 'name':
          sort.name = order;
          break;
        case 'price':
          sort.price = order;
          break;
        case 'popularity':
          sort['stats.views'] = order;
          break;
        case 'sold':
          sort['stats.soldCount'] = order;
          break;
        case 'created':
        default:
          sort.createdAt = order;
      }
    }

    // Count total matching products for pagination metadata
    const totalProducts = await Product.countDocuments(filter);

    // Get paginated products with populated seller information
    const products = await Product.find(filter)
      .populate('seller', 'firstName lastName businessName email storeName storeAvatar isVerified')
      .skip(skip)
      .limit(limit)
      .sort(sort);

    // Return paginated response
    res.json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      productsPerPage: limit,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error.message
    });
  }
};

exports.getPlatformMetrics = async (req, res) => {
  try {
    // Collect counts from all main models
    const [
      totalBuyers,
      totalSellers,
      totalProducts,
      totalOrders,
      totalStreams,
      totalTransactions,
      totalWithdrawals,
      totalBankChangeRequests
    ] = await Promise.all([
      Buyer.countDocuments(),
      Seller.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Stream.countDocuments(),
      Transaction.countDocuments(),
      Withdrawal.countDocuments(),
      BankChangeRequest.countDocuments()
    ]);

    // Get active/inactive users based on actual activity
    const [buyersWithOrders, sellersWithProducts] = await Promise.all([
      Order.distinct('buyer', {
        buyer: { $ne: null },
        paid: true,
        isStale: { $ne: true },
        items: { $not: { $elemMatch: { status: 'cancelled' } } }
      }),
      Product.distinct('seller', { seller: { $ne: null } })
    ]);
    const activeBuyers = buyersWithOrders.length;
    const activeSellers = await Seller.countDocuments({ _id: { $in: sellersWithProducts }, isDisabled: false });

    // Get verification stats
    const [
      verifiedSellers,
      pendingVerificationSellers,
      identityVerifiedBuyers
    ] = await Promise.all([
      Seller.countDocuments({ isVerified: true }),
      Seller.countDocuments({ isVerified: false, 'verificationDocuments.documents': { $exists: true, $ne: [] } }),
      Buyer.countDocuments({ isIdentityVerified: true })
    ]);

    // Get order status metrics
    const [
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      ordersWithReturns,
      ordersWithDisputes
    ] = await Promise.all([
      Order.countDocuments({ 'items.status': 'pending' }),
      Order.countDocuments({ 'items.status': 'processing' }),
      Order.countDocuments({ 'items.status': 'shipped' }),
      Order.countDocuments({ 'items.status': 'delivered' }),
      Order.countDocuments({ 'items.status': 'cancelled' }),
      Order.countDocuments({ 'orderStatus.hasReturn': true }),
      Order.countDocuments({ 'orderStatus.hasDispute': true })
    ]);

    // Get withdrawal status metrics
    const [
      pendingWithdrawals,
      processingWithdrawals,
      completedWithdrawals,
      rejectedWithdrawals
    ] = await Promise.all([
      Withdrawal.countDocuments({ status: 'pending' }),
      Withdrawal.countDocuments({ status: 'processing' }),
      Withdrawal.countDocuments({ status: 'completed' }),
      Withdrawal.countDocuments({ status: 'rejected' })
    ]);

    // Get bank change request metrics
    const [
      pendingBankChangeRequests,
      approvedBankChangeRequests,
      rejectedBankChangeRequests
    ] = await Promise.all([
      BankChangeRequest.countDocuments({ status: 'pending' }),
      BankChangeRequest.countDocuments({ status: 'approved' }),
      BankChangeRequest.countDocuments({ status: 'rejected' })
    ]);

    // Get stream metrics
    const [
      scheduledStreams,
      liveStreams,
      endedStreams,
      cancelledStreams
    ] = await Promise.all([
      Stream.countDocuments({ status: 'scheduled' }),
      Stream.countDocuments({ status: 'live' }),
      Stream.countDocuments({ status: 'ended' }),
      Stream.countDocuments({ cancelledStream: true })
    ]);

    // Get financial metrics
    const totalOrderAmount = await Order.aggregate([
      { $match: { paid: true, isStale: { $ne: true }, items: { $not: { $elemMatch: { status: 'cancelled' } } } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalWithdrawalAmount = await Withdrawal.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Calculate percentages
    const buyerVerificationRate = totalBuyers > 0 ? (identityVerifiedBuyers / totalBuyers * 100).toFixed(2) : 0;
    const sellerVerificationRate = totalSellers > 0 ? (verifiedSellers / totalSellers * 100).toFixed(2) : 0;
    const pendingWithdrawalRate = totalWithdrawals > 0 ? (pendingWithdrawals / totalWithdrawals * 100).toFixed(2) : 0;
    const pendingBankChangeRate = totalBankChangeRequests > 0 ? (pendingBankChangeRequests / totalBankChangeRequests * 100).toFixed(2) : 0;
    const cancelledStreamRate = totalStreams > 0 ? (cancelledStreams / totalStreams * 100).toFixed(2) : 0;

    // Recent activity - get the latest 5 of each important model
    const [
      recentOrders,
      recentWithdrawals,
      recentBankChangeRequests,
      recentStreams
    ] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).limit(5).select('order_id buyer seller totalAmount createdAt items.status'),
      Withdrawal.find().sort({ requestDate: -1 }).limit(5).select('seller amount status requestDate reference'),
      BankChangeRequest.find().sort({ requestDate: -1 }).limit(5).select('seller status requestDate newBankDetails.bankName'),
      Stream.find().sort({ createdAt: -1 }).limit(5).select('seller title status scheduledStartTime actualStartTime')
    ]);

    // --- EXTRA METRICS ---
    // Top performing sellers by revenue (exclude stale orders)
    const topPerformers = await Order.aggregate([
      { $match: { paid: true, isStale: { $ne: true }, items: { $not: { $elemMatch: { status: 'cancelled' } } } } },
      {
        $group: {
          _id: '$seller',
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);
    await Seller.populate(topPerformers, { path: '_id', select: 'firstName lastName businessName email storeName storeAvatar' });

    // Top products by sales and revenue (exclude stale orders)
    const topProducts = await Order.aggregate([
      { $match: { paid: true, isStale: { $ne: true } } },
      { $unwind: '$items' },
      { $match: { 'items.status': { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);
    await Product.populate(topProducts, { path: '_id', select: 'name price images category brand' });

    // Top buyers by spend (exclude stale orders)
    const topBuyers = await Order.aggregate([
      { $match: { paid: true, isStale: { $ne: true }, items: { $not: { $elemMatch: { status: 'cancelled' } } } } },
      {
        $group: {
          _id: '$buyer',
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);
    await Buyer.populate(topBuyers, { path: '_id', select: 'firstName lastName email profileImage' });

    // Top live streams by viewers
    const topLiveStreams = await Stream.find({ status: 'live' })
      .sort({ 'viewers.length': -1 })
      .limit(10)
      .select('seller title viewers scheduledStartTime actualStartTime endTime');
    await Seller.populate(topLiveStreams, { path: 'seller', select: 'firstName lastName businessName storeName storeAvatar' });

    // Top categories by order count (exclude stale orders)
    const topCategories = await Order.aggregate([
      { $match: { paid: true, isStale: { $ne: true } } },
      { $unwind: '$items' },
      { $match: { 'items.status': { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$items.product',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          orderCount: { $sum: '$count' }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 }
    ]);

    const metrics = {
      counts: {
        buyers: totalBuyers,
        sellers: totalSellers,
        products: totalProducts,
        orders: totalOrders,
        streams: totalStreams,
        transactions: totalTransactions,
        withdrawals: totalWithdrawals,
        bankChangeRequests: totalBankChangeRequests
      },
      userMetrics: {
        activeBuyers,
        inactiveBuyers: totalBuyers - activeBuyers,
        activeSellers,
        inactiveSellers: totalSellers - activeSellers,
        verifiedSellers,
        pendingVerificationSellers,
        identityVerifiedBuyers,
        buyerVerificationRate,
        sellerVerificationRate
      },
      orderMetrics: {
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        ordersWithReturns,
        ordersWithDisputes
      },
      withdrawalMetrics: {
        pendingWithdrawals,
        processingWithdrawals,
        completedWithdrawals,
        rejectedWithdrawals,
        pendingWithdrawalRate
      },
      bankChangeMetrics: {
        pendingBankChangeRequests,
        approvedBankChangeRequests,
        rejectedBankChangeRequests,
        pendingBankChangeRate
      },
      streamMetrics: {
        scheduledStreams,
        liveStreams,
        endedStreams,
        cancelledStreams,
        cancelledStreamRate
      },
      financialMetrics: {
        totalOrderAmount: totalOrderAmount.length > 0 ? totalOrderAmount[0].total : 0,
        totalWithdrawalAmount: totalWithdrawalAmount.length > 0 ? totalWithdrawalAmount[0].total : 0
      },
      recentActivity: {
        orders: recentOrders,
        withdrawals: recentWithdrawals,
        bankChangeRequests: recentBankChangeRequests,
        streams: recentStreams
      },
      extra: {
        topPerformers,
        topProducts,
        topBuyers,
        topLiveStreams,
        topCategories
      }
    };

    return res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching platform metrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch platform metrics',
      error: error.message
    });
  }
};

// Function to send product status notification email to seller
async function sendProductStatusEmail(seller, product, action, reason) {
  try {
    // Ensure SendGrid API key is set
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const actionMap = {
      delete: {
        subject: 'Product Deleted by Admin - Auqli',
        title: 'Product Deleted',
        message: 'We\'re writing to inform you that an administrator has deleted one of your products from the platform.'
      },
      disable: {
        subject: 'Product Disabled by Admin - Auqli',
        title: 'Product Disabled',
        message: 'We\'re writing to inform you that an administrator has disabled one of your products. The product has been set to draft status and is no longer visible to buyers.'
      }
    };

    const template = actionMap[action];

    const emailMsg = {
      to: seller.email,
      from: 'Auqli Admin <support@auqli.com>',
      subject: template.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${template.title}</h2>
          <p>Dear ${seller.firstName},</p>
          <p>${template.message}</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Product Name:</strong> ${product.name}</p>
            <p><strong>Product ID:</strong> ${product._id}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          
          <p>If you have any questions or concerns about this action, please contact our support team at support@auqli.com.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    await sgMail.send(emailMsg);
    console.log(`Product ${action} notification email sent to seller: ${seller.email}`);
  } catch (error) {
    console.error(`Error sending product ${action} email:`, error);
    // Don't throw error to prevent API failure
  }
}

// Admin delete product function
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    const product = await Product.findById(productId).populate('seller');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Store seller reference before deleting product
    const seller = product.seller;

    // Delete the product
    await Product.findByIdAndDelete(productId);

    // Send email notification to the seller
    await sendProductStatusEmail(seller, product, 'delete', reason);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

// Admin disable product function
exports.disableProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    const product = await Product.findById(productId).populate('seller');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update the product status to draft
    product.status = 'draft';
    await product.save();

    // Send email notification to the seller
    await sendProductStatusEmail(product.seller, product, 'disable', reason);

    return res.status(200).json({
      success: true,
      message: 'Product disabled successfully',
      product: {
        _id: product._id,
        name: product.name,
        status: product.status
      }
    });

  } catch (error) {
    console.error('Error disabling product:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to disable product',
      error: error.message
    });
  }
};

exports.getSellerProducts = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const {
      page = 1,
      limit = 10,
      status,
      category,
      minPrice,
      maxPrice,
      sortBy = 'newest',
      search
    } = req.query;

    // Validate seller exists
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Build query
    const query = { seller: sellerId };

    // Add filters if provided
    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'inventory.sku': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'stock_asc':
        sortOptions = { stock: 1 };
        break;
      case 'stock_desc':
        sortOptions = { stock: -1 };
        break;
      case 'best_selling':
        sortOptions = { 'stats.soldCount': -1 };
        break;
      case 'most_viewed':
        sortOptions = { 'stats.views': -1 };
        break;
      default: // 'newest'
        sortOptions = { createdAt: -1 };
    }

    // Execute query with pagination
    const products = await Product.find(query)
      .select(`
        name 
        description
        price 
        category 
        images 
        status
        variants
        stock
        inventory
        stats
        discount
        pricing
        createdAt
        updatedAt
        brand
        condition
        sku
        visibility
      `)
      .sort(sortOptions)
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);

    res.json({
      products: products.map(product => ({
        ...product.toObject(),
        isLowStock: product.stock <= product.inventory.lowStockThreshold,
        hasDiscount: product.discount?.isActive || false,
        discountedPrice: product.discountedPrice,
        stats: {
          ...product.stats,
          daysListed: Math.floor((new Date() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24))
        }
      })),
      pagination: {
        totalPages: Math.ceil(totalProducts / Number(limit)),
        currentPage: Number(page),
        totalProducts,
        limit: Number(limit)
      },
      seller: {
        id: seller._id,
        name: seller.firstName + ' ' + seller.lastName,
        businessName: seller.businessName,
        storeName: seller.storeName,
        email: seller.email
      }
    });

  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({
      message: 'Failed to retrieve seller products',
      error: error.message
    });
  }
};

// ... existing code ...

// Function to send wallet transaction notification email to seller
async function sendWalletTransactionEmail(seller, amount, type, reason, newBalance) {
  try {
    // Ensure SendGrid API key is set
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const formattedAmount = amount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    });

    const formattedBalance = newBalance.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    });

    const formattedDate = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isCredit = type === 'credit';

    const emailMsg = {
      to: seller.email,
      from: 'Auqli Admin <support@auqli.com>',
      subject: isCredit ? 'Funds Added to Your Wallet - Auqli' : 'Funds Deducted from Your Wallet - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://auqli.com/logo.png" alt="Auqli Logo" style="max-width: 150px;">
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
            <h2 style="color: #333; margin-bottom: 20px; text-align: center;">${isCredit ? 'Wallet Credit Notice' : 'Wallet Deduction Notice'}</h2>
            
            <p style="font-size: 16px; color: #555; margin-bottom: 15px;">Hello ${seller.firstName},</p>
            
            <p style="font-size: 16px; color: #555; margin-bottom: 15px;">
              ${isCredit
          ? `Your wallet has been credited with ${formattedAmount}.`
          : `${formattedAmount} has been deducted from your wallet.`}
            </p>
            
            <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Transaction Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #777; width: 40%;">Amount:</td>
                  <td style="padding: 8px 0; color: ${isCredit ? '#4CAF50' : '#f44336'}; font-weight: bold;">
                    ${isCredit ? '+' : '-'}${formattedAmount}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #777;">Transaction Type:</td>
                  <td style="padding: 8px 0; color: #333;">
                    ${isCredit ? 'Credit' : 'Debit'} (Admin Adjustment)
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #777;">Date & Time:</td>
                  <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #777;">Reason:</td>
                  <td style="padding: 8px 0; color: #333;">${reason || 'Administrative adjustment'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #777;">Current Balance:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${formattedBalance}</td>
                </tr>
              </table>
            </div>
            
            <p style="font-size: 16px; color: #555; margin-bottom: 15px;">
              If you have any questions regarding this transaction, please contact our support team.
            </p>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #777; font-size: 14px;">
            <p>© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
            <p>
              <a href="https://auqli.live/terms" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Terms of Service</a> | 
              <a href="https://auqli.live/privacy" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
            </p>
          </div>
        </div>
      `
    };

    await sgMail.send(emailMsg);
    console.log(`Wallet transaction email sent to seller: ${seller.email}`);
    return true;
  } catch (error) {
    console.error('Error sending wallet transaction email:', error);
    return false;
  }
}

// Deduct from seller wallet
exports.deductFromSellerWallet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { sellerId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Please provide a positive number.'
      });
    }

    const seller = await Seller.findById(sellerId).session(session);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Check if seller has sufficient balance
    if (seller.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance',
        currentBalance: seller.walletBalance
      });
    }

    // Create transaction record
    const transaction = await Transaction.create([{
      seller: seller._id,
      type: 'platform_fee', // Using platform_fee type as it's an outflow from seller
      amount: amount,
      status: 'completed',
      description: reason || 'Administrative deduction',
      metadata: {
        deductedBy: req.user.id,
        deductionReason: reason
      }
    }], { session });

    // Update seller's wallet balance
    const previousBalance = seller.walletBalance;
    seller.walletBalance -= amount;
    await seller.save({ session });

    await session.commitTransaction();

    // Send email notification
    await sendWalletTransactionEmail(seller, amount, 'debit', reason, seller.walletBalance);

    res.status(200).json({
      success: true,
      message: 'Amount deducted from seller wallet successfully',
      transaction: transaction[0],
      previousBalance,
      newBalance: seller.walletBalance
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error deducting from seller wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deduct from seller wallet',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Add to seller wallet
exports.addToSellerWallet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { sellerId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Please provide a positive number.'
      });
    }

    const seller = await Seller.findById(sellerId).session(session);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Create transaction record
    const transaction = await Transaction.create([{
      seller: seller._id,
      type: 'order_payment', // Using order_payment type as it's an inflow to seller
      amount: amount,
      status: 'completed',
      description: reason || 'Administrative credit',
      metadata: {
        addedBy: req.user.id,
        creditReason: reason
      }
    }], { session });

    // Update seller's wallet balance
    const previousBalance = seller.walletBalance;
    seller.walletBalance += amount;
    await seller.save({ session });

    await session.commitTransaction();

    // Send email notification
    await sendWalletTransactionEmail(seller, amount, 'credit', reason, seller.walletBalance);

    res.status(200).json({
      success: true,
      message: 'Amount added to seller wallet successfully',
      transaction: transaction[0],
      previousBalance,
      newBalance: seller.walletBalance
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error adding to seller wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to seller wallet',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// ... existing code ...

// Admin function to delete all products of a seller
exports.deleteAllSellerProducts = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason } = req.body;

    // Check if seller exists
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Find all products of the seller
    const products = await Product.find({ seller: sellerId });

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found for this seller'
      });
    }

    // Get basic product info for email notification
    const productsInfo = products.map(product => ({
      _id: product._id,
      name: product.name,
      category: product.category,
      price: product.price
    }));

    // Delete all products of the seller
    const deleteResult = await Product.deleteMany({ seller: sellerId });

    // Send email notification to the seller
    const emailMsg = {
      to: seller.email,
      from: 'Auqli Admin <support@auqli.com>',
      subject: 'All Products Deleted by Admin - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>All Products Deleted</h2>
          <p>Dear ${seller.firstName},</p>
          <p>We're writing to inform you that an administrator has deleted all of your products from the platform.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Total Products Deleted:</strong> ${deleteResult.deletedCount}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          
          <p>If you have any questions or concerns about this action, please contact our support team at support@auqli.com.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    try {
      // Ensure SendGrid API key is set
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send(emailMsg);
      console.log(`Products deletion notification email sent to seller: ${seller.email}`);
    } catch (emailError) {
      console.error('Error sending products deletion email:', emailError);
      // Don't throw error to prevent API failure
    }

    return res.status(200).json({
      success: true,
      message: `All products of seller ${sellerId} deleted successfully`,
      deletedCount: deleteResult.deletedCount
    });

  } catch (error) {
    console.error('Error deleting all seller products:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete all seller products',
      error: error.message
    });
  }
};

/**
 * @function sendOnboardingReminderEmail
 * @description Send a reminder email to a seller to complete their onboarding process
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response indicating success or failure
 */
exports.sendOnboardingReminderEmail = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seller ID format'
      });
    }

    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }





    const emailMsg = {
      to: seller.email,
      from: 'Joseph From Auqli <support@auqli.com>',
      subject: 'Your Shop Is Almost Ready! Finish Setting Up on Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Your Shop Is Almost Ready! Finish Setting Up on Auqli</h2>
    
          <p>Hi ${seller.firstName},</p>
    
          <p>We noticed you haven't yet completed your Auqli seller setup — and we don't want you to miss out!</p>
    
          <p>With your Auqli account, you can:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <ul style="margin-top: 10px;">
              <li>✅ Run real-time livestream sales and connect with live buyers</li>
              <li>✅ Upload Blips (shoppable short videos) to drive impulse purchases</li>
              <li>✅ Manage products, track orders, and get paid — all in one place</li>
            </ul>
          </div>
    
          <p>Your shop is almost ready — all you need to do is log in, finish the setup, and start selling.</p>
    
          <p>Here's how to finish:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <ol style="margin-top: 10px;">
              <li>Log in to the Auqli Seller Center</li>
              <li>Upload your first products</li>
              <li>Schedule your first livestream or post your first Blip</li>
              <li>Get discovered by buyers on the Auqli app</li>
            </ol>
          </div>
    
          <p>If you need help, our team is here for you!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://seller.auqli.live/login" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">🎯 Finish Setup Now →</a>
          </div>
    
          <p>Chat with us in the Seller Center or email us at <a href="mailto:support@auqli.com" style="color: #4CAF50; text-decoration: none;">support@auqli.com</a></p>
    
          <p>Let's get your shop live and thriving. 🚀</p>
    
          <p>We're excited to have you on board.</p>
    
          <p>Best regards,<br>The Auqli Team</p>
    
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; text-align: center;">
            <p>© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
            <p>
              <a href="https://auqli.live/terms" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Terms of Service</a> |
              <a href="https://auqli.live/privacy" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
            </p>
          </div>
        </div>
      `
    };


    // Send the email
    await sgMail.send(emailMsg);

    return res.status(200).json({
      success: true,
      message: 'Onboarding reminder email sent successfully',

    });

  } catch (error) {
    console.error('Error sending onboarding reminder email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send onboarding reminder email',
      error: error.message
    });
  }
};

/**
 * @function sendBulkOnboardingReminders
 * @description Send reminder emails to all sellers with incomplete onboarding process
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response indicating success or failure
 */
exports.sendBulkOnboardingReminders = async (req, res) => {
  try {
    const incompleteSellers = await Seller.find({
      accountType: { $nin: ['individual', 'business'] },
      emailVerified: true
    });

    const emailPromises = [];
    const processedSellers = [];

    // Process each seller with incomplete onboarding
    for (const seller of incompleteSellers) {
      // Identify incomplete steps for this seller




      // Set up email content
      const emailMsg = {
        to: seller.email,
        from: 'Auqli Admin <support@auqli.com>',
        subject: 'Complete Your Auqli Seller Onboarding',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333; text-align: center;">Complete Your Seller Onboarding</h2>
            
            <p>Dear ${seller.firstName},</p>
            
            <p>We noticed that you've started the seller onboarding process on Auqli but haven't completed all the required steps yet. To start selling your products and accessing all seller features, please complete the following steps:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
              <p style="margin: 0; color: #333;"><strong>Benefits of completing your onboarding:</strong></p>
              <ul style="margin-top: 10px;">
                <li>List and sell products to customers</li>
                <li>Access seller analytics and insights</li>
                <li>Process orders and grow your business</li>
                <li>Participate in promotions and campaigns</li>
              </ul>
            </div>
            
            <p style="margin-top: 20px;">To complete your onboarding, simply log in to your Auqli seller account and follow the prompts in your dashboard.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://auqli.live/seller/login" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Log In to Your Account</a>
            </div>
            
            <p>If you're experiencing any issues or have questions about the onboarding process, please contact our seller support team at <a href="mailto:support@auqli.com">support@auqli.com</a>.</p>
            
            <p>Best regards,<br>The Auqli Team</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; text-align: center;">
              <p>© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
              <p>
                <a href="https://auqli.live/terms" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Terms of Service</a> | 
                <a href="https://auqli.live/privacy" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
              </p>
            </div>
          </div>
        `
      };

      // Add to email promises array
      emailPromises.push(sgMail.send(emailMsg));

      // Add to processed sellers with summary info
      processedSellers.push({
        sellerId: seller._id,
        email: seller.email,
        name: `${seller.firstName} ${seller.lastName}`,
        businessName: seller.businessName || 'N/A',

      });
    }

    // Send all emails in parallel
    await Promise.allSettled(emailPromises);

    return res.status(200).json({
      success: true,
      message: `Onboarding reminder emails sent to ${processedSellers.length} sellers`,
      count: processedSellers.length,
      processedSellers
    });

  } catch (error) {
    console.error('Error sending bulk onboarding reminder emails:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send bulk onboarding reminder emails',
      error: error.message
    });
  }
};

/**
 * Get comprehensive buyer details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Detailed buyer information with orders, transactions, etc.
 */
exports.getBuyerDetails = async (req, res) => {
  try {
    const { buyerId } = req.params;

    // Validate buyerId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(buyerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid buyer ID format'
      });
    }

    // Fetch buyer with selected fields
    const buyer = await Buyer.findById(buyerId)
      .select('-password -resetPasswordToken -resetPasswordExpires -resetPasswordOTP -resetPasswordOTPExpires -otp -phoneVerification.otp');

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    // Get additional metrics and related data concurrently
    const [
      ordersData,
      postsCount,
      wishlistProducts,
      messageThreads,
      transactionStats
    ] = await Promise.all([
      // Get buyer's orders with pagination (most recent 10)
      Order.find({ buyer: buyerId })
        .populate('seller', 'firstName lastName businessName storeName')
        .populate('items.product', 'name images')
        .sort({ createdAt: -1 })
        .limit(10),

      // Fix: Count buyer's posts with the correct schema structure
      Post.countDocuments({ 'author.userId': buyerId, 'author.userModel': 'Buyer' }),

      // Get wishlist items with product details
      Promise.all((buyer.wishlist || []).map(async (item) => {
        const product = await Product.findById(item.product)
          .populate('seller', 'storeName businessName')
          .select('name price images status discountPrice');

        if (product) {
          return {
            addedAt: item.addedAt,
            productId: product._id,
            name: product.name,
            price: product.price,
            discountPrice: product.discountPrice,
            image: product.images && product.images.length > 0 ? product.images[0] : null,
            seller: product.seller,
            status: product.status
          };
        }
        return null;
      })),

      // Get conversation threads
      Conversation.find({
        participants: {
          $elemMatch: {
            participantId: buyerId,
            participantType: 'buyer'
          }
        }
      })
        .populate({
          path: 'participants.participantId',
          select: 'firstName lastName storeName businessName profileImage',
        })
        .sort({ updatedAt: -1 })
        .limit(5),

      // Get wallet transaction statistics
      getWalletTransactionStats(buyer)
    ]);

    // Filter out null wishlist items (products that may have been deleted)
    const filteredWishlist = wishlistProducts.filter(item => item !== null);

    // Calculate order metrics
    const orderMetrics = calculateOrderMetrics(ordersData);

    // Format response data
    const responseData = {
      buyer: {
        _id: buyer._id,
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        email: buyer.email,
        phoneNumber: buyer.phoneNumber,
        username: buyer.username,
        country: buyer.country,
        createdAt: buyer.createdAt,
        emailVerified: buyer.emailVerified,
        phoneVerified: buyer.phoneVerified,
        profileImage: buyer.profileImage,
        isActive: buyer.isActive,
        isDisabled: buyer.isDisabled,
        isIdentityVerified: buyer.isIdentityVerified,
        identityDocument: buyer.identityDocument,
        shippingAddresses: buyer.shippingAddresses,
        bio: buyer.bio,
        preferredLanguage: buyer.preferredLanguage,
        preferredCurrency: buyer.preferredCurrency,
        authProvider: buyer.authProvider,
        wallet: {
          balance: buyer.wallet?.balance || 0,
          currency: buyer.wallet?.currency || 'NGN',
          onHoldAmount: buyer.wallet?.onHoldAmount || 0,
          onHoldItems: buyer.wallet?.onHoldItems || []
        },
        notificationPreferences: buyer.notificationPreferences
      },
      metrics: {
        ordersCount: orderMetrics.totalOrders,
        totalSpent: orderMetrics.totalSpent,
        pendingOrders: orderMetrics.pendingOrders,
        completedOrders: orderMetrics.completedOrders,
        cancelledOrders: orderMetrics.cancelledOrders,
        postsCount,
        wishlistCount: filteredWishlist.length,
        conversationsCount: messageThreads.length,
        walletBalance: buyer.wallet?.balance || 0,
        walletTransactions: {
          totalTransactions: transactionStats.totalCount,
          creditTransactions: transactionStats.creditCount,
          debitTransactions: transactionStats.debitCount,
          totalCredit: transactionStats.totalCredit,
          totalDebit: transactionStats.totalDebit
        }
      },
      recentActivity: {
        orders: ordersData.map(order => ({
          _id: order._id,
          order_id: order.order_id,
          totalAmount: order.totalAmount,
          status: order.status || 'pending',
          createdAt: order.createdAt,
          seller: order.seller ? {
            _id: order.seller._id,
            name: order.seller.businessName || order.seller.storeName || `${order.seller.firstName} ${order.seller.lastName}`
          } : null,
          items: order.items.length
        })),
        wishlist: filteredWishlist,
        conversations: messageThreads.map(conversation => {
          // Find the other participant (not the buyer)
          const otherParticipant = conversation.participants.find(
            p => p.participantId._id.toString() !== buyerId.toString()
          );

          return {
            _id: conversation._id,
            lastUpdated: conversation.updatedAt,
            unreadCount: conversation.unreadCount || 0,
            otherParticipant: otherParticipant ? {
              _id: otherParticipant.participantId._id,
              type: otherParticipant.participantType,
              name: otherParticipant.participantType === 'seller'
                ? (otherParticipant.participantId.storeName || otherParticipant.participantId.businessName)
                : `${otherParticipant.participantId.firstName} ${otherParticipant.participantId.lastName}`,
              profileImage: otherParticipant.participantId.profileImage
            } : null
          };
        })
      }
    };

    // Return successful response
    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching buyer details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buyer details',
      error: error.message
    });
  }
};

/**
 * Helper function to calculate order metrics
 * @param {Array} orders - List of buyer orders
 * @returns {Object} Metrics about orders
 */
function calculateOrderMetrics(orders) {
  return orders.reduce((metrics, order) => {
    metrics.totalOrders++;
    metrics.totalSpent += order.totalAmount || 0;

    // Count orders by status
    if (order.status === 'delivered') {
      metrics.completedOrders++;
    } else if (order.status === 'cancelled') {
      metrics.cancelledOrders++;
    } else {
      metrics.pendingOrders++;
    }

    return metrics;
  }, {
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0
  });
}

/**
 * Helper function to get wallet transaction statistics
 * @param {Object} buyer - Buyer document
 * @returns {Object} Transaction statistics
 */
async function getWalletTransactionStats(buyer) {
  if (!buyer.wallet || !buyer.wallet.transactions) {
    return {
      totalCount: 0,
      creditCount: 0,
      debitCount: 0,
      totalCredit: 0,
      totalDebit: 0
    };
  }

  return buyer.wallet.transactions.reduce((stats, transaction) => {
    stats.totalCount++;

    if (transaction.type === 'credit') {
      stats.creditCount++;
      stats.totalCredit += transaction.amount || 0;
    } else if (transaction.type === 'debit') {
      stats.debitCount++;
      stats.totalDebit += transaction.amount || 0;
    }

    return stats;
  }, {
    totalCount: 0,
    creditCount: 0,
    debitCount: 0,
    totalCredit: 0,
    totalDebit: 0
  });
}

// Helper function to send push notifications to all buyers
async function sendPushNotificationsToAllBuyers(title, body, data = {}) {
  try {
    // Get all buyers with expo push tokens
    const buyers = await Buyer.find(
      { expoPushToken: { $exists: true, $ne: null, $ne: "" } },
      'expoPushToken email'
    );

    if (!buyers || buyers.length === 0) {
      console.log('No buyers with push tokens found');
      return;
    }

    console.log(`Sending push notifications to ${buyers.length} buyers`);

    // Create messages array
    const messages = [];
    const buyersByToken = {};

    // Add message for each buyer with a valid token
    for (const buyer of buyers) {
      if (!buyer.expoPushToken) continue;

      // Check if the push token is valid
      if (!Expo.isExpoPushToken(buyer.expoPushToken)) {
        console.error(`Push token ${buyer.expoPushToken} is not a valid Expo push token for buyer ${buyer._id}`);
        // Update buyer record to clear invalid token
        await Buyer.updateOne(
          { _id: buyer._id },
          { $unset: { expoPushToken: "" } }
        );
        continue;
      }

      // Add the message to the array
      messages.push({
        to: buyer.expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: { ...data, type: 'platform_notification' },
        priority: 'high',
        channelId: 'default',
      });

      // Store buyer info for error tracking
      buyersByToken[buyer.expoPushToken] = buyer;
    }

    if (messages.length === 0) {
      console.log('No valid push tokens found after validation');
      return;
    }

    // Chunk the messages array to follow Expo's guidelines
    const chunks = expo.chunkPushNotifications(messages);

    // Send each chunk
    const tickets = [];
    let successCount = 0;
    let errorCount = 0;

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        console.log(`Push notification chunk sent: ${ticketChunk.length} messages`);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
        errorCount += chunk.length;
      }
    }

    // Process tickets and handle failed tokens
    const receiptIds = [];
    const tokensToRemove = [];

    tickets.forEach((ticket, index) => {
      const targetToken = messages[index]?.to;
      const buyer = buyersByToken[targetToken];

      if (ticket.status === 'ok') {
        successCount++;
        if (ticket.id) {
          receiptIds.push(ticket.id);
        }
      } else if (ticket.status === 'error') {
        errorCount++;
        console.error(`Push notification to ${targetToken} failed:`, ticket.message);

        // Check for specific error types that indicate we should remove the token
        if (
          ticket.details?.error === 'DeviceNotRegistered' ||
          ticket.details?.error === 'InvalidCredentials' ||
          ticket.details?.error === 'MessageTooBig' ||
          ticket.details?.error === 'MessageRateExceeded'
        ) {
          console.log(`Removing invalid token for buyer ${buyer?._id || 'unknown'}`);
          if (buyer && buyer._id) {
            tokensToRemove.push(buyer._id);
          }
        }
      }
    });

    // Remove invalid tokens in bulk
    if (tokensToRemove.length > 0) {
      try {
        const result = await Buyer.updateMany(
          { _id: { $in: tokensToRemove } },
          { $unset: { expoPushToken: "" } }
        );
        console.log(`Removed ${result.modifiedCount} invalid tokens from database`);
      } catch (error) {
        console.error('Error removing invalid tokens:', error);
      }
    }

    // Optionally check for receipts (can be used to confirm delivery)
    // This helps with debugging delivery issues
    if (receiptIds.length > 0 && process.env.CHECK_NOTIFICATION_RECEIPTS === 'true') {
      try {
        setTimeout(async () => {
          const receiptChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
          for (const chunk of receiptChunks) {
            const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
            console.log('Notification delivery receipts:', receipts);
          }
        }, 5000); // Check after 5 seconds
      } catch (error) {
        console.error('Error checking notification receipts:', error);
      }
    }

    console.log(`Push notification summary: ${successCount} sent successfully, ${errorCount} failed`);

    return {
      success: true,
      totalBuyers: buyers.length,
      validTokens: messages.length,
      successCount,
      errorCount
    };
  } catch (error) {
    console.error('Error in sendPushNotificationsToAllBuyers:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Create a new platform notification
exports.createPlatformNotification = async (req, res) => {
  try {
    const { title, content, type, isActive, startDate, endDate } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required for platform notifications'
      });
    }

    const platformNotification = new PlatformNotification({
      title,
      content,
      type: type || 'info',
      isActive: isActive !== undefined ? isActive : true,
      startDate: startDate || Date.now(),
      endDate: endDate || null,
      createdBy: req.user.id
    });

    await platformNotification.save();

    // Send push notifications to all buyers if the notification is active
    if (platformNotification.isActive) {
      const notificationResult = await sendPushNotificationsToAllBuyers(
        platformNotification.title,
        platformNotification.content,
        {
          notificationId: platformNotification._id,
          type: platformNotification.type
        }
      );

      console.log('Push notification result:', notificationResult);
    }

    res.status(201).json({
      success: true,
      message: 'Platform notification created successfully',
      data: platformNotification
    });
  } catch (error) {
    console.error('Error creating platform notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create platform notification',
      error: error.message
    });
  }
};

// Get all platform notifications
exports.getAllPlatformNotifications = async (req, res) => {
  try {
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Add filtering options
    const filter = {};
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.isActive === 'true') {
      filter.isActive = true;
    } else if (req.query.isActive === 'false') {
      filter.isActive = false;
    }

    // Get notifications
    const notifications = await PlatformNotification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'username email');

    // Get total count
    const total = await PlatformNotification.countDocuments(filter);

    res.json({
      success: true,
      data: {
        notifications,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalNotifications: total
      }
    });
  } catch (error) {
    console.error('Error getting platform notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve platform notifications',
      error: error.message
    });
  }
};

// Get a specific platform notification
exports.getPlatformNotification = async (req, res) => {
  try {
    const notification = await PlatformNotification.findById(req.params.id)
      .populate('createdBy', 'username email');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Platform notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error getting platform notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve platform notification',
      error: error.message
    });
  }
};

// Update a platform notification
exports.updatePlatformNotification = async (req, res) => {
  try {
    const { title, content, type, isActive, startDate, endDate } = req.body;

    // Find the notification to update
    const notification = await PlatformNotification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Platform notification not found'
      });
    }

    // Check if notification is being activated
    const wasInactive = !notification.isActive;
    const willBeActive = isActive !== undefined ? isActive : notification.isActive;

    // Update fields if provided
    if (title) notification.title = title;
    if (content) notification.content = content;
    if (type) notification.type = type;
    if (isActive !== undefined) notification.isActive = isActive;
    if (startDate) notification.startDate = startDate;
    if (endDate) notification.endDate = endDate;

    // Update the updatedAt timestamp
    notification.updatedAt = Date.now();

    await notification.save();

    // If notification was inactive and is now being activated, send push notification
    if (wasInactive && willBeActive) {
      const notificationResult = await sendPushNotificationsToAllBuyers(
        notification.title,
        notification.content,
        {
          notificationId: notification._id,
          type: notification.type
        }
      );

      console.log('Push notification result:', notificationResult);
    }

    res.json({
      success: true,
      message: 'Platform notification updated successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error updating platform notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update platform notification',
      error: error.message
    });
  }
};

// Delete a platform notification
exports.deletePlatformNotification = async (req, res) => {
  try {
    const notification = await PlatformNotification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Platform notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Platform notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting platform notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete platform notification',
      error: error.message
    });
  }
};

// ... existing code ...

// Function to send wallet transaction notification email to buyer
async function sendBuyerWalletTransactionEmail(buyer, amount, type, reason, newBalance) {
  try {
    // Ensure SendGrid API key is set
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const formattedAmount = amount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    });

    const formattedBalance = newBalance.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    });

    const formattedDate = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isCredit = type === 'credit';

    const emailMsg = {
      to: buyer.email,
      from: 'Auqli Admin <support@auqli.com>',
      subject: isCredit ? 'Funds Added to Your Wallet - Auqli' : 'Funds Deducted from Your Wallet - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://auqli.com/logo.png" alt="Auqli Logo" style="max-width: 150px;">
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
            <h2 style="color: #333; margin-bottom: 20px; text-align: center;">${isCredit ? 'Wallet Credit Notice' : 'Wallet Deduction Notice'}</h2>
            
            <p style="font-size: 16px; color: #555; margin-bottom: 15px;">Hello ${buyer.firstName},</p>
            
            <p style="font-size: 16px; color: #555; margin-bottom: 15px;">
              ${isCredit
          ? `Your wallet has been credited with ${formattedAmount}.`
          : `${formattedAmount} has been deducted from your wallet.`}
            </p>
            
            <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Transaction Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #777; width: 40%;">Amount:</td>
                  <td style="padding: 8px 0; color: ${isCredit ? '#4CAF50' : '#f44336'}; font-weight: bold;">
                    ${isCredit ? '+' : '-'}${formattedAmount}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #777;">Reason:</td>
                  <td style="padding: 8px 0; color: #333;">${reason || (isCredit ? 'Administrative credit' : 'Administrative deduction')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #777;">Date & Time:</td>
                  <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #777;">Status:</td>
                  <td style="padding: 8px 0; color: #333;">
                    <span style="color: #4CAF50; font-weight: bold;">Completed</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #777;">Current Balance:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${formattedBalance}</td>
                </tr>
              </table>
            </div>
            
            <p style="font-size: 16px; color: #555; margin-bottom: 15px;">
              ${isCredit
          ? 'You can now use this balance to make purchases on Auqli.'
          : 'If you have any questions regarding this transaction, please contact our support team.'}
            </p>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #777; font-size: 14px;">
            <p>© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
            <p>
              <a href="https://auqli.live/terms" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Terms of Service</a> | 
              <a href="https://auqli.live/privacy" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
            </p>
          </div>
        </div>
      `
    };

    await sgMail.send(emailMsg);
    console.log(`Wallet ${type} email sent to buyer: ${buyer.email}`);
    return true;
  } catch (error) {
    console.error(`Error sending wallet ${type} email to buyer:`, error);
    return false;
  }
}

// Deduct from buyer wallet
exports.deductFromBuyerWallet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { buyerId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Please provide a positive number.'
      });
    }

    const buyer = await Buyer.findById(buyerId).session(session);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    // Check if buyer has sufficient balance
    if (!buyer.wallet || buyer.wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance',
        currentBalance: buyer.wallet ? buyer.wallet.balance : 0
      });
    }

    // Create transaction record in buyer's wallet
    const transaction = {
      type: 'debit',
      amount: amount,
      paymentReference: `ADMIN-DEDUCT-${Date.now()}`,
      description: reason || 'Administrative deduction',
      status: 'completed',
      createdAt: new Date()
    };

    // Update buyer's wallet balance
    const previousBalance = buyer.wallet.balance;
    buyer.wallet.balance -= amount;
    buyer.wallet.transactions.push(transaction);
    await buyer.save({ session });

    await session.commitTransaction();

    // Send email notification
    await sendBuyerWalletTransactionEmail(buyer, amount, 'debit', reason, buyer.wallet.balance);

    res.status(200).json({
      success: true,
      message: 'Amount deducted from buyer wallet successfully',
      transaction: transaction,
      previousBalance,
      newBalance: buyer.wallet.balance
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error deducting from buyer wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deduct from buyer wallet',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Add to buyer wallet
exports.addToBuyerWallet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { buyerId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Please provide a positive number.'
      });
    }

    const buyer = await Buyer.findById(buyerId).session(session);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    // Ensure the wallet object exists
    if (!buyer.wallet) {
      buyer.wallet = {
        balance: 0,
        onHoldAmount: 0,
        currency: 'NGN',
        transactions: [],
        onHoldItems: []
      };
    }

    // Create transaction record
    const transaction = {
      type: 'credit',
      amount: amount,
      paymentReference: `ADMIN-CREDIT-${Date.now()}`,
      description: reason || 'Administrative credit',
      status: 'completed',
      createdAt: new Date()
    };

    // Update buyer's wallet balance
    const previousBalance = buyer.wallet.balance;
    buyer.wallet.balance += amount;
    buyer.wallet.transactions.push(transaction);
    await buyer.save({ session });

    await session.commitTransaction();

    // Send email notification
    await sendBuyerWalletTransactionEmail(buyer, amount, 'credit', reason, buyer.wallet.balance);

    res.status(200).json({
      success: true,
      message: 'Amount added to buyer wallet successfully',
      transaction: transaction,
      previousBalance,
      newBalance: buyer.wallet.balance
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error adding to buyer wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to buyer wallet',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};


/**
 * Get all product blips across the platform
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
/**
 * Delete a blip from a product (Admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteProductBlip = async (req, res) => {
  try {
    const { productId, blipId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(blipId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product or blip ID format'
      });
    }

    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find the blip in the product
    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({
        success: false,
        message: 'Blip not found in the product'
      });
    }

    // Get the blip URL and thumbnail to return in response
    const blipUrl = blip.url;
    const thumbnailUrl = blip.thumbnail;

    // Remove the blip from the product
    product.blips.pull(blipId);
    await product.save();

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Blip deleted successfully',
      deletedBlip: {
        _id: blipId,
        url: blipUrl,
        thumbnail: thumbnailUrl
      }
    });
  } catch (error) {
    console.error('Error in deleteProductBlip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blip',
      error: error.message
    });
  }
};

/**
 * Delete a comment from a blip (Admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteBlipComment = async (req, res) => {
  try {
    const { productId, blipId, commentId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(productId) ||
      !mongoose.Types.ObjectId.isValid(blipId) ||
      !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product, blip, or comment ID format'
      });
    }

    // Find product first to validate existence and get comment details
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find the blip in the product
    const blip = product.blips.id(blipId);
    if (!blip) {
      return res.status(404).json({
        success: false,
        message: 'Blip not found in the product'
      });
    }

    // Find the comment in the blip
    const comment = blip.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found in the blip'
      });
    }

    // Store comment details for response
    const deletedComment = {
      _id: commentId,
      comment: comment.comment,
      createdAt: comment.createdAt,
      buyer: comment.buyer
    };

    // Use atomic update to remove the comment and update the count
    // This avoids validation issues with the entire document
    await Product.findOneAndUpdate(
      {
        _id: productId,
        'blips._id': blipId
      },
      {
        $pull: { 'blips.$.comments': { _id: commentId } },
        $inc: { 'blips.$.commentsCount': -1 }
      },
      {
        new: true,
        runValidators: false // Skip validation to avoid issues with missing required fields
      }
    );

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      deletedComment: deletedComment
    });
  } catch (error) {
    console.error('Error in deleteBlipComment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

exports.getAllProductBlips = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Parse filters
    const sellerId = req.query.sellerId;
    const category = req.query.category;
    const sortBy = req.query.sortBy || 'createdAt'; // Default sort by creation date
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1; // Default sort descending
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const minLikes = parseInt(req.query.minLikes) || 0;
    const minViews = parseInt(req.query.minViews) || 0;
    const minComments = parseInt(req.query.minComments) || 0;

    // Build match criteria
    const matchCriteria = {
      blips: { $exists: true, $ne: [] }
    };

    if (sellerId) {
      matchCriteria.seller = new mongoose.Types.ObjectId(sellerId);
    }

    if (category) {
      matchCriteria.category = category;
    }

    // Aggregation pipeline
    const pipeline = [
      // Match products that have blips
      { $match: matchCriteria },

      // Unwind the blips array
      { $unwind: '$blips' },

      // Add date filtering if provided
      ...(startDate || endDate ? [{
        $match: {
          'blips.createdAt': {
            ...(startDate && { $gte: startDate }),
            ...(endDate && { $lte: endDate })
          }
        }
      }] : []),

      // Filter by engagement metrics if provided
      {
        $match: {
          $and: [
            { 'blips.likesCount': { $gte: minLikes } },
            { 'blips.viewCount': { $gte: minViews } },
            { 'blips.commentsCount': { $gte: minComments } }
          ]
        }
      },

      // Lookup seller information
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: '$sellerInfo' },

      // Project needed fields
      {
        $project: {
          _id: 0,
          productId: '$_id',
          blipId: '$blips._id',
          blipUrl: '$blips.url',
          thumbnail: {
            $ifNull: [
              '$blips.thumbnail',
              'https://res.cloudinary.com/dljgzevaj/image/upload/v1742758888/sans-affiche_zu6wj4.png'
            ]
          },
          contentType: '$blips.contentType',
          productName: '$name',
          // Fix: Replace $isString with $type to check if description is a string
          // productDescription: {
          //   $cond: {
          //     if: { $eq: [{ $type: '$description' }, 'string'] },
          //     then: { $substr: ['$description', 0, 100] },
          //     else: ''
          //   }
          // },
          price: '$price',
          category: '$category',
          subCategory: '$subCategory',
          createdAt: '$blips.createdAt',
          seller: {
            _id: '$sellerInfo._id',
            firstName: '$sellerInfo.firstName',
            lastName: '$sellerInfo.lastName',
            storeName: '$sellerInfo.storeName',
            storeAvatar: '$sellerInfo.storeAvatar',
            email: '$sellerInfo.email',
            phoneNumber: '$sellerInfo.phoneNumber',
            isVerified: '$sellerInfo.isVerified'
          },
          engagement: {
            likesCount: { $ifNull: ['$blips.likesCount', 0] },
            commentsCount: { $ifNull: ['$blips.commentsCount', 0] },
            viewCount: { $ifNull: ['$blips.viewCount', 0] }
          },
          status: '$status'
        }
      },

      // Sort by the requested field
      { $sort: { [sortBy === 'engagement' ? 'engagement.viewCount' : sortBy]: sortOrder } },

      // Skip and limit for pagination
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ];

    // Execute the aggregation
    const blips = await Product.aggregate(pipeline);

    // Get total count for pagination
    const totalBlipsCount = await Product.aggregate([
      { $match: matchCriteria },
      { $unwind: '$blips' },
      ...(startDate || endDate ? [{
        $match: {
          'blips.createdAt': {
            ...(startDate && { $gte: startDate }),
            ...(endDate && { $lte: endDate })
          }
        }
      }] : []),
      {
        $match: {
          $and: [
            { 'blips.likesCount': { $gte: minLikes } },
            { 'blips.viewCount': { $gte: minViews } },
            { 'blips.commentsCount': { $gte: minComments } }
          ]
        }
      },
      { $count: 'total' }
    ]);

    const totalBlips = totalBlipsCount.length > 0 ? totalBlipsCount[0].total : 0;

    // Calculate engagement statistics
    const stats = {
      totalBlips,
      totalViews: await Product.aggregate([
        { $match: matchCriteria },
        { $unwind: '$blips' },
        { $group: { _id: null, totalViews: { $sum: '$blips.viewCount' } } }
      ]).then(result => result.length > 0 ? result[0].totalViews : 0),

      totalLikes: await Product.aggregate([
        { $match: matchCriteria },
        { $unwind: '$blips' },
        { $group: { _id: null, totalLikes: { $sum: '$blips.likesCount' } } }
      ]).then(result => result.length > 0 ? result[0].totalLikes : 0),

      totalComments: await Product.aggregate([
        { $match: matchCriteria },
        { $unwind: '$blips' },
        { $group: { _id: null, totalComments: { $sum: '$blips.commentsCount' } } }
      ]).then(result => result.length > 0 ? result[0].totalComments : 0),

      averageViews: await Product.aggregate([
        { $match: matchCriteria },
        { $unwind: '$blips' },
        { $group: { _id: null, avgViews: { $avg: '$blips.viewCount' } } }
      ]).then(result => result.length > 0 ? Math.round(result[0].avgViews) : 0)
    };

    res.status(200).json({
      success: true,
      blips,
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalBlips / limit),
        totalBlips,
        blipsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching product blips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product blips',
      error: error.message
    });
  }
};
// Send reminder emails to sellers who have not uploaded any products
exports.sendRemindersToSellersWithoutProducts = async (req, res) => {
  try {
    // Find sellers who registered more than 7 days ago but have no products
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days ago

    // Find sellers with no products who registered before the cutoff date
    const sellers = await Seller.find({
      createdAt: { $lt: cutoffDate },
      isDisabled: false,
      emailVerified: true
    });

    // Prepare for tracking results
    const results = {
      totalSellers: sellers.length,
      emailsSent: 0,
      errors: []
    };

    // Check each seller for products
    for (const seller of sellers) {
      // Count products for this seller
      const productCount = await Product.countDocuments({ seller: seller._id });

      // If seller has no products, send reminder email
      if (productCount === 0) {
        try {
          // Ensure SendGrid API key is set
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);

          // Prepare email content
          const emailMsg = {
            to: seller.email,
            from: 'Auqli Support <support@auqli.com>',
            subject: 'Start Selling on Auqli - Upload Your First Product',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Ready to Start Selling?</h2>
                <p>Dear ${seller.firstName},</p>
                <p>We noticed that you haven't uploaded any products to your Auqli store yet. Getting started is easy!</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <h3 style="margin-top: 0;">Why sell on Auqli?</h3>
                  <ul>
                    <li>Reach thousands of potential customers</li>
                    <li>Easy-to-use seller dashboard</li>
                    <li>Secure payments and reliable shipping options</li>
                    <li>Dedicated seller support</li>
                  </ul>
                </div>
                
                <p>To upload your first product:</p>
                <ol>
                  <li>Log in to your seller account</li>
                  <li>Navigate to your dashboard</li>
                  <li>Click Products on the side bar</li>
                  <li>Fill in your product details and upload images</li>
                  <li>Publish your product</li>
                  <li>Add a blip to your product to increase visibility</li>
                </ol>
                
                <div style="text-align: center; margin: 25px 0;">
                  <a href="https://seller.auqli.live" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    LOGIN TO YOUR ACCOUNT
                  </a>
                </div>
                
                <p>Need help getting started? Our support team is ready to assist you:</p>
                <p>Email: <a href="mailto:support@auqli.com" style="color: #4CAF50;">support@auqli.com</a></p>
              
                
                <p>We're excited to see what you'll offer on Auqli!</p>
                <p>Best regards,<br>The Auqli Team</p>
              </div>
            `
          };

          // Send the email
          await sgMail.send(emailMsg);
          results.emailsSent++;

          console.log(`Reminder email sent to seller without products: ${seller.email}`);
        } catch (emailError) {
          console.error(`Error sending reminder email to ${seller.email}:`, emailError);
          results.errors.push({
            sellerId: seller._id,
            email: seller.email,
            error: emailError.message
          });
        }
      }
    }

    // Return success response with results
    res.json({
      success: true,
      message: `Successfully processed ${results.totalSellers} sellers and sent ${results.emailsSent} reminder emails`,
      results
    });
  } catch (error) {
    console.error('Error sending reminders to sellers without products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminder emails',
      error: error.message
    });
  }
};

// Send reminder emails to sellers who have not uploaded any blips
exports.sendRemindersToSellersWithoutBlips = async (req, res) => {
  try {
    // Find active sellers who are verified
    const sellers = await Seller.find({
      isDisabled: false,
      emailVerified: true
    });

    // Prepare for tracking results
    const results = {
      totalSellers: sellers.length,
      sellersWithProducts: 0,
      sellersWithoutBlips: 0,
      emailsSent: 0,
      errors: []
    };

    // Check each seller for products with blips
    for (const seller of sellers) {
      // Count products for this seller
      const productCount = await Product.countDocuments({ seller: seller._id });

      if (productCount > 0) {
        results.sellersWithProducts++;

        // Count products with blips for this seller
        const productsWithBlips = await Product.countDocuments({
          seller: seller._id,
          'blips.0': { $exists: true } // At least one blip exists
        });

        // If seller has products but no blips, send reminder email
        if (productsWithBlips === 0) {
          results.sellersWithoutBlips++;

          try {
            // Ensure SendGrid API key is set
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);

            // Get a sample of the seller's products (up to 3)
            const sellerProducts = await Product.find({ seller: seller._id })
              .select('name images')
              .limit(3);

            // Create product list HTML
            const productListHTML = sellerProducts.map(product => `
              <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #eee; border-radius: 5px;">
                <img src="${product.images[0]?.url || 'https://via.placeholder.com/100'}" 
                     alt="${product.name}" 
                     style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; float: left;">
                <div style="margin-left: 60px;">
                  <p style="margin: 0; font-weight: bold;">${product.name}</p>
                  <p style="margin: 5px 0 0 0; font-size: 12px;">Add a blip to increase visibility!</p>
                </div>
                <div style="clear: both;"></div>
              </div>
            `).join('');

            // Prepare email content
            const emailMsg = {
              to: seller.email,
              from: 'Auqli Support <support@auqli.com>',
              subject: 'Boost Your Sales with Product Blips on Auqli',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Increase Your Product Visibility with Blips!</h2>
                  <p>Dear ${seller.firstName},</p>
                  <p>We noticed that you haven't added any blips to your products on Auqli. Product blips are short videos that can significantly increase your product visibility and conversion rates!</p>
                  
                  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h3 style="margin-top: 0;">Why add blips to your products?</h3>
                    <ul>
                      <li><strong>200% higher engagement</strong> compared to static images</li>
                      <li><strong>75% increase</strong> in time spent viewing your products</li>
                      <li><strong>40% higher conversion rate</strong> for products with blips</li>
                      <li>Appear in the popular blips feed for more visibility</li>
                    </ul>
                  </div>
                  
                  <h3>Your products waiting for blips:</h3>
                  ${productListHTML}
                  ${sellerProducts.length < productCount ? `<p style="font-style: italic; text-align: center;">And ${productCount - sellerProducts.length} more...</p>` : ''}
                  
                  <p>Adding blips is easy! Simply:</p>
                  <ol>
                    <li>Log in to your seller account</li>
                    <li>Go to your product list</li>
                    <li>Select a product and click "Add Blip"</li>
                    <li>Upload a short video (15-60 seconds) showcasing your product</li>
                  </ol>
                  
                  <div style="text-align: center; margin: 25px 0;">
                    <a href="https://seller.auqli.live/dashboard/blips" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                      ADD BLIPS NOW
                    </a>
                  </div>
                  
                
                  
                  <p>Best regards,<br>The Auqli Team</p>
                </div>
              `
            };

            // Send the email
            await sgMail.send(emailMsg);
            results.emailsSent++;

            console.log(`Reminder email sent to seller without blips: ${seller.email}`);
          } catch (emailError) {
            console.error(`Error sending blip reminder email to ${seller.email}:`, emailError);
            results.errors.push({
              sellerId: seller._id,
              email: seller.email,
              error: emailError.message
            });
          }
        }
      }
    }

    // Return success response with results
    res.json({
      success: true,
      message: `Successfully processed ${results.totalSellers} sellers and sent ${results.emailsSent} blip reminder emails`,
      results
    });
  } catch (error) {
    console.error('Error sending reminders to sellers without blips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send blip reminder emails',
      error: error.message
    });
  }
};

// Get transactions for a specific buyer
exports.getBuyerTransactions = async (req, res) => {
  try {
    const { buyerId } = req.params;
    const { startDate, endDate, type, page = 1, limit = 20 } = req.query;
    const queryPage = parseInt(page);
    const queryLimit = parseInt(limit);
    const skip = (queryPage - 1) * queryLimit;

    // Validate buyerId
    if (!mongoose.Types.ObjectId.isValid(buyerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid buyer ID format'
      });
    }

    // Check if buyer exists
    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    // Build filter for wallet transactions
    let transactions = [];
    if (buyer.wallet && buyer.wallet.transactions && buyer.wallet.transactions.length > 0) {
      transactions = [...buyer.wallet.transactions];

      // Apply filters
      if (startDate || endDate) {
        const startDateTime = startDate ? new Date(startDate) : null;
        const endDateTime = endDate ? new Date(endDate) : null;

        transactions = transactions.filter(transaction => {
          const transactionDate = new Date(transaction.createdAt);
          if (startDateTime && endDateTime) {
            return transactionDate >= startDateTime && transactionDate <= endDateTime;
          } else if (startDateTime) {
            return transactionDate >= startDateTime;
          } else if (endDateTime) {
            return transactionDate <= endDateTime;
          }
          return true;
        });
      }

      if (type && type !== 'all') {
        transactions = transactions.filter(transaction => transaction.type === type);
      }

      // Sort by most recent first
      transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Calculate total for pagination
    const totalTransactions = transactions.length;

    // Apply pagination
    const paginatedTransactions = transactions.slice(skip, skip + queryLimit);

    // Prepare response
    res.json({
      success: true,
      data: {
        buyer: {
          _id: buyer._id,
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          email: buyer.email,
          walletBalance: buyer.wallet?.balance || 0
        },
        transactions: paginatedTransactions
      },
      pagination: {
        total: totalTransactions,
        page: queryPage,
        limit: queryLimit,
        pages: Math.ceil(totalTransactions / queryLimit)
      }
    });
  } catch (error) {
    console.error('Error fetching buyer transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buyer transactions',
      error: error.message
    });
  }
};

// Major Category Controller Functions

// Create a new major category
exports.createMajorCategory = async (req, res) => {
  try {
    const { name, categoryIds } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Check if major category with the same name already exists
    const existingMajorCategory = await MajorCategory.findOne({ name });
    if (existingMajorCategory) {
      return res.status(400).json({
        success: false,
        message: 'Major category with this name already exists'
      });
    }

    // Create image object if file is uploaded
    let image = null;
    if (req.file) {
      const params = {
        Bucket: process.env.CDN_S3_BUCKET,
        Key: `major-categories/${uuidv4()}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      const data = await s3.upload(params).promise();

      image = {
        url: `https://${process.env.CDN_URL}/${data.Key}`,
        public_id: data.Key,
      };
    }

    // Validate and check if categories are already assigned to another major category
    let parsedCategoryIds = categoryIds;

    // Check if categoryIds is a string (JSON array) and parse it
    if (categoryIds && typeof categoryIds === 'string') {
      try {
        parsedCategoryIds = JSON.parse(categoryIds);
      } catch (err) {
        console.error('Error parsing categoryIds:', err);
        return res.status(400).json({
          success: false,
          message: 'Invalid category IDs format'
        });
      }
    }

    if (parsedCategoryIds && parsedCategoryIds.length > 0) {
      // Check if categories exist
      const categories = await Category.find({ _id: { $in: parsedCategoryIds } });
      if (categories.length !== parsedCategoryIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more categories do not exist'
        });
      }

      // Check if any of the categories are already assigned to another major category
      const assignedCategories = await MajorCategory.find({
        categories: { $in: parsedCategoryIds }
      });

      if (assignedCategories.length > 0) {
        // Get names of already assigned categories
        const conflictingCategoryIds = [];
        assignedCategories.forEach(majorCat => {
          const conflicts = majorCat.categories.filter(catId =>
            parsedCategoryIds.includes(catId.toString())
          );
          conflictingCategoryIds.push(...conflicts);
        });

        const conflictingCategories = await Category.find({
          _id: { $in: conflictingCategoryIds }
        });

        return res.status(400).json({
          success: false,
          message: 'Some categories are already assigned to another major category',
          conflictingCategories: conflictingCategories.map(c => c.name)
        });
      }
    }

    // Create new major category
    const majorCategory = new MajorCategory({
      name,
      image,
      categories: parsedCategoryIds || []
    });

    await majorCategory.save();

    res.status(201).json({
      success: true,
      message: 'Major category created successfully',
      majorCategory
    });
  } catch (error) {
    console.error('Create major category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create major category',
      error: error.message
    });
  }
};

// Get all major categories
exports.getMajorCategories = async (req, res) => {
  try {
    const majorCategories = await MajorCategory.find()
      .populate('categories', 'name image')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: majorCategories
    });
  } catch (error) {
    console.error('Get major categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get major categories',
      error: error.message
    });
  }
};

// Get a single major category by ID
exports.getMajorCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const majorCategory = await MajorCategory.findById(id)
      .populate('categories', 'name image subCategories');

    if (!majorCategory) {
      return res.status(404).json({
        success: false,
        message: 'Major category not found'
      });
    }

    res.json({
      success: true,
      data: majorCategory
    });
  } catch (error) {
    console.error('Get major category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get major category',
      error: error.message
    });
  }
};

// Update a major category
exports.updateMajorCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryIds, isActive } = req.body;

    const majorCategory = await MajorCategory.findById(id);
    if (!majorCategory) {
      return res.status(404).json({
        success: false,
        message: 'Major category not found'
      });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== majorCategory.name) {
      const existingMajorCategory = await MajorCategory.findOne({ name });
      if (existingMajorCategory) {
        return res.status(400).json({
          success: false,
          message: 'Major category with this name already exists'
        });
      }
      majorCategory.name = name;
    }

    // Handle image upload if file is provided
    if (req.file) {
      // Delete old image from S3 if it exists
      if (majorCategory.image && majorCategory.image.public_id) {
        await s3.deleteObject({
          Bucket: process.env.CDN_S3_BUCKET,
          Key: majorCategory.image.public_id
        }).promise();
      }

      // Upload new image
      const params = {
        Bucket: process.env.CDN_S3_BUCKET,
        Key: `major-categories/${uuidv4()}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      const data = await s3.upload(params).promise();

      majorCategory.image = {
        url: `https://${process.env.CDN_URL}/${data.Key}`,
        public_id: data.Key,
      };
    }

    // Update isActive if provided
    if (isActive !== undefined) {
      majorCategory.isActive = isActive;
    }

    // Update categories if provided
    if (categoryIds) {
      // Parse categoryIds if it's a string
      let parsedCategoryIds = categoryIds;
      if (typeof categoryIds === 'string') {
        try {
          parsedCategoryIds = JSON.parse(categoryIds);
        } catch (err) {
          console.error('Error parsing categoryIds:', err);
          return res.status(400).json({
            success: false,
            message: 'Invalid category IDs format'
          });
        }
      }

      // Check if categories exist
      const categories = await Category.find({ _id: { $in: parsedCategoryIds } });
      if (categories.length !== parsedCategoryIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more categories do not exist'
        });
      }

      // Find categories that are being added (not in the current list)
      const currentCategoryIds = majorCategory.categories.map(id => id.toString());
      const newCategoryIds = parsedCategoryIds.filter(id => !currentCategoryIds.includes(id));

      // Check if any new categories are already assigned to another major category
      if (newCategoryIds.length > 0) {
        const assignedCategories = await MajorCategory.find({
          _id: { $ne: id }, // Exclude the current major category
          categories: { $in: newCategoryIds }
        });

        if (assignedCategories.length > 0) {
          // Get names of already assigned categories
          const conflictingCategoryIds = [];
          assignedCategories.forEach(majorCat => {
            const conflicts = majorCat.categories.filter(catId =>
              newCategoryIds.includes(catId.toString())
            );
            conflictingCategoryIds.push(...conflicts);
          });

          const conflictingCategories = await Category.find({
            _id: { $in: conflictingCategoryIds }
          });

          return res.status(400).json({
            success: false,
            message: 'Some categories are already assigned to another major category',
            conflictingCategories: conflictingCategories.map(c => c.name)
          });
        }
      }

      majorCategory.categories = parsedCategoryIds;
    }

    majorCategory.updatedAt = Date.now();
    await majorCategory.save();

    res.json({
      success: true,
      message: 'Major category updated successfully',
      majorCategory
    });
  } catch (error) {
    console.error('Update major category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update major category',
      error: error.message
    });
  }
};

// Delete a major category
exports.deleteMajorCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const majorCategory = await MajorCategory.findById(id);
    if (!majorCategory) {
      return res.status(404).json({
        success: false,
        message: 'Major category not found'
      });
    }

    // Delete image from S3 if it exists
    if (majorCategory.image && majorCategory.image.public_id) {
      await s3.deleteObject({
        Bucket: process.env.CDN_S3_BUCKET,
        Key: majorCategory.image.public_id
      }).promise();
    }

    await MajorCategory.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Major category deleted successfully'
    });
  } catch (error) {
    console.error('Delete major category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete major category',
      error: error.message
    });
  }
};

// Get unassigned categories (categories not assigned to any major category)
exports.getUnassignedCategories = async (req, res) => {
  try {
    // Find all categories that are assigned to major categories
    const majorCategories = await MajorCategory.find();
    const assignedCategoryIds = [];

    majorCategories.forEach(majorCat => {
      assignedCategoryIds.push(...majorCat.categories);
    });

    // Find all categories that are not in the assigned list
    const unassignedCategories = await Category.find({
      _id: { $nin: assignedCategoryIds }
    }).select('name image subCategories');

    res.json({
      success: true,
      data: unassignedCategories
    });
  } catch (error) {
    console.error('Get unassigned categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unassigned categories',
      error: error.message
    });
  }
};

// Get transactions for a specific seller
exports.getSellerTransactions = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { startDate, endDate, type, page = 1, limit = 20 } = req.query;
    const queryPage = parseInt(page);
    const queryLimit = parseInt(limit);
    const skip = (queryPage - 1) * queryLimit;

    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seller ID format'
      });
    }

    // Check if seller exists
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Find transactions for this seller
    const filter = { seller: sellerId };

    // Apply date filters if provided
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Apply type filter if provided
    if (type && type !== 'all') {
      filter.type = type;
    }

    // Get total count for pagination
    const totalTransactions = await Transaction.countDocuments(filter);

    // Fetch transactions with pagination
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(queryLimit)
      .populate('orderId', 'order_id totalAmount buyer');

    // Enhance transactions with buyer info where applicable
    const enhancedTransactions = await Promise.all(transactions.map(async (transaction) => {
      const transactionObj = transaction.toObject();

      // For order_payment transactions, try to get buyer info
      if (transaction.type === 'order_payment' && transaction.orderId && transaction.orderId.buyer) {
        try {
          const buyer = await Buyer.findById(transaction.orderId.buyer)
            .select('firstName lastName email');

          if (buyer) {
            transactionObj.buyerInfo = {
              _id: buyer._id,
              name: `${buyer.firstName} ${buyer.lastName}`,
              email: buyer.email
            };
          }
        } catch (err) {
          console.error('Error fetching buyer info for transaction:', err);
        }
      }

      return transactionObj;
    }));

    // Prepare response
    res.json({
      success: true,
      data: {
        seller: {
          _id: seller._id,
          firstName: seller.firstName,
          lastName: seller.lastName,
          email: seller.email,
          storeName: seller.storeName,
          businessName: seller.businessName,
          walletBalance: seller.walletBalance || 0
        },
        transactions: enhancedTransactions
      },
      pagination: {
        total: totalTransactions,
        page: queryPage,
        limit: queryLimit,
        pages: Math.ceil(totalTransactions / queryLimit)
      }
    });
  } catch (error) {
    console.error('Error fetching seller transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller transactions',
      error: error.message
    });
  }
};
