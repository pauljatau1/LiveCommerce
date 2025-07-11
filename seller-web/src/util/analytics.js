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
  const APP_STATE = import.meta.env.VITE_APP_STATE || 'development';
  if (APP_STATE !== 'production') {
    console.log(`Tracking event: ${eventName}`, properties);
    return;
  }

  // Don't proceed without an event name
  if (!eventName) {
    console.warn('trackEvent called without an event name');
    return;
  }
  
  try {
    // Ensure Mixpanel is initialized
    if (!mixpanelInstance) {
      await ensureInitialized();
    }
    
    // Mixpanel tracking (with enhanced safeguards)
    if (mixpanelInstance) {
      try {
        if (typeof mixpanelInstance.track === 'function') {
          mixpanelInstance.track(eventName, properties);
        }
      } catch (mpError) {
        console.error('Error tracking event with Mixpanel:', mpError);
        // Continue with other services
      }
    }
    
    // Customer.io tracking (with enhanced safeguards)
    if (window.cioanalytics) {
      try {
        if (typeof window.cioanalytics.track === 'function') {
          // Add small delay to allow identification to complete if recently called
          setTimeout(() => {
            window.cioanalytics.track(eventName, properties);
          }, 100);
        }
      } catch (cioError) {
        console.error('Error tracking event with Customer.io:', cioError);
      }
    }
  } catch (error) {
    console.error('Error tracking event:', error);
    // Fail silently in production to avoid breaking the app
  }
};

/**
 * Identify a user in Mixpanel
 * @param {string} userId - User ID
 * @param {Object} traits - User traits/properties for Mixpanel
 */
export const identifyUserMixpanel = async (userId, traits = {}) => {
  // Don't proceed with invalid userId
  if (!userId) {
    console.warn('identifyUserMixpanel called with invalid userId');
    return;
  }
  
  try {
    // Ensure services are initialized
    if (!mixpanelInstance) {
      await ensureInitialized();
    }
    
    // Mixpanel identify (with additional safeguards)
    if (mixpanelInstance) {
      try {
        if (typeof mixpanelInstance.identify === 'function') {
          mixpanelInstance.identify(userId);
        }
        
        if (mixpanelInstance.people && 
            typeof mixpanelInstance.people.set === 'function' && 
            mixpanelInstance.people.set !== undefined) {
          // Extra check for load_prop
          if (mixpanelInstance.people && 
              mixpanelInstance.people.__loaded !== false && 
              mixpanelInstance.people.load_prop === undefined) {
            // Create a dummy load_prop if missing to prevent errors
            mixpanelInstance.people.load_prop = () => {};
          }
          
          mixpanelInstance.people.set(traits);
        }
      } catch (mpError) {
        console.error('Error in Mixpanel identification:', mpError);
      }
    }
  } catch (error) {
    console.error('Error identifying user in Mixpanel:', error);
    // Fail silently in production
  }
};

/**
 * Identify a user in Customer.io
 * @param {string} userId - User ID
 * @param {Object} traits - User traits/properties for Customer.io
 */
export const identifyUserCustomerIO = async (userId, traits = {}) => {
  // Don't proceed with invalid userId
  if (!userId) {
    console.warn('identifyUserCustomerIO called with invalid userId');
    return;
  }
  
  try {
    // Ensure CustomerIO is initialized
    await initCustomerIO();
    
    // Customer.io identify (with safeguards)
    if (window.cioanalytics) {
      try {
        if (typeof window.cioanalytics.identify === 'function') {
          window.cioanalytics.identify(userId, traits);
        }
      } catch (cioError) {
        console.error('Error in Customer.io identification:', cioError);
      }
    }
  } catch (error) {
    console.error('Error identifying user in Customer.io:', error);
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
  identifyUserMixpanel,
  identifyUserCustomerIO,
  initAllAnalytics,
  ensureInitialized
}; 