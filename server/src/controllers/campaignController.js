const Campaign = require('../models/Campaign');
const Seller = require('../models/Seller');
const sgMail = require('@sendgrid/mail');
const { s3 } = require('../config/awsConfig');
const { v4: uuidv4 } = require('uuid');
const notificationController = require('./notificationController');

sgMail.setApiKey('SG.REDACTED');

// Helper function for sending campaign emails
async function sendCampaignEmails(campaign, seller, recipients) {
  console.log('Starting to send campaign emails...');
  console.log('Using SendGrid From Email:', process.env.SENDGRID_FROM_EMAIL || 'campaigns@auqli.com');
  try {
    if (!recipients || recipients.length === 0) {
      console.log('No recipients found for campaign');
      return [];
    }

    const validRecipients = recipients.filter(r => r.buyer?.email);
    console.log(`Found ${validRecipients.length} valid recipients out of ${recipients.length} total`);

    const emailPromises = validRecipients.map(async (recipient) => {
      const buyerEmail = recipient.buyer.email;
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'joseph@auqli.com';
      console.log('Email Configuration:', {
        from: fromEmail,
        fromName: seller.businessName || 'Auqli Campaigns',
        to: buyerEmail,
        subject: `New Campaign from ${seller.businessName || seller.firstName}`
      });

      const msg = {
        to: buyerEmail,
        from: {
          email: fromEmail,
          name: seller.businessName || 'Auqli Campaigns'
        },
        subject: `New Campaign from ${seller.businessName || seller.firstName}`,
        html: `
          <div style="background-color: #f9fafb; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #1f2937; margin-bottom: 20px;">${campaign.title}</h1>
              
              <p style="color: #4b5563; line-height: 1.6;">${campaign.message}</p>
              
              ${campaign.selectedProducts?.length > 0 ? `
                <div style="margin-top: 20px;">
                  <h2 style="color: #1f2937; font-size: 18px;">Featured Products:</h2>
                  <ul style="list-style: none; padding: 0;">
                    ${campaign.selectedProducts.map(product => `
                      <li style="margin-bottom: 10px;">
                        <div style="display: flex; align-items: center;">
                          <img src="${product.images[0]?.url}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
                          <div>
                            <p style="margin: 0; color: #1f2937; font-weight: 500;">${product.name}</p>
                            <p style="margin: 0; color: #6b7280;">N${product.price.toLocaleString()}</p>
                          </div>
                        </div>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.FRONTEND_URL}/store/${seller._id}" 
                   style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Visit Store
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center;">
                You're receiving this email because you follow ${seller.businessName || seller.firstName} on Auqli.
                <br>
                <a href="${process.env.FRONTEND_URL}/unsubscribe/${recipient.buyer._id}" style="color: #4f46e5;">Unsubscribe</a>
              </p>
            </div>
          </div>
        `
      };

      try {
        console.log(`Attempting to send email from ${fromEmail} to ${buyerEmail}`);
        await sgMail.send(msg);
        console.log(`Email sent successfully from ${fromEmail} to ${buyerEmail}`);
        return { success: true, email: buyerEmail, fromEmail };
      } catch (error) {
        console.error(`Failed to send email from ${fromEmail} to ${buyerEmail}:`, error);
        return { 
          success: false, 
          email: buyerEmail, 
          fromEmail,
          error: error.message,
          details: error.response?.body
        };
      }
    });

    const results = await Promise.all(emailPromises);
    console.log('Email sending completed:', {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'campaigns@auqli.com'
    });

    return results;
  } catch (error) {
    console.error('Error in sendCampaignEmails:', error);
    throw error;
  }
}

// Create a new campaign
exports.createCampaign = async (req, res) => {
  console.log('Starting campaign creation...');
  try {
    const sellerId = req.user.id;
    console.log('Seller ID:', sellerId);
    
    const { 
      title, 
      message, 
      audienceType, 
      scheduledFor, 
      selectedProducts 
    } = req.body;

    console.log('Campaign data received:', {
      title,
      audienceType,
      scheduledFor,
      productsCount: selectedProducts?.length,
    });

    // Validate daily campaign limit
    console.log('Checking daily campaign limit...');
    const todaysCampaigns = await Campaign.countDocuments({
      seller: sellerId,
      createdAt: {
        $gte: new Date().setHours(0, 0, 0, 0)
      }
    });
    console.log('Campaigns created today:', todaysCampaigns);

    if (todaysCampaigns >= 20) {
      console.log('Daily limit exceeded');
      return res.status(400).json({
        message: 'Daily campaign limit reached (5 campaigns per day)'
      });
    }

    // Get recipients based on audience type
    console.log('Fetching seller data...');
    const seller = await Seller.findById(sellerId)
      .populate({
        path: 'followers.buyerId',
        select: 'email firstName lastName'
      });
    
    if (!seller) {
      console.log('Seller not found');
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    console.log('Total followers found:', seller.followers.length);

    let recipients = [];

    console.log('Processing audience type:', audienceType);
    switch (audienceType) {
      case 'all':
        recipients = seller.followers
          .filter(f => !f.optedOut && f.buyerId)
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
    console.log('Recipients processed:', recipients.length);

    console.log('Creating campaign document...');
    const campaign = new Campaign({
      seller: sellerId,
      title,
      message,
      selectedProducts,
      audienceType,
      scheduledFor,
      recipients,
      status: scheduledFor ? 'scheduled' : 'sent',
      stats: {
        totalRecipients: recipients.length
      }
    });

    console.log('Saving campaign...');
    await campaign.save();
    console.log('Campaign saved successfully');

    // Update seller's campaign stats
    console.log('Updating seller campaign stats...');
    try {
      seller.campaigns = seller.campaigns || [];
      seller.campaigns.push(campaign._id);
      
      seller.campaignStats = seller.campaignStats || {
        totalCampaigns: 0,
        totalRecipients: 0,
        dailyCampaignCount: 0
      };
      
      seller.campaignStats.totalCampaigns += 1;
      seller.campaignStats.totalRecipients += recipients.length;
      seller.campaignStats.dailyCampaignCount += 1;
      seller.campaignStats.lastCampaignDate = new Date();
      
      console.log('Saving updated seller data...');
      await seller.save();
      console.log('Seller data updated successfully');
    } catch (error) {
      console.error('Error updating seller stats:', error);
      // Continue execution even if seller stats update fails
    }

    // Send emails if not scheduled
    if (!scheduledFor) {
      console.log('Preparing to send immediate emails...');
      const populatedCampaign = await Campaign.findById(campaign._id)
        .populate('selectedProducts')
        .populate({
          path: 'recipients.buyer',
          select: 'email firstName lastName'
        });

      const emailResults = await sendCampaignEmails(
        populatedCampaign,
        seller,
        populatedCampaign.recipients
      );

      // Update campaign with email status
      campaign.emailStatus = {
        sent: emailResults.filter(r => r.success).length,
        failed: emailResults.filter(r => !r.success).length,
        lastSent: new Date()
      };
      await campaign.save();
    }

    // Create notification for seller
    console.log('Creating seller notification...');
    await notificationController.createNotification(
      sellerId,
      scheduledFor ? 'campaign_scheduled' : 'new_campaign',
      {
        campaignId: campaign._id,
        campaignTitle: title,
        recipientCount: recipients.length,
        scheduledFor
      }
    );

    console.log('Campaign creation completed successfully');
    res.status(201).json({
      message: 'Campaign created successfully',
      campaign
    });
  } catch (error) {
    console.error('Campaign creation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Failed to create campaign',
      error: error.message,
      stack: error.stack
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

    // Get campaigns with stats
    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Calculate stats for each campaign
    const campaignsWithStats = campaigns.map(campaign => {
      const openRate = campaign.stats.totalRecipients > 0 
        ? ((campaign.stats.opened / campaign.stats.totalRecipients) * 100).toFixed(1)
        : 0;
      
      const clickRate = campaign.stats.totalRecipients > 0
        ? ((campaign.stats.clicked / campaign.stats.totalRecipients) * 100).toFixed(1)
        : 0;

      return {
        ...campaign,
        openRate: `${openRate}%`,
        clickRate: `${clickRate}%`,
        followers: campaign.stats.totalRecipients,
        sales: `N ${campaign.stats.sales.toLocaleString()}`
      };
    });

    const total = await Campaign.countDocuments(query);

    res.json({
      campaigns: campaignsWithStats,
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

// Get campaign trends
exports.getCampaignTrends = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const days = parseInt(req.query.days) || 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const campaigns = await Campaign.find({
      seller: sellerId,
      createdAt: { $gte: startDate }
    }).sort('createdAt');

    // Aggregate daily stats
    const dailyStats = {};
    campaigns.forEach(campaign => {
      const date = campaign.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          day: date,
          MessagesSent: 0,
          Opened: 0,
          Clicked: 0,
          Sales: 0
        };
      }

      dailyStats[date].MessagesSent += campaign.stats.totalRecipients;
      dailyStats[date].Opened += campaign.stats.opened;
      dailyStats[date].Clicked += campaign.stats.clicked;
      dailyStats[date].Sales += campaign.stats.sales;
    });

    const trendsData = Object.values(dailyStats);

    res.json(trendsData);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch campaign trends',
      error: error.message
    });
  }
};

// Get campaign statistics
exports.getCampaignStats = async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    // Get seller with followers count
    const seller = await Seller.findById(sellerId);
    const totalFollowers = seller.followers.length;

    // Get campaign statistics
    const campaigns = await Campaign.find({ seller: sellerId });
    
    // Calculate total messages sent
    const totalMessagesSent = campaigns.reduce((sum, campaign) => 
      sum + campaign.stats.totalRecipients, 0);

    // Calculate open rate
    const totalOpened = campaigns.reduce((sum, campaign) => 
      sum + campaign.stats.opened, 0);
    const openRate = totalMessagesSent > 0 
      ? ((totalOpened / totalMessagesSent) * 100).toFixed(1)
      : 0;

    // Calculate click rate
    const totalClicked = campaigns.reduce((sum, campaign) => 
      sum + campaign.stats.clicked, 0);
    const clickRate = totalMessagesSent > 0 
      ? ((totalClicked / totalMessagesSent) * 100).toFixed(1)
      : 0;

    // Calculate total sales
    const totalSales = campaigns.reduce((sum, campaign) => 
      sum + campaign.stats.sales, 0);

    // Calculate changes (comparing to previous period)
    const previousPeriodStart = new Date();
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
    
    const previousCampaigns = await Campaign.find({
      seller: sellerId,
      createdAt: { 
        $gte: previousPeriodStart,
        $lt: new Date()
      }
    });

    const currentPeriodStats = {
      followers: totalFollowers,
      messagesSent: totalMessagesSent,
      openRate: parseFloat(openRate),
      clickRate: parseFloat(clickRate),
      sales: totalSales
    };

    const previousPeriodStats = {
      followers: seller.stats?.previousFollowersCount || 0,
      messagesSent: previousCampaigns.reduce((sum, campaign) => 
        sum + campaign.stats.totalRecipients, 0),
      openRate: previousCampaigns.length > 0 
        ? (previousCampaigns.reduce((sum, campaign) => 
            sum + campaign.stats.opened, 0) / 
          previousCampaigns.reduce((sum, campaign) => 
            sum + campaign.stats.totalRecipients, 0) * 100)
        : 0,
      clickRate: previousCampaigns.length > 0
        ? (previousCampaigns.reduce((sum, campaign) => 
            sum + campaign.stats.clicked, 0) / 
          previousCampaigns.reduce((sum, campaign) => 
            sum + campaign.stats.totalRecipients, 0) * 100)
        : 0,
      sales: previousCampaigns.reduce((sum, campaign) => 
        sum + campaign.stats.sales, 0)
    };

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100).toFixed(1);
    };

    const stats = {
      totalFollowers: {
        value: totalFollowers,
        change: calculateChange(currentPeriodStats.followers, previousPeriodStats.followers)
      },
      totalMessagesSent: {
        value: totalMessagesSent,
        change: calculateChange(currentPeriodStats.messagesSent, previousPeriodStats.messagesSent)
      },
      openRate: {
        value: `${openRate}%`,
        change: calculateChange(currentPeriodStats.openRate, previousPeriodStats.openRate)
      },
      clickRate: {
        value: `${clickRate}%`,
        change: calculateChange(currentPeriodStats.clickRate, previousPeriodStats.clickRate)
      },
      salesGenerated: {
        value: totalSales,
        change: calculateChange(currentPeriodStats.sales, previousPeriodStats.sales)
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch campaign statistics',
      error: error.message
    });
  }
};

// Additional controller methods to be continued... 