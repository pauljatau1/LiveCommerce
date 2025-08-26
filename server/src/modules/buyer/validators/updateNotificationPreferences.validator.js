/**
 * Update Notification Preferences Validator
 *
 * This validator handles input validation for notification preferences updates.
 * It provides comprehensive validation for all notification preference sections
 * including order updates, live shows, messages, community activity, and promotions.
 *
 * The validator ensures that:
 * - Buyer ID is provided and valid
 * - All preference sections are properly structured
 * - Only allowed fields are present in each section
 * - All preference values are boolean
 * - No invalid or malicious data is accepted
 *
 * Notification Categories:
 * - Order Updates: Order status notifications
 * - Live Shows: Live streaming notifications
 * - Messages: Communication notifications
 * - Community Activity: Social interaction notifications
 * - Promotions and Sales: Marketing notifications
 *
 * @module updateNotificationPreferencesValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates the buyer ID parameter.
 * 
 * This function ensures the buyer ID is provided, is a string, and is not empty.
 * It performs basic validation to ensure the buyer ID is in the correct format
 * before proceeding with preference validation.
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
 * and validates each section if it exists. It performs deep validation of nested objects
 * to ensure data integrity and proper structure.
 * 
 * Validation Strategy:
 * - Ensures preferences object exists and is properly typed
 * - Validates each notification category if present
 * - Collects all validation errors before throwing
 * - Allows partial updates (not all sections required)
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
 * allowed boolean fields for order-related notifications. It validates the
 * structure and content of order update preferences.
 * 
 * Order Update Fields:
 * - orderConfirmation: Order confirmation notifications
 * - orderShipped: Order shipping notifications
 * - orderDelivered: Order delivery notifications
 * - orderCancelled: Order cancellation notifications
 * - orderRefunded: Order refund notifications
 * - orderReturned: Order return notifications
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
 * allowed boolean fields for live show notifications. It validates the
 * structure and content of live show preferences.
 * 
 * Live Show Fields:
 * - liveShowStarted: Live show start notifications
 * - liveShowEnded: Live show end notifications
 * - liveShowReminder: Live show reminder notifications
 * - newLiveShow: New live show announcement notifications
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
 * allowed boolean fields for message notifications. It validates the
 * structure and content of message preferences.
 * 
 * Message Fields:
 * - newMessage: New message notifications
 * - messageRead: Message read status notifications
 * - messageReplied: Message reply notifications
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
 * allowed boolean fields for community activity notifications. It validates the
 * structure and content of community activity preferences.
 * 
 * Community Activity Fields:
 * - newFollower: New follower notifications
 * - newFollowing: New following notifications
 * - newReview: New review notifications
 * - newComment: New comment notifications
 * - newLike: New like notifications
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
 * allowed boolean fields for promotion and sale notifications. It validates the
 * structure and content of promotion and sale preferences.
 * 
 * Promotions and Sales Fields:
 * - newPromotion: New promotion notifications
 * - flashSale: Flash sale notifications
 * - discountOffer: Discount offer notifications
 * - seasonalSale: Seasonal sale notifications
 * - newProduct: New product notifications
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
 * Validates the update notification preferences data - Main validation function.
 * 
 * This is the primary validation function that orchestrates the complete
 * validation process for notification preferences updates. It validates both
 * the buyer ID and the notification preferences object structure.
 * 
 * Validation Process:
 * 1. Validates buyer ID format and presence
 * 2. Validates notification preferences object structure
 * 3. Validates each notification category if present
 * 4. Collects all validation errors
 * 5. Throws ValidationError if any validation fails
 * 
 * Validation Features:
 * - Comprehensive buyer ID validation
 * - Deep object structure validation
 * - Field-level validation for each notification category
 * - Boolean value validation for all preferences
 * - Detailed error messages with field paths
 * 
 * @param {string} buyerId - The buyer ID to validate
 * @param {Object} preferences - The notification preferences object to validate
 * @throws {ValidationError} If any validation fails (contains all validation errors)
 *
 * @example
 * // Valid notification preferences
 * await validateUpdateNotificationPreferencesData('507f1f77bcf86cd799439011', {
 *   orderUpdates: {
 *     orderConfirmation: true,
 *     orderShipped: false
 *   },
 *   liveShows: {
 *     newLiveShow: true
 *   }
 * });
 *
 * @example
 * // Invalid notification preferences
 * try {
 *   await validateUpdateNotificationPreferencesData('', {
 *     orderUpdates: {
 *       invalidField: 'not boolean'
 *     }
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains array of validation errors
 * }
 */
async function validateUpdateNotificationPreferencesData(buyerId, preferences) {
  const errors = [];

  // Step 1: Validate buyer ID
  validateBuyerId(buyerId, errors);
  
  // Step 2: Validate notification preferences structure and content
  validateNotificationPreferences(preferences, errors);

  // Step 3: Throw ValidationError if any validation failed
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateUpdateNotificationPreferencesData
}; 