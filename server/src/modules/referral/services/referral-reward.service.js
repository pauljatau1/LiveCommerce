const Buyer    = require('../../../models/Buyer');
const Seller   = require('../../../models/Seller');
const Referral = require('../../../models/Referral');
const Order    = require('../../../models/Order');
const Transaction = require('../../../models/Transaction');

const SELLER_REWARD_PCT   = 0.05;  // 5% of order value
const SELLER_REWARD_CAP   = 3000;  // NGN
const BUYER_CASHBACK_PCT  = 0.10;  // 10% of order value (seller surface)
const BUYER_CASHBACK_CAP  = 2000;  // NGN
const BUYER_FLAT_REWARD   = 500;   // NGN (buyer-to-buyer surface)

async function processReferralReward({ orderId, buyerId }) {
  console.log(`\n\n[referral-reward] 🚀 STARTING REWARD PROCESS FOR ORDER: ${orderId}, BUYER: ${buyerId}`);
  try {
    // 1. Find pending referral for this buyer
    const referral = await Referral.findOne({
      referee:      buyerId,
      status:       'pending',
      rewardIssued: false,
    });
    
    if (!referral) {
      console.log(`[referral-reward] ❌ No pending referral found for buyer ${buyerId}. Ending.`);
      return;
    }
    console.log(`[referral-reward] ✅ Found pending referral: ${referral._id} (Referrer: ${referral.referrer})`);

    // 2. Check expiry
    if (new Date() > referral.expiresAt) {
      console.log(`[referral-reward] ⚠️ Referral ${referral._id} has expired!`);
      await Referral.updateOne({ _id: referral._id }, { status: 'expired' });
      return;
    }

    // 3. Must be buyer's first paid order
    const previousOrders = await Order.countDocuments({
      buyer: buyerId,
      paid:  true,
      _id:   { $ne: orderId },
    });
    
    if (previousOrders > 0) {
      console.log(`[referral-reward] ❌ Buyer ${buyerId} has ${previousOrders} previous paid orders. Not eligible. Ending.`);
      return;
    }
    console.log(`[referral-reward] ✅ Buyer has 0 previous paid orders. Eligible!`);

    // 4. Skip flagged referrals
    if (referral.flaggedForReview) {
      console.log(`[referral-reward] ⚠️ Referral ${referral._id} flagged for fraud — skipping`);
      return;
    }

    // 5. Get order value
    const order = await Order.findById(orderId).lean();
    if (!order) {
      console.log(`[referral-reward] ❌ Could not find the order document ${orderId}`);
      return;
    }
    const shippingFee = order.shipping && order.shipping.fee && order.shipping.fee.amount > 0 ? order.shipping.fee.amount : 0;
    const orderValue = order.totalAmount - shippingFee;
    console.log(`[referral-reward] 💰 Order value is NGN ${orderValue}`);

    // 6. Calculate rewards
    let refereeReward, referrerReward;
    if (referral.referrerModel === 'Seller') {
      refereeReward  = Math.min(orderValue * BUYER_CASHBACK_PCT, BUYER_CASHBACK_CAP);
      referrerReward = Math.min(orderValue * SELLER_REWARD_PCT,  SELLER_REWARD_CAP);
      console.log(`[referral-reward] Calculated values (Seller Referrer): Referee NGN ${refereeReward}, Referrer NGN ${referrerReward}`);
    } else {
      refereeReward  = BUYER_FLAT_REWARD;
      referrerReward = BUYER_FLAT_REWARD;
      console.log(`[referral-reward] Calculated values (Buyer Referrer): Referee NGN ${refereeReward}, Referrer NGN ${referrerReward}`);
    }

    // 7. Credit referee — directly into wallet.balance
    const refUpdateResult = await Buyer.updateOne(
      { _id: referral.referee },
      {
        $inc: {
          'wallet.balance':            refereeReward,
          'referralStats.totalEarned': refereeReward, // analytics only
        },
        $push: {
          'wallet.transactions': {
            type: 'credit',
            amount: refereeReward,
            description: 'Welcome reward for using a referral code',
            status: 'completed',
            paymentReference: `referral-reward-${referral._id}`,
            createdAt: new Date()
          }
        }
      }
    );
    console.log(`[referral-reward] Referee update result:`, refUpdateResult);

    // 8. Credit referrer
    if (referral.referrerModel === 'Buyer') {
      const buyerReferrerUpdate = await Buyer.updateOne(
        { _id: referral.referrer },
        {
          $inc: {
            'wallet.balance':                 referrerReward,
            'referralStats.totalEarned':      referrerReward,
            'referralStats.completedReferrals': 1,
            'referralStats.totalReferralGMV': orderValue, // if applicable later
          },
          $push: {
            'wallet.transactions': {
              type: 'credit',
              amount: referrerReward,
              description: 'Referral reward for inviting a friend',
              status: 'completed',
              paymentReference: `referral-bonus-${referral._id}`,
              createdAt: new Date()
            }
          }
        }
      );
      console.log(`[referral-reward] Referrer (Buyer) update result:`, buyerReferrerUpdate);
    } else {
      const sellerReferrerUpdate = await Seller.updateOne(
        { _id: referral.referrer },
        {
          $inc: {
            walletBalance:                      referrerReward,
            'referralStats.totalEarned':        referrerReward,
            'referralStats.completedReferrals': 1,
            'referralStats.totalGMV':           orderValue,
          },
        }
      );
      
      await Transaction.create({
        seller: referral.referrer,
        type: 'referral_reward',
        amount: referrerReward,
        status: 'completed',
        description: 'Referral reward for inviting a buyer',
        metadata: {
          categoryName: 'Referral',
        }
      });
      console.log(`[referral-reward] Referrer (Seller) update result:`, sellerReferrerUpdate);
      await checkSellerMilestone(referral.referrer);
    }

    // 9. Mark referral complete
    const finalUpdate = await Referral.updateOne(
      { _id: referral._id },
      {
        $set: {
          status:       'completed',
          rewardIssued: true,
          completedAt:  new Date(),
          orderId,
          orderValue,
        },
      }
    );
    console.log(`[referral-reward] Final Referral Mark Completed update:`, finalUpdate);

    console.log(`[referral-reward] 🎉 SUCCESS! Issued for referral ${referral._id} (Order: ${orderId})\n\n`);

  } catch (err) {
    console.error('[referral-reward] ❌ Critical Error executing reward logic:', err);
    // Never rethrow — must not break payment confirmation
  }
}

async function checkSellerMilestone(sellerId) {
  const seller = await Seller.findById(sellerId)
    .select('referralStats referralMilestone')
    .lean();
  if (!seller) return;

  const count = seller.referralStats.completedReferrals;
  let next = seller.referralMilestone;

  if      (count >= 25 && seller.referralMilestone !== 'champion') next = 'champion';
  else if (count >= 10 && seller.referralMilestone === 'starter')  next = 'builder';
  else if (count >= 3  && seller.referralMilestone === 'none')     next = 'starter';

  if (next !== seller.referralMilestone) {
    await Seller.updateOne({ _id: sellerId }, { referralMilestone: next });
    
    // Future expansion: Send push notification to seller about milestone
    // const { sendPushNotification } = require('../../../../controllers/notificationController');
    // if (seller.expoPushToken) {
    //   await sendPushNotification(seller.expoPushToken, 'Milestone Reached!', `You've become a ${next} referrer!`);
    // }
  }
}

module.exports = { processReferralReward };
