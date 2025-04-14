const Campaign = require('../models/Campaign');
const Seller = require('../models/Seller');
const sgMail = require('@sendgrid/mail');
const { s3 } = require('../config/awsConfig');
const { v4: uuidv4 } = require('uuid');
const { createMessageNotifications, createNotification } = require('./notificationController');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

sgMail.setApiKey('SG.REDACTED');

// Helper function for sending campaign emails
async function sendCampaignEmails(campaign, seller, recipients) {
  console.log('Starting to send campaign emails...');
  console.log('Using SendGrid From Email:', process.env.SENDGRID_FROM_EMAIL || 'support@auqli.com');
  try {
    if (!recipients || recipients.length === 0) {
      console.log('No recipients found for campaign');
      return [];
    }

    const validRecipients = recipients.filter(r => r.buyer?.email);
    console.log(`Found ${validRecipients.length} valid recipients out of ${recipients.length} total`);

    const emailPromises = validRecipients.map(async (recipient) => {
      const buyerEmail = recipient.buyer.email;
      const buyerName = recipient.buyer.firstName || 'Valued Customer';
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'support@auqli.com';
      const sellerName = seller.businessName || seller.firstName;
      
      // Generate unique tracking IDs
      const trackingId = uuidv4();
      const pixelTrackingUrl = `${process.env.BACKEND_URL}/api/campaigns/track/open/${trackingId}`;
      
      console.log('Email Configuration:', {
        from: fromEmail,
        fromName: sellerName,
        to: buyerEmail,
        subject: `${sellerName} shared new products with you`,
        trackingId
      });

      // Add tracking data to recipient
      await Campaign.findOneAndUpdate(
        { _id: campaign._id, 'recipients.buyer': recipient.buyer._id },
        { 
          $set: { 
            'recipients.$.trackingId': trackingId,
            'recipients.$.status': 'sent'
          }
        }
      );

      const msg = {
        to: buyerEmail,
        from: {
          email: fromEmail,
          name: sellerName
        },
        subject: `${sellerName} shared new products with you`,
        headers: {
          "List-Unsubscribe": `<${process.env.FRONTEND_URL}/unsubscribe/${recipient.buyer._id}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "X-Campaign-ID": campaign._id.toString(),
          "X-Tracking-ID": trackingId
        },
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        },
        customArgs: {
          campaignId: campaign._id.toString(),
          trackingId: trackingId,
          buyerId: recipient.buyer._id.toString()
        },
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${buyerName},</h2>
              
              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                ${sellerName} has shared some exciting products with you:
              </p>

              <h1 style="color: #1f2937; margin-bottom: 20px;">${campaign.title}</h1>
              
              <p style="color: #4b5563; line-height: 1.6;">${campaign.message}</p>
              
              ${campaign.selectedProducts?.length > 0 ? `
                <div style="margin-top: 30px;">
                  <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">Featured Products:</h2>
                  <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px;">
                    ${campaign.selectedProducts.map(product => `
                      <div style="display: flex; align-items: center; margin-bottom: 15px; background-color: white; padding: 10px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <img src="${product.images[0]?.url}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 15px;">
                        <div>
                          <p style="margin: 0 0 5px 0; color: #1f2937; font-weight: 500; font-size: 16px;">${product.name}</p>
                          <p style="margin: 0; color: #6b7280; font-size: 14px;">N${product.price.toLocaleString()}</p>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.FRONTEND_URL}/store/${seller._id}?utm_source=email&utm_medium=campaign&utm_campaign=${campaign._id}&tid=${trackingId}" 
                   style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                  Visit ${sellerName}'s Store
                </a>
              </div>
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
                  You're receiving this email because you follow ${sellerName} on Auqli.
                  <br>
                  <a href="${process.env.FRONTEND_URL}/unsubscribe/${recipient.buyer._id}?tid=${trackingId}" 
                     style="color: #4f46e5; text-decoration: underline; margin-top: 5px; display: inline-block;">
                    Unsubscribe
                  </a>
                </p>
              </div>
              <!-- Tracking pixel -->
              <img src="${pixelTrackingUrl}" alt="" width="1" height="1" style="display:none" />
            </div>
          </div>
        `
      };

      try {
        console.log(`Attempting to send email from ${fromEmail} to ${buyerEmail}`);
        await sgMail.send(msg);
        console.log(`Email sent successfully from ${fromEmail} to ${buyerEmail}`);
        return { success: true, email: buyerEmail, fromEmail, trackingId };
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
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'support@auqli.com'
    });

    return results;
  } catch (error) {
    console.error('Error in sendCampaignEmails:', error);
    throw error;
  }
}

// Helper function to send campaign messages to conversations
async function sendCampaignMessages(campaign, seller, recipients) {
  console.log('Starting to send campaign messages to conversations...');
  try {
    if (!recipients || recipients.length === 0) {
      console.log('No recipients found for campaign messages');
      return [];
    }

    const validRecipients = recipients.filter(r => r.buyer);
    console.log(`Found ${validRecipients.length} valid recipients for messages`);

    const messagePromises = validRecipients.map(async (recipient) => {
      try {
        // Find or create conversation
        let conversation = await Conversation.findOne({
          'participants': {
            $all: [
              { $elemMatch: { id: seller._id, model: 'Seller' } },
              { $elemMatch: { id: recipient.buyer._id, model: 'Buyer' } }
            ]
          }
        });

        if (!conversation) {
          conversation = new Conversation({
            participants: [
              { id: seller._id, model: 'Seller' },
              { id: recipient.buyer._id, model: 'Buyer' }
            ]
          });
          await conversation.save();
        }

        // Create campaign message content with formatting
        let messageContent = `📢 *${campaign.title}*\n\n${campaign.message}\n\n`;
        
        // Add products count if any
        if (campaign.selectedProducts && campaign.selectedProducts.length > 0) {
          messageContent += `🛍️ *Featured Products (${campaign.selectedProducts.length})*\n`;
        }

        // Create the message
        const message = new Message({
          conversation: conversation._id,
          sender: { id: seller._id, model: 'Seller' },
          recipient: { id: recipient.buyer._id, model: 'Buyer' },
          content: messageContent,
          messageType: 'campaign', // New message type for campaigns
          media: campaign.media, // Include campaign media if any
          campaign: {
            id: campaign._id,
            title: campaign.title,
            message: campaign.message,
            products: campaign.selectedProducts.map(product => ({
              id: product._id,
              name: product.name,
              price: product.price,
              description: product.description,
              image: product.images?.[0]?.url || '',
              category: product.category,
              sku: product.inventory?.sku
            })),
            scheduledFor: campaign.scheduledFor,
            audienceType: campaign.audienceType,
            media: campaign.media
          }
        });

        await message.save();

        // Update conversation
        conversation.lastMessage = {
          content: `Campaign: ${campaign.title}`,
          sender: { id: seller._id, model: 'Seller' },
          messageType: 'campaign',
          createdAt: message.createdAt
        };

        // Increment unread count for recipient
        const recipientKey = recipient.buyer._id.toString();
        const currentCount = conversation.unreadCount.get(recipientKey) || 0;
        conversation.unreadCount.set(recipientKey, currentCount + 1);

        await conversation.save();

        // Create notification for the message
        try {
          const senderName = seller.businessName || seller.storeName || seller.firstName;
          const recipientName = recipient.buyer.firstName;
          await createMessageNotifications(message, senderName, recipientName);
        } catch (notificationError) {
          console.error('Error creating message notification:', notificationError);
          // Continue execution even if notification fails
        }

        console.log(`Successfully sent campaign message to buyer ${recipient.buyer._id}`);
        return { success: true, buyerId: recipient.buyer._id };
      } catch (error) {
        console.error(`Failed to send campaign message to buyer ${recipient.buyer._id}:`, error);
        return { 
          success: false, 
          buyerId: recipient.buyer._id,
          error: error.message
        };
      }
    });

    const results = await Promise.all(messagePromises);
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log('Campaign messages sending completed:', {
      total: results.length,
      successful: successCount,
      failed: failedCount
    });

    // Log details of failed messages
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      console.log('Failed message details:', failures);
    }

    return results;
  } catch (error) {
    console.error('Error in sendCampaignMessages:', error);
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

      // Also send campaign messages to conversations
      const messageResults = await sendCampaignMessages(
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
    await createNotification(
      sellerId,
      scheduledFor ? 'campaign_scheduled' : 'new_campaign',
      {
        campaignId: campaign._id,
        campaignTitle: title,
        recipientCount: recipients.length,
        scheduledFor,
        storeName: seller.storeName || seller.businessName || seller.firstName
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

// Track email opens
exports.trackEmailOpen = async (req, res) => {
  try {
    const { trackingId } = req.params;
    
    // Find campaign and recipient by tracking ID
    const campaign = await Campaign.findOne({
      'recipients.trackingId': trackingId
    });

    if (!campaign) {
      console.log('No campaign found for tracking ID:', trackingId);
      // Return a 1x1 transparent GIF
      res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
      return;
    }

    // Update recipient status and stats
    const recipient = campaign.recipients.find(r => r.trackingId === trackingId);
    if (recipient && recipient.status !== 'opened') {
      await Campaign.updateOne(
        { 
          _id: campaign._id,
          'recipients.trackingId': trackingId
        },
        { 
          $set: { 
            'recipients.$.status': 'opened',
            'recipients.$.openedAt': new Date()
          },
          $inc: { 'stats.opened': 1 }
        }
      );
    }

    // Return a 1x1 transparent GIF
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  } catch (error) {
    console.error('Error tracking email open:', error);
    res.status(500).end();
  }
};

// Track email clicks
exports.trackEmailClick = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { url } = req.query;
    
    // Find campaign and recipient by tracking ID
    const campaign = await Campaign.findOne({
      'recipients.trackingId': trackingId
    });

    if (!campaign) {
      console.log('No campaign found for tracking ID:', trackingId);
      return res.redirect(url || '/');
    }

    // Update recipient status and stats
    const recipient = campaign.recipients.find(r => r.trackingId === trackingId);
    if (recipient && recipient.status !== 'clicked') {
      await Campaign.updateOne(
        { 
          _id: campaign._id,
          'recipients.trackingId': trackingId
        },
        { 
          $set: { 
            'recipients.$.status': 'clicked',
            'recipients.$.clickedAt': new Date()
          },
          $inc: { 'stats.clicked': 1 }
        }
      );
    }

    // Redirect to the original URL
    res.redirect(url || '/');
  } catch (error) {
    console.error('Error tracking email click:', error);
    res.redirect(req.query.url || '/');
  }
};

// Additional controller methods to be continued... 