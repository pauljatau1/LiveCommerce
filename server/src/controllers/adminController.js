const Admin = require('../models/Admin');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Category = require('../models/Category'); 
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

const sgMail = require('@sendgrid/mail');
const mongoose = require('mongoose');
const axios = require('axios');
// const { TEST_DATA, isTestMode, getTestBankAccount } = require('../utils/paystackTestData');

// Add bank code mapping at the top of the file
const BANK_CODES = {
  'access bank': '044',
  'guaranty trust bank': '058',
  'first bank': '011',
  'united bank for africa': '033',
  'zenith bank': '057',
  // Add more banks as needed
};

// Test bank accounts you can use
const TEST_ACCOUNTS = {
  'Access Bank': {
    code: '044',
    number: '0690000031',
    name: 'Test Account'
  },
  'Guaranty Trust Bank': {
    code: '058',
    number: '0123456789',
    name: 'Test Account'
  }
};

// Add debug logging for Paystack configuration
console.log('Paystack Configuration:', {
  secretKeyExists: !!process.env.PAYSTACK_SECRET_KEY,
  secretKeyLength: process.env.PAYSTACK_SECRET_KEY?.length,
  secretKeyPrefix: process.env.PAYSTACK_SECRET_KEY?.substring(0, 6),
});

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

sgMail.setApiKey('SG.REDACTED');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const { s3 } = require('../config/awsConfig');
const { v4: uuidv4 } = require('uuid');

