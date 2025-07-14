const Seller = require('../../../models/Seller');

/**
 * Update vacation mode fields for a seller
 * @param {string} sellerId
 * @param {boolean} isOn
 * @returns {Promise<Seller|null>}
 */
async function updateVacationMode(sellerId, isOn) {
  const update = {
    'vacationMode.isOn': isOn,
    'vacationMode.enabledAt': isOn ? new Date() : undefined,
    'vacationMode.disabledAt': !isOn ? new Date() : undefined
  };
  Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);
  return Seller.findByIdAndUpdate(sellerId, update, { new: true });
}

module.exports = {
  updateVacationMode,
}; 