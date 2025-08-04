const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates the buyer ID parameter.
 * 
 * This function ensures the buyer ID is provided, is a string, and is not empty.
 * It throws a ValidationError with specific field information if validation fails.
 * 
 * @param {string} buyerId - The buyer ID to validate
 * @throws {ValidationError} If buyer ID is invalid
 */
function validateBuyerId(buyerId) {
  // Check if buyer ID is provided (not null, undefined, or empty)
  if (!buyerId) {
    throw new ValidationError([
      { field: 'buyerId', message: 'Buyer ID is required' }
    ]);
  }

  // Check if buyer ID is a string type
  if (typeof buyerId !== 'string') {
    throw new ValidationError([
      { field: 'buyerId', message: 'Buyer ID must be a string' }
    ]);
  }

  // Check if buyer ID is not empty after trimming whitespace
  if (buyerId.trim() === '') {
    throw new ValidationError([
      { field: 'buyerId', message: 'Buyer ID cannot be empty' }
    ]);
  }
}

/**
 * Validates the notification preferences object structure.
 * 
 * This function ensures the preferences object is provided, is an object (not an array),
 * and validates each section if it exists. It performs deep validation of nested objects.
 * 
 * @param {Object} preferences - The notification preferences to validate
 * @throws {ValidationError} If preferences structure is invalid
 */
function validateNotificationPreferences(preferences) {
  // Check if preferences is provided (not null or undefined)
  if (!preferences) {
    throw new ValidationError([
      { field: 'preferences', message: 'Notification preferences are required' }
    ]);
  }

  // Check if preferences is an object and not an array
  if (typeof preferences !== 'object' || Array.isArray(preferences)) {
    throw new ValidationError([
      { field: 'preferences', message: 'Notification preferences must be an object' }
    ]);
  }

  // Validate orderUpdates section if it exists in the preferences
  if (preferences.orderUpdates) {
    validateOrderUpdates(preferences.orderUpdates);
  }

  // Validate liveShows section if it exists in the preferences
  if (preferences.liveShows) {
    validateLiveShows(preferences.liveShows);
  }

  // Validate messages section if it exists in the preferences
  if (preferences.messages) {
    validateMessages(preferences.messages);
  }

  // Validate communityActivity section if it exists in the preferences
  if (preferences.communityActivity) {
    validateCommunityActivity(preferences.communityActivity);
  }

  // Validate promotionsAndSales section if it exists in the preferences
  if (preferences.promotionsAndSales) {
    validatePromotionsAndSales(preferences.promotionsAndSales);
  }
}

/**
 * Validates the orderUpdates section of notification preferences.
 * 
 * This function ensures the orderUpdates object is valid and contains only
 * allowed boolean fields for order-related notifications.
 * 
 * @param {Object} orderUpdates - The order updates preferences
 * @throws {ValidationError} If order updates structure is invalid
 */
