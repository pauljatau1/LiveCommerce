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
      from: 'Auqli Admin <joseph@auqli.com>',
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
        from: 'Auqli Admin <joseph@auqli.com>',
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
      from: 'Auqli Admin <joseph@auqli.com>',
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
        from: 'Auqli Admin <joseph@auqli.com>',
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
      Bucket: 'auqli-uploads',
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
          Bucket: 'auqli-uploads',
          Key: category.image.public_id,
        };
        await s3.deleteObject(deleteParams).promise();
      }

      // Upload new image
      const imageKey = `categories/${uuidv4()}-${imageFile.originalname}`;
      const uploadParams = {
        Bucket: 'auqli-uploads',
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
        Bucket: 'auqli-uploads',
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
      Bucket: 'auqli-uploads',
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
          Bucket: 'auqli-uploads',
          Key: banner.mainImage.public_id
        }).promise();
      }

      // Upload new image
      const imageKey = `banners/${uuidv4()}-${imageFile.originalname}`;
      const uploadResult = await s3.upload({
        Bucket: 'auqli-uploads',
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
        Bucket: 'auqli-uploads',
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
      from: 'Auqli Admin <joseph@auqli.com>',
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
        from: 'Auqli Admin <joseph@auqli.com>',
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
      from: 'Auqli Admin <joseph@auqli.com>',
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
      from: 'Auqli Admin <joseph@auqli.com>',
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
      Bucket: 'auqli-uploads',
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
        Bucket: 'auqli-uploads',
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
          Bucket: 'auqli-uploads',
          Key: resource.media.public_id
        }).promise();
      }

      // Upload new media
      const mediaKey = `resources/${uuidv4()}-${mediaFile.originalname}`;
      const mediaUpload = await s3.upload({
        Bucket: 'auqli-uploads',
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
          Bucket: 'auqli-uploads',
          Key: resource.banner.public_id
        }).promise();
      }

      // Upload new banner
      const bannerKey = `resources/banners/${uuidv4()}-${bannerFile.originalname}`;
      const bannerUpload = await s3.upload({
        Bucket: 'auqli-uploads',
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
        Bucket: 'auqli-uploads',
        Key: resource.media.public_id
      }).promise();
    }

    // Delete banner from S3
    if (resource.banner.public_id) {
      await s3.deleteObject({
        Bucket: 'auqli-uploads',
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
      from: 'Auqli Admin <joseph@auqli.com>',
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
        from: 'Auqli Admin <joseph@auqli.com>',
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

    const response = await paystack.get(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);

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
  let testAmount = null;

  try {
    console.log('Environment Check:', {
      nodeEnv: process.env.NODE_ENV,
      isTestMode: isTestMode(),
      paystackKeyExists: !!process.env.PAYSTACK_SECRET_KEY
    });

    const { withdrawalId } = req.params;
    console.log('Processing withdrawal:', { withdrawalId });

    withdrawal = await Withdrawal.findById(withdrawalId)
      .populate('seller')
      .session(session);

    if (!withdrawal) {
      throw new Error('Withdrawal request not found');
    }

    // For test mode, use minimum test amount
    testAmount = isTestMode() ? 10 : withdrawal.amount; // Use ₦10 for testing
    const amountInKobo = Math.round(testAmount * 100); // Convert to kobo

    console.log('Amount calculation:', {
      originalAmount: withdrawal.amount,
      testAmount: testAmount,
      amountInKobo: amountInKobo,
      isTestMode: isTestMode()
    });

    try {
      // First verify the recipient's bank account
      const verifyAccount = await paystack.get(
        `/bank/resolve?account_number=${withdrawal.bankDetails.accountNumber}&bank_code=${withdrawal.bankDetails.bankCode || '044'}`
      );
      
      console.log('Account verification:', {
        status: verifyAccount.data.status,
        accountName: verifyAccount.data.data.account_name
      });

      const recipientPayload = {
        type: 'nuban',
        name: verifyAccount.data.data.account_name, // Use verified account name
        account_number: withdrawal.bankDetails.accountNumber,
        bank_code: withdrawal.bankDetails.bankCode || '044',
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
        reason: `Test transfer - ${withdrawal.reference}`,
        currency: 'NGN'
      };
      console.log('Transfer payload:', transferPayload);

      const transferResponse = await paystack.post('/transfer', transferPayload);
      console.log('Transfer initiated:', {
        reference: transferResponse.data.data.reference,
        status: transferResponse.data.status,
        amount: transferResponse.data.data.amount / 100 // Convert back to Naira for logging
      });

      withdrawal.status = 'processing';
      withdrawal.paymentInfo = {
        transferReference: transferResponse.data.data.reference,
        transferRecipientCode: recipientResponse.data.data.recipient_code,
        initiatedAt: new Date(),
        testMode: isTestMode(),
        originalAmount: withdrawal.amount,
        testAmount: testAmount,
        amountInKobo: amountInKobo,
        paystackStatus: transferResponse.data.data.status,
        lastChecked: new Date(),
        reference: transferResponse.data.data.reference
      };

      withdrawal.reference = transferResponse.data.data.reference;

      withdrawal.notes.push({
        content: `Test transfer of ₦${testAmount} initiated (Original amount: ₦${withdrawal.amount})`,
        addedBy: 'admin'
      });

      await withdrawal.save({ session });
      await session.commitTransaction();
      console.log('Transaction committed successfully');

      res.json({
        success: true,
        message: 'Test transfer initiated successfully',
        data: {
          withdrawal,
          transfer: {
            reference: transferResponse.data.data.reference,
            amount: testAmount,
            originalAmount: withdrawal.amount,
            status: transferResponse.data.status
          },
          testMode: true
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
        throw new Error(`Test transfer failed: Insufficient balance for ₦${testAmount}. Please try a smaller amount or fund your test account.`);
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
      error: error.message,
      details: isTestMode() ? {
        testMode: true,
        originalAmount: withdrawal?.amount,
        testAmount: testAmount,
        withdrawalId: req.params.withdrawalId
      } : undefined
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
      from: 'Auqli Admin <joseph@auqli.com>',
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

    // Add a small delay for test mode (Paystack recommendation)
    if (isTestMode()) {
      await new Promise(resolve => setTimeout(resolve, 2000));
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
          otp: "123456"  // Test mode OTP
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

// Helper function to check test mode
const isTestMode = () => process.env.NODE_ENV === 'development';

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






