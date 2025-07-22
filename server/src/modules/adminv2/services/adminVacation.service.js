const { updateVacationMode } = require('../repositories/seller.repository');
const { setAllProductsStatusBySeller } = require('../repositories/product.repository');
const { getVacationModeEmail } = require('../helpers/email.helper');
const emailService = require('../../../utils/emailService');

/**
 * Toggle seller vacation mode, update products, and send email
 * @param {string} sellerId
 * @param {boolean} isOn
 * @returns {Promise<{seller: object, productStatus: string}>}
 */
async function toggleSellerVacationMode(sellerId, isOn) {
  // Update seller
  const seller = await updateVacationMode(sellerId, isOn);
  if (!seller) throw new Error('Seller not found');
  // Update products
  const productStatus = isOn ? 'draft' : 'active';
  await setAllProductsStatusBySeller(sellerId, productStatus);
  // Send email
  const { subject, html } = getVacationModeEmail(seller, isOn);
  try {
    await emailService.sendInternationalSellerEmail({ ...seller.toObject(), subject, html });
  } catch (err) {
    // Log but don't throw
    console.error('Failed to send vacation mode email:', err);
  }
  return { seller, productStatus };
}

module.exports = {
  toggleSellerVacationMode,
}; 