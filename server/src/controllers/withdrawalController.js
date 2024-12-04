const Withdrawal = require('../models/Withdrawal');
const Seller = require('../models/Seller');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('SG.REDACTED');

// Create withdrawal request
exports.createWithdrawalRequest = async (req, res) => {
  try {
    const { amount } = req.body;
    const seller = await Seller.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (amount > seller.walletBalance) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const withdrawal = new Withdrawal({
      seller: seller._id,
      amount,
      status: 'pending'
    });

    await withdrawal.save();

    // Add to seller's withdrawRequests
    seller.withdrawRequests.push(withdrawal._id);
    await seller.save();

    // Send email to admin
    const adminMsg = {
      to: 'joseph@auqli.com',
      from: 'Joseph From Auqli <joseph@auqli.com>',
      subject: 'New Withdrawal Request',
      html: `
        <h3>New Withdrawal Request</h3>
        <p>Seller: ${seller.firstName} ${seller.lastName}</p>
        <p>Business Name: ${seller.businessName}</p>
        <p>Amount: $${amount}</p>
        <p>Bank Details:</p>
        <ul>
          <li>Bank Name: ${seller.bankDetails.bankName}</li>
          <li>Account Number: ${seller.bankDetails.accountNumber}</li>
          <li>Account Name: ${seller.bankDetails.accountName}</li>
        </ul>
      `
    };

    await sgMail.send(adminMsg);

    res.status(201).json({ 
      message: 'Withdrawal request created successfully', 
      withdrawal 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create withdrawal request', 
      error: error.message 
    });
  }
};

// Get seller's withdrawal requests
exports.getSellerWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ seller: req.user.id })
      .sort({ createdAt: -1 });

    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch withdrawal requests', 
      error: error.message 
    });
  }
};

// Admin: Get all withdrawal requests
exports.getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .populate('seller', 'firstName lastName businessName email bankDetails')
      .sort({ createdAt: -1 });

    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch withdrawal requests', 
      error: error.message 
    });
  }
};

// Admin: Update withdrawal status
exports.updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const withdrawal = await Withdrawal.findById(id)
      .populate('seller', 'firstName lastName email walletBalance');

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    withdrawal.status = status;
    if (status === 'completed') {
      withdrawal.completedAt = Date.now();
      
      // Deduct amount from seller's wallet
      const seller = withdrawal.seller;
      seller.walletBalance -= withdrawal.amount;
      await seller.save();

      // Send email to seller
      const sellerMsg = {
        to: seller.email,
        from: 'Auqli Admin <admin@auqli.com>',
        subject: 'Withdrawal Request Completed',
        html: `
          <h3>Withdrawal Request Completed</h3>
          <p>Your withdrawal request for $${withdrawal.amount} has been processed and sent to your bank account.</p>
          <p>New wallet balance: $${seller.walletBalance}</p>
        `
      };

      await sgMail.send(sellerMsg);
    }

    await withdrawal.save();

    res.json({ 
      message: 'Withdrawal status updated successfully', 
      withdrawal 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update withdrawal status', 
      error: error.message 
    });
  }
};
