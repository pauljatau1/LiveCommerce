/**
 * Withdrawal Safety Utilities
 * 
 * This module provides safety checks and calculations for withdrawal operations
 * to prevent duplicate withdrawals and ensure sellers don't get more than they're entitled to.
 */

const Withdrawal = require('../models/Withdrawal');
const Seller = require('../models/Seller');
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');

/**
 * Check if a seller has any pending or processing withdrawals
 * @param {ObjectId} sellerId - The seller's ID
 * @returns {Promise<Object>} - Object containing withdrawal status and details
 */
async function checkExistingWithdrawals(sellerId) {
  try {
    // Check for any pending or processing withdrawals
    const existingWithdrawals = await Withdrawal.find({
      seller: sellerId,
      status: { $in: ['pending', 'processing'] }
    }).sort({ requestDate: -1 });

    if (existingWithdrawals.length > 0) {
      const totalPendingAmount = existingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
      
      return {
        hasExisting: true,
        count: existingWithdrawals.length,
        totalPendingAmount,
        withdrawals: existingWithdrawals,
        latestWithdrawal: existingWithdrawals[0]
      };
    }

    return {
      hasExisting: false,
      count: 0,
      totalPendingAmount: 0,
      withdrawals: [],
      latestWithdrawal: null
    };
  } catch (error) {
    console.error('Error checking existing withdrawals:', error);
    throw error;
  }
}

/**
 * Calculate the safe withdrawal amount for a seller
 * Takes into account existing pending withdrawals to prevent over-withdrawal
 * @param {ObjectId} sellerId - The seller's ID
 * @returns {Promise<Object>} - Object containing withdrawal calculation details
 */
async function calculateSafeWithdrawalAmount(sellerId) {
  try {
    // Get current seller with fresh data
    const seller = await Seller.findById(sellerId).select('walletBalance firstName lastName email bankDetails');
    
    if (!seller) {
      throw new Error('Seller not found');
    }

    // Check for existing withdrawals
    const existingWithdrawals = await checkExistingWithdrawals(sellerId);
    
    // Calculate available balance (current balance minus pending withdrawals)
    const availableBalance = seller.walletBalance - existingWithdrawals.totalPendingAmount;
    
    return {
      seller,
      currentBalance: seller.walletBalance,
      existingWithdrawals: existingWithdrawals.count,
      totalPendingAmount: existingWithdrawals.totalPendingAmount,
      availableBalance: Math.max(0, availableBalance), // Ensure non-negative
      canWithdraw: availableBalance > 0,
      safeWithdrawalAmount: Math.max(0, availableBalance)
    };
  } catch (error) {
    console.error('Error calculating safe withdrawal amount:', error);
    throw error;
  }
}

/**
 * Safely create an automatic withdrawal with all necessary checks
 * @param {ObjectId} sellerId - The seller's ID
 * @param {Object} bankDetails - Bank details for the withdrawal
 * @param {string} reason - Reason for the automatic withdrawal
 * @returns {Promise<Object>} - Object containing withdrawal creation result
 */
async function createSafeAutomaticWithdrawal(sellerId, bankDetails, reason) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Calculate safe withdrawal amount
    const withdrawalCalculation = await calculateSafeWithdrawalAmount(sellerId);
    
    // Check if withdrawal is possible
    if (!withdrawalCalculation.canWithdraw) {
      await session.abortTransaction();
      return {
        success: false,
        reason: 'No available balance for withdrawal',
        details: {
          currentBalance: withdrawalCalculation.currentBalance,
          existingWithdrawals: withdrawalCalculation.existingWithdrawals,
          totalPendingAmount: withdrawalCalculation.totalPendingAmount,
          availableBalance: withdrawalCalculation.availableBalance
        }
      };
    }

    // Check if there are existing withdrawals to avoid duplicates
    if (withdrawalCalculation.existingWithdrawals > 0) {
      await session.abortTransaction();
      return {
        success: false,
        reason: 'Seller already has pending withdrawals',
        details: {
          existingWithdrawals: withdrawalCalculation.existingWithdrawals,
          totalPendingAmount: withdrawalCalculation.totalPendingAmount,
          message: 'Automatic withdrawal skipped to prevent duplicate withdrawals'
        }
      };
    }

    // Check if bank details are valid
    const bankValidation = validateBankDetails(bankDetails);
    if (!bankValidation.isValid) {
      await session.abortTransaction();
      return {
        success: false,
        reason: 'Invalid bank details',
        details: {
          missingFields: bankValidation.missingFields,
          message: 'Seller needs to provide valid bank details before withdrawal can be processed'
        },
        requiresSupportContact: true,
        seller: withdrawalCalculation.seller,
        availableBalance: withdrawalCalculation.availableBalance
      };
    }

    // Create the withdrawal with the safe amount
    const automaticWithdrawal = new Withdrawal({
      seller: sellerId,
      amount: withdrawalCalculation.safeWithdrawalAmount,
      status: 'pending',
      bankDetails: {
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountName: bankDetails.accountName,
        bankIdentifierCode: bankDetails.bankIdentifierCode || bankDetails.swiftCode || 'Not provided'
      },
      notes: [{
        content: reason,
        addedBy: 'admin'
      }]
    });

    await automaticWithdrawal.save({ session });
    await session.commitTransaction();

    return {
      success: true,
      withdrawal: automaticWithdrawal,
      details: {
        amount: withdrawalCalculation.safeWithdrawalAmount,
        reference: automaticWithdrawal.reference,
        seller: withdrawalCalculation.seller
      }
    };

  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating safe automatic withdrawal:', error);
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Validate bank details for withdrawal
 * @param {Object} bankDetails - Bank details to validate
 * @returns {Object} - Validation result
 */
