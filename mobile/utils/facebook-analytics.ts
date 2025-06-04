import { AppEventsLogger } from 'react-native-fbsdk-next';
import { Platform } from 'react-native';

/**
 * Facebook App Events Analytics
 * Provides standalone Facebook event tracking functionality
 * Compatible with e-commerce/retail app events as per Facebook documentation
 */

/**
 * Debug function to log Facebook SDK state
 */
export const debugFacebookSDK = async () => {
  try {
    console.log('🔍 Facebook SDK Debug Info:');
    console.log('- Platform:', Platform.OS);
    console.log('- __DEV__:', __DEV__);
    
    // Try to get anonymous ID to verify SDK is working
    const anonymousId = await AppEventsLogger.getAnonymousID();
    console.log('- Anonymous ID:', anonymousId);
    
    // Get user ID if set
    const userId = await AppEventsLogger.getUserID();
    console.log('- User ID:', userId);
    
    // Log the Facebook App ID being used
    console.log('🎯 IMPORTANT: Your events are being sent to Facebook App ID: 1749317145848990');
    console.log('📍 In Facebook Events Manager, look for a data source with this App ID');
    console.log('📱 Check "Mobile app" data sources, not just "Pixel" sources');
    
    return { anonymousId, userId };
  } catch (error) {
    console.error('❌ Facebook SDK Debug Error:', error);
    return null;
  }
};

/**
 * Tracks a custom event to Facebook App Events
 * @param eventName Name of the event to track
 * @param properties Event properties/parameters
 */
export const trackFacebookEvent = (
  eventName: string, 
  properties?: Record<string, any>
) => {
  try {
    console.log('🚀 Attempting Facebook event:', {
      eventName,
      properties,
      platform: Platform.OS,
      isDev: __DEV__
    });


    AppEventsLogger.logEvent(eventName, properties || {});

    console.log(`✅ Facebook event sent: ${eventName}`, properties);
    
    // Force flush in development to ensure events are sent immediately
    if (__DEV__) {
      AppEventsLogger.flush();
      console.log('🔄 Facebook events flushed (dev mode)');
    }
  } catch (error: any) {
    console.error(`❌ Facebook event tracking failed for ${eventName}:`, error);
    console.error('Stack trace:', error?.stack || 'No stack trace available');
  }
};

/**
 * Tracks a purchase event to Facebook
 * @param purchaseAmount Amount of the purchase
 * @param currency Currency code (e.g., 'USD', 'EUR')
 * @param properties Additional purchase properties
 */
export const trackFacebookPurchase = (
  purchaseAmount: number,
  currency: string,
  properties?: Record<string, any>
) => {
  try {
    AppEventsLogger.logPurchase(purchaseAmount, currency, properties || {});
    console.log(`✅ Facebook purchase tracked: ${purchaseAmount} ${currency}`, properties);
  } catch (error) {
    console.error(`❌ Facebook purchase tracking failed:`, error);
  }
};

/**
 * Facebook Standard E-commerce Events
 * Based on Facebook's e-commerce best practices documentation
 */

/**
 * Track when a user searches for content
 */
export const trackFacebookSearch = (
  searchString: string,
  contentType?: string,
  success?: boolean
) => {
  const params: Record<string, any> = {
    fb_search_string: searchString,
  };
  
  if (contentType) params.fb_content_type = contentType;
  if (success !== undefined) params.fb_success = success ? 1 : 0;

  trackFacebookEvent('fb_mobile_search', params);
};

/**
 * Track when a user views content/product
 */
export const trackFacebookViewContent = (
  contentId: string,
  contentType: string,
  currency?: string,
  value?: number,
  description?: string
) => {
  const params: Record<string, any> = {
    fb_content_id: contentId,
    fb_content_type: contentType,
  };

  if (currency) params.fb_currency = currency;
  if (description) params.fb_description = description;

  trackFacebookEvent('fb_mobile_content_view', params);
};

/**
 * Track when a user adds an item to wishlist
 */
export const trackFacebookAddToWishlist = (
  contentId: string,
  contentType: string,
  currency?: string,
  value?: number,
  description?: string
) => {
  const params: Record<string, any> = {
    fb_content_id: contentId,
    fb_content_type: contentType,
  };

  if (currency) params.fb_currency = currency;
  if (description) params.fb_description = description;

  trackFacebookEvent('fb_mobile_add_to_wishlist', params);
};

/**
 * Track when a user adds an item to cart
 */
export const trackFacebookAddToCart = (
  contentId: string,
  contentType: string,
  currency?: string,
  value?: number,
  description?: string
) => {
  const params: Record<string, any> = {
    fb_content_id: contentId,
    fb_content_type: contentType,
  };

  if (currency) params.fb_currency = currency;
  if (description) params.fb_description = description;

  trackFacebookEvent('fb_mobile_add_to_cart', params);
};

/**
 * Track when a user adds payment info
 */
export const trackFacebookAddPaymentInfo = (success?: boolean) => {
  const params: Record<string, any> = {};
  if (success !== undefined) params.fb_success = success ? 1 : 0;

  trackFacebookEvent('fb_mobile_add_payment_info', params);
};

/**
 * Track when a user initiates checkout
 */
