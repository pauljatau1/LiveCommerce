const terminalService = require('./terminalService');
const cache = require('memory-cache');
const { validateAddress } = require('../utils/addressValidator');

exports.calculateShippingFee = async (product, destination, pickup) => {
  // Validate addresses
  if (!validateAddress(destination) || !validateAddress(pickup)) {
    throw new Error('Invalid address format');
  }

  // Check cache
  const cacheKey = `shipping_${product._id}_${JSON.stringify(destination)}`;
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  // Create parcel in Terminal Africa
  const parcel = await terminalService.createParcel(product);

  // Get shipping rates
  const rates = await terminalService.calculateShipping(
    parcel,
    pickup,
    destination
  );

  // Cache the result for 1 hour
  cache.put(cacheKey, rates, 3600000);

  return rates;
};

exports.estimateDeliveryDate = (shippingMethod) => {
  const today = new Date();
  const deliveryDays = {
    express: 2,
    standard: 5,
    economy: 8
  };

  const estimatedDate = new Date(today);
  estimatedDate.setDate(today.getDate() + deliveryDays[shippingMethod]);
  
  // Skip weekends
  while (estimatedDate.getDay() === 0 || estimatedDate.getDay() === 6) {
    estimatedDate.setDate(estimatedDate.getDate() + 1);
  }

  return estimatedDate;
};