function validateBankDetails(bankDetails) {
  // Core required fields that must be present
  const coreRequiredFields = ['bankName', 'accountNumber', 'accountName'];
  const missingCoreFields = coreRequiredFields.filter(field => !bankDetails?.[field] || bankDetails[field].trim() === '');
  
  if (missingCoreFields.length > 0) {
    return {
      isValid: false,
      missingFields: missingCoreFields,
      message: `Missing required bank details: ${missingCoreFields.join(', ')}`
    };
  }

  // Check if at least one identifier is present (bankIdentifierCode OR swiftCode)
  const hasIdentifier = (bankDetails?.bankIdentifierCode && bankDetails.bankIdentifierCode.trim() !== '') ||
                       (bankDetails?.swiftCode && bankDetails.swiftCode.trim() !== '');
  
  if (!hasIdentifier) {
    return {
      isValid: false,
      missingFields: ['bankIdentifierCode or swiftCode'],
      message: 'Missing bank identifier (bankIdentifierCode or swiftCode)'
    };
  }

  return {
    isValid: true,
    message: 'Bank details are valid'
  };
}

/**
 * Get withdrawal safety report for a seller
 * @param {ObjectId} sellerId - The seller's ID
 * @returns {Promise<Object>} - Comprehensive withdrawal safety report
 */
async function getWithdrawalSafetyReport(sellerId) {
  try {
    const seller = await Seller.findById(sellerId).select('walletBalance firstName lastName email bankDetails');
    const existingWithdrawals = await checkExistingWithdrawals(sellerId);
    const calculation = await calculateSafeWithdrawalAmount(sellerId);
    const bankValidation = validateBankDetails(seller.bankDetails);

    return {
      seller: {
        id: seller._id,
        name: `${seller.firstName} ${seller.lastName}`,
        email: seller.email,
        currentBalance: seller.walletBalance
      },
      existingWithdrawals: {
        count: existingWithdrawals.count,
        totalPendingAmount: existingWithdrawals.totalPendingAmount,
        withdrawals: existingWithdrawals.withdrawals.map(w => ({
          id: w._id,
          amount: w.amount,
          status: w.status,
          reference: w.reference,
          requestDate: w.requestDate
        }))
      },
      withdrawalCalculation: {
        availableBalance: calculation.availableBalance,
        canWithdraw: calculation.canWithdraw,
        safeWithdrawalAmount: calculation.safeWithdrawalAmount
      },
      bankDetails: {
        isValid: bankValidation.isValid,
        message: bankValidation.message,
        hasDetails: !!seller.bankDetails,
        actualDetails: {
          bankName: seller.bankDetails?.bankName || 'Not provided',
          accountNumber: seller.bankDetails?.accountNumber || 'Not provided',
          accountName: seller.bankDetails?.accountName || 'Not provided',
          bankIdentifierCode: seller.bankDetails?.bankIdentifierCode || 'Not provided',
          swiftCode: seller.bankDetails?.swiftCode || 'Not provided'
        }
      },
      recommendations: {
        shouldCreateWithdrawal: calculation.canWithdraw && bankValidation.isValid && existingWithdrawals.count === 0,
        reason: !calculation.canWithdraw ? 'No available balance' :
                !bankValidation.isValid ? 'Invalid bank details' :
                existingWithdrawals.count > 0 ? 'Existing withdrawals found' :
                'Safe to create withdrawal'
      }
    };
  } catch (error) {
    console.error('Error generating withdrawal safety report:', error);
    throw error;
  }
}

/**
 * Send emails for sellers with no bank details who need to contact support
 * @param {Object} seller - The seller object
 * @param {number} availableBalance - The seller's available balance
 * @param {string} reason - Reason for the account being disabled
 * @returns {Promise<Object>} - Email sending result
 */
