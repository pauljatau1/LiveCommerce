import { identifyUser, trackEvent, trackScreen } from "@/utils/customerio";
import { useCallback, useEffect } from "react";

/**
 * Hook to identify users with Customer.io when they log in
 * @param userData User data containing userId and optional traits to pass to Customer.io
 * @param isLoggedIn Boolean indicating if user is logged in
 * @returns Object with tracking functions
 */
export function useCustomerIoIdentify(
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
      // Extract user traits to pass to Customer.io
      const { userId, ...traits } = userData;
      
      // Identify the user
      identifyUser(userId, traits);
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
   */
  const logScreenView = useCallback((screenName: string) => {
    trackScreen(screenName);
  }, []);

  return {
    logEvent,
    logScreenView
  };
} 