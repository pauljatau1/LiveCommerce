/**
 * Analytics utility to dynamically load and initialize analytics tools
 * This approach reduces initial bundle size by only loading analytics 
 * libraries when they're needed and consent is given
 */

// Cache for loaded services
let mixpanelInstance = null;
let clarityInitialized = false;
let customerIOInitialized = false;

/**
 * Lazy load and initialize Mixpanel
 * @param {string} token - Mixpanel API token
 * @param {Object} options - Initialization options
 * @returns {Promise<any>} - The mixpanel instance
 */
export const initMixpanel = async (token, options = {}) => {
  if (mixpanelInstance) return mixpanelInstance;
  
  try {
    // Dynamically import mixpanel only when needed
    const mixpanel = await import('mixpanel-browser');
    
    const defaultOptions = {
      debug: false,
      track_pageview: true,
      persistence: "localStorage",
      autocapture: false, // Disable autocapture to reduce payload size
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    mixpanel.default.init(token, mergedOptions);
    mixpanelInstance = mixpanel.default;
    
    return mixpanelInstance;
  } catch (error) {
    console.error('Failed to initialize Mixpanel:', error);
    // Return a dummy implementation to prevent errors when called
    return createNoopAnalytics();
  }
};

/**
 * Initialize Microsoft Clarity
 * @param {Object} userData - Optional user data for identification
 * @returns {Promise<boolean>} - Success status
 */
export const initClarity = async (userData = null) => {
  if (clarityInitialized) return true;
  
  if (window.clarity && typeof window.clarity === 'function') {
    try {
      if (userData) {
        window.clarity('identify', userData.id, {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        });
      }
      clarityInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Clarity:', error);
      return false;
    }
  } else if (window.initClarity && typeof window.initClarity === 'function') {
    try {
      window.initClarity(userData || {});
      clarityInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Clarity:', error);
      return false;
    }
  }
  
  return false;
};

/**
 * Initialize Customer.io
 * @param {string} token - Customer.io site ID
 * @returns {Promise<any>} - The Customer.io instance
 */
export const initCustomerIO = async (token) => {
  if (customerIOInitialized && window.cioanalytics) return window.cioanalytics;
  
  try {
    if (window.cioanalytics) {
      window.cioanalytics.load(token);
      window.cioanalytics.page();
      customerIOInitialized = true;
      return window.cioanalytics;
    }
    return null;
  } catch (error) {
    console.error('Failed to initialize Customer.io:', error);
    return null;
  }
};

/**
 * Track an event across all available analytics platforms
 * @param {string} eventName - Name of the event to track
 * @param {Object} properties - Event properties
 */
export const trackEvent = async (eventName, properties = {}) => {
  try {
    // Mixpanel tracking
    if (mixpanelInstance) {
      mixpanelInstance.track(eventName, properties);
    }
    
    // Customer.io tracking
    if (window.cioanalytics) {
      window.cioanalytics.track(eventName, properties);
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

/**
 * Identify a user across all analytics platforms
 * @param {string} userId - User ID
 * @param {Object} traits - User traits/properties
 */
export const identifyUser = async (userId, traits = {}) => {
  try {
    // Mixpanel identify
    if (mixpanelInstance) {
      mixpanelInstance.identify(userId);
      mixpanelInstance.people.set(traits);
    }
    
    // Customer.io identify
    if (window.cioanalytics) {
      window.cioanalytics.identify(userId, traits);
    }
    
    // Clarity identify
    await initClarity({
      id: userId,
      ...traits
    });
  } catch (error) {
    console.error('Error identifying user:', error);
  }
};

/**
 * Create a no-op implementation to prevent errors when analytics fails to load
 * @returns {Object} - No-op implementation of analytics methods
 */
const createNoopAnalytics = () => {
  const noop = () => {};
  return {
    track: noop,
    identify: noop,
    people: {
      set: noop,
      increment: noop
    },
    init: noop,
    reset: noop
  };
};

/**
 * Initialize all analytics tools at once
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - Object containing all initialized analytics instances
 */
export const initAllAnalytics = async (options = {}) => {
  const {
    mixpanelToken = import.meta.env.VITE_MIXPANEL_TOKEN || "94b0cfbe14bc101f450403071cb7169d",
    customerIOToken = import.meta.env.VITE_CUSTOMER_IO_TOKEN || "403c9b971fd0501b68ee",
    userData = null
  } = options;
  
  const mixpanel = await initMixpanel(mixpanelToken, options.mixpanelOptions);
  const customerIO = await initCustomerIO(customerIOToken);
  const clarity = await initClarity(userData);
  
  return {
    mixpanel,
    customerIO,
    clarityInitialized: clarity
  };
};

// Export a default object for convenience
export default {
  initMixpanel,
  initClarity,
  initCustomerIO,
  trackEvent,
  identifyUser,
  initAllAnalytics
}; 