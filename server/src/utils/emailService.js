const termiiEmailService = require('../services/termiiEmailService');

// Use a verified sender email that's known to work
const VERIFIED_SENDER = 'Auqli <support@auqli.com>';

const sendPasswordResetEmail = async (email, token) => {
  const html = `<p>You requested a password reset. Please use the following token to reset your password:</p><p><strong>${token}</strong></p>`;

  try {
    await termiiEmailService.sendRawHTMLEmail({
      email: email,
      subject: 'Password Reset Request',
      html: html
    });
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error.message);
    return false;
  }
};

/**
 * Sends a notification email when an admin logs in
 * @param {string} email - Admin's email address
 * @param {string} username - Admin's username
 * @param {Object} metadata - Login metadata like IP address and browser info
 */
const sendAdminLoginNotificationEmail = async (email, username, metadata) => {
  console.log(`Attempting to send login notification to ${email} for user ${username}`);

  const loginDate = new Date().toLocaleString();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">Security Alert: Admin Dashboard Access</h2>
      <p>Your Auqli admin account <strong>${username}</strong> was used to access the admin dashboard.</p>
      
      <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Date & Time:</strong> ${loginDate}</p>
        <p><strong>IP Address:</strong> ${metadata.ip}</p>
        <p><strong>Browser:</strong> ${metadata.userAgent}</p>
      </div>
      
      <p>If this was you, no action is needed.</p>
      <p>If you did not log in at this time, please <strong>immediately</strong>:</p>
      <ol>
        <li>Change your password</li>
        <li>Contact support at <a href="mailto:support@auqli.com">support@auqli.com</a></li>
      </ol>
      
      <p style="font-size: 12px; color: #888; margin-top: 30px;">This is an automated security notification from Auqli. Please do not reply to this email.</p>
    </div>
  `;

  try {
    await termiiEmailService.sendRawHTMLEmail({
      email: email,
      subject: 'Admin Dashboard Access Alert',
      html: html
    });
    console.log(`Login notification email sent to ${email} successfully`);
    return true;
  } catch (error) {
    console.error(`Failed to send login notification email to ${email}:`, error.message);
    return false;
  }
};

/**
 * Sends a notification email when a seller is marked as international
 * @param {Object} seller - The seller object
 */
const sendInternationalSellerEmail = async (seller) => {
  console.log(`Attempting to send international seller notification to ${seller.email}`);

  const sellerName = seller.businessName || `${seller.firstName} ${seller.lastName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">Your Account Has Been Upgraded!</h2>
      <p>Dear ${sellerName},</p>
      
      <p>We are excited to inform you that your Auqli seller account has been upgraded to <strong>International Seller</strong> status!</p>
      
      <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>What this means for you:</strong></p>
        <ul>
          <li>You can now sell your products internationally</li>
          <li>Access to global shipping options</li>
          <li>Expanded customer base across different countries</li>
        
        </ul>
      </div>
      
      <p>Our team has reviewed your account and determined that you meet our criteria for international selling. This status upgrade allows you to reach customers beyond local borders and expand your business globally.</p>
      
      <p>If you have any questions about your new international seller status or need assistance setting up international shipping options, please contact our seller support team at <a href="mailto:support@auqli.com">support@auqli.com</a>.</p>
      
      <p>Thank you for being a valued seller on Auqli!</p>
      
      <p>Best regards,<br>The Auqli Team</p>
    </div>
  `;

  try {
    await termiiEmailService.sendRawHTMLEmail({
      email: seller.email,
      subject: 'Congratulations! Your Account Has Been Upgraded to International Seller Status',
      html: html
    });
    console.log(`International seller notification email sent to ${seller.email} successfully`);
    return true;
  } catch (error) {
    console.error(`Failed to send international seller notification email to ${seller.email}:`, error.message);
    return false;
  }
};

const sendShipmentFailureEmail = async (buyer, order, errorMessage) => {
  const buyerName = buyer.firstName || 'Valued Customer';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #d9534f;">Shipment Arrangement Failed</h2>
      <p>Dear ${buyerName},</p>
      <p>We're sorry, but we encountered an issue while arranging the shipment for your order <strong>#${order.order_id}</strong>.</p>
      <p><strong>Reason:</strong> ${errorMessage}</p>
      <p>The amount paid for this order has been refunded to your Auqli wallet. You should see the credit reflected in your wallet balance shortly.</p>
      <p>We apologize for any inconvenience this may have caused. Please try placing your order again. If the problem persists, contact our support team.</p>
      <p>Thank you for your understanding.</p>
      <p>Best regards,<br>The Auqli Team</p>
    </div>
  `;

  try {
    await termiiEmailService.sendRawHTMLEmail({
      email: buyer.email,
      subject: `Important: Shipment Arrangement Failed for Order #${order.order_id}`,
      html: html
    });
    console.log(`Shipment failure email sent to ${buyer.email} for order ${order.order_id}`);
    return true;
  } catch (error) {
    console.error(`Failed to send shipment failure email to ${buyer.email}:`, error.message);
    return false;
  }
};

const sendEmail = async (to, subject, text, html) => {
  try {
    await termiiEmailService.sendRawHTMLEmail({
      email: to,
      subject: subject,
      html: html || `<p>${text}</p>`
    });
    console.log(`Email sent to ${to} with subject: ${subject}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to} with subject ${subject}:`, error.message);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendAdminLoginNotificationEmail,
  sendInternationalSellerEmail,
  sendShipmentFailureEmail,
  sendEmail
};