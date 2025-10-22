const terminalService = require('../services/adminterminal.service');
const Product = require('../../../models/Product');
const Seller = require('../../../models/Seller');
const Withdrawal = require('../../../models/Withdrawal');
const adminBuyerService = require('../services/adminBuyer.service');
const emailService = require('../../../utils/emailService');
const { toggleSellerVacationMode } = require('../services/adminVacation.service');
const ErrorLog = require('../../../models/ErrorLog');
const { getNonLagosSellerNotificationEmail } = require('../helpers/email.helper');
const { createSafeAutomaticWithdrawal, getWithdrawalSafetyReport, sendNoBankDetailsEmails } = require('../../../utils/withdrawalSafety');

const getShipments = async (req, res, next) => {
  try {
    const shipmentsData = await terminalService.getShipments(req.query);
    res.status(200).json(shipmentsData);
  } catch (error) {
    next(error);
  }
};

const getShipmentById = async (req, res, next) => {
  try {
    const { shipmentId } = req.params;
    const shipmentData = await terminalService.getShipmentById(shipmentId);
    res.status(200).json(shipmentData);
  } catch (error) {
    next(error);
  }
};

const updateShipment = async (req, res, next) => {
  try {
    const { shipmentId } = req.params;
    const updateData = req.body;
    const updatedShipment = await terminalService.updateShipment(shipmentId, updateData);
    res.status(200).json(updatedShipment);
  } catch (error) {
    next(error);
  }
};

