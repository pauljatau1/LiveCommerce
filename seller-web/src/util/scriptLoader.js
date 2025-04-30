/**
 * Utility for dynamically loading external scripts only when needed
 * This helps reduce initial bundle size and page load time
 */

// Track loaded scripts to avoid duplicate loading
const loadedScripts = new Map();

/**
 * Dynamically load an external script
 * @param {string} url - URL of the script to load
 * @param {Object} options - Additional options
 * @param {string} options.id - Optional ID for the script tag
 * @param {boolean} options.async - Load script asynchronously
 * @param {boolean} options.defer - Defer script loading
 * @param {Object} options.attributes - Additional attributes to add to the script tag
 * @returns {Promise<HTMLScriptElement>} - Promise resolving to the script element
 */
export const loadScript = (url, options = {}) => {
  // Return existing script if already loaded
  if (loadedScripts.has(url)) {
    return Promise.resolve(loadedScripts.get(url));
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    
    // Set script attributes
    if (options.id) script.id = options.id;
    if (options.async) script.async = true;
    if (options.defer) script.defer = true;
    
    // Add any custom attributes
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        script.setAttribute(key, value);
      });
    }
    
    // Handle script loading events
    script.onload = () => {
      loadedScripts.set(url, script);
      resolve(script);
    };
    
    script.onerror = () => {
      reject(new Error(`Failed to load script: ${url}`));
      // Clean up failed script
      document.head.removeChild(script);
    };
    
    // Add to document
    document.head.appendChild(script);
  });
};

/**
 * Load multiple scripts in parallel
 * @param {Array<string|Object>} scripts - Array of script URLs or config objects
 * @returns {Promise<Array<HTMLScriptElement>>} - Promise resolving to array of script elements
 */
export const loadScripts = (scripts) => {
  const promises = scripts.map(script => {
    if (typeof script === 'string') {
      return loadScript(script);
    }
    return loadScript(script.url, script.options);
  });
  
  return Promise.all(promises);
};

/**
 * Check if a specific script has been loaded
 * @param {string} url - URL of the script to check
 * @returns {boolean} - Whether the script is loaded
 */
export const isScriptLoaded = (url) => {
  return loadedScripts.has(url);
};

/**
 * Load a script only when it's needed based on a condition
 * @param {string} url - URL of the script to load
 * @param {Function} condition - Function that returns true if script should be loaded
 * @param {Object} options - Additional options for loadScript
 * @returns {Promise<HTMLScriptElement|null>} - Promise resolving to script element or null
 */
export const loadScriptConditionally = async (url, condition, options = {}) => {
  if (condition()) {
    return loadScript(url, options);
  }
  return null;
};

// Export default object for convenience
export default {
  loadScript,
  loadScripts,
  isScriptLoaded,
  loadScriptConditionally
}; 