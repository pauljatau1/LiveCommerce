const Product = require('../../../models/Product');

/**
 * Set all products' status for a seller
 * @param {string} sellerId
 * @param {string} status
 * @returns {Promise<any>}
 */
async function setAllProductsStatusBySeller(sellerId, status) {
  return Product.updateMany({ seller: sellerId }, { status });
}

module.exports = {
  setAllProductsStatusBySeller,
}; 