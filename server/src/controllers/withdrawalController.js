const Withdrawal = require('../models/Withdrawal');
const Seller = require('../models/Seller');
const Order = require('../models/Order');
const axios = require('axios');

// Initialize Paystack
const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

exports.requestWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, bankCode, accountNumber } = req.body;
    const seller = await Seller.findById(req.user.id).session(session);

    if (!seller) {
      throw new Error('Seller not found');
    }

    // Check minimum withdrawal amount (in kobo - Paystack uses kobo)
    const MIN_WITHDRAWAL = 5000; // ₦50 in kobo
    if (amount < MIN_WITHDRAWAL) {
      throw new Error(`Minimum withdrawal amount is ₦${MIN_WITHDRAWAL/100}`);
    }

    // Check available balance
    if (seller.walletBalance < amount) {
      throw new Error('Insufficient balance');
    }

    // Verify bank account with Paystack
    const accountVerification = await paystack.get(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
    );

    if (!accountVerification.data.status) {
      throw new Error('Invalid bank account details');
    }

    // Calculate commission
    const commissionRate = 0.05; // 5% commission
    const commissionAmount = amount * commissionRate;
    const netAmount = amount - commissionAmount;

    // Create transfer recipient on Paystack
    const recipientResponse = await paystack.post('/transferrecipient', {
      type: 'nuban',
      name: seller.businessName || `${seller.firstName} ${seller.lastName}`,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN'
    });

    if (!recipientResponse.data.status) {
      throw new Error('Failed to create transfer recipient');
    }

    // Initiate transfer
    const transferResponse = await paystack.post('/transfer', {
      source: 'balance',
      recipient: recipientResponse.data.data.recipient_code,
      amount: Math.round(netAmount * 100), // Convert to kobo
      reason: `Withdrawal request from ${seller.businessName || seller.firstName}`
    });

    const withdrawal = new Withdrawal({
      seller: seller._id,
      amount: netAmount,
      paymentMethod: {
        type: 'bank_transfer',
        details: {
          bankCode,
          accountNumber,
          accountName: accountVerification.data.data.account_name,
          recipientCode: recipientResponse.data.data.recipient_code,
          transferCode: transferResponse.data.data.transfer_code
        }
      },
      commissionDeducted: {
        amount: commissionAmount,
        rate: commissionRate
      },
      status: 'processing',
      transactionId: transferResponse.data.data.reference
    });

    // Update seller's wallet balance
    seller.walletBalance -= amount;
    await seller.save({ session });
    await withdrawal.save({ session });

    await session.commitTransaction();

    // Notify admin about new withdrawal request
    await notificationController.createNotification({
      recipient: 'admin',
      type: 'withdrawal_request',
      title: 'New Withdrawal Request',
      message: `Seller ${seller.businessName} has requested a withdrawal of ₦${amount/100}`,
      data: { withdrawalId: withdrawal._id }
    });

    res.status(201).json({ 
      message: 'Withdrawal request created successfully', 
      withdrawal 
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ 
      message: 'Failed to create withdrawal request', 
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

exports.getWithdrawalHistory = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = { seller: req.user.id };

    if (status) {
      query.status = status;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Withdrawal.countDocuments(query);

    res.json({
      withdrawals,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching withdrawal history', 
      error: error.message 
    });
  }
};

// Admin methods
exports.processWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const withdrawal = await Withdrawal.findById(id).session(session);
    if (!withdrawal) {
      throw new Error('Withdrawal request not found');
    }

    // Verify transfer status with Paystack
    const transferResponse = await paystack.get(
      `/transfer/verify/${withdrawal.paymentMethod.details.transferCode}`
    );

    const transferStatus = transferResponse.data.data.status;
    withdrawal.status = transferStatus;
    withdrawal.notes.push({
      content: note || `Transfer status: ${transferStatus}`,
      addedBy: req.user.id,
      userType: 'Admin'
    });

    if (transferStatus === 'success') {
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = req.user.id;

      // Notify seller
      await notificationController.createNotification({
        recipient: withdrawal.seller,
        type: 'withdrawal_completed',
        title: 'Withdrawal Processed',
        message: `Your withdrawal request for ₦${withdrawal.amount/100} has been processed`,
        data: { withdrawalId: withdrawal._id }
      });
    } else if (transferStatus === 'failed') {
      // Refund seller's wallet if transfer failed
      const seller = await Seller.findById(withdrawal.seller).session(session);
      seller.walletBalance += (withdrawal.amount + withdrawal.commissionDeducted.amount);
      await seller.save({ session });

      // Notify seller about failed transfer
      await notificationController.createNotification({
        recipient: withdrawal.seller,
        type: 'withdrawal_failed',
        title: 'Withdrawal Failed',
        message: `Your withdrawal request for ₦${withdrawal.amount/100} has failed. Amount has been refunded to your wallet.`,
        data: { withdrawalId: withdrawal._id }
      });
    }

    await withdrawal.save({ session });
    await session.commitTransaction();

    res.json({ 
      message: 'Withdrawal request updated successfully', 
      withdrawal 
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ 
      message: 'Failed to process withdrawal', 
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};
