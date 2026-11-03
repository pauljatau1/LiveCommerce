import {
  identifyUser as identifyUserCIO,
  trackEvent as trackEventCIO,
  trackScreen as trackScreenCIO,
} from "./customerio";
import {
  identifyUser as identifyUserMixpanel,
  trackEvent as trackEventMixpanel,
  trackScreen as trackScreenMixpanel,
  resetUser as resetUserMixpanel,
} from "./mixpanel";
import {
  trackFacebookEvent,
  setFacebookUserId,
  setFacebookUserData,
  debugFacebookSDK,
} from "./facebook-analytics";

/**
 * Debug function to test all analytics platforms
 * Use this to verify Facebook events are working
 */
export const debugAnalytics = async () => {
  console.log('🔍 === ANALYTICS DEBUG SESSION ===');
  
  // Check Facebook SDK state
  console.log('\n📱 Facebook SDK Status:');
  const fbDebug = await debugFacebookSDK();
  
  // Test a simple Facebook event
  console.log('\n🧪 Testing Facebook Event:');
  try {
    trackFacebookEvent('debug_test_event', {
      test_param: 'debug_value',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Direct Facebook event failed:', error);
  }
  
  // Test global analytics (should trigger all platforms)
  console.log('\n🌐 Testing Global Analytics:');
  try {
    trackEvent('debug_global_test', {
      test_type: 'debug',
      platform: 'all',
      value: 5.0
    });
  } catch (error) {
    console.error('❌ Global analytics failed:', error);
  }
  
  console.log('\n✅ Debug session complete. Check logs above for Facebook events.');
  console.log('💡 If no Facebook events appear, check:');
  console.log('  - Real device (not simulator)');
  console.log('  - Facebook app installed & logged in');
  console.log('  - App Tracking Transparency permission (iOS)');
  console.log('  - Facebook Events Manager (events may take 5-10 minutes)');
  
  return fbDebug;
};

/**
 * Identifies a user in all analytics platforms
 * @param userId User ID to identify
 * @param traits User properties/traits
 */
export const identifyUser = (
  userId: string | undefined,
  traits?: Record<string, any>,
) => {
  if (!userId) return;

  // Identify in CustomerIO
  identifyUserCIO(userId, traits);

  // Identify in Mixpanel
  if (userId) {
    identifyUserMixpanel(userId, traits);
  }

  // Set user ID in Facebook
  try {
    setFacebookUserId(userId);

    // Set user data for Facebook advanced matching if available
    if (traits) {
      const facebookUserData: Record<string, string> = {};

      // Map common user traits to Facebook user data format
      if (traits.email || traits.$email) {
        facebookUserData.em = String(
          traits.email || traits.$email,
        ).toLowerCase();
      }
      if (traits.phone || traits.phoneNumber) {
        facebookUserData.ph = String(traits.phone || traits.phoneNumber);
      }
      if (traits.firstName) {
        facebookUserData.fn = String(traits.firstName).toLowerCase();
      }
      if (traits.lastName) {
        facebookUserData.ln = String(traits.lastName).toLowerCase();
      }
      if (traits.country) {
        facebookUserData.country = String(traits.country).toLowerCase();
      }
      if (traits.city) {
        facebookUserData.ct = String(traits.city).toLowerCase();
      }
      if (traits.state) {
        facebookUserData.st = String(traits.state).toLowerCase();
      }
      if (traits.zipCode || traits.zip) {
        facebookUserData.zp = String(traits.zipCode || traits.zip);
      }

      // Only set user data if we have at least one valid field
      if (Object.keys(facebookUserData).length > 0) {
        setFacebookUserData(facebookUserData);
      }
    }
  } catch (error) {
    console.error("Failed to identify user in Facebook:", error);
  }
};

/**
 * Tracks an event in all analytics platforms
 * @param eventName Name of the event to track
 * @param properties Properties to associate with the event
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>,
) => {
  // Track in CustomerIO
  trackEventCIO(eventName, properties);

  // Track in Mixpanel
  trackEventMixpanel(eventName, properties);

  // Track in Facebook
  try {
    // Extract value for Facebook if available
    trackFacebookEvent(eventName, properties);
  } catch (error) {
    console.error("Failed to track event in Facebook:", error);
  }
};

/**
 * Tracks a screen view in all analytics platforms
 * @param screenName Name of the screen to track
 * @param properties Properties to associate with the screen view
 */
export const trackScreen = (
  screenName: string,
  properties?: Record<string, any>,
) => {
  // Track in CustomerIO
  trackScreenCIO(screenName, properties);

  // Track in Mixpanel
  trackScreenMixpanel(screenName, properties);

  // Track screen view in Facebook as a custom event
  try {
    const facebookProperties = {
      fb_content_type: "screen",
      screen_name: screenName,
      ...(properties || {}),
    };
    trackFacebookEvent("fb_mobile_screen_view", facebookProperties);
  } catch (error) {
    console.error("Failed to track screen in Facebook:", error);
  }
};

/**
 * Resets the user in all analytics platforms (call on logout)
 */
export const resetUser = () => {
  // Reset in Mixpanel
  resetUserMixpanel();

  // Note: CustomerIO doesn't have a direct reset method, but we could handle cleaning up
  // CustomerIO-specific user data here if needed

  // Reset Facebook user data
  try {
    setFacebookUserId("");
    setFacebookUserData({});
  } catch (error) {
    console.error("Failed to reset user in Facebook:", error);
  }
};

/**
 * Initializes all analytics platforms
 * This should be called once at app startup
 */
export const initializeAnalytics = () => {
  // Both platforms are initialized in app/index.tsx
  console.log("Analytics initialized");
};