// Add validation middleware
const validatePaystackConfig = (req, res, next) => {
  if (!process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY === 'sk_test_REDACTED') {
    return res.status(500).json({
      success: false,
      message: 'Server configuration error',
      error: 'Invalid Paystack configuration'
    });
  }
  next();
};

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const newAdmin = new Admin({ username, email, password });
    await newAdmin.save();
    res.status(201).json({ message: 'Admin registered successfully!' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '80h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const users = await Buyer.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.find();
    res.json(sellers);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      seller
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
          <p><a href="${process.env.FRONTEND_URL}/seller/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Your Account</a></p>
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
    const products = await Product.find().populate('seller');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
        url: uploadResult.Location,
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
        Bucket: process.env.CDN_S3_BUCKET',
        Key: imageKey,
        Body: imageFile.buffer,
        ContentType: imageFile.mimetype,
      };

      const uploadResult = await s3.upload(uploadParams).promise();
      category.image = {
        url: uploadResult.Location,
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
        url: uploadResult.Location,
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
        url: uploadResult.Location,
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
      from: 'Auqli Admin <support@auqli.com>',
      subject: 'Your Auqli Account Has Been Verified! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Congratulations ${seller.firstName}!</h2>
          <p>Your Auqli seller account has been verified successfully. You can now:</p>
          <ul>
            <li>List products on the marketplace</li>
            <li>Access all seller features</li>
            <li>Process orders and receive payments</li>
          </ul>
          <p>Start selling today by logging into your account!</p>
          <p><a href="${process.env.FRONTEND_URL}/seller/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Your Account</a></p>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send to business email if it exists
    if (seller.businessEmail) {
      const businessEmailMsg = {
        to: seller.businessEmail,
        from: 'Auqli Admin <support@auqli.com>',
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
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query based on status filter
    const query = status ? { 'items.status': status } : {};

    const orders = await Order.find(query)
      .populate('buyer', 'firstName lastName email phoneNumber')
      .populate('seller', 'firstName lastName storeName email')
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalOrders: total
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
      { $match: dateQuery },
      { $group: {
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
      { $match: dateQuery },
      { $unwind: '$items' },
      { $group: {
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
      { $match: dateQuery },
      { $unwind: '$items' },
      { $group: {
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
      { $match: dateQuery },
      { $unwind: '$items' },
      { $group: {
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
      { $group: {
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
        { 'paymentInfo.gateway_response': { $in: [
          'fraudulent', 
          'suspicious',
          'declined',
          'timeout'
        ]}}, // Paystack specific responses
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
    const emailMsg = {
      to: withdrawal.seller.email,
      from: 'Auqli Admin <support@auqli.com>',
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

    await sgMail.send(emailMsg);

    res.json({ 
      message: 'Withdrawal status updated successfully', 
      withdrawal 
    });
  } catch (error) {
    await session.abortTransaction();
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
    const { title, description, link } = req.body;
    const mediaFile = req.files?.['media']?.[0];
    const bannerFile = req.files?.['banner']?.[0];

    if (!bannerFile) {
      return res.status(400).json({ message: 'Banner image is required' });
    }

    if (!mediaFile && !link) {
      return res.status(400).json({ message: 'Either media file or link must be provided' });
    }

    // Upload banner image
    const bannerKey = `resources/banners/${uuidv4()}-${bannerFile.originalname}`;
    const bannerParams = {
      Bucket: process.env.CDN_S3_BUCKET,
      Key: bannerKey,
      Body: bannerFile.buffer,
      ContentType: bannerFile.mimetype,
    };
    const bannerUpload = await s3.upload(bannerParams).promise();

    // Initialize resource data
    const resourceData = {
      title,
      description,
      banner: {
        url: bannerUpload.Location,
        public_id: bannerUpload.Key
      },
      link
    };

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
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update resource
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, link } = req.body;
    const mediaFile = req.files['media']?.[0];
    const bannerFile = req.files['banner']?.[0];

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Handle media file update
    if (mediaFile) {
      // Delete old media from S3
      if (resource.media.public_id) {
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
          
          <p><a href="${process.env.FRONTEND_URL}/seller/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Your Account</a></p>
          
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
        status: transferResponse.data.status,
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
      { $group: {
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

    // Process each product
    const createdProducts = [];
    
    for (const [index, productData] of results.entries()) {
      try {
        // Skip rows with empty product name
        if (!productData['product name']) {
          errors.push({
            row: index + 1,
            error: 'Product name is required'
          });
          continue;
        }

        // Map CSV fields to product model fields
        const parsedWeight = productData['product weight'] ? parseFloat(productData['product weight']) : 0;
        // Use default weight of 0.5 if weight is 0 or null
        const finalWeight = (!parsedWeight || parsedWeight === 0) ? 0.5 : parsedWeight;
        
        const parsedInventory = productData['product inventory'] ? parseInt(productData['product inventory']) : 1;
        const parsedPrice = productData['product main price'] ? parseFloat(productData['product main price']) : 0;
        
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
          errors.push({
            row: index + 1,
            productName: productData['product name'],
            error: 'Invalid price value'
          });
          continue;
        }
        
        // Check if upload status is 'active'
        if (productData['upload status'] && 
            productData['upload status'].toLowerCase() !== 'active') {
          errors.push({
            row: index + 1,
            productName: productData['product name'],
            error: 'Skipped product with non-active upload status'
          });
          continue;
        }

        // Create the product with validated data
        const product = new Product({
          name: productData['product name'],
          description: productData['product description'] || `Description for ${productData['product name']}`,
          price: parsedPrice,
          category: productData['product main category'] || 'Fashion',
          subCategory: productData['product subcategory'] || '',
          status: 'active',
          seller: sellerId,
          stock: parsedInventory,
          condition: productData['product condition'] || 'New',
          images: [{
            url: productData['product main image'] || 'https://burst.shopifycdn.com/photos/default-product-image.jpg'
          }],
          weight: finalWeight, // Save weight to top-level field
          shipping: {
            // Remove weight from shipping object
            freeShipping: false,
            shippingClass: 'standard'
          },
          inventory: {
            quantity: parsedInventory
          }
        });
        
        await product.save();
        createdProducts.push({
          id: product._id,
          name: product.name,
          price: product.price,
          category: product.category,
          image: product.images[0]?.url
        });
      } catch (error) {
        console.error('Error creating product:', error);
        errors.push({
          row: index + 1,
          productName: productData['product name'] || 'Unknown product',
          error: error.message
        });
      }
    }
    
    // Update seller's product count
    if (createdProducts.length > 0) {
      try {
        await Seller.findByIdAndUpdate(sellerId, {
          $inc: { 'stats.totalProducts': createdProducts.length }
        });
        
        // Send email notification to seller
        await sendBulkUploadEmail(seller, createdProducts, results.length, errors.length);
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
async function sendBulkUploadEmail(seller, products, totalProcessed, errorsCount) {
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
    
    // Email content
    const emailHTML = `
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
        
        <div style="background-color: #fff8e1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #7d6608;"><strong>Note:</strong> For any products where weight was not specified, a default weight of 0.5kg has been assigned to the product's weight field. You can update product weights in your store dashboard if needed.</p>
        </div>
        
        <p style="margin-top: 20px;">You can view and manage all your products in your seller dashboard.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'https://auqli.com'}/seller/products" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Products</a>
        </div>
        
        <p style="margin-top: 30px;">Thank you for selling with Auqli!</p>
        <p>Best regards,<br>The Auqli Team</p>
      </div>
    `;
    
    // Send the email using SendGrid
    const msg = {
      to: seller.email,
      from: 'Auqli Support <support@auqli.com>',
      subject: 'Bulk Product Upload Completed - Auqli',
      html: emailHTML,
    };
    
    await sgMail.send(msg);
    console.log(`Bulk upload notification email sent to ${seller.email}`);
    
  } catch (error) {
    console.error('Error sending bulk upload email:', error);
    // Don't throw error to prevent API failure
  }
}

// ... existing code continues ...

exports.downloadProductCsvTemplate = async (req, res) => {
  try {
    // Define the CSV header row with all the supported columns
    const headers = [
      'product name',
      'product main price',
      'product main image',
      'product description',
      'product weight',
      'product inventory',
      'product condition',
      'product main category',
      'product subcategory',
      'upload status'
    ].join(',');
    
    // Create sample data rows
    const sampleRows = [
      // Sample 1: Fashion item
      [
        'Ocean Blue Shirt',
        '50',
        'https://burst.shopifycdn.com/photos/example1.jpg',
        'Ocean blue cotton shirt for women',
        '0.5',
        '10',
        'New',
        'Fashion',
        'Women Fashion',
        'active'
      ].join(','),
      
      // Sample 2: Wearable Tech
      [
        'Yellow Wool Jumper',
        '80',
        'https://burst.shopifycdn.com/photos/example2.jpg',
        'Knitted jumper in yellow color',
        '0.8',
        '5',
        'New',
        'Wearable Tech',
        'Smartwatches',
        'active'
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

// ... existing code continues ...