async function sendNoBankDetailsEmails(seller, availableBalance, reason) {
  try {
    // Ensure SendGrid API key is set
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const formattedAmount = availableBalance.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN'
    });

    // Email to seller
    const sellerEmailMsg = {
      to: seller.email,
      from: 'Auqli Support <support@auqli.com>',
      subject: 'Account Disabled - Contact Support for Withdrawal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; border-left: 4px solid #007bff;">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">Account Disabled - Withdrawal Assistance Required</h2>
            
            <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
              Dear ${seller.firstName},
            </p>
            
            <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
              Your Auqli seller account has been disabled. We noticed that you have a wallet balance but no bank details on file, which prevents us from automatically processing a withdrawal for you.
            </p>
            
            <div style="background-color: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #2d5a2d; margin: 0 0 15px 0; font-size: 18px;">💰 Your Current Balance</h3>
              <p style="color: #2d5a2d; margin: 0; font-size: 24px; font-weight: bold;">
                ${formattedAmount}
              </p>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">📞 Next Steps</h3>
              <p style="color: #856404; margin: 0 0 15px 0; line-height: 1.6;">
                To withdraw your balance, please contact our support team with the following information:
              </p>
              <ul style="color: #856404; margin: 0; line-height: 1.6;">
                <li>Your full name and email address</li>
                <li>Your bank account details (bank name, account number, account name)</li>
                <li>Your bank's routing code or SWIFT code (if available)</li>
                <li>Reference this email for faster processing</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
              <p style="color: #6c757d; margin: 0; font-size: 16px;">
                <strong>Contact Support:</strong><br>
                📧 Email: <a href="mailto:support@auqli.com" style="color: #007bff; text-decoration: none;">support@auqli.com</a><br>
                📱 Phone: Available on our website
              </p>
            </div>
            
            <p style="color: #34495e; line-height: 1.6; margin-bottom: 10px;">
              We'll process your withdrawal as soon as we receive your bank details.
            </p>
            
            <p style="color: #34495e; line-height: 1.6; margin-bottom: 0;">
              Best regards,<br>
              <strong>The Auqli Support Team</strong>
            </p>
          </div>
        </div>
      `
    };

    // Email to admin (Bolu)
    const adminEmailMsg = {
      to: 'bolu@auqli.com',
      from: 'Auqli System <support@auqli.com>',
      subject: `Action Required: Seller ${seller.firstName} ${seller.lastName} Needs Bank Details for Withdrawal`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #fff3cd; padding: 30px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <h2 style="color: #856404; margin-bottom: 20px;">⚠️ Action Required: Seller Withdrawal Assistance</h2>
            
            <p style="color: #856404; line-height: 1.6; margin-bottom: 20px;">
              A seller account has been disabled but cannot receive automatic withdrawal due to missing bank details.
            </p>
            
            <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">👤 Seller Information</h3>
              <ul style="color: #495057; margin: 0; line-height: 1.6;">
                <li><strong>Name:</strong> ${seller.firstName} ${seller.lastName}</li>
                <li><strong>Email:</strong> ${seller.email}</li>
                <li><strong>Business Name:</strong> ${seller.businessName || 'N/A'}</li>
                <li><strong>Account Status:</strong> Disabled</li>
                <li><strong>Reason:</strong> ${reason}</li>
              </ul>
            </div>
            
            <div style="background-color: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #2d5a2d; margin: 0 0 15px 0; font-size: 18px;">💰 Available Balance</h3>
              <p style="color: #2d5a2d; margin: 0; font-size: 24px; font-weight: bold;">
                ${formattedAmount}
              </p>
            </div>
            
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #721c24; margin: 0 0 15px 0; font-size: 18px;">❌ Missing Information</h3>
              <p style="color: #721c24; margin: 0; line-height: 1.6;">
                The seller has not provided complete bank details required for withdrawal processing.
              </p>
            </div>
            
            <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #0c5460; margin: 0 0 15px 0; font-size: 18px;">📋 Required Action</h3>
              <p style="color: #0c5460; margin: 0 0 15px 0; line-height: 1.6;">
                Please contact the seller to collect the following information:
              </p>
              <ul style="color: #0c5460; margin: 0; line-height: 1.6;">
                <li>Bank name</li>
                <li>Account number</li>
                <li>Account name (as it appears on bank statement)</li>
                <li>Bank routing code or SWIFT code (if available)</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
              <p style="color: #6c757d; margin: 0; font-size: 14px;">
                <strong>Seller Contact:</strong> ${seller.email}<br>
                <strong>System Generated:</strong> ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      `
    };

    // Send both emails
    await Promise.all([
      sgMail.send(sellerEmailMsg),
      sgMail.send(adminEmailMsg)
    ]);

    console.log(`📧 No bank details emails sent for ${seller.email} (Balance: ${formattedAmount})`);

    return {
      success: true,
      message: 'No bank details emails sent successfully',
      sellerEmail: seller.email,
      adminEmail: 'bolu@auqli.com',
      balance: availableBalance
    };

  } catch (error) {
    console.error('Error sending no bank details emails:', error);
    throw error;
  }
}

module.exports = {
  checkExistingWithdrawals,
  calculateSafeWithdrawalAmount,
  createSafeAutomaticWithdrawal,
  validateBankDetails,
  getWithdrawalSafetyReport,
  sendNoBankDetailsEmails
};