export const trackFacebookInitiateCheckout = (
  contentId?: string,
  contentType?: string,
  numItems?: number,
  paymentInfoAvailable?: boolean,
  currency?: string,
  totalPrice?: number
) => {
  const params: Record<string, any> = {};

  if (contentId) params.fb_content_id = contentId;
  if (contentType) params.fb_content_type = contentType;
  if (numItems) params.fb_num_items = numItems;
  if (paymentInfoAvailable !== undefined) params.fb_payment_info_available = paymentInfoAvailable ? 1 : 0;
  if (currency) params.fb_currency = currency;

  trackFacebookEvent('fb_mobile_initiated_checkout', params);
};

/**
 * Track app registration/signup
 */
export const trackFacebookCompleteRegistration = (
  registrationMethod?: string,
  success?: boolean
) => {
  const params: Record<string, any> = {};
  
  if (registrationMethod) params.fb_registration_method = registrationMethod;
  if (success !== undefined) params.fb_success = success ? 1 : 0;

  trackFacebookEvent('fb_mobile_complete_registration', params);
};

/**
 * Track user login
 */
export const trackFacebookLogin = (loginMethod?: string, success?: boolean) => {
  const params: Record<string, any> = {};
  
  if (loginMethod) params.fb_login_method = loginMethod;
  if (success !== undefined) params.fb_success = success ? 1 : 0;

  trackFacebookEvent('fb_mobile_login', params);
};

/**
 * Track when user shares content
 */
export const trackFacebookShare = (
  contentType?: string,
  contentId?: string,
  method?: string
) => {
  const params: Record<string, any> = {};
  
  if (contentType) params.fb_content_type = contentType;
  if (contentId) params.fb_content_id = contentId;
  if (method) params.fb_method = method;

  trackFacebookEvent('fb_mobile_share', params);
};

/**
 * Track app activation (app open)
 */
export const trackFacebookAppActivation = () => {
  // Facebook automatically tracks app activations when autoLogAppEventsEnabled is true
  // But you can also manually track it
  trackFacebookEvent('fb_mobile_activate_app');
};

/**
 * Set user ID for Facebook tracking
 * @param userId User ID to associate with events
 */
export const setFacebookUserId = (userId: string) => {
  try {
    AppEventsLogger.setUserID(userId);
    console.log(`✅ Facebook User ID set: ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to set Facebook User ID:`, error);
  }
};

/**
 * Set user data for Facebook advanced matching
 * @param userData User data object with email, phone, etc.
 */
export const setFacebookUserData = (userData: Record<string, string>) => {
  try {
    AppEventsLogger.setUserData(userData);
    console.log(`✅ Facebook User Data set:`, userData);
  } catch (error) {
    console.error(`❌ Failed to set Facebook User Data:`, error);
  }
};

/**
 * Flush Facebook events (force send pending events)
 */
export const flushFacebookEvents = () => {
  try {
    AppEventsLogger.flush();
    console.log(`✅ Facebook events flushed`);
  } catch (error) {
    console.error(`❌ Failed to flush Facebook events:`, error);
  }
};

/**
 * Facebook Standard Event Names
 * Use these constants for consistent event naming
 */
export const FacebookEvents = {
  // E-commerce events
  VIEW_CONTENT: 'fb_mobile_content_view',
  SEARCH: 'fb_mobile_search',
  ADD_TO_CART: 'fb_mobile_add_to_cart',
  ADD_TO_WISHLIST: 'fb_mobile_add_to_wishlist',
  INITIATE_CHECKOUT: 'fb_mobile_initiated_checkout',
  ADD_PAYMENT_INFO: 'fb_mobile_add_payment_info',
  PURCHASE: 'fb_mobile_purchase',
  
  // User events
  COMPLETE_REGISTRATION: 'fb_mobile_complete_registration',
  LOGIN: 'fb_mobile_login',
  LOGOUT: 'fb_mobile_logout',
  
  // Engagement events
  SHARE: 'fb_mobile_share',
  ACTIVATE_APP: 'fb_mobile_activate_app',
  TUTORIAL_COMPLETION: 'fb_mobile_tutorial_completion',
  LEVEL_ACHIEVED: 'fb_mobile_level_achieved',
  ACHIEVEMENT_UNLOCKED: 'fb_mobile_achievement_unlocked',
  
  // Custom events
  CUSTOM: 'fb_custom_event',
} as const;

/**
 * Facebook Event Parameters
 * Standard parameter names for Facebook events
 */
export const FacebookEventParams = {
  CONTENT_ID: 'fb_content_id',
  CONTENT_TYPE: 'fb_content_type',
  CURRENCY: 'fb_currency',
  DESCRIPTION: 'fb_description',
  LEVEL: 'fb_level',
  MAX_RATING_VALUE: 'fb_max_rating_value',
  NUM_ITEMS: 'fb_num_items',
  PAYMENT_INFO_AVAILABLE: 'fb_payment_info_available',
  REGISTRATION_METHOD: 'fb_registration_method',
  SEARCH_STRING: 'fb_search_string',
  SUCCESS: 'fb_success',
  LOGIN_METHOD: 'fb_login_method',
  METHOD: 'fb_method',
} as const; 