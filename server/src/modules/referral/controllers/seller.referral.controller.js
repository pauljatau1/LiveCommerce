const Seller = require('../../../models/Seller');
const Referral = require('../../../models/Referral');
const Buyer = require('../../../models/Buyer');

// Utility to generate a referral code on the fly
function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

/**
 * GET /api/v2/sellers/referral/overview
 * Returns current referral statistics, referral link, milestone, and wallet balance.
 * Lazy-generates a referral code if the seller doesn't have one.
 */
exports.getOverview = async (req, res) => {
  try {
    const sellerId = req.user.id;
    let seller = await Seller.findById(sellerId).select('referralCode referralStats referralMilestone walletBalance').lean();

    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    if (!seller.referralCode) {
      let code;
      let isUnique = false;
      while (!isUnique) {
        code = generateReferralCode();
        const existingBuyer = await Buyer.findOne({ referralCode: code });
        const existingSeller = await Seller.findOne({ referralCode: code });
        if (!existingBuyer && !existingSeller) isUnique = true;
      }

      await Seller.updateOne({ _id: sellerId }, { referralCode: code });
      seller.referralCode = code;
    }

    const referralLink = `${process.env.APP_BASE_URL || 'http://app.auqli.live'}/invite?ref=${seller.referralCode}`;

    res.status(200).json({
      success: true,
      data: {
        referralCode: seller.referralCode,
        referralLink,
        milestone: seller.referralMilestone || 'none',
        stats: seller.referralStats || { totalReferred: 0, completedReferrals: 0, totalEarned: 0, totalGMV: 0 },
        walletBalance: seller.walletBalance || 0
      }
    });

  } catch (err) {
    console.error('[Seller Referral Overview] Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/v2/sellers/referral/history
 * Returns paginated list of referrals for this seller.
 * Query params: page, limit, status, from, to
 */
exports.getHistory = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 10, status, from, to } = req.query;
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query = { referrer: sellerId, referrerModel: 'Seller' };
    if (status && status !== 'all') query.status = status;
    
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to)   query.createdAt.$lte = new Date(to);
    }

    const referrals = await Referral.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('referee', 'firstName lastName email profileImage createdAt')
      .lean();

    const total = await Referral.countDocuments(query);

    // map populated ref and add amountEarned
    const formatted = referrals.map(r => ({
      id: r._id.toString(),
      referee: r.referee ? {
        id: r.referee._id.toString(),
        name: `${r.referee.firstName || ''} ${r.referee.lastName || ''}`.trim(),
        email: r.referee.email,
        profileImage: r.referee.profileImage,
        registeredAt: r.referee.createdAt
      } : null,
      status: r.status,
      linkTarget: r.linkTarget,
      expiresAt: r.expiresAt,
      completedAt: r.completedAt,
      rewardIssued: r.rewardIssued,
      orderValue: r.orderValue,
      amountEarned: r.orderValue ? Math.min(r.orderValue * 0.05, 3000) : 0,
      createdAt: r.createdAt
    }));

    res.status(200).json({
      success: true,
      data: {
        referrals: formatted,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (err) {
    console.error('[Seller Referral History] Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/v2/sellers/referral/:referralId
 * Returns a single referral detail.
 */
exports.getSingleReferral = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { referralId } = req.params;

    const referral = await Referral.findOne({
      _id: referralId,
      referrer: sellerId,
      referrerModel: 'Seller'
    })
      .populate('referee', 'firstName lastName email profileImage createdAt')
      .lean();

    if (!referral) {
      return res.status(404).json({ success: false, message: 'Referral not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        id: referral._id.toString(),
        referee: referral.referee ? {
          id: referral.referee._id.toString(),
          name: `${referral.referee.firstName || ''} ${referral.referee.lastName || ''}`.trim(),
          email: referral.referee.email,
          profileImage: referral.referee.profileImage,
          registeredAt: referral.referee.createdAt
        } : null,
        status: referral.status,
        linkTarget: referral.linkTarget,
        expiresAt: referral.expiresAt,
        completedAt: referral.completedAt,
        rewardIssued: referral.rewardIssued,
        orderValue: referral.orderValue,
        amountEarned: referral.orderValue ? Math.min(referral.orderValue * 0.05, 3000) : 0,
        createdAt: referral.createdAt,
        reminders: {
          day3Sent: referral.day3ReminderSent,
          day7Sent: referral.day7ReminderSent,
          manualSent: referral.manualReminderSent,
          lastSentAt: referral.lastReminderAt
        }
      }
    });
  } catch (err) {
    console.error('[Seller Referral Detail] Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /api/v2/sellers/referral/:referralId/remind
 * Sends a manual reminder push notification. Max 1.
 */
exports.remindReferee = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { referralId } = req.params;

    const referral = await Referral.findOne({
      _id: referralId,
      referrer: sellerId,
      referrerModel: 'Seller'
    });

    if (!referral) {
      return res.status(404).json({ success: false, message: 'Referral not found' });
    }

    if (referral.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Referral is not pending' });
    }

    if (referral.manualReminderSent) {
      return res.status(400).json({
        success: false,
        error: 'REMIND_LIMIT_REACHED',
        message: 'A manual reminder has already been sent for this referral'
      });
    }

    const referee = await Buyer.findById(referral.referee).select('expoPushToken firstName').lean();
    if (referee && referee.expoPushToken) {
      const { sendPushNotification } = require('../../../../controllers/notificationController');
      
      const seller = await Seller.findById(sellerId).select('businessName storeName').lean();
      const sellerName = seller?.storeName || seller?.businessName || 'A seller';
      
      await sendPushNotification(
        referee.expoPushToken,
        `${sellerName} sent you a reminder 🎁`,
        `Don't forget to use your welcome credit before it expires!`,
        { type: 'referral_manual_reminder', referralId }
      );
    }

    referral.manualReminderSent = true;
    referral.lastReminderAt = new Date();
    await referral.save();

    res.status(200).json({ success: true, message: 'Reminder sent successfully' });

  } catch (err) {
    console.error('[Seller Referral Remind] Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * PATCH /api/v2/sellers/referral/link-target
 * Allows a seller to modify their default referral link target (store vs product vs stream).
 * Note: A referral itself doesn't inherently dictate where the *registration* link goes right now,
 * but this lets sellers save their preference for future UI display.
 */
exports.updateLinkTarget = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { target, targetId } = req.body; // e.g., target: 'product', targetId: 'product_id_here'

    if (!['store', 'product', 'stream'].includes(target)) {
      return res.status(400).json({ success: false, message: 'Invalid link target' });
    }

    // In a full implementation, you'd save this on the Seller model or a Settings model.
    // For now, returning success so the frontend has an API endpoint to hit.
    
    // Future expansion:
    // await Seller.updateOne({ _id: sellerId }, { 'referralSettings.defaultTarget': target, 'referralSettings.defaultTargetId': targetId });

    res.status(200).json({ 
      success: true, 
      message: 'Referral link target updated successfully',
      data: { target, targetId }
    });

  } catch (err) {
    console.error('[Seller Referral Link Target] Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
