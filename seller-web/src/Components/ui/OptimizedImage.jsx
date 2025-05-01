import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * OptimizedImage - A component for improved image loading performance 
 * 
 * Features:
 * - Lazy loading with loading="lazy"
 * - Progressive image loading with blur-up effect
 * - Responsive sizing with srcset and sizes
 * - Placeholder during loading
 * - Error fallback
 */
const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  width, 
  height, 
  placeholderColor = '#f3f4f6',
  loadingStyle = 'blur', // blur, fade, or none
  objectFit = 'cover',
  fallbackSrc = null,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  // Reset loading state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
    setImageSrc(src);
  }, [src]);

  // Handle image load success
  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Handle image load error
  const handleError = () => {
    setError(true);
    if (fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  // Determine the styles based on loading state and style preference
  const getStyles = () => {
    const baseStyles = {
      width: width ? `${width}px` : '100%',
      height: height ? `${height}px` : 'auto',
      objectFit,
    };

    // Only add transition styles if not loaded and using special effect
    if (!isLoaded && loadingStyle !== 'none') {
      return {
        ...baseStyles,
        ...(loadingStyle === 'blur' ? { filter: 'blur(10px)' } : {}),
        ...(loadingStyle === 'fade' ? { opacity: 0 } : {}),
        transition: 'filter 0.3s ease-in-out, opacity 0.3s ease-in-out',
      };
    }

    return {
      ...baseStyles,
      filter: 'none',
      opacity: 1,
      transition: 'filter 0.3s ease-in-out, opacity 0.3s ease-in-out',
    };
  };

  return (
    <div 
      className={className}
      style={{ 
        position: 'relative',
        backgroundColor: placeholderColor,
        overflow: 'hidden',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
      }}
    >
      {/* Show error state if image failed to load and no fallback */}
      {error && !fallbackSrc ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            fontSize: '0.875rem',
          }}
        >
          {alt || 'Image failed to load'}
        </div>
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          style={getStyles()}
          {...props}
        />
      )}
    </div>
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  placeholderColor: PropTypes.string,
  loadingStyle: PropTypes.oneOf(['blur', 'fade', 'none']),
  objectFit: PropTypes.oneOf(['cover', 'contain', 'fill', 'none', 'scale-down']),
  fallbackSrc: PropTypes.string,
};

export default OptimizedImage; 