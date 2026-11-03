import { identifyUser, trackEvent, trackScreen, setSuperProperties, resetUser } from '@/utils/mixpanel';
import { useCallback, useEffect } from 'react';

/**
 * Hook to identify users with Mixpanel when they log in
 * @param userData User data containing userId and optional properties to pass to Mixpanel
 * @param isLoggedIn Boolean indicating if user is logged in
 * @returns Object with tracking functions
 */
export function useMixpanelIdentify(
  userData: { 
    userId: string | undefined; 
    email?: string;
    firstName?: string;
    lastName?: string;
    [key: string]: any;
  } | null, 
  isLoggedIn: boolean
) {
  // Identify user when they log in
  useEffect(() => {
    if (isLoggedIn && userData && userData.userId) {
      // Extract user properties to pass to Mixpanel
      const { userId, ...userProperties } = userData;
      
      // Identify the user and set profile properties
      identifyUser(userId, userProperties);
      
      // Set user ID and type as super properties that will be included with all events
      setSuperProperties({
        'User ID': userId,
        'User Type': userProperties.userType || 'standard'
      });
    } else if (!isLoggedIn) {
      // Reset user when logged out
      resetUser();
    }
  }, [isLoggedIn, userData]);

  /**
   * Track a custom event
   * @param eventName Name of the event to track
   * @param properties Optional properties to include with the event
   */
  const logEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    trackEvent(eventName, properties);
  }, []);

  /**
   * Track a screen view
   * @param screenName Name of the screen to track
   * @param properties Optional properties to include with the screen view
   */
  const logScreenView = useCallback((screenName: string, properties?: Record<string, any>) => {
    trackScreen(screenName, properties);
  }, []);

  return {
    logEvent,
    logScreenView
  };
} 