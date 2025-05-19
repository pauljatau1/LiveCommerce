const Category = require('../models/Category');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const Banner = require('../models/Banner');
const Announcement = require('../models/Annoucement');
const Resource = require('../models/Resource');
const PlatformNotification = require('../models/PlatformNotification');

// Get all active platform notifications
exports.getActivePlatformNotifications = async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Build the filter to get only active notifications
    const filter = {
      isActive: true,
      $or: [
        // No end date specified (permanent notification)
        { endDate: null },
        // End date is in the future
        { endDate: { $gt: currentDate } }
      ],
      // Start date is in the past or present
      startDate: { $lte: currentDate }
    };
    
    // Add type filter if specified
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    // Get notifications with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const notifications = await PlatformNotification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-createdBy'); // Exclude the admin reference for security
    
    // Get total count for pagination
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
    console.error('Error getting active platform notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve platform notifications',
      error: error.message
    });
  }
}; 