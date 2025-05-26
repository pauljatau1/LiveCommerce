import { identifyUser as identifyUserCIO, trackEvent as trackEventCIO, trackScreen as trackScreenCIO } from './customerio';
import { identifyUser as identifyUserMixpanel, trackEvent as trackEventMixpanel, trackScreen as trackScreenMixpanel, resetUser as resetUserMixpanel } from './mixpanel';

/**
 * Identifies a user in all analytics platforms
 * @param userId User ID to identify
 * @param traits User properties/traits
 */
export const identifyUser = (userId: string | undefined, traits?: Record<string, any>) => {
  if (!userId) return;
  
  // Identify in CustomerIO
  identifyUserCIO(userId, traits);
  
  // Identify in Mixpanel
  if (userId) {
    identifyUserMixpanel(userId, traits);
  }
};

/**
 * Tracks an event in all analytics platforms
 * @param eventName Name of the event to track
 * @param properties Properties to associate with the event
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  // Track in CustomerIO
  trackEventCIO(eventName, properties);
  
  // Track in Mixpanel
  trackEventMixpanel(eventName, properties);
};

/**
 * Tracks a screen view in all analytics platforms
 * @param screenName Name of the screen to track
 * @param properties Properties to associate with the screen view
 */
export const trackScreen = (screenName: string, properties?: Record<string, any>) => {
  // Track in CustomerIO
  trackScreenCIO(screenName, properties);
  
  // Track in Mixpanel
  trackScreenMixpanel(screenName, properties);
};

/**
 * Resets the user in all analytics platforms (call on logout)
 */
export const resetUser = () => {
  // Reset in Mixpanel
  resetUserMixpanel();
  
  // Note: CustomerIO doesn't have a direct reset method, but we could handle cleaning up
  // CustomerIO-specific user data here if needed
};

/**
 * Initializes all analytics platforms
 * This should be called once at app startup
 */
export const initializeAnalytics = () => {
  // Both platforms are initialized in app/index.tsx
  console.log('Analytics initialized');
}; 