import { identifyUser, trackEvent, trackScreen, resetUser } from '@/utils/analytics';
import { useCallback, useEffect } from 'react';

/**
 * Combined hook for all analytics platforms
 * @param userData User data containing userId and optional traits
 * @param isLoggedIn Boolean indicating if user is logged in
 * @returns Object with tracking functions
 */
export function useAnalytics(
  userData: { 
    userId: string | undefined; 
    email?: string;
    firstName?: string;
    lastName?: string;
    [key: string]: any;
  } | null, 
  isLoggedIn: boolean
) {
  // Identify user when they log in or out
  useEffect(() => {
    if (isLoggedIn && userData && userData.userId) {
      // User is logged in - identify them
      identifyUser(userData.userId, userData);
    } else if (!isLoggedIn) {
      // User is logged out - reset analytics state
      resetUser();
    }
  }, [isLoggedIn, userData]);

  /**
   * Track a custom event in all analytics platforms
   * @param eventName Name of the event to track
   * @param properties Optional properties to include with the event
   */
  const logEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    trackEvent(eventName, properties);
  }, []);

  /**
   * Track a screen view in all analytics platforms
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