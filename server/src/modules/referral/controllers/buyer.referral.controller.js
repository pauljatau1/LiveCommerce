const { buyerAppUrl } = require('../../../utils/helpers');
const Buyer = require('../../../models/Buyer');
const Referral = require('../../../models/Referral');

// Utility to generate a referral code on the fly
function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

/**
 * GET /api/v2/buyers/referral/overview
 * Returns current referral statistics, referral link, and wallet balance.
 * Lazy-generates a referral code if the buyer doesn't have one.
 */
exports.getOverview = async (req, res) => {
  try {
    const buyerId = req.user.id;
    let buyer = await Buyer.findById(buyerId).select('referralCode referralStats wallet.balance').lean();

    if (!buyer) {
      return res.status(404).json({ success: false, message: 'Buyer not found' });
    }

    // Lazy generation fallback for existing users
    if (!buyer.referralCode) {
      let code;
      let isUnique = false;
      while (!isUnique) {
        code = generateReferralCode();
        const existing = await Buyer.findOne({ referralCode: code });
        if (!existing) isUnique = true;
      }

      await Buyer.updateOne({ _id: buyerId }, { referralCode: code });
      buyer.referralCode = code;
    }

    const referralLink = `${buyerAppUrl()}/invite?ref=${buyer.referralCode}`;

    res.status(200).json({
      success: true,
      data: {
        referralCode: buyer.referralCode,
        referralLink,
        stats: buyer.referralStats || { totalReferred: 0, completedReferrals: 0, totalEarned: 0 },
        walletBalance: buyer.wallet?.balance || 0
      }
    });

  } catch (err) {
    console.error('[Buyer Referral Overview] Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/v2/buyers/referral/history
 * Returns paginated list of referrals for this buyer.
 * Query params: page, limit, status
 */
exports.getHistory = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query = { referrer: buyerId, referrerModel: 'Buyer' };
    if (status && status !== 'all') {
      query.status = status;
    }

    const referrals = await Referral.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('referee', 'firstName lastName email profileImage createdAt')
      .lean();

    const total = await Referral.countDocuments(query);

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
      expiresAt: r.expiresAt,
      completedAt: r.completedAt,
      rewardIssued: r.rewardIssued,
      rewardAmount: 500,
      daysRemaining: Math.max(0, Math.ceil((new Date(r.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))),
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
    console.error('[Buyer Referral History] Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /api/v2/buyers/referral/:referralId/remind
 * Sends a manual reminder push notification to the referee.
 * Limited to 1 manual reminder per referral.
 */
exports.remindReferee = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { referralId } = req.params;

    const referral = await Referral.findOne({
      _id: referralId,
      referrer: buyerId,
      referrerModel: 'Buyer'
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

    // We get the referee details natively to push
    const referee = await Buyer.findById(referral.referee).select('expoPushToken firstName').lean();
    if (referee && referee.expoPushToken) {
      const { sendPushNotification } = require('../../../../controllers/notificationController');
      
      const referrer = await Buyer.findById(buyerId).select('firstName').lean();
      const referrerName = referrer?.firstName || 'A friend';
      
      await sendPushNotification(
        referee.expoPushToken,
        `${referrerName} sent you a reminder 🎁`,
        `Don't forget to use your welcome credit before it expires!`,
        { type: 'referral_manual_reminder', referralId }
      );
    }

    referral.manualReminderSent = true;
    referral.lastReminderAt = new Date();
    await referral.save();

    res.status(200).json({
      success: true,
      message: 'Reminder sent successfully'
    });

  } catch (err) {
    console.error('[Buyer Referral Remind] Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
