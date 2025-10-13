import { Mixpanel } from "mixpanel-react-native";

// Replace with your actual Mixpanel project token
// In production, this should be stored in an environment variable
const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || "";

// Initialize with tracking automatic events disabled by default
let mixpanelInstance: Mixpanel | null = null;

/**
 * Initialize the Mixpanel SDK
 * @param trackAutomaticEvents Whether to track automatic events (default: false)
 */
export const initializeMixpanel = (trackAutomaticEvents = false) => {
  try {
    // Create a new instance of Mixpanel
    mixpanelInstance = new Mixpanel(MIXPANEL_TOKEN, trackAutomaticEvents);

    // Initialize Mixpanel
    mixpanelInstance.init();

    // Enable debug logging in development
    if (__DEV__) {
      mixpanelInstance.setLoggingEnabled(true);
    }

    console.log("Mixpanel initialized");
  } catch (error) {
    console.error("Failed to initialize Mixpanel:", error);
  }
};

/**
 * Get the Mixpanel instance
 */
export const getMixpanel = () => {
  if (!mixpanelInstance) {
    console.warn("Mixpanel not initialized. Call initializeMixpanel first.");
  }
  return mixpanelInstance;
};

/**
 * Identify a user with Mixpanel
 * @param userId User ID to identify
 * @param properties Optional properties to associate with the user
 */
export const identifyUser = (
  userId: string,
  properties?: Record<string, any>,
) => {
  try {
    if (!mixpanelInstance) {
      console.warn("Mixpanel not initialized when trying to identify user");
      return;
    }

    console.log(`Attempting to identify user in Mixpanel: ${userId}`);

    // Identify the user
    mixpanelInstance.identify(userId);

    // Set user profile properties if provided
    if (properties && Object.keys(properties).length > 0) {
      mixpanelInstance.getPeople().set(properties);
    }

    // Force flush to ensure the identify event is sent immediately
    mixpanelInstance.flush();

    console.log(`User identified in Mixpanel: ${userId}`);
  } catch (error) {
    console.error("Failed to identify user in Mixpanel:", error);
  }
};

/**
 * Track an event in Mixpanel
 * @param eventName Name of the event to track
 * @param properties Optional properties to associate with the event
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>,
) => {
  try {
    if (!mixpanelInstance) {
      console.warn(
        `Mixpanel not initialized when trying to track event: ${eventName}`,
      );
      return;
    }
    //disable events logging for now
    // console.log(
    //   `Attempting to track event in Mixpanel: ${eventName}`,
    //   properties,
    // );

    // Make sure distinct_id is set before tracking events
    if (!mixpanelInstance.getDistinctId()) {
      console.warn(
        "No distinct ID set for Mixpanel. Events may not be attributed correctly.",
      );
    }

    // Ensure properties is an object
    const eventProperties = properties || {};

    // Track the event
    mixpanelInstance.track(eventName, eventProperties);

    // Force flush to ensure the event is sent immediately
    // This is especially important for critical events
    mixpanelInstance.flush();
    //disable events logging for now
    // console.log(`Event tracked in Mixpanel: ${eventName}`);
  } catch (error) {
    console.error(`Failed to track event ${eventName} in Mixpanel:`, error);
  }
};

/**
 * Track a screen view in Mixpanel
 * @param screenName Name of the screen to track
 * @param properties Optional properties to include with the screen view
 */
export const trackScreen = (
  screenName: string,
  properties?: Record<string, any>,
) => {
  try {
    if (!mixpanelInstance) {
      console.warn(
        `Mixpanel not initialized when trying to track screen: ${screenName}`,
      );
      return;
    }

    // Track screen view as an event with screen name
    const screenProps = { screen: screenName, ...(properties || {}) };
    mixpanelInstance.track("Screen View", screenProps);

    // Force flush to ensure the screen view is sent immediately
    mixpanelInstance.flush();

    console.log(`Screen tracked in Mixpanel: ${screenName}`);
  } catch (error) {
    console.error(`Failed to track screen in Mixpanel: ${screenName}`, error);
  }
};

/**
 * Set super properties that will be included with all subsequent track calls
 * @param properties Properties to set as super properties
 */
export const setSuperProperties = (properties: Record<string, any>) => {
  try {
    if (!mixpanelInstance) return;

    mixpanelInstance.registerSuperProperties(properties);
    console.log("Super properties set in Mixpanel");
  } catch (error) {
    console.error("Failed to set super properties in Mixpanel:", error);
  }
};

/**
 * Opt user out of tracking
 */
export const optOutTracking = () => {
  try {
    if (!mixpanelInstance) return;

    mixpanelInstance.optOutTracking();
    console.log("Opted out of Mixpanel tracking");
  } catch (error) {
    console.error("Failed to opt out of Mixpanel tracking:", error);
  }
};

/**
 * Opt user in to tracking
 */
export const optInTracking = () => {
  try {
    if (!mixpanelInstance) return;

    mixpanelInstance.optInTracking();
    console.log("Opted in to Mixpanel tracking");
  } catch (error) {
    console.error("Failed to opt in to Mixpanel tracking:", error);
  }
};

/**
 * Reset the current user's identity
 * Call this when user logs out
 */
export const resetUser = () => {
  try {
    if (!mixpanelInstance) return;

    mixpanelInstance.reset();
    console.log("Mixpanel user reset");
  } catch (error) {
    console.error("Failed to reset Mixpanel user:", error);
  }
};

/**
 * Set Mixpanel to use EU data residency
 */
export const setEUResidency = () => {
  try {
    if (!mixpanelInstance) return;

    mixpanelInstance.setServerURL("https://api-eu.mixpanel.com");
    console.log("Mixpanel set to EU server");
  } catch (error) {
    console.error("Failed to set Mixpanel EU residency:", error);
  }
};
