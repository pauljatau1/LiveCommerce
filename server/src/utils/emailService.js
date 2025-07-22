const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Ensure you have your SendGrid API key set

// For troubleshooting - Display if API key is configured
console.log('SendGrid API Key configured:', !!process.env.SENDGRID_API_KEY);
if (!process.env.SENDGRID_API_KEY) {
  console.error('WARNING: SENDGRID_API_KEY is not set in environment variables');
}

// Use a verified sender email that's known to work
const VERIFIED_SENDER = 'Joseph From Auqli <support@auqli.com>';

const sendPasswordResetEmail = async (email, token) => {
  const msg = {
    to: email,
    from: VERIFIED_SENDER,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Please use the following token to reset your password: ${token}`,
    html: `<p>You requested a password reset. Please use the following token to reset your password:</p><p><strong>${token}</strong></p>`,
  };

  try {
    await sgMail.send(msg);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
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
  
  // Validate API key is set
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set in environment variables');
    return false;
  }
  
  const loginDate = new Date().toLocaleString();
  
  const msg = {
    to: email,
    from: VERIFIED_SENDER,
    subject: 'Admin Dashboard Access Alert',
    text: `Security Alert: Your Auqli admin account (${username}) was used to log in on ${loginDate}. IP: ${metadata.ip}, Browser: ${metadata.userAgent}. If this wasn't you, please contact support immediately.`,
    html: `
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
    `,
  };

  console.log('Email payload prepared:', {
    to: email,
    from: msg.from,
    subject: msg.subject
  });

  try {
    const response = await sgMail.send(msg);
    console.log(`Login notification email sent to ${email} successfully`);
    console.log('SendGrid response status:', response && response[0] ? response[0].statusCode : 'No response data');
    return true;
  } catch (error) {
    console.error(`Failed to send login notification email to ${email}:`, error);
    
    // Log detailed SendGrid error information if available
    if (error.response) {
      console.error('SendGrid error response body:', error.response.body);
      console.error('SendGrid error status code:', error.code || error.statusCode);
    }
    
    // Check if the 'from' email might be the issue
    if (error.message && error.message.includes('from')) {
      console.error('IMPORTANT: Your "from" email may not be verified in SendGrid. Using verified sender email.');
      
      // Try with simplified email
      try {
        const simplifiedMsg = {
          to: email,
          from: VERIFIED_SENDER,
          subject: 'Admin Login Notification',
          text: `Your admin account ${username} was accessed at ${loginDate}. Location: ${metadata.ip}`
        };
        
        await sgMail.send(simplifiedMsg);
        console.log('Simplified login notification email sent successfully');
        return true;
      } catch (fallbackError) {
        console.error('Failed to send simplified email:', fallbackError.message);
      }
    }
    
    return false;
  }
};

/**
 * Sends a notification email when a seller is marked as international
 * @param {Object} seller - The seller object
 */
const sendInternationalSellerEmail = async (seller) => {
  console.log(`Attempting to send international seller notification to ${seller.email}`);
  
  // Validate API key is set
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set in environment variables');
    return false;
  }
  
  const sellerName = seller.businessName || `${seller.firstName} ${seller.lastName}`;
  
  const msg = {
    to: seller.email,
    from: VERIFIED_SENDER,
    subject: 'Congratulations! Your Account Has Been Upgraded to International Seller Status',
    html: `
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
    `,
  };

  try {
    const response = await sgMail.send(msg);
    console.log(`International seller notification email sent to ${seller.email} successfully`);
    return true;
  } catch (error) {
    console.error(`Failed to send international seller notification email to ${seller.email}:`, error);
    if (error.response) {
      console.error('SendGrid error response body:', error.response.body);
    }
    return false;
  }
};

const sendShipmentFailureEmail = async (buyer, order, errorMessage) => {
  const buyerName = buyer.firstName || 'Valued Customer';
  const msg = {
    to: buyer.email,
    from: VERIFIED_SENDER,
    subject: `Important: Shipment Arrangement Failed for Order #${order.order_id}`,
    html: `
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
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Shipment failure email sent to ${buyer.email} for order ${order.order_id}`);
    return true;
  } catch (error) {
    console.error(`Failed to send shipment failure email to ${buyer.email}:`, error);
    if (error.response) {
      console.error('SendGrid error response body:', error.response.body);
    }
    return false;
  }
};

module.exports = { 
  sendPasswordResetEmail,
  sendAdminLoginNotificationEmail,
  sendInternationalSellerEmail,
  sendShipmentFailureEmail
};
