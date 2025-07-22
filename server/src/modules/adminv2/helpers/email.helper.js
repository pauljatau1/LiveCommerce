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

module.exports = {
  getVacationModeEmail,
}; 