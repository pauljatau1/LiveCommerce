import { CioConfig, CustomerIO } from "customerio-reactnative";

// Replace these with your actual keys from Customer.io
// In production, these should be stored in environment variables
// For now, we're using constants - replace these with your actual values
const CDP_API_KEY = process.env.EXPO_PUBLIC_CDP_API_KEY; // Replace with your actual CDP API key
const SITE_ID = process.env.EXPO_PUBLIC_CIO_SITE_ID; // Replace with your actual site ID

/**
 * Initialize the Customer.io SDK
 */
export const initializeCustomerIO = () => {
  const config: CioConfig = {
    cdpApiKey: CDP_API_KEY || "",
    // Enable in-app messaging with site ID
    inApp: {
      siteId: SITE_ID || "",
    },
  };

  CustomerIO.initialize(config);
  console.log("CustomerIO initialized");
};

/**
 * Identify a user with Customer.io
 * @param userId User ID to identify
 * @param traits Optional traits to associate with the user
 */
export const identifyUser = (
  userId: string | undefined,
  traits?: Record<string, any>,
) => {
  CustomerIO.identify({
    userId,
    traits: traits || {},
  });
  console.log(`User identified: ${userId}`);
};

/**
 * Track a custom event
 * @param eventName Name of the event to track
 * @param properties Optional properties to include with the event
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>,
) => {
  CustomerIO.track(eventName, properties || {});
  //disable analytics logging for now
  // console.log(`Event tracked: ${eventName}`);
};

/**
 * Track screen views
 * @param screenName Name of the screen to track
 */
export const trackScreen = (
  screenName: string,
  properties?: Record<string, any>,
) => {
  CustomerIO.screen(screenName, properties || {});
  console.log(`Screen tracked: ${screenName}`);
};
