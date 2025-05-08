/**
 * Analytics utility to dynamically load and initialize analytics tools
 * This approach reduces initial bundle size by only loading analytics 
 * libraries when they're needed and consent is given
 */

// Cache for loaded services
let mixpanelInstance = null;
let clarityInitialized = false;
let customerIOInitialized = false;
let isInitializing = false;
let initPromise = null;

// Default configuration
const DEFAULT_CONFIG = {
  mixpanelToken: import.meta.env.VITE_MIXPANEL_PROJECT_TOKEN, // Default token if not provided
  autoInit: true,
  debug: false
};

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
    mixpanel.default.init(token || DEFAULT_CONFIG.mixpanelToken, mergedOptions);
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
 * @returns {Promise<any>} - The Customer.io instance
 */
export const initCustomerIO = async () => {
  if (customerIOInitialized && window.cioanalytics) return window.cioanalytics;
  
  try {
    if (window.cioanalytics) {
      // The snippet already creates window.cioanalytics
      // Just mark as initialized if it exists
      customerIOInitialized = true;
      
      // Only call page() if it's a function
      if (typeof window.cioanalytics.page === 'function') {
        window.cioanalytics.page();
      }
      
      return window.cioanalytics;
    }
    return createNoopAnalytics();
  } catch (error) {
    console.error('Failed to initialize Customer.io:', error);
    return createNoopAnalytics();
  }
};

/**
 * Track an event across all available analytics platforms
 * @param {string} eventName - Name of the event to track
 * @param {Object} properties - Event properties
 */
export const trackEvent = async (eventName, properties = {}) => {
  try {
    // Ensure Mixpanel is initialized
    if (!mixpanelInstance) {
      await ensureInitialized();
    }
    
    // Mixpanel tracking (with safeguards)
    if (mixpanelInstance && typeof mixpanelInstance.track === 'function') {
      mixpanelInstance.track(eventName, properties);
    }
    
    // Customer.io tracking (with safeguards)
    if (window.cioanalytics && typeof window.cioanalytics.track === 'function') {
      window.cioanalytics.track(eventName, properties);
    }
  } catch (error) {
    console.error('Error tracking event:', error);
    // Fail silently in production to avoid breaking the app
  }
};

/**
 * Identify a user across all analytics platforms
 * @param {string} userId - User ID
 * @param {Object} traits - User traits/properties
 */
export const identifyUser = async (userId, traits = {}) => {
  try {
    // Ensure services are initialized
    if (!mixpanelInstance) {
      await ensureInitialized();
    }
    
    // Mixpanel identify (with safeguards)
    if (mixpanelInstance) {
      if (typeof mixpanelInstance.identify === 'function') {
        mixpanelInstance.identify(userId);
      }
      
      if (mixpanelInstance.people && typeof mixpanelInstance.people.set === 'function') {
        mixpanelInstance.people.set(traits);
      }
    }
    
    // Customer.io identify (with safeguards)
    if (window.cioanalytics && typeof window.cioanalytics.identify === 'function') {
      window.cioanalytics.identify(userId, traits);
    }
    
    // Clarity identify
    await initClarity({
      id: userId,
      ...traits
    });
  } catch (error) {
    console.error('Error identifying user:', error);
    // Fail silently in production
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
    reset: noop,
    load: noop,
    page: noop,
    user: noop
  };
};

/**
 * Ensures all analytics systems are initialized
 * Uses singleton pattern to prevent multiple simultaneous initializations
 */
export const ensureInitialized = async (options = {}) => {
  // If already initialized, return immediately
  if (mixpanelInstance) return { mixpanel: mixpanelInstance };
  
  // If initialization is in progress, wait for it to complete
  if (isInitializing && initPromise) {
    return initPromise;
  }
  
  // Set initialization flag and create promise
  isInitializing = true;
  initPromise = initAllAnalytics(options);
  
  try {
    const result = await initPromise;
    return result;
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
    return { 
      mixpanel: createNoopAnalytics(),
      customerIO: createNoopAnalytics(),
      clarityInitialized: false
    };
  } finally {
    isInitializing = false;
  }
};

/**
 * Initialize all analytics tools at once
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - Object containing all initialized analytics instances
 */
export const initAllAnalytics = async (options = {}) => {
  const {
    mixpanelToken = DEFAULT_CONFIG.mixpanelToken,
    userData = null,
    debug = DEFAULT_CONFIG.debug
  } = options;
  
  try {
    const mixpanel = await initMixpanel(mixpanelToken, { 
      debug,
      ...options.mixpanelOptions 
    });
    
    const customerIO = await initCustomerIO();
    const clarity = await initClarity(userData);
    
    return {
      mixpanel,
      customerIO,
      clarityInitialized: clarity
    };
  } catch (error) {
    console.error('Analytics initialization error:', error);
    return {
      mixpanel: createNoopAnalytics(),
      customerIO: createNoopAnalytics(),
      clarityInitialized: false
    };
  }
};

// Auto-initialize if configured
if (DEFAULT_CONFIG.autoInit) {
  ensureInitialized().catch(console.error);
}

// Export a default object for convenience
export default {
  initMixpanel,
  initClarity,
  initCustomerIO,
  trackEvent,
  identifyUser,
  initAllAnalytics,
  ensureInitialized
}; 