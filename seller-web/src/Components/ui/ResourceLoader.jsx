import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { loadScripts } from '../../util/scriptLoader';

/**
 * ResourceLoader component for deferred loading of external resources
 * This helps reduce initial bundle size and improves page load performance
 * by only loading resources when they're needed
 */
const ResourceLoader = ({
  resources = [],
  onLoad = () => {},
  onError = () => {},
  loadOnMount = true,
  condition = () => true,
  fallback = null,
  children,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loadResources = async () => {
    try {
      // Check if we should load resources based on the condition
      if (!condition()) {
        setIsLoaded(true);
        return;
      }

      // Load all provided resources
      await loadScripts(resources);
      setIsLoaded(true);
      onLoad();
    } catch (error) {
      console.error('Failed to load resources:', error);
      setHasError(true);
      onError(error);
    }
  };

  useEffect(() => {
    if (loadOnMount) {
      loadResources();
    }
  }, [loadOnMount]);

  // If there's an error and a fallback is provided, show the fallback
  if (hasError && fallback) {
    return fallback;
  }

  // If not yet loaded, show nothing or the fallback
  if (!isLoaded) {
    return fallback || null;
  }

  // Resources loaded successfully, render children
  return children;
};

ResourceLoader.propTypes = {
  resources: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        url: PropTypes.string.isRequired,
        options: PropTypes.object,
      }),
    ])
  ),
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  loadOnMount: PropTypes.bool,
  condition: PropTypes.func,
  fallback: PropTypes.node,
  children: PropTypes.node,
};

export default ResourceLoader; 