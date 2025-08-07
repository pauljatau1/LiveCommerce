const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates the buyer ID parameter.
 * 
 * This function ensures the buyer ID is provided, is a string, and is not empty.
 * It adds validation errors to the errors array if validation fails.
 * 
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBuyerId(buyerId, errors) {
  // Check if buyer ID is provided (not null, undefined, or empty)
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
    return;
  }

  // Check if buyer ID is a string type
  if (typeof buyerId !== 'string') {
    errors.push({ field: 'buyerId', message: 'Buyer ID must be a string' });
    return;
  }

  // Check if buyer ID is not empty after trimming whitespace
  if (buyerId.trim() === '') {
    errors.push({ field: 'buyerId', message: 'Buyer ID cannot be empty' });
  }
}

/**
 * Validates the notification preferences object structure.
 * 
 * This function ensures the preferences object is provided, is an object (not an array),
 * and validates each section if it exists. It performs deep validation of nested objects.
 * 
 * @param {Object} preferences - The notification preferences to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateNotificationPreferences(preferences, errors) {
  // Check if preferences is provided (not null or undefined)
  if (!preferences) {
    errors.push({ field: 'preferences', message: 'Notification preferences are required' });
    return;
  }

  // Check if preferences is an object and not an array
  if (typeof preferences !== 'object' || Array.isArray(preferences)) {
    errors.push({ field: 'preferences', message: 'Notification preferences must be an object' });
    return;
  }

  // Validate orderUpdates section if it exists in the preferences
  if (preferences.orderUpdates) {
    validateOrderUpdates(preferences.orderUpdates, errors);
  }

  // Validate liveShows section if it exists in the preferences
  if (preferences.liveShows) {
    validateLiveShows(preferences.liveShows, errors);
  }

  // Validate messages section if it exists in the preferences
  if (preferences.messages) {
    validateMessages(preferences.messages, errors);
  }

  // Validate communityActivity section if it exists in the preferences
  if (preferences.communityActivity) {
    validateCommunityActivity(preferences.communityActivity, errors);
  }

  // Validate promotionsAndSales section if it exists in the preferences
  if (preferences.promotionsAndSales) {
    validatePromotionsAndSales(preferences.promotionsAndSales, errors);
  }
}

/**
 * Validates the orderUpdates section of notification preferences.
 * 
 * This function ensures the orderUpdates object is valid and contains only
 * allowed boolean fields for order-related notifications.
 * 
 * @param {Object} orderUpdates - The order updates preferences
 * @param {Array} errors - Array to collect validation errors
 */
function validateOrderUpdates(orderUpdates, errors) {
  // Check if orderUpdates is an object and not an array
  if (typeof orderUpdates !== 'object' || Array.isArray(orderUpdates)) {
    errors.push({ field: 'preferences.orderUpdates', message: 'Order updates must be an object' });
    return;
  }

  // Define allowed fields for order updates
  const allowedFields = [
    'orderConfirmation',
    'orderShipped',
    'orderDelivered',
    'orderCancelled',
    'orderRefunded',
    'orderReturned'
  ];

  // Check each field in orderUpdates
  for (const [field, value] of Object.entries(orderUpdates)) {
    // Check if field is allowed
    if (!allowedFields.includes(field)) {
      errors.push({ 
        field: `preferences.orderUpdates.${field}`, 
        message: `Invalid field '${field}' in order updates. Allowed fields: ${allowedFields.join(', ')}` 
      });
      continue;
    }

    // Check if value is a boolean
    if (typeof value !== 'boolean') {
      errors.push({ 
        field: `preferences.orderUpdates.${field}`, 
        message: `Order update preference '${field}' must be a boolean` 
      });
    }
  }
}

/**
 * Validates the liveShows section of notification preferences.
 * 
 * This function ensures the liveShows object is valid and contains only
 * allowed boolean fields for live show notifications.
 * 
 * @param {Object} liveShows - The live shows preferences
 * @param {Array} errors - Array to collect validation errors
 */
function validateLiveShows(liveShows, errors) {
  // Check if liveShows is an object and not an array
  if (typeof liveShows !== 'object' || Array.isArray(liveShows)) {
    errors.push({ field: 'preferences.liveShows', message: 'Live shows must be an object' });
    return;
  }

  // Define allowed fields for live shows
  const allowedFields = [
    'liveShowStarted',
    'liveShowEnded',
    'liveShowReminder',
    'newLiveShow'
  ];

  // Check each field in liveShows
  for (const [field, value] of Object.entries(liveShows)) {
    // Check if field is allowed
    if (!allowedFields.includes(field)) {
      errors.push({ 
        field: `preferences.liveShows.${field}`, 
        message: `Invalid field '${field}' in live shows. Allowed fields: ${allowedFields.join(', ')}` 
      });
      continue;
    }

    // Check if value is a boolean
    if (typeof value !== 'boolean') {
      errors.push({ 
        field: `preferences.liveShows.${field}`, 
        message: `Live show preference '${field}' must be a boolean` 
      });
    }
  }
}

