/**
 * Validate that a Terminal-Africa ready address contains the mandatory fields.
 * @param {Object} address
 * @returns {{valid: boolean, message?: string}}
 */
const validateAddress = (address) => {
  if (!address.first_name || !address.phone || !address.line1 || !address.state) {
    return { valid: false, message: 'Missing required address fields' };
  }
  return { valid: true };
};

/**
 * Ensure an items array for an order has the required shape.
 * @param {Array} items
 * @returns {{valid: boolean, message?: string}}
 */
const validateItems = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { valid: false, message: 'Items must be a non-empty array' };
  }

  for (const item of items) {
    if (!item.productId || !item.quantity || !item.price) {
      return { valid: false, message: 'Each item must have productId, quantity, and price' };
    }
  }

  return { valid: true };
};

module.exports = { validateAddress, validateItems }; 