const cancelShipment = async (req, res, next) => {
  try {
    const { shipment_id } = req.body;
    const result = await terminalService.cancelShipment(shipment_id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteShipment = async (req, res, next) => {
  try {
    const { shipment_id } = req.body;
    const result = await terminalService.deleteShipment(shipment_id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const trackShipment = async (req, res, next) => {
  try {
    const { shipmentId } = req.params;
    const trackingData = await terminalService.trackShipment(shipmentId);
    res.status(200).json(trackingData);
  } catch (error) {
    next(error);
  }
};

const createWebhook = async (req, res, next) => {
  try {
    const webhookData = req.body;
    const newWebhook = await terminalService.createWebhook(webhookData);
    res.status(201).json(newWebhook);
  } catch (error) {
    next(error);
  }
};

const getWebhooks = async (req, res, next) => {
  try {
    const webhooksData = await terminalService.getWebhooks(req.query);
    res.status(200).json(webhooksData);
  } catch (error) {
    next(error);
  }
};

const getWebhookById = async (req, res, next) => {
  try {
    const { webhookId } = req.params;
    const webhookData = await terminalService.getWebhookById(webhookId);
    res.status(200).json(webhookData);
  } catch (error) {
    next(error);
  }
};

const deleteWebhook = async (req, res, next) => {
  try {
    const { webhookId } = req.params;
    const result = await terminalService.deleteWebhook(webhookId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const enableWebhook = async (req, res, next) => {
  try {
    const { webhookId } = req.params;
    const result = await terminalService.enableWebhook(webhookId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const disableWebhook = async (req, res, next) => {
  try {
    const { webhookId } = req.params;
    const result = await terminalService.disableWebhook(webhookId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Set all products of a seller to draft or active
 * PATCH /admin/sellers/:sellerId/products/draft-status
 * Body: { isDraft: boolean }
 */
const setSellerProductsDraftStatus = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const { isDraft } = req.body;
    if (typeof isDraft !== 'boolean') {
      return res.status(400).json({ status: false, message: 'isDraft must be a boolean' });
    }
    const update = { status: isDraft ? 'draft' : 'active' };
    const result = await Product.updateMany({ seller: sellerId }, update);
    res.status(200).json({ status: true, message: `All products set to ${update.status}`, modifiedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

/**
 * Set or unset a seller's vacation mode
 * PATCH /admin/sellers/:sellerId/vacation-mode
 * Body: { isOn: boolean }
 */
const setSellerVacationMode = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const { isOn } = req.body;
    if (typeof isOn !== 'boolean') {
      return res.status(400).json({ status: false, message: 'isOn must be a boolean' });
    }
    let result;
    try {
      result = await toggleSellerVacationMode(sellerId, isOn);
    } catch (err) {
      if (err.message === 'Seller not found') {
        return res.status(404).json({ status: false, message: 'Seller not found' });
      }
      throw err;
    }
    res.status(200).json({ status: true, message: `Seller vacation mode set to ${isOn} and all products set to ${result.productStatus}`, seller: result.seller });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually update a product's sold count
 * PATCH /admin/products/:productId/sold-count
 * Body: { soldCount: number }
 */
const updateProductSoldCount = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { soldCount } = req.body;

    // Validate input
    if (typeof soldCount !== 'number' || soldCount < 0) {
      return res.status(400).json({ 
        status: false, 
        message: 'soldCount must be a non-negative number' 
      });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        status: false, 
        message: 'Product not found' 
      });
    }

    // Get the old sold count for logging
    const oldSoldCount = product.stats.soldCount;

    // Update the sold count
    product.stats.soldCount = soldCount;
    await product.save();

    // Log the change
   

    res.status(200).json({ 
      status: true, 
      message: 'Product sold count updated successfully',
      product: {
        _id: product._id,
        name: product.name,
        oldSoldCount,
        newSoldCount: product.stats.soldCount
      }
    });
  } catch (error) {
    next(error);
  }
};

const getErrors = async (req, res) => {
  try {
    const errors = await ErrorLog.find().sort({ createdAt: -1 });
    res.status(200).json({ errors });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch error logs', error: error.message });
  }
};

/**
 * Soft delete a buyer account and anonymize PII so the email/username can be reused.
 * DELETE /admin/buyers/:buyerId
 */
const deleteBuyerAccount = async (req, res, next) => {
  try {
    const { buyerId } = req.params;
    const hard = String(req.query.hard || '').toLowerCase() === 'true';
    const result = await adminBuyerService.deleteBuyerAccount(buyerId, { hard });
    return res.status(200).json(result);
  } catch (error) {
    // Translate service errors with status to HTTP response codes
    if (error && error.status) {
      return res.status(error.status).json({ status: false, message: error.message });
    }
    next(error);
  }
};

/**
 * Bulk disable sellers that are not in Lagos state
 * POST /admin/sellers/disable-non-lagos
 * This operation disables all sellers whose sellerAddress.state is not "Lagos" (case-insensitive)
 */
const disableNonLagosSellers = async (req, res, next) => {
  try {
    // Build a filter that matches sellers who have addresses but are NOT in Lagos
    // We should only disable sellers who have filled addresses but the state is not Lagos
    // We should NOT disable sellers who haven't filled any addresses at all
    const nonLagosFilter = {
      isDisabled: { $ne: true },
      $and: [
        // Only target sellers who have at least one address field filled
        {
          $or: [
            { 'sellerAddress.state': { $exists: true, $ne: null, $ne: '' } },
            { 'businessAddress.state': { $exists: true, $ne: null, $ne: '' } }
          ]
        },
        // But exclude those who have Lagos in either address field
        {
          $nor: [
            { 'sellerAddress.state': /^lagos$/i },
            { 'businessAddress.state': /^lagos$/i }
          ]
        }
      ]
    };

    // First, get the sellers that will be affected for email notifications
    // Include walletBalance and bankDetails for automatic withdrawal processing
    const sellersToDisable = await Seller.find(nonLagosFilter).select('email firstName lastName businessName businessEmail walletBalance bankDetails');

    const update = { $set: { isDisabled: true } };
    const result = await Seller.updateMany(nonLagosFilter, update);

    // Set all disabled sellers' products to draft status
    let productStatusUpdate = null;
    try {
      const Product = require('../../../models/Product');
      const productUpdateResult = await Product.updateMany(
        { seller: { $in: sellersToDisable.map(s => s._id) }, status: { $in: ['active', 'offline_auction'] } },
        { $set: { status: 'draft' } }
      );
      
      productStatusUpdate = {
        productsUpdated: productUpdateResult.modifiedCount,
        status: 'success'
      };
      
      console.log(`📦 Set ${productUpdateResult.modifiedCount} products to draft status for ${sellersToDisable.length} disabled sellers`);
    } catch (productError) {
      console.error(`❌ Error setting products to draft for disabled sellers:`, productError);
      productStatusUpdate = {
        productsUpdated: 0,
        status: 'error',
        error: productError.message
      };
      // Don't fail the entire operation if product update fails
    }

    // Process automatic withdrawals for sellers with wallet balance > 0 using safety checks
    const automaticWithdrawals = [];
    const withdrawalSafetyReports = [];
    const sellersWithBalance = sellersToDisable.filter(seller => seller.walletBalance > 0);
    
    console.log(`🔍 Processing ${sellersWithBalance.length} sellers with wallet balance for safe automatic withdrawals`);
    
    for (const seller of sellersWithBalance) {
      try {
        // Get comprehensive withdrawal safety report
        const safetyReport = await getWithdrawalSafetyReport(seller._id);
        withdrawalSafetyReports.push({
          sellerEmail: seller.email,
          safetyReport
        });

        console.log(`📊 Safety report for ${seller.email}:`, {
          canWithdraw: safetyReport.withdrawalCalculation.canWithdraw,
          availableBalance: safetyReport.withdrawalCalculation.availableBalance,
          existingWithdrawals: safetyReport.existingWithdrawals.count,
          bankDetailsValid: safetyReport.bankDetails.isValid,
          recommendation: safetyReport.recommendations.reason
        });

        // Only create withdrawal if it's safe to do so
        if (safetyReport.recommendations.shouldCreateWithdrawal) {
          const withdrawalResult = await createSafeAutomaticWithdrawal(
            seller._id,
            seller.bankDetails,
            'Automatic withdrawal request created due to account being disabled (Non-Lagos seller)'
          );

          if (withdrawalResult.success) {
            automaticWithdrawals.push({
              sellerEmail: seller.email,
              amount: withdrawalResult.withdrawal.amount,
              reference: withdrawalResult.withdrawal.reference,
              status: 'created'
            });

            console.log(`✅ Automatic withdrawal created for disabled non-Lagos seller ${seller.email}: ₦${withdrawalResult.withdrawal.amount.toLocaleString()} (Ref: ${withdrawalResult.withdrawal.reference})`);
          } else if (withdrawalResult.requiresSupportContact) {
            // Handle case where seller has no bank details
            console.log(`📧 Sending no bank details emails for ${seller.email} (Balance: ₦${withdrawalResult.availableBalance.toLocaleString()})`);
            
            // Send no bank details emails asynchronously (non-blocking)
            sendNoBankDetailsEmails(
              withdrawalResult.seller,
              withdrawalResult.availableBalance,
              'Account disabled (Non-Lagos seller)'
            ).then(() => {
              automaticWithdrawals.push({
                sellerEmail: seller.email,
                amount: withdrawalResult.availableBalance,
                reference: null,
                status: 'no_bank_details',
                reason: 'No bank details - emails sent to seller and admin'
              });
              
              console.log(`✅ No bank details emails sent for ${seller.email}`);
            }).catch(emailError => {
              console.error(`❌ Error sending no bank details emails for ${seller.email}:`, emailError);
              automaticWithdrawals.push({
                sellerEmail: seller.email,
                amount: 0,
                reference: null,
                status: 'error',
                reason: `Email sending failed: ${emailError.message}`
              });
            });
          } else {
            console.log(`⚠️ Automatic withdrawal skipped for ${seller.email}: ${withdrawalResult.reason}`);
            automaticWithdrawals.push({
              sellerEmail: seller.email,
              amount: 0,
              reference: null,
              status: 'skipped',
              reason: withdrawalResult.reason
            });
          }
        } else {
          console.log(`⚠️ Automatic withdrawal skipped for ${seller.email}: ${safetyReport.recommendations.reason}`);
          automaticWithdrawals.push({
            sellerEmail: seller.email,
            amount: 0,
            reference: null,
            status: 'skipped',
            reason: safetyReport.recommendations.reason
          });

          // Send admin notification for invalid bank details case
          if (!safetyReport.bankDetails.isValid && safetyReport.withdrawalCalculation.canWithdraw) {
            const invalidBankDetailsAdminMsg = {
              to: 'bolu@auqli.com',
              from: 'Auqli System <support@auqli.com>',
              subject: `Action Required: Seller ${seller.firstName} ${seller.lastName} Has Invalid Bank Details (Bulk Disable)`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>⚠️ Seller Disabled - Invalid Bank Details (Bulk Operation)</h2>
                  <p>A seller account has been disabled in a bulk operation but cannot receive automatic withdrawal due to invalid bank details.</p>
                  
                  <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">👤 Seller Information</h3>
                    <ul style="color: #495057; margin: 0; line-height: 1.6;">
                      <li><strong>Name:</strong> ${seller.firstName} ${seller.lastName}</li>
                      <li><strong>Email:</strong> ${seller.email}</li>
                      <li><strong>Business Name:</strong> ${seller.businessName || 'N/A'}</li>
                      <li><strong>Account Status:</strong> Disabled (Bulk Operation)</li>
                      <li><strong>Reason:</strong> Non-Lagos seller bulk disable</li>
                    </ul>
                  </div>
                  
                  <div style="background-color: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #2d5a2d; margin: 0 0 15px 0; font-size: 18px;">💰 Available Balance</h3>
                    <p style="color: #2d5a2d; margin: 0; font-size: 24px; font-weight: bold;">
                      ₦${seller.walletBalance.toLocaleString()}
                    </p>
                  </div>
                  
                  <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #721c24; margin: 0 0 15px 0; font-size: 18px;">❌ Bank Details Issue</h3>
                    <p style="color: #721c24; margin: 0 0 15px 0; line-height: 1.6;">
                      The seller's bank details are invalid or incomplete.
                    </p>
                    <p style="color: #721c24; margin: 0; line-height: 1.6;">
                      <strong>Issue:</strong> ${safetyReport.bankDetails.message}
                    </p>
                  </div>
                  
                  <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #0c5460; margin: 0 0 15px 0; font-size: 18px;">📋 Required Action</h3>
                    <p style="color: #0c5460; margin: 0 0 15px 0; line-height: 1.6;">
                      Please contact the seller to collect valid bank details for withdrawal processing.
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
              `
            };

            sgMail.send(invalidBankDetailsAdminMsg).catch(emailError => {
              console.error(`❌ Error sending invalid bank details admin notification:`, emailError);
            });
            
            console.log(`📧 Admin notification sent to bolu@auqli.com for invalid bank details: ${seller.email}`);
          }
        }
      } catch (withdrawalError) {
        console.error(`❌ Error processing automatic withdrawal for seller ${seller.email}:`, withdrawalError);
        automaticWithdrawals.push({
          sellerEmail: seller.email,
          amount: 0,
          reference: null,
          status: 'error',
          reason: withdrawalError.message
        });
        // Continue with other sellers even if one fails
      }
    }

    // Send notification emails asynchronously (non-blocking)
    // Don't wait for emails to complete - they run in the background
    const sendEmailsAsync = async () => {
      const emailPromises = sellersToDisable.map(async (seller) => {
        try {
          // Check if this seller has an automatic withdrawal
          const sellerWithdrawal = automaticWithdrawals.find(w => w.sellerEmail === seller.email);
          
          // Get email content from helper
          const emailContent = getNonLagosSellerNotificationEmail(seller, sellerWithdrawal);
          
          // Send to primary email
          await emailService.sendEmail(
            seller.email, 
            emailContent.subject, 
            emailContent.text, 
            emailContent.html
          );
          
          // Also send to business email if it exists and is different
          if (seller.businessEmail && seller.businessEmail !== seller.email) {
            await emailService.sendEmail(
              seller.businessEmail, 
              emailContent.subject, 
              emailContent.text, 
              emailContent.html
            );
          }
          
          console.log(`✅ Notification email sent to ${seller.email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send notification email to ${seller.email}:`, emailError);
          // Continue with other emails even if one fails
        }
      });

      // Run all email sending in parallel without blocking
      try {
        await Promise.allSettled(emailPromises);
        console.log(`📧 Email sending completed for ${sellersToDisable.length} sellers`);
      } catch (error) {
        console.error('📧 Email sending process failed:', error);
      }
    };

    // Start email sending in background (fire and forget)
    sendEmailsAsync().catch(error => {
      console.error('📧 Background email sending failed:', error);
    });

    // Calculate comprehensive withdrawal statistics
    const withdrawalStats = {
      totalProcessed: automaticWithdrawals.length,
      created: automaticWithdrawals.filter(w => w.status === 'created').length,
      skipped: automaticWithdrawals.filter(w => w.status === 'skipped').length,
      errors: automaticWithdrawals.filter(w => w.status === 'error').length,
      totalAmount: automaticWithdrawals.filter(w => w.status === 'created').reduce((sum, w) => sum + w.amount, 0),
      details: automaticWithdrawals
    };

    // Return response immediately without waiting for emails
    return res.status(200).json({
      status: true,
      message: 'Sellers outside Lagos have been disabled. Notification emails are being sent in the background.',
      matchedCount: result.matchedCount ?? result.nMatched ?? 0,
      modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
      emailsQueued: sellersToDisable.length,
      productStatusUpdate,
      automaticWithdrawals: withdrawalStats,
      safetySummary: {
        totalSellersWithBalance: sellersWithBalance.length,
        withdrawalsCreated: withdrawalStats.created,
        withdrawalsSkipped: withdrawalStats.skipped,
        withdrawalsErrors: withdrawalStats.errors,
        totalAmountWithdrawn: withdrawalStats.totalAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShipments,
  getShipmentById,
  updateShipment,
  cancelShipment,
  deleteShipment,
  trackShipment,
  createWebhook,
  getWebhooks,
  getWebhookById,
  deleteWebhook,
  enableWebhook,
  disableWebhook,
  setSellerProductsDraftStatus,
  setSellerVacationMode,
  updateProductSoldCount,
  getErrors,
  deleteBuyerAccount,
  disableNonLagosSellers,
};