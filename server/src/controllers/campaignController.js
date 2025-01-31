const Campaign = require('../models/Campaign');
const Seller = require('../models/Seller');
const sgMail = require('@sendgrid/mail');
const { s3 } = require('../config/awsConfig');
const { v4: uuidv4 } = require('uuid');

// Create a new campaign
exports.createCampaign = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { title, message, audienceType, scheduledFor, products } = req.body;
    const files = req.files;

    // Validate daily campaign limit
    const todaysCampaigns = await Campaign.countDocuments({
      seller: sellerId,
      createdAt: {
        $gte: new Date().setHours(0, 0, 0, 0)
      }
    });

    if (todaysCampaigns >= 5) {
      return res.status(400).json({
        message: 'Daily campaign limit reached (5 campaigns per day)'
      });
    }

    // Upload media files if present
    let media = [];
    if (files && files.length > 0) {
      media = await Promise.all(files.map(async (file) => {
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const key = `campaigns/${sellerId}/${fileName}`;

        try {
          await s3.upload({
            Bucket: 'auqli-uploads',
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read'
          }).promise();

          return {
            url: `https://auqli-uploads.s3.amazonaws.com/${key}`,
            public_id: key,
            type: file.mimetype.startsWith('image/') ? 'image' : 'video'
          };
        } catch (error) {
          console.error('S3 upload error:', error);
          throw new Error('Failed to upload media file');
        }
      }));
    }

    // Get recipients based on audience type
    const seller = await Seller.findById(sellerId);
    let recipients = [];

    switch (audienceType) {
      case 'all':
        recipients = seller.followers
          .filter(f => !f.optedOut)
          .map(f => ({
            buyer: f.buyerId,
            status: 'pending'
          }));
        break;
      case 'active':
        recipients = seller.followers
          .filter(f => 
            !f.optedOut && 
            f.lastInteraction && 
            new Date(f.lastInteraction) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          .map(f => ({
            buyer: f.buyerId,
            status: 'pending'
          }));
        break;
      case 'inactive':
        recipients = seller.followers
          .filter(f => 
            !f.optedOut && 
            (!f.lastInteraction || 
            new Date(f.lastInteraction) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
          .map(f => ({
            buyer: f.buyerId,
            status: 'pending'
          }));
        break;
    }

    const campaign = new Campaign({
      seller: sellerId,
      title,
      message,
      media,
      products,
      audienceType,
      scheduledFor,
      recipients,
      status: scheduledFor ? 'scheduled' : 'draft'
    });

    await campaign.save();

    // Update seller's campaign stats
    seller.campaigns.push(campaign._id);
    seller.campaignStats.totalCampaigns += 1;
    seller.campaignStats.totalRecipients += recipients.length;
    seller.campaignStats.dailyCampaignCount += 1;
    seller.campaignStats.lastCampaignDate = new Date();
    await seller.save();

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign
    });
  } catch (error) {
    console.error('Campaign creation error:', error);
    res.status(500).json({
      message: 'Failed to create campaign',
      error: error.message
    });
  }
};

// Get all campaigns for a seller
exports.getCampaigns = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const sellerId = req.user.id;

    const query = { seller: sellerId };
    if (status) {
      query.status = status;
    }

    const campaigns = await Campaign.find(query)
      .populate('products', 'name images price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Campaign.countDocuments(query);

    res.json({
      campaigns,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve campaigns',
      error: error.message
    });
  }
};

// Additional controller methods to be continued... 