function getVacationModeEmail(seller, isOn) {
  const sellerName = seller.businessName || seller.storeName || `${seller.firstName} ${seller.lastName}`;
  const subject = isOn ? 'Your Store is Now in Vacation Mode' : 'Your Store is Now Active';
  const html = `<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;'>
    <h2 style='color: #333;'>${subject}</h2>
    <p>Dear ${sellerName},</p>
    <p>Your store has been ${isOn ? '<b>set to vacation mode</b> by an admin' : '<b>re-activated</b> by an admin'}.</p>
    <p>${isOn ? 'While in vacation mode, your products will not be available for purchase. You can return to normal operations at any time.' : 'Your products are now available for purchase again.'}</p>
    <p>If you have any questions, please contact support.</p>
    <p>Best regards,<br>The Auqli Team</p>
  </div>`;
  return { subject, html };
}

/**
 * Generates email content for notifying sellers about Lagos-only service restriction
 * @param {Object} seller - The seller object with email, firstName, lastName, businessName
 * @returns {Object} - Object containing subject, html, and text content
 */
function getNonLagosSellerNotificationEmail(seller) {
  const recipientName = seller.businessName || `${seller.firstName} ${seller.lastName}`;
  const subject = 'Important: Auqli Service Update - Lagos Only';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">Auqli</h1>
          <p style="color: #7f8c8d; margin: 5px 0 0 0; font-size: 16px;">Marketplace Platform</p>
        </div>
        
        <h2 style="color: #2c3e50; margin-bottom: 20px;">Service Update: Lagos Only</h2>
        
        <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
          Dear ${recipientName},
        </p>
        
        <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
          We hope this message finds you well. We're writing to inform you about an important update regarding Auqli's service availability.
        </p>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">📍 Current Service Status</h3>
          <p style="color: #856404; margin: 0; line-height: 1.6;">
            <strong>Auqli is currently operating exclusively in Lagos State.</strong> 
            This means that seller accounts outside Lagos have been temporarily disabled.
          </p>
        </div>
        
        <h3 style="color: #2c3e50; margin: 25px 0 15px 0;">What This Means for You</h3>
        <ul style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
          <li>Your seller account has been temporarily disabled</li>
          <li>Your products are no longer visible in the marketplace</li>
          <li>You cannot process new orders at this time</li>
          <li>Your account data and information remain secure</li>
        </ul>
        
        <h3 style="color: #2c3e50; margin: 25px 0 15px 0;">🚀 Future Expansion Plans</h3>
        <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
          We're excited to share that Auqli is actively working on expanding our services to other states across Nigeria. 
          Our development team is working hard to ensure a seamless experience when we launch in your state.
        </p>
        
        <div style="background-color: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #2d5a2d; margin: 0 0 15px 0; font-size: 18px;">🎯 What's Coming Next</h3>
          <ul style="color: #2d5a2d; margin: 0; line-height: 1.6;">
            <li>Gradual rollout to major cities across Nigeria</li>
            <li>Enhanced logistics and delivery networks</li>
            <li>Improved seller tools and features</li>
            <li>Priority reactivation for existing sellers</li>
          </ul>
        </div>
        
        <h3 style="color: #2c3e50; margin: 25px 0 15px 0;">📧 Stay Updated</h3>
        <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
          We'll notify you as soon as Auqli becomes available in your state. 
          In the meantime, you can stay connected with us through our social media channels and newsletter.
        </p>
        
        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
          <p style="color: #6c757d; margin: 0; font-size: 14px;">
            <strong>Questions or Concerns?</strong><br>
            Contact us at <a href="mailto:support@auqli.com" style="color: #007bff; text-decoration: none;">support@auqli.com</a>
          </p>
        </div>
        
        <p style="color: #34495e; line-height: 1.6; margin-bottom: 10px;">
          Thank you for your understanding and patience as we work to bring Auqli to every corner of Nigeria.
        </p>
        
        <p style="color: #34495e; line-height: 1.6; margin-bottom: 0;">
          Best regards,<br>
          <strong>The Auqli Team</strong>
        </p>
      </div>
    </div>
  `;

  const textContent = `
    Important: Auqli Service Update - Lagos Only
    
    Dear ${recipientName},
    
    We hope this message finds you well. We're writing to inform you about an important update regarding Auqli's service availability.
    
    CURRENT SERVICE STATUS:
    Auqli is currently operating exclusively in Lagos State. This means that seller accounts outside Lagos have been temporarily disabled.
    
    WHAT THIS MEANS FOR YOU:
    - Your seller account has been temporarily disabled
    - Your products are no longer visible in the marketplace
    - You cannot process new orders at this time
    - Your account data and information remain secure
    
    FUTURE EXPANSION PLANS:
    We're excited to share that Auqli is actively working on expanding our services to other states across Nigeria. Our development team is working hard to ensure a seamless experience when we launch in your state.
    
    WHAT'S COMING NEXT:
    - Gradual rollout to major cities across Nigeria
    - Enhanced logistics and delivery networks
    - Improved seller tools and features
    - Priority reactivation for existing sellers
    
    STAY UPDATED:
    We'll notify you as soon as Auqli becomes available in your state. In the meantime, you can stay connected with us through our social media channels and newsletter.
    
    Questions or Concerns? Contact us at support@auqli.com
    
    Thank you for your understanding and patience as we work to bring Auqli to every corner of Nigeria.
    
    Best regards,
    The Auqli Team
  `;

  return {
    subject,
    html: htmlContent,
    text: textContent
  };
}

module.exports = {
  getVacationModeEmail,
  getNonLagosSellerNotificationEmail,
}; 