/**
 * Validates the messages section of notification preferences.
 * 
 * This function ensures the messages object is valid and contains only
 * allowed boolean fields for message notifications.
 * 
 * @param {Object} messages - The messages preferences
 * @param {Array} errors - Array to collect validation errors
 */
function validateMessages(messages, errors) {
  // Check if messages is an object and not an array
  if (typeof messages !== 'object' || Array.isArray(messages)) {
    errors.push({ field: 'preferences.messages', message: 'Messages must be an object' });
    return;
  }

  // Define allowed fields for messages
  const allowedFields = [
    'newMessage',
    'messageRead',
    'messageReplied'
  ];

  // Check each field in messages
  for (const [field, value] of Object.entries(messages)) {
    // Check if field is allowed
    if (!allowedFields.includes(field)) {
      errors.push({ 
        field: `preferences.messages.${field}`, 
        message: `Invalid field '${field}' in messages. Allowed fields: ${allowedFields.join(', ')}` 
      });
      continue;
    }

    // Check if value is a boolean
    if (typeof value !== 'boolean') {
      errors.push({ 
        field: `preferences.messages.${field}`, 
        message: `Message preference '${field}' must be a boolean` 
      });
    }
  }
}

/**
 * Validates the communityActivity section of notification preferences.
 * 
 * This function ensures the communityActivity object is valid and contains only
 * allowed boolean fields for community activity notifications.
 * 
 * @param {Object} communityActivity - The community activity preferences
 * @param {Array} errors - Array to collect validation errors
 */
function validateCommunityActivity(communityActivity, errors) {
  // Check if communityActivity is an object and not an array
  if (typeof communityActivity !== 'object' || Array.isArray(communityActivity)) {
    errors.push({ field: 'preferences.communityActivity', message: 'Community activity must be an object' });
    return;
  }

  // Define allowed fields for community activity
  const allowedFields = [
    'newFollower',
    'newFollowing',
    'newReview',
    'newComment',
    'newLike'
  ];

  // Check each field in communityActivity
  for (const [field, value] of Object.entries(communityActivity)) {
    // Check if field is allowed
    if (!allowedFields.includes(field)) {
      errors.push({ 
        field: `preferences.communityActivity.${field}`, 
        message: `Invalid field '${field}' in community activity. Allowed fields: ${allowedFields.join(', ')}` 
      });
      continue;
    }

    // Check if value is a boolean
    if (typeof value !== 'boolean') {
      errors.push({ 
        field: `preferences.communityActivity.${field}`, 
        message: `Community activity preference '${field}' must be a boolean` 
      });
    }
  }
}

/**
 * Validates the promotionsAndSales section of notification preferences.
 * 
 * This function ensures the promotionsAndSales object is valid and contains only
 * allowed boolean fields for promotion and sale notifications.
 * 
 * @param {Object} promotionsAndSales - The promotions and sales preferences
 * @param {Array} errors - Array to collect validation errors
 */
function validatePromotionsAndSales(promotionsAndSales, errors) {
  // Check if promotionsAndSales is an object and not an array
  if (typeof promotionsAndSales !== 'object' || Array.isArray(promotionsAndSales)) {
    errors.push({ field: 'preferences.promotionsAndSales', message: 'Promotions and sales must be an object' });
    return;
  }

  // Define allowed fields for promotions and sales
  const allowedFields = [
    'newPromotion',
    'flashSale',
    'discountOffer',
    'seasonalSale',
    'newProduct'
  ];

  // Check each field in promotionsAndSales
  for (const [field, value] of Object.entries(promotionsAndSales)) {
    // Check if field is allowed
    if (!allowedFields.includes(field)) {
      errors.push({ 
        field: `preferences.promotionsAndSales.${field}`, 
        message: `Invalid field '${field}' in promotions and sales. Allowed fields: ${allowedFields.join(', ')}` 
      });
      continue;
    }

    // Check if value is a boolean
    if (typeof value !== 'boolean') {
      errors.push({ 
        field: `preferences.promotionsAndSales.${field}`, 
        message: `Promotion and sale preference '${field}' must be a boolean` 
      });
    }
  }
}

/**
 * Validates the update notification preferences data.
 * 
 * This function validates both the buyer ID and the notification preferences object.
 * It throws a ValidationError if any validation fails.
 * 
 * @param {string} buyerId - The buyer ID
 * @param {Object} preferences - The notification preferences to validate
 * @throws {ValidationError} If validation fails
 */
async function validateUpdateNotificationPreferencesData(buyerId, preferences) {
  const errors = [];

  validateBuyerId(buyerId, errors);
  validateNotificationPreferences(preferences, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateUpdateNotificationPreferencesData
}; 