function validateOrderUpdates(orderUpdates) {
  // Check if orderUpdates is an object and not an array
  if (typeof orderUpdates !== 'object' || Array.isArray(orderUpdates)) {
    throw new ValidationError([
      { field: 'preferences.orderUpdates', message: 'Order updates must be an object' }
    ]);
  }

  // Define the valid fields allowed in orderUpdates
  const validFields = ['orderConfirmation', 'shippingAndDelivery', 'orderCancellation', 'refundUpdates'];
  
  // Iterate through each key-value pair in the orderUpdates object
  for (const [key, value] of Object.entries(orderUpdates)) {
    // Check if the field is in the list of valid fields
    if (!validFields.includes(key)) {
      throw new ValidationError([
        { field: `preferences.orderUpdates.${key}`, message: `Invalid field: ${key}` }
      ]);
    }
    
    // Check if the value is a boolean type
    if (typeof value !== 'boolean') {
      throw new ValidationError([
        { field: `preferences.orderUpdates.${key}`, message: `${key} must be a boolean value` }
      ]);
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
 * @throws {ValidationError} If live shows structure is invalid
 */
function validateLiveShows(liveShows) {
  // Check if liveShows is an object and not an array
  if (typeof liveShows !== 'object' || Array.isArray(liveShows)) {
    throw new ValidationError([
      { field: 'preferences.liveShows', message: 'Live shows must be an object' }
    ]);
  }

  // Define the valid fields allowed in liveShows
  const validFields = ['allShows', 'followedSellers', 'recommendedShows'];
  
  // Iterate through each key-value pair in the liveShows object
  for (const [key, value] of Object.entries(liveShows)) {
    // Check if the field is in the list of valid fields
    if (!validFields.includes(key)) {
      throw new ValidationError([
        { field: `preferences.liveShows.${key}`, message: `Invalid field: ${key}` }
      ]);
    }
    
    // Check if the value is a boolean type
    if (typeof value !== 'boolean') {
      throw new ValidationError([
        { field: `preferences.liveShows.${key}`, message: `${key} must be a boolean value` }
      ]);
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
 * @throws {ValidationError} If messages structure is invalid
 */
function validateMessages(messages) {
  // Check if messages is an object and not an array
  if (typeof messages !== 'object' || Array.isArray(messages)) {
    throw new ValidationError([
      { field: 'preferences.messages', message: 'Messages must be an object' }
    ]);
  }

  // Define the valid fields allowed in messages
  const validFields = ['fromSellers', 'fromBuyers', 'chatReplies', 'mentions'];
  
  // Iterate through each key-value pair in the messages object
  for (const [key, value] of Object.entries(messages)) {
    // Check if the field is in the list of valid fields
    if (!validFields.includes(key)) {
      throw new ValidationError([
        { field: `preferences.messages.${key}`, message: `Invalid field: ${key}` }
      ]);
    }
    
    // Check if the value is a boolean type
    if (typeof value !== 'boolean') {
      throw new ValidationError([
        { field: `preferences.messages.${key}`, message: `${key} must be a boolean value` }
      ]);
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
 * @throws {ValidationError} If community activity structure is invalid
 */
function validateCommunityActivity(communityActivity) {
  // Check if communityActivity is an object and not an array
  if (typeof communityActivity !== 'object' || Array.isArray(communityActivity)) {
    throw new ValidationError([
      { field: 'preferences.communityActivity', message: 'Community activity must be an object' }
    ]);
  }

  // Define the valid fields allowed in communityActivity
  const validFields = ['postComments', 'postLikes', 'repliesAndMentions'];
  
  // Iterate through each key-value pair in the communityActivity object
  for (const [key, value] of Object.entries(communityActivity)) {
    // Check if the field is in the list of valid fields
    if (!validFields.includes(key)) {
      throw new ValidationError([
        { field: `preferences.communityActivity.${key}`, message: `Invalid field: ${key}` }
      ]);
    }
    
    // Check if the value is a boolean type
    if (typeof value !== 'boolean') {
      throw new ValidationError([
        { field: `preferences.communityActivity.${key}`, message: `${key} must be a boolean value` }
      ]);
    }
  }
}

/**
 * Validates the promotionsAndSales section of notification preferences.
 * 
 * This function ensures the promotionsAndSales object is valid and contains only
 * allowed boolean fields for promotions and sales notifications.
 * 
 * @param {Object} promotionsAndSales - The promotions and sales preferences
 * @throws {ValidationError} If promotions and sales structure is invalid
 */
function validatePromotionsAndSales(promotionsAndSales) {
  // Check if promotionsAndSales is an object and not an array
  if (typeof promotionsAndSales !== 'object' || Array.isArray(promotionsAndSales)) {
    throw new ValidationError([
      { field: 'preferences.promotionsAndSales', message: 'Promotions and sales must be an object' }
    ]);
  }

  // Define the valid fields allowed in promotionsAndSales
  const validFields = ['flashSales', 'couponsAndDeals', 'trendingProducts', 'recommendations'];
  
  // Iterate through each key-value pair in the promotionsAndSales object
  for (const [key, value] of Object.entries(promotionsAndSales)) {
    // Check if the field is in the list of valid fields
    if (!validFields.includes(key)) {
      throw new ValidationError([
        { field: `preferences.promotionsAndSales.${key}`, message: `Invalid field: ${key}` }
      ]);
    }
    
    // Check if the value is a boolean type
    if (typeof value !== 'boolean') {
      throw new ValidationError([
        { field: `preferences.promotionsAndSales.${key}`, message: `${key} must be a boolean value` }
      ]);
    }
  }
}

/**
 * Validates the update notification preferences data.
 * 
 * This is the main validation function that orchestrates the validation of
 * both the buyer ID and the notification preferences object. It calls the
 * individual validation functions for each component.
 * 
 * @param {string} buyerId - The buyer ID
 * @param {Object} preferences - The notification preferences to update
 * @throws {ValidationError} If validation fails
 */
async function validateUpdateNotificationPreferencesData(buyerId, preferences) {
  // Validate buyer ID first
  validateBuyerId(buyerId);
  
  // Validate notification preferences structure and content
  validateNotificationPreferences(preferences);
}

module.exports = {
  validateBuyerId,
  validateNotificationPreferences,
  validateOrderUpdates,
  validateLiveShows,
  validateMessages,
  validateCommunityActivity,
  validatePromotionsAndSales,
  validateUpdateNotificationPreferencesData
}; 